import Job from '../models/Job.js';
import Profile from '../models/Profile.js';
import Application from '../models/Application.js';
import { preprocessText, computeTF, computeIDF, computeTFIDF, cosineSimilarity } from '../utils/recommendationEngine.js';

export const getRecommendedJobs = async (userId) => {
    try {
        // 1. Fetch user profile
        const userProfile = await Profile.findOne({ userId }).lean();
        if (!userProfile) {
            return { jobs: [], message: 'Profile incomplete. Please add skills to get recommendations.', isComplete: false };
        }

        // 2. Fetch applied jobs to exclude them
        const applications = await Application.find({ seeker_id: userId }).select('job_id').lean();
        const appliedJobIds = new Set(applications.map(app => app.job_id.toString()));

        // 3. Fetch all active/open jobs
        // In a very large scale app, you'd add pagination or pre-filtering. Fine for FYP.
        const activeJobs = await Job.find({ 
            status: 'Active', 
            // Only include non-expired jobs (if deadline exists, must be in future)
            $or: [
                { application_deadline: { $exists: false } },
                { application_deadline: { $gte: new Date() } }
            ]
        })
            .populate('company_id', 'name logo location')
            .lean();

        // If no active jobs, return early
        if (!activeJobs.length) return { jobs: [], message: 'No active jobs available right now.', isComplete: true };

        // 4. Combine user profile text for content-based matching
        const userTextContent = [
            userProfile.headline || '',
            userProfile.summary || '',
            (userProfile.skills || []).join(' '),
            // Map experience roles
            ...(userProfile.experience || []).map(exp => `${exp.role} ${exp.description || ''}`),
            // Map education degrees
            ...(userProfile.education || []).map(edu => edu.degree),
            // Preferences
            userProfile.location || '',
            userProfile.jobPreferences?.preferredLocation || '',
            (userProfile.jobPreferences?.jobTypes || []).join(' '),
            userProfile.jobPreferences?.seniority || ''
        ].join(' ');

        const userTokens = preprocessText(userTextContent);
        const userSkills = (userProfile.skills || []).map(s => s.toLowerCase());
        const userPreferredLocation = (userProfile.location || userProfile.jobPreferences?.preferredLocation || '').toLowerCase();
        const userExperienceLevel = (userProfile.jobPreferences?.seniority || '').toLowerCase();

        // 5. Build corpus and TF-IDF vectors
        // Job document texts
        const jobsDocsTokens = activeJobs.map(job => {
            const jobTextContent = [
                job.title || '',
                job.job_title || '',
                job.type || '',
                job.description || '',
                job.job_description || '',
                job.requirements || '',
                job.location || '',
                job.experience_level || ''
            ].join(' ');
            return preprocessText(jobTextContent);
        });

        // Add user profile to corpus to generate unified IDF
        const corpusTokens = [...jobsDocsTokens, userTokens];
        
        // Generate vocabulary
        const vocabulary = [...new Set(corpusTokens.flat())];
        const idf = computeIDF(corpusTokens);
        const userTf = computeTF(userTokens);
        const userVector = computeTFIDF(userTf, idf, vocabulary);

        // 6. Score each job
        const scoredJobs = [];

        activeJobs.forEach((job, index) => {
            // Check if already applied
            if (appliedJobIds.has(job._id.toString())) return;

            // A) TF-IDF Content Similarity (Textual Match) -> 0.0 to 1.0 -> 50% weight
            const jobTokens = jobsDocsTokens[index];
            const jobTf = computeTF(jobTokens);
            const jobVector = computeTFIDF(jobTf, idf, vocabulary);
            
            const textSimScore = cosineSimilarity(userVector, jobVector);
            const contentScore = textSimScore * 0.50; // max 0.50

            // B) Rule-based Weighting: Skills (Title/Description keyword match) -> 20% weight
            let skillsScore = 0;
            const matchedSkills = [];
            const missingSkills = [];
            
            // Convert job text heavily into array of words for skill matching
            const jobWordsRaw = (job.title + ' ' + job.requirements + ' ' + (job.job_description || '')).toLowerCase();
            
            if (userSkills.length > 0) {
                userSkills.forEach(skill => {
                    if (jobWordsRaw.includes(skill)) {
                        matchedSkills.push(skill);
                    } else {
                        missingSkills.push(skill);
                    }
                });
                skillsScore = (matchedSkills.length / userSkills.length) * 0.20; // max 0.20
            }

            // C) Rule-based Weighting: Location -> 15% weight
            let locationScore = 0;
            const jobLoc = (job.location || '').toLowerCase();
            if (userPreferredLocation && jobLoc && (userPreferredLocation.includes(jobLoc) || jobLoc.includes(userPreferredLocation))) {
                locationScore = 0.15; // max 0.15
            }

            // D) Rule-based Weighting: Experience Level -> 15% weight
            let experienceScore = 0;
            const jobExp = (job.experience_level || '').toLowerCase();
            if (userExperienceLevel && jobExp && (userExperienceLevel.includes(jobExp) || jobExp.includes(userExperienceLevel))) {
                experienceScore = 0.15; // max 0.15
            }

            // Calculate final probability (0 to 100 final percentage scale)
            const finalScoreRaw = contentScore + skillsScore + locationScore + experienceScore;
            const finalPercentage = Math.round(finalScoreRaw * 100);

            // Generate an explanation/reason for Viva clarity
            let explanation = '';
            if (matchedSkills.length > 0) {
                explanation = `Matches your skills: ${matchedSkills.slice(0, 3).join(', ')}. `;
            } else if (textSimScore > 0.1) {
                explanation = `Content matches your profile summary. `;
            } else {
                explanation = `Recommended based on platform trends. `;
            }

            if (locationScore > 0) explanation += `Matched your preferred location.`;

            // Only recommend if the score is somewhat decent (e.g. at least 5% match or 0% but user profile is extremely empty)
            if (finalPercentage > 0 || userTokens.length < 5) {
                scoredJobs.push({
                    ...job,
                    matchScore: finalPercentage > 100 ? 100 : finalPercentage,
                    matchReason: explanation.trim(),
                    matchedSkills: matchedSkills,
                    missingSkills: missingSkills
                });
            }
        });

        // 7. Sort jobs by highest match score
        scoredJobs.sort((a, b) => b.matchScore - a.matchScore);

        return {
            jobs: scoredJobs.slice(0, 50), // Return top 50
            isComplete: userTokens.length > 10
        };

    } catch (error) {
        console.error('Built-in Recommendation Service Error:', error);
        throw error;
    }
};
