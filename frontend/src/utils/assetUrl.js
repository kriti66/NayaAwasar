import { API_BASE_URL } from '../config/api';

/**
 * Resolve a backend-served static path (e.g. `/uploads/avatars/x.png`)
 * into an absolute URL using `VITE_API_BASE_URL` so the browser doesn't
 * try to load it from the frontend origin.
 */
export function resolveAssetUrl(pathOrUrl) {
    if (!pathOrUrl || typeof pathOrUrl !== 'string') return '';
    const value = pathOrUrl.trim();
    if (!value) return '';

    if (/^https?:\/\//i.test(value)) return value;

    // Backend stores absolute-like paths: `/uploads/...`
    if (value.startsWith('/')) return `${API_BASE_URL}${value}`;

    // Fallback for stored values without leading slash
    return `${API_BASE_URL}/${value}`;
}

