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
import {
    getPendingRecruiterKycs,
    reviewRecruiterKyc
} from '../controllers/recruiterKycController.js';
import {
    promoteJob,
    removePromotion
} from '../controllers/promotedJobController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireAdmin);

router.get('/stats', getStats);
router.get('/activities', getActivityLogs);
router.get('/kyc/pending', getPendingKYC);
router.patch('/kyc/:userId/approve', approveKYCByUserId);
router.patch('/kyc/:userId/reject', rejectKYCByUserId);

// Recruiter KYC Review
router.get('/kyc/recruiter/pending', getPendingRecruiterKycs);
router.put('/kyc/recruiter/review/:kycId', reviewRecruiterKyc);

// Company Management
router.get('/companies', getAllCompanies);
router.get('/companies/:id', getCompanyDetails);
router.patch('/companies/:id/status', updateCompanyStatus);

// Job Advertisement Management
router.patch('/jobs/:id/promote', promoteJob);
router.patch('/jobs/:id/remove-promotion', removePromotion);

export default router;
