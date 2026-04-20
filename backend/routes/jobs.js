import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import Company from '../models/Company.js';
import User from '../models/User.js';
import { requireAuth, requireRole, requireKycApproved, requireAdmin, requireCompanyApproved, requireRecruiterKycApproved, getJwtSecret } from '../middleware/auth.js';
import { logActivity } from '../utils/activityLogger.js';
import { getPromotedJobs } from '../controllers/promotedJobController.js';
import {
    getRecommendedJobs,
    recordUserInteraction,
    triggerEmbeddingUpdate
} from '../services/recommendationService.js';
import { getSimilarJobsForJob } from '../controllers/recommendationController.js';
import { getPublicJobsWithPromotionSort, getJobsForSeekerWithPromotion } from '../services/jobListingService.js';
import { applyUserJobLabels, invalidateJobLabelCacheForJob } from '../services/userJobLabelEnrichment.js';
import { normalizeTagsInput } from '../services/jobSearchFilter.js';
import { normalizeLabelOverride } from '../utils/jobLabel.js';
import { JOB_CATEGORIES } from '../constants/jobCategories.js';
import { getValidSavedJobIds, cleanUserSavedJobs } from '../utils/savedJobsUtils.js';
import { notDeletedFilter } from '../utils/userQueryHelpers.js';
import {
    DUPLICATE_MODERATION_STATUSES,
    isJobPubliclyVisible,
    normalizeModerationStatusForEdit,
    isJobVisibleForPublicListing,
    PUBLIC_MODERATION_MATCH,
    RECRUITER_JOB_EXCLUDE_ADMIN_REMOVED,
    RECRUITER_MY_JOBS_ADMIN_MODERATION_VALUES
} from '../utils/jobModeration.js';
import { deactivateWarningsForJob } from '../services/recruiterWarningService.js';
import { cancelInterviewsForJob } from '../services/interviewJobCleanup.js';

const router = express.Router();

function latestModerationHistoryAt(job, action) {
    const hist = job.moderationHistory;
    if (!Array.isArray(hist) || !hist.length) return null;
    const want = String(action).toLowerCase();
    for (let i = hist.length - 1; i >= 0; i--) {
        const h = hist[i];
        if (String(h.action || '').toLowerCase() === want) {
            return h.changedAt || null;
        }
    }
    return null;
}

function buildRecruiterAdminAction(job, mod) {
    const actionAt =
        latestModerationHistoryAt(job, mod) ||
        job.updatedAt ||
        job.createdAt ||
        null;
    let reason = '—';
    if (mod === 'warned') {
        reason = (job.warningMessage || job.moderationNote || job.flagReason || '').trim() || '—';
    } else {
        reason = (job.moderationNote || job.flagReason || job.warningMessage || '').trim() || '—';
    }
    return {
        _id: job._id,
        id: job._id,
        title: job.title || 'Untitled listing',
        actionType: mod,
        reason,
        actionAt: actionAt ? new Date(actionAt).toISOString() : null,
        warningAcknowledged: !!job.warningAcknowledged,
        warningDeadline: job.warningDeadline || null,
        warningMessage: job.warningMessage || ''
    };
}

function tryOptionalAuthPayload(req) {
    const h = req.headers.authorization;
    if (!h?.startsWith('Bearer ')) return null;
    try {
        return jwt.verify(h.split(' ')[1], getJwtSecret());
    } catch {
        return null;
    }
}

// Get all jobs (Public - only approved, promotion-aware sort)
router.get('/', async (req, res) => {
    try {
        const viewer = tryOptionalAuthPayload(req);
        const jobs = await getPublicJobsWithPromotionSort(req.query);

        // Defense-in-depth for seeker-facing requests:
        // only expose jobs with active status.
        if (viewer?.role === 'jobseeker' || viewer?.role === 'job_seeker') {
            const seekerJobs = jobs.filter((job) => String(job?.status || '').toLowerCase() === 'active');
            return res.json(seekerJobs);
        }

        res.json(jobs);
    } catch (error) {
        console.error("Fetch jobs error:", error);
        res.status(500).json({ message: 'Error fetching jobs' });
    }
});

