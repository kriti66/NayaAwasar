import Promotion from '../models/Promotion.js';
import PromotionPayment from '../models/PromotionPayment.js';
import Job from '../models/Job.js';
import Company from '../models/Company.js';
import User from '../models/User.js';
import {
    PRICING,
    FREE_PROMOTION_QUOTA,
    PROMOTION_STATUSES,
    PAYMENT_STATUSES,
    PROMOTION_TO_JOB_TYPE,
    PROMOTION_TYPES
} from '../constants/promotionConfig.js';

/**
 * Get free promotion count used by company (approved/active only)
 */
export async function getFreePromotionUsedCount(companyId) {
    const count = await Promotion.countDocuments({
        companyId,
        isFreePromotion: true,
        status: { $in: [PROMOTION_STATUSES.APPROVED, PROMOTION_STATUSES.ACTIVE] }
    });
    return count;
}

/**
 * Check if company can request free promotion
 */
export async function canUseFreePromotion(companyId) {
    const used = await getFreePromotionUsedCount(companyId);
    return used < FREE_PROMOTION_QUOTA;
}

/**
 * Get next free promotion sequence number for company
 */
export async function getNextFreeSequenceNumber(companyId) {
    const used = await getFreePromotionUsedCount(companyId);
    return used + 1;
}

/**
 * Get amount for promotion type and duration
 */
export function getPromotionAmount(promotionType, durationDays) {
    const plan = PRICING[promotionType];
    if (!plan) return 0;
    return plan[durationDays] ?? 0;
}

/**
 * Validate company is verified (approved)
 */
export async function isCompanyVerified(companyId) {
    const company = await Company.findById(companyId).select('status verificationStatus').lean();
    if (!company) return false;
    return company.status === 'approved' || company.verificationStatus === 'approved';
}

/**
 * Validate recruiter is approved and can manage company
 */
export async function isRecruiterApprovedForCompany(recruiterId, companyId) {
    const company = await Company.findById(companyId).select('recruiters').lean();
    if (!company || !company.recruiters?.length) return false;
    const isRecruiter = company.recruiters.some(
        r => r && r.toString() === recruiterId.toString()
    );
    if (!isRecruiter) return false;

    const user = await User.findById(recruiterId).select('recruiterKycStatus').lean();
    if (!user) return false;
    return user.recruiterKycStatus === 'approved';
}

/**
 * Validate job is eligible for promotion
 */
export async function isJobEligibleForPromotion(jobId, companyId) {
    const job = await Job.findById(jobId)
        .populate('company_id', 'status')
        .lean();
    if (!job) return false;
    if (job.status !== 'Active') return false;
    if (job.company_id?._id?.toString() !== companyId?.toString()) return false;
    if (job.moderationStatus && job.moderationStatus !== 'Approved') return false;
    return true;
}

/**
 * Check if job already has active promotion
 */
export async function hasActivePromotion(jobId) {
    const now = new Date();
    const existing = await Promotion.findOne({
        jobId,
        status: { $in: [PROMOTION_STATUSES.ACTIVE, PROMOTION_STATUSES.APPROVED] },
        startDate: { $lte: now },
        endDate: { $gt: now }
    });
    return !!existing;
}

/**
 * Recompute isActive and expired status for promotions
 */
export async function recomputePromotionActiveState(promotionId) {
    const promotion = await Promotion.findById(promotionId);
    if (!promotion) return null;
    const now = new Date();
    if (promotion.status === PROMOTION_STATUSES.ACTIVE && promotion.endDate && promotion.endDate < now) {
        promotion.status = PROMOTION_STATUSES.EXPIRED;
        promotion.isActive = false;
        await promotion.save();
    }
    return promotion;
}

/**
 * Activate promotion on Job model
 */
export async function applyPromotionToJob(promotion) {
    const jobType = PROMOTION_TO_JOB_TYPE[promotion.promotionType] || 'FEATURED';
    await Job.findByIdAndUpdate(promotion.jobId, {
        isPromoted: true,
        promotionType: jobType,
        promotionStartDate: promotion.startDate,
        promotionEndDate: promotion.endDate,
        promotionPriority: promotion.promotionType === PROMOTION_TYPES.HOMEPAGE_HIGHLIGHT ? 10 :
            promotion.promotionType === PROMOTION_TYPES.SPONSORED ? 5 : 1
    });
}

/**
 * Remove promotion from Job model
 */
export async function removePromotionFromJob(jobId) {
    await Job.findByIdAndUpdate(jobId, {
        isPromoted: false,
        promotionType: 'NONE',
        promotionStartDate: null,
        promotionEndDate: null,
        promotionPriority: 0
    });
}
