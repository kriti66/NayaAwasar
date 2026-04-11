function normalizeRole(role) {
    if (role == null) return null;
    const r = String(role).trim().toLowerCase();
    if (r === 'job_seeker') return 'jobseeker';
    if (r === 'jobseeker' || r === 'recruiter') return r;
    return r;
}

function isKycVerifiedUser(user) {
    if (!user || typeof user !== 'object') return false;
    if (user.isKycVerified === true) return true;
    const s = user.kycStatus;
    if (s == null || typeof s !== 'string') return false;
    return s.trim().toLowerCase() === 'approved';
}

export function canApplyForJob(user) {
    if (!user || typeof user !== 'object') return false;
    if (normalizeRole(user.role) !== 'jobseeker') return false;
    return isKycVerifiedUser(user);
}

export function canPostJob(user) {
    if (!user || typeof user !== 'object') return false;
    if (normalizeRole(user.role) !== 'recruiter') return false;
    return isKycVerifiedUser(user);
}
