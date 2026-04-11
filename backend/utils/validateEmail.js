/**
 * Lightweight email format validation (no DNS / deliverability checks).
 */
export default function validateEmail(email) {
    if (email == null) return false;
    if (typeof email !== 'string') return false;
    const trimmed = email.trim();
    if (trimmed === '') return false;
    if (!trimmed.includes('@')) return false;
    const parts = trimmed.split('@');
    if (parts.length !== 2) return false;
    const domain = parts[1];
    if (!domain || domain.trim() === '') return false;
    if (!domain.includes('.')) return false;
    return true;
}
