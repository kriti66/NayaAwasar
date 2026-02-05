import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setSessionExpiredRedirect } from '../services/api';

/**
 * Registers a callback with the API so that on 401/403 session error we navigate
 * to /login via React Router (no window.location / full-page redirect).
 */
export default function SessionExpiredHandler() {
    const navigate = useNavigate();

    useEffect(() => {
        setSessionExpiredRedirect(() => {
            navigate('/', { state: { sessionExpired: true }, replace: true });
        });
        return () => setSessionExpiredRedirect(null);
    }, [navigate]);

    return null;
}
