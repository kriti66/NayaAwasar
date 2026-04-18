import path from 'path';
import { fileURLToPath } from 'url';
import PromotionPaymentRequest, {
    PROMOTION_PAYMENT_REQUEST_STATUS
} from '../models/PromotionPaymentRequest.js';
import Promotion from '../models/Promotion.js';
import Job from '../models/Job.js';
import Company from '../models/Company.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
import {
    PROMOTION_TYPES,
    PROMOTION_STATUSES,
    PAYMENT_STATUSES,
    PRICING
} from '../constants/promotionConfig.js';
import * as promotionService from '../services/promotionService.js';
import { createNotification, notifyAdmins } from './notificationController.js';
import { isJobPubliclyVisible } from '../utils/jobModeration.js';
import { NOTIFICATION_TYPES } from '../constants/notificationTypes.js';

const validDurations = [7, 15, 30];

/** POST multipart: body fields + paymentScreenshot file */
export const submitPromotionPaymentRequest = async (req, res) => {
    try {
        const recruiterId = req.user.id;
        const {
            jobId,
            recruiterName,
            companyName,
            email,
            phone,
            jobTitle,
            promotionType,
            durationDays,
            amount,
            paymentMethod,
            transactionId,
            note
        } = req.body;

        const screenshotPath = req.file?.path
            ? `/${path.relative(rootDir, req.file.path).replace(/\\/g, '/')}`
            : '';

        if (!jobId || !recruiterName?.trim() || !companyName?.trim() || !email?.trim() || !phone?.trim()) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }
        if (!jobTitle?.trim() || !promotionType || !durationDays || amount === undefined || !paymentMethod?.trim() || !transactionId?.trim()) {
            return res.status(400).json({ message: 'Missing promotion or payment details.' });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'Payment screenshot is required.' });
        }

        const dur = Number(durationDays);
        if (!validDurations.includes(dur)) {
            return res.status(400).json({ message: 'durationDays must be 7, 15, or 30' });
        }
        if (!Object.values(PROMOTION_TYPES).includes(promotionType)) {
            return res.status(400).json({ message: 'Invalid promotion type' });
        }

        const job = await Job.findById(jobId).lean();
        if (!job) return res.status(404).json({ message: 'Job not found' });

        const companyId = job.company_id || job.company;
        const company = await Company.findById(companyId).lean();
        if (!company) return res.status(404).json({ message: 'Company not found' });

        const isRecruiter = company.recruiters?.some((r) => r?.toString() === recruiterId);
        if (!isRecruiter && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'You can only submit requests for your company jobs' });
        }

        if (!await promotionService.isJobEligibleForPromotion(jobId, companyId)) {
            return res.status(400).json({ message: 'Job must be active and approved to request promotion' });
        }

        if (await promotionService.hasActivePromotion(jobId)) {
            return res.status(400).json({ message: 'This job already has an active promotion' });
        }

        const pendingDup = await PromotionPaymentRequest.findOne({
            jobId,
            recruiterId,
            status: PROMOTION_PAYMENT_REQUEST_STATUS.PENDING
        }).lean();
        if (pendingDup) {
            return res.status(400).json({ message: 'You already have a pending paid promotion request for this job.' });
        }

        const expectedAmount = PRICING[promotionType]?.[dur];
        const amt = Number(amount);
        if (expectedAmount !== undefined && amt !== expectedAmount) {
            return res.status(400).json({
                message: `Amount must match the current price list (Rs. ${expectedAmount} for this type and duration).`
            });
        }

        const doc = await PromotionPaymentRequest.create({
            recruiterId,
            companyId,
            jobId,
            recruiterName: recruiterName.trim(),
            companyName: companyName.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            jobTitle: jobTitle.trim(),
            promotionType,
            durationDays: dur,
            amount: amt,
            paymentMethod: paymentMethod.trim(),
            transactionId: transactionId.trim(),
            paymentScreenshot: screenshotPath,
            note: (note || '').trim()
        });

        await notifyAdmins({
            type: NOTIFICATION_TYPES.PROMOTION_PAYMENT_REQUEST,
            category: 'promotion',
            title: 'New paid promotion request',
            message: `${companyName} submitted a manual payment request for job "${jobTitle}".`,
            link: '/admin/promotion-requests',
            metadata: { requestId: doc._id, jobId },
            senderId: recruiterId
        });

        res.status(201).json({
            success: true,
            message: 'Request submitted. We will review your payment and activate the promotion after approval.',
            request: doc
        });
    } catch (error) {
        console.error('submitPromotionPaymentRequest:', error);
        res.status(500).json({ message: error.message || 'Failed to submit request' });
    }
};

export const getMyPromotionPaymentRequests = async (req, res) => {
    try {
        const list = await PromotionPaymentRequest.find({ recruiterId: req.user.id })
            .populate('jobId', 'title company_name status moderationStatus')
            .sort({ createdAt: -1 })
            .lean();
        const visible = list.filter((row) => row.jobId && isJobPubliclyVisible(row.jobId));
        res.json(visible);
    } catch (error) {
        console.error('getMyPromotionPaymentRequests:', error);
        res.status(500).json({ message: 'Failed to load requests' });
    }
};

