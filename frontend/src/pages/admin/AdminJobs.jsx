import { useState, useEffect } from 'react';
import DashboardNavbar from '../../components/dashboard/DashboardNavbar';
import api from '../../services/api';
import {
    Search,
    Briefcase,
    Trash2,
    X,
    Clock,
    AlertCircle,
    ShieldCheck,
    EyeOff
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
            case 'Approved': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'Flagged': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'Under Review': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'Hidden': return 'bg-rose-50 text-rose-700 border-rose-100';
            default: return 'bg-slate-50 text-slate-700 border-slate-100';
        }
    };

    return (
        <div className="flex-1 w-full flex flex-col">
            <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0 sticky top-0 z-10">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Manage Jobs</h1>
                    <p className="text-xs text-gray-500">Review and moderate job listings.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search jobs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm md:w-80"
                    />
                </div>
            </header>

            <main className="flex-1 p-8">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Job Details</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="4" className="px-6 py-4">
                                            <div className="h-8 bg-gray-50 rounded w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredJobs.map((job) => (
                                <tr key={job._id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 border border-blue-100">
                                                <Briefcase className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate">{job.title}</p>
                                                <p className="text-xs text-gray-500 truncate">{job.company_name}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold w-fit ${getModerationBadge(job.moderationStatus)}`}>
                                                {job.moderationStatus || 'Approved'}
                                            </span>
                                            {job.moderationStatus === 'Flagged' && job.reviewDeadline && (
                                                <span className="text-[10px] text-red-500 mt-1 font-medium">
                                                    Until: {new Date(job.reviewDeadline).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs text-gray-500 line-clamp-1 italic">
                                            {job.flagReason || 'No issues reported.'}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleModerateClick(job)}
                                                className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-blue-600 transition-colors"
                                            >
                                                Moderate
                                            </button>
                                            <button
                                                onClick={() => handleDelete(job._id)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-200">
                        <header className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Moderate Job</h3>
                                <p className="text-xs text-gray-500">{selectedJob?.title}</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </header>

                        <form onSubmit={handleModerationSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-700">Status</label>
                                    <select
                                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={moderationData.moderationStatus}
                                        onChange={(e) => setModerationData({ ...moderationData, moderationStatus: e.target.value })}
                                    >
                                        <option value="Approved">Approved</option>
                                        <option value="Flagged">Flagged</option>
                                        <option value="Under Review">Under Review</option>
                                        <option value="Hidden">Hidden</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-700">Deadline</label>
                                    <input
                                        type="date"
                                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={moderationData.reviewDeadline}
                                        onChange={(e) => setModerationData({ ...moderationData, reviewDeadline: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-700">Reason</label>
                                <textarea
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                                    placeholder="Why is this being flagged?"
                                    value={moderationData.flagReason}
                                    onChange={(e) => setModerationData({ ...moderationData, flagReason: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-700">Admin Notes</label>
                                <textarea
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                                    placeholder="Internal notes..."
                                    value={moderationData.adminComments}
                                    onChange={(e) => setModerationData({ ...moderationData, adminComments: e.target.value })}
                                />
                            </div>

                            <div className="pt-2">
                                <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors">
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
