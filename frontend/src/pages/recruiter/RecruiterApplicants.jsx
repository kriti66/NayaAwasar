import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { Download, Search, Briefcase, ChevronDown, MapPin } from 'lucide-react';
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

    const handleAction = async (id, action, payload = {}) => {
        // Intercept Advance action for Interview stage
        const currentApp = applicants.find(app => (app._id || app.id) === id);

        if (action === 'Advance' && currentApp.status === 'in_review') {
            setSelectedApplicantId(id);
            setIsInterviewModalOpen(true);
            return;
        }

        try {
            let endpoint = '';
            if (action === 'Advance') endpoint = `/applications/${id}/advance`;
            else if (action === 'Reject') endpoint = `/applications/${id}/reject`;
            else if (action === 'Withdraw') endpoint = `/applications/${id}/withdraw`;

            console.log(`[RecruiterApplicants] ${action} application ${id}`);
            console.log(`[RecruiterApplicants] Endpoint: ${endpoint}`);
            console.log(`[RecruiterApplicants] Payload:`, payload);

            await api.patch(endpoint, payload);

            toast.success(`Application updated successfully`);

            // Optimistic update
            setApplicants(prev => prev.map(app => {
                if ((app._id || app.id) !== id) return app;

                const pipeline = ['applied', 'in_review', 'interview', 'offered', 'hired'];
                if (action === 'Reject') return { ...app, status: 'rejected' };
                if (action === 'Advance') {
                    const idx = pipeline.indexOf(app.status);
                    if (idx < pipeline.length - 1) {
                        // If we just scheduled an interview, update the interview object too if needed locally,
                        // but ideally we should refetch or the backend returns the updated app.
                        // For now just status update is enough for UI feedback.
                        return { ...app, status: pipeline[idx + 1], interview: payload };
                    }
                }
                return app;
            }));

        } catch (error) {
            console.error("Action error", error);
            toast.error(error.response?.data?.message || "Failed to update application");
        }
    };

    const handleScheduleSubmit = async (interviewData) => {
        setIsScheduling(true);
        try {
            console.log('[RecruiterApplicants] Scheduling interview with data:', interviewData);
            console.log('[RecruiterApplicants] For applicant ID:', selectedApplicantId);

            await handleAction(selectedApplicantId, 'Advance', interviewData);

            // Refetch applications to get updated data from backend
            console.log('[RecruiterApplicants] Interview scheduled successfully, refetching applications...');
            const res = await api.get(`/applications/job/${selectedJobId}`);
            setApplicants(res.data);

            // Recalculate stats
            const newStats = { total: res.data.length, applied: 0, inReview: 0, interview: 0, offered: 0, hired: 0, rejected: 0 };
            res.data.forEach(app => {
                const statusKey = app.status === 'in_review' ? 'inReview' : app.status;
                if (newStats[statusKey] !== undefined) newStats[statusKey]++;
            });
            setStats(newStats);

            setIsInterviewModalOpen(false);
        } catch (error) {
            console.error('[RecruiterApplicants] Error scheduling interview:', error);
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

                                            {/* Action Buttons based on Stage */}
                                            <div className="flex items-center gap-2">
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

                                                {/* ATS Transition Buttons */}
                                                {app.status === 'applied' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleAction(app._id || app.id, 'Advance')}
                                                            className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"
                                                        >
                                                            Move to In Review
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(app._id || app.id, 'Reject')}
                                                            className="px-4 py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}

                                                {app.status === 'in_review' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleAction(app._id || app.id, 'Advance')}
                                                            className="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/20"
                                                        >
                                                            Schedule Interview
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(app._id || app.id, 'Reject')}
                                                            className="px-4 py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}

                                                {app.status === 'interview' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleAction(app._id || app.id, 'Advance')}
                                                            className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20"
                                                        >
                                                            Extend Offer
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(app._id || app.id, 'Reject')}
                                                            className="px-4 py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}

                                                {app.status === 'offered' && (
                                                    <button
                                                        onClick={() => handleAction(app._id || app.id, 'Advance')}
                                                        className="px-4 py-2 bg-[#2D9B82] text-white text-xs font-bold rounded-lg hover:bg-[#25836d] transition-colors shadow-lg shadow-[#2D9B82]/20"
                                                    >
                                                        Mark Hired
                                                    </button>
                                                )}

                                                {['rejected', 'withdrawn'].includes(app.status) && (
                                                    <span className="text-gray-400 text-xs font-medium italic">Application Closed</span>
                                                )}
                                            </div>
                                        </div>
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
                onClose={() => setIsInterviewModalOpen(false)}
                onSubmit={handleScheduleSubmit}
                isSubmitting={isScheduling}
            />
        </div>
    );
};

export default RecruiterApplicants;
