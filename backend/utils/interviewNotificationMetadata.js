/**
 * Payload for calendar deep-links (stored on Notification.metadata).
 * Uses interviewId + interview_date (UTC calendar day YYYY-MM-DD).
 */
export function interviewCalendarMetadata(interviewDoc, options = {}) {
    if (!interviewDoc) return {};
    const interviewId = interviewDoc._id != null ? String(interviewDoc._id) : null;
    const dateSource = options.interviewDate != null ? options.interviewDate : interviewDoc.date;
    let interview_date = null;
    if (dateSource != null) {
        const x = dateSource instanceof Date ? dateSource : new Date(dateSource);
        if (!Number.isNaN(x.getTime())) {
            interview_date = `${x.getUTCFullYear()}-${String(x.getUTCMonth() + 1).padStart(2, '0')}-${String(x.getUTCDate()).padStart(2, '0')}`;
        }
    }
    const meta = {};
    if (interviewId) meta.interviewId = interviewId;
    if (interview_date) meta.interview_date = interview_date;
    if (options.applicationId != null) meta.applicationId = String(options.applicationId);
    return meta;
}
