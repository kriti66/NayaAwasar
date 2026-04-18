import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { getApiErrorMessage } from '../../utils/apiErrorMessage';
import {
    groupInterviewsByUtcDay,
    statusBadgeClasses,
    formatDisplayDayKey
} from '../../utils/interviewCalendarUi';
import { combineDateAndTimeNepal, formatTime, formatCalendarInterviewCardTime } from '../../utils/interviewDateTime';
import InterviewCalendarGrid from '../../components/interviews/InterviewCalendarGrid';
import InterviewCalendarLegend from '../../components/interviews/InterviewCalendarLegend';
import RescheduleModal from '../../components/RescheduleModal';
import { useInterviewCalendarDeepLink } from '../../hooks/useInterviewCalendarDeepLink';
import {
    getInterviewRescheduleUiState,
    formatRescheduleInstantNepal,
    rescheduleProposerDisplayName
} from '../../utils/interviewRescheduleUi';
import { getAvailableInterviewActions } from '../../utils/interviewCalendarActions';
import { buildInterviewDetailsRoute } from '../../utils/interviewViewRouting';

export default function RecruiterCalendar() {
    const navigate = useNavigate();
    const now = new Date();
    const [year, setYear] = useState(now.getUTCFullYear());
    const [monthIndex, setMonthIndex] = useState(now.getUTCMonth());
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDayKey, setSelectedDayKey] = useState(null);
    const [busyId, setBusyId] = useState(null);
    const [rescheduleModal, setRescheduleModal] = useState(null);
    const [cancelForId, setCancelForId] = useState(null);
    const [cancelReason, setCancelReason] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/interviews/calendar/recruiter');
            setInterviews(data.interviews || []);
        } catch (e) {
            toast.error(getApiErrorMessage(e, 'Failed to load calendar'));
            setInterviews([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        const onRefetch = () => {
            void load();
        };
        window.addEventListener('recruiter:calendarRefetch', onRefetch);
        return () => window.removeEventListener('recruiter:calendarRefetch', onRefetch);
    }, [load]);

    const visibleInterviews = useMemo(
        () => (interviews || []).filter((i) => i.status !== 'cancelled'),
        [interviews]
    );

    const byDay = useMemo(() => groupInterviewsByUtcDay(visibleInterviews), [visibleInterviews]);

    const selectedList = selectedDayKey ? byDay.get(selectedDayKey) || [] : [];

    const { highlightedInterviewId, registerInterviewCardRef, interviewCardHighlightClass } =
        useInterviewCalendarDeepLink({
            loading,
            interviews: visibleInterviews,
            setYear,
            setMonthIndex,
            setSelectedDayKey
        });

    const goPrev = () => {
        if (monthIndex === 0) {
            setMonthIndex(11);
            setYear((y) => y - 1);
        } else setMonthIndex((m) => m - 1);
    };

    const goNext = () => {
        if (monthIndex === 11) {
            setMonthIndex(0);
            setYear((y) => y + 1);
        } else setMonthIndex((m) => m + 1);
    };

    const handleRescheduleAccept = async (id) => {
        setBusyId(id);
        try {
            await api.patch(`/interviews/${id}/reschedule/accept`);
            toast.success('Reschedule accepted');
            await load();
        } catch (e) {
            toast.error(getApiErrorMessage(e, 'Could not accept reschedule'));
        } finally {
            setBusyId(null);
        }
    };

    const handleRescheduleReject = async (id) => {
        setBusyId(id);
        try {
            await api.patch(`/interviews/${id}/reschedule/reject`);
            toast.success('Reschedule declined; original time kept');
            await load();
        } catch (e) {
            toast.error(getApiErrorMessage(e, 'Could not decline reschedule'));
        } finally {
            setBusyId(null);
        }
    };

    const handleFsmCancelRequest = async (id) => {
        setBusyId(id);
        try {
            await api.post(`/interviews/reschedule/${id}/cancel-request`);
            toast.success('Your reschedule request was withdrawn');
            await load();
        } catch (e) {
            toast.error(getApiErrorMessage(e, 'Could not cancel request'));
        } finally {
            setBusyId(null);
        }
    };

    const handleViewInterview = (interviewId, applicationId, date) => {
        navigate(buildInterviewDetailsRoute('recruiter', { interviewId, applicationId, date }));
    };

    const handleCancel = async () => {
        if (!cancelForId) return;
        setBusyId(cancelForId);
        try {
            await api.patch(`/interviews/${cancelForId}/cancel`, {
                cancel_reason: cancelReason.trim()
            });
            toast.success('Interview cancelled');
            setCancelForId(null);
            setCancelReason('');
            await load();
        } catch (e) {
            toast.error(getApiErrorMessage(e, 'Could not cancel'));
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="min-h-[calc(100vh-3.5rem)] bg-slate-50">
            <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="flex items-start gap-3">
                        <div className="h-11 w-11 rounded-xl bg-[#29a08e] flex items-center justify-center shrink-0">
                            <CalendarDays className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Interview calendar</h1>
                            <p className="text-sm text-slate-600 mt-0.5">
                                View and manage candidate interviews by date. For upcoming and past lists with full
                                details, use Interview Center.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate('/recruiter/interviews')}
                        className="shrink-0 inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold bg-[#29a08e] text-white shadow-sm hover:bg-[#238276] transition-colors w-full sm:w-auto"
                    >
                        View Interviews
                    </button>
                </div>

                <div className="mb-4 p-3 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Legend</p>
                    <InterviewCalendarLegend />
                    <p className="text-xs text-slate-500 mt-3 border-t border-slate-100 pt-3">
                        Cancelled interviews are hidden from this calendar. You will be notified if interviews were
                        cancelled because a job was hidden or removed by an admin.
                    </p>
                </div>

                {loading ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
                        Loading calendar…
                    </div>
                ) : visibleInterviews.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-600">
                        <p>No interviews on your calendar right now.</p>
                        <p className="text-sm text-slate-500 mt-2">
                            Schedule interviews from applications to see them here. Cancelled slots (including when a job
                            is removed by an admin) are omitted; check notifications for details.
                        </p>
                    </div>
                ) : null}

                {!loading && visibleInterviews.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        <div className="lg:col-span-2">
                            <InterviewCalendarGrid
                                year={year}
                                monthIndex={monthIndex}
                                onPrevMonth={goPrev}
                                onNextMonth={goNext}
                                interviewsByDay={byDay}
                                selectedDayKey={selectedDayKey}
                                onSelectDay={setSelectedDayKey}
                            />
                        </div>

                        <aside className="lg:col-span-1 rounded-xl border border-slate-200 bg-white shadow-sm p-4 min-h-[200px]">
                            {!selectedDayKey && (
                                <p className="text-sm text-slate-500">Select a date to see interviews.</p>
                            )}
                            {selectedDayKey && selectedList.length === 0 && (
                                <p className="text-sm text-slate-500">No interviews on {formatDisplayDayKey(selectedDayKey)}.</p>
                            )}
                            {selectedDayKey && selectedList.length > 0 && (
                                <>
                                    <h3 className="text-sm font-semibold text-slate-900 mb-3">
                                        {formatDisplayDayKey(selectedDayKey)}
                                    </h3>
                                    <ul className="space-y-4">
                                        {selectedList.map((inv) => {
                                            const ui = getInterviewRescheduleUiState(inv, 'recruiter');
                                            const fsm = inv.reschedule_fsm || {};
                                            const actions = getAvailableInterviewActions(inv, 'recruiter');
                                            const legacyJobseekerReschedulePending =
                                                inv.status === 'reschedule_requested' &&
                                                !ui.activeFsm &&
                                                inv.reschedule_request?.proposed_by === 'jobseeker';
                                            const rq = inv.reschedule_request;
                                            const proposedRescheduleSlot =
                                                rq?.new_date && rq?.new_time
                                                    ? combineDateAndTimeNepal(rq.new_date, rq.new_time)
                                                    : null;
                                            const proposedRescheduleTimeDisplay =
                                                proposedRescheduleSlot &&
                                                !Number.isNaN(proposedRescheduleSlot.getTime())
                                                    ? formatTime(proposedRescheduleSlot.toISOString())
                                                    : rq?.new_time || '—';
                                            return (
                                            <li
                                                key={inv.id}
                                                ref={(el) => registerInterviewCardRef(inv.id, el)}
                                                className={`rounded-lg border border-slate-100 bg-slate-50/80 p-3 space-y-2 transition-shadow duration-300 ${
                                                    highlightedInterviewId === String(inv.id)
                                                        ? interviewCardHighlightClass
                                                        : ''
                                                }`}
                                            >
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusBadgeClasses(inv.status)}`}
                                                    >
                                                        {inv.status.replace(/_/g, ' ')}
                                                    </span>
                                                </div>
                                                <p className="font-medium text-slate-900">{inv.seeker_name}</p>
                                                <p className="text-sm text-slate-600">{inv.job_title}</p>
                                                <p className="text-sm text-slate-600">
                                                    {formatCalendarInterviewCardTime(inv)} ·{' '}
                                                    {inv.mode === 'onsite' ? 'Onsite' : 'Online'}
                                                </p>

                                                {!ui.activeFsm && inv.reschedule_request && (
                                                    <div className="text-xs text-slate-600 bg-white rounded-md p-2 border border-slate-100">
                                                        <span className="font-semibold">Proposed change</span>
                                                        {inv.reschedule_request.proposed_by === 'jobseeker'
                                                            ? ' by jobseeker'
                                                            : (
                                                                <>
                                                                    {' '}
                                                                    by {inv.reschedule_request.proposed_by}
                                                                </>
                                                              )}
                                                        :{' '}
                                                        {inv.reschedule_request.new_date
                                                            ? new Date(inv.reschedule_request.new_date).toLocaleDateString(
                                                                  undefined,
                                                                  { timeZone: 'UTC' }
                                                              )
                                                            : '—'}{' '}
                                                        at {proposedRescheduleTimeDisplay}
                                                    </div>
                                                )}

                                                {legacyJobseekerReschedulePending && (
                                                    <div className="flex flex-wrap gap-2 pt-1">
                                                        <button
                                                            type="button"
                                                            disabled={busyId === inv.id}
                                                            onClick={() => handleRescheduleAccept(inv.id)}
                                                            className="text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 shadow-sm"
                                                        >
                                                            Accept Reschedule
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={busyId === inv.id}
                                                            onClick={() => handleRescheduleReject(inv.id)}
                                                            className="text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50 shadow-sm"
                                                        >
                                                            Reject Reschedule
                                                        </button>
                                                    </div>
                                                )}

                                                {ui.waitingMessage && (
                                                    <p className="text-xs text-slate-600">{ui.waitingMessage}</p>
                                                )}
                                                {ui.counterMaxMessage && (
                                                    <p className="text-xs text-amber-800">{ui.counterMaxMessage}</p>
                                                )}

                                                <div className="flex flex-wrap gap-2 pt-1">
                                                    {inv.status === 'reschedule_requested' &&
                                                        ui.showAccept &&
                                                        !legacyJobseekerReschedulePending && (
                                                        <button
                                                            type="button"
                                                            disabled={busyId === inv.id}
                                                            onClick={() => handleRescheduleAccept(inv.id)}
                                                            className="text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-[#29a08e] text-white font-medium hover:bg-[#238276] disabled:opacity-50"
                                                        >
                                                            Accept new time
                                                        </button>
                                                    )}

                                                    {inv.status === 'reschedule_requested' &&
                                                        ui.showDecline &&
                                                        !legacyJobseekerReschedulePending && (
                                                        <button
                                                            type="button"
                                                            disabled={busyId === inv.id}
                                                            onClick={() => handleRescheduleReject(inv.id)}
                                                            className="text-xs sm:text-sm px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-white disabled:opacity-50"
                                                        >
                                                            Decline request
                                                        </button>
                                                    )}

                                                    {inv.status === 'reschedule_requested' && ui.showCounter && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setRescheduleModal({ id: inv.id, mode: 'counter' })
                                                            }
                                                            className="text-xs sm:text-sm px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-white"
                                                        >
                                                            Propose another time
                                                        </button>
                                                    )}

                                                    {inv.status === 'reschedule_requested' && ui.showCancelMyRequest && (
                                                        <button
                                                            type="button"
                                                            disabled={busyId === inv.id}
                                                            onClick={() => handleFsmCancelRequest(inv.id)}
                                                            className="text-xs sm:text-sm px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-white disabled:opacity-50"
                                                        >
                                                            Cancel my request
                                                        </button>
                                                    )}

                                                    {actions.canViewInterview && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleViewInterview(
                                                                    inv.id,
                                                                    inv.application_id,
                                                                    inv.date
                                                                )
                                                            }
                                                            className="text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-[#29a08e] text-white font-semibold hover:bg-[#238276] shadow-sm"
                                                        >
                                                            View interview
                                                        </button>
                                                    )}

                                                    {actions.canRequestReschedule && ui.showRequestReschedule && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setRescheduleModal({ id: inv.id, mode: 'request' })
                                                                }
                                                                className="text-xs sm:text-sm px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-white"
                                                            >
                                                                Request reschedule
                                                            </button>
                                                        )}

                                                    {actions.canCancelInterview && (
                                                        <button
                                                            type="button"
                                                            disabled={busyId === inv.id}
                                                            onClick={() => {
                                                                setCancelForId(inv.id);
                                                                setCancelReason('');
                                                            }}
                                                            className="text-xs sm:text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-700 font-medium hover:bg-red-50"
                                                        >
                                                            Cancel interview
                                                        </button>
                                                    )}

                                                </div>

                                                {ui.activeFsm && fsm.proposed_at && (
                                                    <p className="text-xs text-slate-600 pt-1 border-t border-slate-100">
                                                        <span className="font-semibold">Proposed time</span> (
                                                        {rescheduleProposerDisplayName(fsm)}):{' '}
                                                        {formatRescheduleInstantNepal(fsm.proposed_at)}
                                                        {fsm.note ? ` · “${fsm.note}”` : ''}
                                                    </p>
                                                )}
                                            </li>
                                            );
                                        })}
                                    </ul>
                                </>
                            )}
                        </aside>
                    </div>
                )}
            </div>

            <RescheduleModal
                open={!!rescheduleModal}
                mode={rescheduleModal?.mode || 'request'}
                interviewId={rescheduleModal?.id}
                onClose={() => setRescheduleModal(null)}
                onSuccess={load}
            />

            {cancelForId && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <button
                        type="button"
                        className="absolute inset-0 bg-slate-900/50"
                        aria-label="Close"
                        onClick={() => !busyId && setCancelForId(null)}
                    />
                    <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-slate-200 p-4">
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">Cancel interview</h3>
                        <p className="text-sm text-slate-600 mb-3">Optional message for the candidate.</p>
                        <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            rows={2}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mb-4"
                            placeholder="Reason (optional)"
                        />
                        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                            <button
                                type="button"
                                disabled={!!busyId}
                                onClick={() => setCancelForId(null)}
                                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700"
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                disabled={!!busyId}
                                onClick={handleCancel}
                                className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium disabled:opacity-50"
                            >
                                {busyId ? 'Cancelling…' : 'Confirm cancel'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
