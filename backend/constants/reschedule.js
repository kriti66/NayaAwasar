/** Max back-and-forth reschedule proposals per interview (inclusive). */
export const MAX_RESCHEDULE_ROUNDS = 3;

/** Hours until a pending / countered request expires if unanswered. */
export const RESCHEDULE_EXPIRY_HOURS = 48;

export const RESCHEDULE_FSM = {
    NONE: 'none',
    PENDING: 'pending',
    COUNTERED: 'countered',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    EXPIRED: 'expired'
};
