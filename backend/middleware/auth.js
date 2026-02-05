import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Company from '../models/Company.js';

/**
 * A) requireAuth: Verify JWT (Authorization: Bearer <token>), attach payload to req.user.
 */
export const requireAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }
    jwt.verify(token, getJwtSecret(), (err, payload) => {
        if (err) {
            console.error("JWT Verify Error in requireAuth:", err.message);
            return res.status(401).json({
                code: 'SESSION_EXPIRED',
                message: 'Session expired. Please login again.'
            });
        }
        console.log("JWT Verified. Payload:", payload);
        req.user = payload; // { id, role } from token
        next();
    });
};

/**
 * B) requireAdmin: Uses requireAuth (must be applied after requireAuth).
 * Checks req.user.role === 'admin'; returns 403 if not admin.
 */
export const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }
    next();
};

/**
 * C) requireKycApproved: Uses requireAuth. Fetches user from DB to get current kycStatus.
 */
export const requireKycApproved = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('role kycStatus kycRejectionReason').lean();
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.role === 'admin') {
            return next();
        }
        if (user.kycStatus === 'approved') {
            return next();
        }
        const messages = {
            not_submitted: 'Please complete KYC to continue.',
            pending: 'Your KYC is under review.',
            rejected: 'Your KYC was rejected.' + (user.kycRejectionReason ? ` ${user.kycRejectionReason}` : '')
        };
        const message = messages[user.kycStatus] || 'Please complete KYC to continue.';
        return res.status(403).json({
            code: 'KYC_NOT_APPROVED',
            kycStatus: user.kycStatus,
            message,
            rejectionReason: user.kycRejectionReason || undefined
        });
    } catch (error) {
        console.error('requireKycApproved error:', error);
        return res.status(500).json({ message: 'Error checking KYC status' });
    }
};

/**
 * D) requireCompanyApproved: Checks if the recruiter's company is approved.
 */
export const requireCompanyApproved = async (req, res, next) => {
    try {
        if (req.user.role === 'admin') return next();
        if (req.user.role !== 'recruiter') return next(); // Only applies to recruiters

        const company = await Company.findOne({ recruiters: req.user.id }).select('status adminFeedback').lean();

        if (!company) {
            return res.status(403).json({
                code: 'COMPANY_PROFILE_MISSING',
                message: 'Please create a company profile before posting jobs.'
            });
        }

        if (company.status === 'approved') {
            return next();
        }

        const messages = {
            draft: 'Your company profile is still a draft. Please submit it for approval.',
            submitted: 'Your company profile is under review by admin.',
            rejected: `Your company profile was rejected. Feedback: ${company.adminFeedback || 'No feedback provided.'}`,
            suspended: 'Your company profile has been suspended. Please contact support.'
        };

        return res.status(403).json({
            code: 'COMPANY_NOT_APPROVED',
            companyStatus: company.status,
            message: messages[company.status] || 'Your company profile must be approved to perform this action.'
        });
    } catch (error) {
        console.error('requireCompanyApproved error:', error);
        return res.status(500).json({ message: 'Error checking company status' });
    }
};

export const getJwtSecret = () => process.env.JWT_SECRET || 'supersecretkey';
