import { useState, useEffect } from 'react';
import RecruiterLayout from '../../components/layouts/RecruiterLayout';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
    Users,
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    Briefcase,
    MapPin,
    ChevronDown,
    Download
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const RecruiterApplicants = () => {
    const { user } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [selectedJobId, setSelectedJobId] = useState('');
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch Recruiter's Jobs (Reusing existing logic)
    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const res = await api.get('/jobs');
                const myJobs = res.data.filter(job => job.recruiter_id === user.id);
                setJobs(myJobs);
                if (myJobs.length > 0) {
                    setSelectedJobId(myJobs[0].id);
                }
            } catch (error) {
                console.error("Error fetching jobs", error);
                toast.error("Failed to load your jobs");
            }
        };
        if (user) fetchJobs();
    }, [user]);

    // Fetch Applicants when Job Selected (Reusing existing logic)
    useEffect(() => {
        const fetchApplicants = async () => {
            if (!selectedJobId) return;
            setLoading(true);
            try {
                const res = await api.get(`/applications/job/${selectedJobId}`);
                setApplicants(res.data);
            } catch (error) {
                console.error("Error fetching applicants", error);
                toast.error("Failed to load applicants");
            } finally {
                setLoading(false);
            }
        };
        fetchApplicants();
    }, [selectedJobId]);

    const handleStatusUpdate = async (appId, newStatus) => {
        try {
            await api.put(`/applications/${appId}/status`, { status: newStatus });
            // Update local state
            setApplicants(applicants.map(app =>
                app.id === appId ? { ...app, status: newStatus } : app
            ));
            toast.success(`Application mark as ${newStatus}`);
        } catch (error) {
            console.error("Error updating status", error);
            toast.error("Failed to update status");
        }
    };

    // Calculate dynamic stats based on current list
    const stats = {
        total: applicants.length,
        pending: applicants.filter(a => a.status === 'pending' || a.status === 'applied').length,
        shortlisted: applicants.filter(a => a.status === 'shortlisted').length,
        rejected: applicants.filter(a => a.status === 'rejected').length
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'shortlisted': return 'bg-emerald-50 text-[#2D9B82] border-emerald-100';
            case 'rejected': return 'bg-rose-50 text-rose-600 border-rose-100';
            default: return 'bg-amber-50 text-amber-600 border-amber-100';
        }
    };

    return (
        <RecruiterLayout>
            <main className="flex-1 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full py-10">

                {/* Header with Job Selector */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
                        <p className="mt-1 text-sm text-gray-500 font-medium">Review and manage candidates for your active jobs</p>
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
                                <option key={job.id} value={job.id}>{job.title}</option>
                            ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                <FileText size={20} />
                            </div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total</span>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900">{stats.total}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                                <Clock size={20} />
                            </div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Under Review</span>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900">{stats.pending}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-emerald-50 text-[#2D9B82] rounded-lg">
                                <CheckCircle size={20} />
                            </div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Shortlisted</span>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900">{stats.shortlisted}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
                                <XCircle size={20} />
                            </div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Rejected</span>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900">{stats.rejected}</h3>
                    </div>
                </div>

                {/* Applications List - Card Based */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">Recent Applications</h3>
                    </div>

                    {loading ? (
                        <div className="p-20 flex flex-col items-center justify-center space-y-4">
                            <div className="w-10 h-10 border-4 border-gray-100 border-t-[#2D9B82] rounded-full animate-spin"></div>
                            <p className="text-sm font-bold text-gray-400">Loading candidates...</p>
                        </div>
                    ) : applicants.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {applicants.map((app) => (
                                <div key={app.id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col lg:flex-row items-start lg:items-center gap-6">

                                    {/* Avatar & Name */}
                                    <div className="flex items-start gap-4 min-w-[250px]">
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-black text-lg shadow-inner">
                                            {app.seeker_name?.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="text-base font-bold text-gray-900">{app.seeker_name}</h4>
                                            <p className="text-xs font-medium text-gray-500">{app.seeker_email}</p>
                                            <div className="flex items-center gap-1.5 mt-1.5 text-xs font-medium text-gray-400">
                                                <MapPin size={12} />
                                                {/* Assuming location exists or default */}
                                                Bangalore, India
                                            </div>
                                        </div>
                                    </div>

                                    {/* Details Grid (Exp, Applied Date) */}
                                    <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8 text-sm">
                                        <div>
                                            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Applied For</span>
                                            <p className="font-bold text-gray-700 truncate">{jobs.find(j => j.id === selectedJobId)?.title || 'Job Role'}</p>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Applied Date</span>
                                            <p className="font-bold text-gray-700">{new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                        </div>
                                        <div className="hidden lg:block">
                                            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Experience</span>
                                            <p className="font-bold text-gray-700">3 Years</p> {/* Placeholder if exp not in app object */}
                                        </div>
                                    </div>

                                    {/* Status & Actions */}
                                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                                        <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${getStatusColor(app.status)}`}>
                                            {app.status}
                                        </div>

                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                            {app.resume_url && (
                                                <a
                                                    href={`http://localhost:5000${app.resume_url}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-2 text-gray-400 hover:text-[#2D9B82] hover:bg-emerald-50 rounded-lg transition-colors"
                                                    title="Download Resume"
                                                >
                                                    <Download size={18} />
                                                </a>
                                            )}

                                            {app.status !== 'shortlisted' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(app.id, 'shortlisted')}
                                                    className="flex-1 sm:flex-none px-4 py-2 bg-[#2D9B82] text-white text-xs font-bold rounded-lg hover:bg-[#25836d] shadow-sm shadow-[#2D9B82]/20 transition-all"
                                                >
                                                    Shortlist
                                                </button>
                                            )}

                                            {app.status !== 'rejected' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(app.id, 'rejected')}
                                                    className="flex-1 sm:flex-none px-4 py-2 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-lg hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all"
                                                >
                                                    Reject
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users size={24} className="text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">No applications yet</h3>
                            <p className="text-gray-500 text-sm">Candidates who apply to this job will appear here.</p>
                        </div>
                    )}

                    {applicants.length > 5 && (
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-center bg-gray-50/50">
                            <button className="text-xs font-bold text-gray-500 hover:text-[#2D9B82] transition-colors">Load More Applications</button>
                        </div>
                    )}
                </div>
            </main>
        </RecruiterLayout>
    );
};

export default RecruiterApplicants;
