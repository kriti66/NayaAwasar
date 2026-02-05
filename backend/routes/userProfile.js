import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// MULTER SETUP FOR AVATAR
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/avatars');
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

// Helper: Calculate Completion %
const calculateCompletion = (user) => {
    let score = 0;
    if (user.fullName) score += 10;
    if (user.email) score += 10;
    if (user.phoneNumber) score += 10;
    if (user.location) score += 10;
    if (user.bio) score += 10;
    if (user.profileImage) score += 10;
    if (user.professionalHeadline) score += 10;
    if (user.linkedinUrl || user.portfolioUrl) score += 10;
    if (user.workExperience && user.workExperience.length > 0) score += 10;
    if (user.education && user.education.length > 0) score += 10;

    return Math.min(score, 100);
};

// 1. GET PROFILE (GET /profile)
router.get('/profile', async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
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

        // Recalculate completion
        user.profileCompletion = calculateCompletion(user);

        // Auto-Verify logic (Example: 80% completion = Verified)
        if (user.profileCompletion >= 80 && user.profileStatus === 'Pending') {
            user.profileStatus = 'Verified';
        }

        await user.save();
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// 3. UPLOAD PROFILE IMAGE (PUT /profile-image)
router.put('/profile-image', upload.single('profileImage'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    try {
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        const user = await User.findById(req.user.id);

        user.profileImage = avatarUrl;
        user.profileCompletion = calculateCompletion(user);

        await user.save();
        res.json({ success: true, profileImage: avatarUrl });
    } catch (error) {
        console.error("❌ Profile image upload error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// 4. CHANGE PASSWORD
router.put('/change-password', async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.user.id);
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Incorrect current password' });

        user.password = await bcrypt.hash(newPassword, 10);
        user.lastPasswordChange = new Date();
        await user.save();

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
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

// 4. Change Password (PUT /change-password)
router.put('/change-password', async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'All fields are required' });
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

        await user.save();

        res.json({ message: 'Password updated successfully' });

    } catch (error) {
        console.error("Change password error:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
