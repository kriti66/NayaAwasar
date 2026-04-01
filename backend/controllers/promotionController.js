import Promotion from '../models/Promotion.js';
import PromotionPayment from '../models/PromotionPayment.js';
import Job from '../models/Job.js';
import Company from '../models/Company.js';
import {
    PROMOTION_STATUSES,
    PAYMENT_STATUSES,
    PROMOTION_TYPES,
    PRICING,
    FREE_PROMOTION_QUOTA
} from '../constants/promotionConfig.js';
import * as promotionService from '../services/promotionService.js';
import { createNotification, notifyAdmins } from './notificationController.js';

// --- Company/Recruiter endpoints ---

/** POST /api/promotions/request - Request promotion for a job */
export const requestPromotion = async (req, res) => {
    try {
        const { jobId, promotionType, durationDays } = req.body;
        const recruiterId = req.user.id;

        if (!jobId || !promotionType || !durationDays) {
            return res.status(400).json({ message: 'jobId, promotionType, and durationDays are required' });
        }

        const validDurations = [7, 15, 30];
        if (!validDurations.includes(Number(durationDays))) {
            return res.status(400).json({ message: 'durationDays must be 7, 15, or 30' });
        }

        if (!Object.values(PROMOTION_TYPES).includes(promotionType)) {
            return res.status(400).json({ message: 'Invalid promotion type' });
        }

        const job = await Job.findById(jobId).populate('company_id').lean();
        if (!job) return res.status(404).json({ message: 'Job not found' });
        const companyId = job.company_id?._id || job.company_id;

        const company = await Company.findById(companyId).lean();
        if (!company) return res.status(404).json({ message: 'Company not found' });

        const isRecruiter = company.recruiters?.some(r => r?.toString() === recruiterId);
        if (!isRecruiter && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'You can only promote jobs for your company' });
        }

        if (!await promotionService.isCompanyVerified(companyId)) {
            return res.status(400).json({ message: 'Company must be verified before requesting promotion' });
        }

        if (isRecruiter && !await promotionService.isRecruiterApprovedForCompany(recruiterId, companyId)) {
            return res.status(400).json({ message: 'Your recruiter identity must be approved to request promotions' });
        }

        if (!await promotionService.isJobEligibleForPromotion(jobId, companyId)) {
            return res.status(400).json({ message: 'Job must be active and approved to be promoted' });
        }

        if (await promotionService.hasActivePromotion(jobId)) {
            return res.status(400).json({ message: 'This job already has an active promotion' });
        }

        const canFree = await promotionService.canRecruiterUseFreePromotion(recruiterId);
        const amount = promotionService.getPromotionAmount(promotionType, Number(durationDays));

        if (!canFree) {
            return res.status(403).json({
                success: false,
                paymentRequired: true,
                message:
                    'You have used all 3 free promotions. Submit a paid promotion request with payment proof for admin review.',
                redirectPath: '/promotion-payment'
            });
        }

        const seq = await promotionService.getNextFreeSequenceNumber(companyId);
        const promotion = await Promotion.create({
            companyId,
            recruiterId,
            jobId,
            promotionType,
            durationDays: Number(durationDays),
            amount: 0,
            isFreePromotion: true,
            freePromotionSequenceNumber: seq,
            status: PROMOTION_STATUSES.PENDING,
            paymentRequired: false,
            paymentStatus: PAYMENT_STATUSES.UNPAID,
            promotionSource: 'standard'
        });

        await createNotification({
            recipient: recruiterId,
            type: 'promotion_request_submitted',
            category: 'promotion',
            title: 'Promotion Request Submitted',
            message: 'Your free promotion request has been submitted and is pending admin approval.',
            link: '/recruiter/promotions',
            metadata: { promotionId: promotion._id, jobId, companyId }
        });
        await notifyAdmins({
            type: 'promotion_request_submitted',
            category: 'promotion',
            title: 'New Promotion Request',
            message: `${company?.name || 'A company'} requested job promotion for "${job?.title || 'a job'}".`,
            link: '/admin/promotion-requests',
            metadata: { promotionId: promotion._id, jobId, companyId },
            senderId: recruiterId
        });

        res.status(201).json({
            message: 'Promotion request submitted. Awaiting admin approval.',
            promotion,
            paymentRequired: false
        });
    } catch (error) {
        console.error('Request promotion error:', error);
        res.status(500).json({ message: error.message || 'Failed to request promotion' });
    }
};

