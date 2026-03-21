import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Bell, LogOut, Menu, X, LayoutDashboard, Users, Building2, Briefcase, Megaphone, ShieldCheck, MessageSquare, MapPin } from 'lucide-react';
import api from '../../services/api';

const mobileNavItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Manage Users', path: '/admin/users', icon: Users },
    { label: 'Manage Companies', path: '/admin/companies', icon: Building2 },
    { label: 'Manage Jobs', path: '/admin/jobs', icon: Briefcase },
    { label: 'Promoted Jobs', path: '/admin/promoted-jobs', icon: Megaphone },
    { label: 'KYC Panel', path: '/admin/kyc', icon: ShieldCheck },
    { label: 'Contact Messages', path: '/admin/contact-messages', icon: MessageSquare },
    { label: 'Manage Location', path: '/admin/location', icon: MapPin },
];

const AdminTopbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const dropdownRef = useRef(null);
    const notificationRef = useRef(null);

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data.notifications);
            setUnreadCount(res.data.unreadCount);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location]);

    const markRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) { console.error(err); }
    };

    const markAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsDropdownOpen(false);
            if (notificationRef.current && !notificationRef.current.contains(event.target)) setIsNotificationOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    // Get current page title from the path
    const currentItem = mobileNavItems.find(item =>
        location.pathname === item.path ||
        (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path))
    );
    const pageTitle = currentItem?.label || 'Admin';

    return (
        <>
            <header className="h-16 bg-gray-900 border-b border-gray-800 sticky top-0 z-50 flex items-center px-4 sm:px-6 gap-4 shadow-lg">
                {/* Mobile: logo */}
                <Link
                    to="/admin/dashboard"
                    className="lg:hidden flex items-center gap-2 shrink-0"
                >
                    <div className="bg-[#29a08e] text-white p-1.5 rounded-xl shadow-lg shadow-[#29a08e]/20">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <span className="text-sm font-bold text-white">Naya <span className="text-[#29a08e]">Awasar</span></span>
                </Link>

                {/* Desktop: page breadcrumb */}
                <div className="hidden lg:flex items-center gap-2 flex-1">
                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Admin</span>
                    <span className="text-gray-700 text-xs">/</span>
                    <span className="text-sm font-bold text-white">{pageTitle}</span>
                </div>

                {/* Spacer for mobile */}
                <div className="flex-1 lg:hidden" />

                {/* Right actions */}
                <div className="flex items-center gap-2">
                    {/* Notification bell */}
                    <div className="relative" ref={notificationRef}>
                        <button
                            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                            className={`relative w-9 h-9 flex items-center justify-center rounded-xl transition-all ${isNotificationOpen ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                        >
                            <Bell size={18} />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-gray-900" />
                                </span>
                            )}
                        </button>

                        {isNotificationOpen && (
                            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-gray-900 rounded-2xl shadow-2xl shadow-black/80 border border-gray-800 overflow-hidden z-[60]">
                                <div className="px-5 py-4 border-b border-gray-800 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-sm font-bold text-white">Notifications</h3>
                                        <p className="text-[10px] font-medium text-gray-500 mt-0.5">
                                            {unreadCount} unread
                                        </p>
                                    </div>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllRead}
                                            className="text-[10px] font-bold text-[#29a08e] hover:underline uppercase tracking-widest"
                                        >
                                            Mark all read
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-72 overflow-y-auto custom-scrollbar">
                                    {notifications.length > 0 ? (
                                        notifications.map((notif) => (
                                            <div
                                                key={notif._id}
                                                onClick={() => {
                                                    markRead(notif._id);
                                                    setIsNotificationOpen(false);
                                                    if (notif.link) navigate(notif.link);
                                                }}
                                                className={`px-5 py-4 border-b border-gray-800 hover:bg-gray-800/60 cursor-pointer relative ${!notif.isRead ? 'bg-gray-800/30' : ''}`}
                                            >
                                                {!notif.isRead && (
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#29a08e] to-[#228377]" />
                                                )}
                                                <div className="flex gap-3">
                                                    <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${!notif.isRead ? 'bg-[#29a08e]' : 'bg-transparent'}`} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm ${!notif.isRead ? 'text-white font-bold' : 'text-gray-300 font-semibold'} line-clamp-1`}>
                                                            {notif.title || 'Notification'}
                                                        </p>
                                                        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                                                            {notif.message}
                                                        </p>
                                                    </div>
                                                    <span className="text-[10px] text-gray-600 shrink-0 whitespace-nowrap">
                                                        {new Date(notif.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-10 text-center">
                                            <Bell size={20} className="mx-auto text-gray-700 mb-2" />
                                            <p className="text-gray-500 text-sm font-medium">No notifications</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* User dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-2 pl-3 border-l border-gray-800 group"
                        >
                            <div className="hidden sm:block text-right">
                                <p className="text-xs font-bold text-white leading-tight">{user?.fullName || 'Admin'}</p>
                                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">admin</p>
                            </div>
                            <div className={`w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden border-2 transition-all ${isDropdownOpen ? 'border-[#29a08e]' : 'border-gray-700 group-hover:border-[#29a08e]/50'}`}>
                                {user?.profileImage ? (
                                    <img
                                        src={user.profileImage.startsWith('http') ? user.profileImage : `${import.meta.env.VITE_API_URL}${user.profileImage}`}
                                        alt=""
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                ) : (
                                    <span className="text-xs font-bold text-gray-300">{user?.fullName?.charAt(0) || 'A'}</span>
                                )}
                            </div>
                            <svg className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-[#29a08e]' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-3 w-48 bg-gray-900 rounded-2xl shadow-2xl shadow-black/50 border border-gray-800 py-2 z-[60]">
                                <div className="px-4 py-3 border-b border-gray-800">
                                    <p className="text-sm font-bold text-white">{user?.fullName}</p>
                                    <p className="text-[10px] text-gray-500 mt-0.5">{user?.email}</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full px-4 py-3 flex items-center gap-3 text-rose-500 hover:bg-rose-500/10 transition-colors text-sm font-bold mt-1"
                                >
                                    <div className="w-7 h-7 rounded-lg bg-rose-500/20 flex items-center justify-center">
                                        <LogOut size={14} />
                                    </div>
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu toggle */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all ml-1"
                    >
                        {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>
                </div>
            </header>

            {/* Mobile slide-down nav */}
            {mobileMenuOpen && (
                <div className="lg:hidden fixed inset-x-0 top-16 z-40 bg-gray-900 border-b border-gray-800 shadow-2xl">
                    <nav className="px-4 py-4 space-y-0.5">
                        {mobileNavItems.map((item) => {
                            const isActive = location.pathname === item.path ||
                                (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${isActive ? 'bg-[#29a08e]/15 text-[#29a08e]' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                                >
                                    <item.icon size={18} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            )}
        </>
    );
};

export default AdminTopbar;
