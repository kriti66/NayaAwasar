const PENDING = new Set(['pending']);
const APPROVED = new Set(['approved']);
const REJECTED = new Set(['rejected']);

export function isPendingKYC(status) {
    if (status == null || typeof status !== 'string') return false;
    return PENDING.has(status.trim().toLowerCase());
}

export function isApprovedKYC(status) {
    if (status == null || typeof status !== 'string') return false;
    return APPROVED.has(status.trim().toLowerCase());
}

export function isRejectedKYC(status) {
    if (status == null || typeof status !== 'string') return false;
    return REJECTED.has(status.trim().toLowerCase());
}

/** Restricted actions (posting jobs, applying, etc.) require approved KYC. */
export function canPerformVerifiedAction(status) {
    return isApprovedKYC(status);
}
