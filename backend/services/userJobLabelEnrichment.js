import mongoose from 'mongoose';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import UserJobLabelCache from '../models/UserJobLabelCache.js';
import {
    computeSeekerProfileMetrics,
    mergeSeekerDataForScoring
} from '../utils/seekerProfileScoring.js';
import {
    getJobLabel,
    seekerHasPersonalizationData,
    computeMatchedAndMissingSkills,
    getRecommendationModelVersion
} from '../utils/jobLabel.js';
import { buildFallbackFilterContext } from '../utils/recommendationFallback.js';
import { deriveSponsoredFeaturedFlags } from '../utils/jobPromotionUtils.js';
import { getNormalizedSkills } from '../utils/seekerProfileScoring.js';

const CACHE_TTL_MS = Math.max(
    60000,
    Math.min(
        24 * 60 * 60 * 1000,
        parseInt(process.env.JOB_LABEL_CACHE_TTL_MS || '3600000', 10) || 3600000
    )
);

export async function invalidateUserJobLabelCache(userId) {
    if (!userId) return;
    await UserJobLabelCache.deleteMany({ userId: new mongoose.Types.ObjectId(userId) });
}

export async function invalidateJobLabelCacheForJob(jobId) {
    if (!jobId) return;
    await UserJobLabelCache.deleteMany({ jobId: new mongoose.Types.ObjectId(jobId) });
}

async function loadSeekerMerged(userId) {
    const [user, profile] = await Promise.all([
        User.findById(userId)
            .select(
                'fullName email phoneNumber location bio profileImage professionalHeadline linkedinUrl portfolioUrl skills workExperience education resume resume_url kycStatus isKycVerified jobPreferences profession category'
            )
            .lean(),
        Profile.findOne({ userId })
            .select('headline summary location skills experience education jobPreferences resume')
            .lean()
    ]);
    if (!user) return { merged: null, hasPersonalizationData: false };
    const merged = mergeSeekerDataForScoring(user, profile || {});
    return {
        merged,
        hasPersonalizationData: seekerHasPersonalizationData(merged)
    };
}

/**
 * Seeker gates for match % / GOOD_MATCH (KYC + profile strength).
 */
export async function loadSeekerRecommendationContext(userId) {
    const { merged, hasPersonalizationData } = await loadSeekerMerged(userId);
    if (!merged) {
        return {
            overallStrength: 0,
            kycVerified: false,
            hasPersonalizationData: false,
            professionCategories: [],
            matchAllowedCategories: [],
            adjacentCategories: [],
            blockedCategories: [],
            categoryGateActive: false
        };
    }
    const m = computeSeekerProfileMetrics(merged);
    const fc = buildFallbackFilterContext({
        jobTitle: merged.jobTitle || '',
        professionalHeadline: merged.professionalHeadline || '',
        headline: '',
        skills: getNormalizedSkills(merged.skills),
        workExperience: merged.workExperience || [],
        workExperienceTitles: [],
        profession: merged.profession || merged.category || '',
        userCategory: merged.category || '',
        jobPreferences: merged.jobPreferences || {},
        profileJobPreferences: merged.jobPreferences || {}
    });
    const professionStrings = [
        merged.profession,
        merged.category,
        merged.jobPreferences?.category
    ]
        .map((x) => String(x || '').trim())
        .filter(Boolean);
    const professionCategories = [
        ...new Set([
            ...fc.matchAllowedCategories,
            ...fc.adjacentCategories,
            ...[...fc.categoryHints],
            ...professionStrings
        ])
    ].filter(Boolean);

    return {
        overallStrength: m.overallStrength,
        kycVerified: m.kycVerified,
        hasPersonalizationData,
        professionCategories,
        matchAllowedCategories: fc.matchAllowedCategories,
        adjacentCategories: fc.adjacentCategories,
        blockedCategories: fc.blockedCategories,
        categoryGateActive: fc.blockedCategories.length > 0
    };
}

function resolveAiScore(job) {
    if (typeof job.aiScore === 'number' && Number.isFinite(job.aiScore)) {
        return Math.min(1, Math.max(0, job.aiScore));
    }
    if (job.matchScore != null && Number.isFinite(Number(job.matchScore))) {
        const n = Number(job.matchScore);
        return n > 1 ? Math.min(1, n / 100) : Math.min(1, Math.max(0, n));
    }
    return null;
}

/**
 * Attach label (always recomputed from live job promotion flags), aiScore, reason, skills.
 * Caches AI-derived fields per (userId, jobId) with TTL so feeds stay consistent.
 */