/** GET /api/promotions/company/my-promotions */
export const getMyPromotions = async (req, res) => {
    try {
        const userId = req.user.id;
        const companies = await Company.find({ recruiters: userId }).select('_id').lean();
        const companyIds = companies.map(c => c._id);
        if (!companyIds.length) {
            return res.json([]);
        }

        const promotions = await Promotion.find({ companyId: { $in: companyIds } })
            .populate('jobId', 'title status company_name')
            .populate('approvedBy', 'fullName')
            .sort({ createdAt: -1 })
            .lean();

        const visible = await promotionService.promotionsVisibleForUiQuery(promotions);
        res.json(visible);
    } catch (error) {
        console.error('Get promotions error:', error);
        res.status(500).json({ message: 'Failed to fetch promotions' });
    }
};

/** GET /api/promotions/company/summary */
export const getPromotionSummary = async (req, res) => {
    try {
        const userId = req.user.id;
        const companies = await Company.find({ recruiters: userId }).select('_id').lean();
        const companyIds = companies.map(c => c._id);
        if (!companyIds.length) {
            return res.json({
                freeUsed: 0,
                freeRemaining: FREE_PROMOTION_QUOTA,
                totalPromotions: 0,
                activePromotions: 0
            });
        }

        const committed = await promotionService.getRecruiterCommittedFreePromotionSlots(userId);
        await promotionService.syncRecruiterFreePromotionUsedField(userId);
        const freeUsed = committed;
        const allPromos = await Promotion.find({ companyId: { $in: companyIds } }).lean();
        const visiblePromos = await promotionService.promotionsVisibleForUiQuery(allPromos);
        const totalPromotions = visiblePromos.length;
        const now = new Date();
        const activePromotions = visiblePromos.filter(
            (p) =>
                p.status === PROMOTION_STATUSES.ACTIVE &&
                p.startDate &&
                p.endDate &&
                new Date(p.startDate) <= now &&
                new Date(p.endDate) > now
        ).length;

        res.json({
            freeUsed,
            freeRemaining: Math.max(0, FREE_PROMOTION_QUOTA - freeUsed),
            totalPromotions,
            activePromotions
        });
    } catch (error) {
        console.error('Get summary error:', error);
        res.status(500).json({ message: 'Failed to fetch summary' });
    }
};

