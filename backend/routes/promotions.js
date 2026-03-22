import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { requireAuth, requireAdmin, requireCompanyApproved, requireRecruiterKycApproved } from '../middleware/auth.js';
import * as promotionController from '../controllers/promotionController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const promotionsDir = path.join(rootDir, 'uploads', 'promotions');

if (!fs.existsSync(promotionsDir)) {
    fs.mkdirSync(promotionsDir, { recursive: true });
}

const receiptStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, promotionsDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || '.jpg';
        cb(null, `receipt-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    }
});

const receiptFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, WebP or PDF allowed for receipt'), false);
};

const uploadReceipt = multer({
    storage: receiptStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: receiptFilter
}).single('receiptImage');

const router = express.Router();

// Public
router.get('/pricing', promotionController.getPricing);

// Company/Recruiter - require auth + company approved + recruiter KYC
router.post('/request', requireAuth, requireCompanyApproved, requireRecruiterKycApproved, promotionController.requestPromotion);
router.get('/company/my-promotions', requireAuth, promotionController.getMyPromotions);
router.get('/company/summary', requireAuth, promotionController.getPromotionSummary);
router.post('/:promotionId/submit-payment', requireAuth, (req, res, next) => {
    uploadReceipt(req, res, (err) => {
        if (err) return res.status(400).json({ message: err.message || 'Upload failed' });
        next();
    });
}, promotionController.submitPayment);

// Admin
router.get('/admin/all', requireAuth, requireAdmin, promotionController.adminGetAllPromotions);
router.patch('/admin/:promotionId/approve', requireAuth, requireAdmin, promotionController.adminApprovePromotion);
router.patch('/admin/:promotionId/reject', requireAuth, requireAdmin, promotionController.adminRejectPromotion);
router.patch('/admin/:promotionId/expire', requireAuth, requireAdmin, promotionController.adminExpirePromotion);
router.get('/admin/payments', requireAuth, requireAdmin, promotionController.adminGetPayments);
router.patch('/admin/payments/:paymentId/approve', requireAuth, requireAdmin, promotionController.adminApprovePayment);
router.patch('/admin/payments/:paymentId/reject', requireAuth, requireAdmin, promotionController.adminRejectPayment);

export default router;
