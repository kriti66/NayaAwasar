/**
 * Seeker profile completion & strength — single source of truth for jobseeker User documents.
 * Only counts meaningful, user-provided data (no empty arrays/strings/placeholders).
 * KYC contributes only when status is approved (or legacy isKycVerified flag).
 */

const COMPLETION_SLOT_COUNT = 12;

export function isMeaningfulString(value, minLen = 1) {
    if (value == null) return false;
    if (typeof value !== 'string') return false;
    return value.trim().length >= minLen;
}

export function getNormalizedSkills(skills) {
    if (skills == null) return [];
    if (Array.isArray(skills)) {
        return skills.map((s) => String(s).trim()).filter(Boolean);
    }
    if (typeof skills === 'string') {
        return skills.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
    }
    return [];
}

export function countMeaningfulWorkExperience(workExperience) {
    if (!Array.isArray(workExperience)) return 0;
    return workExperience.filter((exp) => {
        if (!exp || typeof exp !== 'object') return false;
        const title = String(exp.title || '').trim();
        const company = String(exp.company || '').trim();
        const desc = String(exp.description || '').trim();
        const duration = String(exp.duration || '').trim();
        return (
            title.length > 0 ||
            company.length > 0 ||
            duration.length > 0 ||
            desc.length >= 10
        );
    }).length;
}

export function countMeaningfulEducation(education) {
    if (!Array.isArray(education)) return 0;
    return education.filter((edu) => {
        if (!edu || typeof edu !== 'object') return false;
        return (
            isMeaningfulString(edu.degree, 1) ||
            isMeaningfulString(edu.institution, 1) ||
            isMeaningfulString(edu.year, 1)
        );
    }).length;
}

export function hasResumeFile(userLike) {
    if (!userLike) return false;
    const fromNested = userLike.resume && isMeaningfulString(userLike.resume.fileUrl, 1);
    const legacy = isMeaningfulString(userLike.resume_url, 1);
    return Boolean(fromNested || legacy);
}

export function isKycApproved(userLike) {
    if (!userLike) return false;
    if (userLike.kycStatus === 'approved') return true;
    if (userLike.isKycVerified === true) return true;
    return false;
}

/**
 * @param {object} userLike — plain object or mongoose doc shape (User jobseeker)
 * @returns {{
 *   profileCompletionPercent: number,
 *   skillsPercent: number,
 *   workExperiencePercent: number,
 *   resumeQualityPercent: number,
 *   kycContributionPercent: number,
 *   kycVerified: boolean,
 *   overallStrength: number
 * }}
 */
export function computeSeekerProfileMetrics(userLike) {
    const u = userLike || {};

    const skills = getNormalizedSkills(u.skills);
    const workCount = countMeaningfulWorkExperience(u.workExperience);
    const eduCount = countMeaningfulEducation(u.education);

    let filledSlots = 0;
    if (isMeaningfulString(u.fullName, 2)) filledSlots += 1;
    if (isMeaningfulString(u.email, 3)) filledSlots += 1;
    if (isMeaningfulString(u.phoneNumber)) filledSlots += 1;
    if (isMeaningfulString(u.location)) filledSlots += 1;
    if (isMeaningfulString(u.bio, 20)) filledSlots += 1;
    if (isMeaningfulString(u.profileImage)) filledSlots += 1;
    if (isMeaningfulString(u.professionalHeadline)) filledSlots += 1;
    if (isMeaningfulString(u.linkedinUrl) || isMeaningfulString(u.portfolioUrl)) filledSlots += 1;
    if (skills.length > 0) filledSlots += 1;
    if (workCount > 0) filledSlots += 1;
    if (eduCount > 0) filledSlots += 1;
    if (hasResumeFile(u)) filledSlots += 1;

    const profileCompletionPercent = Math.min(
        100,
        Math.round((filledSlots / COMPLETION_SLOT_COUNT) * 100)
    );

    const skillsPercent =
        skills.length === 0 ? 0 : Math.min(100, Math.round((skills.length / 8) * 100));

    const workExperiencePercent =
        workCount === 0 ? 0 : Math.min(100, Math.round((workCount / 3) * 100));

    const resumeQualityPercent = hasResumeFile(u) ? 100 : 0;

    const kycVerified = isKycApproved(u);
    const kycContributionPercent = kycVerified ? 100 : 0;

    const overallStrength = Math.min(
        100,
        Math.round(
            profileCompletionPercent * 0.38 +
                skillsPercent * 0.22 +
                workExperiencePercent * 0.22 +
                kycContributionPercent * 0.18
        )
    );

    return {
        profileCompletionPercent,
        skillsPercent,
        workExperiencePercent,
        resumeQualityPercent,
        kycContributionPercent,
        kycVerified,
        overallStrength
    };
}

/**
 * Persist computed scores on a Mongoose User document (mutates in place).
 * @returns {ReturnType<computeSeekerProfileMetrics>}
 */
/**
 * Merge User + Profile documents into one object for scoring and job matching.
 * @param {object|null} user
 * @param {object|null} profile
 */
export function mergeSeekerDataForScoring(user, profile) {
    const expFromProfile = Array.isArray(profile?.experience)
        ? profile.experience.map((e) => ({
              title: e?.role || '',
              company: e?.company || '',
              duration:
                  e?.startDate || e?.endDate
                      ? `${e?.startDate || ''} ${e?.endDate || ''}`.trim()
                      : '',
              description: e?.description || ''
          }))
        : [];

    const eduFromProfile = Array.isArray(profile?.education)
        ? profile.education.map((e) => ({
              degree: e?.degree || '',
              institution: e?.institute || '',
              year: e?.endYear || e?.startYear || ''
          }))
        : [];

    return {
        ...user,
        bio: user?.bio || profile?.summary || '',
        professionalHeadline: user?.professionalHeadline || profile?.headline || '',
        location: user?.location || profile?.location || '',
        skills: Array.isArray(profile?.skills) && profile.skills.length ? profile.skills : user?.skills,
        workExperience: expFromProfile.length ? expFromProfile : user?.workExperience,
        education: eduFromProfile.length ? eduFromProfile : user?.education,
        resume: profile?.resume?.fileUrl ? profile.resume : user?.resume,
        jobPreferences:
            profile?.jobPreferences && Object.keys(profile.jobPreferences).length
                ? profile.jobPreferences
                : user?.jobPreferences
    };
}

export function syncSeekerProfileScoresToUser(userDoc) {
    if (!userDoc) return computeSeekerProfileMetrics(null);
    const plain =
        typeof userDoc.toObject === 'function'
            ? userDoc.toObject({ depopulate: true, virtuals: false })
            : { ...userDoc };
    const m = computeSeekerProfileMetrics(plain);
    userDoc.profileCompletion = m.profileCompletionPercent;
    userDoc.profileStrength = m.overallStrength;
    return m;
}
