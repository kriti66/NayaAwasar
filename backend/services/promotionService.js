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
import { invalidateJobLabelCacheForJob } from './userJobLabelEnrichment.js';
import { isJobPubliclyVisible } from '../utils/jobModeration.js';

/**
 * Promotions for jobs that are not publicly visible (hidden, pending_review, deleted, etc.)
 * are hidden from recruiter/admin promotion UIs — those jobs are managed under job moderation.
 * @param {Array<{ jobId: import('mongoose').Types.ObjectId | { _id?: unknown } }>} promotionDocsLean
 */
export async function promotionsVisibleForUiQuery(promotionDocsLean) {
    if (!promotionDocsLean?.length) return [];
    const rawIds = promotionDocsLean.map((p) => p.jobId?._id ?? p.jobId).filter(Boolean);
    const jobIds = [...new Set(rawIds.map((id) => id.toString()))];
    if (!jobIds.length) return [];
    const jobs = await Job.find({ _id: { $in: jobIds } }).select('moderationStatus').lean();
    const visible = new Set(
        jobs.filter((j) => isJobPubliclyVisible(j)).map((j) => j._id.toString())
    );
    return promotionDocsLean.filter((p) => {
        const jid = (p.jobId?._id ?? p.jobId)?.toString?.();
        return jid && visible.has(jid);
    });
}

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
 * Check if company can request free promotion (legacy: count Promotion docs)
 */
export async function canUseFreePromotion(companyId) {
    const used = await getFreePromotionUsedCount(companyId);
    return used < FREE_PROMOTION_QUOTA;
}

/**
 * Free promotion slots in use: pending review, active, expired, or approved (rejected/cancelled do not count).
 */
export async function getRecruiterCommittedFreePromotionSlots(recruiterId) {
    const list = await Promotion.find({
        recruiterId,
        isFreePromotion: true,
        status: {
            $in: [
                PROMOTION_STATUSES.PENDING,
                PROMOTION_STATUSES.ACTIVE,
                PROMOTION_STATUSES.EXPIRED,
                PROMOTION_STATUSES.APPROVED
            ]
        }
    }).lean();
    const visible = await promotionsVisibleForUiQuery(list);
    return visible.length;
}

/**
 * Free promotions that reached activation (for User.freePromotionUsed cache).
 */
export async function getRecruiterCompletedFreePromotionCount(recruiterId) {
    return Promotion.countDocuments({
        recruiterId,
        isFreePromotion: true,
        status: { $in: [PROMOTION_STATUSES.ACTIVE, PROMOTION_STATUSES.EXPIRED, PROMOTION_STATUSES.APPROVED] }
    });
}

/**
 * Sync User.freePromotionUsed from completed free promotions (optional cache for dashboards).
 */
export async function syncRecruiterFreePromotionUsedField(recruiterId) {
    const completed = await getRecruiterCompletedFreePromotionCount(recruiterId);
    await User.findByIdAndUpdate(recruiterId, { $set: { freePromotionUsed: completed } });
    return completed;
}

/**
 * Recruiter may request another free promotion (per recruiter, max FREE_PROMOTION_QUOTA committed slots).
 */
export async function canRecruiterUseFreePromotion(recruiterId) {
    const committed = await getRecruiterCommittedFreePromotionSlots(recruiterId);
    return committed < FREE_PROMOTION_QUOTA;
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
    if (!isJobPubliclyVisible(job)) return false;
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
    await invalidateJobLabelCacheForJob(promotion.jobId);
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
    await invalidateJobLabelCacheForJob(jobId);
}
