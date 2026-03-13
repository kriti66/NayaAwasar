import express from 'express';
import { getRecommendations } from '../controllers/recommendationController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, getRecommendations);

export default router;
