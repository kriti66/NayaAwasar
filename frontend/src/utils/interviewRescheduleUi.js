/** Keep in sync with backend `MAX_RESCHEDULE_ROUNDS`. */
export const MAX_RESCHEDULE_ROUNDS = 3;

const NEPAL_TZ = 'Asia/Kathmandu';

const FSM_IDLE_SHOW_REQUEST = new Set(['none', 'accepted', 'rejected', 'expired', '']);

/**
 * Format an instant (ISO string or Date) for display in Nepal time.
 */
export function formatRescheduleInstantNepal(isoOrDate) {
    if (isoOrDate == null) return '—';
    const d = new Date(isoOrDate);
    if (Number.isNaN(d.getTime())) return '—';
    try {
        return new Intl.DateTimeFormat('en-GB', {
            timeZone: NEPAL_TZ,
            dateStyle: 'medium',
            timeStyle: 'short'
        }).format(d);
    } catch {
        return d.toISOString();
    }
}

function proposerLabel(proposedBy) {
    if (proposedBy === 'recruiter') return 'Recruiter';
    if (proposedBy === 'jobseeker') return 'Jobseeker';
    return 'Other party';
}

/**
 * @param {object} interview — calendar item from API (snake_case), including optional `reschedule_fsm`
 * @param {'recruiter'|'jobseeker'} role
 */
export function getInterviewRescheduleUiState(interview, role) {
    const fsm = interview.reschedule_fsm || {};
    const status = String(fsm.status || 'none').toLowerCase();
    const requestedBy = fsm.requested_by || null;
    const roundCount = typeof fsm.round_count === 'number' ? fsm.round_count : 0;

    const empty = {
        showRequestReschedule: false,
        showAccept: false,
        showDecline: false,
        showCounter: false,
        counterMaxMessage: null,
        showWaitingForOther: false,
        showCancelMyRequest: false,
        waitingMessage: null,
        activeFsm: false,
        legacyAcceptOnly: false
    };

    if (status === 'pending' || status === 'countered') {
        const iAmRequester = requestedBy === role;
        if (iAmRequester) {
            return {
                ...empty,
                activeFsm: true,
                showWaitingForOther: true,
                showCancelMyRequest: true,
                waitingMessage: 'Waiting for the other party to respond to your reschedule request.'
            };
        }
        const out = {
            ...empty,
            activeFsm: true,
            showAccept: true,
            showDecline: true
        };
        if (roundCount >= MAX_RESCHEDULE_ROUNDS) {
            out.counterMaxMessage =
                'Maximum reschedule attempts reached. Please accept the proposed time or decline to keep the original slot.';
        } else {
            out.showCounter = true;
        }
        return out;
    }

    const cal = interview.status;
    const legacy = interview.reschedule_request;
    if (legacy && cal === 'reschedule_requested') {
        const proposer = legacy.proposed_by;
        if (proposer && proposer !== role) {
            return { ...empty, legacyAcceptOnly: true, showAccept: true };
        }
        return {
            ...empty,
            showWaitingForOther: true,
            waitingMessage: 'Waiting for the other party to respond to your reschedule request.'
        };
    }

    if (FSM_IDLE_SHOW_REQUEST.has(status)) {
        return { ...empty, showRequestReschedule: true };
    }

    return { ...empty, showRequestReschedule: true };
}

export function rescheduleProposerDisplayName(fsm) {
    return proposerLabel(fsm?.requested_by);
}
