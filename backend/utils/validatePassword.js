/**
 * Pure password strength check (no hashing).
 * Minimum 8 chars, at least one upper, one lower, one digit.
 */
export default function validatePassword(password) {
    if (password == null || password === '') return false;
    if (typeof password !== 'string') return false;
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    return true;
}
