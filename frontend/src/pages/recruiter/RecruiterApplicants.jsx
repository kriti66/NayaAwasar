import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { Download, Search, Briefcase, ChevronDown, MapPin, AlertCircle, Users, FileText, Clock, PhoneIncoming, Star, Award, XCircle, Inbox, Eye, ChevronUp, Calendar, Percent } from 'lucide-react';
import applicationService from '../../services/applicationService';
import ScheduleInterviewModal from './ScheduleInterviewModal';
import RecruiterRescheduleModal from './RecruiterRescheduleModal';
import { API_BASE_URL } from '../../config/api';

function notifyRecruiterCalendarRefetch() {
    window.dispatchEvent(new Event('recruiter:calendarRefetch'));
}

function resolveUserPhotoUrl(path) {
    if (!path || typeof path !== 'string') return null;
    const p = path.trim();
    if (!p) return null;
    if (p.startsWith('http://') || p.startsWith('https://')) return p;
    return `${API_BASE_URL}${p.startsWith('/') ? '' : '/'}${p}`;
}

const RecruiterApplicants = () => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const applicationIdToScroll = searchParams.get('applicationId');
    const [jobs, setJobs] = useState([]);
    const [selectedJobId, setSelectedJobId] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedAppId, setExpandedAppId] = useState(null);

    // Modal State
    const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
    const [selectedApplicantId, setSelectedApplicantId] = useState(null);
    const [isScheduling, setIsScheduling] = useState(false);
    const [rescheduleModalData, setRescheduleModalData] = useState(null);
    const [isRecruiterRescheduleModalOpen, setIsRecruiterRescheduleModalOpen] = useState(false);
    const [recruiterRescheduleApplicationId, setRecruiterRescheduleApplicationId] = useState(null);
    const [recruiterRescheduleInitialData, setRecruiterRescheduleInitialData] = useState(null);
    const [isRecruiterRescheduleSubmitting, setIsRecruiterRescheduleSubmitting] = useState(false);

    const [stats, setStats] = useState({
        total: 0,
        applied: 0,
        inReview: 0,
        interview: 0,
        offered: 0,
        hired: 0,
        rejected: 0
    });

    const computePipelineStats = (apps) => {
        const safeApps = Array.isArray(apps) ? apps : [];
        const next = {
            total: safeApps.length,
            applied: 0,
            inReview: 0,
            interview: 0,
            offered: 0,
            hired: 0,
            rejected: 0
        };

        safeApps.forEach((app) => {
            const status = app?.status;
            if (!status) return;
            if (status === 'applied') next.applied++;
            else if (status === 'in-review' || status === 'in_review') next.inReview++;
            else if (status === 'interview') next.interview++;
            else if (status === 'offered') next.offered++;
            else if (status === 'hired') next.hired++;
            else if (status === 'rejected') next.rejected++;
        });

        return next;
    };

    const refreshApplicantsAndStats = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const params = { sort: sortBy };
            if (selectedJobId) params.jobId = selectedJobId;
            if (statusFilter && statusFilter !== 'all') params.status = statusFilter;

            const res = await api.get('/applications/recruiter', { params });
            const payload = res.data || {};
            const list = payload.applications || [];
            setApplicants(list);
            setStats(
                payload.stats && typeof payload.stats.total === 'number'
                    ? payload.stats
                    : computePipelineStats(list)
            );
            window.dispatchEvent(new Event('recruiter:applicationsUpdated'));
        } catch (error) {
            console.error('[RecruiterApplicants] Error fetching applicants:', error);
            toast.error(error.response?.data?.message || 'Failed to load applicants');
        } finally {
            setLoading(false);
        }
    }, [user?.id, selectedJobId, statusFilter, sortBy]);

    useEffect(() => {
        if (!user?.id) return;

        const fetchJobs = async () => {
            try {
                const res = await api.get('/recruiter/jobs');
                const all = res.data || [];
                setJobs(all);

                const queryParams = new URLSearchParams(location.search);
                const queryJobId = queryParams.get('jobId');

                if (queryJobId && all.some((job) => String(job._id || job.id) === queryJobId)) {
                    setSelectedJobId(queryJobId);
                } else {
                    setSelectedJobId('');
                }
            } catch (error) {
                console.error('[RecruiterApplicants] Error fetching jobs:', error);
                toast.error(error.response?.data?.message || 'Failed to load jobs');
            }
        };

        fetchJobs();
    }, [user?.id, location.search]);

    useEffect(() => {
        if (!user?.id) return;
        refreshApplicantsAndStats();
    }, [user?.id, refreshApplicantsAndStats]);

    useEffect(() => {
        if (!applicationIdToScroll || loading) return;
        const paramsSnapshot = searchParams.toString();
        setExpandedAppId(applicationIdToScroll);
        const t = window.setTimeout(() => {
            const el = document.getElementById(`recruiter-application-${applicationIdToScroll}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const next = new URLSearchParams(paramsSnapshot);
                next.delete('applicationId');
                const qs = next.toString();
                navigate(`/recruiter/applications${qs ? `?${qs}` : ''}`, { replace: true });
            }
        }, 350);
        return () => clearTimeout(t);
    }, [applicationIdToScroll, loading, applicants.length, searchParams, navigate]);

    const handleStatusChange = async (appId, newStatus) => {
        if (newStatus === 'interview') {
            setSelectedApplicantId(appId);
            setRescheduleModalData(null);
            setIsInterviewModalOpen(true);
            return;
        }

        if (newStatus === 'offered') {
            const notes = window.prompt("Enter offer details or notes (Optional):");
            if (notes === null) return;
            await updateApplicationStatus(appId, newStatus, { offerDetails: { notes } });
            return;
        }

        if (newStatus === 'rejected') {
            const reason = window.prompt("Enter rejection reason (Required):");
            if (reason === null) return;
            if (!reason.trim()) {
                toast.error("Rejection reason is required.");
                return;
            }
            await updateApplicationStatus(appId, newStatus, { rejectionReason: reason });
            return;
        }

        if (window.confirm(`Are you sure you want to change the status to ${newStatus.replace('-', ' ')}?`)) {
            await updateApplicationStatus(appId, newStatus);
        }
    };

    const handleApproveReschedule = (app) => {
        setSelectedApplicantId(app._id || app.id);
        const rescheduleData = app.reschedule || {};
        const preferredDate = rescheduleData.preferredDate ? new Date(rescheduleData.preferredDate) : null;

        setRescheduleModalData({
            date: preferredDate,
            time: rescheduleData.preferredTime,
            notes: `Candidate reschedule request: "${rescheduleData.reason}"`
        });
        setIsInterviewModalOpen(true);
    };

    const handleRejectReschedule = async (app) => {
        const reason = window.prompt("Enter a reason for rejecting the reschedule request (Optional):");
        if (reason === null) return; // User cancelled

        try {
            const appId = app._id || app.id;
            await api.put(`/applications/${appId}/reject-reschedule-request`, {
                reason: reason || 'Declined'
            });
            toast.success("Reschedule request rejected.");
            notifyRecruiterCalendarRefetch();
            await refreshApplicantsAndStats();
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

            toast.success('Status updated and calendar synced');
            notifyRecruiterCalendarRefetch();
            await refreshApplicantsAndStats();

        } catch (error) {
            console.error("Status update error", error);
            toast.error(error.response?.data?.message || "Failed to update status");
        }
    };

    const handleScheduleSubmit = async (interviewData) => {
        setIsScheduling(true);
        try {
            if (rescheduleModalData) {
                await api.put(`/applications/${selectedApplicantId}/approve-reschedule-request`, interviewData);
                toast.success("Reschedule request APPROVED and interview updated.");
                notifyRecruiterCalendarRefetch();
                await refreshApplicantsAndStats();
            } else {
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

    const handleRecruiterProposalClick = (app) => {
        const appId = app._id || app.id;
        const initialProposedDate = app.interview?.date
            ? new Date(app.interview.date).toISOString().split('T')[0]
            : '';

        setRecruiterRescheduleApplicationId(appId);
        setRecruiterRescheduleInitialData({
            proposedDate: initialProposedDate,
            proposedTime: app.interview?.time || '',
            reason: ''
        });
        setIsRecruiterRescheduleModalOpen(true);
    };

    const handleRecruiterProposalSubmit = async (proposalForm) => {
        setIsRecruiterRescheduleSubmitting(true);
        try {
            await applicationService.proposeRecruiterReschedule(recruiterRescheduleApplicationId, {
                proposedDate: proposalForm.proposedDate,
                proposedTime: proposalForm.proposedTime,
                reason: proposalForm.reason
            });

            toast.success('Reschedule request sent');
            notifyRecruiterCalendarRefetch();

            setIsRecruiterRescheduleModalOpen(false);
            setRecruiterRescheduleApplicationId(null);
            setRecruiterRescheduleInitialData(null);
            await refreshApplicantsAndStats();
        } catch (error) {
            console.error('[RecruiterApplicants] Recruiter proposal error:', error);
            toast.error(error?.message || 'Failed to send reschedule request');
        } finally {
            setIsRecruiterRescheduleSubmitting(false);
        }
    };

    const getStatusLabel = (status) => {
        const labels = {
            applied: 'Applied',
            'in-review': 'In Review',
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
            case 'applied': return 'bg-gray-100 text-gray-600 border-gray-200';
            case 'in_review':
            case 'in-review': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'interview': return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'offered': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'hired': return 'bg-[#29a08e]/10 text-[#29a08e] border-[#29a08e]/20';
            case 'rejected': return 'bg-rose-50 text-rose-600 border-rose-200';
            default: return 'bg-gray-100 text-gray-500 border-gray-200';
        }
    };

    const availableStatuses = [
        { value: 'applied', label: 'Applied' },
        { value: 'in-review', label: 'In Review' },
        { value: 'interview', label: 'Interview' },
        { value: 'offered', label: 'Offered' },
        { value: 'hired', label: 'Hired' },
        { value: 'rejected', label: 'Rejected' }
    ];

    const pipelineStatusFilterOptions = [
        { value: 'all', label: 'All Status' },
        ...availableStatuses
    ];

    const sortOptions = [
        { value: 'newest', label: 'Newest First' },
        { value: 'oldest', label: 'Oldest First' },
        { value: 'name_asc', label: 'Name A–Z' },
        { value: 'name_desc', label: 'Name Z–A' }
    ];

    const toggleExpand = (appId) => {
        setExpandedAppId(prev => (prev === appId ? null : appId));
    };

    return (
        <div className="min-h-[calc(100vh-4rem)]">
            {/* ─── Hero Header ─────────────────────────────── */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#0d2f2b] to-slate-900 pt-12 pb-28 px-4 sm:px-6 lg:px-8">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-[#29a08e] rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-400 rounded-full blur-3xl"></div>
                </div>
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

                <div className="relative max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="text-white animate-fade-in-up">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-sm font-medium text-gray-200 backdrop-blur-sm mb-4">
                                <Users size={14} />
                                Talent Pipeline
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
                                Applicants <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#29a08e] to-teal-300">Manager</span>
                            </h1>
                            <p className="text-gray-300 text-lg">Track and manage candidates for your active job postings in real-time.</p>
                        </div>

                        <div className="w-full md:flex-1 md:max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="relative">
                                <Briefcase size={16} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50 z-10 pointer-events-none" />
                                <select
                                    id="job-select"
                                    className="appearance-none block w-full pl-11 pr-10 py-3.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl shadow-sm text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#29a08e]/30 focus:border-[#29a08e] transition-all cursor-pointer"
                                    value={selectedJobId}
                                    onChange={(e) => setSelectedJobId(e.target.value)}
                                    aria-label="Filter by job"
                                >
                                    <option value="" className="text-gray-900">All Jobs</option>
                                    {jobs.map((job) => (
                                        <option key={job._id || job.id} value={job._id || job.id} className="text-gray-900">
                                            {job.title}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/50 pointer-events-none" />
                            </div>
                            <div className="relative">
                                <Clock size={16} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50 z-10 pointer-events-none" />
                                <select
                                    id="status-filter"
                                    className="appearance-none block w-full pl-11 pr-10 py-3.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl shadow-sm text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#29a08e]/30 focus:border-[#29a08e] transition-all cursor-pointer"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    aria-label="Filter by application status"
                                >
                                    {pipelineStatusFilterOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value} className="text-gray-900">
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/50 pointer-events-none" />
                            </div>
                            <div className="relative">
                                <FileText size={16} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50 z-10 pointer-events-none" />
                                <select
                                    id="sort-applicants"
                                    className="appearance-none block w-full pl-11 pr-10 py-3.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl shadow-sm text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#29a08e]/30 focus:border-[#29a08e] transition-all cursor-pointer"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    aria-label="Sort applicants"
                                >
                                    {sortOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value} className="text-gray-900">
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/50 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>


            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 pb-20 relative z-10">
                {/* Stats Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-10">
                    {[
                        { label: 'Total', count: stats.total, icon: Users, color: 'text-gray-600', bg: 'bg-gray-100', gradient: 'from-gray-50 to-slate-50' },
                        { label: 'Applied', count: stats.applied, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', gradient: 'from-blue-50 to-indigo-50' },
                        { label: 'In Review', count: stats.inReview, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', gradient: 'from-amber-50 to-yellow-50' },
                        { label: 'Interview', count: stats.interview, icon: PhoneIncoming, color: 'text-purple-600', bg: 'bg-purple-50', gradient: 'from-purple-50 to-violet-50' },
                        { label: 'Offered', count: stats.offered, icon: Star, color: 'text-emerald-600', bg: 'bg-emerald-50', gradient: 'from-emerald-50 to-green-50' },
                        { label: 'Hired', count: stats.hired, icon: Award, color: 'text-[#29a08e]', bg: 'bg-[#29a08e]/10', gradient: 'from-[#29a08e]/5 to-teal-50' },
                        { label: 'Rejected', count: stats.rejected, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50', gradient: 'from-rose-50 to-red-50' },
                    ].map((stat, i) => (
                        <div key={i} className={`bg-gradient-to-br ${stat.gradient} p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-[#29a08e]/20 transition-all duration-300 hover:-translate-y-0.5 flex flex-col items-center justify-center group`}>
                            <div className={`w-9 h-9 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform`}>
                                <stat.icon size={18} strokeWidth={2.5} />
                            </div>
                            {loading ? (
                                <div className="w-16 h-7 bg-gray-100 rounded-md animate-pulse mb-1" aria-hidden />
                            ) : (
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-1">{stat.count}</h3>
                            )}
                            <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</span>
                        </div>
                    ))}
                </div>

                {/* Applications List */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                        <div>
                            <p className="text-[#29a08e] font-bold text-[10px] uppercase tracking-[0.2em] mb-1">Candidates</p>
                            <h3 className="text-lg font-black text-gray-900 tracking-tight">Active Pipeline</h3>
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-20 flex flex-col items-center justify-center space-y-4">
                            <div className="w-10 h-10 border-4 border-gray-100 border-t-[#29a08e] rounded-full animate-spin"></div>
                            <p className="text-sm font-bold text-gray-400">Loading candidates...</p>
                        </div>
                    ) : applicants.length > 0 ? (
                        <div className="divide-y divide-gray-50">
                            {applicants.map((app) => {
                                const applicantName = app.personalInfo?.fullName || app.seeker_id?.fullName || 'Anonymous';
                                const applicantEmail = app.personalInfo?.email || app.seeker_id?.email;
                                const photoSrc = resolveUserPhotoUrl(app.seeker_id?.profileImage);
                                const interviewDoc = app.interview?.interviewId;
                                const recruiterProposalPending =
                                    ['PENDING', 'PROPOSED'].includes(
                                        String(interviewDoc?.rescheduleStatus || '').toUpperCase()
                                    ) && interviewDoc?.rescheduleRequestedBy === 'recruiter';
                                const jobseekerReschedulePending = app.reschedule?.requested && !app.reschedule?.reviewed;

                                return (
                                    <div
                                        id={(app._id || app.id) ? `recruiter-application-${app._id || app.id}` : undefined}
                                        key={app._id || app.id}
                                        className={`p-6 hover:bg-gray-50/50 transition-colors flex flex-col gap-5 ${
                                            String(app._id || app.id) === String(applicationIdToScroll || '')
                                                ? 'ring-2 ring-[#29a08e]/35 rounded-xl'
                                                : ''
                                        }`}
                                    >
                                        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-5">
                                            {/* Avatar & Name */}
                                            <div className="flex items-start gap-4 min-w-[250px]">
                                                {photoSrc ? (
                                                    <img
                                                        src={photoSrc}
                                                        alt=""
                                                        className="w-12 h-12 rounded-xl object-cover border border-[#29a08e]/15 shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 bg-gradient-to-br from-[#29a08e]/10 to-teal-50 rounded-xl flex items-center justify-center text-[#29a08e] font-black text-lg border border-[#29a08e]/10 shrink-0">
                                                        {applicantName.charAt(0)}
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <h4 className="text-base font-bold text-gray-900">{applicantName}</h4>
                                                    <p className="text-xs font-medium text-gray-500 truncate">{applicantEmail}</p>
                                                    {!selectedJobId && (
                                                        <p className="mt-1.5 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#29a08e] bg-[#29a08e]/10 border border-[#29a08e]/20 px-2.5 py-1 rounded-lg max-w-full">
                                                            <Briefcase size={12} className="shrink-0" />
                                                            <span className="truncate">
                                                                Applied for: {app.job_id?.title || 'Job'}
                                                            </span>
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-1.5 mt-1.5 text-xs font-medium text-gray-400">
                                                        <MapPin size={12} className="shrink-0" />
                                                        <span className="truncate">{app.personalInfo?.address || 'Not Provided'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            <div className="flex-1">
                                                <div className={`inline-flex px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(app.status)}`}>
                                                    {getStatusLabel(app.status)}
                                                </div>
                                            </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-3">
                                                    {/* Expand Application Detail */}
                                                    <button
                                                        onClick={() => toggleExpand(app._id || app.id)}
                                                        className={`p-2.5 rounded-xl transition-colors border ${expandedAppId === (app._id || app.id) ? 'bg-[#29a08e]/10 border-[#29a08e]/20 text-[#29a08e]' : 'border-gray-200 text-gray-400 hover:text-[#29a08e] hover:bg-[#29a08e]/5 hover:border-[#29a08e]/20'}`}
                                                        title={expandedAppId === (app._id || app.id) ? "Hide Details" : "View Details"}
                                                    >
                                                        {expandedAppId === (app._id || app.id) ? <ChevronUp size={18} /> : <Eye size={18} />}
                                                    </button>

                                                    {/* Start Interview Button */}
                                                    {app.status === 'interview' && app.interview?.mode === 'Online' && (
                                                        app.interview?.roomId ? (
                                                            <Link
                                                                to={`/interview/call/${app.interview.roomId}`}
                                                                className="px-4 py-2.5 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-purple-700 transition-colors shadow-lg shadow-purple-600/20 flex items-center gap-1.5"
                                                            >
                                                                Start Interview
                                                            </Link>
                                                        ) : (
                                                            <span className="text-[10px] font-bold text-gray-400">Processing...</span>
                                                        )
                                                    )}

                                                    {/* Recruiter Reschedule Proposal */}
                                                    {app.status === 'interview' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRecruiterProposalClick(app)}
                                                            disabled={recruiterProposalPending || jobseekerReschedulePending}
                                                            title={recruiterProposalPending ? 'A reschedule proposal is already pending' : jobseekerReschedulePending ? 'Candidate reschedule request is already pending' : 'Propose a new interview date/time'}
                                                            className={`px-4 py-2.5 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20 flex items-center gap-1.5 ${recruiterProposalPending || jobseekerReschedulePending ? 'opacity-50 cursor-not-allowed hover:bg-amber-500' : ''}`}
                                                        >
                                                            Reschedule
                                                        </button>
                                                    )}
                                                    {/* Status Selector */}
                                                <div className="relative">
                                                    <select
                                                        value={app.status === 'withdrawn' ? '' : app.status}
                                                        onChange={(e) => handleStatusChange(app._id || app.id, e.target.value)}
                                                        disabled={app.status === 'withdrawn'}
                                                        className={`appearance-none pl-4 pr-10 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all border ${app.status === 'withdrawn'
                                                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                            : 'bg-white border-gray-200 text-gray-700 hover:border-[#29a08e]/30 focus:ring-[#29a08e]/20'
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

                                        {recruiterProposalPending && (
                                            <div className="w-full rounded-2xl border border-teal-100 bg-teal-50/80 px-4 py-3 text-xs text-teal-900 font-semibold">
                                                A new interview time is proposed. The candidate must accept or decline before it
                                                applies. You cannot accept this on behalf of the candidate.
                                            </div>
                                        )}

                                        {/* Reschedule Request Banner */}
                                        {app.reschedule?.requested && (
                                            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full animate-in fade-in slide-in-from-top-2">
                                                <div className="flex gap-4">
                                                    <div className="p-3 bg-amber-100 rounded-xl text-amber-600 shrink-0">
                                                        <AlertCircle size={22} />
                                                    </div>
                                                    <div>
                                                        <h5 className="text-sm font-black text-amber-900 tracking-tight">Reschedule Requested</h5>
                                                        <div className="mt-1.5 space-y-1.5">
                                                            <p className="text-xs text-amber-800/80 leading-relaxed max-w-md">
                                                                Reason: <span className="font-bold italic text-amber-900">"{app.reschedule.reason}"</span>
                                                            </p>
                                                            <div className="flex items-center gap-2 text-[10px] font-black text-amber-900 bg-amber-100/50 px-3 py-1.5 rounded-lg w-fit uppercase tracking-wider">
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
                                                        className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-amber-200 text-amber-700 text-xs font-bold rounded-xl hover:bg-amber-50 hover:border-amber-300 transition-all shadow-sm"
                                                    >
                                                        Reject
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

                                        {/* Expanded Details Section */}
                                        {expandedAppId === (app._id || app.id) && (
                                            <div className="mt-4 pt-6 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                                                    {/* Left Column: Details & Resume */}
                                                    <div className="space-y-5">
                                                        {/* Candidacy Overview */}
                                                        <div className="bg-gradient-to-br from-gray-50/50 to-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group hover:border-[#29a08e]/10 transition-colors">
                                                            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-50">
                                                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#29a08e]/10 to-teal-50 text-[#29a08e] flex items-center justify-center shrink-0">
                                                                    <Briefcase size={16} strokeWidth={2.5}/>
                                                                </div>
                                                                <div>
                                                                    <h5 className="text-sm font-black text-gray-900 tracking-tight">Application Details</h5>
                                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Overview</p>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-4">
                                                                <div className="flex justify-between items-center text-sm">
                                                                    <span className="text-gray-500 font-medium flex items-center gap-2"><Calendar size={14} className="text-gray-400"/> Applied On</span>
                                                                    <span className="text-gray-900 font-bold">{new Date(app.createdAt || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                                                </div>
                                                                {app.matchScore && (
                                                                <div className="flex justify-between items-center text-sm">
                                                                    <span className="text-gray-500 font-medium flex items-center gap-2"><Percent size={14} className="text-gray-400"/> Match Score</span>
                                                                    <span className="text-[#29a08e] font-black">{app.matchScore}%</span>
                                                                </div>
                                                                )}
                                                                <div className="flex justify-between items-center text-sm">
                                                                    <span className="text-gray-500 font-medium flex items-center gap-2"><Briefcase size={14} className="text-gray-400"/> Experience</span>
                                                                    <span className="text-gray-900 font-bold max-w-[120px] text-right truncate">{app.applicantExperienceLevel || 'Not specified'}</span>
                                                                </div>
                                                                <div className="flex flex-col gap-2 pt-3 border-t border-gray-50 mt-2">
                                                                    <span className="text-gray-500 font-medium flex items-center gap-2 text-sm">
                                                                        <PhoneIncoming size={14} className="text-gray-400" /> Contact
                                                                    </span>
                                                                    <div className="bg-white rounded-xl p-3 w-full border border-gray-100">
                                                                        <div className="flex items-center justify-between gap-3 text-sm">
                                                                            <span className="text-gray-500 font-medium">Email</span>
                                                                            <span
                                                                                className="text-xs text-gray-700 font-medium truncate max-w-[200px]"
                                                                                title={app.personalInfo?.email}
                                                                            >
                                                                                {app.personalInfo?.email || 'No email provided'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Resume Card */}
                                                        <div className="bg-gradient-to-br from-[#29a08e]/5 to-teal-50/50 rounded-2xl p-6 border border-[#29a08e]/10 shadow-sm relative overflow-hidden group">
                                                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 group-hover:rotate-6 duration-500">
                                                                <FileText size={80} className="text-[#29a08e]" strokeWidth={1} />
                                                            </div>
                                                            <div className="relative z-10 flex items-center gap-3 mb-4">
                                                                <div className="w-10 h-10 rounded-xl bg-white text-[#29a08e] flex items-center justify-center shadow-sm border border-emerald-50">
                                                                    <FileText size={18} strokeWidth={2.5}/>
                                                                </div>
                                                                <div>
                                                                    <h5 className="text-sm font-black text-gray-900 tracking-tight">Resume / CV</h5>
                                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Attachment</p>
                                                                </div>
                                                            </div>
                                                            <div className="relative z-10 mt-4">
                                                                <div className="flex items-center gap-2 text-[10px] font-bold text-[#29a08e] bg-white/60 w-fit px-3 py-1.5 rounded-lg mb-4 border border-[#29a08e]/10">
                                                                    <span className="w-2 h-2 rounded-full bg-[#29a08e] animate-pulse"></span>
                                                                    {app.resumeType === 'Generated' ? 'Platform Template' : 'Uploaded PDF'}
                                                                </div>
                                                                {app.resumeUrl ? (
                                                                    <a
                                                                        href={`${API_BASE_URL}${app.resumeUrl}`}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-white border-2 border-[#29a08e] text-[#29a08e] font-bold text-sm rounded-xl hover:bg-[#29a08e] hover:text-white hover:shadow-lg hover:shadow-[#29a08e]/20 transition-all active:scale-95 group/btn"
                                                                    >
                                                                        <Eye size={18} className="text-[#29a08e] group-hover/btn:text-white transition-colors" />
                                                                        View PDF Resume
                                                                    </a>
                                                                ) : (
                                                                    <span className="flex items-center justify-center w-full px-4 py-3 text-xs text-gray-500 bg-white/50 font-bold rounded-xl border border-gray-100">
                                                                        No Document Available
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Right Column: Cover Letter */}
                                                    <div className="lg:col-span-2">
                                                        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm h-full flex flex-col group hover:border-[#29a08e]/20 transition-colors relative overflow-hidden">
                                                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-50 relative z-10">
                                                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                                                    <FileText size={18} strokeWidth={2.5} />
                                                                </div>
                                                                <div>
                                                                    <h5 className="text-base font-black text-gray-900 tracking-tight">Cover Letter</h5>
                                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Letter of Interest</p>
                                                                </div>
                                                            </div>

                                                            {app.coverLetter ? (
                                                                <div className="relative flex-1">
                                                                    <div className="absolute -left-6 -top-6 text-gray-50/50 transform -rotate-12 pointer-events-none">
                                                                        <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                                                            <path d="M14.017 21L16.439 12.019H12.019V3H21V12.019L18.471 21H14.017ZM4.017 21L6.439 12.019H2.019V3H11V12.019L8.471 21H4.017Z" />
                                                                        </svg>
                                                                    </div>
                                                                    <div className="relative z-10 text-sm text-gray-600 leading-[1.8] font-medium whitespace-pre-wrap pl-6 sm:pl-8 border-l-2 border-[#29a08e]/20 py-2 min-h-[200px] bg-gradient-to-r from-gray-50/50 to-transparent rounded-r-xl">
                                                                        <div className="absolute -left-2.5 top-0 w-5 h-5 bg-white border border-[#29a08e]/20 rounded-full flex items-center justify-center">
                                                                            <div className="w-1.5 h-1.5 bg-[#29a08e] rounded-full"></div>
                                                                        </div>
                                                                        {app.coverLetter}
                                                                        <div className="absolute -left-2.5 bottom-0 w-5 h-5 bg-white border border-[#29a08e]/20 rounded-full flex items-center justify-center">
                                                                            <div className="w-1.5 h-1.5 bg-[#29a08e] rounded-full"></div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center opacity-70">
                                                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 border border-gray-100">
                                                                        <FileText size={28} className="text-gray-300" strokeWidth={1.5} />
                                                                    </div>
                                                                    <p className="text-sm font-black text-gray-900 tracking-tight mb-1">No Cover Letter Attached</p>
                                                                    <p className="text-xs font-medium text-gray-500 max-w-sm">The applicant opted out of providing a cover letter.</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-24 px-6 text-center flex flex-col items-center justify-center bg-gradient-to-br from-gray-50/30 to-[#29a08e]/5 rounded-b-2xl">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-[#29a08e]/20 rounded-full blur-xl opacity-60"></div>
                                <div className="w-24 h-24 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl flex items-center justify-center mx-auto border-4 border-white shadow-sm relative z-10">
                                    <Inbox size={40} className="text-[#29a08e]" strokeWidth={2} />
                                </div>
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2">No candidates found</h3>
                            <p className="text-gray-500 text-sm max-w-sm mx-auto font-medium leading-relaxed">
                                {selectedJobId
                                    ? 'When candidates apply to this job posting, their profiles, resumes, and statuses will appear here.'
                                    : 'When candidates apply to your active listings, they will appear here. Adjust filters to narrow the list.'}
                            </p>
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
            <RecruiterRescheduleModal
                isOpen={isRecruiterRescheduleModalOpen}
                onClose={() => {
                    setIsRecruiterRescheduleModalOpen(false);
                    setRecruiterRescheduleApplicationId(null);
                    setRecruiterRescheduleInitialData(null);
                }}
                onSubmit={handleRecruiterProposalSubmit}
                isSubmitting={isRecruiterRescheduleSubmitting}
                initialData={recruiterRescheduleInitialData}
            />
        </div>
    );
};

export default RecruiterApplicants;
