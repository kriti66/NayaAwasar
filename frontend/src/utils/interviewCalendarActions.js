import { isInterviewUpcoming } from './interviewCalendarUi';

function normalizeRole(role) {
    const r = String(role || '').toLowerCase();
    if (r === 'job_seeker') return 'jobseeker';
    return r;
}

/**
 * Shared action visibility for interview calendar cards.
 * Keeps role and status rules consistent across recruiter + jobseeker views.
 */
export function getAvailableInterviewActions(interview, currentUserRole) {
    const role = normalizeRole(currentUserRole);
    const status = String(interview?.status || '').toLowerCase();
    const isRecruiter = role === 'recruiter';
    const isScheduled = status === 'scheduled';
    const isPendingAcceptance = status === 'pending_acceptance';
    const isRescheduleRequested = status === 'reschedule_requested';
    const isTerminal =
        status === 'completed' || status === 'cancelled' || status === 'missed';
    const isUpcoming = !!interview && isInterviewUpcoming(interview);

    const canViewInterview = (isScheduled || isPendingAcceptance) && !isTerminal;
    const canRequestReschedule = isScheduled && isUpcoming;
    const canCancelInterview = isRecruiter && !isTerminal;
    const canShowMarkComplete = false; // Completion is system-driven from call participation lifecycle.

    return {
        canViewInterview,
        canRequestReschedule,
        canCancelInterview,
        canShowMarkComplete,
        canShowActionsAtAll:
            canViewInterview ||
            canRequestReschedule ||
            canCancelInterview ||
            isRescheduleRequested ||
            isPendingAcceptance
    };
}

