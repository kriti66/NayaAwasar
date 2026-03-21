import express from 'express';
import Application from '../models/Application.js';
import Interview from '../models/Interview.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import { getValidSavedJobIds } from '../utils/savedJobsUtils.js';
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
            const user = await User.findById(userId).select('fullName profileCompletion kycStatus kycRejectionReason resume_url skills savedJobs professionalHeadline jobPreferences location');

            // Stats
            const [appliedCount, inReviewCount, interviewCount, offerCount, validSavedIds] = await Promise.all([
                Application.countDocuments({ seeker_id: userId }), // Total Applied
                Application.countDocuments({ seeker_id: userId, status: { $in: ['applied', 'in_review'] } }), // In Review
                Application.countDocuments({ seeker_id: userId, status: 'interview' }), // Interview
                Application.countDocuments({ seeker_id: userId, status: 'offered' }), // Offers
                getValidSavedJobIds(userId)
            ]);

            const savedCount = validSavedIds?.length || 0;

            // Profile Views (from Activity collection)
            // Assuming we log 'RECRUITER_VIEW' activities where userId or meta.targetUserId is the seeker
            // Checking Activity schema: userId is the one PERFORMING the action.
            // So we need to find activities where type is 'RECRUITER_VIEW' and meta.candidateId (or similar) is userId.
            // Let's check how profileController logs it: logUserActivity(userId, 'RECRUITER_VIEW', { recruiterId: req.user.id });
            // Wait, profileController.js line 289: logUserActivity(userId, 'RECRUITER_VIEW', { recruiterId: req.user.id });
            // The first arg to logUserActivity is 'userId'. Let's check util/activityLogger (implied).
            // Usually logs are: User X did Y.
            // If profileController logs: logUserActivity(userId, ...), it means the 'userId' is the subject.
            // But here the 'subject' is the profile being viewed, not the viewer?
            // Let's assume for now we search for activities where userId = seekerId AND type = 'PROFILE_VIEW' (if self-view)
            // OR find where meta.targetUserId = seekerId if the recruiter is the actor.
            // Actually, in profileController.js:
            // logUserActivity(userId, 'RECRUITER_VIEW', { recruiterId: req.user.id })
            // This logs that 'userId' (the profile owner) had a 'RECRUITER_VIEW'.
            // So we can count documents in Activity where userId = seekerId and type = 'RECRUITER_VIEW'.

            const { default: Activity } = await import('../models/Activity.js');
            const profileViews = await Activity.countDocuments({ userId: userId, type: 'RECRUITER_VIEW' });

            // Application Pipeline Details (Interview model as single source of truth)
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            const interviewDocs = await Interview.find({
                seekerId: userId,
                status: 'Scheduled',
                date: { $gte: startOfToday },
                $or: [
                    { interviewStatus: { $in: ['scheduled', 'reschedule_pending', 'confirmed'] } },
                    { interviewStatus: { $exists: false } },
                    { interviewStatus: null }
                ]
            })
                .populate('applicationId')
                .populate('jobId', 'title company_name company_logo')
                .sort({ date: 1 })
                .limit(1)
                .lean();
            const upcomingInterviews = interviewDocs
                .filter((inv) => inv.applicationId && inv.applicationId.status === 'interview')
                .map((inv) => ({
                    _id: inv.applicationId._id,
                    job_id: inv.jobId,
                    interview: {
                        date: inv.date,
                        time: inv.time,
                        mode: inv.mode,
                        location: inv.location,
                        roomId: inv.roomId,
                        interviewId: {
                            interviewStatus: inv.interviewStatus || 'scheduled',
                            rescheduleStatus: inv.rescheduleStatus || 'NONE',
                            proposedDate: inv.proposedDate,
                            proposedTime: inv.proposedTime,
                            rescheduleReason: inv.rescheduleReason
                        }
                    }
                }));

            // Recent Activity (Mixed types: Applications, Messages, etc)
            // We want activities related to this user
            const recentActivity = await Activity.find({ userId: userId })
                .sort({ createdAt: -1 })
                .limit(5)
                .lean(); // We will format this on frontend or here.

            // Generate readable messages for activity
            const activityFeed = recentActivity.map(act => {
                let message = '';
                if (act.type === 'APPLIED_JOB') message = `You applied to ${act.meta?.jobTitle || 'a job'}`;
                else if (act.type === 'RECRUITER_VIEW') message = `${act.meta?.companyName || 'A recruiter'} viewed your profile`;
                else if (act.type === 'MESSAGE') message = `New message from ${act.meta?.senderName || 'Recruiter'}`;
                else message = 'New activity';

                return {
                    id: act._id,
                    type: act.type,
                    message,
                    timestamp: act.createdAt
                };
            });


            // Recommended Jobs
            // Simple algo: Match title or description with user skills
            let recommendedJobs = [];
            if (user.skills && user.skills.length > 0) {
                // Determine skills array (handle current string vs array inconsistency in DB vs app)
                const skillsArray = Array.isArray(user.skills) ? user.skills : user.skills.split(',');

                const regexConditions = skillsArray.map(skill => ({
                    title: { $regex: skill.trim(), $options: 'i' }
                }));

                // Also match location preference if set
                const query = {
                    status: 'Active',
                    $or: regexConditions
                };

                if (user.jobPreferences?.location) {
                    // Optional: boost or filter by location
                    // For now, let's just use skills matching for wider results
                }

                recommendedJobs = await Job.find(query)
                    .select('title company_name location salary_range type company_logo createdAt')
                    .limit(3)
                    .sort({ createdAt: -1 });
            }
            // Fallback if no skills or no matches: specific query or recent jobs
            if (recommendedJobs.length === 0) {
                recommendedJobs = await Job.find({ status: 'Active' })
                    .select('title company_name location salary_range type company_logo createdAt')
                    .limit(3)
                    .sort({ createdAt: -1 });
            }


            // Recommended Actions
            const actions = [];
            if (user.kycStatus === 'not_submitted') {
                actions.push({ id: 'kyc', title: 'Complete your KYC verification', urgency: 'high', type: 'kyc' });
            } else if (user.kycStatus === 'rejected') {
                actions.push({ id: 'kyc_retry', title: 'Re-submit KYC (Previous attempt rejected)', urgency: 'high', type: 'kyc' });
            }

            if (!user.resume_url && (!user.resume || !user.resume.fileUrl)) {
                actions.push({ id: 'resume', title: 'Upload your professional resume', urgency: 'medium', type: 'profile' });
            }

            const skillsCount = Array.isArray(user.skills) ? user.skills.length : (user.skills ? user.skills.split(',').length : 0);
            if (skillsCount < 3) {
                actions.push({ id: 'skills', title: 'Add missing skills to your profile', urgency: 'medium', type: 'profile' });
            }

            if (interviewCount > 0) {
                actions.push({ id: 'interview', title: `Respond to ${interviewCount} interview invitation(s)`, urgency: 'high', type: 'interview' });
            }

            // Profile Strength Breakdown
            const profileStrength = {
                score: user.profileStrength || 0, // Utilize the pre-calculated strength field
                completeness: user.profileCompletion || 0,
                resumeQuality: (user.resume && user.resume.fileUrl) ? 70 : 0, // Mock logic or use real
                skillsMatch: Math.min(skillsCount * 15, 100),
                label: user.profileStrength > 70 ? 'Excellent' : (user.profileStrength > 40 ? 'Good' : 'Weak')
            };

            res.json({
                user: {
                    fullName: user.fullName,
                    profileCompletion: user.profileCompletion,
                    kycStatus: user.kycStatus,
                    professionalHeadline: user.professionalHeadline,
                    location: user.location,
                    isOpenToWork: true // Placeholder or field from DB
                },
                stats: {
                    discoveryScore: 20, // Placeholder
                    activeApplications: appliedCount,
                    profileViews: profileViews,
                    interviews: interviewCount,
                    saved: savedCount
                },
                profileStrength,
                recommendedActions: actions,
                applicationPipeline: {
                    inReview: inReviewCount,
                    interviews: interviewCount,
                    offers: offerCount,
                    saved: savedCount
                },
                upcomingInterview: upcomingInterviews[0] || null,
                recommendedJobs,
                recentActivity: activityFeed
            });
        } else {
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
        const [appliedCount, interviewCount, validSavedIds] = await Promise.all([
            Application.countDocuments({ seeker_id: seekerId }),
            Application.countDocuments({ seeker_id: seekerId, status: 'interview' }),
            getValidSavedJobIds(seekerId)
        ]);

        res.json({ applied: appliedCount, saved: validSavedIds?.length || 0, interviews: interviewCount });
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

        // Count only ACTIVE applications (exclude final states: hired, rejected, withdrawn)
        const applicantCount = await Application.countDocuments({
            job_id: { $in: jobIds },
            status: { $nin: ['hired', 'rejected', 'withdrawn'] }
        });

        // Fetch company for profile views and calculate growth
        const company = await Company.findOne({ recruiters: recruiterId });
        let profileViews = 0;
        let profileViewsGrowth = 0;

        if (company && company.profileViews) {
            profileViews = company.profileViews.total || 0;
            
            // Calculate Monthly Growth
            const now = new Date();
            const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

            const thisMonthViews = company.profileViews.viewedBy.filter(v => v.viewedAt >= startOfThisMonth).length;
            const lastMonthViews = company.profileViews.viewedBy.filter(v => v.viewedAt >= startOfLastMonth && v.viewedAt <= endOfLastMonth).length;

            if (lastMonthViews === 0) {
                profileViewsGrowth = thisMonthViews > 0 ? 100 : 0;
            } else {
                profileViewsGrowth = Math.round(((thisMonthViews - lastMonthViews) / lastMonthViews) * 100);
            }
        }

        // Calculate Recruiter Strength
        // Need user kycStatus for calculation
        const user = await User.findById(recruiterId).select('kycStatus');
        const recruiterStrength = calculateRecruiterStrength(user, company, postedJobsCount, applicantCount);

        res.json({
            posted_jobs: postedJobsCount,
            applicants: applicantCount,
            profile_views: profileViews,
            profile_views_growth: profileViewsGrowth,
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
