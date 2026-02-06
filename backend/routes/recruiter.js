
import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Company from '../models/Company.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

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

        // Compute statistics dynamically
        const totalJobs = await Job.countDocuments({ recruiter_id: userId });
        const activeJobs = await Job.countDocuments({ recruiter_id: userId, status: 'Active' });

        // Total applications linked to jobs posted by this recruiter
        // First find all job IDs by this recruiter
        const recruiterJobs = await Job.find({ recruiter_id: userId }).select('_id');
        const jobIds = recruiterJobs.map(job => job._id);

        const totalApplications = await Application.countDocuments({ job_id: { $in: jobIds } });

        // Successful Hires: applications with status 'Offer Extended' linked to recruiter jobs
        const successfulHires = await Application.countDocuments({
            job_id: { $in: jobIds },
            status: 'Offer Extended'
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

        const totalJobs = await Job.countDocuments({ recruiter_id: userId });
        const activeJobs = await Job.countDocuments({ recruiter_id: userId, status: 'Active' });
        const closedJobs = await Job.countDocuments({ recruiter_id: userId, status: 'Closed' });

        // Calculate total applicants across all jobs
        const recruiterJobs = await Job.find({ recruiter_id: userId }).select('_id');
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
        let query = { recruiter_id: new mongoose.Types.ObjectId(userId) };

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
                    createdAt: 1, // Ensure timestamp works
                    posted_at: 1, // Fallback if schema uses this
                    views_count: 1, // From schema
                    applicants_count: { $size: '$applications' }, // Count array
                    id: '$_id' // Frontend friendly id
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
        let job = await Job.findOne({ _id: req.params.id, recruiter_id: req.user.id });
        if (!job) {
            return res.status(404).json({ message: 'Job not found or unauthorized' });
        }

        // Update fields
        const { title, type, location, status, description, salary_range, requirements } = req.body;

        // Only update allowed fields
        if (title) job.title = title;
        if (type) job.type = type;
        if (location) job.location = location;
        if (status) job.status = status;
        if (description) job.description = description;
        if (salary_range) job.salary_range = salary_range;
        if (requirements) job.requirements = requirements;

        await job.save();
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

        // 1. Find all jobs posted by this recruiter
        const jobs = await Job.find({ recruiter_id: recruiterId }).select('_id title status');
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
