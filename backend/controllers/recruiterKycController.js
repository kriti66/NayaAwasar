import User from '../models/User.js';
import RecruiterKyc from '../models/RecruiterKyc.js';
import Company from '../models/Company.js';
import ActivityLog from '../models/ActivityLog.js';
import { createNotification, notifyAdmins } from './notificationController.js';
import { NOTIFICATION_TYPES } from '../constants/notificationTypes.js';
import { logActivity } from '../utils/activityLogger.js';

const deriveOverallStatus = (repStatus, compStatus) => {
    if (repStatus === 'approved' && compStatus === 'approved') return 'approved';
    if (repStatus === 'rejected' || compStatus === 'rejected') return 'rejected';
    return 'pending';
};

const normalizeRecruiterKycForResponse = (doc) => {
    if (!doc) return null;
    const rep = doc.representative || {};
    const company = doc.company || {};
    return {
        ...doc,
        representative: {
            fullName: rep.fullName || doc.fullName || '',
            jobTitle: rep.jobTitle || doc.jobTitle || '',
            officialEmail: rep.officialEmail || doc.officialEmail || '',
            phoneNumber: rep.phoneNumber || doc.phoneNumber || '',
            selfieUrl: rep.selfieUrl || doc.selfieUrl || doc.selfieWithId || '',
            idType: rep.idType || doc.idType || 'national_id',
            idNumber: rep.idNumber || doc.idNumber || '',
            idFrontUrl: rep.idFrontUrl || doc.idFrontUrl || '',
            idBackUrl: rep.idBackUrl || doc.idBackUrl || ''
        },
        company: {
            companyName: company.companyName || doc.companyName || '',
            registrationNumber: company.registrationNumber || doc.registrationNumber || '',
            companyAddress: company.companyAddress || doc.companyAddress || '',
            industry: company.industry || doc.industry || '',
            website: company.website || doc.website || '',
            registrationDocUrl: company.registrationDocUrl || doc.registrationDocUrl || doc.registrationDocument || '',
            taxDocUrl: company.taxDocUrl || doc.taxDocUrl || doc.taxDocument || '',
            companyLogo: company.companyLogo || doc.companyLogo || ''
        },
        representativeStatus: doc.representativeStatus || 'pending',
        companyStatus: doc.companyStatus || 'pending',
        representativeRejectionReason: doc.representativeRejectionReason || '',
        companyRejectionReason: doc.companyRejectionReason || ''
    };
};

