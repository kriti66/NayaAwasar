import Profile from '../models/Profile.js';
import { generateCV_PDF } from '../utils/cvGenerator.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to get Projects and Profile
const getProfileAndProjects = async (userId) => {
    const profile = await Profile.findOne({ userId: userId }).populate('userId', 'fullName email _id phoneNumber profileImage');
    if (!profile) return null;

    const { default: Project } = await import('../models/Project.js');
    const projects = await Project.find({ userId: userId });

    const profileData = profile.toObject();
    profileData.projects = projects;
    // Map userId to user for the cvGenerator template which expects profile.user
    profileData.user = profileData.userId;
    return { profile, profileData };
};

// Generate CV
export const generateCV = async (req, res) => {
    try {
        const userId = req.user.id;
        const data = await getProfileAndProjects(userId);
        if (!data) return res.status(404).json({ message: 'Profile not found' });
        const { profile, profileData } = data;

        const fileRelPath = await generateCV_PDF(profileData);

        // Update profile
        profile.resume = {
            fileUrl: fileRelPath,
            fileName: `${(profileData.user?.fullName || 'Jobseeker').replace(/\s+/g, '_')}_CV.pdf`,
            uploadedAt: new Date(),
            source: 'generated',
            lastGeneratedAt: new Date()
        };
        await profile.save();

        res.json({ success: true, resume: profile.resume });

    } catch (error) {
        console.error("CV Generation Error:", error);
        const errorMessage = error?.message || 'Failed to generate CV';
        const details = (error?.stack || error?.toString?.());

        // Dedicated log to understand the exact failing reason.
        try {
            const logPath = path.join(process.cwd(), 'cv_gen_debug.log');
            const payload = {
                timestamp: new Date().toISOString(),
                userId: req?.user?.id,
                message: errorMessage,
                stack: error?.stack || error?.toString?.()
            };
            fs.appendFileSync(logPath, JSON.stringify(payload) + '\n', 'utf8');
        } catch (logErr) {
            console.error('Failed writing cv_gen_debug.log:', logErr);
        }

        res.status(500).json({
            success: false,
            message: errorMessage,
            error: errorMessage,
            details
        });
    }
};

// View CV (Inline)
export const viewCV = async (req, res) => {
    try {
        const userId = req.user.id;
        const profile = await Profile.findOne({ userId: userId });

        if (!profile || !profile.resume || !profile.resume.fileUrl) {
            return res.status(404).json({ message: 'No CV found' });
        }

        // Remove leading slash to ensure clean relative join on Windows
        const normalizedFileUrl = profile.resume.fileUrl.startsWith('/') ? profile.resume.fileUrl.substring(1) : profile.resume.fileUrl;
        const filePath = path.join(__dirname, '..', normalizedFileUrl);
        
        if (fs.existsSync(filePath)) {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="${profile.resume.fileName}"`);
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);
        } else {
            res.status(404).json({ message: 'File not found on server' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error viewing CV' });
    }
};

// Download CV (Attachment)
export const downloadCV = async (req, res) => {
    try {
        const userId = req.user.id;
        const profile = await Profile.findOne({ userId: userId });

        if (!profile || !profile.resume || !profile.resume.fileUrl) {
            return res.status(404).json({ message: 'No CV found' });
        }

        const normalizedFileUrl = profile.resume.fileUrl.startsWith('/') ? profile.resume.fileUrl.substring(1) : profile.resume.fileUrl;
        const filePath = path.join(__dirname, '..', normalizedFileUrl);
        
        if (fs.existsSync(filePath)) {
            res.download(filePath, profile.resume.fileName);
        } else {
            res.status(404).json({ message: 'File not found on server' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Download error' });
    }
};

// Internal helper for auto-regeneration (not an API endpoint)
export const autoRegenerateCV = async (userId) => {
    try {
        // Check if profile has generated CV
        const profileCheck = await Profile.findOne({ userId: userId });
        if (profileCheck && profileCheck.resume && profileCheck.resume.source === 'generated') {
            const data = await getProfileAndProjects(userId);
            if (data) {
                const { profile, profileData } = data;
                const fileRelPath = await generateCV_PDF(profileData);

                profile.resume.fileUrl = fileRelPath;
                profile.resume.lastGeneratedAt = new Date();
                await profile.save();
                console.log(`CV auto-regenerated for user ${userId}`);
            }
        }
    } catch (e) {
        console.error("Auto CV Gen Error:", e);
    }
};
