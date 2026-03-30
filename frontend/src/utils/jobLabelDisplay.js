/**
 * UI config for backend job.label values (single source for copy + styles).
 */

export const BADGE_CONFIG = {
    AI_SUGGESTED: {
        label: 'AI Suggested',
        icon: '✨',
        className: 'bg-teal-100 text-teal-700 border border-teal-300'
    },
    GOOD_MATCH: {
        label: 'Good Match',
        icon: '👍',
        className: 'bg-blue-100 text-blue-700 border border-blue-300'
    },
    SPONSORED: {
        label: 'Sponsored',
        icon: '📈',
        className: 'bg-purple-100 text-purple-700 border border-purple-300'
    },
    FEATURED: {
        label: 'Featured Opportunity',
        icon: '⭐',
        className: 'bg-yellow-100 text-yellow-700 border border-yellow-300'
    }
};

export const MAX_BADGES = {
    AI_SUGGESTED: 3,
    SPONSORED: 2,
    FEATURED: 5,
    GOOD_MATCH: 5
};

export const FALLBACK_REASONS = {
    AI_SUGGESTED: 'This job strongly matches your profile',
    GOOD_MATCH: 'This job partially matches your profile',
    SPONSORED: 'Promoted listing',
    FEATURED: 'Highlighted by employer or admin'
};

/**
 * Per rendered list: cap visible badges without removing jobs.
 * Sets visibleLabel (string | null) on each item.
 */
export function applyVisibleBadgeLimits(jobs) {
    if (!Array.isArray(jobs)) return [];
    const counts = { AI_SUGGESTED: 0, SPONSORED: 0, FEATURED: 0, GOOD_MATCH: 0 };
    return jobs.map((job) => {
        const label = job.label;
        if (!label || !MAX_BADGES[label]) {
            return { ...job, visibleLabel: null };
        }
        counts[label] += 1;
        if (counts[label] > MAX_BADGES[label]) {
            return { ...job, visibleLabel: null };
        }
        return { ...job, visibleLabel: label };
    });
}

export function getJobDisplayReason(job) {
    const key = job.visibleLabel || job.label;
    const raw = job.reason || job.matchReason;
    if (raw && String(raw).trim()) return String(raw).trim();
    if (key && FALLBACK_REASONS[key]) return FALLBACK_REASONS[key];
    return null;
}
