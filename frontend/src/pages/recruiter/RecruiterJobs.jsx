import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import RecruiterLayout from '../../components/layouts/RecruiterLayout';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
    MapPin,
    Clock,
    Users,
    Eye,
    Edit,
    Trash,
    PieChart,
    ChevronDown,
    Briefcase,
    Plus,
    Megaphone,
    X,
    ShieldAlert
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { RECRUITER_WARNINGS_CHANGED_EVENT } from '../../components/recruiter/RecruiterModerationWarningsBanner';

function effectiveModerationStatus(job) {
    const m = job?.moderationStatus;
    if (!m || m === '' || m === 'Approved') return 'active';
    if (m === 'Flagged') return 'warned';
    if (m === 'Hidden') return 'hidden';
    if (m === 'Under Review') return 'pending_review';
    return m;
}

function moderationBadgeClass(eff) {
    switch (eff) {
        case 'active':
            return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'warned':
            return 'bg-amber-50 text-amber-800 border-amber-200';
        case 'hidden':
            return 'bg-rose-50 text-rose-700 border-rose-200';
        case 'pending_review':
            return 'bg-yellow-50 text-yellow-800 border-yellow-200';
        case 'deleted':
            return 'bg-slate-100 text-slate-600 border-slate-200';
        default:
            return 'bg-gray-50 text-gray-600 border-gray-200';
    }
}

function moderationBadgeLabel(eff) {
    switch (eff) {
        case 'active':
            return 'Live';
        case 'warned':
            return '⚠ Warning';
        case 'hidden':
            return 'Hidden — not visible to public';
        case 'pending_review':
            return 'Under review';
        case 'deleted':
            return 'Deleted';
        default:
            return eff || '—';
    }
}

/** Main list excludes admin-moderated jobs; badge covers pending review + listing status. */
function primaryJobStatusBadge(job) {
    const mod = effectiveModerationStatus(job);
    if (mod === 'pending_review') {
        return { label: moderationBadgeLabel('pending_review'), className: moderationBadgeClass('pending_review') };
    }
    const st = String(job.status || 'Active').trim();
    const isActive = st === 'Active';
    return {
        label: isActive ? 'ACTIVE' : st.toUpperCase(),
        className: isActive
            ? 'bg-[#29a08e]/10 text-[#29a08e] border-[#29a08e]/20'
            : 'bg-gray-100 text-gray-500 border-gray-200'
    };
}

const ADMIN_ALERTS_STORAGE_PREFIX = 'nayaawasar:recruiter:admin-job-alerts-dismissed:';

function loadDismissedAdminAlertIds(userId) {
    try {
        const raw = localStorage.getItem(`${ADMIN_ALERTS_STORAGE_PREFIX}${userId}`);
        const arr = JSON.parse(raw || '[]');
        return new Set(Array.isArray(arr) ? arr.map(String) : []);
    } catch {
        return new Set();
    }
}

function saveDismissedAdminAlertIds(userId, setIds) {
    localStorage.setItem(`${ADMIN_ALERTS_STORAGE_PREFIX}${userId}`, JSON.stringify([...setIds]));
}

function adminActionCardStyles(actionType) {
    switch (actionType) {
        case 'deleted':
            return {
                wrap: 'border-red-200 bg-gradient-to-br from-red-50/90 to-white',
                accent: 'border-l-[#29a08e] border-l-4',
                pill: 'bg-red-100 text-red-800 border-red-200'
            };
        case 'warned':
            return {
                wrap: 'border-orange-200 bg-gradient-to-br from-orange-50/90 to-white',
                accent: 'border-l-[#29a08e] border-l-4',
                pill: 'bg-orange-100 text-orange-900 border-orange-200'
            };
        case 'hidden':
            return {
                wrap: 'border-amber-200 bg-gradient-to-br from-amber-50/90 to-white',
                accent: 'border-l-[#29a08e] border-l-4',
                pill: 'bg-amber-100 text-amber-900 border-amber-200'
            };
        default:
            return {
                wrap: 'border-gray-200 bg-white',
                accent: 'border-l-[#29a08e] border-l-4',
                pill: 'bg-gray-100 text-gray-700 border-gray-200'
            };
    }
}

