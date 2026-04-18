import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import sendEmail from '../utils/sendEmail.js';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../middleware/auth.js';
import { logActivity } from '../utils/activityLogger.js';
import { syncSeekerProfileScoresToUser } from '../utils/seekerProfileScoring.js';
import PendingSignup from '../models/PendingSignup.js';
import { cleanupDeletedUser } from '../services/cleanupDeletedUser.js';

// Generate a secure 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const normalizeRole = (role) => {
    if (!role || role === 'job_seeker') return 'jobseeker';
    if (['jobseeker', 'recruiter', 'admin'].includes(role)) return role;
    return 'jobseeker';
};

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

const buildSignupOtpEmailHtml = (fullName, otp) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">Verify your email</h2>
        <p>Hi <strong>${fullName}</strong>,</p>
        <p>Use this OTP to complete your Naya Awasar registration. This OTP is valid for <strong>10 minutes</strong>.</p>
        <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4A90E2; background: #f4f4f4; padding: 10px 20px; border-radius: 5px;">${otp}</span>
        </div>
        <p>If you did not start this registration, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #777; text-align: center;">Naya Awasar - Find Your Opportunity</p>
    </div>
`;

export const sendSignupOTP = async (req, res) => {
    const { fullName, email, password, role } = req.body;

    if (!fullName?.trim() || !email?.trim() || !password) {
        return res.status(400).json({ success: false, message: 'Full name, email and password are required.' });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }
    if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    try {
        const normalizedEmail = email.toLowerCase().trim();
        const normalizedRole = normalizeRole(role);

        const existingUser = await User.findOne({ email: normalizedEmail }).select('_id isDeleted isRemoved').lean();
        if (existingUser && !existingUser.isDeleted && !existingUser.isRemoved) {
            return res.status(409).json({ success: false, message: 'Email already exists.' });
        }

        const otp = generateOTP();
        const [passwordHash, otpHash] = await Promise.all([
            bcrypt.hash(password, 10),
            bcrypt.hash(otp, 10)
        ]);
        const now = Date.now();
        const otpExpiresAt = new Date(now + OTP_TTL_MS);
        const resendAvailableAt = new Date(now + RESEND_COOLDOWN_MS);
        const expiresAt = new Date(now + 24 * 60 * 60 * 1000);

        await PendingSignup.findOneAndUpdate(
            { email: normalizedEmail },
            {
                $set: {
                    fullName: fullName.trim(),
                    email: normalizedEmail,
                    passwordHash,
                    role: normalizedRole,
                    otpHash,
                    otpExpiresAt,
                    attempts: 0,
                    resendAvailableAt,
                    expiresAt
                }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        try {
            await sendEmail({
                to: normalizedEmail,
                subject: 'Your Signup OTP - Naya Awasar',
                html: buildSignupOtpEmailHtml(fullName.trim(), otp)
            });
        } catch (mailError) {
            const isConfigError =
                /missing|credentials|sender identity|email_from|resend_from|resend_api_key|unauthorized|forbidden|domain/i
                    .test(String(mailError?.message || ''));
            return res.status(isConfigError ? 502 : 500).json({
                success: false,
                message: isConfigError
                    ? 'Email service is not configured correctly in deployment environment.'
                    : 'Failed to send signup OTP. Please try again.',
                error: mailError.message
            });
        }

        return res.status(200).json({
            success: true,
            message: 'OTP sent to your email. Please verify to create account.',
            email: normalizedEmail,
            resendAvailableIn: Math.floor(RESEND_COOLDOWN_MS / 1000)
        });
    } catch (error) {
        console.error('sendSignupOTP error:', error);
        return res.status(500).json({ success: false, message: 'Failed to send signup OTP.' });
    }
};

export const verifySignupOTP = async (req, res) => {
    const { email, otp } = req.body;

    if (!email?.trim() || !otp?.trim()) {
        return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
    }

    try {
        const normalizedEmail = email.toLowerCase().trim();
        const pending = await PendingSignup.findOne({ email: normalizedEmail });
        if (!pending) {
            return res.status(404).json({ success: false, message: 'No pending signup found. Please start registration again.' });
        }

        if (pending.otpExpiresAt < new Date()) {
            return res.status(400).json({ success: false, message: 'OTP expired. Please resend OTP.' });
        }

        if ((pending.attempts || 0) >= MAX_OTP_ATTEMPTS) {
            return res.status(429).json({ success: false, message: 'Too many wrong attempts. Please resend OTP.' });
        }

        const isMatch = await bcrypt.compare(otp.trim(), pending.otpHash);
        if (!isMatch) {
            pending.attempts = (pending.attempts || 0) + 1;
            await pending.save();
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP.',
                attemptsLeft: Math.max(0, MAX_OTP_ATTEMPTS - pending.attempts)
            });
        }

        const activeUser = await User.findOne({ email: normalizedEmail });
        if (activeUser && !activeUser.isDeleted && !activeUser.isRemoved) {
            await PendingSignup.deleteOne({ _id: pending._id });
            return res.status(409).json({ success: false, message: 'Email already exists. Please login.' });
        }

        const oldUser = await User.findOne({
            email: normalizedEmail,
            $or: [{ isDeleted: true }, { isRemoved: true }]
        });
        if (oldUser) {
            await cleanupDeletedUser(oldUser._id);
        }

        const user = new User({
            fullName: pending.fullName,
            email: pending.email,
            password: pending.passwordHash,
            role: normalizeRole(pending.role),
            kycStatus: 'not_submitted'
        });
        syncSeekerProfileScoresToUser(user);
        await user.save();

        await PendingSignup.deleteOne({ _id: pending._id });

        await logActivity(user._id, 'USER_REGISTERED', `New user '${user.fullName}' registered.`, {
            role: user.role,
            via: 'signup_otp',
            replacedDeletedAccount: Boolean(oldUser)
        });

        return res.status(201).json({
            success: true,
            message: 'Account created successfully. Please login.'
        });
    } catch (error) {
        console.error('verifySignupOTP error:', error);
        return res.status(500).json({ success: false, message: 'Failed to verify signup OTP.' });
    }
};

export const resendSignupOTP = async (req, res) => {
    const { email } = req.body;
    if (!email?.trim()) {
        return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    try {
        const normalizedEmail = email.toLowerCase().trim();
        const pending = await PendingSignup.findOne({ email: normalizedEmail });
        if (!pending) {
            return res.status(404).json({ success: false, message: 'No pending signup found. Please register again.' });
        }

        const now = Date.now();
        const waitMs = new Date(pending.resendAvailableAt).getTime() - now;
        if (waitMs > 0) {
            return res.status(429).json({
                success: false,
                message: 'Please wait before requesting another OTP.',
                resendAvailableIn: Math.ceil(waitMs / 1000)
            });
        }

        const otp = generateOTP();
        pending.otpHash = await bcrypt.hash(otp, 10);
        pending.otpExpiresAt = new Date(now + OTP_TTL_MS);
        pending.resendAvailableAt = new Date(now + RESEND_COOLDOWN_MS);
        pending.attempts = 0;
        pending.expiresAt = new Date(now + 24 * 60 * 60 * 1000);
        await pending.save();

        try {
            await sendEmail({
                to: pending.email,
                subject: 'Your Signup OTP - Naya Awasar',
                html: buildSignupOtpEmailHtml(pending.fullName, otp)
            });
        } catch (mailError) {
            const isConfigError =
                /missing|credentials|sender identity|email_from|resend_from|resend_api_key|unauthorized|forbidden|domain/i
                    .test(String(mailError?.message || ''));
            return res.status(isConfigError ? 502 : 500).json({
                success: false,
                message: isConfigError
                    ? 'Email service is not configured correctly in deployment environment.'
                    : 'Failed to resend signup OTP. Please try again.',
                error: mailError.message
            });
        }

        return res.status(200).json({
            success: true,
            message: 'OTP resent successfully.',
            resendAvailableIn: Math.floor(RESEND_COOLDOWN_MS / 1000)
        });
    } catch (error) {
        console.error('resendSignupOTP error:', error);
        return res.status(500).json({ success: false, message: 'Failed to resend OTP.' });
    }
};

// 1. SEND OTP
export const sendOtp = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required." });
    }

    try {
        console.log(`🔍 Received OTP request for: ${email}`);

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            console.warn(`⚠️ OTP request failed: User not found for ${email}`);
            return res.status(404).json({ success: false, message: "User not found with this email." });
        }
        if (user.isDeleted || user.isRemoved) {
            return res.status(403).json({
                success: false,
                message:
                    'This account has been removed. Register again with the same email to create a new account, or contact support.'
            });
        }
        if (user.isSuspended) {
            return res.status(403).json({
                success: false,
                message: 'This account has been suspended. Please contact support.'
            });
        }

        // Generate and hash OTP
        const otp = generateOTP();
        const hashedOtp = await bcrypt.hash(otp, 10);
        const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

        // Store hashed OTP and expiry
        user.resetOtp = hashedOtp;
        user.resetOtpExpiry = expiry;
        await user.save();

        console.log(`✅ OTP generated and saved for ${email}`);

        // Send OTP via email
        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #333; text-align: center;">Password Reset OTP</h2>
                <p>Hello,</p>
                <p>You requested to reset your password. Use the OTP below to proceed. This OTP is valid for <strong>5 minutes</strong>.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4A90E2; background: #f4f4f4; padding: 10px 20px; border-radius: 5px;">${otp}</span>
                </div>
                <p>If you did not request this, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #777; text-align: center;">Naya Awasar - Find Your Opportunity</p>
            </div>
        `;

        try {
            await sendEmail({
                to: user.email,
                subject: 'Your Password Reset OTP - Naya Awasar',
                text: emailContent
            });
            console.log(`✅ Reset OTP email sent to ${email}`);
            res.status(200).json({ success: true, message: "OTP sent to your email successfully." });
        } catch (mailError) {
            console.error("❌ Failed to send OTP email:", mailError);
            const isConfigError =
                /missing|credentials|sender identity|email_from|resend_from|resend_api_key/i.test(String(mailError?.message || ''));
            res.status(500).json({
                success: false,
                message: isConfigError
                    ? "Email service is not configured correctly in deployment environment."
                    : "Failed to send reset email. Please try again.",
                error: mailError.message
            });
        }

    } catch (error) {
        console.error("❌ Error in sendOtp controller:", error);
        res.status(500).json({ success: false, message: "Internal server error while processing OTP request." });
    }
};

