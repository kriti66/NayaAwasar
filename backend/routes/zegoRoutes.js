import express from 'express';
import { generateZegoToken } from '../controllers/zegoController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/token', requireAuth, generateZegoToken);

export default router;
