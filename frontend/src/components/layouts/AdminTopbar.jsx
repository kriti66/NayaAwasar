import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, Menu, X, LayoutDashboard, Users, Building2, Briefcase, Megaphone, ShieldCheck, MessageSquare, MapPin, CreditCard, Lock, Quote, UsersRound } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationBell from '../notifications/NotificationBell';
import NotificationDropdown from '../notifications/NotificationDropdown';
import { resolveAssetUrl } from '../../utils/assetUrl';
import ChangePasswordModal from '../profile/ChangePasswordModal';

const mobileNavItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Companies', path: '/admin/companies', icon: Building2 },
    { label: 'Jobs', path: '/admin/jobs', icon: Briefcase },
    { label: 'Promoted Jobs', path: '/admin/promoted-jobs', icon: Megaphone },
    { label: 'Promotion Requests', path: '/admin/promotion-requests', icon: CreditCard },
    { label: 'KYC Panel', path: '/admin/kyc', icon: ShieldCheck },
    { label: 'Contact Messages', path: '/admin/contact-messages', icon: MessageSquare },
    { label: 'Testimonials', path: '/admin/testimonials', icon: Quote },
    { label: 'Team', path: '/admin/team', icon: UsersRound },
    { label: 'Location', path: '/admin/location', icon: MapPin },
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
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const notificationPageLimit = user?.role === 'admin' ? 60 : 20;
    const { notifications, unreadCount, loading, fetchNotifications, markRead, markAllRead } = useNotifications(
        !!user,
        { limit: notificationPageLimit }
    );

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location]);

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

    const currentItem = mobileNavItems.find(item =>
        location.pathname === item.path ||
        (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path))
    );
    const pageTitle = currentItem?.label || 'Admin';

    return (
        <>
            <header className="h-14 bg-white border-b border-slate-200 sticky top-0 z-50 flex items-center px-4 sm:px-6 gap-4">
                <Link to="/admin/dashboard" className="lg:hidden flex items-center gap-2 shrink-0">
                    <div className="h-8 w-8 rounded-lg bg-[#29a08e] flex items-center justify-center">
                        <Briefcase size={16} className="text-white" />
                    </div>
                    <span className="text-sm font-semibold text-slate-900">Naya Awasar</span>
                </Link>

                <div className="hidden lg:flex items-center gap-2 flex-1">
                    <span className="text-xs font-medium text-slate-500">Admin</span>
                    <span className="text-slate-300">/</span>
                    <span className="text-sm font-semibold text-slate-900">{pageTitle}</span>
                </div>

                <div className="flex-1 lg:hidden" />

                <div className="flex items-center gap-1">
                    <div className="relative" ref={notificationRef}>
                        <NotificationBell
                            onClick={() => {
                                setIsNotificationOpen((o) => {
                                    if (!o) fetchNotifications();
                                    return !o;
                                });
                            }}
                            unreadCount={unreadCount}
                            isActive={isNotificationOpen}
                        />
                        <NotificationDropdown
                            isOpen={isNotificationOpen}
                            onClose={() => setIsNotificationOpen(false)}
                            notifications={notifications}
                            unreadCount={unreadCount}
                            loading={loading}
                            markRead={markRead}
                            markAllRead={markAllRead}
                            viewAllLink="/admin/notifications"
                            role={user?.role}
                        />
                    </div>

                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-2 pl-3 border-l border-slate-200"
                        >
                            <div className="hidden sm:block text-right">
                                <p className="text-xs font-semibold text-slate-900">{user?.fullName || 'Admin'}</p>
                                <p className="text-[10px] text-slate-500">Admin</p>
                            </div>
                            <div className={`w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border ${isDropdownOpen ? 'border-slate-400' : 'border-slate-200'}`}>
                                {user?.profileImage ? (
                                    <img
                                        src={resolveAssetUrl(user.profileImage)}
                                        alt=""
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                ) : (
                                    <span className="text-xs font-medium text-slate-600">{user?.fullName?.charAt(0) || 'A'}</span>
                                )}
                            </div>
                            <svg className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-[60]">
                                <div className="px-4 py-3 border-b border-slate-100">
                                    <p className="text-sm font-semibold text-slate-900">{user?.fullName}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsDropdownOpen(false);
                                        setIsChangePasswordOpen(true);
                                    }}
                                    className="w-full px-4 py-2.5 flex items-center gap-2 text-slate-700 hover:bg-slate-50 text-sm font-medium"
                                >
                                    <Lock size={16} />
                                    Change Password
                                </button>
                                <div className="my-1 border-t border-slate-100" />
                                <button
                                    onClick={handleLogout}
                                    className="w-full px-4 py-2.5 flex items-center gap-2 text-red-600 hover:bg-red-50 text-sm font-medium"
                                >
                                    <LogOut size={16} />
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                    >
                        {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>
                </div>
            </header>

            {mobileMenuOpen && (
                <div className="lg:hidden fixed inset-x-0 top-14 z-40 bg-white border-b border-slate-200 shadow-lg">
                    <nav className="px-4 py-3 space-y-0.5">
                        {mobileNavItems.map((item) => {
                            const isActive = location.pathname === item.path ||
                                (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium ${isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                    <item.icon size={18} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            )}
            <ChangePasswordModal
                isOpen={isChangePasswordOpen}
                onClose={() => setIsChangePasswordOpen(false)}
            />
        </>
    );
};

export default AdminTopbar;
