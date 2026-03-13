import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardNavbar from '../../components/dashboard/DashboardNavbar';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { 
    Users, 
    Briefcase, 
    UserCheck, 
    Clock, 
    ChevronRight, 
    ShieldCheck, 
    RefreshCw, 
    Activity, 
    Server
} from 'lucide-react';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [stats, setStats] = useState({ totalUsers: 0, totalJobs: 0, activeRecruiters: 0, pendingApprovals: 0 });
    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Parallel fetch
                const [statsRes, activitiesRes] = await Promise.all([
                    api.get('/dashboard/admin/stats'),
                    api.get('/admin/activities') // Uses the updated adminController logic
                ]);
                setStats(statsRes.data);
                setActivities(activitiesRes.data);
            } catch (error) {
                console.error("Error fetching admin data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    // Time Ago Helper
    const timeAgo = (dateStr) => {
        const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " mins ago";
        return Math.floor(seconds) + " seconds ago";
    };

    return (
        <div className="flex-1 w-full bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto">
            <main className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Admin Dashboard</h1>
                        <p className="text-gray-500 mt-1 sm:mt-1.5 font-medium">Platform overview and system statistics.</p>
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-200 shadow-sm shrink-0">
                        <div className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </div>
                        <span className="text-sm font-bold text-gray-700">System Healthy</span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {[
                        { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100', border: 'hover:border-blue-300' },
                        { label: 'Total Jobs', value: stats.totalJobs, icon: Briefcase, color: 'text-[#29a08e]', bg: 'bg-[#29a08e]/10', border: 'hover:border-[#29a08e]' },
                        { label: 'Active Recruiters', value: stats.activeRecruiters, icon: UserCheck, color: 'text-indigo-600', bg: 'bg-indigo-100', border: 'hover:border-indigo-300' },
                        { label: 'Pending Approvals', value: stats.pendingApprovals, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100', border: 'hover:border-orange-300' }
                    ].map((stat, idx) => {
                        const Icon = stat.icon;
                        return (
                            <div key={idx} className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-200 ${stat.border} transition-all duration-300 hover:shadow-md group flex flex-col items-start`}>
                                <div className={`h-12 w-12 ${stat.bg} rounded-xl flex items-center justify-center ${stat.color} mb-4 group-hover:scale-110 transition-transform`}>
                                    <Icon className="h-6 w-6 stroke-[2]" />
                                </div>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                <p className="text-3xl font-black text-gray-900 tracking-tight">{loading ? <span className="animate-pulse">...</span> : stat.value}</p>
                            </div>
                        )
                    })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* System Activity */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col h-[600px] overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white/50 backdrop-blur-sm z-10 sticky top-0">
                            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                <Activity className="h-5 w-5 text-gray-400" />
                                Recent Activity
                            </h3>
                            <button onClick={() => window.location.reload()} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-bold transition-colors">
                                <RefreshCw className="h-3.5 w-3.5" />
                                Refresh
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto w-full p-2">
                            {loading ? (
                                <div className="h-full flex flex-col items-center justify-center space-y-4">
                                    <RefreshCw className="h-8 w-8 text-[#29a08e] animate-spin" />
                                    <span className="text-sm font-medium text-gray-400">Loading activities...</span>
                                </div>
                            ) : activities.length > 0 ? (
                                <ul className="divide-y divide-gray-50 px-2 lg:px-4">
                                    {activities.map((log) => (
                                        <li key={log._id} className="py-5 px-3 rounded-xl hover:bg-slate-50/80 transition-colors group">
                                            <div className="flex items-start gap-4">
                                                <div className={`mt-1 h-10 w-10 rounded-xl flex items-center justify-center text-xs font-black uppercase shrink-0 tracking-widest shadow-sm ${(log.userId?.role) === 'admin' ? 'bg-purple-100 text-purple-600 border border-purple-200' :
                                                    (log.userId?.role) === 'recruiter' ? 'bg-[#29a08e]/10 text-[#29a08e] border border-[#29a08e]/30' :
                                                        'bg-emerald-100 text-emerald-600 border border-emerald-200'
                                                    }`}>
                                                    {(log.userId?.role || 'sys').substring(0, 3)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[15px] font-semibold text-gray-800 leading-snug group-hover:text-black transition-colors">{log.message}</p>
                                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2">
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded-md">
                                                            {log.type?.replace(/_/g, ' ')}
                                                        </span>
                                                        <span className="text-xs text-gray-400 font-medium">
                                                            by <span className="text-gray-600">{log.userId ? log.userId.fullName : 'System'}</span> ({log.userId?.role || 'System'})
                                                        </span>
                                                        <span className="text-xs text-gray-300 hidden sm:inline-block">•</span>
                                                        <span className="text-xs font-bold text-gray-400 whitespace-nowrap">{timeAgo(log.createdAt)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-400">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 shadow-inner">
                                        <Server className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <p className="font-medium text-gray-500">No recent activity logs found.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions / Shortcuts */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Quick Actions</h3>
                        <div className="space-y-3">
                            {[
                                { name: 'Manage Users', desc: 'Add, edit, or suspend users', path: '/admin/users', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
                                { name: 'Moderate Jobs', desc: 'Review and approve postings', path: '/admin/jobs', icon: Briefcase, color: 'text-[#29a08e]', bg: 'bg-[#29a08e]/10' },
                                { name: 'Verify KYC', desc: 'Secure identity checks', path: '/admin/kyc', icon: ShieldCheck, color: 'text-purple-500', bg: 'bg-purple-50' }
                            ].map((cmd, i) => {
                                const Icon = cmd.icon;
                                return (
                                    <button
                                        key={i}
                                        onClick={() => navigate(cmd.path)}
                                        className="w-full bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-[#29a08e]/50 hover:-translate-y-0.5 transition-all text-left flex items-center gap-4 group"
                                    >
                                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${cmd.color} ${cmd.bg} group-hover:scale-110 transition-transform`}>
                                            <Icon className="h-6 w-6 stroke-[2]" />
                                        </div>
                                        <div className="flex-1">
                                            <span className="block text-sm font-bold text-gray-900 group-hover:text-[#29a08e] transition-colors">{cmd.name}</span>
                                            <span className="block text-[11px] font-medium text-gray-500 mt-0.5">{cmd.desc}</span>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-[#29a08e] group-hover:translate-x-1 transition-all" />
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
