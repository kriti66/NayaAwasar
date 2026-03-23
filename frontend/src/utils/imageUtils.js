import { API_BASE_URL } from '../config/api';

/**
 * Get the backend base URL for static assets (without /api).
 * Uploads are served at /uploads on the backend root.
 */
const getBackendBaseUrl = () => {
    const url = API_BASE_URL;
    return url.replace(/\/api\/?$/, '');
};

/**
 * Build a full image URL from a path or URL.
 * - Full URLs (http/https) are returned as-is.
 * - Relative paths (e.g. /uploads/company/xxx) are prepended with backend base URL.
 * @param {string} pathOrUrl - Logo path or full URL
 * @returns {string|null} Full URL or null if pathOrUrl is falsy
 */
export const getImageUrl = (pathOrUrl) => {
    if (!pathOrUrl || typeof pathOrUrl !== 'string') return null;
    const trimmed = pathOrUrl.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
    }
    const base = getBackendBaseUrl();
    const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${base}${path}`;
};

/**
 * Resolve company/job logo from various possible field names in API response.
 * @param {Object} job - Job or company object
 * @returns {string|null} Resolved logo path/URL or null
 */
export const getJobLogo = (job) => {
    if (!job) return null;
    const logo = job.company_logo || job.company_logo_url || job.company_id?.logo || job.company?.logo || job.logo;
    return logo || null;
};
