/**
 * User-facing match copy. Raw matchReason uses " | " segments; we pick ONE line
 * by signal strength (skills & field first; location & job type before generic experience
 * so cards vary when many listings share the same level).
 */

/** Lower = wins when multiple segments are present. */
const SEGMENT_PRIORITY = {
    skills: 0,
    category: 1,
    location: 2,
    jobType: 3,
    experience: 4,
    other: 5
};

function classifySegment(seg) {
    const s = seg.trim();
    if (/^Matches your skills:/i.test(s)) return { pri: SEGMENT_PRIORITY.skills, type: 'skills', s };
    if (/strongly matches the following job requirements/i.test(s)) {
        return { pri: SEGMENT_PRIORITY.skills, type: 'skills_vocab', s };
    }
    if (/Same career field\s*\(/i.test(s) || /Same field as your profile/i.test(s)) {
        return { pri: SEGMENT_PRIORITY.category, type: 'category', s };
    }
    if (/Near your location:/i.test(s)) return { pri: SEGMENT_PRIORITY.location, type: 'location', s };
    if (/location preference/i.test(s)) return { pri: SEGMENT_PRIORITY.location, type: 'location', s };
    if (/Aligns with your preferred job type|preferred job type/i.test(s)) {
        return { pri: SEGMENT_PRIORITY.jobType, type: 'jobType', s };
    }
    if (/Matches your experience level/i.test(s)) return { pri: SEGMENT_PRIORITY.experience, type: 'experience', s };
    if (/Role aligns|keyword overlap|High similarity|strongly matches the following job requirements/i.test(s)) {
        return { pri: SEGMENT_PRIORITY.category, type: 'category', s };
    }
    return { pri: SEGMENT_PRIORITY.other, type: 'other', s };
}

function segmentToFriendly(classified, job) {
    const s = classified.s;
    switch (classified.type) {
        case 'skills_vocab': {
            const m = s.match(/requirements:\s*(.+?)\./i);
            const rest = m ? m[1].trim() : '';
            const first = rest.split(',')[0].trim();
            if (first) return `Great fit for your ${first} skills`;
            return 'Great fit for your skills';
        }
        case 'skills': {
            const m = s.match(/Matches your skills:\s*(.+)/i);
            const rest = m ? m[1].split('|')[0].trim() : '';
            const first = rest.split(',')[0].trim();
            if (first) return `Great fit for your ${first} skills`;
            return 'Great fit for your skills';
        }
        case 'category': {
            const paren = s.match(/\(([^)]+)\)/);
            if (paren) return `Matches your ${paren[1].trim()} field`;
            const col = s.match(/:\s*(.+)/i);
            if (col) return `Matches your ${col[1].trim()} field`;
            if (job.category) return `Matches your ${job.category} field`;
            return 'Matches your professional field';
        }
        case 'experience':
            return 'Perfect for your experience level';
        case 'location': {
            const m = s.match(/Near your location:\s*([^|]+)/i);
            const city = m ? m[1].trim() : job.location || 'your area';
            return `Opportunity near you in ${city}`;
        }
        case 'jobType': {
            const p = s.match(/\(([^)]+)\)/);
            const t = p ? p[1].trim().toLowerCase() : 'work';
            return `Matches your ${t} preference`;
        }
        default:
            return 'Recommended based on your profile';
    }
}

/** Honest copy when listings use scored fallback (not AI service). */
export function pickFallbackListingLine(job = {}) {
    const id = String(job?._id || job?.id || '');
    let h = 0;
    for (let i = 0; i < id.length; i++) {
        h = (h + id.charCodeAt(i)) % 2;
    }
    return h === 0 ? 'Popular in your area' : 'Trending Jobs';
}

function pickFromSegmentedReason(matchReason, job) {
    const raw = String(matchReason || '').trim();
    if (!raw) return 'Recommended based on your profile';

    const segments = raw
        .split('|')
        .map((x) => x.trim())
        .filter(Boolean);
    if (segments.length === 0) return 'Recommended based on your profile';

    const classified = segments.map(classifySegment);
    classified.sort((a, b) => a.pri - b.pri);
    const best = classified[0];
    if (best.type === 'other' && classified.length > 1) {
        return segmentToFriendly(classified.find((c) => c.type !== 'other') || best, job);
    }
    return segmentToFriendly(best, job);
}

/**
 * @param {object} [options]
 * @param {'ai'|'fallback'} [options.provider] — from API recommendationMeta.provider
 */
export function pickFriendlyRecommendationLine(matchReason, job = {}, options = {}) {
    if (job.recommendationMatchScope === 'cross_category') {
        return 'You might also like';
    }

    if (options.matchBadgeOverride === 'Relevant') {
        return 'You might also like';
    }

    const recMeta = options.recMeta;
    if (recMeta && jobHasRecommendationScore(job, recMeta)) {
        const strength = getMatchStrengthDisplay(job, recMeta);
        if (strength.badge === 'Relevant') {
            return 'You might also like';
        }
    }

    const provider = options.provider || options.recommendationProvider;
    if (provider === 'fallback') {
        return pickFromSegmentedReason(matchReason, job);
    }

    return pickFromSegmentedReason(matchReason, job);
}

/** @returns {boolean} */
export function jobCategoryMatchesRecMeta(job, recMeta) {
    const list = recMeta?.professionCategories;
    if (!Array.isArray(list) || list.length === 0) return true;
    const jc = String(job.category || '').trim().toLowerCase();
    return list.some((c) => String(c).trim().toLowerCase() === jc);
}

