import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import {
    submitContactMessage,
    getAllContactMessages,
    getContactMessageById,
    updateContactStatus,
    replyToContactMessage
} from '../controllers/contactController.js';

const router = express.Router();

/**
 * Contact Message Routes
 * 
 * POST   /api/contact           -> Public: Submit a contact message
 * GET    /api/contact           -> Admin: Get all contact messages
 * GET    /api/contact/:id       -> Admin: Get single contact message
 * PATCH  /api/contact/:id/status -> Admin: Update message status
 * POST   /api/contact/:id/reply -> Admin: Send reply email
 */

// Public route - no auth required
router.post('/', submitContactMessage);

// Admin-only routes - require auth + admin role
router.get('/', requireAuth, requireAdmin, getAllContactMessages);
router.get('/:id', requireAuth, requireAdmin, getContactMessageById);
router.patch('/:id/status', requireAuth, requireAdmin, updateContactStatus);
router.post('/:id/reply', requireAuth, requireAdmin, replyToContactMessage);

export default router;
