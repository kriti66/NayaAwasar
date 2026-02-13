import express from 'express';
import { getZegoToken } from '../controllers/interviewController.js';
import { requireAuth } from '../middleware/auth.js'; // Assuming auth.js exports requireAuth

const router = express.Router();

// Define route
router.post('/:id/zego-token', requireAuth, getZegoToken);

export default router;
