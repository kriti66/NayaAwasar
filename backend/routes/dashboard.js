import express from 'express';
import mongoose from 'mongoose';
import Application from '../models/Application.js';
import Interview from '../models/Interview.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import { getValidSavedJobIds } from '../utils/savedJobsUtils.js';
import KYC from '../models/KYC.js';
import IdentityKyc from '../models/kycModel.js';
import RecruiterKyc from '../models/RecruiterKyc.js';
import Company from '../models/Company.js';
import Profile from '../models/Profile.js';
import { calculateRecruiterStrength } from '../utils/recruiterStrength.js';
import {
    computeSeekerProfileMetrics,
    getNormalizedSkills,
    mergeSeekerDataForScoring
} from '../utils/seekerProfileScoring.js';
import { getRecommendedJobs } from '../services/recommendationService.js';
import { applyUserJobLabels } from '../services/userJobLabelEnrichment.js';
import { RECRUITER_JOB_EXCLUDE_ADMIN_REMOVED } from '../utils/jobModeration.js';

const router = express.Router();

/** Upcoming interviews: scheduled slot + DB interviewStatus `scheduled`, application still in interview stage. */
async function countSeekerUpcomingScheduledInterviews(seekerId, startOfToday) {
    const dayStart = startOfToday || (() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    })();
    const result = await Interview.aggregate([
        {
            $match: {
                seekerId: new mongoose.Types.ObjectId(String(seekerId)),
                status: 'Scheduled',
                interviewStatus: 'scheduled',
                date: { $gte: dayStart }
            }
        },
        {
            $lookup: {
                from: 'applications',
                localField: 'applicationId',
                foreignField: '_id',
                as: 'app'
            }
        },
        { $unwind: '$app' },
        { $match: { 'app.status': 'interview' } },
        { $count: 'n' }
    ]);
    return result[0]?.n ?? 0;
}

