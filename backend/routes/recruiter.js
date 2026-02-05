
import express from 'express';
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

export default router;