// Get all jobs for Admin (including flagged/hidden)
router.get('/admin/all', requireAuth, requireAdmin, async (req, res) => {
    try {
        const jobs = await Job.find({})
            .sort({ createdAt: -1 })
            .populate('company_id', 'name logo');
        res.json(jobs);
    } catch (error) {
        console.error("Admin fetch jobs error:", error);
        res.status(500).json({ message: 'Error fetching jobs' });
    }
});

// Get recruiter specific jobs with applicant counts
router.get('/my-jobs', requireAuth, async (req, res) => {
    try {
        const recruiter_id = req.user.id;
        const jobs = await Job.find({
            recruiter_id,
            ...RECRUITER_JOB_EXCLUDE_ADMIN_REMOVED
        })
            .sort({ createdAt: -1 })
            .populate('company_id', 'logo name')
            .lean();

        // Fetch applicant counts for each job
        const jobsWithCounts = await Promise.all(jobs.map(async (job) => {
            const count = await Application.countDocuments({ job_id: job._id });
            return { ...job, applicantCount: count };
        }));

        res.json(jobsWithCounts);
    } catch (error) {
        console.error("Fetch recruiter jobs error:", error);
        res.status(500).json({ message: 'Error fetching your jobs' });
    }
});

// @route   GET /api/jobs/recruiter/my-jobs
// @desc    Recruiter My Jobs: active/live list + admin moderation alerts (split)
// @access  Private (recruiter)
router.get('/recruiter/my-jobs', requireAuth, requireRole('recruiter'), async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, type, sort = 'recent' } = req.query;

        const sortOption = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

        // Main list at DB level: no warned/hidden/deleted (admin cards loaded separately).
        const activeRaw = await Job.find({
            recruiter_id: userId,
            $nor: [{ moderationStatus: { $in: RECRUITER_MY_JOBS_ADMIN_MODERATION_VALUES } }]
        })
            .sort(sortOption)
            .lean();

        const adminRaw = await Job.find({
            recruiter_id: userId,
            moderationStatus: { $in: RECRUITER_MY_JOBS_ADMIN_MODERATION_VALUES }
        })
            .sort(sortOption)
            .lean();

        const adminActions = adminRaw.map((job) =>
            buildRecruiterAdminAction(job, normalizeModerationStatusForEdit(job.moderationStatus))
        );

        let activeCandidates = activeRaw;

        if (status && status !== 'All Status') {
            activeCandidates = activeCandidates.filter((j) => j.status === status);
        }
        if (type && type !== 'All Types') {
            activeCandidates = activeCandidates.filter(
                (j) =>
                    String(j.type || '').toLowerCase().replace(/-/g, ' ') ===
                    String(type || '').toLowerCase().replace(/-/g, ' ')
            );
        }

        activeCandidates.sort((a, b) => {
            const ta = new Date(a.createdAt).getTime();
            const tb = new Date(b.createdAt).getTime();
            return sort === 'oldest' ? ta - tb : tb - ta;
        });

        const activeIds = activeCandidates.map((j) => j._id);
        const countRows =
            activeIds.length > 0
                ? await Application.aggregate([
                      { $match: { job_id: { $in: activeIds } } },
                      { $group: { _id: '$job_id', applicants_count: { $sum: 1 } } }
                  ])
                : [];
        const countMap = new Map(countRows.map((r) => [r._id.toString(), r.applicants_count]));

        const activeJobs = activeCandidates.map((job) => ({
            _id: job._id,
            id: job._id,
            title: job.title,
            status: job.status,
            type: job.type,
            location: job.location,
            createdAt: job.createdAt,
            posted_at: job.posted_at,
            views_count: job.views_count,
            applicants_count: countMap.get(job._id.toString()) || 0,
            moderationStatus: job.moderationStatus,
            moderationNote: job.moderationNote,
            warningMessage: job.warningMessage,
            warningDeadline: job.warningDeadline,
            warningAcknowledged: job.warningAcknowledged,
            reportCount: job.reportCount
        }));

        adminActions.sort((a, b) => {
            const da = a.actionAt ? new Date(a.actionAt).getTime() : 0;
            const db = b.actionAt ? new Date(b.actionAt).getTime() : 0;
            return db - da;
        });

        res.json({ activeJobs, adminActions });
    } catch (error) {
        console.error('GET /jobs/recruiter/my-jobs error:', error);
        res.status(500).json({ message: 'Error fetching jobs' });
    }
});

