/**
 * Shared job listing service for public and jobseeker pages.
 * Ensures consistent promotion visibility, sorting, and enrichment.
 */
import Job from '../models/Job.js';
import Promotion from '../models/Promotion.js';
import { PROMOTION_STATUSES } from '../constants/promotionConfig.js';
import * as promotionService from './promotionService.js';
import { mergeWithBaseFilter } from './jobSearchFilter.js';
import { PUBLIC_MODERATION_MATCH } from '../utils/jobModeration.js';
import { isJobActivelyPromoted } from '../utils/jobPromotionUtils.js';
import { applyUserJobLabels } from './userJobLabelEnrichment.js';

/** Maps Job promotionType to display label */
export const PROMOTION_LABELS = {
    FEATURED: 'Featured Opportunity',
    SPONSORED: 'Sponsored',
    TOP_LISTING: 'Sponsored',
    HOMEPAGE_BANNER: 'Premium Pick',
    NONE: null
};

/**
 * Expire overdue promotions and sync Job documents.
 * Call before fetching job lists to ensure accurate promotion state.
 */
export async function expireOverduePromotions() {
    const now = new Date();
    const overdue = await Promotion.find({
        status: PROMOTION_STATUSES.ACTIVE,
        endDate: { $lt: now }
    });
    for (const p of overdue) {
        p.status = PROMOTION_STATUSES.EXPIRED;
        p.isActive = false;
        await p.save();
        await promotionService.removePromotionFromJob(p.jobId);
    }
}

/**
 * Enrich job with promotion-related fields for frontend.
 */
export function enrichJobWithPromotion(job, now = new Date()) {
    const active = isJobActivelyPromoted(job, now);
    const premiumLabel = active ? (PROMOTION_LABELS[job.promotionType] || 'Promoted') : null;
    return {
        ...job,
        activePromotion: active,
        premiumLabel,
        isPromoted: job.isPromoted ?? false,
        promotionType: job.promotionType || 'NONE',
        promotionPriority: job.promotionPriority ?? 0,
        promotionStartDate: job.promotionStartDate || null,
        promotionEndDate: job.promotionEndDate || null
    };
}

/**
 * Base query filter for publicly visible jobs.
 */
export const BASE_VISIBLE_FILTER = {
    status: 'Active',
    $and: [
        PUBLIC_MODERATION_MATCH,
        {
            $or: [
                { application_deadline: { $exists: false } },
                { application_deadline: { $gte: new Date() } }
            ]
        }
    ]
};

/**
 * Fetch jobs with promotion-aware sorting for public page.
 * Sorts: promoted first (by promotionPriority desc), then by date.
 * @param {Record<string, string>} query - Express req.query (q, category, location, jobType, experienceLevel, tags)
 */
export async function getPublicJobsWithPromotionSort(query = {}) {
    await expireOverduePromotions();
    const now = new Date();

    const filter = mergeWithBaseFilter(BASE_VISIBLE_FILTER, query);
    const jobs = await Job.find(filter)
        .sort({ promotionPriority: -1, createdAt: -1 })
        .populate('company_id', 'name logo location')
        .lean();

    return jobs.map(job => enrichJobWithPromotion(job, now));
}

/**
 * Fetch jobs for jobseeker with promotion-aware sorting.
 * Merges with recommendation scores.
 * Sort: promoted first (by promotionPriority), then by matchScore, then by date.
 */
export async function getJobsForSeekerWithPromotion(userId, getRecommendedJobsFn, query = {}) {
    await expireOverduePromotions();
    const now = new Date();

    const filter = mergeWithBaseFilter(BASE_VISIBLE_FILTER, query);
    const [jobsRaw, recResult] = await Promise.all([
        Job.find(filter)
            .sort({ promotionPriority: -1, createdAt: -1 })
            .populate('company_id', 'name logo location')
            .lean(),
        getRecommendedJobsFn(userId)
    ]);

    const recJobs = recResult?.jobs || [];
    const recMap = new Map();
    recJobs.forEach((rj) => {
        const id = (rj._id || rj.id)?.toString();
        if (id) {
            recMap.set(id, {
                matchScore: rj.matchScore ?? null,
                matchReason: rj.matchReason,
                aiScore: typeof rj.aiScore === 'number' && Number.isFinite(rj.aiScore) ? rj.aiScore : null
            });
        }
    });

    const enriched = jobsRaw.map((job) => {
        const id = (job._id || job.id)?.toString();
        const recData = recMap.get(id);
        const base = enrichJobWithPromotion(job, now);
        return {
            ...base,
            matchScore: recData?.matchScore ?? null,
            matchReason: recData?.matchReason ?? null,
            aiScore: recData?.aiScore ?? null
        };
    });

    // Sort: promoted first (by priority), then by matchScore, then by date
    enriched.sort((a, b) => {
        const aPromo = a.activePromotion ? (a.promotionPriority ?? 0) : -1;
        const bPromo = b.activePromotion ? (b.promotionPriority ?? 0) : -1;
        if (aPromo !== bPromo) return bPromo - aPromo;
        const aScore = a.matchScore ?? -1;
        const bScore = b.matchScore ?? -1;
        if (aScore !== bScore) return bScore - aScore;
        const aDate = new Date(a.createdAt || a.posted_date || 0).getTime();
        const bDate = new Date(b.createdAt || b.posted_date || 0).getTime();
        return bDate - aDate;
    });

    const { jobs: labeled, hasPersonalizationData } = await applyUserJobLabels(userId, enriched);
    return { jobs: labeled, hasPersonalizationData };
}
