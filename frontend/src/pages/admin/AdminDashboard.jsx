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
    Building2,
    MapPin,
    MessageSquare,
    CreditCard
} from 'lucide-react';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalJobs: 0,
        activeRecruiters: 0,
        pendingApprovals: 0
    });
    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, activitiesRes] = await Promise.all([
                    api.get('/dashboard/admin/stats'),
                    api.get('/admin/activities').catch(() => ({ data: [] }))
                ]);
                setStats(statsRes.data);
                setActivities(activitiesRes.data || []);
            } catch (error) {
                console.error('Error fetching admin data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const timeAgo = (dateStr) => {
        const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
        if (seconds >= 31536000) return Math.floor(seconds / 31536000) + 'y ago';
        if (seconds >= 2592000) return Math.floor(seconds / 2592000) + 'mo ago';
        if (seconds >= 86400) return Math.floor(seconds / 86400) + 'd ago';
        if (seconds >= 3600) return Math.floor(seconds / 3600) + 'h ago';
        if (seconds >= 60) return Math.floor(seconds / 60) + 'm ago';
        return Math.floor(seconds) + 's ago';
    };

    const quickActions = [
        { name: 'Manage Users', path: '/admin/users', icon: Users },
        { name: 'Manage Jobs', path: '/admin/jobs', icon: Briefcase },
        { name: 'KYC Verification', path: '/admin/kyc', icon: ShieldCheck },
        { name: 'Companies', path: '/admin/companies', icon: Building2 },
        { name: 'Promotion Requests', path: '/admin/promotion-requests', icon: CreditCard },
        { name: 'Contact Messages', path: '/admin/contact-messages', icon: MessageSquare },
        { name: 'Manage Location', path: '/admin/location', icon: MapPin }
    ];

    return (
        <div className="flex-1 w-full min-h-screen bg-slate-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-xl font-semibold text-slate-900">
                        Welcome back, {user?.fullName?.split(' ')[0] || 'Admin'}
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">Platform overview</p>
                </div>

                {/* Stats Row - compact */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Users', value: stats.totalUsers, icon: Users },
                        { label: 'Jobs', value: stats.totalJobs, icon: Briefcase },
                        { label: 'Recruiters', value: stats.activeRecruiters, icon: UserCheck },
                        { label: 'Pending', value: stats.pendingApprovals, icon: Clock }
                    ].map((s, i) => {
                        const Icon = s.icon;
                        return (
                            <div
                                key={i}
                                className="bg-white rounded-lg border border-slate-200 px-4 py-3 flex items-center gap-3"
                            >
                                <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                                    <Icon size={18} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-slate-500">{s.label}</p>
                                    <p className="text-lg font-semibold text-slate-900">
                                        {loading ? '—' : s.value}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Pending Approvals - highlighted */}
                {stats.pendingApprovals > 0 && (
                    <div
                        onClick={() => navigate('/admin/kyc')}
                        className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between cursor-pointer hover:bg-amber-100/80 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                                <Clock size={20} className="text-amber-700" />
                            </div>
                            <div>
                                <p className="font-semibold text-slate-900">{stats.pendingApprovals} pending KYC verification</p>
                                <p className="text-sm text-slate-600">Review and approve verification requests</p>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-slate-400" />
                    </div>
                )}

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Recent Activity */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-slate-900">Recent Activity</h2>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="text-xs font-medium text-slate-500 hover:text-slate-700 flex items-center gap-1"
                                >
                                    <RefreshCw size={14} />
                                    Refresh
                                </button>
                            </div>
                            <div className="h-[320px] overflow-y-auto">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin mb-3" />
                                        <span className="text-sm">Loading...</span>
                                    </div>
                                ) : activities.length > 0 ? (
                                    <ul className="divide-y divide-slate-100">
                                        {activities.map((log) => (
                                            <li
                                                key={log._id}
                                                className="px-4 py-3 hover:bg-slate-50/50"
                                            >
                                                <p className="text-sm text-slate-800">{log.message}</p>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    {log.userId?.fullName || 'System'} · {timeAgo(log.createdAt)}
                                                </p>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                                        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                            <Activity size={24} className="text-slate-400" />
                                        </div>
                                        <p className="text-sm font-medium text-slate-600">No recent activity</p>
                                        <p className="text-xs text-slate-400 mt-1">Activity will appear as users interact with the platform</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div>
                        <h2 className="text-sm font-semibold text-slate-900 mb-3">Quick Actions</h2>
                        <div className="space-y-1">
                            {quickActions.map((action) => {
                                const Icon = action.icon;
                                return (
                                    <button
                                        key={action.path}
                                        onClick={() => navigate(action.path)}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-medium text-slate-700 hover:bg-white hover:border hover:border-slate-200 hover:shadow-sm transition-all"
                                    >
                                        <Icon size={18} className="text-slate-500 shrink-0" />
                                        <span className="flex-1">{action.name}</span>
                                        <ChevronRight size={16} className="text-slate-300 shrink-0" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
