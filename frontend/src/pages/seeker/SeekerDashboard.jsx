import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const SeekerDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ applied: 0, saved: 0, interviews: 0 });
    const [recommendedJobs, setRecommendedJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Parallel fetch for stats and recommended jobs
                // Adjust endpoints as per actual backend routes
                const [statsRes, jobsRes] = await Promise.all([
                    api.get('/dashboard/seeker/stats').catch(() => ({ data: { applied: 0, saved: 0, interviews: 0 } })),
                    api.get('/jobs/recommended').catch(() => ({ data: [] }))
                ]);

                setStats(statsRes.data);
                setRecommendedJobs(jobsRes.data);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const handleApply = async (jobId) => {
        try {
            const response = await api.post('/applications/apply', { job_id: jobId });
            if (response.data.success) {
                alert('Applied successfully!');
                // Optionally refresh stats
                setStats(prev => ({ ...prev, applied: prev.applied + 1 }));
            }
        } catch (error) {
            console.error("Application failed", error);
            alert(error.response?.data?.message || 'Failed to apply');
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 overflow-auto">
                <div className="py-6 px-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">Welcome back, {user?.name}</h1>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Jobs Applied</h3>
                            <p className="text-3xl font-bold text-blue-600 mt-2">{loading ? '...' : stats.applied}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Saved Jobs</h3>
                            <p className="text-3xl font-bold text-blue-600 mt-2">{loading ? '...' : stats.saved}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Interviews</h3>
                            <p className="text-3xl font-bold text-blue-600 mt-2">{loading ? '...' : stats.interviews}</p>
                        </div>
                    </div>

                    {/* Recent Activity / Recommended Jobs */}
                    <div className="bg-white shadow rounded-lg mb-8">
                        <div className="px-6 py-5 border-b border-gray-200">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Recommended Jobs</h3>
                        </div>
                        <div className="px-6 py-5">
                            {loading ? (
                                <p className="text-gray-500">Loading recommendations...</p>
                            ) : recommendedJobs.length > 0 ? (
                                <ul className="divide-y divide-gray-200">
                                    {recommendedJobs.map((job) => (
                                        <li key={job.id} className="py-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-blue-600 truncate">{job.title}</p>
                                                    <p className="text-sm text-gray-500">{job.company_name}</p>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        {job.type}
                                                    </span>
                                                    <button
                                                        onClick={() => handleApply(job.id)}
                                                        className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                                                    >
                                                        Apply
                                                    </button>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500">No recommendations available at the moment.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SeekerDashboard;
