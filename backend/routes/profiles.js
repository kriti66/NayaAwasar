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

// Helper: Calculate Profile Strength
const calculateProfileStrength = (user) => {
    let score = 0;

    // Summary (Bio) -> 20%
    if (user.bio && user.bio.length > 20) score += 20;

    // Skills (>=5) -> 20%
    if (user.skills && user.skills.length >= 5) score += 20;
    else if (user.skills && user.skills.length > 0) score += 10; // Partial score

    // Experience -> 15%
    if (user.workExperience && user.workExperience.length > 0) score += 15;

    // Education -> 15%
    if (user.education && user.education.length > 0) score += 15;

    // Projects (>=2) -> 20%
    if (user.projects && user.projects.length >= 2) score += 20;
    else if (user.projects && user.projects.length > 0) score += 10; // Partial score

    // Resume Uploaded -> 10%
    if (user.resume && user.resume.fileUrl) score += 10;

    return Math.min(score, 100);
};

// Generic update helper
const updateProfileSection = async (req, res, updateData) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Apply updates
        Object.keys(updateData).forEach(key => {
            user[key] = updateData[key];
        });

        // Recalculate strength
        user.profileStrength = calculateProfileStrength(user);

        await user.save();
        res.json({ success: true, user, message: 'Profile updated successfully' });
    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
};

// Update Summary (Bio)
router.put('/summary', async (req, res) => {
    const { bio, professionalHeadline } = req.body;
    await updateProfileSection(req, res, { bio, professionalHeadline });
});

// Update Skills
router.put('/skills', async (req, res) => {
    const { skills } = req.body; // Expecting array of strings
    await updateProfileSection(req, res, { skills });
});

// Update Experience
router.put('/experience', async (req, res) => {
    const { experience } = req.body; // Expecting array
    await updateProfileSection(req, res, { workExperience: experience });
});

// Update Education
router.put('/education', async (req, res) => {
    const { education } = req.body; // Expecting array
    await updateProfileSection(req, res, { education });
});

// Update Projects
router.put('/projects', async (req, res) => {
    const { projects } = req.body; // Expecting array
    await updateProfileSection(req, res, { projects });
});

// Update Resume (URL only as per requirement)
router.put('/resume', async (req, res) => {
    const { fileUrl } = req.body;
    await updateProfileSection(req, res, {
        resume: {
            fileUrl,
            uploadedAt: new Date()
        },
        resume_url: fileUrl // Keep legacy field in sync
    });
});

// Update Job Preferences
router.put('/preferences', async (req, res) => {
    const { jobPreferences } = req.body;
    await updateProfileSection(req, res, { jobPreferences });
});

// Update Visibility
router.put('/visibility', async (req, res) => {
    const { isPublic } = req.body;
    await updateProfileSection(req, res, {
        profileVisibility: isPublic,
        isPublic: isPublic // Keep legacy field in sync
    });
});

// General Profile Update (Legacy support)
router.put('/', async (req, res) => {
    try {
        const updates = req.body;
        const allowedFields = [
            'fullName', 'professionalHeadline', 'bio',
            'phoneNumber', 'linkedinUrl', 'portfolioUrl',
            'workExperience', 'education', 'skills', 'isPublic',
            'projects', 'jobPreferences'
        ];

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                user[field] = updates[field];
            }
        });

        user.profileStrength = calculateProfileStrength(user);
        await user.save();

        res.json({ success: true, user, message: 'Profile updated successfully' });
    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ message: 'Error updating profile' });
    }
});

export default router;

