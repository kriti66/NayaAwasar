import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    Server,
    TrendingUp,
    Building2,
    MapPin,
    MessageSquare
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
                const [statsRes, activitiesRes] = await Promise.all([
                    api.get('/dashboard/admin/stats'),
                    api.get('/admin/activities')
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
        <div className="flex-1 w-full min-h-[calc(100vh-64px)] overflow-y-auto">
            {/* Hero Header */}
            <div className="relative bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] overflow-hidden">
                <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#29a08e]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#29a08e]/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
                
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-10 w-10 bg-[#29a08e]/20 rounded-xl flex items-center justify-center border border-[#29a08e]/30">
                                    <ShieldCheck className="h-5 w-5 text-[#29a08e]" />
                                </div>
                                <span className="text-[11px] font-bold text-[#29a08e] uppercase tracking-[0.2em]">Administration Panel</span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                                Welcome back, <span className="text-[#29a08e]">{user?.fullName?.split(' ')[0] || 'Admin'}</span>
                            </h1>
                            <p className="text-gray-400 mt-2 font-medium text-sm">Platform overview and system statistics at a glance.</p>
                        </div>
                        <div className="inline-flex items-center gap-2.5 px-5 py-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 shrink-0">
                            <div className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </div>
                            <span className="text-sm font-bold text-emerald-400">System Healthy</span>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 pb-12 relative z-10">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                    {[
                        { label: 'Total Users', value: stats.totalUsers, icon: Users, gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', textColor: 'text-blue-600', borderHover: 'hover:border-blue-300' },
                        { label: 'Total Jobs', value: stats.totalJobs, icon: Briefcase, gradient: 'from-[#29a08e] to-[#228377]', bg: 'bg-[#29a08e]/10', textColor: 'text-[#29a08e]', borderHover: 'hover:border-[#29a08e]/50' },
                        { label: 'Active Recruiters', value: stats.activeRecruiters, icon: UserCheck, gradient: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-50', textColor: 'text-indigo-600', borderHover: 'hover:border-indigo-300' },
                        { label: 'Pending Approvals', value: stats.pendingApprovals, icon: Clock, gradient: 'from-orange-500 to-orange-600', bg: 'bg-orange-50', textColor: 'text-orange-600', borderHover: 'hover:border-orange-300' }
                    ].map((stat, idx) => {
                        const Icon = stat.icon;
                        return (
                            <div 
                                key={idx} 
                                className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 ${stat.borderHover} transition-all duration-300 hover:shadow-lg group flex flex-col items-start relative overflow-hidden`}
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.gradient} opacity-[0.04] rounded-full -translate-y-6 translate-x-6`} />
                                <div className={`h-12 w-12 ${stat.bg} rounded-xl flex items-center justify-center ${stat.textColor} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                    <Icon className="h-6 w-6 stroke-[2]" />
                                </div>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-1">{stat.label}</p>
                                <p className="text-3xl font-black text-gray-900 tracking-tight">
                                    {loading ? <span className="animate-pulse text-gray-300">...</span> : stat.value}
                                </p>
                            </div>
                        )
                    })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* System Activity */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[600px] overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white z-10 sticky top-0">
                            <h3 className="text-base font-black text-gray-900 flex items-center gap-2.5">
                                <div className="h-8 w-8 bg-[#29a08e]/10 rounded-lg flex items-center justify-center">
                                    <Activity className="h-4 w-4 text-[#29a08e]" />
                                </div>
                                Recent Activity
                            </h3>
                            <button onClick={() => window.location.reload()} className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl text-xs font-bold transition-all hover:shadow-sm">
                                <RefreshCw className="h-3.5 w-3.5" />
                                Refresh
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto w-full p-2">
                            {loading ? (
                                <div className="h-full flex flex-col items-center justify-center space-y-4">
                                    <div className="w-10 h-10 border-[3px] border-[#29a08e]/20 border-t-[#29a08e] rounded-full animate-spin" />
                                    <span className="text-sm font-medium text-gray-400">Loading activities...</span>
                                </div>
                            ) : activities.length > 0 ? (
                                <ul className="px-2 lg:px-4 space-y-1">
                                    {activities.map((log, idx) => (
                                        <li key={log._id} className="py-4 px-4 rounded-xl hover:bg-[#29a08e]/[0.03] transition-all group border border-transparent hover:border-[#29a08e]/10"
                                            style={{ animationDelay: `${idx * 50}ms` }}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`mt-0.5 h-10 w-10 rounded-xl flex items-center justify-center text-[10px] font-black uppercase shrink-0 tracking-widest ${
                                                    (log.userId?.role) === 'admin' ? 'bg-gradient-to-br from-purple-500/10 to-purple-500/20 text-purple-600 border border-purple-200' :
                                                    (log.userId?.role) === 'recruiter' ? 'bg-gradient-to-br from-[#29a08e]/10 to-[#29a08e]/20 text-[#29a08e] border border-[#29a08e]/30' :
                                                        'bg-gradient-to-br from-emerald-500/10 to-emerald-500/20 text-emerald-600 border border-emerald-200'
                                                }`}>
                                                    {(log.userId?.role || 'sys').substring(0, 3)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[14px] font-semibold text-gray-800 leading-snug group-hover:text-gray-900 transition-colors">{log.message}</p>
                                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2">
                                                        <span className="text-[10px] font-bold text-[#29a08e] uppercase tracking-widest bg-[#29a08e]/10 px-2.5 py-0.5 rounded-md">
                                                            {log.type?.replace(/_/g, ' ')}
                                                        </span>
                                                        <span className="text-xs text-gray-400 font-medium">
                                                            by <span className="text-gray-600 font-semibold">{log.userId ? log.userId.fullName : 'System'}</span> ({log.userId?.role || 'System'})
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
                                    <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 border border-gray-100">
                                        <Server className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <p className="font-semibold text-gray-500">No recent activity logs found.</p>
                                    <p className="text-xs text-gray-400 mt-1">Activity will appear here as users interact with the platform.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions / Shortcuts */}
                    <div className="space-y-5">
                        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Quick Actions</h3>
                        <div className="space-y-3">
                            {[
                                { name: 'Manage Users', desc: 'Add, edit, or suspend users', path: '/admin/users', icon: Users, gradient: 'from-blue-500 to-blue-600' },
                                { name: 'Moderate Jobs', desc: 'Review and approve postings', path: '/admin/jobs', icon: Briefcase, gradient: 'from-[#29a08e] to-[#228377]' },
                                { name: 'Verify KYC', desc: 'Secure identity checks', path: '/admin/kyc', icon: ShieldCheck, gradient: 'from-purple-500 to-purple-600' },
                                { name: 'Companies', desc: 'Review organizations', path: '/admin/companies', icon: Building2, gradient: 'from-indigo-500 to-indigo-600' },
                                { name: 'Office Location', desc: 'Update contact info', path: '/admin/location', icon: MapPin, gradient: 'from-orange-500 to-orange-600' },
                                { name: 'Support Inbox', desc: 'Manage contact messages', path: '/admin/contact-messages', icon: MessageSquare, gradient: 'from-cyan-500 to-cyan-600' }
                            ].map((cmd, i) => {
                                const Icon = cmd.icon;
                                return (
                                    <button
                                        key={i}
                                        onClick={() => navigate(cmd.path)}
                                        className="w-full bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#29a08e]/30 hover:-translate-y-0.5 transition-all duration-300 text-left flex items-center gap-4 group"
                                    >
                                        <div className={`h-11 w-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${cmd.gradient} text-white shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                                            <Icon className="h-5 w-5 stroke-[2]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="block text-sm font-bold text-gray-900 group-hover:text-[#29a08e] transition-colors">{cmd.name}</span>
                                            <span className="block text-[11px] font-medium text-gray-400 mt-0.5">{cmd.desc}</span>
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
