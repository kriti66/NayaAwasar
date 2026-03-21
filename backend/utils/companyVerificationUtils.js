/**
 * Compute a fingerprint of key profile fields for meaningful-change detection.
 * Used to prevent resubmission without edits after rejection.
 */
export const getProfileFingerprint = (company) => {
    if (!company) return '';
    const obj = typeof company.toObject === 'function' ? company.toObject() : company;
    const keys = [
        'name', 'industry', 'size', 'headquarters', 'website', 'yearFounded', 'logo',
        'about.mission', 'about.services', 'about.goals', 'about.culture',
        'contact.email', 'contact.address',
        'socialLinks.linkedin', 'socialLinks.portfolio', 'socialLinks.github',
        'hiringInfo.jobTypes', 'hiringInfo.locations', 'hiringInfo.technologies', 'hiringInfo.benefits'
    ];
    const vals = keys.map(k => {
        const v = k.split('.').reduce((o, p) => (o && o[p]) ?? '', obj);
        return Array.isArray(v) ? v.sort().join('|') : String(v || '');
    });
    return vals.join('||');
};

export const hasMeaningfulChanges = (current, lastSnapshot) => {
    if (!lastSnapshot) return true;
    const currentFp = getProfileFingerprint(current);
    const lastFp = typeof lastSnapshot === 'string' ? lastSnapshot : (lastSnapshot?.fingerprint ?? '');
    return currentFp !== lastFp;
};
