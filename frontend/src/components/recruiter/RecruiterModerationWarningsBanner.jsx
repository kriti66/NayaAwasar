import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { AlertTriangle } from 'lucide-react';

function formatWarnedAt(value) {
    if (!value) return '';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

const RecruiterModerationWarningsBanner = () => {
    const { user } = useAuth();
    const [warnings, setWarnings] = useState([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (!user || user.role !== 'recruiter') {
            setWarnings([]);
            setLoaded(true);
            return;
        }

        let cancelled = false;
        (async () => {
            try {
                const res = await api.get('/recruiter/warnings');
                const list = res.data?.warnings || [];
                if (!cancelled) setWarnings(list);
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
                                    className="rounded-xl border border-amber-200 bg-white/80 px-4 py-3 text-sm text-amber-950 shadow-sm"
                                >
                                    <p className="font-semibold text-amber-900">
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
