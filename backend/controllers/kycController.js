import KYC from '../models/KYC.js';
import IdentityKyc from '../models/kycModel.js';
import User from '../models/User.js';
import Company from '../models/Company.js';
import { validateJobSeekerKYC, validateRecruiterKYC } from '../services/kycValidation.js';
import { logActivity } from '../utils/activityLogger.js';
import { createNotification, notifyAdmins } from './notificationController.js';
import { NOTIFICATION_TYPES } from '../constants/notificationTypes.js';
import { uploadKycBuffer, IDENTITY_KYC_FIELD_FOLDER } from '../services/cloudinaryKycUpload.js';

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
        const priorKycForNotify = existingKYC
            ? { status: existingKYC.status }
            : null;

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

        const notifyFirstOrResubmitAfterReject =
            !priorKycForNotify || priorKycForNotify.status === 'rejected';
        if (notifyFirstOrResubmitAfterReject) {
            const submitter = await User.findById(userId).select('fullName email').lean();
            const displayName = submitter?.fullName?.trim() || submitter?.email || 'A user';
            const isResubmitAfterRejection = priorKycForNotify?.status === 'rejected';
            const isRecruiterSubmit = submittedRole === 'recruiter';

            if (isResubmitAfterRejection) {
                await notifyAdmins({
                    type: isRecruiterSubmit
                        ? NOTIFICATION_TYPES.RECRUITER_KYC_RESUBMITTED_AFTER_REJECTION
                        : NOTIFICATION_TYPES.KYC_RESUBMITTED_AFTER_REJECTION,
                    category: isRecruiterSubmit ? 'recruiter' : 'application',
                    title: 'KYC Resubmitted',
                    message: isRecruiterSubmit
                        ? `${displayName} resubmitted recruiter verification after a previous rejection. Review in KYC Panel.`
                        : `${displayName} resubmitted their KYC after a previous rejection. Review in KYC Panel.`,
                    link: '/admin/kyc',
                    metadata: { userId, role: submittedRole, resubmissionAfterRejection: true }
                });
            } else if (!priorKycForNotify) {
                await notifyAdmins({
                    type: isRecruiterSubmit
                        ? NOTIFICATION_TYPES.RECRUITER_KYC_NEW_SUBMISSION
                        : NOTIFICATION_TYPES.KYC_NEW_SUBMISSION,
                    category: isRecruiterSubmit ? 'recruiter' : 'application',
                    title: 'New KYC Submission',
                    message: isRecruiterSubmit
                        ? `${displayName} submitted recruiter verification for the first time. Review in KYC Panel.`
                        : `${displayName} submitted verification for the first time. Review in KYC Panel.`,
                    link: '/admin/kyc',
                    metadata: { userId, role: submittedRole, firstSubmission: true }
                });
            }
        }

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
        const list = await KYC.find({ status: { $ne: 'approved' } })
            .populate('userId', 'fullName email role')
            .sort({ updatedAt: -1 })
            .lean();

        const identityList = await IdentityKyc.find({ status: { $ne: 'verified' } })
            .populate('user', 'fullName email role')
            .sort({ updatedAt: -1 })
            .lean();

        const pending = list.map((doc) => ({
            ...doc, // Spread all fields from the document first
            _id: doc._id,
            userId: doc.userId?._id || doc.userId, // Explicit ID for routing
            user: doc.userId, // Populated object for full context
            fullName: doc.fullName || doc.userId?.fullName,
            email: doc.userId?.email,
            submittedAt: doc.createdAt,
            submittedDate: doc.createdAt,
            documentFront: doc.documentFront || doc.idFront,
            documentBack: doc.documentBack || doc.idBack,
            documentType: doc.documentType || doc.idType,
        }));

        const identityPending = identityList.map((doc) => ({
            _id: doc._id,
            userId: doc.user?._id || doc.user,
            user: doc.user,
            role: doc.user?.role || 'jobseeker',
            fullName: doc.fullName || doc.user?.fullName,
            email: doc.user?.email,
            submittedAt: doc.submittedAt || doc.createdAt,
            submittedDate: doc.submittedAt || doc.createdAt,
            status: doc.status,
            address: doc.address,
            nationality: doc.nationality,
            idType: doc.idType,
            idNumber: doc.idNumber,
            dateOfBirth: doc.dob,
            dob: doc.dob,
            documentFront: doc.frontDoc,
            documentBack: doc.backDoc,
            selfieWithId: doc.selfie,
            isIdentityKyc: true
        }));

        return res.json([...pending, ...identityPending]);
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
        let kyc = await KYC.findOneAndUpdate(
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
            const identityKyc = await IdentityKyc.findOneAndUpdate(
                {
                    $or: [
                        { user: userId },
                        { _id: userId }
                    ],
                    status: 'pending'
                },
                { status: 'verified', adminNote: null },
                { new: true }
            );
            if (!identityKyc) {
                return res.status(404).json({ message: 'KYC record not found or not pending' });
            }
            kyc = identityKyc;
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
        let kyc = await KYC.findOne({
            $or: [
                { userId: userId },
                { _id: userId }
            ],
            status: 'pending'
        });

        if (!kyc) {
            const identityKyc = await IdentityKyc.findOne({
                $or: [
                    { user: userId },
                    { _id: userId }
                ],
                status: 'pending'
            });
            if (!identityKyc) {
                return res.status(404).json({ message: 'KYC record not found or not pending' });
            }
            identityKyc.status = 'rejected';
            identityKyc.adminNote = reason;
            await identityKyc.save();

            await User.findByIdAndUpdate(userId, {
                kycStatus: 'rejected',
                isKycVerified: false,
                kycRejectionReason: reason
            });

            await createNotification({
                recipient: userId,
                type: 'kyc_rejected',
                category: 'application',
                title: 'KYC Application Rejected',
                message: `Your identity KYC application was rejected. Reason: ${reason}.`,
                link: '/kyc/status',
                metadata: { userId },
                sender: req.user.id
            });

            return res.json({ success: true, message: 'KYC rejected successfully' });
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

const isAdult = (dobValue) => {
    const dob = new Date(dobValue);
    if (Number.isNaN(dob.getTime())) return false;
    const now = new Date();
    const minAgeDate = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
    return dob <= minAgeDate;
};

const idPatterns = {
    Citizenship: /^[0-9]{7,9}$/,
    Passport: /^(?:[A-Za-z]{1,2}[0-9]{6,7}|[0-9]{8,9})$/,
    'Driving License': /^[A-Za-z0-9]+$/,
    'Voter ID': /^[0-9]{10,11}$/,
    'PAN Card': /^[0-9]{9}$/
};

export const getIdentityKycStatus = async (req, res, next) => {
    try {
        const kyc = await IdentityKyc.findOne({ user: req.user.id }).lean();
        if (!kyc) {
            return res.json({ status: 'not_submitted', data: null });
        }
        return res.json({ status: kyc.status, adminNote: kyc.adminNote || null, data: kyc });
    } catch (err) {
        return next(err);
    }
};

export const submitIdentityKyc = async (req, res, next) => {
    try {
        const existing = await IdentityKyc.findOne({ user: req.user.id }).lean();
        if (existing && (existing.status === 'pending' || existing.status === 'verified')) {
            return res.status(409).json({ message: 'KYC already submitted. Please wait for review.' });
        }

        if (!req.files?.frontDoc?.[0] || !req.files?.selfie?.[0]) {
            return res.status(400).json({ message: 'Front document and selfie are required.' });
        }

        const fullName = String(req.body.fullName || '').trim();
        const dob = req.body.dob;
        const nationality = String(req.body.nationality || 'Nepali').trim();
        const address = String(req.body.address || '').trim();
        const idType = String(req.body.idType || '').trim();
        const idNumber = String(req.body.idNumber || '').trim();

        if (!fullName || /[0-9]/.test(fullName)) {
            return res.status(400).json({ message: 'Full name is required and must not contain numbers.' });
        }
        if (!address) {
            return res.status(400).json({ message: 'Current address is required.' });
        }
        if (!isAdult(dob)) {
            return res.status(400).json({ message: 'You must be at least 18 years old.' });
        }
        if (!idPatterns[idType] || !idPatterns[idType].test(idNumber)) {
            return res.status(400).json({ message: `Invalid ${idType || 'ID'} number format.` });
        }

        const frontFile = req.files.frontDoc[0];
        const selfieFile = req.files.selfie[0];
        const backFile = req.files.backDoc?.[0];

        const frontDoc = await uploadKycBuffer(
            frontFile.buffer,
            frontFile.mimetype,
            IDENTITY_KYC_FIELD_FOLDER.frontDoc
        );
        const selfie = await uploadKycBuffer(
            selfieFile.buffer,
            selfieFile.mimetype,
            IDENTITY_KYC_FIELD_FOLDER.selfie
        );
        const backDoc = backFile
            ? await uploadKycBuffer(backFile.buffer, backFile.mimetype, IDENTITY_KYC_FIELD_FOLDER.backDoc)
            : null;

        const payload = {
            user: req.user.id,
            fullName,
            dob,
            nationality: nationality || 'Nepali',
            address,
            idType,
            idNumber,
            frontDoc,
            backDoc,
            selfie,
            status: 'pending',
            adminNote: null,
            submittedAt: new Date()
        };

        const saved = await IdentityKyc.findOneAndUpdate(
            { user: req.user.id },
            { $set: payload },
            { upsert: true, new: true, runValidators: true }
        );

        const submitter = await User.findById(req.user.id).select('fullName email').lean();
        const displayName = submitter?.fullName?.trim() || submitter?.email || 'A user';
        await notifyAdmins({
            type: NOTIFICATION_TYPES.KYC_NEW_SUBMISSION,
            category: 'application',
            title: 'New KYC Submission',
            message: `${displayName} submitted identity verification. Review in KYC Panel.`,
            link: '/admin/kyc',
            metadata: { userId: req.user.id, identityKycId: saved._id, flow: 'identity_kyc' }
        });

        return res.status(201).json({
            message: 'KYC submitted successfully. Your documents are under review.',
            data: saved
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: 'KYC already submitted.' });
        }
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: err.message });
        }
        if (!req.files?.frontDoc || !req.files?.selfie) {
            return res.status(400).json({ message: 'Front document and selfie are required.' });
        }
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ message: 'File too large. Max 5MB allowed.' });
        }
        if (err.message === 'INVALID_FILE_TYPE') {
            return res.status(415).json({ message: 'Only PDF, JPG, PNG allowed.' });
        }
        return next(err);
    }
};