/** POST /api/promotions/:promotionId/submit-payment */
export const submitPayment = async (req, res) => {
    try {
        const { promotionId } = req.params;
        const { transactionId, paymentMethod } = req.body;
        const receiptImage = req.file?.filename ? `/uploads/promotions/${req.file.filename}` : req.body.receiptImage;

        const promotion = await Promotion.findById(promotionId).populate('companyId').lean();
        if (!promotion) return res.status(404).json({ message: 'Promotion not found' });

        const companies = await Company.find({ recruiters: req.user.id }).select('_id').lean();
        const companyIds = companies.map(c => c._id.toString());
        if (!companyIds.includes(promotion.companyId._id.toString())) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        if (!promotion.paymentRequired) {
            return res.status(400).json({ message: 'This promotion does not require payment' });
        }

        if (promotion.status !== PROMOTION_STATUSES.PAYMENT_REQUIRED) {
            return res.status(400).json({ message: 'Payment already submitted or promotion not in payment_required state' });
        }

        if (!transactionId || !receiptImage) {
            return res.status(400).json({ message: 'Transaction ID and receipt image are required' });
        }

        let payment = await PromotionPayment.findOne({ promotionId });
        if (payment) {
            payment.transactionId = transactionId;
            payment.paymentMethod = paymentMethod || 'bank_transfer';
            payment.receiptImage = receiptImage;
            payment.paymentStatus = PAYMENT_STATUSES.PENDING_VERIFICATION;
            await payment.save();
        } else {
            payment = await PromotionPayment.create({
                promotionId,
                companyId: promotion.companyId._id,
                amount: promotion.amount,
                transactionId,
                paymentMethod: paymentMethod || 'bank_transfer',
                receiptImage,
                paymentStatus: PAYMENT_STATUSES.PENDING_VERIFICATION
            });
        }

        promotion.status = PROMOTION_STATUSES.PAYMENT_SUBMITTED;
        promotion.paymentStatus = PAYMENT_STATUSES.PENDING_VERIFICATION;
        await Promotion.findByIdAndUpdate(promotionId, {
            status: PROMOTION_STATUSES.PAYMENT_SUBMITTED,
            paymentStatus: PAYMENT_STATUSES.PENDING_VERIFICATION
        });

        await createNotification({
            recipient: promotion.recruiterId,
            type: 'payment_submitted',
            category: 'payment',
            title: 'Payment Submitted',
            message: 'Your payment proof has been submitted. Awaiting admin verification.',
            link: '/recruiter/promotions',
            metadata: { promotionId, paymentId: payment._id }
        });
        await notifyAdmins({
            type: 'payment_submitted',
            category: 'payment',
            title: 'New Payment to Verify',
            message: `Payment proof submitted for promotion. Amount: Rs. ${payment.amount}. Verify in Promotion Requests.`,
            link: '/admin/promotion-requests',
            metadata: { promotionId, paymentId: payment._id }
        });

        res.json({ message: 'Payment submitted successfully. Awaiting admin verification.', payment });
    } catch (error) {
        console.error('Submit payment error:', error);
        res.status(500).json({ message: error.message || 'Failed to submit payment' });
    }
};

// --- Admin endpoints ---

/** GET /api/promotions/admin/all */
export const adminGetAllPromotions = async (req, res) => {
    try {
        const { status, type, search } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (type) filter.promotionType = type;
        if (search) {
            const companies = await Company.find({ name: new RegExp(search, 'i') }).select('_id').lean();
            const jobs = await Job.find({ title: new RegExp(search, 'i') }).select('_id').lean();
            filter.$or = [
                { companyId: { $in: companies.map(c => c._id) } },
                { jobId: { $in: jobs.map(j => j._id) } }
            ];
        }

        const promotions = await Promotion.find(filter)
            .populate('companyId', 'name logo')
            .populate('jobId', 'title status company_name')
            .populate('recruiterId', 'fullName email')
            .sort({ createdAt: -1 })
            .lean();

        const visible = await promotionService.promotionsVisibleForUiQuery(promotions);
        res.json(visible);
    } catch (error) {
        console.error('Admin get promotions error:', error);
        res.status(500).json({ message: 'Failed to fetch promotions' });
    }
};

/** PATCH /api/promotions/admin/:promotionId/approve */
export const adminApprovePromotion = async (req, res) => {
    try {
        const { promotionId } = req.params;
        const promotion = await Promotion.findById(promotionId);
        if (!promotion) return res.status(404).json({ message: 'Promotion not found' });

        if (![PROMOTION_STATUSES.PENDING, PROMOTION_STATUSES.PAYMENT_SUBMITTED].includes(promotion.status)) {
            return res.status(400).json({ message: 'Promotion cannot be approved in current state' });
        }

        if (promotion.paymentRequired && promotion.paymentStatus === PAYMENT_STATUSES.PENDING_VERIFICATION) {
            const payment = await PromotionPayment.findOne({ promotionId });
            if (!payment || payment.paymentStatus !== PAYMENT_STATUSES.PENDING_VERIFICATION) {
                return res.status(400).json({ message: 'Payment must be verified first for paid promotions' });
            }
            payment.paymentStatus = PAYMENT_STATUSES.PAID;
            payment.verifiedAt = new Date();
            payment.verifiedBy = req.user.id;
            await payment.save();
        }

        const now = new Date();
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() + promotion.durationDays);

        promotion.status = PROMOTION_STATUSES.ACTIVE;
        promotion.paymentStatus = promotion.paymentRequired ? PAYMENT_STATUSES.PAID : promotion.paymentStatus;
        promotion.startDate = now;
        promotion.endDate = endDate;
        promotion.approvedAt = now;
        promotion.approvedBy = req.user.id;
        promotion.isActive = true;
        await promotion.save();

        await promotionService.applyPromotionToJob(promotion);

        if (promotion.isFreePromotion) {
            await promotionService.syncRecruiterFreePromotionUsedField(promotion.recruiterId);
        }

        await createNotification({
            recipient: promotion.recruiterId,
            type: 'promotion_activated',
            category: 'promotion',
            title: 'Promotion Activated',
            message: 'Your job promotion has been approved and is now active.',
            link: '/recruiter/promotions',
            metadata: { promotionId, jobId: promotion.jobId }
        });

        res.json({ message: 'Promotion approved and activated', promotion });
    } catch (error) {
        console.error('Admin approve error:', error);
        res.status(500).json({ message: error.message || 'Failed to approve promotion' });
    }
};

