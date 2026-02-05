import express from 'express';
import {
    getPendingKYC,
    approveKYC,
    rejectKYC,
    approveKYCByUserId,
    rejectKYCByUserId
} from '../controllers/kycController.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = express.Router();

// All routes require admin (JWT + role === 'admin' via requireAdmin)
router.get('/pending', requireAdmin, getPendingKYC);
router.put('/approve/:kycId', requireAdmin, approveKYC);
router.put('/reject/:kycId', requireAdmin, rejectKYC);
router.patch('/:userId/approve', requireAdmin, approveKYCByUserId);
router.patch('/:userId/reject', requireAdmin, rejectKYCByUserId);

export default router;
