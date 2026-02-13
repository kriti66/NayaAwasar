import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { Download, Search, Briefcase, ChevronDown, MapPin, AlertCircle } from 'lucide-react';
import ScheduleInterviewModal from './ScheduleInterviewModal';

const RecruiterApplicants = () => {
    const { user } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [selectedJobId, setSelectedJobId] = useState('');
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
    const [selectedApplicantId, setSelectedApplicantId] = useState(null);
    const [isScheduling, setIsScheduling] = useState(false);
    const [rescheduleModalData, setRescheduleModalData] = useState(null);

    const [stats, setStats] = useState({
        total: 0,
        applied: 0,
        inReview: 0,
        interview: 0,
        offered: 0,
        hired: 0,
        rejected: 0
    });

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                console.log('[RecruiterApplicants] Fetching recruiter jobs...');
                const res = await api.get('/recruiter/jobs');
                console.log('[RecruiterApplicants] Fetched jobs:', res.data);
                setJobs(res.data);
                if (res.data.length > 0) {
                    const firstJobId = res.data[0]._id || res.data[0].id;
                    console.log('[RecruiterApplicants] Setting selected job:', firstJobId);
                    setSelectedJobId(firstJobId);
                } else {
                    console.log('[RecruiterApplicants] No jobs found');
                    setLoading(false);
                }
            } catch (error) {
                console.error("[RecruiterApplicants] Error fetching jobs:", error);
                console.error("[RecruiterApplicants] Error response:", error.response?.data);
                setLoading(false);
            }
        };
        fetchJobs();
    }, []);

    useEffect(() => {
        if (!selectedJobId) return;

        const fetchApplicants = async () => {
            setLoading(true);
            try {
                console.log(`[RecruiterApplicants] Fetching applications for job: ${selectedJobId}`);
                const res = await api.get(`/applications/job/${selectedJobId}`);
                console.log(`[RecruiterApplicants] Received ${res.data.length} applications:`, res.data);
                setApplicants(res.data);

                // Calc stats
                const newStats = { total: res.data.length, applied: 0, inReview: 0, interview: 0, offered: 0, hired: 0, rejected: 0 };
                res.data.forEach(app => {
                    const statusKey = app.status === 'in_review' ? 'inReview' : app.status;
                    if (newStats[statusKey] !== undefined) newStats[statusKey]++;
                });
                console.log(`[RecruiterApplicants] Stats:`, newStats);
                setStats(newStats);
            } catch (error) {
                console.error("[RecruiterApplicants] Error fetching applicants:", error);
                console.error("[RecruiterApplicants] Error response:", error.response?.data);
                toast.error(error.response?.data?.message || "Failed to load applicants");
            } finally {
                setLoading(false);
            }
        };
        fetchApplicants();
    }, [selectedJobId]);

    const handleStatusChange = async (appId, newStatus) => {
        // If status is interview, we need to collect details first
        if (newStatus === 'interview') {
            setSelectedApplicantId(appId);
            setRescheduleModalData(null); // Explicitly clear any reschedule data for normal flow
            setIsInterviewModalOpen(true);
            return;
        }

        // For other statuses, update immediately
        if (window.confirm(`Are you sure you want to change the status to ${newStatus.replace('_', ' ')}?`)) {
            await updateApplicationStatus(appId, newStatus);
        }
    };

    const handleApproveReschedule = (app) => {
        setSelectedApplicantId(app._id || app.id);
        const rescheduleData = app.reschedule || {}; // Fallback if undefined, though banner check protects this
        const preferredDate = rescheduleData.preferredDate ? new Date(rescheduleData.preferredDate) : null;

        setRescheduleModalData({
            date: preferredDate,
            time: rescheduleData.preferredTime,
            notes: `Candidate reschedule request: "${rescheduleData.reason}"`
        });
        setIsInterviewModalOpen(true);
    };

    const handleRejectReschedule = async (app) => {
        if (!window.confirm("Are you sure you want to REJECT this reschedule request? The original interview time will stand.")) return;

        try {
            const appId = app._id || app.id;
            await api.put(`/applications/${appId}/reject-reschedule-request`, {
                feedback: 'Time not suitable, sticking to original schedule.'
            });
            toast.success("Reschedule request rejected.");

            // Refresh
            const res = await api.get(`/applications/job/${selectedJobId}`);
            setApplicants(res.data);
        } catch (error) {
            console.error("Reject reschedule error:", error);
            toast.error("Failed to reject reschedule request");
        }
    };

    const updateApplicationStatus = async (appId, status, payload = {}) => {
        try {
            console.log(`[RecruiterApplicants] Updating status for ${appId} to ${status}`);

            await api.patch(`/applications/${appId}/status`, {
                status,
                ...payload
            });

            toast.success(`Application status updated to ${status.replace('_', ' ')}`);

            // Update local state
            setApplicants(prev => prev.map(app => {
                if ((app._id || app.id) !== appId) return app;
                let updatedApp = { ...app, status };
                if (status === 'interview' && payload.interviewDetails) {
                    updatedApp.interview = payload.interviewDetails;
                }
                return updatedApp;
            }));

            // Recalculate stats
            const res = await api.get(`/applications/job/${selectedJobId}`);
            setApplicants(res.data);

            const newStats = { total: res.data.length, applied: 0, inReview: 0, interview: 0, offered: 0, hired: 0, rejected: 0 };
            res.data.forEach(a => {
                const statusKey = a.status === 'in_review' ? 'inReview' : a.status;
                if (newStats[statusKey] !== undefined) newStats[statusKey]++;
            });
            setStats(newStats);

        } catch (error) {
            console.error("Status update error", error);
            toast.error(error.response?.data?.message || "Failed to update status");
        }
    };

    const handleScheduleSubmit = async (interviewData) => {
        setIsScheduling(true);
        try {
            if (rescheduleModalData) {
                // We are approving a reschedule request
                await api.put(`/applications/${selectedApplicantId}/approve-reschedule-request`, interviewData);
                toast.success("Reschedule request APPROVED and interview updated.");

                // Refresh list
                const res = await api.get(`/applications/job/${selectedJobId}`);
                setApplicants(res.data);
            } else {
                // Normal scheduling
                await updateApplicationStatus(selectedApplicantId, 'interview', { interviewDetails: interviewData });
            }
            setIsInterviewModalOpen(false);
            setRescheduleModalData(null);
        } catch (error) {
            console.error('[RecruiterApplicants] Error scheduling interview:', error);
            toast.error("Failed to schedule interview");
        } finally {
            setIsScheduling(false);
        }
    };

    const getStatusLabel = (status) => {
        const labels = {
            applied: 'Applied',
            in_review: 'In Review',
            interview: 'Interview',
            offered: 'Offered',
            hired: 'Hired',
            rejected: 'Rejected',
            withdrawn: 'Withdrawn'
        };
        return labels[status] || status;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'applied': return 'bg-gray-100 text-gray-500 border-gray-200';
            case 'in_review': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'interview': return 'bg-purple-50 text-purple-600 border-purple-100';
            case 'offered': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'hired': return 'bg-[#2D9B82]/10 text-[#2D9B82] border-[#2D9B82]/20';
            case 'rejected': return 'bg-rose-50 text-rose-600 border-rose-100';
            default: return 'bg-gray-100 text-gray-500';
        }
    };

    const availableStatuses = [
        { value: 'applied', label: 'Applied' },
        { value: 'in_review', label: 'In Review' },
        { value: 'interview', label: 'Interview' },
        { value: 'offered', label: 'Offered' },
        { value: 'hired', label: 'Hired' },
        { value: 'rejected', label: 'Rejected' }
    ];

    return (
        <div className="bg-gray-50/50 min-h-screen pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Applicants Manager</h1>
                        <p className="text-sm font-medium text-gray-500">Track and manage candidates for your active job postings.</p>
                    </div>

                    <div className="w-full md:w-72 relative">
                        <Briefcase size={16} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
                        <select
                            id="job-select"
                            className="appearance-none block w-full pl-11 pr-10 py-3 bg-white border border-gray-200 rounded-xl shadow-sm text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2D9B82]/20 focus:border-[#2D9B82] transition-shadow cursor-pointer"
                            value={selectedJobId}
                            onChange={(e) => setSelectedJobId(e.target.value)}
                        >
                            {jobs.map(job => (
                                <option key={job._id || job.id} value={job._id || job.id}>{job.title}</option>
                            ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-2 lg:grid-cols-7 gap-4 mb-8">
                    {[
                        { label: 'Total', count: stats.total },
                        { label: 'Applied', count: stats.applied },
                        { label: 'In Review', count: stats.inReview },
                        { label: 'Interview', count: stats.interview },
                        { label: 'Offered', count: stats.offered },
                        { label: 'Hired', count: stats.hired },
                        { label: 'Lost', count: stats.rejected },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
                            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</span>
                            <h3 className="text-xl font-bold text-gray-900">{stat.count}</h3>
                        </div>
                    ))}
                </div>

                {/* Applications List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900">Active Pipeline</h3>
                    </div>

                    {loading ? (
                        <div className="p-20 flex flex-col items-center justify-center space-y-4">
                            <div className="w-10 h-10 border-4 border-gray-100 border-t-[#2D9B82] rounded-full animate-spin"></div>
                            <p className="text-sm font-bold text-gray-400">Loading candidates...</p>
                        </div>
                    ) : applicants.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {applicants.map((app) => {
                                const applicantName = app.personalInfo?.fullName || app.seeker_id?.fullName || 'Anonymous';
                                const applicantEmail = app.personalInfo?.email || app.seeker_id?.email;

                                return (
                                    <div key={app._id || app.id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col gap-6">
                                        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                                            {/* Avatar & Name */}
                                            <div className="flex items-start gap-4 min-w-[250px]">
                                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-black text-lg shadow-inner">
                                                    {applicantName.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="text-base font-bold text-gray-900">{applicantName}</h4>
                                                    <p className="text-xs font-medium text-gray-500">{applicantEmail}</p>
                                                    <div className="flex items-center gap-1.5 mt-1.5 text-xs font-medium text-gray-400">
                                                        <MapPin size={12} />
                                                        {app.personalInfo?.address || 'Not Provided'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            <div className="flex-1">
                                                <div className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(app.status)}`}>
                                                    {getStatusLabel(app.status)}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-4">
                                                {/* Start Interview Button */}
                                                {app.status === 'interview' && app.interview?.mode === 'Online' && (
                                                    app.interview?.interviewId ? (
                                                        <Link
                                                            to={`/interview/call/${app.interview.interviewId}`}
                                                            className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-purple-700 transition-colors shadow-sm flex items-center gap-1.5"
                                                        >
                                                            Start Interview
                                                        </Link>
                                                    ) : (
                                                        <a
                                                            href={app.interview?.meetLink}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-gray-200 transition-colors shadow-sm flex items-center gap-1.5"
                                                        >
                                                            Link Only
                                                        </a>
                                                    )
                                                )}
                                                {/* Resume Download */}
                                                {app.resumeUrl && (
                                                    <a
                                                        href={`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}${app.resumeUrl}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-2 text-gray-400 hover:text-[#2D9B82] hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100"
                                                        title="View Resume"
                                                    >
                                                        <Download size={18} />
                                                    </a>
                                                )}

                                                {/* Status Selector */}
                                                <div className="relative">
                                                    <select
                                                        value={app.status === 'withdrawn' ? '' : app.status}
                                                        onChange={(e) => handleStatusChange(app._id || app.id, e.target.value)}
                                                        disabled={app.status === 'withdrawn'}
                                                        className={`appearance-none pl-4 pr-10 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all border ${app.status === 'withdrawn'
                                                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 focus:ring-gray-200'
                                                            }`}
                                                    >
                                                        {app.status === 'withdrawn' && <option value="">Withdrawn</option>}
                                                        {availableStatuses.map(status => (
                                                            <option key={status.value} value={status.value}>
                                                                {status.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Reschedule Request Banner */}
                                        {app.reschedule?.requested && (
                                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full animate-in fade-in slide-in-from-top-2">
                                                <div className="flex gap-4">
                                                    <div className="p-2.5 bg-amber-100 rounded-xl text-amber-600 shrink-0">
                                                        <AlertCircle size={24} />
                                                    </div>
                                                    <div>
                                                        <h5 className="text-sm font-black text-amber-900 tracking-tight">Reschedule Requested</h5>
                                                        <div className="mt-1.5 space-y-1">
                                                            <p className="text-xs text-amber-800/80 leading-relaxed max-w-md">
                                                                Candidate Reason: <span className="font-medium italic text-amber-900">"{app.reschedule.reason}"</span>
                                                            </p>
                                                            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 bg-amber-100/50 px-2.5 py-1 rounded-md w-fit">
                                                                <span>Preferred:</span>
                                                                <span>{app.reschedule.preferredDate ? new Date(app.reschedule.preferredDate).toLocaleDateString() : 'No date'}</span>
                                                                <span className="opacity-50">•</span>
                                                                <span>{app.reschedule.preferredTime || 'No time'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 w-full sm:w-auto pl-12 sm:pl-0">
                                                    <button
                                                        onClick={() => handleRejectReschedule(app)}
                                                        className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-amber-200 text-amber-700 text-xs font-bold rounded-xl hover:bg-amber-50 hover:border-amber-300 hover:text-amber-800 transition-all shadow-sm"
                                                    >
                                                        Reject Request
                                                    </button>
                                                    <button
                                                        onClick={() => handleApproveReschedule(app)}
                                                        className="flex-1 sm:flex-none px-4 py-2.5 bg-amber-500 text-white text-xs font-bold rounded-xl hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all"
                                                    >
                                                        Review & Reschedule
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-20 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                <Search size={24} />
                            </div>
                            <h3 className="text-gray-900 font-bold">No active applications</h3>
                            <p className="text-gray-500 text-xs mt-1">Candidates will appear here once they apply.</p>
                        </div>
                    )}
                </div>
            </div>

            <ScheduleInterviewModal
                isOpen={isInterviewModalOpen}
                onClose={() => { setIsInterviewModalOpen(false); setRescheduleModalData(null); }}
                onSubmit={handleScheduleSubmit}
                isSubmitting={isScheduling}
                initialData={rescheduleModalData}
            />
        </div>
    );
};

export default RecruiterApplicants;
