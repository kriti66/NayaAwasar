import {
    getRecommendedJobs,
    getRecommendationProviderFromSource,
    getSimilarJobs,
    hydrateSimilarJobsResponse
} from '../services/recommendationService.js';
import {
    applyUserJobLabels,
    loadSeekerRecommendationContext
} from '../services/userJobLabelEnrichment.js';

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
        const [recommendations, recCtx] = await Promise.all([
            getRecommendedJobs(userId, { limit }),
            loadSeekerRecommendationContext(userId)
        ]);
        const jobs = recommendations.jobs || [];
        const recommendationSource = recommendations.source ?? 'unknown';
        const recommendationProvider = getRecommendationProviderFromSource(recommendationSource);
        const showMatchScores =
            recCtx.kycVerified === true &&
            typeof recCtx.overallStrength === 'number' &&
            recCtx.overallStrength >= 40;
        const { hasPersonalizationData } = await applyUserJobLabels(userId, jobs, {
            recommendationProvider,
            overallStrength: recCtx.overallStrength,
            kycVerified: recCtx.kycVerified,
            professionCategories: recCtx.professionCategories
        });
        res.json({
            ...recommendations,
            jobs,
            hasPersonalizationData,
            recommendationMeta: {
                provider: recommendationProvider,
                source: recommendationSource,
                overallStrength: recCtx.overallStrength,
                kycVerified: recCtx.kycVerified,
                showMatchScores,
                professionCategories: recCtx.professionCategories
            }
        });
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
