import Job from '../models/Job.js';
import { expireOverduePromotions } from '../services/jobListingService.js';

// @route   PATCH /api/admin/jobs/:id/promote
// @desc    Promote a specific job (Admin only)
// @access  Private/Admin
export const promoteJob = async (req, res) => {
    try {
        const { promotionType, promotionStartDate, promotionEndDate, promotionPriority } = req.body;
        const jobId = req.params.id;

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        if (job.status !== 'Active') {
            return res.status(400).json({ message: 'Only active/open jobs can be promoted.' });
        }

        const startDate = new Date(promotionStartDate);
        const endDate = new Date(promotionEndDate);

        if (endDate <= startDate) {
            return res.status(400).json({ message: 'Promotion end date must be after start date.' });
        }

        job.isPromoted = true;
        job.promotionType = promotionType || 'FEATURED';
        job.promotionStartDate = startDate;
        job.promotionEndDate = endDate;
        job.promotionPriority = promotionPriority || 0;

        await job.save();

        res.json({ message: 'Job promoted successfully', job });
    } catch (error) {
        console.error('Job Promotion Error:', error);
        res.status(500).json({ message: 'Server error processing job promotion.' });
    }
};

// @route   PATCH /api/admin/jobs/:id/remove-promotion
// @desc    Remove promotion from a job (Admin only)
// @access  Private/Admin
export const removePromotion = async (req, res) => {
    try {
        const jobId = req.params.id;

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        job.isPromoted = false;
        job.promotionType = 'NONE';
        job.promotionStartDate = null;
        job.promotionEndDate = null;
        job.promotionPriority = 0;

        await job.save();

        res.json({ message: 'Promotion removed successfully', job });
    } catch (error) {
        console.error('Remove Promotion Error:', error);
        res.status(500).json({ message: 'Server error removing job promotion.' });
    }
};

// @route   GET /api/jobs/promoted
// @desc    Fetch active promoted jobs for public page
// @access  Public
export const getPromotedJobs = async (req, res) => {
    try {
        await expireOverduePromotions();
        const currentDate = new Date();

        const promotedJobs = await Job.find({
            status: 'Active',
            moderationStatus: 'Approved',
            isPromoted: true,
            promotionStartDate: { $lte: currentDate },
            promotionEndDate: { $gt: currentDate }
        })
        .sort({ promotionPriority: -1, posted_date: -1 })
        .populate('company_id', 'name logo location')
        .lean();

        res.json(promotedJobs);
    } catch (error) {
        console.error('Get Promoted Jobs Error:', error);
        res.status(500).json({ message: 'Server error fetching promoted jobs.' });
    }
};
