import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Company from '../models/Company.js';

/**
 * A) requireAuth: Verify JWT (Authorization: Bearer <token>), attach payload to req.user.
 * Rejects tokens for soft-deleted users.
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
        req.user = payload; // { id, role } from token
        const uid = payload?.id;
        if (!uid) {
            return res.status(401).json({ message: 'Invalid token payload' });
        }
        User.findById(uid).select('isDeleted').lean()
            .then((u) => {
                if (!u) {
                    return res.status(401).json({ message: 'User not found' });
                }
                if (u.isDeleted) {
                    return res.status(401).json({
                        code: 'ACCOUNT_REMOVED',
                        message: 'This account is no longer active. If you believe this is a mistake, contact support or register again with the same email to restore your account.'
                    });
                }
                next();
            })
            .catch((e) => {
                console.error('requireAuth user lookup:', e);
                res.status(500).json({ message: 'Authentication error' });
            });
    });
};

/**
 * B) requireAdmin: Uses requireAuth (must be applied after requireAuth).
 * Checks req.user.role === 'admin'; returns 403 if not admin.
 */
export const requireAdmin = async (req, res, next) => {
    try {
        // Fast-path when token already has admin role
        if (req.user?.role === 'admin') {
            return next();
        }

        // Fallback: trust latest DB role in case JWT role is stale
        if (req.user?.id) {
            const user = await User.findById(req.user.id).select('role').lean();
            if (user?.role === 'admin') {
                req.user.role = 'admin';
                return next();
            }
        }

        return res.status(403).json({ message: 'Forbidden: Admin access required' });
    } catch (error) {
        console.error('requireAdmin error:', error);
        return res.status(500).json({ message: 'Error validating admin access' });
    }
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
            pending: 'Your company profile is under review by admin.',
            waiting_for_recruiter_approval: 'Your company will be reviewed once your recruiter identity is approved.',
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

// ... existing code ...

/**
 * E) requireKycVerified: Checks user.isKycVerified === true.
 * Used for actions like applying to jobs.
 */
export const requireKycVerified = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id)
            .select('isKycVerified isKycSubmitted kycStatus kycRejectionReason role')
            .lean();
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check boolean flag OR status approved (to be safe)
        if (user.isKycVerified === true || user.kycStatus === 'approved') {
            return next();
        }

        const kycStatus = user.kycStatus || 'not_submitted';
        const statusMap = {
            not_submitted: {
                code: 'KYC_REQUIRED',
                message: 'You need to complete your KYC verification before applying for jobs.',
                nextStep: 'Complete KYC',
                redirectPath: user.role === 'jobseeker' ? '/kyc/job-seeker' : '/kyc/status'
            },
            pending: {
                code: 'KYC_PENDING',
                message: 'Your KYC verification is still under review. You can apply after admin approval.',
                nextStep: 'View KYC Status',
                redirectPath: '/kyc/status'
            },
            rejected: {
                code: 'KYC_REJECTED',
                message: user.kycRejectionReason
                    ? `Your KYC verification was rejected: ${user.kycRejectionReason}. Please update your details and resubmit.`
                    : 'Your KYC verification was rejected. Please review your details and resubmit before applying.',
                nextStep: 'Update KYC',
                redirectPath: user.role === 'jobseeker' ? '/kyc/job-seeker' : '/kyc/status'
            },
            resubmission_locked: {
                code: 'KYC_NOT_APPROVED',
                message: 'Your KYC verification is currently locked. Please contact support or check your KYC status.',
                nextStep: 'View KYC Status',
                redirectPath: '/kyc/status'
            }
        };

        const payload = statusMap[kycStatus] || {
            code: 'KYC_NOT_APPROVED',
            message: 'Job application is available only for verified jobseekers.',
            nextStep: 'View KYC Status',
            redirectPath: '/kyc/status'
        };

        return res.status(403).json({
            success: false,
            ...payload,
            kycStatus
        });
    } catch (error) {
        console.error('requireKycVerified error:', error);
        return res.status(500).json({ message: 'Error checking verification status' });
    }
};

// ... existing code ...

/**
 * F) requireRole: Middleware generator to check if user has one of the allowed roles.
 */
export const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'You are not allowed to perform this action.' });
        }
        next();
    };
};

export const requireRecruiter = requireRole('recruiter');

// Middleware to require recruiter KYC approval
export const requireRecruiterKycApproved = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.role === 'recruiter' && (user.recruiterKycStatus === 'approved' || user.kycStatus === 'approved')) {
            return next();
        }

        // Admins can bypass
        if (user.role === 'admin') {
            return next();
        }

        return res.status(403).json({
            code: 'KYC_REQUIRED',
            message: 'Recruiter KYC verification required to perform this action.'
        });
    } catch (error) {
        console.error("KYC Check Error:", error);
        res.status(500).json({ message: 'Server error checking KYC status.' });
    }
};

export const getJwtSecret = () => process.env.JWT_SECRET || 'supersecretkey';