// 2. VERIFY OTP
export const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email: String(email).toLowerCase().trim() });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }
        if (user.isDeleted || user.isRemoved) {
            return res.status(403).json({ success: false, message: 'This account has been removed.' });
        }
        if (user.isSuspended) {
            return res.status(403).json({ success: false, message: 'This account has been suspended. Please contact support.' });
        }

        // Check if OTP exists and is not expired
        if (!user.resetOtp || !user.resetOtpExpiry || user.resetOtpExpiry < new Date()) {
            return res.status(400).json({ success: false, message: "OTP has expired or is invalid." });
        }

        // Compare OTP with hashed value
        const isMatch = await bcrypt.compare(otp, user.resetOtp);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid OTP." });
        }

        res.status(200).json({ success: true, message: "OTP verified successfully. You can now reset your password." });

    } catch (error) {
        console.error("Error in verifyOtp:", error);
        res.status(500).json({ success: false, message: "Server error during OTP verification." });
    }
};

// 3. RESET PASSWORD
export const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    try {
        const user = await User.findOne({ email: String(email).toLowerCase().trim() });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }
        if (user.isDeleted || user.isRemoved) {
            return res.status(403).json({ success: false, message: 'This account has been removed.' });
        }
        if (user.isSuspended) {
            return res.status(403).json({ success: false, message: 'This account has been suspended. Please contact support.' });
        }

        // Verify again to ensure security (or check a "verified" flag in session/token)
        if (!user.resetOtp || user.resetOtpExpiry < new Date()) {
            return res.status(400).json({ success: false, message: "Session expired. Please request a new OTP." });
        }

        const isMatch = await bcrypt.compare(otp, user.resetOtp);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "OTP verification failed." });
        }

        // Hash new password and save
        user.password = await bcrypt.hash(newPassword, 10);

        // Clear OTP fields
        user.resetOtp = null;
        user.resetOtpExpiry = null;
        await user.save();

        res.status(200).json({ success: true, message: "Password reset successful. You can now login with your new password." });

    } catch (error) {
        console.error("Error in resetPassword:", error);
        res.status(500).json({ success: false, message: "Server error during password reset." });
    }
};

