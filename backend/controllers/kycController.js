import KYC from '../models/KYC.js';
import User from '../models/User.js';
import Company from '../models/Company.js';
import { validateJobSeekerKYC, validateRecruiterKYC } from '../services/kycValidation.js';
import { logActivity } from '../utils/activityLogger.js';
import { createNotification, notifyAdmins } from './notificationController.js';

/**
 * POST /api/kyc/submit
 * Create or update KYC; set user.kycStatus = 'pending', clear user.kycRejectionReason.
 */
export const submitKYC = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const { role: submittedRole, ...body } = req.body;

        if (userRole !== 'jobseeker' && userRole !== 'recruiter') {
            return res.status(403).json({ message: 'KYC is not applicable for your role' });
        }
        if (submittedRole !== userRole) {
            return res.status(400).json({ message: 'KYC role must match your account role' });
        }

        if (userRole === 'jobseeker') {
            const validation = validateJobSeekerKYC(body);
            if (!validation.valid) return res.status(400).json({ message: validation.message });
        } else {
            const validation = validateRecruiterKYC(body);
            if (!validation.valid) return res.status(400).json({ message: validation.message });
        }

        let existingKYC = await KYC.findOne({ userId });
        if (existingKYC && existingKYC.status === 'approved') {
            return res.status(400).json({ message: 'KYC is already approved' });
        }
        if (existingKYC && existingKYC.status === 'resubmission_locked') {
            return res.status(403).json({ message: 'You have reached the maximum verification resubmission limit. Please contact admin/support for manual review.' });
        }

        const kycPayload = {
            userId,
            role: userRole,
            status: 'pending',
            rejectionReason: null,
            documentType: body.idType || body.documentType,
            documentFront: body.documentFront,
            documentBack: body.documentBack,
            fullName: body.fullName?.trim(),
            dateOfBirth: body.dateOfBirth,
            nationality: body.nationality?.trim(),
            address: body.address?.trim(),
            idType: body.idType,
            idNumber: body.idNumber?.trim(),
            selfieWithId: body.selfieWithId || undefined,
            jobTitle: body.jobTitle?.trim(),
            officialEmail: body.officialEmail?.trim(),
            phoneNumber: body.phoneNumber?.trim(),
            companyName: body.companyName?.trim(),
            registrationNumber: body.registrationNumber?.trim(),
            industry: body.industry?.trim(),
            companyAddress: body.companyAddress?.trim(),
            website: body.website?.trim() || undefined,
            registrationDocument: body.registrationDocument,
            taxDocument: body.taxDocument,
            companyLogo: body.companyLogo || undefined,
            idFront: body.idFront,
            idBack: body.idBack
        };

        if (existingKYC) {
            if (existingKYC.status === 'rejected') {
                kycPayload.resubmissionCount = (existingKYC.resubmissionCount || 0) + 1;
            }
            existingKYC = await KYC.findOneAndUpdate(
                { userId },
                { $set: kycPayload },
                { new: true, runValidators: true }
            );
        } else {
            existingKYC = await KYC.create(kycPayload);
        }

        await User.findByIdAndUpdate(userId, {
            kycStatus: 'pending',
            isKycSubmitted: true,
            isKycVerified: false,
            kycRejectionReason: null
        });

        // Also create/update company for recruiters
        if (userRole === 'recruiter') {
            let company = await Company.findOne({ recruiters: userId });
            
            const companyPayload = {
                name: body.companyName?.trim(),
                industry: body.industry?.trim() || 'Not Specified',
                size: '1-10 employees', // Default required field
                headquarters: body.companyAddress?.trim() || 'Not Specified',
                contact: {
                    email: body.officialEmail?.trim() || req.user.email,
                    address: body.companyAddress?.trim() || 'Not Specified'
                },
                website: body.website?.trim() || undefined,
                logo: body.companyLogo || undefined,
                status: 'waiting_for_recruiter_approval'
            };

            if (company) {
                 await Company.findByIdAndUpdate(company._id, { 
                     $set: { ...companyPayload, status: 'waiting_for_recruiter_approval' },
                     $addToSet: { recruiters: userId }
                 });
            } else {
                 await Company.create({
                     ...companyPayload,
                     recruiters: [userId]
                 });
            }
        }

        await logActivity(
            userId,
            'KYC_SUBMITTED',
            `KYC application submitted by '${submittedRole}'.`,
            { role: submittedRole }
        );

        await notifyAdmins({
            type: submittedRole === 'recruiter' ? 'recruiter_kyc_submitted' : 'kyc_submitted',
            category: submittedRole === 'recruiter' ? 'recruiter' : 'application',
            title: 'New KYC Submission',
            message: `A ${submittedRole} submitted verification. Review in KYC Panel.`,
            link: '/admin/kyc',
            metadata: { userId }
        });

        return res.status(201).json({
            success: true,
            message: 'KYC submitted successfully. Your documents are under review.',
            data: existingKYC
        });
    } catch (error) {
        console.error('KYC Submission Error:', error);
        return res.status(500).json({ message: 'Error submitting KYC', error: error.message });
    }
};

