import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import KYC from '../models/KYC.js';
import sendEmail from '../utils/sendEmail.js';
import { requireAuth, getJwtSecret } from '../middleware/auth.js';
import { logActivity } from '../utils/activityLogger.js';

const router = express.Router();


/** Normalize role for User schema (enum: jobseeker | recruiter | admin) */
const normalizeRole = (role) => {
    if (!role || role === 'job_seeker') return 'jobseeker';
    if (['jobseeker', 'recruiter', 'admin'].includes(role)) return role;
    return 'jobseeker';
};


// ----- Public routes -----

// Register (MongoDB User; JWT returned for stateless auth)
router.post('/register', async (req, res) => {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const userExists = await User.findOne({ email: email.toLowerCase().trim() });
        if (userExists) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            fullName: fullName.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role: normalizeRole(role),
            kycStatus: 'not_submitted',
            profileCompletion: 20
        });

        await user.save();

        // Log registration activity
        await logActivity('registration', `New user '${user.fullName}' registered.`, user._id);

        const token = jwt.sign(
            { id: user._id.toString(), role: user.role, isKycVerified: user.isKycVerified },
            getJwtSecret(),
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                kycStatus: user.kycStatus,
                isKycSubmitted: user.isKycSubmitted,
                isKycVerified: user.isKycVerified
            }
        });
    } catch (error) {
        console.error('Registration error:', error);

        let message = 'Server error';
        if (error.name === 'MongooseServerSelectionError' || error.message.includes('buffering timed out')) {
            message = 'Database connection failed. Please ensure your IP is whitelisted in MongoDB Atlas.';
        }

        res.status(500).json({
            message,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Login (MongoDB User; JWT with consistent user id for KYC/jobs/applications)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(401).json({ message: 'No account found with this email.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (user.isActive === false) {
            return res.status(403).json({ message: 'Your account has been deactivated by the administrator. Please contact support.' });
        }

        const token = jwt.sign(
            { id: user._id.toString(), role: user.role, isKycVerified: user.isKycVerified },
            getJwtSecret(),
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                kycStatus: user.kycStatus,
                isKycSubmitted: user.isKycSubmitted,
                isKycVerified: user.isKycVerified
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        let message = 'Server error';
        if (error.name === 'MongooseServerSelectionError' || error.message.includes('buffering timed out')) {
            message = 'Database connection failed. Please ensure your IP is whitelisted in MongoDB Atlas.';
        }
        res.status(500).json({ message });
    }
});

// ----- Protected: current user from MongoDB (single source of truth for JWT + KYC) -----
router.get('/me', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('fullName email role kycStatus isKycSubmitted isKycVerified kycRejectionReason kycCompletedAt')
            .lean();
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            kycStatus: user.kycStatus || 'not_submitted',
            isKycSubmitted: user.isKycSubmitted || false,
            isKycVerified: user.isKycVerified || false,
            kycRejectionReason: user.kycRejectionReason || null,
            kycCompletedAt: user.kycCompletedAt || null
        });
    } catch (error) {
        console.error('Auth me error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        console.log(`🔍 Received password reset link request (MongoDB) for: ${email}`);

        const user = await User.findOne({ email });
        if (!user) {
            console.warn(`⚠️ Reset link request failed: User not found for ${email}`);
            // Security: Don't reveal if email exists or not
            return res.json({ message: 'If that email exists, a reset link has been sent.' });
        }

        // Generate Token
        const token = crypto.randomBytes(20).toString('hex');
        const expires = Date.now() + 3600000; // 1 hour

        user.reset_password_token = token;
        user.reset_password_expires = expires;
        await user.save();

        console.log(`✅ Reset token generated for ${email}`);

        // Send Email using Utility
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetUrl = `${frontendUrl}/reset-password/${token}`;

        const message = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
                <p>Hello,</p>
                <p>You have requested a password reset. Please click the link below to verify your email and set a new password. This link is valid for <strong>1 hour</strong>.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="background-color: #4A90E2; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
                </div>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #4A90E2;">${resetUrl}</p>
                <p>If you didn't request this, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #777; text-align: center;">Naya Awasar - Find Your Opportunity</p>
            </div>
        `;

        try {
            await sendEmail({
                to: user.email,
                subject: 'Password Reset - Naya Awasar',
                text: message
            });
            console.log(`✅ Reset link email sent to ${email}`);
            res.json({ message: 'Password reset link has been sent to your email.' });
        } catch (mailError) {
            console.error("❌ Email send error:", mailError);
            // clear token if email fails
            user.reset_password_token = null;
            user.reset_password_expires = null;
            await user.save();

            return res.status(500).json({
                message: 'Failed to send reset email. Please try again later.',
                error: mailError.message
            });
        }

    } catch (error) {
        console.error("❌ Server error in forgot-password:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Reset Password
router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    try {
        const user = await User.findOne({
            reset_password_token: token,
            reset_password_expires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.reset_password_token = null;
        user.reset_password_expires = null;
        await user.save();

        res.json({ message: 'Password has been updated.' });

    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ message: 'Server error' });
    }
});



export default router;
