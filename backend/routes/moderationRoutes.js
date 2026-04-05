import express from 'express';
import mongoose from 'mongoose';
import Job from '../models/Job.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import {
    createRecruiterWarningFromJobWarn,
    deactivateWarningsForJob,
    resolveRecruiterWarningById
} from '../services/recruiterWarningService.js';
import { cancelInterviewsForJob } from '../services/interviewJobCleanup.js';

const router = express.Router();

router.use(requireAuth, requireAdmin);

const LIST_FILTERS = {
    active: {
        $or: [
            { moderationStatus: 'active' },
            { moderationStatus: 'Approved' },
            { moderationStatus: { $exists: false } },
            { moderationStatus: null },
            { moderationStatus: '' }
        ]
    },
    warned: {
        $or: [{ moderationStatus: 'warned' }, { moderationStatus: 'Flagged' }]
    },
    hidden: {
        $or: [{ moderationStatus: 'hidden' }, { moderationStatus: 'Hidden' }]
    },
    pending_review: {
        $or: [{ moderationStatus: 'pending_review' }, { moderationStatus: 'Under Review' }]
    },
    deleted: { moderationStatus: 'deleted' }
};

router.get('/jobs', async (req, res) => {
    try {
        const rawStatus = (req.query.status || 'active').trim();
        const filter = LIST_FILTERS[rawStatus] || LIST_FILTERS.active;
        const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit), 10) || 10));
        const skip = (page - 1) * limit;

        const [jobs, total] = await Promise.all([
            Job.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('recruiter_id', 'fullName email')
                .populate('company_id', 'name status verificationStatus adminFields')
                .lean(),
            Job.countDocuments(filter)
        ]);

        const enriched = jobs.map((j) => {
            const c = j.company_id;
            return {
                ...j,
                recruiterName: j.recruiter_id?.fullName,
                recruiterEmail: j.recruiter_id?.email,
                companyName: c?.name,
                companyKycStatus: c?.status,
                companyVerificationStatus: c?.verificationStatus,
                companyAdminModeration: c?.adminFields?.moderationStatus
            };
        });

        res.json({
            jobs: enriched,
            total,
            page,
            limit,
            pages: Math.ceil(total / limit) || 1
        });
    } catch (error) {
        console.error('admin moderation list error:', error);
        res.status(500).json({ message: 'Error fetching jobs' });
    }
});

router.patch('/jobs/:id/warn', async (req, res) => {
    try {
        const message = String(req.body?.message || '').trim();
        const extraNote = String(req.body?.note ?? '').trim();
        if (!message) {
            return res.status(400).json({ message: 'Warning message is required' });
        }
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ message: 'Job not found' });

        if (!Array.isArray(job.moderationHistory)) {
            job.moderationHistory = [];
        }

        job.moderationStatus = 'warned';
        job.warningMessage = message;
        job.warningDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000);
        job.warningAcknowledged = false;
        job.moderationHistory.push({
            action: 'warned',
            note: message,
            changedBy: new mongoose.Types.ObjectId(req.user.id)
        });
        await job.save();

        await createRecruiterWarningFromJobWarn({
            recruiterId: job.recruiter_id,
            jobId: job._id,
            reason: message,
            note: extraNote,
            warnedByUserId: req.user.id
        });
        const populated = await Job.findById(job._id)
            .populate('recruiter_id', 'fullName email')
            .populate('company_id', 'name status verificationStatus adminFields');
        res.json(populated);
    } catch (error) {
        console.error('moderation warn error:', error);
        res.status(500).json({ message: 'Error updating job' });
    }
});

router.patch('/jobs/:id/hide', async (req, res) => {
    try {
        const reason = String(req.body?.reason || '').trim();
        if (!reason) {
            return res.status(400).json({ message: 'Reason is required' });
        }
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ message: 'Job not found' });

        if (!Array.isArray(job.moderationHistory)) {
            job.moderationHistory = [];
        }

        job.moderationStatus = 'hidden';
        job.moderationNote = reason;
        job.warningMessage = '';
        job.warningDeadline = null;
        job.moderationHistory.push({
            action: 'hidden',
            note: reason,
            changedBy: new mongoose.Types.ObjectId(req.user.id)
        });
        await job.save();
        await cancelInterviewsForJob(job._id, {
            reason: 'Job was removed by admin',
            cancelledByUserId: req.user.id
        });
        const populated = await Job.findById(job._id)
            .populate('recruiter_id', 'fullName email')
            .populate('company_id', 'name status verificationStatus adminFields');
        res.json(populated);
    } catch (error) {
        console.error('moderation hide error:', error);
        res.status(500).json({ message: 'Error updating job' });
    }
});

router.patch('/jobs/:id/approve', async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ message: 'Job not found' });

        if (!Array.isArray(job.moderationHistory)) {
            job.moderationHistory = [];
        }

        const ms = job.moderationStatus;
        if (ms !== 'pending_review' && ms !== 'Under Review') {
            return res.status(400).json({ message: 'Only jobs pending review can be approved' });
        }

        job.moderationStatus = 'active';
        job.moderationNote = '';
        job.warningMessage = '';
        job.warningDeadline = null;
        job.warningAcknowledged = false;
        job.moderationHistory.push({
            action: 'approved',
            note: '',
            changedBy: new mongoose.Types.ObjectId(req.user.id)
        });
        await job.save();
        await deactivateWarningsForJob(job._id, req.user.id);
        const populated = await Job.findById(job._id)
            .populate('recruiter_id', 'fullName email')
            .populate('company_id', 'name status verificationStatus adminFields');
        res.json(populated);
    } catch (error) {
        console.error('moderation approve error:', error);
        res.status(500).json({ message: 'Error updating job' });
    }
});

router.patch('/jobs/:id/delete', async (req, res) => {
    try {
        const reason = String(req.body?.reason || '').trim();
        if (!reason) {
            return res.status(400).json({ message: 'Reason is required' });
        }
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ message: 'Job not found' });

        if (!Array.isArray(job.moderationHistory)) {
            job.moderationHistory = [];
        }

        job.moderationStatus = 'deleted';
        job.moderationNote = reason;
        job.moderationHistory.push({
            action: 'deleted',
            note: reason,
            changedBy: new mongoose.Types.ObjectId(req.user.id)
        });
        await job.save();
        await deactivateWarningsForJob(job._id, req.user.id);
        await cancelInterviewsForJob(job._id, {
            reason: 'Job was removed by admin',
            cancelledByUserId: req.user.id
        });
        const populated = await Job.findById(job._id)
            .populate('recruiter_id', 'fullName email')
            .populate('company_id', 'name status verificationStatus adminFields');
        res.json(populated);
    } catch (error) {
        console.error('moderation delete error:', error);
        res.status(500).json({ message: 'Error updating job' });
    }
});

router.patch('/recruiter-warnings/:id/resolve', async (req, res) => {
    try {
        const updated = await resolveRecruiterWarningById(req.params.id, req.user.id);
        if (!updated) return res.status(404).json({ message: 'Warning not found' });
        res.json({ success: true, warning: updated });
    } catch (error) {
        console.error('resolve recruiter warning error:', error);
        res.status(500).json({ message: 'Error resolving warning' });
    }
});

export default router;