/** PATCH /api/promotions/admin/:promotionId/reject */
export const adminRejectPromotion = async (req, res) => {
    try {
        const { promotionId } = req.params;
        const { reason } = req.body;
        const promotion = await Promotion.findById(promotionId);
        if (!promotion) return res.status(404).json({ message: 'Promotion not found' });

        const rejectable = [PROMOTION_STATUSES.PENDING, PROMOTION_STATUSES.PAYMENT_SUBMITTED, PROMOTION_STATUSES.PAYMENT_REQUIRED];
        if (!rejectable.includes(promotion.status)) {
            return res.status(400).json({ message: 'Promotion cannot be rejected in current state' });
        }

        promotion.status = PROMOTION_STATUSES.REJECTED;
        promotion.rejectedAt = new Date();
        promotion.rejectedBy = req.user.id;
        promotion.rejectionReason = reason || '';
        await promotion.save();

        await createNotification({
            recipient: promotion.recruiterId,
            type: 'promotion',
            title: 'Promotion Rejected',
            message: reason || 'Your promotion request was rejected.',
            link: '/recruiter/promotions'
        });

        res.json({ message: 'Promotion rejected', promotion });
    } catch (error) {
        console.error('Admin reject error:', error);
        res.status(500).json({ message: error.message || 'Failed to reject promotion' });
    }
};

/** PATCH /api/promotions/admin/:promotionId/expire */
export const adminExpirePromotion = async (req, res) => {
    try {
        const { promotionId } = req.params;
        const promotion = await Promotion.findById(promotionId);
        if (!promotion) return res.status(404).json({ message: 'Promotion not found' });

        if (promotion.status !== PROMOTION_STATUSES.ACTIVE) {
            return res.status(400).json({ message: 'Only active promotions can be manually expired' });
        }

        promotion.status = PROMOTION_STATUSES.EXPIRED;
        promotion.isActive = false;
        await promotion.save();

        await promotionService.removePromotionFromJob(promotion.jobId);

        await createNotification({
            recipient: promotion.recruiterId,
            type: 'promotion_expired',
            category: 'promotion',
            title: 'Promotion Expired',
            message: 'Your job promotion has expired.',
            link: '/recruiter/promotions',
            metadata: { promotionId, jobId: promotion.jobId }
        });

        res.json({ message: 'Promotion expired', promotion });
    } catch (error) {
        console.error('Admin expire error:', error);
        res.status(500).json({ message: error.message || 'Failed to expire promotion' });
    }
};

