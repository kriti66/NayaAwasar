import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ totalUsers: 0, totalJobs: 0, activeRecruiters: 0, pendingApprovals: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/dashboard/admin/stats');
                setStats(response.data);
            } catch (error) {
                console.error("Error fetching admin stats:", error);
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
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Overview</h1>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Users</h3>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{loading ? '...' : stats.totalUsers}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Jobs</h3>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{loading ? '...' : stats.totalJobs}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Active Recruiters</h3>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{loading ? '...' : stats.activeRecruiters}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Pending Approvals</h3>
                            <p className="text-3xl font-bold text-yellow-600 mt-2">{loading ? '...' : stats.pendingApprovals}</p>
                        </div>
                    </div>

                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-5 border-b border-gray-200">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">System Activity</h3>
                        </div>
                        <div className="px-6 py-5">
                            <p className="text-gray-500">System logs and recent activities.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
