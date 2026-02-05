import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Profile from '../models/Profile.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const router = express.Router();

// Ensure upload directories exist using absolute paths
const uploadBaseDir = path.join(rootDir, 'uploads');
const uploadDirs = [
    uploadBaseDir,
    path.join(uploadBaseDir, 'avatars'),
    path.join(uploadBaseDir, 'cvs'),
    path.join(uploadBaseDir, 'kyc')
];

uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        console.log(`Creating directory: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        try {
            let targetSubdir = 'kyc';
            if (file.fieldname === 'avatar') targetSubdir = 'avatars';
            else if (file.fieldname === 'cv') targetSubdir = 'cvs';

            const dest = path.join(uploadBaseDir, targetSubdir);
            // double check existence just in case
            if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

            cb(null, dest);
        } catch (error) {
            console.error("Multer destination error:", error);
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Allowed MIME types for KYC and profile uploads (secure file upload)
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
const allowedDocTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

const kycImageOnlyFields = ['avatar', 'selfieWithId', 'selfie', 'companyLogo'];
const kycImageOrPdfFields = ['documentFront', 'documentBack', 'idFront', 'idBack', 'registrationDocument', 'taxDocument'];

const fileFilter = (req, file, cb) => {
    const name = file.fieldname;
    const isImage = allowedImageTypes.includes(file.mimetype);
    const isDoc = allowedDocTypes.includes(file.mimetype);

    if (name === 'avatar' || kycImageOnlyFields.includes(name)) {
        return isImage ? cb(null, true) : cb(new Error('Use JPEG, PNG, or WebP for ' + name), false);
    }
    if (name === 'cv' || kycImageOrPdfFields.includes(name)) {
        return (isDoc || isImage) ? cb(null, true) : cb(new Error('Use PDF or image for ' + name), false);
    }
    cb(null, true);
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for KYC
    fileFilter: fileFilter
});

// Custom middleware to handle multer errors for KYC
router.post('/kyc', (req, res) => {
    console.log("📥 Received KYC upload request. Files count:", req.headers['content-length']);
    upload.any()(req, res, (err) => {
        if (err) {
            console.error("Multer/Upload error during KYC:", err);
            if (err instanceof multer.MulterError) {
                return res.status(400).json({ message: `Upload error: ${err.message}` });
            }
            return res.status(400).json({ message: err.message || 'Error uploading files' });
        }

        if (!req.files || req.files.length === 0) {
            console.warn("⚠️ KYC Upload: No files found in request");
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const fileUrls = {};
        req.files.forEach(file => {
            // Store path relative to the uploads folder or as a full URL path
            // The frontend expects paths like /uploads/kyc/...
            const relativePath = path.relative(rootDir, file.path).replace(/\\/g, '/');
            fileUrls[file.fieldname] = `/${relativePath}`;
        });

        console.log("✅ KYC files uploaded successfully:", Object.keys(fileUrls));

        res.json({
            success: true,
            message: 'KYC files uploaded successfully',
            files: fileUrls
        });
    });
});

import User from '../models/User.js';

// Route to upload CV
router.post('/cv', upload.single('cv'), async (req, res) => {
    console.log("📥 Received CV upload request");
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const { user } = req;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const cvUrl = `/uploads/cvs/${req.file.filename}`;

    try {
        await User.findByIdAndUpdate(
            user.id,
            { resume_url: cvUrl },
            { new: true }
        );
        res.json({ success: true, message: 'CV uploaded successfully', url: cvUrl });
    } catch (error) {
        console.error("CV upload error:", error);
        res.status(500).json({ message: 'Error updating user profile' });
    }
});

// Route to upload Profile Picture
router.post('/avatar', upload.single('avatar'), async (req, res) => {
    console.log("📥 Received Avatar upload request");
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

    const { user } = req;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    try {
        await User.findByIdAndUpdate(
            user.id,
            { profileImage: avatarUrl },
            { new: true }
        );
        res.json({ success: true, message: 'Profile picture updated successfully', url: avatarUrl });
    } catch (error) {
        console.error("Avatar upload error:", error);
        res.status(500).json({ message: 'Error updating user profile' });
    }
});


export default router;