/**
 * GET /api/kyc/status - Current user's KYC status (from User + KYC).
 */
export const getKYCStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('kycStatus kycRejectionReason kycCompletedAt').lean();
        const kyc = await KYC.findOne({ userId }).lean();

        if (!user) return res.status(404).json({ message: 'User not found' });

        let companyStatus = null;
        if (req.user.role === 'recruiter') {
             const company = await Company.findOne({ recruiters: userId }).select('status').lean();
             if (company) {
                 companyStatus = company.status;
             }
        }

        return res.json({
            kycStatus: user.kycStatus || 'not_submitted',
            isKycSubmitted: user.isKycSubmitted || false,
            isKycVerified: user.isKycVerified || false,
            kycRejectionReason: user.kycRejectionReason || null,
            kycData: kyc || null,
            kycCompletedAt: user.kycCompletedAt || null,
            companyStatus: companyStatus,
            resubmissionCount: kyc?.resubmissionCount || 0
        });
    } catch (error) {
        console.error('KYC Status Error:', error);
        return res.status(500).json({ message: 'Error fetching KYC status' });
    }
};

/**
 * GET /api/admin/kyc/pending - List pending KYC with user info, submitted date, documentFront/documentBack.
 */
export const getPendingKYC = async (req, res) => {
    try {
        const list = await KYC.find({ status: 'pending' })
            .populate('userId', 'fullName email role')
            .sort({ updatedAt: -1 })
            .lean();

        const pending = list.map((doc) => ({
            ...doc, // Spread all fields from the document first
            _id: doc._id,
            userId: doc.userId?._id || doc.userId, // Explicit ID for routing
            user: doc.userId, // Populated object for full context
            fullName: doc.fullName || doc.userId?.fullName,
            email: doc.userId?.email,
            submittedDate: doc.createdAt,
            documentFront: doc.documentFront || doc.idFront,
            documentBack: doc.documentBack || doc.idBack,
            documentType: doc.documentType || doc.idType,
        }));

        return res.json(pending);
    } catch (error) {
        console.error('Get Pending KYC Error:', error);
        return res.status(500).json({ message: 'Error fetching pending KYC' });
    }
};

/**
 * PATCH /api/admin/kyc/:userId/approve
 */
