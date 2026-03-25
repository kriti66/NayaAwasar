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
        application_update: normalized === 'recruiter' ? '/recruiter/applications' : '/seeker/applications',
        interview_scheduled: normalized === 'recruiter' ? '/recruiter/applications' : '/seeker/interviews',
        interview_update: normalized === 'recruiter' ? '/recruiter/applications' : '/seeker/interviews',
        interview_rescheduled: normalized === 'recruiter' ? '/recruiter/applications' : '/seeker/interviews'
    };
    return commonMap[type] || null;
}

/**
 * Resolve notification link into a valid role-aware path.
 */
export function resolveNotificationPath(notification, role) {
    const fallback = getRoleDashboardPath(role);
    const rawLink = notification?.link;
    const typeMapped = mapByType(notification?.type, role);

    let target = (typeof rawLink === 'string' && rawLink.trim()) ? rawLink.trim() : (typeMapped || fallback);

    // Legacy backend links sometimes use '/dashboard'
    if (target === '/dashboard') return fallback;

    // Job details links for seekers live under /jobseeker/jobs/:id
    if (target.startsWith('/jobs/') && normalizeRole(role) === 'jobseeker') {
        return `/jobseeker${target}`;
    }

    return target.startsWith('/') ? target : fallback;
}

