export function buildInterviewDetailsRoute(role, { applicationId, interviewId, date } = {}) {
    const normalizedRole = role === 'job_seeker' ? 'jobseeker' : String(role || '').toLowerCase();
    const appId = applicationId != null ? String(applicationId).trim() : '';
    const invId = interviewId != null ? String(interviewId).trim() : '';
    const day = date != null ? String(date).trim() : '';

    if (normalizedRole === 'recruiter') {
        const q = new URLSearchParams();
        q.set('tab', 'upcoming');
        q.set('focused', 'true');
        q.set('from', 'calendar');
        if (invId) q.set('interviewId', invId);
        if (appId) q.set('applicationId', appId);
        if (day) q.set('date', day);
        return `/recruiter/interviews?${q.toString()}`;
    }

    return appId
        ? `/seeker/interviews?focused=true&from=calendar&applicationId=${encodeURIComponent(appId)}`
        : '/seeker/interviews?focused=true&from=calendar';
}

