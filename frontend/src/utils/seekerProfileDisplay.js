/**
 * Display-only helpers for jobseeker profile checklist.
 * Logic mirrors backend/utils/seekerProfileScoring.js — keep in sync when rules change.
 */

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
        const degree = String(edu.degree || '').trim();
        const institution = String(edu.institution || '').trim();
        const year = String(edu.year || '').trim();
        return degree.length > 0 || institution.length > 0 || year.length > 0;
    }).length;
}