export async function applyUserJobLabels(userId, jobs, recOptions = {}) {
    if (!userId || !Array.isArray(jobs) || jobs.length === 0) {
        return { jobs: jobs || [], hasPersonalizationData: false };
    }

    const recommendationProvider = recOptions.recommendationProvider;
    const overallStrength = recOptions.overallStrength;
    const kycVerified = recOptions.kycVerified;
    const professionCategories = Array.isArray(recOptions.professionCategories)
        ? recOptions.professionCategories
        : [];
    const matchTierCategories = recOptions.matchTierCategories;
    const categoryGate = recOptions.categoryGate;

    const { merged, hasPersonalizationData } = await loadSeekerMerged(userId);
    const modelVersion = getRecommendationModelVersion();
    const now = new Date();
    const expiresAt = new Date(Date.now() + CACHE_TTL_MS);

    if (!merged) {
        for (const job of jobs) {
            const { isSponsored, isFeatured } = deriveSponsoredFeaturedFlags(job, now);
            job.isSponsored = isSponsored;
            job.isFeatured = isFeatured;
            job.hasPersonalizationData = false;
            job.labelOverride = job.labelOverride ?? null;
            job.aiScore = resolveAiScore(job);
            job.reason = job.matchReason || job.reason || null;
            job.matchedSkills = [];
            job.missingSkills = [];
            job.label = getJobLabel({
                score: job.aiScore ?? 0,
                isSponsored,
                isFeatured,
                hasProfileData: false,
                labelOverride: job.labelOverride,
                recommendationProvider,
                overallStrength,
                kycVerified,
                jobCategory: job.category,
                professionCategories,
                recommendationMatchScope: job.recommendationMatchScope,
                matchTierCategories
            });
            delete job.isRecommended;
        }
        return { jobs, hasPersonalizationData: false };
    }

    const oids = jobs.map((j) => j._id).filter(Boolean);
    const cached = await UserJobLabelCache.find({
        userId: new mongoose.Types.ObjectId(userId),
        jobId: { $in: oids },
        modelVersion,
        expiresAt: { $gt: now }
    }).lean();

    const cacheByJob = new Map(cached.map((c) => [c.jobId.toString(), c]));
    const bulkOps = [];

    for (const job of jobs) {
        const idStr = job._id?.toString?.();
        if (!idStr) continue;

        job.labelOverride = job.labelOverride ?? null;
        job.hasPersonalizationData = hasPersonalizationData;

        const hit = cacheByJob.get(idStr);
        const cacheOk = Boolean(hit);

        if (cacheOk) {
            job.aiScore =
                typeof hit.aiScore === 'number' && Number.isFinite(hit.aiScore)
                    ? hit.aiScore
                    : resolveAiScore(job);
            job.reason = hit.reason || job.matchReason || null;
            job.matchedSkills = Array.isArray(hit.matchedSkills) ? hit.matchedSkills : [];
            job.missingSkills = Array.isArray(hit.missingSkills) ? hit.missingSkills : [];
            if (!job.matchedSkills.length && !job.missingSkills.length) {
                const m = computeMatchedAndMissingSkills(merged, job);
                job.matchedSkills = m.matchedSkills;
                job.missingSkills = m.missingSkills;
            }
        } else {
            job.aiScore = resolveAiScore(job);
            job.reason = job.matchReason || job.reason || null;
            const m = computeMatchedAndMissingSkills(merged, job);
            job.matchedSkills = m.matchedSkills;
            job.missingSkills = m.missingSkills;
        }

        const { isSponsored, isFeatured } = deriveSponsoredFeaturedFlags(job, now);
        job.isSponsored = isSponsored;
        job.isFeatured = isFeatured;

        const jCat = String(job.category || '').trim();
        if (categoryGate?.blocked?.has(jCat)) {
            job.aiScore = null;
            job.matchScore = null;
            job.matchReason = null;
            job.reason = null;
            job.recommendationType = null;
            job.recommendationMatchScope = null;
        }

        job.label = getJobLabel({
                score: job.aiScore ?? 0,
                isSponsored,
                isFeatured,
                hasProfileData: hasPersonalizationData,
                labelOverride: job.labelOverride,
                recommendationProvider,
                overallStrength,
                kycVerified,
                jobCategory: job.category,
                professionCategories,
                recommendationMatchScope: job.recommendationMatchScope,
                matchTierCategories
            });

        if (!cacheOk) {
            bulkOps.push({
                updateOne: {
                    filter: {
                        userId: new mongoose.Types.ObjectId(userId),
                        jobId: job._id
                    },
                    update: {
                        $set: {
                            aiScore: job.aiScore,
                            reason: job.reason || '',
                            matchedSkills: job.matchedSkills,
                            missingSkills: job.missingSkills,
                            computedAt: now,
                            modelVersion,
                            expiresAt,
                            label: job.label
                        }
                    },
                    upsert: true
                }
            });
        }

        delete job.isRecommended;
    }

    if (bulkOps.length) {
        await UserJobLabelCache.bulkWrite(bulkOps, { ordered: false });
    }

    return { jobs, hasPersonalizationData };
}