// Submit Recruiter KYC
// Submit Recruiter KYC
export const submitRecruiterKyc = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            fullName, jobTitle, officialEmail, phoneNumber,
            companyName, industry, registrationNumber, companyAddress, website,
            idType, idNumber,
            representativePhoto, selfie, idFront, idBack, registrationDocument,
            companyLogo // Ensure this is captured
        } = req.body;

        console.log(`[KYC] Received submission for user: ${userId}`);

        const selfieUrl = representativePhoto || selfie || req.body.selfieWithId || '';
        const taxDocUrl = req.body.taxDocument || '';
        const missingRepresentative = [];
        if (!fullName) missingRepresentative.push('Full Name');
        if (!jobTitle) missingRepresentative.push('Job Title');
        if (!officialEmail) missingRepresentative.push('Official Email');
        if (!phoneNumber) missingRepresentative.push('Phone Number');
        if (!selfieUrl) missingRepresentative.push('Representative Photo / Selfie');
        if (!idType) missingRepresentative.push('ID Type');
        if (!idNumber) missingRepresentative.push('ID Number');
        if (!idFront) missingRepresentative.push('ID Front');
        if (!idBack) missingRepresentative.push('ID Back');

        const missingCompany = [];
        if (!companyName) missingCompany.push('Company Name');
        if (!registrationNumber) missingCompany.push('Registration Number');
        if (!companyAddress) missingCompany.push('Company Address');
        if (!industry) missingCompany.push('Industry');
        if (!registrationDocument) missingCompany.push('Business Registration Document');
        if (!taxDocUrl) missingCompany.push('Tax Registration Document');

        if (missingRepresentative.length || missingCompany.length) {
            return res.status(400).json({
                success: false,
                message: 'Please complete all required verification fields.',
                representativeMissing: missingRepresentative,
                companyMissing: missingCompany
            });
        }

        // data payload
        const kycData = {
            userId,
            fullName,
            jobTitle,
            officialEmail,
            phoneNumber,
            companyName,
            industry,
            registrationNumber,
            companyAddress,
            website,
            idType,
            idNumber,
            idFrontUrl: idFront,
            idBackUrl: idBack,
            registrationDocUrl: registrationDocument,
            taxDocUrl,
            companyLogo: companyLogo || '', // Add logo
            selfieUrl,
            status: 'pending',
            representativeStatus: 'pending',
            companyStatus: 'pending',
            representativeRejectionReason: '',
            companyRejectionReason: '',
            representativeReviewedAt: null,
            companyReviewedAt: null,
            representativeReviewedBy: null,
            companyReviewedBy: null,
            representative: {
                fullName,
                jobTitle,
                officialEmail,
                phoneNumber,
                selfieUrl,
                idType,
                idNumber,
                idFrontUrl: idFront,
                idBackUrl: idBack
            },
            company: {
                companyName,
                registrationNumber,
                companyAddress,
                industry,
                website,
                registrationDocUrl: registrationDocument,
                taxDocUrl,
                companyLogo: companyLogo || ''
            },
            submissionDate: new Date()
        };

        // Check if exists
        let existingKyc = await RecruiterKyc.findOne({ userId });
        const priorRecruiterKycForNotify = existingKyc
            ? { status: existingKyc.status }
            : null;

        if (existingKyc && existingKyc.status === 'approved') {
            return res.status(400).json({ success: false, message: 'KYC is already approved.' });
        }

        if (existingKyc && existingKyc.status === 'resubmission_locked') {
            return res.status(403).json({ success: false, message: 'You have reached the maximum verification resubmission limit. Please contact admin/support for manual review.' });
        }

        if (existingKyc) {
            if (existingKyc.status === 'rejected') {
                kycData.resubmissionCount = (existingKyc.resubmissionCount || 0) + 1;
            }
            console.log(`[KYC] Updating existing record for user: ${userId}`);
            // If it was already approved, maybe we shouldn't allow simple overwrite?
            // But usually re-submission implies updating details.
            // If it's pending, user might be updating files.

            // We update it and set status to pending for review
            await RecruiterKyc.findByIdAndUpdate(existingKyc._id, kycData);
        } else {
            console.log(`[KYC] Creating new record for user: ${userId}`);
            await RecruiterKyc.create(kycData);
        }

        // Update User Status
        await User.findByIdAndUpdate(userId, {
            recruiterKycStatus: 'pending',
            kycStatus: 'pending', // Sync global status
            isKycSubmitted: true
        });

        // Log Activity
        // Log Activity
        await logActivity(
            userId,
            'KYC_SUBMITTED',
            `Recruiter ${fullName || 'User'} submitted KYC verification.`
        );

        const shouldNotifyAdmin =
            !priorRecruiterKycForNotify || priorRecruiterKycForNotify.status === 'rejected';
        if (shouldNotifyAdmin) {
            const displayName = (fullName || '').trim() || 'A recruiter';
            if (priorRecruiterKycForNotify?.status === 'rejected') {
                await notifyAdmins({
                    type: NOTIFICATION_TYPES.RECRUITER_KYC_RESUBMITTED_AFTER_REJECTION,
                    category: 'recruiter',
                    title: 'KYC Resubmitted',
                    message: `${displayName} resubmitted recruiter verification after a previous rejection. Review in KYC Panel.`,
                    link: '/admin/kyc',
                    metadata: { userId, resubmissionAfterRejection: true }
                });
            } else if (!priorRecruiterKycForNotify) {
                await notifyAdmins({
                    type: NOTIFICATION_TYPES.RECRUITER_KYC_NEW_SUBMISSION,
                    category: 'recruiter',
                    title: 'New KYC Submission',
                    message: `${displayName} submitted recruiter verification for the first time. Review in KYC Panel.`,
                    link: '/admin/kyc',
                    metadata: { userId, firstSubmission: true }
                });
            }
        }

        res.status(200).json({ success: true, message: 'KYC submitted successfully.' });

    } catch (error) {
        console.error("[KYC Submit Error]:", error);
        res.status(500).json({ success: false, message: 'Server error during KYC submission.', error: error.message });
    }
};