export const approveKYCByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        // Search by either the associated userId OR the KYC record's own _id for maximum resilience
        const kyc = await KYC.findOneAndUpdate(
            {
                $or: [
                    { userId: userId },
                    { _id: userId }
                ],
                status: 'pending'
            },
            { status: 'approved', rejectionReason: null },
            { new: true }
        );

        if (!kyc) {
            return res.status(404).json({ message: 'KYC record not found or not pending' });
        }

        await User.findByIdAndUpdate(userId, {
            kycStatus: 'approved',
            isKycVerified: true,
            kycRejectionReason: null,
            kycCompletedAt: new Date(),
            kycVerifiedAt: new Date()
        });

        const approvedUser = await User.findById(userId);
        await logActivity(
            req.user.id,
            'KYC_APPROVED',
            `KYC for '${approvedUser?.fullName || 'User'}' approved.`,
            { userId }
        );

        // Notify User
        await createNotification({
            recipient: userId,
            type: 'kyc_update',
            title: 'KYC Approved',
            message: 'Your personal KYC application has been approved.',
            link: '/kyc/status',
            sender: req.user.id
        });

        if (approvedUser?.role === 'recruiter') {
             const updated = await Company.updateMany(
                 { recruiters: userId, status: 'waiting_for_recruiter_approval' },
                 { $set: { status: 'pending', 'adminFields.moderationStatus': 'under_review' } }
             );
             if (updated.modifiedCount > 0) {
                 const company = await Company.findOne({ recruiters: userId }).lean();
                 if (company) {
                     await notifyAdmins({
                         type: 'company_verification_submitted',
                         category: 'company',
                         title: 'Company Pending Review',
                         message: `${company.name} is now pending verification. Review in Manage Companies.`,
                         link: '/admin/companies',
                         metadata: { companyId: company._id }
                     });
                 }
             }
        }

        return res.json({ success: true, message: 'KYC approved successfully' });
    } catch (error) {
        console.error('Approve KYC By UserId Error:', error);
        return res.status(500).json({ message: 'Error approving KYC' });
    }
};

/**
 * PATCH /api/admin/kyc/:userId/reject - Body: { rejectionReason } (required).
 */
export const rejectKYCByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        const { rejectionReason } = req.body;

        if (!rejectionReason || typeof rejectionReason !== 'string' || !rejectionReason.trim()) {
            return res.status(400).json({ message: 'Rejection reason is required' });
        }

        const reason = rejectionReason.trim();
        // Search by either the associated userId OR the KYC record's own _id
        const kyc = await KYC.findOne({
            $or: [
                { userId: userId },
                { _id: userId }
            ],
            status: 'pending'
        });

        if (!kyc) {
            return res.status(404).json({ message: 'KYC record not found or not pending' });
        }

        const nextStatus = kyc.resubmissionCount >= 3 ? 'resubmission_locked' : 'rejected';

        kyc.status = nextStatus;
        kyc.rejectionReason = reason;
        kyc.rejectionHistory.push({
            reason: reason,
            rejectedAt: new Date(),
            rejectedBy: req.user.id
        });

        await kyc.save();

        await User.findByIdAndUpdate(userId, {
            kycStatus: nextStatus,
            isKycVerified: false,
            kycRejectionReason: reason
        });

        // Log KYC rejection activity
        const rejectedUser = await User.findById(userId);
        await logActivity(
            req.user.id,
            'KYC_REJECTED',
            `KYC for '${rejectedUser?.fullName || 'User'}' rejected.`,
            { userId }
        );

        // Notify User
        const messageTitle = nextStatus === 'resubmission_locked' ? 'Verification Locked' : 'KYC Application Rejected';
        let messageBody = `Your identity KYC application was rejected. Reason: ${reason}. `;
        if (nextStatus === 'resubmission_locked') {
            messageBody += "You have reached the maximum resubmission limit. Please contact support.";
        } else {
            messageBody += `You have ${3 - (kyc.resubmissionCount || 0)} resubmission attempts remaining. Please update your documents and resubmit.`;
        }

        await createNotification({
            recipient: userId,
            type: 'kyc_rejected',
            category: 'application',
            title: messageTitle,
            message: messageBody,
            link: '/kyc/status',
            metadata: { userId },
            sender: req.user.id
        });

        // Keep company waiting_for_recruiter_approval but it is implicitly blocked.
        // The company cannot be approved.


        return res.json({ success: true, message: 'KYC rejected successfully' });
    } catch (error) {
        console.error('Reject KYC By UserId Error:', error);
        return res.status(500).json({ message: 'Error rejecting KYC' });
    }
};
