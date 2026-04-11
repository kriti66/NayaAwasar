/**
 * Pure filter: keep only entries whose status is pending (case-insensitive).
 * @param {Array<{ kycStatus?: string }>} entries
 */
export default function filterPendingKYC(entries) {
    if (!Array.isArray(entries)) return [];
    return entries.filter((e) => {
        const s = e && e.kycStatus;
        if (s == null || typeof s !== 'string') return false;
        return s.trim().toLowerCase() === 'pending';
    });
}
