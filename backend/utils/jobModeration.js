/**
 * Post-publish job moderation: public visibility + recruiter edit rules.
 */

/** Mongo $or fragment: job is visible on public listing */
export const PUBLIC_MODERATION_MATCH = {
    $or: [
        { moderationStatus: { $in: ['active', 'warned'] } },
        { moderationStatus: 'Approved' }, // legacy pre-migration
        { moderationStatus: { $exists: false } },
        { moderationStatus: null },
        { moderationStatus: '' }
    ]
};

/** Statuses that count as “similar active post” for duplicate check (30 days, same company + title) */
export const DUPLICATE_MODERATION_STATUSES = ['active', 'warned', 'pending_review', 'Approved'];

export function isJobPubliclyVisible(job) {
    const m = job?.moderationStatus;
    if (m === 'active' || m === 'warned') return true;
    if (!m || m === '' || m === 'Approved') return true;
    return false;
}

/** Same rules as public listing (Active + visible moderation + optional deadline). */
export function isJobVisibleForPublicListing(job, now = new Date()) {
    if (!job || job.status !== 'Active') return false;
    if (!isJobPubliclyVisible(job)) return false;
    if (job.application_deadline != null && new Date(job.application_deadline) < now) return false;
    return true;
}

/** Map legacy moderation values to the current enum for edit-flow branching. */
export function normalizeModerationStatusForEdit(ms) {
    const legacy = {
        Approved: 'active',
        Flagged: 'warned',
        'Under Review': 'pending_review',
        Hidden: 'hidden'
    };
    if (ms == null || ms === '') return 'active';
    return legacy[ms] || ms;
}

export function canRecruiterViewJobForEdit(job, viewerUserId) {
    if (!job || !viewerUserId) return false;
    const rid = job.recruiter_id?._id?.toString?.() || job.recruiter_id?.toString?.();
    return rid === String(viewerUserId);
}
