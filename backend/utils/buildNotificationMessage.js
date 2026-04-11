const MESSAGES = {
    kyc_submitted: 'Your KYC documents have been submitted for review.',
    kyc_approved: 'Your KYC verification has been approved.',
    kyc_rejected: 'Your KYC verification was rejected. Please review the feedback and resubmit.',
    interview_scheduled: 'An interview has been scheduled for you.',
    reschedule_request: 'Someone requested to reschedule your interview.',
};

const DEFAULT_MESSAGE = 'You have a new notification.';

/**
 * @param {string} type
 */
export default function buildNotificationMessage(type) {
    if (type == null || typeof type !== 'string') return DEFAULT_MESSAGE;
    const key = type.trim().toLowerCase();
    return MESSAGES[key] ?? DEFAULT_MESSAGE;
}
