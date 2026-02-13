import Profile from '../models/Profile.js';
import User from '../models/User.js'; // To sync some fields/check existence
import Activity from '../models/Activity.js'; // For public view logging
import { calculateProfileStrength } from '../utils/profileStrength.js';
import { logUserActivity } from '../utils/userActivityLogger.js';
import { logActivity } from '../utils/activityLogger.js';
import { autoRegenerateCV } from './cvController.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Helper to ensure profile exists
const getOrCreateProfile = async (userId) => {
    let profile = await Profile.findOne({ userId });
    if (!profile) {
        // Create empty profile
        profile = await Profile.create({ userId });
    }
    return profile;
};

// 1. GET /api/profile/me
export const getMyProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const profile = await getOrCreateProfile(userId);

        // Also fetch user basic info (name, email, etc.)
        const user = await User.findById(userId).select('fullName email role isKycVerified professionalHeadline bio location skills workExperience education resume jobPreferences projects profileImage');

        if (!user) {
            return res.status(404).json({ message: 'User account not found' });
        }

        const { score, label, tips } = calculateProfileStrength(profile);

        // Recalculate strength if it changed (optimization: only save if diff)
        if (profile.profileStrength !== score) {
            profile.profileStrength = score;
            await profile.save();
        }

        res.json({
            ...profile.toObject(),
            // Merge User fields ensuring we have name/email
            user: {
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                isKycVerified: user.isKycVerified,
                profileImage: user.profileImage
            },
            strengthLabel: label,
            tips
        });
    } catch (error) {
        console.error("Get Profile Error:", error);
        res.status(500).json({ message: 'Server error fetching profile' });
    }
};

// 2. PATCH /api/profile/me
export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const updates = req.body;
        const allowed = ['headline', 'summary', 'location', 'visibleToRecruiters', 'jobPreferences'];

        const profile = await getOrCreateProfile(userId);

        Object.keys(updates).forEach(key => {
            if (allowed.includes(key)) {
                profile[key] = updates[key];
            }
        });

        // Recompute strength
        const { score } = calculateProfileStrength(profile);
        profile.profileStrength = score;

        await profile.save();

        // Auto-regenerate CV if needed
        autoRegenerateCV(userId).catch(err => console.error("BG CV update failed", err));

        // Log Profile Update
        await logActivity(req.user.id, req.user.role, 'PROFILE_UPDATED', 'User profile updated.', 'Profile', profile._id);

        const { createNotification } = await import('./notificationController.js');
        await createNotification({
            recipient: req.user.id,
            type: 'system', // or 'profile_update' if added to enum, but 'system' works
            title: 'Profile Updated',
            message: 'You successfully updated your profile.',
            link: '/profile',
            sender: req.user.id
        });

        res.json(profile);

    } catch (error) {
        res.status(500).json({ message: 'Error updating profile' });
    }
};

// PATCH /api/profile/me/visibility
export const updateVisibility = async (req, res) => {
    try {
        const { visible } = req.body;
        const profile = await getOrCreateProfile(req.user.id);
        profile.visibleToRecruiters = visible;
        await profile.save();
        res.json({ visible: profile.visibleToRecruiters });
    } catch (error) {
        res.status(500).json({ message: 'Error updating visibility' });
    }
};

// POST /api/profile/me/skills
export const updateSkills = async (req, res) => {
    try {
        const { skills } = req.body; // Array of strings
        if (!Array.isArray(skills)) return res.status(400).json({ message: 'Skills must be an array' });

        const profile = await getOrCreateProfile(req.user.id);
        // Normalize: trim, unique, take first 50
        const uniqueSkills = [...new Set(skills.map(s => s.trim()).filter(Boolean))].slice(0, 50);

        profile.skills = uniqueSkills;

        const { score } = calculateProfileStrength(profile);
        profile.profileStrength = score;

        await profile.save();
        if (profile.resume && profile.resume.source === 'generated') {
            autoRegenerateCV(req.user.id).catch(e => console.error(e));
        }
        res.json(profile.skills);

    } catch (error) {
        res.status(500).json({ message: 'Error updating skills' });
    }
};

// EXPERIENCES
export const addExperience = async (req, res) => {
    try {
        const profile = await getOrCreateProfile(req.user.id);
        profile.experience.push(req.body);

        const { score } = calculateProfileStrength(profile);
        profile.profileStrength = score;

        await profile.save();
        res.json(profile.experience);
    } catch (error) {
        res.status(500).json({ message: 'Error adding experience' });
    }
};

