import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
    CalendarDays,
    Clock,
    ExternalLink,
    Video,
    User,
    Building2,
    MapPin,
    FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { getApiErrorMessage } from '../../utils/apiErrorMessage';
import {
    combineDateAndTimeNepal,
    formatCalendarInterviewCardTimeWithZone,
    formatNepalWallTimeAmPm
} from '../../utils/interviewDateTime';
import InterviewStatusBadge from '../../components/interviews/InterviewStatusBadge';

function isUpcomingInterview(inv) {
    const start = combineDateAndTimeNepal(inv.date, inv.time);
    if (!start) return false;
    return start.getTime() >= Date.now() && inv.status !== 'completed' && inv.status !== 'cancelled';
}

export default function RecruiterInterviews() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    const [activeTab, setActiveTab] = useState('upcoming');

    const interviewIdQ = (searchParams.get('interviewId') || '').trim();
    const tabQ = (searchParams.get('tab') || '').trim().toLowerCase();

    useEffect(() => {
        if (tabQ === 'past' || tabQ === 'upcoming') setActiveTab(tabQ);
    }, [tabQ]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const { data } = await api.get('/interviews/calendar/recruiter');
                if (!cancelled) setItems(Array.isArray(data?.interviews) ? data.interviews : []);
            } catch (e) {
                if (!cancelled) {
                    toast.error(getApiErrorMessage(e, 'Failed to load interviews'));
                    setItems([]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const { upcoming, past } = useMemo(() => {
        const next = { upcoming: [], past: [] };
        for (const inv of items) {
            if (isUpcomingInterview(inv)) next.upcoming.push(inv);
            else next.past.push(inv);
        }
        return next;
    }, [items]);

    const visible = activeTab === 'upcoming' ? upcoming : past;

    const statusToBadge = (status) => {
        const s = String(status || '').toLowerCase();
        if (s === 'scheduled') return 'SCHEDULED_UPCOMING';
        if (s === 'pending_acceptance') return 'SCHEDULED';
        if (s === 'reschedule_requested') return 'RESCHEDULE_REQUESTED';
        if (s === 'completed') return 'COMPLETED';
        if (s === 'cancelled') return 'CANCELLED';
        return 'SCHEDULED';
    };

    useEffect(() => {
        if (!interviewIdQ || loading) return;
        if (activeTab !== 'upcoming') setActiveTab('upcoming');
        const paramsSnapshot = searchParams.toString();
        const t = window.setTimeout(() => {
            const el = document.getElementById(`recruiter-interview-${interviewIdQ}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const next = new URLSearchParams(paramsSnapshot);
                next.delete('interviewId');
                const qs = next.toString();
                navigate(`/recruiter/interviews${qs ? `?${qs}` : ''}`, { replace: true });
            }
        }, 250);
        return () => clearTimeout(t);
    }, [interviewIdQ, loading, visible.length, activeTab, navigate, searchParams]);

    return (
        <div className="min-h-[calc(100vh-3.5rem)] bg-slate-50">
            <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
                <div className="flex items-start gap-3 mb-5">
                    <div className="h-11 w-11 rounded-xl bg-[#29a08e] flex items-center justify-center shrink-0">
                        <CalendarDays className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Upcoming Interviews</h1>
                        <p className="text-sm text-slate-600 mt-0.5">
                            Review interview details, then join when you are ready.
                        </p>
                    </div>
                </div>

                <div className="flex gap-2 bg-white rounded-xl border border-slate-200 p-1 mb-5 w-fit">
                    <button
                        type="button"
                        onClick={() => setActiveTab('upcoming')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide ${
                            activeTab === 'upcoming' ? 'bg-slate-900 text-white' : 'text-slate-600'
                        }`}
                    >
                        Upcoming ({upcoming.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('past')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide ${
                            activeTab === 'past' ? 'bg-slate-900 text-white' : 'text-slate-600'
                        }`}
                    >
                        Past ({past.length})
                    </button>
                </div>

                {loading ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
                        Loading interviews…
                    </div>
                ) : visible.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-600">
                        No interviews in this tab.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {visible.map((inv) => {
                            const interviewId = String(inv.id || '');
                            const joinTo = `/interview/call/${encodeURIComponent(interviewId)}${
                                inv.application_id ? `?applicationId=${encodeURIComponent(inv.application_id)}` : ''
                            }`;
                            const focused = interviewIdQ && interviewId === interviewIdQ;
                            return (
                                <article
                                    key={interviewId}
                                    id={`recruiter-interview-${interviewId}`}
                                    className={`rounded-2xl border bg-white p-6 shadow-sm ${
                                        focused ? 'ring-2 ring-[#29a08e]/40 border-[#29a08e]/40' : 'border-slate-200'
                                    }`}
                                >
                                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                                        <div className="flex items-start gap-3">
                                            <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                                                <User className="w-5 h-5 text-[#29a08e]" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-bold text-slate-900">{inv.seeker_name}</p>
                                                <p className="text-sm font-semibold text-slate-700">{inv.job_title}</p>
                                                {inv.company_name && (
                                                    <p className="text-xs text-slate-500 mt-1 inline-flex items-center gap-1">
                                                        <Building2 size={12} />
                                                        {inv.company_name}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <InterviewStatusBadge status={statusToBadge(inv.status)} />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/70 mb-4">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date</p>
                                            <p className="text-sm font-semibold text-slate-900 mt-1">
                                                {new Date(inv.date).toLocaleDateString(undefined, {
                                                    weekday: 'short',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider inline-flex items-center gap-1">
                                                <Clock size={12} /> Time
                                            </p>
                                            <p className="text-sm font-semibold text-slate-900 mt-1">
                                                {formatCalendarInterviewCardTimeWithZone(inv)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider inline-flex items-center gap-1">
                                                <Video size={12} /> Mode
                                            </p>
                                            <p className="text-sm font-semibold text-slate-900 mt-1">
                                                {inv.mode === 'onsite' ? 'Onsite / Physical' : 'Online'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Duration</p>
                                            <p className="text-sm font-semibold text-slate-900 mt-1">
                                                {Number.isFinite(Number(inv.duration)) ? `${inv.duration} minutes` : '30 minutes'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Interviewer</p>
                                            <p className="text-sm font-semibold text-slate-900 mt-1">
                                                {inv.interviewer || 'Hiring Manager'}
                                            </p>
                                        </div>
                                    </div>

                                    {inv.mode === 'onsite' ? (
                                        <div className="mb-4 p-4 rounded-xl border border-amber-200 bg-amber-50">
                                            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider inline-flex items-center gap-1">
                                                <MapPin size={12} /> Onsite Location
                                            </p>
                                            <p className="text-sm font-semibold text-amber-900 mt-2">
                                                {inv.location || 'Location not provided yet'}
                                            </p>
                                            <p className="text-xs text-amber-800 mt-2">
                                                This is a physical interview. Join button is not shown for onsite mode.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="mb-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50">
                                            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                                                Online Interview Access
                                            </p>
                                            <p className="text-xs text-emerald-800 mt-1">
                                                Use the join button when you are ready to enter the waiting room and video call.
                                            </p>
                                        </div>
                                    )}

                                    {!!(inv.notes && String(inv.notes).trim()) && (
                                        <div className="mb-4 p-4 rounded-xl border border-blue-200 bg-blue-50">
                                            <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider inline-flex items-center gap-1">
                                                <FileText size={12} /> Interview Notes
                                            </p>
                                            <p className="text-sm text-blue-900 mt-2 whitespace-pre-wrap">{inv.notes}</p>
                                        </div>
                                    )}

                                    {inv.reschedule_request && (
                                        <div className="mb-4 p-4 rounded-xl border border-sky-200 bg-sky-50">
                                            <p className="text-[10px] font-bold text-sky-700 uppercase tracking-wider">
                                                Reschedule State
                                            </p>
                                            <p className="text-sm font-semibold text-sky-900 mt-2">
                                                Proposed by {inv.reschedule_request.proposed_by || 'participant'}: {' '}
                                                {inv.reschedule_request.new_date
                                                    ? new Date(inv.reschedule_request.new_date).toLocaleDateString()
                                                    : 'date not set'}{' '}
                                                at{' '}
                                                {inv.reschedule_request.new_date && inv.reschedule_request.new_time
                                                    ? formatNepalWallTimeAmPm(
                                                          inv.reschedule_request.new_date,
                                                          inv.reschedule_request.new_time
                                                      )
                                                    : inv.reschedule_request.new_time || 'time not set'}
                                            </p>
                                            {inv.reschedule_request.reason && (
                                                <p className="text-xs text-sky-900 mt-1">Reason: {inv.reschedule_request.reason}</p>
                                            )}
                                        </div>
                                    )}

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {inv.mode !== 'onsite' && activeTab === 'upcoming' && (
                                            <Link
                                                to={joinTo}
                                                className="inline-flex items-center gap-1.5 text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-[#29a08e] text-white font-semibold hover:bg-[#238276]"
                                            >
                                                Join Interview <ExternalLink size={14} />
                                            </Link>
                                        )}
                                        <Link
                                            to="/recruiter/calendar"
                                            className="inline-flex items-center gap-1.5 text-xs sm:text-sm px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50"
                                        >
                                            ← Back to Calendar
                                        </Link>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