/**
 * True when this row may show match % / bar (backend still sends scores; UI gates via recMeta).
 * @param {object} [recMeta] — API `recommendationMeta`; if omitted, legacy permissive behavior.
 */
export function jobHasRecommendationScore(job, recMeta) {
    if (!job) return false;
    if (recMeta != null && recMeta.showMatchScores !== true) {
        return false;
    }
    if (job.recommendationType === 'ai_match' || job.recommendationType === 'fallback_scored') return true;
    if (typeof job.matchScore === 'number' && Number.isFinite(job.matchScore) && job.matchScore >= 40) return true;
    if (typeof job.aiScore === 'number' && Number.isFinite(job.aiScore)) {
        const pct = job.aiScore <= 1 ? Math.round(job.aiScore * 100) : Math.round(job.aiScore);
        return pct >= 40;
    }
    return false;
}

/**
 * Badge + thresholds on 40–100 display scale.
 * @returns {{ showBadge: boolean, badge: string|null, pct: number|null, badgeClass: string, barClass: string }}
 */
export function getMatchStrengthDisplay(job, recMeta) {
    if (!jobHasRecommendationScore(job, recMeta)) {
        return {
            showBadge: false,
            badge: null,
            pct: null,
            badgeClass: '',
            barClass: 'bg-gray-400'
        };
    }

    let pct;
    if (typeof job.matchScore === 'number' && Number.isFinite(job.matchScore)) {
        pct = Math.round(job.matchScore);
    } else if (typeof job.aiScore === 'number' && Number.isFinite(job.aiScore)) {
        pct = job.aiScore <= 1 ? Math.round(job.aiScore * 100) : Math.round(job.aiScore);
    } else {
        return {
            showBadge: false,
            badge: null,
            pct: null,
            badgeClass: '',
            barClass: 'bg-gray-400'
        };
    }

    pct = Math.min(100, Math.max(40, pct));

    const isAiProvider = recMeta?.provider === 'ai';
    const crossCategory = job.recommendationMatchScope === 'cross_category';
    const categoryAligned = jobCategoryMatchesRecMeta(job, recMeta);

    const relevantClass = 'bg-sky-100 text-sky-900 border border-sky-300';
    const relevantBar = 'bg-sky-500';

    let tierBadge = 'Relevant';
    let badgeClass = relevantClass;
    let barClass = relevantBar;

    if (pct >= 75) {
        tierBadge = 'Strong Match';
        badgeClass = 'bg-emerald-100 text-emerald-800 border border-emerald-300';
        barClass = 'bg-[#29a08e]';
    } else if (pct >= 55) {
        tierBadge = 'Good Match';
        badgeClass = 'bg-amber-100 text-amber-900 border border-amber-200';
        barClass = 'bg-amber-500';
    }

    const allowStrongTiers = isAiProvider && !crossCategory && categoryAligned;

    if (isAiProvider && (!allowStrongTiers || crossCategory || !categoryAligned)) {
        return {
            showBadge: true,
            badge: 'Relevant',
            pct,
            badgeClass: relevantClass,
            barClass: relevantBar
        };
    }

    return {
        showBadge: Boolean(isAiProvider && tierBadge),
        badge: isAiProvider ? tierBadge : null,
        pct,
        badgeClass: isAiProvider ? badgeClass : '',
        barClass
    };
}

function jobHasGoodOrAiMatchLabel(job) {
    const v = job.visibleLabel || job.label;
    return v === 'GOOD_MATCH' || v === 'AI_SUGGESTED';
}

/**
 * Find Jobs / browse list: hide match chrome for blocked categories; adjacent-only → Relevant;
 * primary-field jobs show % only with GOOD_MATCH / AI_SUGGESTED or AI tier badge.
 * @returns {{ showMatchUi: boolean, strength: object }}
 */
export function getListPageMatchPresentation(job, recMeta) {
    if (!recMeta?.categoryGateActive) {
        const strength = getMatchStrengthDisplay(job, recMeta);
        return {
            showMatchUi: jobHasRecommendationScore(job, recMeta),
            strength
        };
    }

    const c = String(job.category || '').trim();
    const emptyStrength = {
        showBadge: false,
        badge: null,
        pct: null,
        badgeClass: '',
        barClass: 'bg-gray-400'
    };

    if (recMeta.blockedCategories?.includes(c)) {
        return { showMatchUi: false, strength: emptyStrength };
    }

    if (!recMeta.adjacentCategories?.includes(c)) {
        return { showMatchUi: false, strength: emptyStrength };
    }

    if (!jobHasRecommendationScore(job, recMeta)) {
        return { showMatchUi: false, strength: emptyStrength };
    }

    const base = getMatchStrengthDisplay(job, recMeta);
    const inAllowed = recMeta.allowedCategories?.includes(c);

    if (!inAllowed) {
        return {
            showMatchUi: true,
            strength: {
                showBadge: true,
                badge: 'Relevant',
                pct: base.pct,
                badgeClass: 'bg-sky-100 text-sky-900 border border-sky-300',
                barClass: 'bg-sky-500'
            }
        };
    }

    const tierFromAi = base.showBadge && base.badge;
    if (!jobHasGoodOrAiMatchLabel(job) && !tierFromAi) {
        return { showMatchUi: false, strength: emptyStrength };
    }

    return { showMatchUi: true, strength: base };
}
