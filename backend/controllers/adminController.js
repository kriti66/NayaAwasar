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
            .populate('recruiters', 'fullName email kycStatus recruiterKycStatus')
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
            .populate('recruiters', 'fullName email kycStatus recruiterKycStatus')
            .populate('reviewedBy', 'fullName email')
            .populate('adminFields.reviewHistory.adminId', 'fullName role')
            .populate('adminFields.verificationAuditLog.adminId', 'fullName email');

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
 * Moderation only: suspend / reactivate. Verification approve/reject lives in KYC panel.
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

        if (status === 'rejected') {
            return res.status(403).json({
                success: false,
                message: 'Verification rejection is handled in the KYC panel only.'
            });
        }

        if (!company.adminFields) company.adminFields = {};
        if (!company.adminFields.reviewHistory) company.adminFields.reviewHistory = [];

        if (status === 'approved') {
            if (company.status === 'approved') {
                return res.status(400).json({
                    success: false,
                    message: 'This company is already active (approved).'
                });
            }

            if (company.status !== 'suspended') {
                return res.status(403).json({
                    success: false,
                    message:
                        'Initial company verification is approved automatically when recruiter KYC (representative + company) completes in the KYC panel. You can only use Approve here to reactivate a suspended company.'
                });
            }

            if (!company.recruiters || company.recruiters.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Linked recruiter record was not found.'
                });
            }

            const hasFullRecruiterKyc = await User.exists({
                _id: { $in: company.recruiters },
                recruiterKycStatus: 'approved'
            });

            if (!hasFullRecruiterKyc) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot reactivate: recruiter KYC is not fully approved.'
                });
            }

            company.status = 'approved';
            company.adminFeedback = '';
            company.rejectionReason = '';
            company.verificationStatus = 'approved';
            company.isLockedAfterMaxAttempts = false;
            company.lastReviewedAt = new Date();
            company.reviewedBy = req.user.id;
            company.adminFields.moderationStatus = 'approved';

            if (!company.adminFields.verificationAuditLog) company.adminFields.verificationAuditLog = [];
            company.adminFields.verificationAuditLog.push({
                date: new Date(),
                action: 'approved',
                adminId: req.user.id,
                reapplyCount: company.reapplyCount,
                metadata: { source: 'admin_reactivate' }
            });

            company.adminFields.reviewHistory.push({
                action: status,
                adminId: req.user.id,
                comment: comment || 'Company reactivated (unsuspended) by admin'
            });

            await company.save();

            const { createNotification } = await import('./notificationController.js');
            const recruiterIds = company.recruiters || [];
            for (const rid of recruiterIds) {
                await createNotification({
                    recipient: rid,
                    type: 'company_verification_approved',
                    category: 'company',
                    title: 'Company reactivated',
                    message: `Your company "${company.name}" is active again. You can post jobs as before.`,
                    link: '/recruiter/company',
                    metadata: { companyId: company._id },
                    sender: req.user.id
                });
            }

            await logActivity(
                req.user.id,
                'COMPANY_STATUS_UPDATE',
                `Company '${company.name}' reactivated (unsuspended)`,
                { companyId: company._id }
            );

            return res.json({
                success: true,
                message: 'Company reactivated successfully.',
                company
            });
        }

        if (status === 'suspended') {
            if (!comment || !comment.trim()) {
                return res.status(400).json({ success: false, message: 'A reason is required to suspend a company.' });
            }

            company.status = 'suspended';
            company.adminFeedback = comment.trim();
            company.lastReviewedAt = new Date();
            company.reviewedBy = req.user.id;
            company.adminFields.moderationStatus = 'suspended';

            company.adminFields.reviewHistory.push({
                action: status,
                adminId: req.user.id,
                comment: comment.trim()
            });

            await company.save();

            const { createNotification } = await import('./notificationController.js');
            const recruiterIds = company.recruiters || [];
            for (const rid of recruiterIds) {
                await createNotification({
                    recipient: rid,
                    type: 'company_suspended',
                    category: 'company',
                    title: 'Company suspended',
                    message: `Your company "${company.name}" has been suspended. Reason: ${comment.trim()}`,
                    link: '/recruiter/company',
                    metadata: { companyId: company._id },
                    sender: req.user.id
                });
            }

            await logActivity(
                req.user.id,
                'COMPANY_STATUS_UPDATE',
                `Company '${company.name}' suspended`,
                { companyId: company._id }
            );

            return res.json({
                success: true,
                message: 'Company suspended.',
                company
            });
        }

        return res.status(400).json({
            success: false,
            message: 'This endpoint only supports suspend or reactivate (approve from suspended). Use the KYC panel for verification.'
        });
    } catch (error) {
        console.error('Admin updateCompanyStatus error:', error);
        res.status(500).json({ success: false, message: 'Error updating company status' });
    }
};


