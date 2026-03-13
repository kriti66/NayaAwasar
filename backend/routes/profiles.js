import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
    getMyProfile,
    updateProfile,
    updateVisibility,
    updateSkills,
    addExperience,
    updateExperience,
    deleteExperience,
    addEducation,
    updateEducation,
    deleteEducation,
    uploadResume,
    getResume,
    deleteResume,
    getPublicProfile

} from '../controllers/profileController.js';
import { generateCV, downloadCV, viewCV } from '../controllers/cvController.js';


import { requireRole, requireAuth } from '../middleware/auth.js'; // Assuming you have or can add this, or checking role manually

const router = express.Router();

// Multer Config
const uploadDir = 'uploads/resumes';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, DOC, DOCX allowed.'));
        }
    }
});

// Routes
// /api/profile/me
router.get('/me', getMyProfile);

router.patch('/me', updateProfile);

// Visibility
router.patch('/me/visibility', updateVisibility);

// Skills
router.post('/me/skills', updateSkills);

// Experience
router.post('/me/experience', addExperience);
router.patch('/me/experience/:id', updateExperience);
router.delete('/me/experience/:id', deleteExperience);

// Education
router.post('/me/education', addEducation);
router.patch('/me/education/:id', updateEducation);
router.delete('/me/education/:id', deleteEducation);

// Resume/CV Management
router.post('/me/resume', upload.single('resume'), uploadResume);
router.get('/me/resume', getResume);
router.delete('/me/resume', deleteResume);

// CV Generation
// CV Generation
router.post('/generate-cv', generateCV);



router.get('/cv/download', requireAuth, downloadCV);
router.get('/cv/view', requireAuth, viewCV);


// Public Profile (Recruiter View)
router.get('/:userId/public', requireRole('recruiter', 'admin'), getPublicProfile);


export default router;