// Recruiter Dashboard Stats
router.get('/stats/recruiter', requireAuth, async (req, res) => {
    try {
        const recruiter_id = req.user.id;
        const jobListFilter = { recruiter_id, ...RECRUITER_JOB_EXCLUDE_ADMIN_REMOVED };
        const totalJobs = await Job.countDocuments(jobListFilter);
        const activeJobs = await Job.countDocuments({ ...jobListFilter, status: 'Active' });

        // Find all job IDs for this recruiter to count total applications
        const myJobs = await Job.find(jobListFilter).select('_id');
        const jobIds = myJobs.map(j => j._id);
        const totalApplications = await Application.countDocuments({ job_id: { $in: jobIds } });

        res.json({
            totalJobs,
            activeJobs,
            totalApplications
        });
    } catch (error) {
        console.error("Fetch recruiter stats error:", error);
        res.status(500).json({ message: 'Error fetching recruiter statistics' });
    }
});

// Get recommended jobs (placeholder logic)
router.get('/recommended', async (req, res) => {
    try {
        const jobs = await Job.aggregate([
            { $match: { status: 'Active', ...PUBLIC_MODERATION_MATCH } },
            { $sample: { size: 5 } },
            {
                $lookup: {
                    from: 'companies',
                    localField: 'company_id',
                    foreignField: '_id',
                    as: 'company_details'
                }
            },
            {
                $unwind: {
                    path: '$company_details',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    company_logo: { $ifNull: ['$company_details.logo', '$company_logo'] },
                    // Fallback to existing company_logo field if join fails or is empty, 
                    // but prefer the joined company's logo.
                    // Also expose the full company object if needed by frontend as 'company_id' 
                    // (though aggregate returns it as 'company_details', we can map it)
                    company_id: '$company_details'
                }
            }
        ]);
        res.json(jobs);
    } catch (error) {
        console.error("Fetch recommended jobs error:", error);
        res.status(500).json({ message: 'Error fetching recommended jobs' });
    }
});

// Duplicate check for job title within last 24 hours for current recruiter
router.get('/check-duplicate', requireAuth, requireRole('recruiter', 'admin'), async (req, res) => {
    const { title } = req.query;
    if (!title || String(title).trim().length < 3) {
        return res.json({ duplicate: false });
    }
    const recruiter_id = req.user.id;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    try {
        const existing = await Job.findOne({
            recruiter_id,
            title: String(title).trim(),
            createdAt: { $gte: since },
            ...RECRUITER_JOB_EXCLUDE_ADMIN_REMOVED
        }).lean();
        res.json({ duplicate: !!existing });
    } catch (error) {
        console.error('Duplicate job check error:', error);
        res.status(500).json({ message: 'Error checking duplicates' });
    }
});

