
import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Company from '../models/Company.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
    deactivateWarningsForJob,
    dismissRecruiterWarningForRecruiter,
    getActiveWarningsForRecruiter
} from '../services/recruiterWarningService.js';
import { cancelInterviewsForJob } from '../services/interviewJobCleanup.js';
import { normalizeModerationStatusForEdit, RECRUITER_JOB_EXCLUDE_ADMIN_REMOVED } from '../utils/jobModeration.js';

const router = express.Router();

// @route   GET /api/recruiter/warnings
// @desc    Active moderation warnings for the logged-in recruiter
// @access  Private (recruiter)
router.get('/warnings', requireAuth, requireRole('recruiter'), async (req, res) => {
    try {
        const rows = await getActiveWarningsForRecruiter(req.user.id);
        const warnings = rows.map((w) => ({
            _id: w._id,
            reason: w.reason,
            note: w.note || '',
            warnedAt: w.warnedAt,
            isActive: w.isActive,
            job: w.job
                ? { _id: w.job._id, title: w.job.title || 'Untitled listing' }
                : null
        }));
        res.json({ warnings });
    } catch (error) {
        console.error('GET /recruiter/warnings error:', error);
        res.status(500).json({ message: 'Error fetching warnings' });
    }
});

// @route   PATCH /api/recruiter/warnings/:id/dismiss
// @desc    Recruiter removes a moderation warning from their dashboard (does not change job moderation)
// @access  Private (recruiter)
router.patch('/warnings/:id/dismiss', requireAuth, requireRole('recruiter'), async (req, res) => {
    try {
        const updated = await dismissRecruiterWarningForRecruiter(req.params.id, req.user.id);
        if (!updated) {
            return res.status(404).json({ message: 'Warning not found' });
        }
        res.json({ success: true });
    } catch (error) {
        console.error('PATCH /recruiter/warnings/:id/dismiss error:', error);
        res.status(500).json({ message: 'Error dismissing warning' });
    }
});

