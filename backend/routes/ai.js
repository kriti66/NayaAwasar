import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getRecommendedJobs } from '../services/recommendationService.js';

const router = express.Router();

/**
 * @route POST /api/ai/recommend
 * @access Private — same pipeline as /api/recommendations (recommendation-service + fallback).
 */
router.post('/recommend', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = Math.min(parseInt(req.body?.limit, 10) || 10, 50);
        const pack = await getRecommendedJobs(userId, { limit });
        res.json(pack);
    } catch (error) {
        console.error('[api/ai/recommend]', error);
        res.status(500).json({ message: 'Failed to fetch recommendations' });
    }
});

export default router;
