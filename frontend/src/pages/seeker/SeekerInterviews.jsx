import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import applicationService from '../../services/applicationService';
import {
    Calendar as CalendarIcon, Clock, MapPin, Video, User,
    Link as LinkIcon, X, AlertCircle, ArrowLeft, Sparkles,
    ChevronRight, CalendarDays, ExternalLink, XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const SeekerInterviews = () => {
    const [searchParams] = useSearchParams();
    const isFocused = searchParams.get('focused') === 'true';

    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [decisionLoading, setDecisionLoading] = useState(false);
    const [rescheduleModal, setRescheduleModal] = useState({ show: false, application: null });
    const [rescheduleForm, setRescheduleForm] = useState({ reason: '', preferredDate: '', preferredTime: '' });

    const fetchInterviews = async () => {
        try {
            const data = await applicationService.getMyInterviews();
            setInterviews(data);
        } catch (error) {
            console.error("Error fetching upcoming interviews:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInterviews();
    }, []);

    // Refetch when returning from notification (keeps page and notification in sync)
    useEffect(() => {
        if (!isFocused) return;
        const handleFocus = () => fetchInterviews();
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [isFocused]);

    const handleRescheduleSubmit = async () => {
        if (!rescheduleForm.reason) {
            toast.error('Please provide a reason for rescheduling');
            return;
        }

        setActionLoading(true);
        try {
            await applicationService.requestReschedule(rescheduleModal.application._id, rescheduleForm);
            toast.success('Reschedule request submitted. Recruiter will review and respond.');
            setRescheduleModal({ show: false, application: null });
            setRescheduleForm({ reason: '', preferredDate: '', preferredTime: '' });
            fetchInterviews();
        } catch (error) {
            toast.error(error.message || 'Failed to submit request');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRecruiterRescheduleAccept = async (applicationId) => {
        setDecisionLoading(true);
        try {
            await applicationService.acceptRecruiterReschedule(applicationId);
            toast.success('Reschedule accepted. Your interview has been updated to the new date.');
            fetchInterviews();
        } catch (error) {
            const msg = error?.message || error?.response?.data?.message || 'Failed to accept reschedule request';
            toast.error(msg);
        } finally {
            setDecisionLoading(false);
        }
    };

    const handleRecruiterRescheduleReject = async (applicationId) => {
        setDecisionLoading(true);
        try {
            await applicationService.rejectRecruiterReschedule(applicationId);
            toast.success('Reschedule declined. Your original schedule remains active.');
            fetchInterviews();
        } catch (error) {
            const msg = error?.message || error?.response?.data?.message || 'Failed to decline reschedule request';
            toast.error(msg);
        } finally {
            setDecisionLoading(false);
        }
    };

    const from = searchParams.get('from');

    const getBackLink = () => {
        if (from === 'notifications') return { to: '/seeker/notifications', label: 'Back to Notifications' };
        return { to: '/seeker/applications', label: 'Back to Applications' };
    };

    const backLink = getBackLink();

    const getTimeUntilInterview = (date) => {
        if (!date) return null;
        const now = new Date();
        const interviewDate = new Date(date);
        const diffMs = interviewDate - now;
        if (diffMs < 0) return 'Past';
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (diffDays > 0) return `${diffDays}d ${diffHours}h`;
        if (diffHours > 0) return `${diffHours}h`;
        return 'Today';
    };

    const InterviewCard = ({ app }) => {
        const isFuture = app.interview?.date
            ? new Date(new Date(app.interview.date).setHours(23, 59, 59, 999)) >= new Date()
            : false;
        const hasPendingRequest = app.reschedule?.requested && !app.reschedule?.reviewed && app.reschedule?.reason;
        const recruiterReschedulePending =
            ['PENDING', 'PROPOSED'].includes(app.interview?.interviewId?.rescheduleStatus) &&
            app.interview?.interviewId?.rescheduleRequestedBy === 'recruiter';
        const jobseekerRescheduleRejected =
            app.interview?.interviewId?.rescheduleStatus === 'REJECTED' &&
            app.interview?.interviewId?.rescheduleRequestedBy === 'jobseeker';
        const rescheduleRejectedReason = app.interview?.interviewId?.rescheduleRejectedReason || app.reschedule?.rejectionReason;
        const timeUntil = getTimeUntilInterview(app.interview?.date);

        return (
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group">
                {/* Top accent bar */}
                <div className={`h-1 ${jobseekerRescheduleRejected ? 'bg-gradient-to-r from-red-400 to-rose-500' : 'bg-gradient-to-r from-[#29a08e] via-teal-400 to-emerald-400'}`}></div>

                <div className="p-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                                <span className="text-[#29a08e] font-bold text-xl">
                                    {app.job_id?.company_name?.charAt(0) || 'C'}
                                </span>
                            </div>
                            <div>
                                <h2 className="text-xl font-extrabold text-gray-900 mb-1 leading-tight">
                                    {app.job_id?.title}
                                </h2>
                                <p className="text-gray-500 font-medium text-sm flex items-center gap-2 flex-wrap">
                                    <span>{app.job_id?.company_name}</span>
                                    <span className="text-gray-300">·</span>
                                    <span className="flex items-center gap-1">
                                        <MapPin size={12} className="text-[#29a08e]" />
                                        {app.job_id?.location}
                                    </span>
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            {timeUntil && timeUntil !== 'Past' && (
                                <span className="px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-[10px] font-black uppercase tracking-wider border border-orange-100">
                                    {timeUntil === 'Today' ? '⏰ Today' : `🗓 In ${timeUntil}`}
                                </span>
                            )}
                            {recruiterReschedulePending ? (
                                <span className="px-4 py-1.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold uppercase tracking-widest border border-amber-200 flex items-center gap-1.5">
                                    <AlertCircle size={12} /> Reschedule Pending
                                </span>
                            ) : (
                                <span className="px-4 py-1.5 bg-[#29a08e] text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-[#29a08e]/20">
                                    Scheduled
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Interview Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8 p-6 bg-gray-50/70 rounded-xl border border-gray-100">
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                <CalendarIcon className="w-3 h-3 text-[#29a08e]" /> Date
                            </p>
                            <p className="text-sm font-bold text-gray-800">
                                {new Date(app.interview?.date).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Clock className="w-3 h-3 text-[#29a08e]" /> Time
                            </p>
                            <p className="text-sm font-bold text-gray-800">{app.interview?.time} (GMT +5:45)</p>
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Video className="w-3 h-3 text-[#29a08e]" /> Mode
                            </p>
                            <p className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                                {app.interview?.mode}
                                {app.interview?.mode === 'Online' && (
                                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                )}
                            </p>
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                <LinkIcon className="w-3 h-3 text-[#29a08e]" />
                                {app.interview?.mode === 'Online' ? 'Join Link' : 'Location'}
                            </p>
                            {app.interview?.mode === 'Online' ? (
                                app.interview?.roomId ? (
                                    <Link to={`/interview/call/${app.interview.roomId}`} className="text-sm font-bold text-[#29a08e] hover:underline flex items-center gap-1.5">
                                        Join Interview <ExternalLink className="w-3 h-3" />
                                    </Link>
                                ) : (
                                    <span className="text-sm font-medium text-gray-400 italic">Generating...</span>
                                )
                            ) : (
                                <p className="text-sm font-bold text-gray-800">{app.interview?.location || 'TBD'}</p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                <User className="w-3 h-3 text-[#29a08e]" /> Interviewer
                            </p>
                            <p className="text-sm font-bold text-gray-800">{app.interview?.interviewer || 'Hiring Manager'}</p>
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Clock className="w-3 h-3 text-[#29a08e]" /> Duration
                            </p>
                            <p className="text-sm font-bold text-gray-800">{app.interview?.duration || '30 minutes'}</p>
                        </div>
                    </div>

                    {/* Reschedule Rejected Alert */}
                    {jobseekerRescheduleRejected && (
                        <div className="mb-6 p-5 rounded-xl border border-red-200 bg-red-50">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                                    <XCircle className="w-5 h-5 text-red-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-red-800 mb-1">Reschedule Request Rejected</h4>
                                    {rescheduleRejectedReason && (
                                        <p className="text-sm text-red-700 mb-2">
                                            <span className="font-semibold">Reason: </span>
                                            {rescheduleRejectedReason}
                                        </p>
                                    )}
                                    <p className="text-sm font-medium text-red-700">
                                        Your original interview schedule below is still active. Please attend at the scheduled time.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notes section */}
                    {app.interview?.notes && (
                        <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100/50 mb-6">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                💬 Notes from Recruiter
                            </h4>
                            <p className="text-sm font-medium text-gray-600 leading-relaxed italic">"{app.interview.notes}"</p>
                        </div>
                    )}

                    {/* Actions footer */}
                    <div className="pt-6 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex-1">
                            {recruiterReschedulePending ? (
                                <div className="flex flex-col gap-2 px-4 py-3 bg-amber-50 text-amber-900 rounded-xl border border-amber-100 w-full max-w-lg">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        <span className="text-[11px] font-bold uppercase tracking-widest">Recruiter reschedule proposal</span>
                                    </div>
                                    <div className="text-sm font-bold">
                                        Proposed:{" "}
                                        {app.interview?.interviewId?.proposedDate
                                            ? new Date(app.interview?.interviewId?.proposedDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                                            : 'No date'}{" "}
                                        at {app.interview?.interviewId?.proposedTime || 'No time'}
                                    </div>
                                    {app.interview?.interviewId?.rescheduleReason && (
                                        <div className="text-xs text-amber-800/90 leading-relaxed">
                                            Reason: <span className="font-bold italic">"{app.interview?.interviewId?.rescheduleReason}"</span>
                                        </div>
                                    )}
                                    <p className="text-xs text-amber-700 mt-2 font-medium">
                                        If you decline, your original schedule remains active.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {!hasPendingRequest && (
                                        <p className="text-[11px] font-medium text-gray-400 leading-relaxed max-w-lg">
                                            If you're unavailable, you may request a reschedule. The recruiter will review your request.
                                        </p>
                                    )}
                                    {hasPendingRequest && (
                                        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 w-fit">
                                            <AlertCircle className="w-4 h-4" />
                                            <span className="text-[11px] font-bold uppercase tracking-widest">Reschedule request pending</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="flex gap-3">
                            {recruiterReschedulePending ? (
                                <button
                                    onClick={() => handleRecruiterRescheduleAccept(app._id)}
                                    disabled={decisionLoading}
                                    className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all active:scale-95 shadow-lg shadow-emerald-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    Accept
                                </button>
                            ) : (
                                isFuture && !hasPendingRequest && (
                                    <button
                                        onClick={() => setRescheduleModal({ show: true, application: app })}
                                        className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all active:scale-95 shadow-lg shadow-gray-900/10"
                                    >
                                        Request Reschedule
                                    </button>
                                )
                            )}
                            {recruiterReschedulePending && (
                                <button
                                    onClick={() => handleRecruiterRescheduleReject(app._id)}
                                    disabled={decisionLoading}
                                    className="px-6 py-2.5 bg-white border border-amber-200 text-amber-700 rounded-xl text-xs font-bold hover:bg-amber-50 transition-all active:scale-95 shadow-sm shadow-amber-500/10 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    Reject
                                </button>
                            )}
                            <Link
                                to={`/jobseeker/jobs/${app.job_id?._id || app.job_id}`}
                                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all text-center flex items-center justify-center gap-1.5"
                            >
                                View Job <ChevronRight size={14} />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            {/* Hero Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1a2744] to-[#0d2137] text-white pt-10 pb-24 px-4 sm:px-6 lg:px-8">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#29a08e]/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-500/8 rounded-full blur-3xl"></div>
                    <div className="absolute inset-0 opacity-[0.03]" style={{
                        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                        backgroundSize: '40px 40px'
                    }}></div>
                </div>

                <div className="max-w-5xl mx-auto relative z-10">
                    {isFocused && (
                        <Link
                            to={backLink.to}
                            className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-[#5eead4] uppercase tracking-widest mb-8 group transition-colors"
                        >
                            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                            {backLink.label}
                        </Link>
                    )}

                    <div className="flex items-center gap-2 mb-4">
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-semibold text-gray-300 border border-white/10">
                            <CalendarDays size={12} className="text-[#5eead4]" />
                            Interview Center
                        </span>
                        {interviews.length > 0 && (
                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-[#29a08e]/20 backdrop-blur-md rounded-full text-[10px] font-semibold text-[#5eead4] border border-[#29a08e]/30">
                                {interviews.length} scheduled
                            </span>
                        )}
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
                        Upcoming <span className="bg-gradient-to-r from-[#5eead4] to-[#29a08e] bg-clip-text text-transparent">Interviews</span>
                    </h1>
                    <p className="text-gray-400 font-medium max-w-lg text-base">
                        View your scheduled interviews, interview details, and preparation instructions.
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 -mt-14 relative z-10 pb-12">
                {loading ? (
                    <div className="space-y-6">
                        {[1, 2].map(i => (
                            <div key={i} className="h-64 bg-white border border-gray-100 rounded-2xl animate-pulse shadow-sm"></div>
                        ))}
                    </div>
                ) : interviews.length > 0 ? (
                    <div className="space-y-6">
                        {interviews.map((app) => (
                            <InterviewCard key={app._id} app={app} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white border border-gray-100 rounded-2xl py-24 text-center shadow-sm">
                        <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <CalendarIcon className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-2xl font-extrabold text-gray-900 mb-2">No Upcoming Interviews</h3>
                        <p className="text-gray-500 font-medium max-w-sm mx-auto leading-relaxed mb-8">
                            Your professional journey is just beginning. When recruiters schedule an appointment, they will appear here.
                        </p>
                        <Link to="/seeker/jobs" className="inline-flex items-center gap-2 px-6 py-3 bg-[#29a08e] text-white text-sm font-bold rounded-xl hover:bg-[#228377] transition-all shadow-lg shadow-[#29a08e]/20">
                            Browse Open Positions <ChevronRight size={16} />
                        </Link>
                    </div>
                )}
            </div>

            {/* Reschedule Modal */}
            {rescheduleModal.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setRescheduleModal({ show: false, application: null })}></div>
                    <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal accent */}
                        <div className="h-1 bg-gradient-to-r from-[#29a08e] via-teal-400 to-emerald-400"></div>

                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-extrabold text-gray-900">Request Reschedule</h3>
                                <p className="text-xs font-medium text-gray-400 mt-1">{rescheduleModal.application?.job_id?.title}</p>
                            </div>
                            <button onClick={() => setRescheduleModal({ show: false, application: null })} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-900">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Reason for Reschedule *</label>
                                <textarea
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-[#29a08e]/20 focus:border-[#29a08e] transition-all outline-none min-h-[120px] resize-none"
                                    placeholder="Explain why you need to reschedule..."
                                    value={rescheduleForm.reason}
                                    onChange={(e) => setRescheduleForm({ ...rescheduleForm, reason: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Preferred Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-[#29a08e]/20 focus:border-[#29a08e] transition-all outline-none"
                                        value={rescheduleForm.preferredDate}
                                        onChange={(e) => setRescheduleForm({ ...rescheduleForm, preferredDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Preferred Time</label>
                                    <input
                                        type="time"
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-[#29a08e]/20 focus:border-[#29a08e] transition-all outline-none"
                                        value={rescheduleForm.preferredTime}
                                        onChange={(e) => setRescheduleForm({ ...rescheduleForm, preferredTime: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-3">
                            <button
                                onClick={() => setRescheduleModal({ show: false, application: null })}
                                className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRescheduleSubmit}
                                disabled={actionLoading}
                                className="flex-1 py-3 bg-[#29a08e] text-white rounded-xl text-xs font-bold shadow-lg shadow-[#29a08e]/20 hover:bg-[#228377] transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                            >
                                {actionLoading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : "Submit Request"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SeekerInterviews;
