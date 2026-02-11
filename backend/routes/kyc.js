import express from 'express';
import { submitKYC, getKYCStatus } from '../controllers/kycController.js';
import { submitRecruiterKyc, getRecruiterKycStatus } from '../controllers/recruiterKycController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// User KYC routes (authenticated users only)
// Existing Seeker KYC
router.post('/submit', requireAuth, submitKYC);
router.get('/status', requireAuth, getKYCStatus);

// Recruiter KYC routes
router.post('/recruiter/submit', requireAuth, submitRecruiterKyc);
router.get('/recruiter/status', requireAuth, getRecruiterKycStatus);

export default router;
