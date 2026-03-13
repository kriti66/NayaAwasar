import User from '../models/User.js';
import KYC from '../models/KYC.js';
import ActivityLog from '../models/ActivityLog.js';
import Company from '../models/Company.js';
import Job from '../models/Job.js';
import { logActivity } from '../utils/activityLogger.js';

/**
 * GET /api/admin/stats
 * Returns: totalUsers, pendingKycCount, approvedKycCount, rejectedKycCount, totalCompanies
 */
export const getStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({});
        const pendingKycCount = await KYC.countDocuments({ status: 'pending' });
        const approvedKycCount = await KYC.countDocuments({ status: 'approved' });
        const rejectedKycCount = await KYC.countDocuments({ status: 'rejected' });
        const totalCompanies = await Company.countDocuments({});

        return res.json({
            totalUsers,
            pendingKycCount,
            approvedKycCount,
            rejectedKycCount,
            totalCompanies
        });
    } catch (error) {
        console.error('Admin getStats error:', error);
        return res.status(500).json({ message: 'Error fetching admin stats' });
    }
};

/**
 * GET /api/admin/activities
 * Returns: List of latest ActivityLog records
 */
export const getActivityLogs = async (req, res) => {
    try {
        const { limit = 20 } = req.query;
        const activities = await ActivityLog.find({})
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate('userId', 'fullName email role')
            .lean();

        res.json(activities);
    } catch (error) {
        console.error('Admin getActivityLogs error:', error);
        res.status(500).json({ message: 'Error fetching activity logs' });
    }
};

/**
 * GET /api/admin/companies
 * Returns: List of all companies with recruiter info and job counts
 */
export const getAllCompanies = async (req, res) => {
    try {
        const companies = await Company.find({})
            .populate('recruiters', 'fullName email kycStatus')
            .sort({ createdAt: -1 });

        // Add job counts manually or via aggregation
        const companiesWithStats = await Promise.all(companies.map(async (company) => {
            const totalJobs = await Job.countDocuments({ company_id: company._id });
            return {
                ...company.toObject(),
                totalJobs
            };
        }));

        res.json(companiesWithStats);
    } catch (error) {
        console.error('Admin getAllCompanies error:', error);
        res.status(500).json({ message: 'Error fetching companies' });
    }
};

/**
 * GET /api/admin/companies/:id
 * Returns: Full company details with history
 */
export const getCompanyDetails = async (req, res) => {
    try {
        const company = await Company.findById(req.params.id)
            .populate('recruiters', 'fullName email kycStatus')
            .populate('adminFields.reviewHistory.adminId', 'fullName role');

        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        const totalJobs = await Job.countDocuments({ company_id: company._id });
        const companyObj = company.toObject();
        companyObj.stats = { totalJobs };

        res.json(companyObj);
    } catch (error) {
        console.error('Admin getCompanyDetails error:', error);
        res.status(500).json({ message: 'Error fetching company details' });
    }
};

/**
 * PATCH /api/admin/companies/:id/status
 * Updates company status and adds review history
 */
export const updateCompanyStatus = async (req, res) => {
    try {
        const { status, comment } = req.body;
        const company = await Company.findById(req.params.id);

        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        const validStatuses = ['draft', 'submitted', 'pending', 'waiting_for_recruiter_approval', 'approved', 'rejected', 'suspended'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        // Backend validation: company cannot be approved before recruiter approval
        if (status === 'approved') {
             // Check if at least one recruiter associated with the company is approved
             const hasApprovedRecruiter = await User.exists({ 
                 _id: { $in: company.recruiters }, 
                 kycStatus: 'approved' 
             });
             
             if (!hasApprovedRecruiter) {
                 return res.status(400).json({ 
                     message: 'Company cannot be approved because the associated recruiter identity is not approved yet.' 
                 });
             }
        }
        
        company.status = status;

        if (status === 'rejected') {
            if (!comment || comment.trim() === '') {
                return res.status(400).json({ message: 'Rejection reason is required' });
            }
            company.adminFeedback = comment;
        } else if (status === 'approved') {
            // Clear feedback on approval
            company.adminFeedback = '';
        }

        company.adminFields.moderationStatus = (status === 'approved') ? 'approved' : (status === 'suspended' ? 'suspended' : 'rejected');
        company.adminFields.reviewHistory.push({
            action: status,
            adminId: req.user.id,
            comment: comment || (status === 'approved' ? 'Approved by admin' : `Status updated to ${status}`)
        });

        await company.save();

        // Log Activity
        await logActivity(
            req.user.id,
            'COMPANY_STATUS_UPDATE',
            `Company '${company.name}' status updated to ${status}`,
            { companyId: company._id }
        );

        res.json({ message: `Company status updated to ${status}`, company });
    } catch (error) {
        console.error('Admin updateCompanyStatus error:', error);
        res.status(500).json({ message: 'Error updating company status' });
    }
};


