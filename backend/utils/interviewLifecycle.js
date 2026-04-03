import {
    getEffectiveInterviewStart,
    buildInterviewEndDateTime,
    getInterviewJoinWindow
} from './interviewDateTime.js';

/**
 * @typedef {'SCHEDULED'|'LIVE'|'MISSED'|'PENDING_RESULT'|'COMPLETED_PASSED'|'COMPLETED_REJECTED'|'RESCHEDULE_REQUESTED'|'CANCELLED'} InterviewLifecycleStatus
 */

/**
 * Computed lifecycle for UI and permission checks (does not mutate the document).
 * @param {object} interview Plain object or Mongoose doc
 * @param {Date} [now]
 * @returns {{ status: InterviewLifecycleStatus, effectiveStart: Date|null, effectiveEnd: Date|null, joinWindow: ReturnType<typeof getInterviewJoinWindow>|null }}
 */
export function computeInterviewLifecycle(interview, now = new Date()) {
    const effectiveStart = getEffectiveInterviewStart(interview);
    const effectiveEnd = buildInterviewEndDateTime(interview);
    const joinWindow = getInterviewJoinWindow(interview);

    if (!interview) {
        return {
            status: 'SCHEDULED',
            effectiveStart: null,
            effectiveEnd: null,
            joinWindow: null
        };
    }

    if (interview.status === 'Cancelled') {
        return { status: 'CANCELLED', effectiveStart, effectiveEnd, joinWindow };
    }

    const pendingCalendar =
        interview.calendarStatus === 'pending_acceptance' || interview.interviewStatus === 'pending_acceptance';
    if (pendingCalendar && interview.acceptedBySeeker === false) {
        return {
            status: 'PENDING_ACCEPTANCE',
            effectiveStart,
            effectiveEnd,
            joinWindow
        };
    }

    const rs = String(interview.rescheduleStatus || '').toUpperCase();
    const pendingJobseeker =
        interview.interviewStatus === 'reschedule_pending' &&
        interview.rescheduleRequestedBy === 'jobseeker' &&
        rs === 'PENDING';
    const pendingRecruiter =
        interview.interviewStatus === 'reschedule_pending' &&
        interview.rescheduleRequestedBy === 'recruiter' &&
        ['PROPOSED', 'PENDING'].includes(rs);

    if (pendingJobseeker || pendingRecruiter) {
        return {
            status: 'RESCHEDULE_REQUESTED',
            effectiveStart,
            effectiveEnd,
            joinWindow
        };
    }

    if (interview.status === 'Completed') {
        if (interview.result === 'passed') {
            return { status: 'COMPLETED_PASSED', effectiveStart, effectiveEnd, joinWindow };
        }
        if (interview.result === 'rejected') {
            return { status: 'COMPLETED_REJECTED', effectiveStart, effectiveEnd, joinWindow };
        }
        return { status: 'PENDING_RESULT', effectiveStart, effectiveEnd, joinWindow };
    }

    if (interview.status === 'Missed') {
        return { status: 'MISSED', effectiveStart, effectiveEnd, joinWindow };
    }

    if (!effectiveStart || !joinWindow) {
        return { status: 'SCHEDULED', effectiveStart, effectiveEnd, joinWindow };
    }

    const t = now.getTime();
    const joinFrom = joinWindow.joinAllowedFrom.getTime();
    const joinUntil = joinWindow.joinAllowedUntil.getTime();

    if (t < joinFrom) {
        return { status: 'SCHEDULED', effectiveStart, effectiveEnd, joinWindow };
    }

    // Align LIVE with ZEGO token window (early join through late join cap).
    if (t <= joinUntil) {
        return { status: 'LIVE', effectiveStart, effectiveEnd, joinWindow };
    }

    if (interview.joined) {
        return { status: 'PENDING_RESULT', effectiveStart, effectiveEnd, joinWindow };
    }
    return { status: 'MISSED', effectiveStart, effectiveEnd, joinWindow };
}

/** @deprecated alias */
export function computeInterviewStatus(interview, now) {
    return computeInterviewLifecycle(interview, now).status;
}
