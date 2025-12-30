import express from 'express';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/cvs');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Filter for PDF/Doc
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'application/msword' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});

// Route to upload CV
router.post('/cv', upload.single('cv'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const { user } = req; // Provided by auth middleware in server.js
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const cvUrl = `/uploads/${req.file.filename}`;
    const db = req.app.locals.db;

    try {
        // Upsert profile
        const existingProfile = await db.get('SELECT user_id FROM profiles WHERE user_id = ?', [user.id]);
        if (existingProfile) {
            await db.run('UPDATE profiles SET resume_url = ? WHERE user_id = ?', [cvUrl, user.id]);
        } else {
            await db.run('INSERT INTO profiles (user_id, resume_url) VALUES (?, ?)', [user.id, cvUrl]);
        }

        res.json({ success: true, message: 'CV uploaded successfully', url: cvUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating profile' });
    }
});

export default router;
