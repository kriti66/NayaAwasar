import axios from 'axios';
import User from '../models/User.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import Profile from '../models/Profile.js'; // Import Profile to check for skills

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5002';

export const getRecommendedJobs = async (userId) => {
    try {
        const getLatestJobs = async () => {
            const jobs = await Job.find({ status: 'Active', application_deadline: { $gte: new Date() } })
                .sort({ createdAt: -1 })
                .limit(5)
                .select('title description requirements company_name location salary_range type createdAt posted_date company_logo');

            return {
                jobs: jobs.map(j => ({ ...j.toObject(), matchScore: 0, matchReason: 'Latest job posting' })),
                isAIRecommended: false
            };
        };

        try {
            // Call the new AI microservice endpoints which handles MongoDB fetching natively
            const response = await axios.post(`${AI_SERVICE_URL}/recommend-jobs/${userId}`);
            
            if (response.data.error || !response.data.jobs || response.data.jobs.length === 0) {
                console.log('AI Service returned no jobs or error. Falling back to latest jobs.', response.data.error || 'No jobs');
                return await getLatestJobs();
            }

            // Extract job IDs from the AI response
            const aiJobs = response.data.jobs;
            const jobIds = aiJobs.map(job => job.job_id);

            // Fetch full job documents from MongoDB using those IDs
            const jobDocuments = await Job.find({ _id: { $in: jobIds } });

            // Merge AI match scores and explanations with full job documents
            // Preserve the order returned by AI service (highest score first)
            const resultJobs = aiJobs.map(aiJob => {
                const doc = jobDocuments.find(j => j._id.toString() === aiJob.job_id);
                if (!doc) return null;
                return {
                    ...doc.toObject(),
                    matchScore: aiJob.match_score,
                    matchReason: aiJob.explanation,
                    matchedSkills: aiJob.matched_skills,
                    missingSkills: aiJob.missing_skills
                };
            }).filter(Boolean);

            if (resultJobs.length === 0) {
                return await getLatestJobs();
            }

            return {
                jobs: resultJobs,
                isAIRecommended: true
            };

        } catch (aiError) {
            console.error('AI Service Error or Connection Refused:', aiError.message);
            return await getLatestJobs();
        }

    } catch (error) {
        console.error('Recommendation Service Error:', error);
        throw error;
    }
};
