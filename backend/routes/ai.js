import express from 'express';
import axios from 'axios';
import { requireAuth } from '../middleware/auth.js';
import Job from '../models/Job.js';

const router = express.Router();

// AI Service URL (from separate microservice)
const AI_SERVICE_URL = 'http://localhost:5002'; // Ensure this matches Flask port

/**
 * @desc Get Job Recommendations based on User Profile/Skills
 * @route POST /api/ai/recommend
 * @access Private
 */
router.post('/recommend', requireAuth, async (req, res) => {
    try {
        const { skills, preferences } = req.body;

        // If no skills provided in body, fallback to user profile skills if available
        let querySkills = skills;
        if (!querySkills && req.user && req.user.skills) {
            querySkills = Array.isArray(req.user.skills)
                ? req.user.skills.join(', ')
                : req.user.skills;
        }

        if (!querySkills) {
            return res.status(400).json({
                message: 'Please provide skills for recommendation or update your profile.'
            });
        }

        console.log(`🤖 Requesting AI recommendations for user: ${req.user._id}`);
        console.log(`📝 Skills: ${querySkills.substring(0, 50)}...`);

        // Forward to Flask Microservice
        try {
            const aiResponse = await axios.post(`${AI_SERVICE_URL}/recommend`, {
                skills: querySkills,
                preferences: preferences || {}
            });

            console.log(`✅ AI Service responded with ${aiResponse.data.count} jobs`);
            res.json(aiResponse.data);

        } catch (axiosError) {
            console.error('❌ AI Service Error:', axiosError.message);
            if (axiosError.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    message: 'AI Recommendation Service is currently unavailable. Please try again later.'
                });
            }
            res.status(500).json({
                message: 'Failed to fetch recommendations from AI service',
                error: axiosError.message
            });
        }

    } catch (error) {
        console.error('🔥 Server Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;