export const adminListPendingPromotionPaymentRequests = async (req, res) => {
    try {
        const list = await PromotionPaymentRequest.find({
            status: PROMOTION_PAYMENT_REQUEST_STATUS.PENDING
        })
            .populate('recruiterId', 'fullName email')
            .populate('companyId', 'name')
            .populate('jobId', 'title company_name status moderationStatus')
            .sort({ createdAt: 1 })
            .lean();
        const visible = list.filter((row) => row.jobId && isJobPubliclyVisible(row.jobId));
        res.json(visible);
    } catch (error) {
        console.error('adminListPendingPromotionPaymentRequests:', error);
        res.status(500).json({ message: 'Failed to load requests' });
    }
};

export const adminApprovePromotionPaymentRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const reqDoc = await PromotionPaymentRequest.findById(requestId);
        if (!reqDoc) return res.status(404).json({ message: 'Request not found' });
        if (reqDoc.status !== PROMOTION_PAYMENT_REQUEST_STATUS.PENDING) {
            return res.status(400).json({ message: 'Request is not pending' });
        }

        const job = await Job.findById(reqDoc.jobId);
        if (!job) return res.status(404).json({ message: 'Job not found' });

        if (!await promotionService.isJobEligibleForPromotion(reqDoc.jobId, reqDoc.companyId)) {
            return res.status(400).json({ message: 'Job is no longer eligible for promotion' });
        }

        if (await promotionService.hasActivePromotion(reqDoc.jobId)) {
            return res.status(400).json({ message: 'Job already has an active promotion' });
        }

        const now = new Date();
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() + reqDoc.durationDays);

        const promotion = await Promotion.create({
            companyId: reqDoc.companyId,
            recruiterId: reqDoc.recruiterId,
            jobId: reqDoc.jobId,
            promotionType: reqDoc.promotionType,
            durationDays: reqDoc.durationDays,
            amount: reqDoc.amount,
            isFreePromotion: false,
            status: PROMOTION_STATUSES.ACTIVE,
            startDate: now,
            endDate,
            paymentRequired: false,
            paymentStatus: PAYMENT_STATUSES.PAID,
            isActive: true,
            approvedAt: now,
            approvedBy: req.user.id,
            promotionSource: 'manual_payment_request',
            manualPaymentRequestId: reqDoc._id
        });

        await promotionService.applyPromotionToJob(promotion);

        reqDoc.status = PROMOTION_PAYMENT_REQUEST_STATUS.APPROVED;
        reqDoc.approvedBy = req.user.id;
        reqDoc.approvedAt = now;
        reqDoc.promotionId = promotion._id;
        reqDoc.rejectionReason = '';
        await reqDoc.save();

        await createNotification({
            recipient: reqDoc.recruiterId,
            type: 'promotion_activated',
            category: 'promotion',
            title: 'Paid promotion approved',
            message: 'Your manual payment was verified and your job promotion is now active.',
            link: '/recruiter/promotions',
            metadata: { promotionId: promotion._id, jobId: reqDoc.jobId }
        });

        res.json({
            success: true,
            message: 'Promotion payment request approved and job promoted.',
            promotion,
            request: reqDoc
        });
    } catch (error) {
        console.error('adminApprovePromotionPaymentRequest:', error);
        res.status(500).json({ message: error.message || 'Failed to approve' });
    }
};

export const adminRejectPromotionPaymentRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { reason } = req.body;
        const reqDoc = await PromotionPaymentRequest.findById(requestId);
        if (!reqDoc) return res.status(404).json({ message: 'Request not found' });
        if (reqDoc.status !== PROMOTION_PAYMENT_REQUEST_STATUS.PENDING) {
            return res.status(400).json({ message: 'Request is not pending' });
        }

        reqDoc.status = PROMOTION_PAYMENT_REQUEST_STATUS.REJECTED;
        reqDoc.rejectionReason = (reason || '').trim() || 'No reason provided';
        await reqDoc.save();

        const formattedReason =
            reqDoc.rejectionReason.charAt(0).toUpperCase() + reqDoc.rejectionReason.slice(1);

        await createNotification({
            recipient: reqDoc.recruiterId,
            type: 'promotion_rejected',
            category: 'promotion',
            title: 'Paid promotion request rejected',
            message: `Your paid promotion request was rejected. Reason: ${formattedReason}. Please resubmit with the required corrections.`,
            link: '/promotion-payment',
            metadata: { requestId: reqDoc._id }
        });

        res.json({ success: true, message: 'Request rejected', request: reqDoc });
    } catch (error) {
        console.error('adminRejectPromotionPaymentRequest:', error);
        res.status(500).json({ message: error.message || 'Failed to reject' });
    }
};
