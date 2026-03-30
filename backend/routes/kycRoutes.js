import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getIdentityKycStatus, submitIdentityKyc } from '../controllers/kycController.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '..', 'uploads', 'kyc-identity');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'application/pdf']);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const safeName = file.originalname.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '');
        cb(null, `${file.fieldname}-${Date.now()}-${safeName}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!allowedMimeTypes.has(file.mimetype)) {
            const err = new Error('INVALID_FILE_TYPE');
            return cb(err);
        }
        return cb(null, true);
    }
});

router.get('/status', getIdentityKycStatus);

router.post(
    '/submit',
    upload.fields([
        { name: 'frontDoc', maxCount: 1 },
        { name: 'backDoc', maxCount: 1 },
        { name: 'selfie', maxCount: 1 }
    ]),
    submitIdentityKyc
);

export default router;
