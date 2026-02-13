import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import applicationService from '../../services/applicationService';
import { Calendar as CalendarIcon, Clock, MapPin, Video, User, Link as LinkIcon, X, AlertCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const SeekerInterviews = () => {
    const [searchParams] = useSearchParams();
    const isFocused = searchParams.get('focused') === 'true';

    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
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

    const from = searchParams.get('from');

    const getBackLink = () => {
        if (from === 'notifications') return { to: '/seeker/notifications', label: 'Back to Notifications' };
        return { to: '/seeker/applications', label: 'Back to Applications' };
    };

    const backLink = getBackLink();

    const MainContent = () => (
        <div className={isFocused ? "max-w-4xl mx-auto w-full px-6 py-12 md:py-20 animate-in fade-in duration-700" : "flex-1 p-10 max-w-5xl mx-auto w-full"}>
            {isFocused && (
                <Link
                    to={backLink.to}
                    className="inline-flex items-center gap-2 text-xs font-black text-gray-400 hover:text-[#2D9B82] uppercase tracking-[0.2em] mb-12 group transition-colors"
                >
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    {backLink.label}
                </Link>
            )}

            <div className="mb-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Upcoming Interviews</h1>
                <p className="text-slate-500 font-medium text-lg">View your scheduled interviews, interview details, and preparation instructions.</p>
            </div>

            {loading ? (
                <div className="space-y-6">
                    {[1, 2].map(i => (
                        <div key={i} className="h-64 bg-white border border-slate-100 rounded-3xl animate-pulse shadow-sm"></div>
                    ))}
                </div>
            ) : interviews.length > 0 ? (
                <div className="space-y-10">
                    {interviews.map((app) => {
                        const isFuture = app.interview?.date ? new Date(app.interview.date) > new Date() : false;
                        const hasPendingRequest = app.rescheduleRequest?.status === 'pending' && app.rescheduleRequest?.reason;

                        return (
                            <div key={app._id} className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
                                <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8 pb-8 border-b border-slate-50">
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 mb-1 leading-tight uppercase tracking-tight">{app.job_id?.title}</h2>
                                        <p className="text-slate-500 font-bold text-sm tracking-wide">
                                            {app.job_id?.company_name} · {app.job_id?.location}
                                        </p>
                                    </div>
                                    <span className="px-4 py-1.5 bg-[#2D9B82] text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#2D9B82]/20">
                                        Interview Scheduled
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mb-10">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <CalendarIcon className="w-3 h-3 text-[#2D9B82]" /> Date
                                        </p>
                                        <p className="text-sm font-bold text-slate-800">
                                            {new Date(app.interview?.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Clock className="w-3 h-3 text-[#2D9B82]" /> Time (Local)
                                        </p>
                                        <p className="text-sm font-bold text-slate-800">{app.interview?.time} (GMT +5:45)</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Video className="w-3 h-3 text-[#2D9B82]" /> Mode
                                        </p>
                                        <p className="text-sm font-bold text-slate-800">{app.interview?.mode}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <LinkIcon className="w-3 h-3 text-[#2D9B82]" />
                                            {app.interview?.mode === 'Online' ? 'Meeting Link' : 'Location'}
                                        </p>
                                        {app.interview?.mode === 'Online' ? (
                                            app.interview?.interviewId ? (
                                                <Link to={`/interview/call/${app.interview.interviewId}`} className="text-sm font-bold text-[#2D9B82] hover:underline flex items-center gap-1.5">
                                                    Join Interview Call <Video className="w-3 h-3" />
                                                </Link>
                                            ) : (
                                                <a href={app.interview?.meetLink} target="_blank" rel="noreferrer" className="text-sm font-bold text-[#2D9B82] hover:underline flex items-center gap-1.5">
                                                    Join Interview Link <LinkIcon className="w-3 h-3" />
                                                </a>
                                            )
                                        ) : (
                                            <p className="text-sm font-bold text-slate-800">{app.interview?.location || 'TBD'}</p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <User className="w-3 h-3 text-[#2D9B82]" /> Interviewer
                                        </p>
                                        <p className="text-sm font-bold text-slate-800">{app.interview?.interviewer || 'Hiring Manager'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Clock className="w-3 h-3 text-[#2D9B82]" /> Duration
                                        </p>
                                        <p className="text-sm font-bold text-slate-800">{app.interview?.duration || '30 minutes'}</p>
                                    </div>
                                </div>

                                {app.interview?.notes && (
                                    <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-100 mb-8">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Notes from Recruiter:</h4>
                                        <p className="text-sm font-medium text-slate-600 leading-relaxed italic">"{app.interview.notes}"</p>
                                    </div>
                                )}

                                <div className="pt-8 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="flex-1">
                                        {!hasPendingRequest && (
                                            <p className="text-[11px] font-medium text-slate-400 leading-relaxed max-w-lg italic">
                                                If you are unavailable at the scheduled time, you may request a reschedule. The recruiter will review your request and respond.
                                            </p>
                                        )}
                                        {hasPendingRequest && (
                                            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg border border-amber-100 w-fit">
                                                <AlertCircle className="w-4 h-4" />
                                                <span className="text-[11px] font-black uppercase tracking-widest">Reschedule request pending recruiter approval</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-3">
                                        {isFuture && !hasPendingRequest && (
                                            <button
                                                onClick={() => setRescheduleModal({ show: true, application: app })}
                                                className="px-8 py-3 bg-[#2D9B82] text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-[#2D9B82]/20 hover:bg-[#25836d] hover:-translate-y-0.5 transition-all active:scale-[0.98]"
                                            >
                                                Request Reschedule
                                            </button>
                                        )}
                                        <Link
                                            to={`/jobseeker/jobs/${app.job_id?._id || app.job_id}`}
                                            className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all text-center flex items-center justify-center font-bold"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] py-32 text-center animate-in fade-in duration-700">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <CalendarIcon className="w-10 h-10 text-slate-200" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-3">No Upcoming Interviews</h3>
                    <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">Your professional journey is just beginning. When recruiters schedule an appointment, they will appear here in real-time.</p>
                </div>
            )}

            {/* Reschedule Modal */}
            {rescheduleModal.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setRescheduleModal({ show: false, application: null })}></div>
                    <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl shadow-slate-900/20 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">Request Interview Reschedule</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{rescheduleModal.application?.job_id?.title}</p>
                            </div>
                            <button onClick={() => setRescheduleModal({ show: false, application: null })} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400 hover:text-slate-900">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reason for Reschedule *</label>
                                <textarea
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-[#2D9B82]/20 focus:border-[#2D9B82] transition-all outline-none min-h-[120px]"
                                    placeholder="Explain why you need to reschedule..."
                                    value={rescheduleForm.reason}
                                    onChange={(e) => setRescheduleForm({ ...rescheduleForm, reason: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Preferred Date (Optional)</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-[#2D9B82]/20 focus:border-[#2D9B82] transition-all outline-none"
                                        value={rescheduleForm.preferredDate}
                                        onChange={(e) => setRescheduleForm({ ...rescheduleForm, preferredDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Preferred Time (Optional)</label>
                                    <input
                                        type="time"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-[#2D9B82]/20 focus:border-[#2D9B82] transition-all outline-none"
                                        value={rescheduleForm.preferredTime}
                                        onChange={(e) => setRescheduleForm({ ...rescheduleForm, preferredTime: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t border-slate-50 bg-slate-50/50 flex gap-4">
                            <button
                                onClick={() => setRescheduleModal({ show: false, application: null })}
                                className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRescheduleSubmit}
                                disabled={actionLoading}
                                className="flex-1 py-3 bg-[#2D9B82] text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-[#2D9B82]/20 hover:bg-[#25836d] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                            >
                                {actionLoading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : "Submit Request"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <>
            <div className="flex-1 flex flex-col w-full">
                <header className="h-16 bg-white border-b border-slate-100 flex items-center px-4 sm:px-6 lg:px-8 sticky top-0 z-30 justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Jobseeker /</span>
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-widest">Interviews</span>
                    </div>
                </header>

                <MainContent />
            </div>
        </>
    );
};

export default SeekerInterviews;
