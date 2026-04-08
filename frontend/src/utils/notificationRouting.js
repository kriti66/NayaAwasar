const ROLE_DASHBOARD = {
    admin: '/admin/dashboard',
    recruiter: '/recruiter/dashboard',
    jobseeker: '/seeker/dashboard',
    job_seeker: '/seeker/dashboard'
};

const ROLE_NOTIFICATIONS = {
    admin: '/admin/notifications',
    recruiter: '/recruiter/notifications',
    jobseeker: '/seeker/notifications',
    job_seeker: '/seeker/notifications'
};

function normalizeRole(role) {
    if (role === 'job_seeker') return 'jobseeker';
    return role || 'jobseeker';
}

const INTERVIEW_CALENDAR_TYPES = new Set([
    'interview_scheduled',
    'interview_rescheduled',
    'reschedule_requested',
    'interview_completed',
    'interview_cancelled',
    'interview_accepted',
    'reschedule_rejected',
    'reschedule_accepted',
    'interview_update',
    'reschedule_approved',
    'reschedule_declined'
]);

/**
 * Pull interviewId + YYYY-MM-DD date from notification metadata / legacy shapes.
 */
export function extractInterviewCalendarPayload(notification) {
    const meta = notification?.metadata;
    const data = notification?.data;
    const src = {
        ...(data && typeof data === 'object' ? data : {}),
        ...(meta && typeof meta === 'object' ? meta : {})
    };
    const interviewId = src.interviewId ?? src.interview_id;
    let date = null;
    const rawDate = src.dateKey ?? src.interview_date ?? src.interviewDate ?? src.date ?? src.scheduledAt ?? src.scheduled_at;
    if (rawDate != null) {
        if (typeof rawDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawDate.trim())) {
            date = rawDate.trim();
        } else {
            const d = new Date(rawDate);
            if (!Number.isNaN(d.getTime())) {
                date = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
            }
        }
    }
    return {
        interviewId: interviewId != null && String(interviewId).trim() !== '' ? String(interviewId) : null,
        date
    };
}

export function isInterviewCalendarNotification(notification) {
    const t = notification?.type;
    const c = notification?.category;
    if (c === 'interview') return true;
    if (INTERVIEW_CALENDAR_TYPES.has(t)) return true;
    return false;
}

export function buildInterviewCalendarUrl(role, payload) {
    const normalized = normalizeRole(role);
    const base = normalized === 'recruiter' ? '/recruiter/calendar' : '/seeker/calendar';
    const q = new URLSearchParams();
    if (payload?.date) q.set('date', payload.date);
    if (payload?.interviewId) q.set('interviewId', payload.interviewId);
    const qs = q.toString();
    return qs ? `${base}?${qs}` : base;
}

export function getRoleDashboardPath(role) {
    const normalized = normalizeRole(role);
    return ROLE_DASHBOARD[normalized] || '/seeker/dashboard';
}

export function getRoleNotificationsPath(role) {
    const normalized = normalizeRole(role);
    return ROLE_NOTIFICATIONS[normalized] || '/seeker/notifications';
}

function mapByType(type, role) {
    const normalized = normalizeRole(role);
    const commonMap = {
        kyc_approved: normalized === 'recruiter' ? '/kyc/recruiter' : '/kyc/status',
        kyc_update: '/kyc/status',
        kyc_rejected: '/kyc/status',
        kyc_new_submission: normalized === 'admin' ? '/admin/kyc' : normalized === 'recruiter' ? '/kyc/recruiter' : '/kyc/job-seeker',
        kyc_resubmitted_after_rejection: normalized === 'admin' ? '/admin/kyc' : normalized === 'recruiter' ? '/kyc/recruiter' : '/kyc/job-seeker',
        recruiter_kyc_new_submission: normalized === 'admin' ? '/admin/kyc' : '/kyc/recruiter',
        recruiter_kyc_resubmitted_after_rejection: normalized === 'admin' ? '/admin/kyc' : '/kyc/recruiter',
        application_update: normalized === 'recruiter' ? '/recruiter/applications' : '/seeker/applications',
        interview_scheduled: normalized === 'recruiter' ? '/recruiter/calendar' : '/seeker/calendar',
        interview_update: normalized === 'recruiter' ? '/recruiter/calendar' : '/seeker/calendar',
        interview_rescheduled: normalized === 'recruiter' ? '/recruiter/calendar' : '/seeker/calendar',
        reschedule_requested: normalized === 'recruiter' ? '/recruiter/calendar' : '/seeker/calendar',
        interview_completed: normalized === 'recruiter' ? '/recruiter/calendar' : '/seeker/calendar',
        interview_cancelled: normalized === 'recruiter' ? '/recruiter/calendar' : '/seeker/calendar',
        interview_accepted: normalized === 'recruiter' ? '/recruiter/calendar' : '/seeker/calendar',
        reschedule_rejected: normalized === 'recruiter' ? '/recruiter/calendar' : '/seeker/calendar',
        reschedule_accepted: normalized === 'recruiter' ? '/recruiter/calendar' : '/seeker/calendar'
    };
    return commonMap[type] || null;
}

/**
 * Resolve notification link into a valid role-aware path.
 */
export function resolveNotificationPath(notification, role) {
    const normalized = normalizeRole(role);
    const payload = extractInterviewCalendarPayload(notification);
    const hasCalendarPayload = !!(payload.interviewId || payload.date);
    if (
        hasCalendarPayload &&
        (normalized === 'jobseeker' || normalized === 'recruiter') &&
        isInterviewCalendarNotification(notification)
    ) {
        return buildInterviewCalendarUrl(role, payload);
    }

    const fallback = getRoleDashboardPath(role);
    const rawLink = notification?.link;
    const typeMapped = mapByType(notification?.type, role);
    const trimmedLink = typeof rawLink === 'string' ? rawLink.trim() : '';

    let target;
    if (
        isInterviewCalendarNotification(notification) &&
        (normalized === 'jobseeker' || normalized === 'recruiter')
    ) {
        target = typeMapped || trimmedLink || fallback;
    } else {
        target = trimmedLink || typeMapped || fallback;
    }

    // Legacy backend links sometimes use '/dashboard'
    if (target === '/dashboard') return fallback;

    // Job details links for seekers live under /jobseeker/jobs/:id
    if (target.startsWith('/jobs/') && normalizeRole(role) === 'jobseeker') {
        return `/jobseeker${target}`;
    }

    return target.startsWith('/') ? target : fallback;
}

