import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { requireAuth, requireAdmin, requireCompanyApproved, requireRecruiterKycApproved } from '../middleware/auth.js';
import * as promotionPaymentRequestController from '../controllers/promotionPaymentRequestController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const uploadDir = path.join(rootDir, 'uploads', 'promotion-payment-requests');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || '.jpg';
        cb(null, `promo-pay-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, WebP or PDF allowed for payment screenshot'), false);
};

const uploadScreenshot = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter
}).single('paymentScreenshot');

const router = express.Router();

router.post(
    '/',
    requireAuth,
    requireCompanyApproved,
    requireRecruiterKycApproved,
    (req, res, next) => {
        uploadScreenshot(req, res, (err) => {
            if (err) return res.status(400).json({ message: err.message || 'Upload failed' });
            next();
        });
    },
    promotionPaymentRequestController.submitPromotionPaymentRequest
);

router.get('/my', requireAuth, promotionPaymentRequestController.getMyPromotionPaymentRequests);

router.get(
    '/admin/pending',
    requireAuth,
    requireAdmin,
    promotionPaymentRequestController.adminListPendingPromotionPaymentRequests
);
router.patch(
    '/admin/:requestId/approve',
    requireAuth,
    requireAdmin,
    promotionPaymentRequestController.adminApprovePromotionPaymentRequest
);
router.patch(
    '/admin/:requestId/reject',
    requireAuth,
    requireAdmin,
    promotionPaymentRequestController.adminRejectPromotionPaymentRequest
);

export default router;
