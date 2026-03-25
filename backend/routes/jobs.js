import express from 'express';
import mongoose from 'mongoose';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import Company from '../models/Company.js';
import User from '../models/User.js';
import { requireAuth, requireRole, requireKycApproved, requireAdmin, requireCompanyApproved, requireKycVerified, requireRecruiterKycApproved } from '../middleware/auth.js';
import { logActivity } from '../utils/activityLogger.js';
import { getPromotedJobs } from '../controllers/promotedJobController.js';
import { getRecommendedJobs } from '../services/recommendationService.js';
import { getPublicJobsWithPromotionSort, getJobsForSeekerWithPromotion } from '../services/jobListingService.js';
import { normalizeTagsInput } from '../services/jobSearchFilter.js';
import { JOB_CATEGORIES } from '../constants/jobCategories.js';
import { getValidSavedJobIds, cleanUserSavedJobs } from '../utils/savedJobsUtils.js';

const router = express.Router();

// Get all jobs (Public - only approved, promotion-aware sort)
router.get('/', async (req, res) => {
    try {
        const jobs = await getPublicJobsWithPromotionSort(req.query);
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
        const jobs = await Job.find({ recruiter_id })
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

// Recruiter Dashboard Stats
router.get('/stats/recruiter', requireAuth, async (req, res) => {
    try {
        const recruiter_id = req.user.id;
        const totalJobs = await Job.countDocuments({ recruiter_id });
        const activeJobs = await Job.countDocuments({ recruiter_id, status: 'Active' });

        // Find all job IDs for this recruiter to count total applications
        const myJobs = await Job.find({ recruiter_id }).select('_id');
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
            { $match: { status: 'Active', moderationStatus: 'Approved' } },
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

        const job = new Job({
            recruiter_id,
            company_id: company?._id || req.body.company_id,
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
            status: 'Active'
        });

        await job.save();

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
        const { broadcastNotification, notifyAdmins } = await import('../controllers/notificationController.js');
        await broadcastNotification({
            role: 'jobseeker',
            type: 'job_posted',
            title: 'New Job Posted',
            message: `${job.company_name} posted a new job: ${job.title}`,
            link: `/jobseeker/jobs/${job._id}`,
            sender: recruiter_id
        });
        await notifyAdmins({
            type: 'job_posted',
            category: 'job',
            title: 'New Job Posted',
            message: `${job.company_name} posted: ${job.title}. Review in Manage Jobs.`,
            link: '/admin/jobs',
            metadata: { jobId: job._id },
            senderId: recruiter_id
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
        const jobs = await getJobsForSeekerWithPromotion(userId, getRecommendedJobs, req.query);
        res.json(jobs);
    } catch (error) {
        console.error("Fetch jobs for seeker error:", error);
        res.status(500).json({ message: 'Error fetching jobs' });
    }
});

// Get saved jobs (single source of truth - valid, deduplicated)
router.get('/saved', requireAuth, requireKycVerified, async (req, res) => {
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
            moderationStatus: 'Approved'
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

// Get specific job
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Populate company details including logo
        const job = await Job.findById(id).populate('company_id', 'name logo location website size industry');
        if (!job) return res.status(404).json({ message: 'Job not found' });
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

// Delete job (KYC-approved recruiters only)
router.delete('/:id', requireAuth, requireKycApproved, requireCompanyApproved, async (req, res) => {
    const { id } = req.params;
    try {
        const job = await Job.findByIdAndDelete(id);
        if (!job) return res.status(404).json({ message: 'Job not found' });

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

        // Check if job belongs to recruiter
        if (existingJob.recruiter_id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const updateData = {
            title,
            company_name,
            type,
            description,
            location,
            salary_range,
            requirements,
            status,
            experience_level
        };
        if (category !== undefined) {
            if (!JOB_CATEGORIES.includes(category)) {
                return res.status(400).json({ message: 'Invalid category' });
            }
            updateData.category = category;
        }
        if (tags !== undefined) {
            updateData.tags = normalizeTagsInput(tags);
        }

        // If job was flagged/hidden, update to 'Under Review' on edit
        if (existingJob.moderationStatus === 'Flagged' || existingJob.moderationStatus === 'Hidden') {
            updateData.moderationStatus = 'Under Review';
            updateData.adminComments = 'Waiting for admin re-approval after recruiter update.';
        }

        const job = await Job.findByIdAndUpdate(id, updateData, { new: true });
        res.json({ success: true, message: 'Job updated', job });
    } catch (error) {
        console.error("Update job error:", error);
        res.status(500).json({ message: 'Error updating job' });
    }
});

// Admin Moderation Route
router.patch('/:id/moderate', requireAuth, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { moderationStatus, flagReason, reviewDeadline, adminComments } = req.body;

    try {
        const job = await Job.findByIdAndUpdate(id, {
            moderationStatus,
            flagReason,
            reviewDeadline,
            adminComments
        }, { new: true }).populate('recruiter_id', '_id');

        if (!job) return res.status(404).json({ message: 'Job not found' });

        const { createNotification } = await import('../controllers/notificationController.js');
        const recruiterId = job.recruiter_id?._id || job.recruiter_id;
        if (recruiterId) {
            await createNotification({
                recipient: recruiterId,
                type: moderationStatus === 'Approved' ? 'job_approved' : 'job_rejected',
                category: 'job',
                title: moderationStatus === 'Approved' ? 'Job Approved' : 'Job Rejected',
                message: moderationStatus === 'Approved'
                    ? `Your job "${job.title}" has been approved and is now visible.`
                    : `Your job "${job.title}" was rejected. ${adminComments || ''}`.trim(),
                link: '/recruiter/jobs',
                metadata: { jobId: job._id },
                sender: req.user.id
            });
        }

        const modAction = moderationStatus === 'Approved' ? 'JOB_APPROVED' : 'JOB_REJECTED';
        await logActivity(
            req.user.id,
            modAction,
            `Job '${job.title}' moderation status updated to ${moderationStatus}.`,
            { jobId: job._id }
        );

        res.json({ success: true, message: `Job moderation status updated to ${moderationStatus}`, job });
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
        const users = await User.find({ savedJobs: { $exists: true, $ne: [] } }).select('_id').lean();
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

// Toggle Save Job (Jobseeker only)
router.post('/:id/save', requireAuth, requireKycVerified, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const job = await Job.findById(id);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }
        if (job.status !== 'Active' || job.moderationStatus !== 'Approved') {
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