/** GET /api/promotions/admin/payments */
export const adminGetPayments = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = {};
        if (status) filter.paymentStatus = status;

        const payments = await PromotionPayment.find(filter)
            .populate({
                path: 'promotionId',
                populate: [
                    { path: 'jobId', select: 'title company_name' },
                    { path: 'companyId', select: 'name' }
                ]
            })
            .sort({ createdAt: -1 })
            .lean();

        const promoRows = payments.map((pay) => pay.promotionId).filter(Boolean);
        const visiblePromos = await promotionService.promotionsVisibleForUiQuery(
            promoRows.map((pr) => ({ _id: pr._id, jobId: pr.jobId }))
        );
        const visiblePromoIds = new Set(visiblePromos.map((p) => p._id.toString()));
        const filteredPayments = payments.filter(
            (pay) => pay.promotionId && visiblePromoIds.has(pay.promotionId._id.toString())
        );

        res.json(filteredPayments);
    } catch (error) {
        console.error('Admin get payments error:', error);
        res.status(500).json({ message: 'Failed to fetch payments' });
    }
};

/** PATCH /api/promotions/admin/payments/:paymentId/approve */
export const adminApprovePayment = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const payment = await PromotionPayment.findById(paymentId).populate('promotionId');
        if (!payment) return res.status(404).json({ message: 'Payment not found' });
        if (!payment.promotionId) return res.status(404).json({ message: 'Promotion not found' });

        if (payment.paymentStatus !== PAYMENT_STATUSES.PENDING_VERIFICATION) {
            return res.status(400).json({ message: 'Payment is not pending verification' });
        }

        payment.paymentStatus = PAYMENT_STATUSES.PAID;
        payment.verifiedAt = new Date();
        payment.verifiedBy = req.user.id;
        await payment.save();

        const promotion = payment.promotionId;
        promotion.paymentStatus = PAYMENT_STATUSES.PAID;
        promotion.status = PROMOTION_STATUSES.PAYMENT_SUBMITTED;
        await Promotion.findByIdAndUpdate(promotion._id, {
            paymentStatus: PAYMENT_STATUSES.PAID,
            status: PROMOTION_STATUSES.PAYMENT_SUBMITTED
        });

        await createNotification({
            recipient: promotion.recruiterId,
            type: 'payment_approved',
            category: 'payment',
            title: 'Payment Verified',
            message: 'Your payment has been verified. Your promotion is pending final approval.',
            link: '/recruiter/promotions',
            metadata: { promotionId: promotion._id, paymentId }
        });

        res.json({
            message: 'Payment approved. You can now approve the promotion to activate it.',
            payment
        });
    } catch (error) {
        console.error('Admin approve payment error:', error);
        res.status(500).json({ message: error.message || 'Failed to approve payment' });
    }
};

/** PATCH /api/promotions/admin/payments/:paymentId/reject */
export const adminRejectPayment = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { reason } = req.body;
        const payment = await PromotionPayment.findById(paymentId).populate('promotionId');
        if (!payment) return res.status(404).json({ message: 'Payment not found' });

        if (payment.paymentStatus !== PAYMENT_STATUSES.PENDING_VERIFICATION) {
            return res.status(400).json({ message: 'Payment is not pending verification' });
        }

        payment.paymentStatus = PAYMENT_STATUSES.REJECTED;
        payment.rejectionReason = reason || '';
        await payment.save();

        const promotion = payment.promotionId;
        if (promotion) {
            promotion.paymentStatus = PAYMENT_STATUSES.REJECTED;
            promotion.status = PROMOTION_STATUSES.PAYMENT_REQUIRED;
            await Promotion.findByIdAndUpdate(promotion._id, {
                paymentStatus: PAYMENT_STATUSES.REJECTED,
                status: PROMOTION_STATUSES.PAYMENT_REQUIRED
            });

            await createNotification({
                recipient: promotion.recruiterId,
                type: 'payment_rejected',
                category: 'payment',
                title: 'Payment Rejected',
                message: reason || 'Your payment proof was rejected. Please resubmit.',
                link: '/recruiter/promotions',
                metadata: { promotionId, paymentId: payment._id }
            });
        }

        res.json({ message: 'Payment rejected', payment });
    } catch (error) {
        console.error('Admin reject payment error:', error);
        res.status(500).json({ message: error.message || 'Failed to reject payment' });
    }
};

/** GET /api/promotions/pricing - Public pricing info */
export const getPricing = async (req, res) => {
    res.json({ pricing: PRICING, freeQuota: FREE_PROMOTION_QUOTA });
};