export const updateExperience = async (req, res) => {
    try {
        const { id } = req.params;
        const profile = await getOrCreateProfile(req.user.id);
        const item = profile.experience.id(id);
        if (!item) return res.status(404).json({ message: 'Experience not found' });

        Object.assign(item, req.body);

        const { score } = calculateProfileStrength(profile);
        profile.profileStrength = score;

        await profile.save();
        res.json(profile.experience);
    } catch (error) {
        res.status(500).json({ message: 'Error updating experience' });
    }
};

export const deleteExperience = async (req, res) => {
    try {
        const { id } = req.params;
        const profile = await getOrCreateProfile(req.user.id);
        profile.experience.pull(id);

        const { score } = calculateProfileStrength(profile);
        profile.profileStrength = score;

        await profile.save();
        res.json(profile.experience);
    } catch (error) {
        res.status(500).json({ message: 'Error deleting experience' });
    }
};

// EDUCATION
export const addEducation = async (req, res) => {
    try {
        const profile = await getOrCreateProfile(req.user.id);
        profile.education.push(req.body);

        const { score } = calculateProfileStrength(profile);
        profile.profileStrength = score;

        await profile.save();
        res.json(profile.education);
    } catch (error) {
        res.status(500).json({ message: 'Error adding education' });
    }
};

export const updateEducation = async (req, res) => {
    try {
        const { id } = req.params;
        const profile = await getOrCreateProfile(req.user.id);
        const item = profile.education.id(id);
        if (!item) return res.status(404).json({ message: 'Education not found' });

        Object.assign(item, req.body);

        const { score } = calculateProfileStrength(profile);
        profile.profileStrength = score;

        await profile.save();
        res.json(profile.education);
    } catch (error) {
        res.status(500).json({ message: 'Error updating education' });
    }
};

export const deleteEducation = async (req, res) => {
    try {
        const { id } = req.params;
        const profile = await getOrCreateProfile(req.user.id);
        profile.education.pull(id);

        const { score } = calculateProfileStrength(profile);
        profile.profileStrength = score;

        await profile.save();
        res.json(profile.education);
    } catch (error) {
        res.status(500).json({ message: 'Error deleting education' });
    }
};

// RESUME
export const uploadResume = async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    try {
        const profile = await getOrCreateProfile(req.user.id);

        profile.resume = {
            fileUrl: `/uploads/resumes/${req.file.filename}`,
            fileName: req.file.originalname,
            uploadedAt: new Date()
        };

        const { score } = calculateProfileStrength(profile);
        profile.profileStrength = score;

        await profile.save();
        res.json(profile.resume);
    } catch (error) {
        console.error('Resume upload error:', error);
        res.status(500).json({ message: 'Error uploading resume' });
    }
};

export const getResume = async (req, res) => {
    try {
        const profile = await getOrCreateProfile(req.user.id);
        res.json(profile.resume);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching resume' });
    }
};

export const deleteResume = async (req, res) => {
    try {
        const profile = await getOrCreateProfile(req.user.id);
        profile.resume = undefined; // or { fileUrl: '', ... }

        const { score } = calculateProfileStrength(profile);
        profile.profileStrength = score;

        await profile.save();
        res.json({ message: 'Resume deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting resume' });
    }
};

// DOWNLOAD RESUME FILE
// GET /api/profile/me/resume/download
export const downloadResume = async (req, res) => {
    try {
        const profile = await getOrCreateProfile(req.user.id);
        if (!profile || !profile.resume || !profile.resume.fileUrl) {
            return res.status(404).json({ message: 'No resume found' });
        }

        const relPath = profile.resume.fileUrl.startsWith('/')
            ? profile.resume.fileUrl.slice(1)
            : profile.resume.fileUrl;

        const filePath = path.join(__dirname, '..', relPath);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'Resume file not found on server' });
        }

        const fileName = profile.resume.fileName || 'resume.pdf';
        return res.download(filePath, fileName);
    } catch (error) {
        console.error('Download resume error:', error);
        res.status(500).json({ message: 'Error downloading resume' });
    }
};

// PUBLIC PROFILE (Recruiter View)
export const getPublicProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const profile = await Profile.findOne({ userId }).populate('userId', 'fullName role isKycVerified professionalHeadline bio location');

        if (!profile) return res.status(404).json({ message: 'Profile not found' });
        if (!profile.visibleToRecruiters) return res.status(404).json({ message: 'Profile is private' });

        // Log functionality for recruiter view
        // req.user is the recruiter
        if (req.user && req.user.role === 'recruiter') {
            await logActivity(
                userId,
                'RECRUITER_VIEW',
                'A recruiter viewed your profile',
                { recruiterId: req.user.id }
            );
        }

        // Return sanitized
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching public profile' });
    }
};
