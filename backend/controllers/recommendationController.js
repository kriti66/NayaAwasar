import { getRecommendedJobs } from '../services/recommendationService.js';

export const getRecommendations = async (req, res) => {
    try {
        const userId = req.user.id;
        const recommendations = await getRecommendedJobs(userId);
        res.json(recommendations);
    } catch (error) {
        console.error('Recommendation Controller Error:', error);
        res.status(500).json({ message: 'Error fetching recommendations' });
    }
};
