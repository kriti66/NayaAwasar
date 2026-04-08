const LOCAL_API_BASE_URL = 'http://localhost:5001';
//const LOCAL_API_BASE_URL = 'https://qt4cfqpx-5173.inc1.devtunnels.ms/';
const isLocalHost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const normalizeBaseUrl = (rawValue) => {
    const value = String(rawValue || '').trim().replace(/\/+$/, '');
    if (!value) return '';
    return value;
};

const resolveApiBaseUrl = () => {
    const fromLocalEnv = normalizeBaseUrl(import.meta.env.VITE_API_URL);
    const fromEnv = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);

    // Keep localhost DX unchanged.
    if (import.meta.env.DEV && isLocalHost) {
        return fromLocalEnv || LOCAL_API_BASE_URL;
    }

    // In non-local dev, keep previous local fallback behavior.
    if (import.meta.env.DEV) {
        return fromEnv || LOCAL_API_BASE_URL;
    }

    // Production: never silently hardcode localhost.
    if (!fromEnv) {
        console.error('[API Config] Missing VITE_API_BASE_URL in production environment.');
        return '';
    }

    // Prevent mixed-content calls from an HTTPS site to HTTP backend.
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && fromEnv.startsWith('http://')) {
        return fromEnv.replace(/^http:\/\//i, 'https://');
    }

    return fromEnv;
};

export const API_BASE_URL = resolveApiBaseUrl();
export const API_URL = API_BASE_URL ? `${API_BASE_URL}/api` : '/api';
