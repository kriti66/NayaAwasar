import express from 'express';
import multer from 'multer';
import { getIdentityKycStatus, submitIdentityKyc } from '../controllers/kycController.js';

const router = express.Router();

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'application/pdf']);

const upload = multer({
    storage: multer.memoryStorage(),
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