// Post a job (KYC-approved recruiters only)
router.post('/', requireAuth, requireRole('recruiter', 'admin'), requireRecruiterKycApproved, requireCompanyApproved, async (req, res) => {
    const {
        title, company_name, type, description, location,
        salary_range, requirements, experience_level,
        category, tags
    } = req.body;
    const recruiter_id = req.user.id;

    try {
        // Automatically fetch recruiter's approved company
        const company = await Company.findOne({ recruiters: recruiter_id, status: 'approved' });

        if (!company && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Approved company profile required to post jobs' });
        }

        if (!category || !JOB_CATEGORIES.includes(category)) {
            return res.status(400).json({ message: 'Valid category is required' });
        }
        const tagList = normalizeTagsInput(tags);

        const companyId = company?._id || req.body.company_id;
        if (!companyId) {
            return res.status(400).json({ message: 'Company is required to post a job' });
        }

        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const duplicate = await Job.findOne({
            company_id: companyId,
            title: String(title).trim(),
            createdAt: { $gte: thirtyDaysAgo },
            moderationStatus: { $in: DUPLICATE_MODERATION_STATUSES }
        }).lean();
        if (duplicate) {
            return res.status(400).json({ message: 'You already have a similar active job post.' });
        }

        const job = new Job({
            recruiter_id,
            company_id: companyId,
            title,
            company_name: company?.name || company_name,
            type,
            description,
            location,
            salary_range,
            requirements,
            experience_level,
            category,
            tags: tagList,
            company_logo: company?.logo || req.body.company_logo || '',
            status: 'Active',
            moderationStatus: 'active'
        });

        await job.save();
        triggerEmbeddingUpdate(job._id.toString(), 'job');

        // Log job creation activity
        // Log job creation activity
        await logActivity(
            recruiter_id,
            'JOB_POSTED',
            `Job posting '${job.title}' added.`,
            { jobId: job._id }
        );

        // Notify Seekers (Simplified: In a real app, optimize this to targeted users)
        // Here we just notify all active jobseekers for MVP or just log it.
        // For this task request: "if some company posted job then show in notification this company posted a job"
        // Notify Seekers (Simplified: In a real app, optimize this to targeted users)
        // Here we just notify all active jobseekers for MVP or just log it.
        // For this task request: "if some company posted job then show in notification this company posted a job"
        const { broadcastNotification } = await import('../controllers/notificationController.js');
        await broadcastNotification({
            role: 'jobseeker',
            type: 'job_posted',
            title: 'New Job Posted',
            message: `${job.company_name} posted a new job: ${job.title}`,
            link: `/jobseeker/jobs/${job._id}`,
            sender: recruiter_id
        });

        res.status(201).json({ success: true, id: job._id });
    } catch (error) {
        console.error("Create job error:", error);
        res.status(500).json({ message: 'Error creating job', error: error.message });
    }
});

// Get promoted jobs (Public)
router.get('/promoted', getPromotedJobs);

// Get merged jobs for jobseeker (promotion-aware, deduplicated, with AI match scores)
router.get('/for-seeker', requireAuth, requireRole('jobseeker', 'job_seeker'), async (req, res) => {
    try {
        const userId = req.user.id;
        const payload = await getJobsForSeekerWithPromotion(userId, getRecommendedJobs, req.query);
        res.json(payload);
    } catch (error) {
        console.error("Fetch jobs for seeker error:", error);
        res.status(500).json({ message: 'Error fetching jobs' });
    }
});

// Get saved jobs (browse/bookmark — KYC is enforced on apply, not here)
router.get('/saved', requireAuth, async (req, res) => {
    const userId = req.user.id;
    try {
        const validIds = await getValidSavedJobIds(userId);
        // Background cleanup of duplicates/stale refs (no-await)
        cleanUserSavedJobs(userId).catch(err => {
            if (process.env.NODE_ENV !== 'test') {
                console.warn("[savedJobs] Background cleanup failed:", err?.message);
            }
        });
        if (validIds.length === 0) {
            return res.json({ savedJobIds: [], jobs: [] });
        }
        const jobs = await Job.find({
            _id: { $in: validIds },
            status: 'Active',
            $and: [PUBLIC_MODERATION_MATCH]
        })
            .populate('company_id', 'name logo location')
            .sort({ createdAt: -1 })
            .lean();
        const jobMap = new Map(jobs.map(j => [j._id.toString(), j]));
        const orderedJobs = validIds.map(id => jobMap.get(id)).filter(Boolean);
        res.json({ savedJobIds: validIds, jobs: orderedJobs });
    } catch (error) {
        console.error("[savedJobs] Error fetching saved jobs:", error?.message || error);
        res.status(500).json({ message: 'Error fetching saved jobs' });
    }
});

router.get('/:id/similar', getSimilarJobsForJob);

