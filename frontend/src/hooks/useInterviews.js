import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import applicationService from '../services/applicationService';
import { getApiErrorMessage } from '../utils/apiErrorMessage';

const REFRESH_MS = 60000;

export function useInterviews() {
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const timerRef = useRef(null);

    const refetch = useCallback(async (opts = {}) => {
        const silent = opts.silent === true;
        if (!silent) setLoading(true);
        setError(null);
        try {
            const data = await applicationService.getMyInterviews();
            setInterviews(Array.isArray(data) ? data : []);
        } catch (e) {
            const msg = getApiErrorMessage(e, 'Could not load interviews');
            setError(msg);
            if (!silent) toast.error(msg);
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        refetch({ silent: false });
    }, [refetch]);

    useEffect(() => {
        timerRef.current = window.setInterval(() => {
            refetch({ silent: true });
        }, REFRESH_MS);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [refetch]);

    return { interviews, loading, error, refetch };
}