function looksLikeJwtIdToken(t) {
    return typeof t === 'string' && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(t.trim());
}

// 4. GOOGLE LOGIN
export const googleLogin = async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: "Google token is required." });

    const clientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
    if (!clientId) {
        console.error('Google login: GOOGLE_CLIENT_ID is missing (check backend/.env)');
        return res.status(503).json({ success: false, message: 'Google sign-in is not configured on the server.' });
    }

    try {
        const client = new OAuth2Client(clientId);
        let sub;
        let email;
        let name;
        let picture;

        if (looksLikeJwtIdToken(token)) {
            const ticket = await client.verifyIdToken({
                idToken: token.trim(),
                audience: clientId
            });
            const payload = ticket.getPayload();
            sub = payload.sub;
            email = payload.email;
            name = payload.name;
            picture = payload.picture;
        } else {
            // @react-oauth/google useGoogleLogin returns an OAuth 2.0 access_token (not a JWT id_token).
            const info = await client.getTokenInfo(token.trim());
            const aud = String(info.audience || info.aud || '').trim();
            if (aud && aud !== clientId) {
                return res.status(401).json({ success: false, message: 'Invalid Google token.' });
            }
            const { data } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${token.trim()}` }
            });
            sub = data.sub;
            email = data.email;
            name = data.name;
            picture = data.picture;
        }

        if (!email) {
            return res.status(400).json({ success: false, message: 'Google did not return an email for this account.' });
        }

        let user = await User.findOne({ email: email.toLowerCase().trim() });

        if (user) {
            if (user.isDeleted || user.isRemoved) {
                return res.status(403).json({
                    success: false,
                    message:
                        'This account has been removed. Use email registration with the same address to create a new account, or contact support.'
                });
            }
            if (user.isSuspended) {
                return res.status(403).json({
                    success: false,
                    message: 'This account has been suspended. Please contact support.'
                });
            }
            if (user.isActive === false) {
                return res.status(403).json({
                    success: false,
                    message: 'Your account has been deactivated by the administrator. Please contact support.'
                });
            }
            if (user.role === 'admin') {
                return res.status(403).json({ success: false, message: "Admin accounts cannot login via social providers." });
            }
            if (!user.providerId) {
                user.provider = 'google';
                user.providerId = sub;
                if (!user.profileImage && picture) {
                    user.profileImage = picture;
                }
                user.isVerified = true;
                await user.save();
            }
        } else {
            user = new User({
                fullName: (name || email.split('@')[0] || 'User').trim(),
                email: email.toLowerCase().trim(),
                provider: 'google',
                providerId: sub,
                role: 'jobseeker',
                kycStatus: 'not_submitted',
                profileImage: picture || '',
                isVerified: true
            });
            syncSeekerProfileScoresToUser(user);
            await user.save();

            await logActivity(
                user._id,
                'USER_REGISTERED',
                `New user '${user.fullName}' registered via Google.`,
                { role: 'jobseeker', provider: 'google' }
            );
        }

        const jwtToken = jwt.sign(
            { id: user._id.toString(), role: user.role, isKycVerified: user.isKycVerified },
            getJwtSecret(),
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.status(200).json({
            success: true,
            message: "Login successful",
            token: jwtToken,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                kycStatus: user.kycStatus,
                isKycSubmitted: user.isKycSubmitted,
                isKycVerified: user.isKycVerified,
                profileImage: user.profileImage
            }
        });
    } catch (error) {
        console.error("Error in Google Login:", error);
        res.status(500).json({ success: false, message: "Failed to authenticate with Google." });
    }
};

// 5. FACEBOOK LOGIN
export const facebookLogin = async (req, res) => {
    const { accessToken } = req.body;
    if (!accessToken) return res.status(400).json({ success: false, message: "Facebook access token is required." });

    try {
        const { data } = await axios.get(`https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${accessToken}`);

        const { id, name, email } = data;
        const picture = data.picture?.data?.url;

        if (!email) {
            return res.status(400).json({ success: false, message: "Facebook login requires email permission. Please try again and accept email access." });
        }

        let user = await User.findOne({ email: email.toLowerCase().trim() });

        if (user) {
            if (user.isDeleted || user.isRemoved) {
                return res.status(403).json({
                    success: false,
                    message:
                        'This account has been removed. Use email registration with the same address to create a new account, or contact support.'
                });
            }
            if (user.isSuspended) {
                return res.status(403).json({
                    success: false,
                    message: 'This account has been suspended. Please contact support.'
                });
            }
            if (user.isActive === false) {
                return res.status(403).json({
                    success: false,
                    message: 'Your account has been deactivated by the administrator. Please contact support.'
                });
            }
            if (user.role === 'admin') {
                return res.status(403).json({ success: false, message: "Admin accounts cannot login via social providers." });
            }
            if (!user.providerId) {
                user.provider = 'facebook';
                user.providerId = id;
                if (!user.profileImage && picture) {
                    user.profileImage = picture;
                }
                user.isVerified = true;
                await user.save();
            }
        } else {
            user = new User({
                fullName: name.trim(),
                email: email.toLowerCase().trim(),
                provider: 'facebook',
                providerId: id,
                role: 'jobseeker',
                kycStatus: 'not_submitted',
                profileImage: picture || '',
                isVerified: true
            });
            syncSeekerProfileScoresToUser(user);
            await user.save();

            await logActivity(
                user._id,
                'USER_REGISTERED',
                `New user '${user.fullName}' registered via Facebook.`,
                { role: 'jobseeker', provider: 'facebook' }
            );
        }

        const jwtToken = jwt.sign(
            { id: user._id.toString(), role: user.role, isKycVerified: user.isKycVerified },
            getJwtSecret(),
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.status(200).json({
            success: true,
            message: "Login successful",
            token: jwtToken,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                kycStatus: user.kycStatus,
                isKycSubmitted: user.isKycSubmitted,
                isKycVerified: user.isKycVerified,
                profileImage: user.profileImage
            }
        });
    } catch (error) {
        console.error("Error in Facebook Login:", error);
        res.status(500).json({ success: false, message: "Failed to authenticate with Facebook." });
    }
};
