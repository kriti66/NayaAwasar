import express from 'express';
import Application from '../models/Application.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import KYC from '../models/KYC.js';
import Company from '../models/Company.js';
import { calculateRecruiterStrength } from '../utils/recruiterStrength.js';

const router = express.Router();

router.get('/', async (req, res) => {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    try {
        if (role === 'jobseeker' || role === 'job_seeker') {
            const user = await User.findById(userId).select('fullName profileCompletion kycStatus kycRejectionReason resume_url skills');

            // Stats
            const appliedCount = await Application.countDocuments({ seeker_id: userId });
            const inReviewCount = await Application.countDocuments({ seeker_id: userId, status: 'Under Review' });
            const interviewCount = await Application.countDocuments({ seeker_id: userId, status: 'Interview Scheduled' });

            // Application Pipeline Details
            const upcomingInterviews = await Application.find({
                seeker_id: userId,
                status: 'Interview Scheduled',
                'interview.date': { $gte: new Date().setHours(0, 0, 0, 0) }
            }).populate('job_id', 'title company_name');

            // Recommended Actions
            const actions = [];
            if (user.kycStatus === 'not_submitted') {
                actions.push({ id: 'kyc', title: 'Complete your KYC verification', urgency: 'high', type: 'kyc' });
            } else if (user.kycStatus === 'rejected') {
                actions.push({ id: 'kyc_retry', title: 'Re-submit KYC (Previous attempt rejected)', urgency: 'high', type: 'kyc' });
            }

            if (!user.resume_url) {
                actions.push({ id: 'resume', title: 'Upload your professional resume', urgency: 'medium', type: 'profile' });
            }

            if (!user.skills || user.skills.split(',').length < 3) {
                actions.push({ id: 'skills', title: 'Add missing skills to your profile', urgency: 'medium', type: 'profile' });
            }

            if (interviewCount > 0) {
                actions.push({ id: 'interview', title: `Respond to ${interviewCount} interview invitation(s)`, urgency: 'high', type: 'interview' });
            }

            // Profile Strength Breakdown (Mocking some values based on real fields)
            const profileStrength = {
                completeness: user.profileCompletion || 0,
                resumeQuality: user.resume_url ? 85 : 0,
                skillsMatch: (user.skills?.split(',').length || 0) * 20 > 100 ? 100 : (user.skills?.split(',').length || 0) * 20,
                activityLevel: appliedCount > 5 ? 90 : appliedCount * 15
            };

            res.json({
                user: {
                    fullName: user.fullName,
                    profileCompletion: user.profileCompletion,
                    kycStatus: user.kycStatus
                },
                stats: {
                    discoveryScore: user.profileCompletion || 0,
                    activeApplications: appliedCount,
                    profileViews: 24, // Placeholder as we don't track views yet
                    interviews: interviewCount,
                    saved: 0 // Placeholder
                },
                profileStrength,
                recommendedActions: actions,
                applicationPipeline: {
                    inReview: inReviewCount,
                    interviews: interviewCount,
                    bookmarked: 0 // Placeholder
                },
                upcomingInterviews
            });
        } else {
            // For recruiters or admins, they can still use their specific endpoints for now
            // or we could add them here if needed.
            res.status(400).json({ message: 'Dashboard data only available for jobseekers via this endpoint' });
        }
    } catch (error) {
        console.error("Dashboard aggregated error:", error);
        res.status(500).json({ message: 'Error fetching dashboard data' });
    }
});

router.get('/seeker/stats', async (req, res) => {
    const seekerId = req.user?.id;
    if (!seekerId) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const appliedCount = await Application.countDocuments({ seeker_id: seekerId });
        const interviewCount = await Application.countDocuments({ seeker_id: seekerId, status: 'Interview Scheduled' });

        res.json({ applied: appliedCount, saved: 0, interviews: interviewCount });
    } catch (error) {
        console.error("Seeker stats error:", error);
        res.status(500).json({ message: 'Error fetching stats' });
    }
});

router.get('/recruiter/stats', async (req, res) => {
    console.log("Recruiter stats requested. req.user:", req.user);
    const recruiterId = req.user?.id;
    if (!recruiterId) {
        console.warn("Recruiter stats: No recruiterId found in req.user");
        return res.status(401).json({
            code: 'SESSION_EXPIRED',
            message: 'Unauthorized. Please login again.'
        });
    }

    try {
        const postedJobsCount = await Job.countDocuments({ recruiter_id: recruiterId });

        // Find jobs by this recruiter first to count their applications
        const recruiterJobs = await Job.find({ recruiter_id: recruiterId }).select('_id');
        const jobIds = recruiterJobs.map(j => j._id);
        const applicantCount = await Application.countDocuments({ job_id: { $in: jobIds } });

        // Fetch company for profile views
        const company = await Company.findOne({ recruiters: recruiterId });
        const profileViews = company?.profileViews?.total || 0;

        // Calculate Recruiter Strength
        // Need user kycStatus for calculation
        const user = await User.findById(recruiterId).select('kycStatus');
        const recruiterStrength = calculateRecruiterStrength(user, company, postedJobsCount, applicantCount);

        res.json({
            posted_jobs: postedJobsCount,
            applicants: applicantCount,
            profile_views: profileViews,
            recruiter_strength: recruiterStrength
        });
    } catch (error) {
        console.error("Recruiter stats error:", error);
        res.status(500).json({ message: 'Error fetching stats' });
    }
});

router.get('/admin/stats', async (req, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    try {
        const totalUsers = await User.countDocuments({});
        const totalJobs = await Job.countDocuments({});
        const activeRecruiters = await User.countDocuments({ role: 'recruiter' });
        const pendingKYC = await KYC.countDocuments({ status: 'pending' });
        const approvedKYC = await KYC.countDocuments({ status: 'verified' });

        res.json({
            totalUsers,
            totalJobs,
            activeRecruiters,
            pendingKYC,
            approvedKYC,
            pendingApprovals: pendingKYC
        });
    } catch (error) {
        console.error("Admin stats error:", error);
        res.status(500).json({ message: 'Error fetching admin stats' });
    }
});

export default router;
