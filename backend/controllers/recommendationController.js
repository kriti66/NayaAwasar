import {
    getRecommendedJobs,
    getSimilarJobs,
    hydrateSimilarJobsResponse
} from '../services/recommendationService.js';
import { applyUserJobLabels } from '../services/userJobLabelEnrichment.js';

export const getRecommendations = async (req, res) => {
    try {
        const role = req.user.role;
        if (role !== 'jobseeker' && role !== 'job_seeker') {
            return res
                .status(403)
                .json({ message: 'Recommendations are only available for job seekers.' });
        }
        const userId = req.user.id;
        const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
        const recommendations = await getRecommendedJobs(userId, { limit });
        const jobs = recommendations.jobs || [];
        const { hasPersonalizationData } = await applyUserJobLabels(userId, jobs);
        res.json({ ...recommendations, jobs, hasPersonalizationData });
    } catch (error) {
        console.error('Recommendation Controller Error:', error);
        res.status(500).json({ message: 'Error fetching recommendations' });
    }
};

export const getSimilarJobsForJob = async (req, res) => {
    try {
        const { id } = req.params;
        const limit = Math.min(parseInt(req.query.limit, 10) || 5, 20);
        const raw = await getSimilarJobs(id, limit);
        const body = await hydrateSimilarJobsResponse({ ...raw, job_id: id });
        res.json(body);
    } catch (error) {
        console.error('Similar jobs controller error:', error);
        res.status(500).json({ message: 'Error fetching similar jobs' });
    }
};
