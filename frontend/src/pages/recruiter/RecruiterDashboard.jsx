import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Link } from 'react-router-dom';

const RecruiterDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ posted_jobs: 0, applicants: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/dashboard/recruiter/stats');
                setStats(res.data);
            } catch (error) {
                console.error("Error fetching recruiter stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 overflow-auto">
                <div className="py-6 px-8">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">Recruiter Dashboard</h1>
                        <Link to="/recruiter/post-job" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                            Post a Job
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Active Jobs</h3>
                            <p className="text-3xl font-bold text-blue-600 mt-2">{loading ? '...' : stats.posted_jobs}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Total Applicants</h3>
                            <p className="text-3xl font-bold text-blue-600 mt-2">{loading ? '...' : stats.applicants}</p>
                        </div>
                    </div>

                    {/* Placeholder for Recent Applicants or Jobs List */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                        <div className="flex space-x-4">
                            <Link to="/recruiter/jobs" className="text-blue-600 hover:underline">Manage Jobs</Link>
                            <Link to="/recruiter/applicants" className="text-blue-600 hover:underline">View Applicants</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecruiterDashboard;
