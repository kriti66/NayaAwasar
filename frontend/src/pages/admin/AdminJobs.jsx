import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
    Search,
    Briefcase,
    Trash2,
    X,
    Clock,
    AlertCircle,
    ShieldCheck,
    EyeOff,
    RefreshCw,
    CheckCircle2,
    Flag,
    Eye
} from 'lucide-react';

const AdminJobs = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedJob, setSelectedJob] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [moderationData, setModerationData] = useState({
        moderationStatus: 'Approved',
        flagReason: '',
        reviewDeadline: '',
        adminComments: ''
    });

    const fetchJobs = async () => {
        try {
            const res = await api.get('/jobs/admin/all');
            setJobs(res.data);
        } catch (error) {
            console.error("Fetch jobs error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this job post permanently? Admin moderation (Flagging) is usually preferred first.")) return;
        try {
            await api.delete(`/jobs/${id}`);
            setJobs(jobs.filter(j => j._id !== id));
            alert("Job deleted successfully.");
        } catch (error) {
            console.error("Delete job error:", error);
            alert("Failed to delete job.");
        }
    };

    const handleModerateClick = (job) => {
        setSelectedJob(job);
        setModerationData({
            moderationStatus: job.moderationStatus || 'Approved',
            flagReason: job.flagReason || '',
            reviewDeadline: job.reviewDeadline ? new Date(job.reviewDeadline).toISOString().split('T')[0] : '',
            adminComments: job.adminComments || ''
        });
        setShowModal(true);
    };

    const handleModerationSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.patch(`/jobs/${selectedJob._id}/moderate`, moderationData);
            setJobs(jobs.map(j => j._id === selectedJob._id ? res.data.job : j));
            setShowModal(false);
            alert(`Job updated to ${moderationData.moderationStatus}`);
        } catch (error) {
            console.error("Moderation error:", error);
            alert("Failed to update job moderation.");
        }
    };

    const filteredJobs = jobs.filter(job =>
        job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getModerationBadge = (status) => {
        switch (status) {
            case 'Approved': return { style: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 };
            case 'Flagged': return { style: 'bg-amber-50 text-amber-700 border-amber-200', icon: Flag };
            case 'Under Review': return { style: 'bg-[#29a08e]/10 text-[#29a08e] border-[#29a08e]/20', icon: Eye };
            case 'Hidden': return { style: 'bg-rose-50 text-rose-700 border-rose-200', icon: EyeOff };
            default: return { style: 'bg-slate-50 text-slate-700 border-slate-200', icon: Clock };
        }
    };

    const statusCounts = {
        approved: jobs.filter(j => j.moderationStatus === 'Approved' || !j.moderationStatus).length,
        flagged: jobs.filter(j => j.moderationStatus === 'Flagged').length,
        review: jobs.filter(j => j.moderationStatus === 'Under Review').length,
        hidden: jobs.filter(j => j.moderationStatus === 'Hidden').length,
    };

    return (
        <div className="flex-1 w-full flex flex-col min-h-[calc(100vh-64px)]">
            {/* Hero Header */}
            <div className="relative bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] overflow-hidden">
                <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#29a08e]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-10 w-10 bg-[#29a08e]/20 rounded-xl flex items-center justify-center border border-[#29a08e]/30">
                                    <Briefcase className="h-5 w-5 text-[#29a08e]" />
                                </div>
                                <span className="text-[11px] font-bold text-[#29a08e] uppercase tracking-[0.2em]">Job Moderation</span>
                            </div>
                            <h1 className="text-3xl font-black text-white tracking-tight">Manage Jobs</h1>
                            <p className="text-gray-400 mt-1.5 font-medium text-sm">Review, moderate, and manage all job listings on the platform.</p>
                        </div>

                        {/* Status Pills */}
                        <div className="flex items-center gap-2 flex-wrap">
                            {[
                                { label: 'Approved', count: statusCounts.approved, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
                                { label: 'Flagged', count: statusCounts.flagged, color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
                                { label: 'Review', count: statusCounts.review, color: 'bg-[#29a08e]/20 text-[#5eead4] border-[#29a08e]/30' },
                                { label: 'Hidden', count: statusCounts.hidden, color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
                            ].map((pill, i) => (
                                <div key={i} className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold ${pill.color}`}>
                                    {pill.count} {pill.label}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 pb-12 relative z-10 w-full flex-1">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    {/* Search and Filters */}
                    <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search jobs by title or company..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#29a08e]/30 focus:border-[#29a08e] outline-none transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-400">
                                <span className="text-gray-900 font-bold">{filteredJobs.length}</span> jobs
                            </span>
                            <button onClick={() => { setLoading(true); fetchJobs(); }} className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl text-xs font-bold transition-all hover:shadow-sm">
                                <RefreshCw className="h-3.5 w-3.5" />
                                Refresh
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/80 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em]">Job Details</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em]">Status</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em]">Reason</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    [1, 2, 3, 4, 5].map(i => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan="4" className="px-6 py-5">
                                                <div className="h-10 bg-gray-50 rounded-xl w-full"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : filteredJobs.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 border border-gray-100">
                                                    <Briefcase className="w-7 h-7 text-gray-300" />
                                                </div>
                                                <p className="text-sm font-semibold text-gray-500">No jobs found</p>
                                                <p className="text-xs text-gray-400 mt-1">Try adjusting your search criteria.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredJobs.map((job) => {
                                    const badge = getModerationBadge(job.moderationStatus);
                                    const BadgeIcon = badge.icon;
                                    return (
                                        <tr key={job._id} className="hover:bg-[#29a08e]/[0.02] transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#29a08e] to-[#228377] flex items-center justify-center text-white shrink-0 shadow-sm">
                                                        <Briefcase className="w-5 h-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-[#29a08e] transition-colors">{job.title}</p>
                                                        <p className="text-xs text-gray-400 truncate">{job.company_name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold w-fit border ${badge.style}`}>
                                                        <BadgeIcon className="w-3 h-3" />
                                                        {job.moderationStatus || 'Approved'}
                                                    </span>
                                                    {job.moderationStatus === 'Flagged' && job.reviewDeadline && (
                                                        <span className="text-[10px] text-red-500 mt-1.5 font-medium flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            Until: {new Date(job.reviewDeadline).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs text-gray-400 line-clamp-1 italic max-w-[200px]">
                                                    {job.flagReason || 'No issues reported.'}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleModerateClick(job)}
                                                        className="px-4 py-2 bg-gradient-to-r from-[#0f172a] to-[#1e293b] text-white rounded-xl text-xs font-bold hover:from-[#29a08e] hover:to-[#228377] transition-all shadow-sm hover:shadow-md"
                                                    >
                                                        Moderate
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(job._id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-xs text-gray-400 font-medium">
                            {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} displayed
                        </p>
                    </div>
                </div>
            </main>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 animate-scale-in">
                        {/* Modal Header */}
                        <header className="relative p-6 border-b border-gray-100 bg-gradient-to-r from-[#0f172a] to-[#1e293b] text-white">
                            <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                            <div className="relative flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-black">Moderate Job</h3>
                                    <p className="text-xs text-gray-400 mt-1">{selectedJob?.title}</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition-colors p-1">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </header>

                        <form onSubmit={handleModerationSubmit} className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</label>
                                    <select
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#29a08e]/30 focus:border-[#29a08e] outline-none transition-all"
                                        value={moderationData.moderationStatus}
                                        onChange={(e) => setModerationData({ ...moderationData, moderationStatus: e.target.value })}
                                    >
                                        <option value="Approved">Approved</option>
                                        <option value="Flagged">Flagged</option>
                                        <option value="Under Review">Under Review</option>
                                        <option value="Hidden">Hidden</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Deadline</label>
                                    <input
                                        type="date"
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#29a08e]/30 focus:border-[#29a08e] outline-none transition-all"
                                        value={moderationData.reviewDeadline}
                                        onChange={(e) => setModerationData({ ...moderationData, reviewDeadline: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Reason</label>
                                <textarea
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#29a08e]/30 focus:border-[#29a08e] outline-none h-24 resize-none transition-all"
                                    placeholder="Why is this being flagged?"
                                    value={moderationData.flagReason}
                                    onChange={(e) => setModerationData({ ...moderationData, flagReason: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Admin Notes</label>
                                <textarea
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#29a08e]/30 focus:border-[#29a08e] outline-none h-24 resize-none transition-all"
                                    placeholder="Internal notes..."
                                    value={moderationData.adminComments}
                                    onChange={(e) => setModerationData({ ...moderationData, adminComments: e.target.value })}
                                />
                            </div>

                            <div className="pt-2">
                                <button type="submit" className="w-full py-3 bg-gradient-to-r from-[#29a08e] to-[#228377] text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-[#29a08e]/20 transition-all active:scale-[0.98]">
                                    Update Job Status
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminJobs;
