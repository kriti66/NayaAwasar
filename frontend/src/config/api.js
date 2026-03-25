// During local development, force backend calls to localhost even if
// `.env` points to a hosted backend (e.g., Render). This prevents
// "I changed code but API still behaves old" issues.
const defaultLocalApiBaseUrl = 'http://localhost:5001';
const isLocalHost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const API_BASE_URL =
    (import.meta.env.DEV && isLocalHost)
        ? defaultLocalApiBaseUrl
        : (import.meta.env.VITE_API_BASE_URL || defaultLocalApiBaseUrl);

export const API_URL = `${API_BASE_URL}/api`;
