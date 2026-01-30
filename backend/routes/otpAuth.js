import express from 'express';
import { sendOtp, verifyOtp, resetPassword } from '../controllers/authController.js';

const router = express.Router();

/**
 * @route POST /api/otp-auth/send-otp
 * @desc Generate and send OTP to user email
 */
router.post('/send-otp', sendOtp);

/**
 * @route POST /api/otp-auth/verify-otp
 * @desc Verify OTP provided by user
 */
router.post('/verify-otp', verifyOtp);

/**
 * @route POST /api/otp-auth/reset-password
 * @desc Reset password using OTP
 */
router.post('/reset-password', resetPassword);

export default router;
