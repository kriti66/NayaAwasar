function cloneInterviewState(state) {
    const base = state && typeof state === 'object' ? state : {};
    const history = Array.isArray(base.rescheduleHistory) ? [...base.rescheduleHistory] : [];
    return {
        ...base,
        rescheduleHistory: history,
    };
}

/**
 * @param {object} interviewState
 * @param {'jobseeker'|'recruiter'} requestedBy
 */
export function handleRescheduleRequest(interviewState, requestedBy) {
    const next = cloneInterviewState(interviewState);
    next.rescheduleStatus = 'pending';
    next.rescheduleRequestedBy = requestedBy;
    const prev = typeof next.rescheduleRoundCount === 'number' && Number.isFinite(next.rescheduleRoundCount)
        ? next.rescheduleRoundCount
        : 0;
    next.rescheduleRoundCount = prev + 1;
    next.rescheduleHistory.push({
        action: 'request',
        proposedBy: requestedBy,
        at: new Date(0).toISOString(),
    });
    return next;
}

export function acceptReschedule(interviewState) {
    const next = cloneInterviewState(interviewState);
    next.status = 'rescheduled';
    next.rescheduleStatus = 'accepted';
    return next;
}

export function declineReschedule(interviewState) {
    const next = cloneInterviewState(interviewState);
    next.status = 'declined';
    next.rescheduleStatus = 'rejected';
    return next;
}
