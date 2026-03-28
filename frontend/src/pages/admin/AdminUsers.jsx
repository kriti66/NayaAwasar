import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
    Users,
    Search,
    Trash2,
    UserCheck,
    Shield,
    Briefcase,
    AlertCircle,
    RefreshCw,
    RotateCcw
} from 'lucide-react';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showRemoved, setShowRemoved] = useState(false);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users', {
                params: { includeDeleted: showRemoved ? 'true' : 'false' }
            });
            setUsers(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchUsers();
    }, [showRemoved]);

    const handleDelete = async (id) => {
        if (!window.confirm(
            'Remove this user? They will not be able to sign in. The record is kept and can be restored here, or the user can register again with the same email.'
        )) return;
        try {
            await api.delete(`/admin/users/${id}`);
            await fetchUsers();
            alert('User removed successfully.');
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to remove user.');
        }
    };

    const handleRestore = async (id) => {
        try {
            await api.patch(`/admin/users/${id}/restore`);
            await fetchUsers();
            alert('User restored successfully.');
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to restore user.');
        }
    };

    const filteredUsers = users.filter(u =>
        u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const listForCounts = users.filter((u) => !u.isDeleted);
    const roleCounts = {
        admin: listForCounts.filter(u => u.role === 'admin').length,
        recruiter: listForCounts.filter(u => u.role === 'recruiter').length,
        jobseeker: listForCounts.filter(u => u.role === 'jobseeker' || u.role === 'job_seeker').length,
    };

    const getRoleBadge = (role) => {
        switch (role) {
            case 'admin':
                return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: Shield };
            case 'recruiter':
                return { bg: 'bg-[#29a08e]/10', text: 'text-[#29a08e]', border: 'border-[#29a08e]/20', icon: Briefcase };
            default:
                return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: UserCheck };
        }
    };

    const getAvatarGradient = (role) => {
        switch (role) {
            case 'admin': return 'from-purple-500 to-purple-600';
            case 'recruiter': return 'from-[#29a08e] to-[#228377]';
            default: return 'from-emerald-500 to-emerald-600';
        }
    };

    return (
        <div className="flex-1 w-full min-h-[calc(100vh-64px)]">
            {/* Hero Header */}
            <div className="relative bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] overflow-hidden">
                <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-10 w-10 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                                    <Users className="h-5 w-5 text-blue-400" />
                                </div>
                                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-[0.2em]">User Management</span>
                            </div>
                            <h1 className="text-3xl font-black text-white tracking-tight">Manage Users</h1>
                            <p className="text-gray-400 mt-1.5 font-medium text-sm">Review, manage, and moderate platform members.</p>
                        </div>

                        {/* Role Summary Pills */}
                        <div className="flex items-center gap-3">
                            {[
                                { label: 'Admins', count: roleCounts.admin, color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
                                { label: 'Recruiters', count: roleCounts.recruiter, color: 'bg-[#29a08e]/20 text-[#5eead4] border-[#29a08e]/30' },
                                { label: 'Seekers', count: roleCounts.jobseeker, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
                            ].map((pill, i) => (
                                <div key={i} className={`px-3.5 py-2 rounded-xl border text-xs font-bold ${pill.color}`}>
                                    {pill.count} {pill.label}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 pb-12 relative z-10">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Search Bar */}
                    <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, email, or role..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#29a08e]/30 focus:border-[#29a08e] outline-none transition-all"
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={showRemoved}
                                    onChange={(e) => setShowRemoved(e.target.checked)}
                                    className="rounded border-gray-300 text-[#29a08e] focus:ring-[#29a08e]/30"
                                />
                                <span className="font-medium">Show removed accounts</span>
                            </label>
                            <span className="text-sm font-medium text-gray-400">
                                Showing <span className="text-gray-900 font-bold">{filteredUsers.length}</span> of <span className="text-gray-900 font-bold">{users.length}</span>
                            </span>
                            <button type="button" onClick={() => { setLoading(true); fetchUsers(); }} className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl text-xs font-bold transition-all hover:shadow-sm">
                                <RefreshCw className="h-3.5 w-3.5" />
                                Refresh
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/80 border-b border-gray-100">
                                <tr>
                                    {['User', 'Email', 'Role', 'Actions'].map((head) => (
                                        <th key={head} className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em]">{head}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    [1, 2, 3, 4, 5].map(i => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan="4" className="px-6 py-5">
                                                <div className="h-10 bg-gray-50 rounded-xl w-full"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 border border-gray-100">
                                                    <AlertCircle className="w-7 h-7 text-gray-300" />
                                                </div>
                                                <p className="text-sm font-semibold text-gray-500">No users found</p>
                                                <p className="text-xs text-gray-400 mt-1">Try adjusting your search criteria.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredUsers.map((user) => {
                                    const badge = getRoleBadge(user.role);
                                    const BadgeIcon = badge.icon;
                                    const isRemoved = Boolean(user.isDeleted);
                                    return (
                                        <tr key={user._id} className={`hover:bg-[#29a08e]/[0.02] transition-colors group ${isRemoved ? 'bg-red-50/40' : ''}`}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-10 w-10 bg-gradient-to-br ${getAvatarGradient(user.role)} rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                                                        {user.fullName ? user.fullName.charAt(0).toUpperCase() : '?'}
                                                    </div>
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-sm font-semibold text-gray-900 group-hover:text-[#29a08e] transition-colors">
                                                            {user.fullName || 'Unknown User'}
                                                        </span>
                                                        {isRemoved && (
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">Removed</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-500">{user.email}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold tracking-wide border ${badge.bg} ${badge.text} ${badge.border}`}>
                                                    <BadgeIcon className="w-3 h-3" />
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {isRemoved ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRestore(user._id)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all hover:shadow-sm border border-emerald-100"
                                                    >
                                                        <RotateCcw className="w-3.5 h-3.5" />
                                                        Restore
                                                    </button>
                                                ) : (
                                                    user.role !== 'admin' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDelete(user._id)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all hover:shadow-sm border border-red-100"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            Remove
                                                        </button>
                                                    )
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-xs text-gray-400 font-medium">
                            {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} displayed
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminUsers;
