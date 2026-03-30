import {
    getEffectiveInterviewStart,
    toInterviewPlainFromSeekerCard,
    msUntilInterviewStart
} from './interviewDateTime';

/**
 * Effective interview start instant (Nepal wall time / startTime / proposed slot), in ms.
 * @param {object} app Application document from /applications/my-interviews
 * @returns {number | null}
 */
export function getInterviewScheduledAtMs(app) {
    const start = getEffectiveInterviewStart(toInterviewPlainFromSeekerCard(app));
    if (!start) return null;
    const t = start.getTime();
    return Number.isFinite(t) ? t : null;
}

/**
 * Normalized mongo interview status (scheduled / completed / missed / cancelled).
 * @param {object} app
 * @returns {string} lowercase
 */
export function getInterviewMongoStatus(app) {
    const plain = toInterviewPlainFromSeekerCard(app);
    const raw = plain.status || app?.interview?.interviewId?.status || 'Scheduled';
    return String(raw).trim().toLowerCase();
}

/**
 * Badge keys for list UI: SCHEDULED_UPCOMING | MISSED | COMPLETED | CANCELLED
 * @param {object} app
 * @param {number} [nowMs]
 * @returns {'SCHEDULED_UPCOMING'|'MISSED'|'COMPLETED'|'CANCELLED'}
 */
export function getInterviewDisplayStatus(app, nowMs = Date.now()) {
    const ms = getInterviewScheduledAtMs(app);
    const now = nowMs;

    if (ms != null && Number.isFinite(ms) && ms > now) {
        return 'SCHEDULED_UPCOMING';
    }

    const status = getInterviewMongoStatus(app);
    if (status === 'missed') return 'MISSED';
    if (status === 'completed') return 'COMPLETED';
    if (status === 'cancelled') return 'CANCELLED';
    return 'MISSED';
}

/**
 * Split interviews into upcoming (start > now) and past (start <= now or unknown start).
 * @param {object[]} interviews
 * @param {number} [nowMs]
 * @returns {{ upcomingInterviews: object[], pastInterviews: object[] }}
 */
export function getInterviewBuckets(interviews, nowMs = Date.now()) {
    const list = Array.isArray(interviews) ? interviews : [];
    const upcomingInterviews = [];
    const pastInterviews = [];

    for (const app of list) {
        const ms = getInterviewScheduledAtMs(app);
        if (ms == null || !Number.isFinite(ms)) {
            pastInterviews.push(app);
            continue;
        }
        if (ms > nowMs) upcomingInterviews.push(app);
        else pastInterviews.push(app);
    }

    upcomingInterviews.sort((a, b) => getInterviewScheduledAtMs(a) - getInterviewScheduledAtMs(b));
    pastInterviews.sort((a, b) => getInterviewScheduledAtMs(b) - getInterviewScheduledAtMs(a));

    return { upcomingInterviews, pastInterviews };
}

/**
 * Time-until copy for upcoming cards (uses effective start).
 * @param {object} app
 * @returns {string|null} e.g. "Today", "In 2d 3h", or "Past"
 */
export function getTimeUntilInterviewFromApp(app) {
    const ms = msUntilInterviewStart(app);
    if (ms == null) return null;
    if (ms < 0) return 'Past';
    const diffMs = ms;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (diffDays > 0) return `${diffDays}d ${diffHours}h`;
    if (diffHours > 0) return `${diffHours}h`;
    return 'Today';
}
