import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardNavbar from '../../components/dashboard/DashboardNavbar';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const AdminDashboard = () => {
    const navigate = useNavigate();
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
        <div className="min-h-screen flex flex-col bg-gray-100">
            <DashboardNavbar />
            <div className="flex-1 w-full">
                <main className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                            <p className="text-gray-500 mt-1">Platform overview and system statistics.</p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                            <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                            <span className="text-sm font-medium text-gray-600">System Healthy</span>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                        {[
                            { label: 'Total Users', value: stats.totalUsers, icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
                            { label: 'Total Jobs', value: stats.totalJobs, icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
                            { label: 'Active Recruiters', value: stats.activeRecruiters, icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
                            { label: 'Pending Approvals', value: stats.pendingApprovals, icon: 'M12 8v4l3 1.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
                        ].map((stat, idx) => (
                            <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                                <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-900">{loading ? '...' : stat.value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* System Activity */}
                        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
                            <div className="px-6 py-5 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                            </div>
                            <div className="p-6 flex-1">
                                <p className="text-gray-500 text-sm">System logs and recent platform activities will be listed here.</p>
                                <div className="mt-8 pt-8 border-t border-gray-50">
                                    <button className="text-blue-600 text-sm font-semibold hover:text-blue-700">View detailed logs &rarr;</button>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Shortcuts</h3>
                            {[
                                { name: 'Manage Users', path: '/admin/users', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
                                { name: 'Moderate Jobs', path: '/admin/jobs', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
                                { name: 'Verify KYC', path: '/admin/kyc', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' }
                            ].map((cmd, i) => (
                                <button
                                    key={i}
                                    onClick={() => navigate(cmd.path)}
                                    className="w-full bg-white px-6 py-4 rounded-xl border border-gray-200 shadow-sm hover:border-blue-500 transition-colors text-left flex items-center gap-4 group"
                                >
                                    <div className="h-10 w-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cmd.icon} />
                                        </svg>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600">{cmd.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;
