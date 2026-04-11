function countUnread(notifications) {
    if (!Array.isArray(notifications)) return 0;
    let n = 0;
    for (const item of notifications) {
        if (!item || typeof item !== 'object') continue;
        if (item.read === true || item.isRead === true) continue;
        n += 1;
    }
    return n;
}

function countUpcomingInterviews(interviews) {
    if (!Array.isArray(interviews)) return 0;
    let n = 0;
    for (const inv of interviews) {
        if (!inv || typeof inv !== 'object') continue;
        if (inv.upcoming === false) continue;
        if (inv.cancelled === true || inv.status === 'Cancelled') continue;
        n += 1;
    }
    return n;
}

/**
 * Aggregates dashboard counters from plain arrays (no DB).
 */
export default function calculateDashboardStats(payload) {
    const p = payload && typeof payload === 'object' ? payload : {};
    const savedJobs = Array.isArray(p.savedJobs) ? p.savedJobs : [];
    const applications = Array.isArray(p.applications) ? p.applications : [];
    const notifications = Array.isArray(p.notifications) ? p.notifications : [];
    const interviews = Array.isArray(p.interviews) ? p.interviews : [];

    return {
        savedJobsCount: savedJobs.length,
        applicationsCount: applications.length,
        unreadNotificationsCount: countUnread(notifications),
        upcomingInterviewsCount: countUpcomingInterviews(interviews),
    };
}
