/**
 * Notification types and categories for the job portal
 */

export const NOTIFICATION_CATEGORIES = {
    PROMOTION: 'promotion',
    PAYMENT: 'payment',
    JOB: 'job',
    APPLICATION: 'application',
    INTERVIEW: 'interview',
    COMPANY: 'company',
    RECRUITER: 'recruiter',
    CONTACT: 'contact',
    SYSTEM: 'system'
};

export const NOTIFICATION_TYPES = {
    // Promotion
    PROMOTION_REQUEST_SUBMITTED: 'promotion_request_submitted',
    PROMOTION_APPROVED: 'promotion_approved',
    PROMOTION_REJECTED: 'promotion_rejected',
    PAYMENT_REQUIRED: 'payment_required',
    PAYMENT_SUBMITTED: 'payment_submitted',
    PAYMENT_APPROVED: 'payment_approved',
    PAYMENT_REJECTED: 'payment_rejected',
    PROMOTION_ACTIVATED: 'promotion_activated',
    PROMOTION_EXPIRING_SOON: 'promotion_expiring_soon',
    PROMOTION_EXPIRED: 'promotion_expired',
    // Job
    JOB_POSTED: 'job_posted',
    JOB_APPROVED: 'job_approved',
    JOB_REJECTED: 'job_rejected',
    JOB_EXPIRED: 'job_expired',
    JOB_UPDATED: 'job_updated',
    NEW_APPLICATION: 'new_application',
    // Application
    APPLICATION_SUBMITTED: 'application_submitted',
    APPLICATION_SHORTLISTED: 'application_shortlisted',
    APPLICATION_REJECTED: 'application_rejected',
    APPLICATION_STATUS_UPDATED: 'application_status_updated',
    INTERVIEW_SCHEDULED: 'interview_scheduled',
    INTERVIEW_RESCHEDULED: 'interview_rescheduled',
    RESCHEDULE_APPROVED: 'reschedule_approved',
    RESCHEDULE_DECLINED: 'reschedule_declined',
    // Company / Recruiter
    RECRUITER_APPROVED: 'recruiter_approved',
    RECRUITER_REJECTED: 'recruiter_rejected',
    COMPANY_VERIFICATION_SUBMITTED: 'company_verification_submitted',
    COMPANY_VERIFICATION_APPROVED: 'company_verification_approved',
    COMPANY_VERIFICATION_REJECTED: 'company_verification_rejected',
    COMPANY_PROFILE_UPDATED: 'company_profile_updated',
    // Contact / System
    NEW_CONTACT_MESSAGE: 'new_contact_message',
    ADMIN_REPLY_SENT: 'admin_reply_sent',
    PASSWORD_RESET_REQUESTED: 'password_reset_requested',
    SYSTEM_ANNOUNCEMENT: 'system_announcement'
};
