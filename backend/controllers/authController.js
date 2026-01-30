import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import sendEmail from '../utils/sendEmail.js';

// Generate a secure 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// 1. SEND OTP
export const sendOtp = async (req, res) => {
    const { email } = req.body;

    try {
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found with this email." });
        }

        // Generate and hash OTP
        const otp = generateOTP();
        const hashedOtp = await bcrypt.hash(otp, 10);
        const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

        // Store hashed OTP and expiry
        user.resetOtp = hashedOtp;
        user.resetOtpExpiry = expiry;
        await user.save();

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

        await sendEmail({
            to: user.email,
            subject: 'Your Password Reset OTP',
            text: emailContent
        });

        res.status(200).json({ success: true, message: "OTP sent to your email." });

    } catch (error) {
        console.error("Error in sendOtp:", error);
        res.status(500).json({ success: false, message: "Server error while sending OTP." });
    }
};

// 2. VERIFY OTP
export const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
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
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
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
