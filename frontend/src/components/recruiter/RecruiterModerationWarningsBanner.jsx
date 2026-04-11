import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { AlertTriangle, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const RECRUITER_WARNINGS_CHANGED_EVENT = 'recruiter:warningsChanged';

function formatWarnedAt(value) {
    if (!value) return '';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

const RecruiterModerationWarningsBanner = () => {
    const { user } = useAuth();
    const [warnings, setWarnings] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const [dismissingId, setDismissingId] = useState(null);

    const refetchWarnings = useCallback(async () => {
        if (!user || user.role !== 'recruiter') {
            setWarnings([]);
            return;
        }
        try {
            const res = await api.get('/recruiter/warnings');
            setWarnings(res.data?.warnings || []);
        } catch {
            setWarnings([]);
        }
    }, [user]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!user || user.role !== 'recruiter') {
                setWarnings([]);
                setLoaded(true);
                return;
            }
            setLoaded(false);
            try {
                const res = await api.get('/recruiter/warnings');
                if (!cancelled) setWarnings(res.data?.warnings || []);
            } catch {
                if (!cancelled) setWarnings([]);
            } finally {
                if (!cancelled) setLoaded(true);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [user]);

    useEffect(() => {
        const onRefresh = () => {
            refetchWarnings();
        };
        window.addEventListener(RECRUITER_WARNINGS_CHANGED_EVENT, onRefresh);
        const onVisible = () => {
            if (document.visibilityState === 'visible' && user?.role === 'recruiter') {
                refetchWarnings();
            }
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            window.removeEventListener(RECRUITER_WARNINGS_CHANGED_EVENT, onRefresh);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [refetchWarnings, user?.role]);

    const handleDismiss = async (warningId) => {
        setDismissingId(warningId);
        try {
            await api.patch(`/recruiter/warnings/${warningId}/dismiss`);
            setWarnings((prev) => prev.filter((w) => w._id !== warningId));
            toast.success('Warning dismissed');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Could not dismiss warning');
        } finally {
            setDismissingId(null);
        }
    };

    if (!loaded || warnings.length === 0) return null;

    return (
        <div className="mb-10 w-full bg-amber-50 border-b border-amber-200/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-0.5 p-2 rounded-xl bg-amber-100 border border-amber-200 text-amber-800">
                        <AlertTriangle className="w-5 h-5" aria-hidden />
                    </div>
                    <div className="flex-1 min-w-0 space-y-3">
                        <p className="text-sm font-bold text-amber-950">
                            Your account has received a warning from our moderation team.
                        </p>
                        <ul className="space-y-3">
                            {warnings.map((w) => (
                                <li
                                    key={w._id}
                                    className="relative rounded-xl border border-amber-200 bg-white/80 pl-4 pr-12 py-3 text-sm text-amber-950 shadow-sm"
                                >
                                    <button
                                        type="button"
                                        onClick={() => handleDismiss(w._id)}
                                        disabled={dismissingId === w._id}
                                        className="absolute top-2 right-2 p-1.5 rounded-lg text-amber-800/70 hover:text-amber-950 hover:bg-amber-100/80 disabled:opacity-50 transition-colors"
                                        aria-label="Dismiss warning"
                                    >
                                        <X className="w-4 h-4" strokeWidth={2.5} aria-hidden />
                                    </button>
                                    <p className="font-semibold text-amber-900 pr-1">
                                        Reason: {w.reason}
                                        {w.job?.title ? ` — ${w.job.title}` : ''}
                                    </p>
                                    {w.note ? (
                                        <p className="mt-2 text-xs text-amber-900/85 leading-relaxed">{w.note}</p>
                                    ) : null}
                                    {w.warnedAt ? (
                                        <p className="mt-2 text-[11px] font-medium text-amber-800/80">
                                            {formatWarnedAt(w.warnedAt)}
                                        </p>
                                    ) : null}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecruiterModerationWarningsBanner;
