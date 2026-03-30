import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getApiErrorMessage } from '../../utils/apiErrorMessage';
import {
    Calendar,
    Video,
    MapPin,
    AlertCircle,
    ChevronRight,
    ExternalLink,
    Loader2
} from 'lucide-react';
import applicationService from '../../services/applicationService';
import toast from 'react-hot-toast';
import InterviewStatusBadge from '../interviews/InterviewStatusBadge';

const formatDate = (date) => {
    if (!date) return 'Date TBD';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return 'Date TBD';
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (time) => time || 'Time TBD';

const UpcomingInterviewWidget = ({ interviews, loading = false, onRescheduleAction }) => {
    const { user } = useAuth();
    const isJobseeker = user?.role === 'jobseeker' || user?.role === 'job_seeker';
    const [actionLoading, setActionLoading] = useState(false);
    const nextInterview = interviews && Array.isArray(interviews) && interviews.length > 0 ? interviews[0] : null;
    const interviewDoc = nextInterview?.interview?.interviewId;
    const interviewStatus = interviewDoc?.interviewStatus || 'scheduled';
    const isReschedulePending = interviewStatus === 'reschedule_pending';
    const roomId = nextInterview?.interview?.roomId;
    const joinCallPath =
        roomId && nextInterview?._id
            ? `/interview/call/${roomId}?applicationId=${nextInterview._id}`
            : roomId
              ? `/interview/call/${roomId}`
              : null;

    const handleAcceptReschedule = async () => {
        if (!nextInterview?._id) return;
        if (!localStorage.getItem('token')) {
            toast.error('Please sign in again to respond to this reschedule.');
            return;
        }
        setActionLoading(true);
        try {
            await applicationService.acceptRecruiterReschedule(nextInterview._id);
            toast.success('Reschedule accepted. Your interview has been updated to the new date.');
            onRescheduleAction?.();
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Failed to accept reschedule'));
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeclineReschedule = async () => {
        if (!nextInterview?._id) return;
        if (!localStorage.getItem('token')) {
            toast.error('Please sign in again to respond to this reschedule.');
            return;
        }
        setActionLoading(true);
        try {
            await applicationService.rejectRecruiterReschedule(nextInterview._id);
            toast.success('Reschedule declined. Your original schedule remains active.');
            onRescheduleAction?.();
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Failed to decline reschedule'));
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Upcoming Interview</h3>
                </div>
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-10 h-10 text-[#29a08e] animate-spin" />
                    <p className="text-sm text-gray-500 font-medium">Loading interviews...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Upcoming Interview</h3>
                <Link
                    to="/seeker/interviews"
                    className="text-xs font-bold text-[#29a08e] hover:text-[#228377] hover:underline transition-colors"
                >
                    View all
                </Link>
            </div>

            {nextInterview ? (
                <div className="space-y-4">
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                        <div className="flex items-start justify-between gap-3 mb-4">
                            <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-bold text-gray-900 truncate">
                                    {nextInterview.job_id?.title || 'Job Position'}
                                </h4>
                                <p className="text-xs font-semibold text-gray-500 truncate">
                                    {nextInterview.job_id?.company_name || 'Company Name'}
                                </p>
                            </div>
                            <div className="w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center shrink-0 font-bold text-[#29a08e] text-sm shadow-sm">
                                {nextInterview.job_id?.company_name?.charAt(0) || 'C'}
                            </div>
                        </div>

                        {/* Status: recruiter-proposed reschedule vs computed lifecycle */}
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                            {isReschedulePending && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-wider border border-amber-200">
                                    <AlertCircle size={12} />
                                    Reschedule Pending
                                </span>
                            )}
                            {!isReschedulePending && nextInterview?.lifecycleStatus && (
                                <InterviewStatusBadge status={nextInterview.lifecycleStatus} />
                            )}
                            {isReschedulePending &&
                                nextInterview?.lifecycleStatus &&
                                nextInterview.lifecycleStatus !== 'RESCHEDULE_REQUESTED' && (
                                    <InterviewStatusBadge status={nextInterview.lifecycleStatus} />
                                )}
                        </div>

                        <div className="space-y-3">
                            {/* Original date/time */}
                            <div className="flex items-center gap-3 text-xs text-gray-600 font-medium">
                                <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                                <span>
                                    {formatDate(nextInterview.interview?.date)} at{' '}
                                    {formatTime(nextInterview.interview?.time)}
                                </span>
                            </div>

                            {/* Proposed date/time (only when reschedule_pending) */}
                            {isReschedulePending && interviewDoc?.proposedDate && (
                                <div className="flex items-start gap-3 text-xs bg-amber-50/80 rounded-xl p-3 border border-amber-100">
                                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-amber-800 mb-0.5">Proposed new time:</p>
                                        <p className="text-amber-700">
                                            {formatDate(interviewDoc.proposedDate)} at{' '}
                                            {formatTime(interviewDoc.proposedTime)}
                                        </p>
                                        {interviewDoc.rescheduleReason && (
                                            <p className="text-amber-700/90 mt-1 italic">
                                                Reason: {interviewDoc.rescheduleReason}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Mode & location / join link */}
                            <div className="flex items-center gap-3 text-xs text-[#29a08e] font-bold">
                                {nextInterview.interview?.mode === 'Online' ? (
                                    <Video className="w-4 h-4 shrink-0" />
                                ) : (
                                    <MapPin className="w-4 h-4 shrink-0" />
                                )}
                                {nextInterview.interview?.mode === 'Online' ? (
                                    joinCallPath ? (
                                        <Link
                                            to={joinCallPath}
                                            className="hover:text-[#228377] underline transition-colors inline-flex items-center gap-1"
                                        >
                                            Join Meeting <ExternalLink size={12} />
                                        </Link>
                                    ) : (
                                        <span className="text-gray-400">Join link will be available soon</span>
                                    )
                                ) : (
                                    <span className="text-gray-700">
                                        {nextInterview.interview?.location || 'Onsite Interview'}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 mt-5">
                            {isReschedulePending && isJobseeker ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={handleAcceptReschedule}
                                        disabled={actionLoading || !nextInterview?._id}
                                        className="flex-1 py-2.5 bg-[#29a08e] text-white text-[10px] font-bold uppercase tracking-wider rounded-xl hover:bg-[#228377] transition-all flex items-center justify-center gap-1.5 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {actionLoading ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            'Accept'
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDeclineReschedule}
                                        disabled={actionLoading || !nextInterview?._id}
                                        className="flex-1 py-2.5 bg-white border border-amber-200 text-amber-700 text-[10px] font-bold uppercase tracking-wider rounded-xl hover:bg-amber-50 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        Decline
                                    </button>
                                </>
                            ) : isReschedulePending && !isJobseeker ? (
                                <p className="text-[10px] text-amber-800 font-semibold w-full text-center py-2">
                                    Only the candidate can accept or decline this reschedule.
                                </p>
                            ) : null}
                            {!isReschedulePending ? (
                                <>
                                    {nextInterview.interview?.mode === 'Online' && joinCallPath && (
                                        <Link
                                            to={joinCallPath}
                                            className="flex-1 py-2.5 bg-[#29a08e] text-white text-[10px] font-bold uppercase tracking-wider rounded-xl hover:bg-[#228377] transition-all text-center flex items-center justify-center"
                                        >
                                            Join
                                        </Link>
                                    )}
                                    <Link
                                        to="/seeker/interviews?focused=true"
                                        className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-600 text-[10px] font-bold uppercase tracking-wider rounded-xl hover:bg-gray-50 transition-all text-center flex items-center justify-center"
                                    >
                                        Details
                                    </Link>
                                </>
                            ) : null}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="py-10 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-gray-600">No upcoming interviews</p>
                    <p className="text-xs text-gray-500 mt-1">When recruiters schedule an interview, it will appear here.</p>
                    <Link
                        to="/seeker/interviews"
                        className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-[#29a08e] hover:underline"
                    >
                        View all <ChevronRight size={14} />
                    </Link>
                </div>
            )}
        </div>
    );
};

export default UpcomingInterviewWidget;