// Get Recruiter KYC Status
export const getRecruiterKycStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('recruiterKycStatus kycRejectionReason');
        if (!user) return res.status(404).json({ message: 'User not found' });

        const kyc = await RecruiterKyc.findOne({ userId: req.user.id });
        const normalized = normalizeRecruiterKycForResponse(kyc?.toObject ? kyc.toObject() : kyc);

        res.json({
            status: user.recruiterKycStatus,
            rejectionReason: kyc?.rejectionReason || null,
            representativeStatus: normalized?.representativeStatus || 'pending',
            companyStatus: normalized?.companyStatus || 'pending',
            representativeRejectionReason: normalized?.representativeRejectionReason || '',
            companyRejectionReason: normalized?.companyRejectionReason || '',
            submittedAt: kyc?.updatedAt || kyc?.createdAt,
            kycData: normalized,
            resubmissionCount: kyc?.resubmissionCount || 0
        });
    } catch (error) {
        console.error("[KYC Status Error]:", error);
        res.status(500).json({ message: 'Server error retrieving status.' });
    }
};

// Admin: Get Pending Recruiter KYCs
export const getPendingRecruiterKycs = async (req, res) => {
    try {
        console.log("[Admin] Fetching pending recruiter KYCs");
        // Drop from queue only when both representative and company are approved
        const kycs = await RecruiterKyc.find({
            $nor: [{ representativeStatus: 'approved', companyStatus: 'approved' }]
        })
            .populate('userId', 'email fullName role') // Include role
            .sort({ createdAt: 1 });

        console.log(`[Admin] Found ${kycs.length} pending recruiter KYCs`);
        res.json(kycs.map((k) => normalizeRecruiterKycForResponse(k.toObject())));
    } catch (error) {
        console.error("[Admin KYC List Error]:", error);
        res.status(500).json({ message: 'Server error retrieving KYC list.' });
    }
};

