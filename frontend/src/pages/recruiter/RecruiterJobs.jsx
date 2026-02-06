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
    Filter,
    ChevronDown,
    Briefcase,
    Plus
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const RecruiterJobs = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [stats, setStats] = useState({ total: 0, active: 0, applicants: 0, closed: 0 });
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('All Status');
    const [filterType, setFilterType] = useState('All Types');
    const [sortBy, setSortBy] = useState('Most Recent');

    const fetchStats = async () => {
        try {
            const res = await api.get('/recruiter/jobs/stats');
            setStats(res.data);
        } catch (error) {
            console.error("Error loading stats:", error);
        }
    };

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filterStatus !== 'All Status') params.status = filterStatus;
            if (filterType !== 'All Types') params.type = filterType;
            if (sortBy === 'Most Recent') params.sort = 'recent';
            if (sortBy === 'Oldest') params.sort = 'oldest';

            const res = await api.get('/recruiter/jobs', { params });
            setJobs(res.data);
        } catch (error) {
            console.error("Error fetching jobs:", error);
            toast.error(error.response?.data?.message || "Failed to load jobs");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchStats();
            fetchJobs();
        }
    }, [user, filterStatus, filterType, sortBy]);

    const handleDelete = async (jobId) => {
        if (window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
            try {
                await api.delete(`/recruiter/jobs/${jobId}`);
                toast.success("Job deleted successfully");
                // Refresh data
                fetchStats();
                fetchJobs();
            } catch (error) {
                console.error("Error deleting job:", error);
                toast.error(error.response?.data?.message || "Failed to delete job");
            }
        }
    };

    // Date helper
    const formatDate = (dateString) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    return (
        <>
            <main className="flex-1 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full py-10">

                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>
                        <p className="mt-1 text-sm text-gray-500 font-medium">Manage and track all your job postings</p>
                    </div>
                    <Link
                        to="/recruiter/post-job"
                        className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#2D9B82] hover:bg-[#25836d] hover:shadow-lg hover:shadow-[#2D9B82]/20 transition-all transform active:scale-95"
                    >
                        <Plus size={18} className="mr-2" strokeWidth={2.5} />
                        Post New Job
                    </Link>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                        <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.total}</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Jobs</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                        <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.active}</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Jobs</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                        <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.applicants}</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Applicants</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                        <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.closed}</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Closed Jobs</p>
                    </div>
                </div>

                {/* Filters & Controls */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        {/* Status Filter */}
                        <div className="relative group">
                            <select
                                className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2.5 pl-4 pr-10 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#2D9B82]/20 focus:border-[#2D9B82] cursor-pointer hover:bg-gray-100 transition-colors"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option>All Status</option>
                                <option>Active</option>
                                <option>Closed</option>
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Type Filter */}
                        <div className="relative group">
                            <select
                                className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2.5 pl-4 pr-10 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#2D9B82]/20 focus:border-[#2D9B82] cursor-pointer hover:bg-gray-100 transition-colors"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                            >
                                <option>All Types</option>
                                <option>Full Time</option>
                                <option>Part Time</option>
                                <option>Contract</option>
                                <option>Internship</option>
                                <option>Remote</option>
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Sort */}
                        <div className="relative group">
                            <select
                                className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2.5 pl-4 pr-10 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#2D9B82]/20 focus:border-[#2D9B82] cursor-pointer hover:bg-gray-100 transition-colors"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option>Most Recent</option>
                                <option>Oldest</option>
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Jobs List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-20">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#2D9B82] border-t-transparent"></div>
                            <p className="mt-2 text-sm text-gray-500 font-bold">Loading Jobs...</p>
                        </div>
                    ) : jobs.length > 0 ? (
                        jobs.map((job) => (
                            <div key={job.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row justify-between hover:shadow-md transition-all group">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#2D9B82] transition-colors">
                                            {job.title}
                                        </h3>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider
                                            ${(job.status || 'Active') === 'Active' ? 'bg-emerald-50 text-[#2D9B82]' : 'bg-gray-100 text-gray-500'}
                                        `}>
                                            {job.status || 'Active'}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500 mb-4">
                                        <div className="flex items-center gap-1.5">
                                            <MapPin size={14} />
                                            {job.location || 'Remote'}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={14} />
                                            {job.type}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-gray-300">|</span>
                                            Posted {formatDate(job.createdAt || job.posted_at)}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                            <Users size={16} className="text-[#2D9B82]" />
                                            {job.applicants_count || 0} <span className="text-gray-400 font-normal ml-1">Applicants</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                            <Eye size={16} className="text-blue-500" />
                                            {job.views_count || 0} <span className="text-gray-400 font-normal ml-1">Views</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 md:mt-0 flex flex-col items-end gap-3 justify-center pl-0 md:pl-6 md:border-l border-gray-100">
                                    <button
                                        onClick={() => navigate(`/recruiter/jobs/${job.id || job._id}/analytics`)}
                                        className="w-full md:w-auto px-4 py-2 bg-[#2D9B82] text-white text-xs font-bold rounded-lg hover:bg-[#25836d] shadow-sm shadow-[#2D9B82]/20 flex items-center justify-center gap-2 transition-all"
                                    >
                                        <PieChart size={14} />
                                        View Analytics
                                    </button>
                                    <Link
                                        to={`/recruiter/jobs/${job.id}/edit`}
                                        className="w-full md:w-auto px-4 py-2 bg-gray-50 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-100 border border-gray-200 flex items-center justify-center gap-2 transition-all"
                                    >
                                        <Edit size={14} />
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(job.id)}
                                        className="w-full md:w-auto px-4 py-2 bg-rose-50 text-rose-600 text-xs font-bold rounded-lg hover:bg-rose-100 hover:text-rose-700 border border-transparent hover:border-rose-200 flex items-center justify-center gap-2 transition-all"
                                    >
                                        <Trash size={14} />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Briefcase size={24} className="text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">No jobs found</h3>
                            <p className="text-gray-500 text-sm mb-6">You haven't posted any jobs yet, or no jobs match your filter.</p>
                            <Link
                                to="/recruiter/post-job"
                                className="inline-flex items-center px-6 py-3 bg-[#2D9B82] text-white text-sm font-bold rounded-lg hover:bg-[#25836d] transition-colors"
                            >
                                <Plus size={16} className="mr-2" strokeWidth={3} />
                                Post Your First Job
                            </Link>
                        </div>
                    )}
                </div>

                {/* Pagination (Optional/Hidden if no backend support yet) */}
                {jobs.length >= 100 && (
                    <div className="mt-8 flex justify-center">
                        <button className="px-6 py-2.5 bg-white border border-gray-200 text-gray-500 text-sm font-bold rounded-lg hover:bg-gray-50 hover:text-gray-700 shadow-sm transition-all">
                            Load More Jobs
                        </button>
                    </div>
                )}

            </main>
        </>
    );
};

export default RecruiterJobs;
