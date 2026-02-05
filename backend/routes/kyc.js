import express from 'express';
import { submitKYC, getKYCStatus } from '../controllers/kycController.js';

const router = express.Router();

// User KYC routes (authenticated users only - auth middleware applied in server.js)
router.post('/submit', submitKYC);
router.get('/status', getKYCStatus);

export default router;