// Recruiter: acknowledge admin warning (hides banner on dashboard after read)
router.patch('/:id/acknowledge-warning', requireAuth, requireRole('recruiter'), async (req, res) => {
    const { id } = req.params;
    try {
        const job = await Job.findById(id);
        if (!job) return res.status(404).json({ message: 'Job not found' });
        if (job.recruiter_id.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        job.warningAcknowledged = true;
        await job.save();
        await deactivateWarningsForJob(job._id, req.user.id);
        res.json(job);
    } catch (error) {
        console.error('acknowledge-warning error:', error);
        res.status(500).json({ message: 'Error updating job' });
    }
});

// Logged-in users (non-admin): report a job
router.post('/:id/report', requireAuth, async (req, res) => {
    const { id } = req.params;
    if (req.user.role === 'admin') {
        return res.status(403).json({ message: 'Admins cannot use the report action' });
    }
    try {
        const job = await Job.findById(id);
        if (!job) return res.status(404).json({ message: 'Job not found' });
        const uid = new mongoose.Types.ObjectId(req.user.id);
        if (job.reportedBy?.some((rid) => rid.toString() === uid.toString())) {
            return res.status(400).json({ message: 'Already reported' });
        }
        job.reportedBy = job.reportedBy || [];
        job.reportedBy.push(uid);
        job.reportCount = (job.reportCount || 0) + 1;
        await job.save();
        res.json({ success: true, message: 'Reported. Our team will review.' });
    } catch (error) {
        console.error('report job error:', error);
        res.status(500).json({ message: 'Error reporting job' });
    }
});

// Admin: fixed badge label override (invalidates per-job label cache)
router.patch('/:id/label-override', requireAuth, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const raw = req.body?.labelOverride;
    let labelOverride = null;
    if (raw !== undefined && raw !== null && raw !== '') {
        labelOverride = normalizeLabelOverride(raw);
        if (!labelOverride) {
            return res.status(400).json({ message: 'Invalid labelOverride' });
        }
    }
    try {
        const job = await Job.findByIdAndUpdate(id, { $set: { labelOverride } }, { new: true }).lean();
        if (!job) return res.status(404).json({ message: 'Job not found' });
        await invalidateJobLabelCacheForJob(id);
        res.json({ success: true, job });
    } catch (error) {
        console.error('label-override error:', error);
        res.status(500).json({ message: 'Error updating label override' });
    }
});

// Get specific job (public only unless owner/admin sends a valid Bearer token)
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const job = await Job.findById(id).populate('company_id', 'name logo location website size industry');
        if (!job) return res.status(404).json({ message: 'Job not found' });

        const viewer = tryOptionalAuthPayload(req);
        const isOwner = viewer && job.recruiter_id.toString() === viewer.id;
        const isAdmin = viewer?.role === 'admin';
        if (!isJobPubliclyVisible(job) && !isOwner && !isAdmin) {
            return res.status(404).json({ message: 'Job not found' });
        }

        const jobObj = job.toObject ? job.toObject() : job;
        if (!jobObj.company_logo && jobObj.company_id?.logo) {
            jobObj.company_logo = jobObj.company_id.logo;
            jobObj.company_logo_url = jobObj.company_id.logo;
        }
        res.json(jobObj);
    } catch (error) {
        console.error("Fetch specific job error:", error);
        res.status(500).json({ message: 'Error fetching job' });
    }
});

