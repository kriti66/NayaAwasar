import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { autoRegenerateCV } from '../controllers/cvController.js';
import { logActivity } from '../utils/activityLogger.js';
import {
    computeSeekerProfileMetrics,
    syncSeekerProfileScoresToUser
} from '../utils/seekerProfileScoring.js';

const router = express.Router();

// MULTER SETUP FOR AVATAR
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/avatars');
        // Ensure directory exists
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only images allowed'), false);
    }
});

// 1. GET PROFILE (GET /profile)
router.get('/profile', async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password').lean();
        if (!user) return res.status(404).json({ message: 'User not found' });
        const metrics = computeSeekerProfileMetrics(user);
        res.json({
            ...user,
            profileCompletion: metrics.profileCompletionPercent,
            profileStrength: metrics.overallStrength,
            profileMetrics: metrics
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// 2. UPDATE PROFILE (PUT /profile)
router.put('/profile', async (req, res) => {
    const {
        fullName, phoneNumber, location, bio, skills,
        professionalHeadline, linkedinUrl, portfolioUrl,
        workExperience, education, isPublic
    } = req.body;

    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Update fields if provided
        if (fullName !== undefined) user.fullName = fullName;
        if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
        if (location !== undefined) user.location = location;
        if (professionalHeadline !== undefined) user.professionalHeadline = professionalHeadline;
        if (linkedinUrl !== undefined) user.linkedinUrl = linkedinUrl;
        if (portfolioUrl !== undefined) user.portfolioUrl = portfolioUrl;
        if (workExperience !== undefined) user.workExperience = workExperience;
        if (education !== undefined) user.education = education;
        if (isPublic !== undefined) user.isPublic = isPublic;

        if (bio !== undefined) {
            if (bio.length > 500) return res.status(400).json({ message: 'Bio too long (max 500 chars)' });
            user.bio = bio;
        }
        if (skills !== undefined) user.skills = skills;

        syncSeekerProfileScoresToUser(user);

        // Auto-Verify logic (Example: 80% completion = Verified)
        if (user.profileCompletion >= 80 && user.profileStatus === 'Pending') {
            user.profileStatus = 'Verified';
        }

        await user.save();

        // Log profile update activity
        await logActivity(
            user._id,
            'PROFILE_UPDATED',
            `Profile updated.`,
            { userId: user._id }
        );

        const metrics = computeSeekerProfileMetrics(user.toObject());
        res.json({
            success: true,
            user: {
                ...user.toObject(),
                profileMetrics: metrics
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// 3. UPLOAD PROFILE IMAGE (PATCH /upload-profile-image)
router.patch('/upload-profile-image', (req, res, next) => {
    upload.single('profileImage')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: 'File too large. Max size is 2MB.' });
            }
            return res.status(400).json({ message: err.message });
        } else if (err) {
            // An unknown error occurred when uploading.
            return res.status(400).json({ message: err.message });
        }
        // Everything went fine.
        next();
    });
}, async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    try {
        // Construct the URL path relative to the server root
        // Assuming server serves /uploads from the root
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.profileImage = avatarUrl;
        syncSeekerProfileScoresToUser(user);

        await user.save();

        // Trigger CV regeneration if applicable
        autoRegenerateCV(user._id).catch(err => console.error("Auto-gen CV failed after image upload:", err));

        res.json({
            success: true,
            message: 'Profile image uploaded successfully',
            profileImage: avatarUrl
        });

        // Log profile image update activity
        await logActivity(
            user._id,
            'PROFILE_UPDATED',
            `Profile image updated.`,
            { userId: user._id }
        );
    } catch (error) {
        console.error("❌ Profile image upload error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// 4. Change Password (PUT /change-password)
router.put('/change-password', async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
    if (!strongPasswordRegex.test(newPassword)) {
        return res.status(400).json({
            message: 'New password must be at least 8 characters and include uppercase, lowercase, number, and special character'
        });
    }

    try {
        // Explicitly select password even if returned by default, per best practice/request
        const user = await User.findById(req.user.id).select('+password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.lastPasswordChange = new Date();

        await user.save();

        res.json({ message: 'Password updated successfully' });

        // Log password change activity
        await logActivity(
            user._id,
            'PASSWORD_CHANGED',
            `Password changed.`,
            { userId: user._id }
        );

    } catch (error) {
        console.error("Change password error:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

// 5. SECURITY (Optional activity)
router.get('/security', async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('lastPasswordChange createdAt updatedAt');
        res.json({
            lastPasswordChange: user.lastPasswordChange,
            memberSince: user.createdAt,
            lastUpdated: user.updatedAt
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
