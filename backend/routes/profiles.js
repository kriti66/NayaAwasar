import express from 'express';
import User from '../models/User.js';
import { logActivity } from '../utils/activityLogger.js';

const router = express.Router();

// Get My Profile
router.get('/', async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password').lean();
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        console.error("Fetch profile error:", error);
        res.status(500).json({ message: 'Error fetching profile' });
    }
});

// Get specific user profile (public/preview)
router.get('/user/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select('-password -resetOtp -resetOtpExpiry').lean();
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        console.error("Fetch user profile error:", error);
        res.status(500).json({ message: 'Error fetching user profile' });
    }
});

// Update Profile
router.put('/', async (req, res) => {
    try {
        const { id } = req.user;
        const updates = req.body;

        // Fields allowed to be updated
        const allowedFields = [
            'fullName', 'professionalHeadline', 'bio',
            'phoneNumber', 'linkedinUrl', 'portfolioUrl',
            'workExperience', 'education', 'skills', 'isPublic'
        ];

        const updateData = {};
        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                updateData[field] = updates[field];
            }
        });

        const user = await User.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) return res.status(404).json({ message: 'User not found' });

        // Log profile update activity
        await logActivity('user_updated', 'User profile updated.', id);

        res.json({ success: true, user, message: 'Profile updated successfully' });
    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
});

export default router;