// Admin: Review Recruiter KYC
export const reviewRecruiterKyc = async (req, res) => {
    try {
        const { kycId } = req.params;
        const { decision, reason, section = 'representative' } = req.body; // approved or rejected

        if (!['approved', 'rejected'].includes(decision)) {
            return res.status(400).json({ message: 'Invalid decision.' });
        }
        if (!['representative', 'company'].includes(section)) {
            return res.status(400).json({ message: 'Invalid section. Use representative or company.' });
        }

        const kyc = await RecruiterKyc.findById(kycId);
        if (!kyc) return res.status(404).json({ message: 'KYC not found.' });

        if (section === 'company' && kyc.representativeStatus !== 'approved') {
            return res.status(400).json({
                message: 'Representative verification must be approved before company verification.'
            });
        }

        if (decision === 'rejected') {
            kyc.rejectionReason = reason || 'Rejected by admin';
            kyc.rejectionHistory.push({
                reason: reason || `Rejected ${section} verification`,
                rejectedAt: new Date(),
                rejectedBy: req.user.id
            });
        }

        if (section === 'representative') {
            kyc.representativeStatus = decision;
            kyc.representativeRejectionReason = decision === 'rejected' ? (reason || '') : '';
            kyc.representativeReviewedAt = new Date();
            kyc.representativeReviewedBy = req.user.id;
            if (decision === 'rejected') {
                // If representative is rejected, company cannot be approved
                kyc.companyStatus = 'pending';
            }
        } else {
            kyc.companyStatus = decision;
            kyc.companyRejectionReason = decision === 'rejected' ? (reason || '') : '';
            kyc.companyReviewedAt = new Date();
            kyc.companyReviewedBy = req.user.id;
        }

        const finalDecision = deriveOverallStatus(kyc.representativeStatus, kyc.companyStatus);
        kyc.status = finalDecision;
        kyc.reviewedBy = req.user.id;
        kyc.reviewedAt = new Date();
        await kyc.save();

        // Update User
        const updatedUser = await User.findByIdAndUpdate(kyc.userId, {
            recruiterKycStatus: finalDecision,
            kycStatus: finalDecision, // Sync global status
            isKycVerified: finalDecision === 'approved',
            kycRejectionReason: finalDecision === 'rejected'
                ? (kyc.representativeRejectionReason || kyc.companyRejectionReason || reason || '')
                : null,
            kycVerifiedAt: finalDecision === 'approved' ? new Date() : null
        });

        // Keep Company profile in sync: job posting still requires company.status === 'approved'
        const rejectionText =
            (kyc.representativeRejectionReason || kyc.companyRejectionReason || reason || '').trim() || 'Rejected in KYC review';
        if (finalDecision === 'approved') {
            await Company.findOneAndUpdate(
                { recruiters: kyc.userId },
                {
                    $set: {
                        status: 'approved',
                        verificationStatus: 'approved',
                        adminFeedback: '',
                        rejectionReason: '',
                        lastReviewedAt: new Date(),
                        reviewedBy: req.user.id
                    }
                }
            );
        } else if (finalDecision === 'rejected') {
            await Company.findOneAndUpdate(
                { recruiters: kyc.userId },
                {
                    $set: {
                        status: 'rejected',
                        verificationStatus: 'rejected',
                        adminFeedback: rejectionText,
                        rejectionReason: rejectionText,
                        lastReviewedAt: new Date(),
                        lastRejectedAt: new Date(),
                        reviewedBy: req.user.id
                    }
                }
            );
        }

        // Notify Recruiter
        const sectionLabel = section === 'representative' ? 'Representative Verification' : 'Company Verification';
        const messageTitle = `${sectionLabel} ${decision === 'approved' ? 'Approved' : 'Rejected'}`;
        let messageBody = decision === 'approved'
            ? `${sectionLabel} has been approved by admin.`
            : `${sectionLabel} was rejected. Reason: ${reason || 'Not specified'}`;
        if (section === 'representative' && decision === 'approved' && kyc.companyStatus !== 'approved') {
            messageBody += ' Company verification is still pending review.';
        }
        if (finalDecision === 'approved') {
            messageBody += ' Your recruiter verification is fully approved.';
        }

        await createNotification({
            recipient: kyc.userId,
            type: decision === 'approved' ? 'recruiter_approved' : 'recruiter_rejected',
            category: 'recruiter',
            title: messageTitle,
            message: messageBody,
            link: '/kyc/recruiter',
            sender: req.user.id
        });

        // Log Activity
        await logActivity(
            req.user.id,
            `KYC_${decision.toUpperCase()}`,
            `Admin ${decision} ${section} review for ${updatedUser ? updatedUser.fullName : kyc.fullName}.`,
            { actorRole: 'admin' }
        );

        res.json({
            message: `${sectionLabel} ${decision} successfully.`,
            status: {
                representativeStatus: kyc.representativeStatus,
                companyStatus: kyc.companyStatus,
                overallStatus: kyc.status
            }
        });

    } catch (error) {
        console.error("KYC Review Error:", error);
        res.status(500).json({ message: 'Server error during review.' });
    }
};