// Recruiter: close/deactivate own job
router.patch('/:id/close', requireAuth, requireRole('recruiter'), async (req, res) => {
    const { id } = req.params;
    try {
        const job = await Job.findById(id);
        if (!job) return res.status(404).json({ message: 'Job not found' });
        if (job.recruiter_id.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        job.status = 'Closed';
        await job.save();

        res.json(job);
    } catch (error) {
        console.error('close job error:', error);
        res.status(500).json({ message: 'Error closing job' });
    }
});

// Delete job (KYC-approved recruiters only)
router.delete('/:id', requireAuth, requireKycApproved, requireCompanyApproved, async (req, res) => {
    const { id } = req.params;
    try {
        const job = await Job.findByIdAndDelete(id);
        if (!job) return res.status(404).json({ message: 'Job not found' });
        await invalidateJobLabelCacheForJob(id);
        await cancelInterviewsForJob(job._id, {
            reason: 'Job listing was deleted',
            cancelledByUserId: req.user.id
        });

        // Log job deletion activity
        // Log job deletion activity
        await logActivity(
            req.user.id,
            'JOB_DELETED',
            `Job posting '${job.title}' deleted.`,
            { jobId: job._id }
        );

        res.json({ success: true, message: 'Job deleted' });
    } catch (error) {
        console.error('Delete job error:', error);
        res.status(500).json({ message: 'Error deleting job', error: error.message });
    }
});

// Update specific job (KYC-approved recruiters only)
router.put('/:id', requireAuth, requireKycApproved, requireCompanyApproved, async (req, res) => {
    const { id } = req.params;
    const {
        title, company_name, type, description, location, salary_range, requirements, status, experience_level,
        category, tags
    } = req.body;

    try {
        const existingJob = await Job.findById(id);
        if (!existingJob) return res.status(404).json({ message: 'Job not found' });

        if (existingJob.recruiter_id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const normalizedMs = normalizeModerationStatusForEdit(existingJob.moderationStatus);
        if (normalizedMs === 'deleted') {
            return res.status(403).json({ message: 'This job was permanently removed and cannot be edited.' });
        }

        if (title !== undefined) existingJob.title = title;
        if (company_name !== undefined) existingJob.company_name = company_name;
        if (type !== undefined) existingJob.type = type;
        if (description !== undefined) existingJob.description = description;
        if (location !== undefined) existingJob.location = location;
        if (salary_range !== undefined) existingJob.salary_range = salary_range;
        if (requirements !== undefined) existingJob.requirements = requirements;
        if (status !== undefined) existingJob.status = status;
        if (experience_level !== undefined) existingJob.experience_level = experience_level;
        if (category !== undefined) {
            if (!JOB_CATEGORIES.includes(category)) {
                return res.status(400).json({ message: 'Invalid category' });
            }
            existingJob.category = category;
        }
        if (tags !== undefined) {
            existingJob.tags = normalizeTagsInput(tags);
        }

        if (!Array.isArray(existingJob.moderationHistory)) {
            existingJob.moderationHistory = [];
        }

        if (normalizedMs === 'hidden') {
            existingJob.moderationStatus = 'pending_review';
            existingJob.warningMessage = '';
            existingJob.warningDeadline = null;
            existingJob.warningAcknowledged = false;
            existingJob.moderationHistory.push({
                action: 'resubmitted',
                note: 'Recruiter edited and resubmitted',
                changedBy: new mongoose.Types.ObjectId(req.user.id)
            });
        } else if (normalizedMs === 'warned') {
            existingJob.moderationStatus = 'active';
            existingJob.warningMessage = '';
            existingJob.warningDeadline = null;
            existingJob.warningAcknowledged = false;
            existingJob.moderationHistory.push({
                action: 'warning_resolved',
                note: 'Recruiter edited after warning',
                changedBy: new mongoose.Types.ObjectId(req.user.id)
            });
        }

        await existingJob.save();
        if (normalizedMs === 'warned') {
            await deactivateWarningsForJob(existingJob._id, req.user.id);
        }
        triggerEmbeddingUpdate(id, 'job');
        await invalidateJobLabelCacheForJob(id);
        res.json({ success: true, message: 'Job updated', job: existingJob });
    } catch (error) {
        console.error("Update job error:", error);
        res.status(500).json({ message: 'Error updating job' });
    }
});

// Admin Moderation Route (legacy; prefer /api/admin/moderation/jobs/*)
router.patch('/:id/moderate', requireAuth, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { moderationStatus, flagReason, reviewDeadline, adminComments } = req.body;

    const legacyToNew = {
        Approved: 'active',
        Flagged: 'warned',
        'Under Review': 'pending_review',
        Hidden: 'hidden'
    };
    const nextStatus = legacyToNew[moderationStatus] || moderationStatus;

    try {
        const job = await Job.findByIdAndUpdate(
            id,
            {
                moderationStatus: nextStatus,
                flagReason,
                reviewDeadline,
                adminComments
            },
            { new: true }
        ).populate('recruiter_id', '_id');

        if (!job) return res.status(404).json({ message: 'Job not found' });

        const { createNotification } = await import('../controllers/notificationController.js');
        const recruiterId = job.recruiter_id?._id || job.recruiter_id;
        if (recruiterId) {
            const approvedLike = nextStatus === 'active';
            await createNotification({
                recipient: recruiterId,
                type: approvedLike ? 'job_approved' : 'job_rejected',
                category: 'job',
                title: approvedLike ? 'Job Approved' : 'Job update',
                message: approvedLike
                    ? `Your job "${job.title}" has been approved and is now visible.`
                    : `Your job "${job.title}" was updated. ${adminComments || flagReason || ''}`.trim(),
                link: '/recruiter/jobs',
                metadata: { jobId: job._id },
                sender: req.user.id
            });
        }

        const modAction = nextStatus === 'active' ? 'JOB_APPROVED' : 'JOB_REJECTED';
        await logActivity(
            req.user.id,
            modAction,
            `Job '${job.title}' moderation status updated to ${nextStatus}.`,
            { jobId: job._id }
        );

        if (nextStatus === 'hidden' || nextStatus === 'deleted') {
            await cancelInterviewsForJob(job._id, {
                reason: 'Job was removed by admin',
                cancelledByUserId: req.user.id
            });
        }

        if (nextStatus === 'active') {
            await deactivateWarningsForJob(job._id, req.user.id);
        }

        await invalidateJobLabelCacheForJob(id);
        res.json({ success: true, message: `Job moderation status updated to ${nextStatus}`, job });
    } catch (error) {
        console.error("Job moderation error:", error);
        res.status(500).json({ message: 'Error updating job moderation status' });
    }
});

// Patch status only (KYC-approved recruiters only)
router.patch('/:id/status', requireAuth, requireKycApproved, requireCompanyApproved, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Active', 'Closed', 'Draft', 'Pending'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        const job = await Job.findByIdAndUpdate(id, { status }, { new: true });
        if (!job) return res.status(404).json({ message: 'Job not found' });
        res.json({ success: true, status: job.status });
    } catch (error) {
        console.error("Patch status error:", error);
        res.status(500).json({ message: 'Error updating status' });
    }
});

