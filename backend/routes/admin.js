import express from 'express';
import {
    getStats,
    getActivityLogs,
    getAllCompanies,
    getCompanyDetails,
    updateCompanyStatus
} from '../controllers/adminController.js';
import {
    getPendingKYC,
    approveKYCByUserId,
    rejectKYCByUserId
} from '../controllers/kycController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireAdmin);

router.get('/stats', getStats);
router.get('/activities', getActivityLogs);
router.get('/kyc/pending', getPendingKYC);
router.patch('/kyc/:userId/approve', approveKYCByUserId);
router.patch('/kyc/:userId/reject', rejectKYCByUserId);

// Company Management
router.get('/companies', getAllCompanies);
router.get('/companies/:id', getCompanyDetails);
router.patch('/companies/:id/status', updateCompanyStatus);

export default router;
