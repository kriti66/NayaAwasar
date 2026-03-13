import User from '../models/User.js';
import RecruiterKyc from '../models/RecruiterKyc.js';
import ActivityLog from '../models/ActivityLog.js';
import { createNotification } from './notificationController.js';
import { logActivity } from '../utils/activityLogger.js';

// Submit Recruiter KYC
// Submit Recruiter KYC
export const submitRecruiterKyc = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            fullName, jobTitle, officialEmail, phoneNumber,
            companyName, industry, registrationNumber, companyAddress, website,
            idType, idNumber,
            idFront, idBack, registrationDocument,
            companyLogo // Ensure this is captured
        } = req.body;

        console.log(`[KYC] Received submission for user: ${userId}`);

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
            taxDocUrl: req.body.taxDocument || 'not-provided',
            companyLogo: companyLogo || '', // Add logo
            status: 'pending',
            submissionDate: new Date()
        };

        // Check if exists
        let existingKyc = await RecruiterKyc.findOne({ userId });

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

        res.json({
            status: user.recruiterKycStatus,
            rejectionReason: kyc?.rejectionReason || null,
            submittedAt: kyc?.updatedAt || kyc?.createdAt,
            kycData: kyc,
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
        const kycs = await RecruiterKyc.find({ status: 'pending' })
            .populate('userId', 'email fullName role') // Include role
            .sort({ createdAt: 1 });

        console.log(`[Admin] Found ${kycs.length} pending recruiter KYCs`);
        res.json(kycs);
    } catch (error) {
        console.error("[Admin KYC List Error]:", error);
        res.status(500).json({ message: 'Server error retrieving KYC list.' });
    }
};

// Admin: Review Recruiter KYC
export const reviewRecruiterKyc = async (req, res) => {
    try {
        const { kycId } = req.params;
        const { decision, reason } = req.body; // approved or rejected

        if (!['approved', 'rejected'].includes(decision)) {
            return res.status(400).json({ message: 'Invalid decision.' });
        }

        const kyc = await RecruiterKyc.findById(kycId);
        if (!kyc) return res.status(404).json({ message: 'KYC not found.' });

        let finalDecision = decision;
        if (decision === 'rejected') {
            if (kyc.resubmissionCount >= 3) {
                finalDecision = 'resubmission_locked';
            }
            kyc.rejectionReason = reason;
            kyc.rejectionHistory.push({
                reason: reason,
                rejectedAt: new Date(),
                rejectedBy: req.user.id
            });
        }

        kyc.status = finalDecision;
        kyc.reviewedBy = req.user.id;
        kyc.reviewedAt = new Date();
        await kyc.save();

        // Update User
        const updatedUser = await User.findByIdAndUpdate(kyc.userId, {
            recruiterKycStatus: finalDecision,
            kycStatus: finalDecision, // Sync global status
            isKycVerified: finalDecision === 'approved',
            kycRejectionReason: finalDecision === 'rejected' || finalDecision === 'resubmission_locked' ? reason : null,
            kycVerifiedAt: finalDecision === 'approved' ? new Date() : null
        });

        // Notify Recruiter
        let messageTitle = finalDecision === 'resubmission_locked' ? 'Verification Locked' : `Recruiter KYC ${finalDecision === 'approved' ? 'Approved' : 'Rejected'}`;
        let messageBody = finalDecision === 'approved'
                ? 'Your Recruiter Identity has been verified. You can now post jobs and create a company profile.'
                : `Your Recruiter KYC was rejected. Reason: ${reason}`;
        if (finalDecision === 'resubmission_locked') {
            messageBody += " You have reached the maximum resubmission limit. Please contact support.";
        } else if (finalDecision === 'rejected') {
            messageBody += ` You have ${3 - (kyc.resubmissionCount || 0)} resubmission attempts remaining. Please update your documents and resubmit.`;
        }

        await createNotification({
            recipient: kyc.userId,
            type: 'kyc_update',
            title: messageTitle,
            message: messageBody,
            link: '/kyc/recruiter',
            sender: req.user.id
        });

        // Log Activity
        await logActivity(
            req.user.id,
            `KYC_${finalDecision.toUpperCase()}`,
            `Admin ${finalDecision} recruiter KYC for ${updatedUser ? updatedUser.fullName : kyc.fullName}.`,
            { actorRole: 'admin' }
        );

        res.json({ message: `KYC ${finalDecision} successfully.` });

    } catch (error) {
        console.error("KYC Review Error:", error);
        res.status(500).json({ message: 'Server error during review.' });
    }
};
