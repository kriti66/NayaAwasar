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

export function pickFriendlyRecommendationLine(matchReason, job = {}) {
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

/** True when this row came from AI / scored recommendations (show % + badge). */
export function jobHasRecommendationScore(job) {
    if (!job) return false;
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
export function getMatchStrengthDisplay(job) {
    if (!jobHasRecommendationScore(job)) {
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

    if (pct >= 75) {
        return {
            showBadge: true,
            badge: 'Strong Match',
            pct,
            badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
            barClass: 'bg-[#29a08e]'
        };
    }
    if (pct >= 55) {
        return {
            showBadge: true,
            badge: 'Good Match',
            pct,
            badgeClass: 'bg-amber-100 text-amber-900 border border-amber-200',
            barClass: 'bg-amber-500'
        };
    }
    return {
        showBadge: true,
        badge: 'Relevant',
        pct,
        badgeClass: 'bg-sky-100 text-sky-900 border border-sky-300',
        barClass: 'bg-sky-500'
    };
}
