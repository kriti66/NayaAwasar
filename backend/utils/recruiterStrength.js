
export const calculateRecruiterStrength = (user, company, jobsCount, applicationsCount) => {
    let score = 0;

    // 1. Company Profile Completeness (30%)
    if (company) {
        let completeness = 0;
        if (company.name) completeness += 5;
        if (company.about?.mission || company.about?.services) completeness += 5;
        if (company.logo) completeness += 5;
        if (company.website) completeness += 5;
        if (company.headquarters) completeness += 5;
        if (company.size) completeness += 5;
        score += completeness;
    }

    // 2. Verification Status (25%)
    if (user.kycStatus === 'approved') score += 12.5;
    if (company?.status === 'approved') score += 12.5;

    // 3. Job Posting Activity (20%)
    // Cap at 20 points for 5+ jobs, 4 points per job
    if (jobsCount > 0) {
        score += Math.min(jobsCount * 4, 20);
    }

    // 4. Engagement (15%)
    // Cap at 15 points for 30+ applications, 0.5 points per application
    if (applicationsCount > 0) {
        score += Math.min(applicationsCount * 0.5, 15);
    }

    // 5. Visibility (10%)
    // 1 point per 10 views, cap at 100 views
    const views = company?.profileViews?.total || 0;
    if (views > 0) {
        score += Math.min(views / 10, 10);
    }

    return Math.round(Math.min(score, 100)); // Ensure max 100
};
