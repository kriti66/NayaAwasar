import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import KYC from '../models/KYC.js';
import sendEmail from '../utils/sendEmail.js';
import { requireAuth, getJwtSecret } from '../middleware/auth.js';
import { logActivity } from '../utils/activityLogger.js';
import { sendOtp, verifyOtp, resetPassword } from '../controllers/authController.js';

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
        await logActivity(
            user._id,
            'USER_REGISTERED',
            `New user '${user.fullName}' registered.`,
            { role: normalizeRole(role) }
        );

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
            .select('fullName email role kycStatus isKycSubmitted isKycVerified kycRejectionReason kycCompletedAt profileImage')
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
            kycCompletedAt: user.kycCompletedAt || null,
            profileImage: user.profileImage || null
        });
    } catch (error) {
        console.error('Auth me error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Forgot Password (OTP)
router.post('/forgot-password', sendOtp);

// Verify OTP
router.post('/verify-otp', verifyOtp);

// Reset Password (OTP)
router.post('/reset-password-otp', resetPassword);

export default router;