// Admin: Clean duplicate/stale saved jobs for all users
router.post('/admin/clean-saved-jobs', requireAuth, requireAdmin, async (req, res) => {
    try {
        const users = await User.find({
            savedJobs: { $exists: true, $ne: [] },
            ...notDeletedFilter()
        }).select('_id').lean();
        let totalRemoved = 0;
        for (const u of users) {
            const removed = await cleanUserSavedJobs(u._id.toString());
            totalRemoved += removed;
        }
        res.json({ success: true, usersProcessed: users.length, recordsRemoved: totalRemoved });
    } catch (error) {
        console.error("[savedJobs] Admin cleanup error:", error?.message || error);
        res.status(500).json({ message: 'Error cleaning saved jobs' });
    }
});

// Toggle Save Job (Jobseeker only; KYC enforced on apply only)
router.post('/:id/save', requireAuth, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const job = await Job.findById(id);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }
        if (!isJobVisibleForPublicListing(job)) {
            return res.status(400).json({ message: 'This job is no longer available to save' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.savedJobs = user.savedJobs || [];
        const idStr = id.toString();
        const existingIdx = user.savedJobs.findIndex(
            sid => (sid?.toString?.() || String(sid)) === idStr
        );

        let saved = false;
        if (existingIdx === -1) {
            user.savedJobs.push(job._id);
            saved = true;
        } else {
            user.savedJobs.splice(existingIdx, 1);
        }

        const uniqueIds = [...new Set(user.savedJobs.map(sid => (sid?.toString?.() || String(sid))))];
        user.savedJobs = uniqueIds.map(id => (typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id));
        await user.save();

        if (saved) {
            recordUserInteraction(userId, idStr, 'saved');
        }

        const validIds = await getValidSavedJobIds(userId);
        if (process.env.NODE_ENV === 'development') {
            console.log('[savedJobs] Toggle OK', { jobId: idStr, saved, validSavedCount: validIds.length });
        }
        res.json({ success: true, saved, savedJobs: validIds });
    } catch (error) {
        console.error("[savedJobs] Toggle save error:", error?.message || error);
        res.status(500).json({ message: 'Error updating saved jobs' });
    }
});

export default router;