function adminActionLabel(actionType) {
    if (actionType === 'deleted') return 'Deleted';
    if (actionType === 'warned') return 'Warned';
    if (actionType === 'hidden') return 'Hidden';
    return actionType || 'Notice';
}

const RecruiterJobs = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [adminActions, setAdminActions] = useState([]);
    const [dismissedAdminAlertIds, setDismissedAdminAlertIds] = useState(() => new Set());
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('All Status');
    const [filterType, setFilterType] = useState('All Types');
    const [sortBy, setSortBy] = useState('Most Recent');

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filterStatus !== 'All Status') params.status = filterStatus;
            if (filterType !== 'All Types') params.type = filterType;
            if (sortBy === 'Most Recent') params.sort = 'recent';
            if (sortBy === 'Oldest') params.sort = 'oldest';

            const res = await api.get('/jobs/recruiter/my-jobs', { params });
            setJobs(res.data.activeJobs || []);
            setAdminActions(res.data.adminActions || []);
        } catch (error) {
            console.error("Error fetching jobs:", error);
            toast.error(error.response?.data?.message || "Failed to load jobs");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.id) {
            setDismissedAdminAlertIds(loadDismissedAdminAlertIds(user.id));
        }
    }, [user?.id]);

    useEffect(() => {
        if (user) {
            fetchJobs();
        }
    }, [user, filterStatus, filterType, sortBy]);

    const dismissAdminAlert = (jobId) => {
        if (!user?.id) return;
        const id = String(jobId);
        const next = new Set(dismissedAdminAlertIds);
        next.add(id);
        setDismissedAdminAlertIds(next);
        saveDismissedAdminAlertIds(user.id, next);
    };

    const visibleAdminActions = adminActions.filter(
        (a) => !dismissedAdminAlertIds.has(String(a._id || a.id))
    );

    const formatDateTime = (iso) => {
        if (!iso) return '—';
        const d = new Date(iso);
        return isNaN(d.getTime())
            ? '—'
            : d.toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
              });
    };

    const handleDelete = async (jobId) => {
        if (window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
            try {
                await api.delete(`/recruiter/jobs/${jobId}`);
                toast.success("Job deleted successfully");
                fetchJobs();
            } catch (error) {
                console.error("Error deleting job:", error);
                toast.error(error.response?.data?.message || "Failed to delete job");
            }
        }
    };

    const handleCloseJob = async (jobId) => {
        const confirmed = window.confirm(
            'Are you sure you want to close this job? It will no longer be visible to job seekers.'
        );
        if (!confirmed) return;

        try {
            await api.patch(`/jobs/${jobId}/close`);
            toast.success('Job closed successfully');
            fetchJobs();
        } catch (error) {
            console.error('Error closing job:', error);
            toast.error(error.response?.data?.message || 'Failed to close job');
        }
    };

    const handleAcknowledgeWarning = async (jobId) => {
        try {
            await api.patch(`/jobs/${jobId}/acknowledge-warning`);
            window.dispatchEvent(new Event(RECRUITER_WARNINGS_CHANGED_EVENT));
            toast.success('Marked as acknowledged');
            await fetchJobs();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Could not update');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    const stats = {
        total: jobs.length,
        active: jobs.filter((j) => String(j.status || '').toLowerCase() === 'active').length,
        closed: jobs.filter((j) => String(j.status || '').toLowerCase() === 'closed').length,
        applicants: jobs.reduce((sum, j) => sum + (Number(j.applicants_count) || 0), 0)
    };

    const sortedJobs = [...jobs].sort((a, b) => {
        if (sortBy === 'Oldest') {
            return new Date(a.createdAt) - new Date(b.createdAt);
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return (
        <>
            {/* ─── Hero Header ─────────────────────────────── */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#0d2f2b] to-slate-900 pt-12 pb-28 px-4 sm:px-6 lg:px-8">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-10 w-64 h-64 bg-[#29a08e] rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 right-20 w-80 h-80 bg-teal-400 rounded-full blur-3xl"></div>
                </div>
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

                <div className="relative max-w-7xl mx-auto">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                        <div className="text-white animate-fade-in-up">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-sm font-medium text-gray-200 backdrop-blur-sm mb-4">
                                <Briefcase size={14} />
                                Job Management
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
                                My <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#29a08e] to-teal-300">Jobs</span>
                            </h1>
                            <p className="text-gray-300 text-lg">Manage and track all your job postings</p>
                        </div>
                        <Link
                            to="/recruiter/post-job"
                            className="inline-flex items-center px-7 py-3.5 bg-[#29a08e] text-white rounded-2xl text-sm font-bold hover:bg-[#228377] shadow-lg shadow-[#29a08e]/30 hover:shadow-[#29a08e]/50 transition-all active:scale-95 gap-2"
                        >
                            <Plus size={18} strokeWidth={2.5} />
                            Post New Job
                        </Link>
                    </div>
                </div>


            </div>

            <main className="flex-1 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full -mt-16 pb-12 relative z-10">

                {/* ─── Stats Summary ─────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total Jobs', value: stats.total, icon: '💼', gradient: 'from-[#29a08e]/5 to-teal-50' },
                        { label: 'Active Jobs', value: stats.active, icon: '🟢', gradient: 'from-emerald-50 to-green-50' },
                        { label: 'Total Applicants', value: stats.applicants, icon: '👥', gradient: 'from-blue-50 to-indigo-50' },
                        { label: 'Closed Jobs', value: stats.closed, icon: '📁', gradient: 'from-gray-50 to-slate-50' },
                    ].map((stat, i) => (
                        <div key={i} className={`bg-gradient-to-br ${stat.gradient} p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-[#29a08e]/20 transition-all duration-300 hover:-translate-y-0.5`}>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-2xl">{stat.icon}</span>
                            </div>
                            <h3 className="text-3xl font-black text-gray-900 mb-1">{stat.value}</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* ─── Filters & Controls ─────────────────────────────── */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        {[
                            { value: filterStatus, setter: setFilterStatus, options: ['All Status', 'Active', 'Closed'] },
                            { value: filterType, setter: setFilterType, options: ['All Types', 'Full Time', 'Part Time', 'Contract', 'Internship', 'Remote'] },
                            { value: sortBy, setter: setSortBy, options: ['Most Recent', 'Oldest'] },
                        ].map((filter, i) => (
                            <div key={i} className="relative group">
                                <select
                                    className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2.5 pl-4 pr-10 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#29a08e]/20 focus:border-[#29a08e] cursor-pointer hover:bg-gray-100 transition-colors"
                                    value={filter.value}
                                    onChange={(e) => filter.setter(e.target.value)}
                                >
                                    {filter.options.map(opt => <option key={opt}>{opt}</option>)}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* ─── Admin moderation notices (above main jobs list only) ─────────────────────────────── */}
                {visibleAdminActions.length > 0 && (
                    <section
                        className="mb-6 rounded-2xl border border-[#29a08e]/20 bg-gradient-to-br from-[#0d2f2b]/[0.03] via-white to-[#29a08e]/[0.04] p-6 shadow-sm"
                        aria-label="Admin notices on your listings"
                    >
                        <div className="flex items-start gap-3 mb-5">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#29a08e]/10 border border-[#29a08e]/25 text-[#29a08e]">
                                <ShieldAlert size={22} strokeWidth={2} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-gray-900 tracking-tight">Admin notices</h2>
                                <p className="text-sm text-gray-600 mt-0.5">
                                    These listings need your attention or were removed by an administrator. Dismissing only hides this card on your device.
                                </p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {visibleAdminActions.map((item) => {
                                const jid = item.id || item._id;
                                const styles = adminActionCardStyles(item.actionType);
                                const isWarned = item.actionType === 'warned';
                                const isHidden = item.actionType === 'hidden';
                                return (
                                    <div
                                        key={String(jid)}
                                        className={`rounded-2xl border shadow-sm p-5 flex flex-col sm:flex-row sm:items-start gap-4 ${styles.wrap} ${styles.accent}`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <span
                                                    className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles.pill}`}
                                                >
                                                    {adminActionLabel(item.actionType)}
                                                </span>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                    {formatDateTime(item.actionAt)}
                                                </span>
                                            </div>
                                            <h3 className="text-base font-black text-gray-900 tracking-tight">{item.title}</h3>
                                            <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                                                <span className="font-semibold text-gray-900">Reason: </span>
                                                {item.reason}
                                            </p>
                                            {isWarned && !item.warningAcknowledged && (
                                                <p className="text-xs text-orange-900 mt-3 font-medium">
                                                    Please address the notice and edit your post.
                                                    {item.warningDeadline
                                                        ? ` Deadline: ${formatDate(item.warningDeadline)}`
                                                        : ''}
                                                </p>
                                            )}
                                            <div className="flex flex-wrap gap-2 mt-4">
                                                {isWarned && !item.warningAcknowledged && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAcknowledgeWarning(jid)}
                                                        className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-[#29a08e] text-white hover:bg-[#228377] border border-[#29a08e] transition-colors"
                                                    >
                                                        Mark as acknowledged
                                                    </button>
                                                )}
                                                {(isWarned || isHidden) && (
                                                    <Link
                                                        to={`/recruiter/jobs/${jid}/edit`}
                                                        className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-white text-[#29a08e] border border-[#29a08e]/40 hover:bg-[#29a08e]/5 transition-colors"
                                                    >
                                                        {isHidden ? 'Edit & resubmit' : 'Edit listing'}
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => dismissAdminAlert(jid)}
                                            className="shrink-0 self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-600 bg-white/80 border border-gray-200 hover:border-[#29a08e]/40 hover:text-[#29a08e] transition-colors"
                                            aria-label="Dismiss notice"
                                        >
                                            <X size={16} strokeWidth={2.5} />
                                            Dismiss
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* ─── Jobs List ─────────────────────────────── */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-24">
                            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-[#29a08e] border-t-transparent"></div>
                            <p className="mt-4 text-sm text-gray-500 font-bold">Loading Jobs...</p>
                        </div>
                    ) : sortedJobs.length > 0 ? (
                        sortedJobs.map((job) => {
                            const jid = job.id || job._id;
                            const mod = effectiveModerationStatus(job);
                            const showPublicPromote = mod === 'active';
                            const normalizedStatus = String(job.status || '').toLowerCase();
                            const statusBadge = primaryJobStatusBadge(job);

                            return (
                            <div key={jid} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between hover:shadow-lg hover:border-[#29a08e]/10 transition-all duration-300 group relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#29a08e] to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-r"></div>
                                <div className="flex-1 pl-2">
                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                        <h3 className="text-lg font-black text-gray-900 group-hover:text-[#29a08e] transition-colors tracking-tight">
                                            {job.title}
                                        </h3>
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusBadge.className}`}>
                                            {statusBadge.label}
                                        </span>
                                    </div>

                                    {mod === 'pending_review' && (
                                        <div className="mb-4 p-3 rounded-xl border border-yellow-200 bg-yellow-50 text-xs text-yellow-900">
                                            Your updated post is being reviewed by our team. It will go live once approved.
                                        </div>
                                    )}

                                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500 mb-4">
                                        <div className="flex items-center gap-1.5">
                                            <MapPin size={14} className="text-gray-400" />
                                            {job.location || 'Remote'}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={14} className="text-gray-400" />
                                            {job.type}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-gray-400">
                                            <span>•</span>
                                            Posted {formatDate(job.createdAt || job.posted_at)}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-6">
                                        <div className="flex items-center gap-2 text-sm font-bold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg">
                                            <Users size={16} className="text-[#29a08e]" />
                                            {job.applicants_count || 0} <span className="text-gray-400 font-normal text-xs">Applicants</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm font-bold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg">
                                            <Eye size={16} className="text-blue-500" />
                                            {job.views_count || 0} <span className="text-gray-400 font-normal text-xs">Views</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 md:mt-0 flex flex-col items-end gap-2 justify-center pl-0 md:pl-6 md:border-l border-gray-100">
                                    {showPublicPromote && (
                                    <Link
                                        to={`/recruiter/promotions?jobId=${jid}`}
                                        className="w-full md:w-auto px-5 py-2.5 bg-amber-500 text-white text-xs font-bold rounded-xl hover:bg-amber-600 shadow-md flex items-center justify-center gap-2 transition-all hover:shadow-lg"
                                    >
                                        <Megaphone size={14} />
                                        Promote
                                    </Link>
                                    )}
                                    <button
                                        onClick={() => navigate(`/recruiter/jobs/${jid}/analytics`)}
                                        className="w-full md:w-auto px-5 py-2.5 bg-[#29a08e] text-white text-xs font-bold rounded-xl hover:bg-[#228377] shadow-md shadow-[#29a08e]/20 flex items-center justify-center gap-2 transition-all hover:shadow-lg"
                                    >
                                        <PieChart size={14} />
                                        Analytics
                                    </button>
                                    <Link
                                        to={`/recruiter/jobs/${jid}/edit`}
                                        className="w-full md:w-auto px-5 py-2.5 text-xs font-bold rounded-xl border flex items-center justify-center gap-2 transition-all bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                                    >
                                        <Edit size={14} />
                                        Edit
                                    </Link>
                                    {normalizedStatus === 'active' && (
                                        <button
                                            onClick={() => handleCloseJob(jid)}
                                            className="w-full md:w-auto px-5 py-2.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-xl hover:bg-amber-100 border border-amber-200 flex items-center justify-center gap-2 transition-all"
                                        >
                                            Close Job
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(jid)}
                                        className="w-full md:w-auto px-5 py-2.5 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl hover:bg-rose-100 hover:text-rose-700 border border-transparent hover:border-rose-200 flex items-center justify-center gap-2 transition-all"
                                    >
                                        <Trash size={14} />
                                        Delete
                                    </button>
                                </div>
                            </div>
                            );
                        })
                    ) : (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-[#29a08e]/5"></div>
                            <div className="relative z-10">
                                <div className="w-20 h-20 bg-gradient-to-br from-[#29a08e]/10 to-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-[#29a08e]/10">
                                    <Briefcase size={32} className="text-[#29a08e]" />
                                </div>
                                <h3 className="text-xl font-black text-gray-900 mb-2">No jobs found</h3>
                                <p className="text-gray-500 text-sm mb-8 max-w-sm mx-auto">You haven't posted any jobs yet, or no jobs match your filter.</p>
                                <Link
                                    to="/recruiter/post-job"
                                    className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#29a08e] text-white text-sm font-bold rounded-xl hover:bg-[#228377] transition-colors shadow-lg shadow-[#29a08e]/20"
                                >
                                    <Plus size={16} strokeWidth={3} />
                                    Post Your First Job
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {sortedJobs.length >= 100 && (
                    <div className="mt-10 flex justify-center">
                        <button className="px-8 py-3 bg-white border border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:bg-gray-50 hover:text-gray-900 shadow-sm transition-all hover:shadow-md">
                            Load More Jobs
                        </button>
                    </div>
                )}
            </main>
        </>
    );
};

export default RecruiterJobs;
