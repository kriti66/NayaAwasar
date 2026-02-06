export const calculateProfileStrength = (profile) => {
    let score = 0;
    const tips = [];
    let label = 'WEAK';

    if (!profile) return { score: 0, label, tips: ["Create your profile"] };

    // 1. Summary (Bio) length >= 40 -> +20
    if (profile.summary && profile.summary.length >= 40) {
        score += 20;
    } else {
        tips.push("Complete professional summary (min 40 chars)");
    }

    // 2. Skills count >= 5 -> +20
    if (profile.skills && profile.skills.length >= 5) {
        score += 20;
    } else {
        tips.push("Add core skills (min 5)");
    }

    // 3. Experience count >= 1 -> +20
    if (profile.experience && profile.experience.length >= 1) {
        score += 20;
    } else {
        tips.push("Add work experience");
    }

    // 4. Education count >= 1 -> +20
    if (profile.education && profile.education.length >= 1) {
        score += 20;
    } else {
        tips.push("Add education");
    }

    // 5. Resume exists -> +20
    if (profile.resume && profile.resume.fileUrl) {
        score += 20;
    } else {
        tips.push("Upload resume/CV");
    }

    // Cap at 100 (though logic sums to 100 exactly)
    score = Math.min(score, 100);

    // Label
    if (score >= 80) label = 'STRONG';
    else if (score >= 40) label = 'GOOD';
    else label = 'WEAK';

    return { score, label, tips };
};