// @route   GET /api/recruiter/profile-summary
// @desc    Get recruiter profile summary with stats and verification status
// @access  Private (Recruiter only)
router.get('/profile-summary', requireAuth, async (req, res) => {
    try {
        if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const userId = req.user.id;
        const user = await User.findById(userId).select('-password');
        const company = await Company.findOne({ recruiters: userId });

        // Compute isVerified
        // Recruiter is verified ONLY if:
        // 1. Recruiter KYC status is approved
        // 2. Company status is approved
        const isRecruiterVerified = user.kycStatus === 'approved';
        const isCompanyVerified = company?.status === 'approved';
        const isVerified = isRecruiterVerified && isCompanyVerified;

        const jobListFilter = { recruiter_id: userId, ...RECRUITER_JOB_EXCLUDE_ADMIN_REMOVED };
        // Compute statistics dynamically
        const totalJobs = await Job.countDocuments(jobListFilter);
        const activeJobs = await Job.countDocuments({ ...jobListFilter, status: 'Active' });

        // Total applications linked to jobs posted by this recruiter
        // First find all job IDs by this recruiter
        const recruiterJobs = await Job.find(jobListFilter).select('_id');
        const jobIds = recruiterJobs.map(job => job._id);

        const totalApplications = await Application.countDocuments({ job_id: { $in: jobIds } });

        // Successful Hires: applications with status 'hired' linked to recruiter jobs
        const successfulHires = await Application.countDocuments({
            job_id: { $in: jobIds },
            status: 'hired'
        });

        res.json({
            user,
            company: company || null,
            isVerified,
            verificationDetails: {
                recruiterKyc: user.kycStatus,
                companyStatus: company?.status || 'none'
            },
            stats: {
                totalJobs,
                activeJobs,
                totalApplications,
                successfulHires
            }
        });

    } catch (error) {
        console.error('Error fetching recruiter profile summary:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/recruiter/jobs/stats
// @desc    Get detailed stats for recruiter jobs
router.get('/jobs/stats', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;

        const jobListFilter = { recruiter_id: userId, ...RECRUITER_JOB_EXCLUDE_ADMIN_REMOVED };
        const totalJobs = await Job.countDocuments(jobListFilter);
        const activeJobs = await Job.countDocuments({ ...jobListFilter, status: 'Active' });
        const closedJobs = await Job.countDocuments({ ...jobListFilter, status: 'Closed' });

        // Calculate total applicants across all jobs
        const recruiterJobs = await Job.find(jobListFilter).select('_id');
        const jobIds = recruiterJobs.map(job => job._id);
        const totalApplicants = await Application.countDocuments({ job_id: { $in: jobIds } });

        res.json({
            total: totalJobs,
            active: activeJobs,
            closed: closedJobs,
            applicants: totalApplicants
        });
    } catch (error) {
        console.error('Error fetching job stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/recruiter/jobs
// @desc    Get recruiter's jobs with filters and applicant counts
router.get('/jobs', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, type, sort = 'recent' } = req.query;

        // Convert userId to ObjectId for aggregation
        let query = {
            recruiter_id: new mongoose.Types.ObjectId(userId),
            ...RECRUITER_JOB_EXCLUDE_ADMIN_REMOVED
        };

        // Filters
        if (status && status !== 'All Status') {
            query.status = status;
        }
        if (type && type !== 'All Types') {
            query.type = type;
        }

        // Sorting
        let sortOption = { createdAt: -1 }; // Default recent
        if (sort === 'oldest') {
            sortOption = { createdAt: 1 };
        }

        // Fetch jobs (using aggregation to get applicant count would be ideal, 
        // but for <100 jobs, a separate count or lean query is fine. 
        // Let's use aggregation for performance).

        const jobs = await Job.aggregate([
            { $match: query },
            { $sort: sortOption },
            {
                $lookup: {
                    from: 'applications',
                    localField: '_id',
                    foreignField: 'job_id',
                    as: 'applications'
                }
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    status: 1,
                    type: 1,
                    location: 1,
                    createdAt: 1,
                    posted_at: 1,
                    views_count: 1,
                    applicants_count: { $size: '$applications' },
                    moderationStatus: 1,
                    moderationNote: 1,
                    warningMessage: 1,
                    warningDeadline: 1,
                    warningAcknowledged: 1,
                    reportCount: 1,
                    id: '$_id'
                }
            }
        ]);

        res.json(jobs);

    } catch (error) {
        console.error('Error fetching recruiter jobs:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/recruiter/jobs/:id
router.delete('/jobs/:id', requireAuth, async (req, res) => {
    try {
        const job = await Job.findOne({ _id: req.params.id, recruiter_id: req.user.id });

        if (!job) {
            return res.status(404).json({ message: 'Job not found or unauthorized' });
        }

        await Job.findByIdAndDelete(req.params.id);
        await cancelInterviewsForJob(req.params.id, {
            reason: 'Job listing was deleted',
            cancelledByUserId: req.user.id
        });

        // Optional: DELETE associated applications or keep for records?
        // Usually safer to keep or mark deleted. For now, just delete job.

        res.json({ message: 'Job deleted successfully' });
    } catch (error) {
        console.error('Error deleting job:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/recruiter/jobs/:id
router.put('/jobs/:id', requireAuth, async (req, res) => {
    try {
        const job = await Job.findOne({ _id: req.params.id, recruiter_id: req.user.id });
        if (!job) {
            return res.status(404).json({ message: 'Job not found or unauthorized' });
        }

        const normalizedMs = normalizeModerationStatusForEdit(job.moderationStatus);
        if (normalizedMs === 'deleted') {
            return res.status(403).json({ message: 'This job was permanently removed and cannot be edited.' });
        }

        const { title, type, location, status, description, salary_range, requirements } = req.body;

        if (title) job.title = title;
        if (type) job.type = type;
        if (location) job.location = location;
        if (status) job.status = status;
        if (description) job.description = description;
        if (salary_range) job.salary_range = salary_range;
        if (requirements) job.requirements = requirements;

        if (!Array.isArray(job.moderationHistory)) {
            job.moderationHistory = [];
        }
        if (normalizedMs === 'hidden') {
            job.moderationStatus = 'pending_review';
            job.warningMessage = '';
            job.warningDeadline = null;
            job.warningAcknowledged = false;
            job.moderationHistory.push({
                action: 'resubmitted',
                note: 'Recruiter edited and resubmitted',
                changedBy: new mongoose.Types.ObjectId(req.user.id)
            });
        } else if (normalizedMs === 'warned') {
            job.moderationStatus = 'active';
            job.warningMessage = '';
            job.warningDeadline = null;
            job.warningAcknowledged = false;
            job.moderationHistory.push({
                action: 'warning_resolved',
                note: 'Recruiter edited after warning',
                changedBy: new mongoose.Types.ObjectId(req.user.id)
            });
        }

        await job.save();
        if (normalizedMs === 'warned') {
            await deactivateWarningsForJob(job._id, req.user.id);
        }
        res.json(job);

    } catch (error) {
        console.error('Error updating job:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// @route   GET /api/recruiter/applications
// @desc    Get all applications for the logged-in recruiter (Dashboard view)
router.get('/applications', requireAuth, async (req, res) => {
    try {
        const recruiterId = req.user.id;

        // 1. Find all jobs posted by this recruiter (exclude admin-hidden/deleted)
        const jobs = await Job.find({ recruiter_id: recruiterId, ...RECRUITER_JOB_EXCLUDE_ADMIN_REMOVED }).select(
            '_id title status'
        );
        const jobIds = jobs.map(j => j._id);

        if (jobIds.length === 0) {
            return res.json([]);
        }

        // 2. Find applications for these jobs
        const applications = await Application.find({ job_id: { $in: jobIds } })
            .populate('seeker_id', 'fullName email') // Populate basic user info
            .populate('job_id', 'title status location') // Populate job info
            .sort({ createdAt: -1 });

        // 3. Format response
        const formattedApplications = applications.map(app => ({
            _id: app._id,
            applicantName: app.personalInfo?.fullName || app.seeker_id?.fullName || 'Unknown',
            applicantEmail: app.personalInfo?.email || app.seeker_id?.email,
            jobTitle: app.job_id?.title || 'Unknown Job',
            jobId: app.job_id?._id,
            status: app.status,
            appliedAt: app.createdAt,
            resumeUrl: app.resumeUrl,
            resumeType: app.resumeType,
            coverLetter: app.coverLetter
        }));

        res.json(formattedApplications);
    } catch (error) {
        console.error("Fetch recruiter applications error:", error);
        res.status(500).json({ message: 'Error fetching applications' });
    }
});

export default router;
