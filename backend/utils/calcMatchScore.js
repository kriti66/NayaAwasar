/**
 * Percentage of job skills matched by user skills (case-insensitive, trimmed).
 * @param {string[]} jobSkills
 * @param {string[]} userSkills
 */
export default function calcMatchScore(jobSkills, userSkills) {
    if (!Array.isArray(jobSkills) || jobSkills.length === 0) return 0;
    if (!Array.isArray(userSkills) || userSkills.length === 0) return 0;

    const userSet = new Set(
        userSkills
            .filter((s) => s != null && String(s).trim() !== '')
            .map((s) => String(s).trim().toLowerCase())
    );
    const normalizedJob = jobSkills
        .map((s) => (s == null ? '' : String(s).trim().toLowerCase()))
        .filter((s) => s !== '');

    if (normalizedJob.length === 0) return 0;

    let hits = 0;
    for (const skill of normalizedJob) {
        if (userSet.has(skill)) hits += 1;
    }
    const score = Math.round((hits / normalizedJob.length) * 100);
    return Number.isFinite(score) ? score : 0;
}
