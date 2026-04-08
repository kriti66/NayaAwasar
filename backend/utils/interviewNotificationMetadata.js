/**
 * Payload for calendar deep-links (stored on Notification.metadata).
 * Uses interviewId + canonical dateKey + scheduledAt (when available).
 */
export function interviewCalendarMetadata(interviewDoc, options = {}) {
    if (!interviewDoc) return {};
    const interviewId = interviewDoc._id != null ? String(interviewDoc._id) : null;
    const dateSource = options.interviewDate ?? interviewDoc.date ?? options.scheduledAt ?? null;
    const scheduledSource = options.scheduledAt ?? interviewDoc.scheduledAt ?? null;

    const toDate = (v) => {
        if (v == null) return null;
        const d = v instanceof Date ? v : new Date(v);
        return Number.isNaN(d.getTime()) ? null : d;
    };

    const dateObj = toDate(dateSource);
    const scheduledObj = toDate(scheduledSource);
    const dateKeyFromObj = (d) =>
        d
            ? `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
            : null;

    const dateKey = options.dateKey || dateKeyFromObj(dateObj) || dateKeyFromObj(scheduledObj) || null;
    const meta = {};
    if (interviewId) meta.interviewId = interviewId;
    if (dateKey) {
        meta.dateKey = dateKey;
        // Backwards-compatible field consumed by existing clients.
        meta.interview_date = dateKey;
    }
    if (scheduledObj) {
        meta.scheduledAt = scheduledObj.toISOString();
    }
    if (options.applicationId != null) meta.applicationId = String(options.applicationId);
    return meta;
}
