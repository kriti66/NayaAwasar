/**
 * Normalize Axios / thrown API errors for user-facing toasts and UI copy.
 */
export function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
    if (error == null) return fallback;
    if (typeof error === 'string') return error;
    const data = error.response?.data;
    const fromBody = data?.message;
    if (typeof fromBody === 'string' && fromBody.trim()) {
        const code = data?.code ? ` [${data.code}]` : '';
        return `${fromBody.trim()}${code}`;
    }
    if (Array.isArray(fromBody) && fromBody.length) return String(fromBody[0]);
    if (typeof error.message === 'string' && error.message.trim()) return error.message;
    return fallback;
}
