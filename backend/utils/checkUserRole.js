const NORMALIZE = {
    job_seeker: 'jobseeker',
    jobseeker: 'jobseeker',
    recruiter: 'recruiter',
    admin: 'admin',
};

/**
 * @param {string|undefined} userRole
 * @param {'jobseeker'|'recruiter'|'admin'} requiredRole
 */
export default function checkUserRole(userRole, requiredRole) {
    if (userRole == null || userRole === '') return false;
    if (requiredRole == null || requiredRole === '') return false;
    const normalized = NORMALIZE[String(userRole).trim().toLowerCase()];
    if (!normalized) return false;
    return normalized === requiredRole;
}
