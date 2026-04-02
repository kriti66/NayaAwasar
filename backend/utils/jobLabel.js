import { computeSeekerProfileMetrics, getNormalizedSkills } from './seekerProfileScoring.js';

const OVERRIDE_SET = new Set(['AI_SUGGESTED', 'SPONSORED', 'FEATURED', 'GOOD_MATCH']);

/**
 * Load AI / good-match thresholds from environment (no hardcoding in business logic).
 */
export function parseLabelThresholdsFromEnv() {
    const ai = parseFloat(process.env.AI_SUGGESTED_THRESHOLD ?? '0.85');
    const good = parseFloat(process.env.GOOD_MATCH_THRESHOLD ?? '0.65');
    return {
        AI_SUGGESTED_THRESHOLD: Number.isFinite(ai) ? Math.min(1, Math.max(0, ai)) : 0.85,
        GOOD_MATCH_THRESHOLD: Number.isFinite(good) ? Math.min(1, Math.max(0, good)) : 0.65
    };
}

export function normalizeLabelOverride(raw) {
    if (raw == null || raw === '') return null;
    const s = String(raw)
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '_');
    return OVERRIDE_SET.has(s) ? s : null;
}

/**
 * Single final label per job. Priority:
 * 1) admin labelOverride
 * 2) SPONSORED
 * 3) AI_SUGGESTED (needs profile + score)
 * 4) FEATURED
 * 5) GOOD_MATCH (needs profile + score)
 * 6) null
 *
 * @param {object} p
 * @param {number|null} p.score — similarity 0..1
 * @param {boolean} p.isSponsored
 * @param {boolean} p.isFeatured
 * @param {boolean} p.hasProfileData
 * @param {string|null|undefined} p.labelOverride — from Job.labelOverride
 * @returns {'AI_SUGGESTED'|'SPONSORED'|'FEATURED'|'GOOD_MATCH'|null}
 */
export function getJobLabel({ score, isSponsored, isFeatured, hasProfileData, labelOverride }) {
    const override = normalizeLabelOverride(labelOverride);
    if (override) return override;

    const { AI_SUGGESTED_THRESHOLD, GOOD_MATCH_THRESHOLD } = parseLabelThresholdsFromEnv();
    const s = typeof score === 'number' && Number.isFinite(score) ? Math.min(1, Math.max(0, score)) : 0;

    if (isSponsored) return 'SPONSORED';
    if (hasProfileData && s >= AI_SUGGESTED_THRESHOLD) return 'AI_SUGGESTED';
    if (isFeatured) return 'FEATURED';
    if (hasProfileData && s >= GOOD_MATCH_THRESHOLD) return 'GOOD_MATCH';
    return null;
}

/**
 * Enough data to show AI_SUGGESTED / GOOD_MATCH (not for SPONSORED/FEATURED).
 */
export function seekerHasPersonalizationData(mergedUserLike) {
    if (!mergedUserLike) return false;
    const skills = getNormalizedSkills(mergedUserLike.skills);
    const metrics = computeSeekerProfileMetrics(mergedUserLike);
    if (skills.length >= 2) return true;
    if (skills.length >= 1 && metrics.profileCompletionPercent >= 35) return true;
    if (metrics.profileCompletionPercent >= 50) return true;
    return false;
}

/**
 * Heuristic skill overlap for API payloads (Python reason may also mention skills).
 */
export function computeMatchedAndMissingSkills(mergedUserLike, job) {
    const userSkills = getNormalizedSkills(mergedUserLike?.skills);
    const jobText = [
        job?.title,
        job?.description,
        job?.job_description,
        job?.requirements,
        ...(Array.isArray(job?.tags) ? job.tags : [])
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
    const tagsLower = (Array.isArray(job?.tags) ? job.tags : []).map((t) => String(t).toLowerCase());

    const matched = [];
    const seen = new Set();
    for (const sk of userSkills) {
        const sl = sk.toLowerCase();
        if (seen.has(sl)) continue;
        if (jobText.includes(sl) || tagsLower.some((t) => t.includes(sl) || sl.includes(t))) {
            matched.push(sk);
            seen.add(sl);
        }
        if (matched.length >= 8) break;
    }

    const missing = [];
    for (const t of job?.tags || []) {
        const tl = String(t).toLowerCase();
        if (!tl || userSkills.every((u) => u.toLowerCase() !== tl && !tl.includes(u.toLowerCase())))
            missing.push(String(t));
        if (missing.length >= 8) break;
    }

    return { matchedSkills: matched, missingSkills: missing };
}

export function getRecommendationModelVersion() {
    return String(process.env.RECOMMENDATION_MODEL_VERSION || 'v3-match-display').trim() || 'v3-match-display';
}