router.get('/', async (req, res) => {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    try {
        if (role === 'jobseeker' || role === 'job_seeker') {
            const [user, profile] = await Promise.all([
                User.findById(userId)
                    .select(
                        'fullName email phoneNumber profileCompletion profileStrength kycStatus kycRejectionReason resume_url skills savedJobs professionalHeadline jobPreferences location bio profileImage linkedinUrl portfolioUrl workExperience education resume isKycVerified'
                    )
                    .lean(),
                Profile.findOne({ userId })
                    .select('headline summary location skills experience education jobPreferences resume')
                    .lean()
            ]);

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);

            // Stats
            const [appliedCount, inReviewCount, interviewCount, offerCount, validSavedIds] = await Promise.all([
                Application.countDocuments({ seeker_id: userId }), // Total Applied
                Application.countDocuments({ seeker_id: userId, status: { $in: ['applied', 'in_review'] } }), // In Review
                countSeekerUpcomingScheduledInterviews(userId, startOfToday),
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
            const interviewDocs = await Interview.find({
                seekerId: userId,
                status: 'Scheduled',
                interviewStatus: 'scheduled',
                date: { $gte: startOfToday }
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
                else if (act.type === 'KYC_SUBMITTED') message = 'KYC submitted for review';
                else if (act.type === 'KYC_RESUBMITTED') message = 'KYC resubmitted for review';
                else if (act.type === 'KYC_APPROVED') message = 'Your KYC was approved';
                else if (act.type === 'KYC_REJECTED') message = 'Your KYC was rejected';
                else message = 'New activity';

                return {
                    id: act._id,
                    type: act.type,
                    message,
                    timestamp: act.createdAt
                };
            });

            const mergedProfileSource = mergeSeekerDataForScoring(user, profile);
            const normalizedSkills = getNormalizedSkills(mergedProfileSource.skills);

            // Recommended jobs: same pipeline as /api/recommendations + shared labels
            const recPack = await getRecommendedJobs(userId, { limit: 3 });
            let recommendedJobs = (recPack.jobs || []).slice(0, 3);
            await applyUserJobLabels(userId, recommendedJobs);


            // Recommended Actions
            const actions = [];
            if (mergedProfileSource.kycStatus === 'not_submitted') {
                actions.push({ id: 'kyc', title: 'Complete your KYC verification', urgency: 'high', type: 'kyc' });
            } else if (mergedProfileSource.kycStatus === 'rejected') {
                actions.push({ id: 'kyc_retry', title: 'Re-submit KYC (Previous attempt rejected)', urgency: 'high', type: 'kyc' });
            }

            if (!mergedProfileSource.resume_url && (!mergedProfileSource.resume || !mergedProfileSource.resume.fileUrl)) {
                actions.push({ id: 'resume', title: 'Upload your professional resume', urgency: 'medium', type: 'profile' });
            }

            const skillsCount = normalizedSkills.length;
            if (skillsCount < 3) {
                actions.push({ id: 'skills', title: 'Add missing skills to your profile', urgency: 'medium', type: 'profile' });
            }

            if (interviewCount > 0) {
                actions.push({ id: 'interview', title: `Respond to ${interviewCount} interview invitation(s)`, urgency: 'high', type: 'interview' });
            }

            const seekerMetrics = computeSeekerProfileMetrics(mergedProfileSource);
            if (process.env.NODE_ENV !== 'production') {
                console.log('[Dashboard:/api/dashboard] scoring input', {
                    userId,
                    hasProfileDoc: Boolean(profile),
                    skillsCount: normalizedSkills.length,
                    workExperienceCount: Array.isArray(mergedProfileSource.workExperience) ? mergedProfileSource.workExperience.length : 0,
                    educationCount: Array.isArray(mergedProfileSource.education) ? mergedProfileSource.education.length : 0,
                    hasResume: Boolean(mergedProfileSource.resume?.fileUrl || mergedProfileSource.resume_url),
                    kycStatus: mergedProfileSource.kycStatus
                });
                console.log('[Dashboard:/api/dashboard] scoring output', seekerMetrics);
            }

            // Profile Strength Breakdown (all derived from this user's stored data)
            const profileStrength = {
                score: seekerMetrics.overallStrength,
                completeness: seekerMetrics.profileCompletionPercent,
                resumeQuality: seekerMetrics.resumeQualityPercent,
                skillsMatch: seekerMetrics.skillsPercent,
                activityLevel: Math.min(100, recentActivity.length * 20),
                label:
                    seekerMetrics.overallStrength >= 80
                        ? 'Excellent'
                        : seekerMetrics.overallStrength >= 40
                          ? 'Good'
                          : 'Weak'
            };

            res.json({
                user: {
                    fullName: mergedProfileSource.fullName,
                    profileCompletion: seekerMetrics.profileCompletionPercent,
                    kycStatus: mergedProfileSource.kycStatus,
                    professionalHeadline: mergedProfileSource.professionalHeadline,
                    location: mergedProfileSource.location,
                    isOpenToWork: true // Placeholder or field from DB
                },
                stats: {
                    discoveryScore: seekerMetrics.profileCompletionPercent,
                    activeApplications: appliedCount,
                    profileViews: profileViews,
                    interviews: interviewCount,
                    saved: savedCount
                },
                profileStrength,
                profileMetrics: seekerMetrics,
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
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const [appliedCount, interviewCount, validSavedIds, profileViews, seekerUser, seekerProfile] = await Promise.all([
            Application.countDocuments({ seeker_id: seekerId }),
            countSeekerUpcomingScheduledInterviews(seekerId, startOfToday),
            getValidSavedJobIds(seekerId),
            // Count only recruiter profile-view activities for this seeker.
            // Excludes accidental self-view logs if any were ever inserted.
            Activity.countDocuments({
                userId: seekerId,
                type: 'RECRUITER_VIEW',
                'meta.recruiterId': { $ne: seekerId }
            }),
            User.findById(seekerId)
                .select(
                    'fullName email phoneNumber location bio profileImage professionalHeadline linkedinUrl portfolioUrl skills workExperience education resume resume_url kycStatus isKycVerified'
                )
                .lean(),
            Profile.findOne({ userId: seekerId })
                .select('headline summary location skills experience education jobPreferences resume')
                .lean()
        ]);

        const mergedProfileSource = mergeSeekerDataForScoring(seekerUser || {}, seekerProfile || {});
        const profileMetrics = computeSeekerProfileMetrics(mergedProfileSource);
        if (process.env.NODE_ENV !== 'production') {
            console.log('[Dashboard:/api/dashboard/seeker/stats] scoring input', {
                userId: seekerId,
                hasProfileDoc: Boolean(seekerProfile),
                skillsCount: getNormalizedSkills(mergedProfileSource.skills).length,
                workExperienceCount: Array.isArray(mergedProfileSource.workExperience) ? mergedProfileSource.workExperience.length : 0,
                educationCount: Array.isArray(mergedProfileSource.education) ? mergedProfileSource.education.length : 0,
                hasResume: Boolean(mergedProfileSource.resume?.fileUrl || mergedProfileSource.resume_url),
                kycStatus: mergedProfileSource.kycStatus
            });
            console.log('[Dashboard:/api/dashboard/seeker/stats] scoring output', profileMetrics);
        }

        res.json({
            applied: appliedCount,
            saved: validSavedIds?.length || 0,
            interviews: interviewCount,
            profileViews: profileViews || 0,
            profileMetrics
        });
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
        const recruiterJobFilter = { recruiter_id: recruiterId, ...RECRUITER_JOB_EXCLUDE_ADMIN_REMOVED };
        const postedJobsCount = await Job.countDocuments(recruiterJobFilter);

        // Find jobs by this recruiter first to count their applications
        const recruiterJobs = await Job.find(recruiterJobFilter).select('_id');
        const jobIds = recruiterJobs.map(j => j._id);

        // Inbound Talent: total applications across ALL jobs posted by this recruiter
        const applicantCount = await Application.countDocuments({
            job_id: { $in: jobIds }
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
        // Match Admin KYC queue exactly: only entries currently pending review.
        const pendingSeekerKyc = await KYC.countDocuments({ status: 'pending' });
        const pendingIdentityKyc = await IdentityKyc.countDocuments({ status: 'pending' });
        const pendingRecruiterKyc = await RecruiterKyc.countDocuments({
            $or: [
                { representativeStatus: 'pending' },
                { companyStatus: 'pending' },
                { status: 'pending' }
            ]
        });
        const pendingKYC = pendingSeekerKyc + pendingIdentityKyc + pendingRecruiterKyc;
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
