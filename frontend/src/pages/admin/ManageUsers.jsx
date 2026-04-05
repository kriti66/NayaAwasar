import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Users, Search, Shield, Briefcase, UserCheck, AlertCircle, RefreshCw, X } from 'lucide-react';

const ROLE_FILTERS = [
    { key: 'all', label: 'ALL' },
    { key: 'jobseeker', label: 'JOBSEEKER' },
    { key: 'recruiter', label: 'RECRUITER' },
    { key: 'admin', label: 'ADMIN' }
];

const ACTION_MENU_MIN_WIDTH = 176;

function formatJoined(d) {
    if (!d) return '—';
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function displayName(u) {
    return u.name || u.fullName || 'Unknown User';
}

function avatarUrl(profileImage) {
    if (!profileImage) return null;
    const s = String(profileImage);
    if (s.startsWith('http')) return s;
    return `${API_BASE_URL}${s}`;
}

function accountStatus(u) {
    if (u.isRemoved) return 'removed';
    if (u.isSuspended) return 'suspended';
    return 'active';
}

function kycLabel(status) {
    const s = String(status || 'not_submitted').toLowerCase();
    if (s === 'approved') return { text: 'Verified', className: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    if (s === 'pending') return { text: 'Pending', className: 'bg-amber-50 text-amber-800 border-amber-200' };
    if (s === 'rejected' || s === 'resubmission_locked') {
        return { text: s === 'rejected' ? 'Rejected' : 'Locked', className: 'bg-orange-50 text-orange-800 border-orange-200' };
    }
    return { text: 'Not Submitted', className: 'bg-gray-100 text-gray-600 border-gray-200' };
}

const ManageUsers = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showRemoved, setShowRemoved] = useState(false);
    const [roleFilter, setRoleFilter] = useState('all');
    const [viewUser, setViewUser] = useState(null);
    const [suspendTarget, setSuspendTarget] = useState(null);
    const [suspendReason, setSuspendReason] = useState('');
    const [actionMenu, setActionMenu] = useState(null);

    const isSelf = useCallback(
        (id) => String(id) === String(currentUser?.id),
        [currentUser?.id]
    );

    const fetchUsers = useCallback(async () => {
        try {
            const qs = new URLSearchParams();
            qs.set('showRemoved', showRemoved ? 'true' : 'false');
            qs.set('role', roleFilter);
            const res = await api.get(`/admin/users?${qs.toString()}`);
            setUsers(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to load users.');
        } finally {
            setLoading(false);
        }
    }, [showRemoved, roleFilter]);

    useEffect(() => {
        setLoading(true);
        fetchUsers();
    }, [fetchUsers]);

    useEffect(() => {
        if (!actionMenu) return;
        const onKey = (e) => {
            if (e.key === 'Escape') setActionMenu(null);
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [actionMenu]);

    const filteredUsers = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return users;
        return users.filter(
            (u) =>
                displayName(u).toLowerCase().includes(q) ||
                (u.email || '').toLowerCase().includes(q) ||
                (u.role || '').toLowerCase().includes(q)
        );
    }, [users, searchTerm]);

    const roleCounts = useMemo(() => {
        const activeOnly = users.filter((u) => !u.isRemoved);
        return {
            admin: activeOnly.filter((u) => u.role === 'admin').length,
            recruiter: activeOnly.filter((u) => u.role === 'recruiter').length,
            jobseeker: activeOnly.filter((u) => u.role === 'jobseeker' || u.role === 'job_seeker').length
        };
    }, [users]);

    const menuUser = actionMenu ? users.find((u) => String(u._id) === actionMenu.userId) : null;

    useEffect(() => {
        if (actionMenu && !menuUser) setActionMenu(null);
    }, [actionMenu, menuUser]);

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
            case 'admin':
                return 'from-purple-500 to-purple-600';
            case 'recruiter':
                return 'from-[#29a08e] to-[#228377]';
            default:
                return 'from-emerald-500 to-emerald-600';
        }
    };

    const handleRemove = async (id) => {
        if (
            !window.confirm(
                'Remove this user? They will not be able to sign in. The record is kept and can be restored from this page.'
            )
        ) {
            return;
        }
        try {
            await api.put(`/admin/users/${id}/remove`);
            toast.success('User removed successfully.');
            await fetchUsers();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to remove user.');
        }
    };

    const handleRestore = async (id) => {
        try {
            await api.put(`/admin/users/${id}/restore`);
            toast.success('User restored successfully.');
            await fetchUsers();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to restore user.');
        }
    };

    const handleSuspendSubmit = async () => {
        if (!suspendTarget) return;
        try {
            await api.put(`/admin/users/${suspendTarget._id}/suspend`, {
                reason: suspendReason.trim()
            });
            toast.success('User suspended successfully.');
            setSuspendTarget(null);
            setSuspendReason('');
            await fetchUsers();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to suspend user.');
        }
    };

    const handleActivate = async (id) => {
        try {
            await api.put(`/admin/users/${id}/activate`);
            toast.success('User activated successfully.');
            await fetchUsers();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to activate user.');
        }
    };

    const statusBadge = (u) => {
        const s = accountStatus(u);
        if (s === 'removed') {
            return (
                <span className="inline-flex px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide border bg-red-50 text-red-700 border-red-200">
                    Removed
                </span>
            );
        }
        if (s === 'suspended') {
            return (
                <span className="inline-flex px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide border bg-orange-50 text-orange-800 border-orange-200">
                    Suspended
                </span>
            );
        }
        return (
            <span className="inline-flex px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide border bg-emerald-50 text-emerald-800 border-emerald-200">
                Active
            </span>
        );
    };

    const viewModalStatus = (u) => {
        const s = accountStatus(u);
        if (s === 'removed') return 'Removed';
        if (s === 'suspended') return 'Suspended';
        return 'Active';
    };

    const kycBadgeEl = (u) => {
        const { text, className } = kycLabel(u.kycStatus);
        return (
            <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide border ${className}`}>
                {text}
            </span>
        );
    };

    const closeActionMenu = () => setActionMenu(null);

    const actionMenuPosition =
        actionMenu && typeof window !== 'undefined'
            ? {
                  top: actionMenu.top,
                  left: Math.min(
                      Math.max(8, actionMenu.right - ACTION_MENU_MIN_WIDTH),
                      window.innerWidth - ACTION_MENU_MIN_WIDTH - 8
                  )
              }
            : { top: 0, left: 0 };

    const menuItemClass =
        'flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold transition-colors rounded-lg mx-1';

    return (
        <div className="flex-1 w-full min-h-[calc(100vh-64px)]">
            <div className="relative bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] overflow-hidden">
                <div
                    className="absolute inset-0 opacity-[0.07]"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)',
                        backgroundSize: '32px 32px'
                    }}
                />
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-10 w-10 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                                    <Users className="h-5 w-5 text-blue-400" />
                                </div>
                                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-[0.2em]">
                                    User Management
                                </span>
                            </div>
                            <h1 className="text-3xl font-black text-white tracking-tight">Manage Users</h1>
                            <p className="text-gray-400 mt-1.5 font-medium text-sm">
                                Review, suspend, restore, and moderate platform members.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            {[
                                { label: 'Admins', count: roleCounts.admin, color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
                                { label: 'Recruiters', count: roleCounts.recruiter, color: 'bg-[#29a08e]/20 text-[#5eead4] border-[#29a08e]/30' },
                                { label: 'Seekers', count: roleCounts.jobseeker, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' }
                            ].map((pill) => (
                                <div key={pill.label} className={`px-3.5 py-2 rounded-xl border text-xs font-bold ${pill.color}`}>
                                    {pill.count} {pill.label}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 pb-12 relative z-10">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 space-y-4">
                        <div className="flex flex-wrap gap-2">
                            {ROLE_FILTERS.map((rf) => {
                                const active = roleFilter === rf.key;
                                return (
                                    <button
                                        key={rf.key}
                                        type="button"
                                        onClick={() => setRoleFilter(rf.key)}
                                        className={
                                            active
                                                ? 'px-4 py-2 rounded-xl text-xs font-bold bg-[#29a08e] text-white shadow-sm transition-all'
                                                : 'px-4 py-2 rounded-xl text-xs font-bold border-2 border-gray-200 text-gray-600 hover:border-[#29a08e]/40 hover:text-[#29a08e] transition-all'
                                        }
                                    >
                                        {rf.label}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
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
                                    Showing{' '}
                                    <span className="text-gray-900 font-bold">{filteredUsers.length}</span> of{' '}
                                    <span className="text-gray-900 font-bold">{users.length}</span>
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setLoading(true);
                                        fetchUsers();
                                    }}
                                    className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl text-xs font-bold transition-all hover:shadow-sm"
                                >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                    Refresh
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[960px]">
                            <thead className="bg-gray-50/80 border-b border-gray-100">
                                <tr>
                                    {['User', 'Email', 'Role', 'Status', 'KYC', 'Joined', 'Actions'].map((head) => (
                                        <th
                                            key={head}
                                            className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em]"
                                        >
                                            {head}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    [1, 2, 3, 4, 5].map((i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={7} className="px-6 py-5">
                                                <div className="h-10 bg-gray-50 rounded-xl w-full" />
                                            </td>
                                        </tr>
                                    ))
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 border border-gray-100">
                                                    <AlertCircle className="w-7 h-7 text-gray-300" />
                                                </div>
                                                <p className="text-sm font-semibold text-gray-500">No users found</p>
                                                <p className="text-xs text-gray-400 mt-1">Try adjusting filters or search.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => {
                                        const badge = getRoleBadge(user.role);
                                        const BadgeIcon = badge.icon;
                                        const removed = user.isRemoved;
                                        const suspended = user.isSuspended;
                                        const img = avatarUrl(user.profileImage);
                                        const uid = String(user._id);
                                        const menuOpen = actionMenu?.userId === uid;
                                        return (
                                            <tr
                                                key={user._id}
                                                className={`transition-colors group ${
                                                    removed
                                                        ? 'bg-gray-50/80 opacity-75'
                                                        : 'hover:bg-[#29a08e]/[0.02]'
                                                }`}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        {img ? (
                                                            <img
                                                                src={img}
                                                                alt=""
                                                                className="h-10 w-10 rounded-xl object-cover border border-gray-100 shadow-sm"
                                                            />
                                                        ) : (
                                                            <div
                                                                className={`h-10 w-10 bg-gradient-to-br ${getAvatarGradient(user.role)} rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm`}
                                                            >
                                                                {displayName(user).charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <span
                                                            className={`text-sm font-semibold ${
                                                                removed
                                                                    ? 'text-gray-500 line-through'
                                                                    : 'text-gray-900 group-hover:text-[#29a08e]'
                                                            } transition-colors`}
                                                        >
                                                            {displayName(user)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`text-sm ${removed ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        {user.email}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold tracking-wide border ${badge.bg} ${badge.text} ${badge.border}`}
                                                    >
                                                        <BadgeIcon className="w-3 h-3" />
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">{statusBadge(user)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{kycBadgeEl(user)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`text-sm ${removed ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        {formatJoined(user.createdAt)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <button
                                                        type="button"
                                                        aria-expanded={menuOpen}
                                                        aria-haspopup="menu"
                                                        aria-label="User actions"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                            setActionMenu((cur) =>
                                                                cur?.userId === uid
                                                                    ? null
                                                                    : {
                                                                          userId: uid,
                                                                          top: rect.bottom + 6,
                                                                          right: rect.right
                                                                      }
                                                            );
                                                        }}
                                                        className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border text-lg font-bold leading-none transition-all ${
                                                            menuOpen
                                                                ? 'border-[#29a08e] bg-[#29a08e]/10 text-[#29a08e] shadow-sm'
                                                                : 'border-gray-200 bg-white text-gray-600 hover:border-[#29a08e]/40 hover:bg-gray-50 hover:text-[#29a08e]'
                                                        }`}
                                                    >
                                                        ⋯
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-xs text-gray-400 font-medium">
                            {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} displayed
                        </p>
                    </div>
                </div>
            </main>

            {actionMenu &&
                menuUser &&
                createPortal(
                    <>
                        <div
                            className="fixed inset-0 z-[140]"
                            aria-hidden
                            onMouseDown={closeActionMenu}
                        />
                        <div
                            role="menu"
                            className="fixed z-[150] min-w-[11rem] rounded-xl border border-gray-200 bg-white py-1 shadow-xl ring-1 ring-black/5"
                            style={{
                                top: actionMenuPosition.top,
                                left: actionMenuPosition.left
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <button
                                type="button"
                                role="menuitem"
                                className={`${menuItemClass} text-gray-700 hover:bg-gray-50`}
                                onClick={() => {
                                    closeActionMenu();
                                    setViewUser(menuUser);
                                }}
                            >
                                <span aria-hidden>👁️</span> View
                            </button>
                            {!menuUser.isRemoved && !menuUser.isSuspended && menuUser.role !== 'admin' && (
                                <button
                                    type="button"
                                    role="menuitem"
                                    disabled={isSelf(menuUser._id)}
                                    className={`${menuItemClass} text-orange-800 hover:bg-orange-50 disabled:pointer-events-none disabled:opacity-40`}
                                    onClick={() => {
                                        closeActionMenu();
                                        setSuspendTarget(menuUser);
                                        setSuspendReason('');
                                    }}
                                >
                                    <span aria-hidden>🚫</span> Suspend
                                </button>
                            )}
                            {!menuUser.isRemoved && menuUser.isSuspended && (
                                <button
                                    type="button"
                                    role="menuitem"
                                    disabled={isSelf(menuUser._id)}
                                    className={`${menuItemClass} text-emerald-800 hover:bg-emerald-50 disabled:pointer-events-none disabled:opacity-40`}
                                    onClick={() => {
                                        closeActionMenu();
                                        handleActivate(menuUser._id);
                                    }}
                                >
                                    <span aria-hidden>✅</span> Activate
                                </button>
                            )}
                            {!menuUser.isRemoved && menuUser.role !== 'admin' && (
                                <button
                                    type="button"
                                    role="menuitem"
                                    disabled={isSelf(menuUser._id)}
                                    className={`${menuItemClass} text-red-600 hover:bg-red-50 disabled:pointer-events-none disabled:opacity-40`}
                                    onClick={() => {
                                        closeActionMenu();
                                        handleRemove(menuUser._id);
                                    }}
                                >
                                    <span aria-hidden>🗑️</span> Remove
                                </button>
                            )}
                            {menuUser.isRemoved && (
                                <button
                                    type="button"
                                    role="menuitem"
                                    className={`${menuItemClass} text-blue-700 hover:bg-blue-50`}
                                    onClick={() => {
                                        closeActionMenu();
                                        handleRestore(menuUser._id);
                                    }}
                                >
                                    <span aria-hidden>🔄</span> Restore
                                </button>
                            )}
                        </div>
                    </>,
                    document.body
                )}

            {/* View modal */}
            {viewUser && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                    role="dialog"
                    aria-modal="true"
                    onClick={() => setViewUser(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-md w-full p-6 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setViewUser(null)}
                            className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-lg font-black text-gray-900 pr-8">User details</h2>
                        <dl className="mt-4 space-y-3 text-sm">
                            <div>
                                <dt className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Name</dt>
                                <dd className="font-semibold text-gray-900 mt-0.5">{displayName(viewUser)}</dd>
                            </div>
                            <div>
                                <dt className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Email</dt>
                                <dd className="text-gray-700 mt-0.5">{viewUser.email}</dd>
                            </div>
                            <div>
                                <dt className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Role</dt>
                                <dd className="text-gray-700 mt-0.5 capitalize">{viewUser.role}</dd>
                            </div>
                            <div>
                                <dt className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</dt>
                                <dd className="mt-0.5">{viewModalStatus(viewUser)}</dd>
                            </div>
                            <div>
                                <dt className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">KYC status</dt>
                                <dd className="mt-0.5">{kycLabel(viewUser.kycStatus).text}</dd>
                            </div>
                            <div>
                                <dt className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Joined</dt>
                                <dd className="text-gray-700 mt-0.5">{formatJoined(viewUser.createdAt)}</dd>
                            </div>
                            {viewUser.isSuspended && viewUser.suspendReason ? (
                                <div>
                                    <dt className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                        Suspend reason
                                    </dt>
                                    <dd className="text-gray-700 mt-0.5 whitespace-pre-wrap">{viewUser.suspendReason}</dd>
                                </div>
                            ) : null}
                        </dl>
                    </div>
                </div>
            )}

            {/* Suspend modal */}
            {suspendTarget && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                    role="dialog"
                    aria-modal="true"
                    onClick={() => {
                        setSuspendTarget(null);
                        setSuspendReason('');
                    }}
                >
                    <div
                        className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-sm w-full p-5 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-base font-black text-gray-900">Suspend user</h2>
                        <p className="text-xs text-gray-500 mt-1">
                            {displayName(suspendTarget)} — optional reason shown to admins only.
                        </p>
                        <textarea
                            value={suspendReason}
                            onChange={(e) => setSuspendReason(e.target.value)}
                            rows={4}
                            placeholder="Reason for suspension…"
                            className="mt-3 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#29a08e]/30 focus:border-[#29a08e] outline-none resize-y min-h-[96px]"
                        />
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setSuspendTarget(null);
                                    setSuspendReason('');
                                }}
                                className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSuspendSubmit}
                                className="px-4 py-2 text-xs font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-700"
                            >
                                Confirm suspend
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageUsers;
