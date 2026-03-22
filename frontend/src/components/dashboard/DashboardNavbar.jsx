import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, Menu, X, User, Building2, Plus } from 'lucide-react';
import api from '../../services/api';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationBell from '../notifications/NotificationBell';
import NotificationDropdown from '../notifications/NotificationDropdown';

const RecruiterNavLinks = [
    { label: 'Dashboard', path: '/recruiter/dashboard' },
    { label: 'Jobs', path: '/recruiter/jobs' },
    { label: 'Applications', path: '/recruiter/applications' },
    { label: 'Promotions', path: '/recruiter/promotions' },
];

const DashboardNavbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const dropdownRef = useRef(null);
    const notificationRef = useRef(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [companyStatus, setCompanyStatus] = useState(null);
    const { notifications, unreadCount, loading, fetchNotifications, markRead, markAllRead } = useNotifications(!!user);

    useEffect(() => {
        if (user?.role === 'recruiter') {
            api.get('/companies/my').then(res => setCompanyStatus(res.data.status)).catch(() => setCompanyStatus(null));
        } else setCompanyStatus(null);
    }, [user]);

    useEffect(() => {
        const fn = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsDropdownOpen(false);
            if (notificationRef.current && !notificationRef.current.contains(e.target)) setIsNotificationOpen(false);
        };
        document.addEventListener('mousedown', fn);
        return () => document.removeEventListener('mousedown', fn);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    const currentRole = user?.role || 'jobseeker';
    const isRecruiter = currentRole === 'recruiter';
    const canPostJob = user?.kycStatus === 'approved' && companyStatus === 'approved';

    const isActive = (path) => {
        if (path === '/recruiter/dashboard') return location.pathname === path;
        return location.pathname.startsWith(path);
    };

    // ─── Recruiter Navbar ───
    if (isRecruiter) {
        return (
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-14 gap-4">
                        {/* Logo */}
                        <Link to="/recruiter/dashboard" className="flex items-center gap-2 shrink-0">
                            <div className="h-8 w-8 rounded-lg bg-[#29a08e] flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <span className="text-lg font-semibold text-slate-900 hidden sm:inline">Naya Awasar</span>
                        </Link>

                        {/* Desktop nav links */}
                        <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
                            {RecruiterNavLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                        isActive(link.path)
                                            ? 'text-slate-900 bg-slate-100'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>

                        {/* Right: CTA + notifications + profile */}
                        <div className="flex items-center gap-2">
                            {canPostJob && (
                                <Link
                                    to="/recruiter/post-job"
                                    className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-[#29a08e] text-white text-sm font-semibold rounded-lg hover:bg-[#238276] transition-colors"
                                >
                                    <Plus size={18} strokeWidth={2.5} />
                                    Post a Job
                                </Link>
                            )}

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
                                    viewAllLink="/recruiter/notifications"
                                />
                            </div>

                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                                >
                                    <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                                        {user?.profileImage ? (
                                            <img
                                                src={user.profileImage.startsWith('http') ? user.profileImage : `${import.meta.env.VITE_API_URL}${user.profileImage}`}
                                                alt=""
                                                className="w-full h-full object-cover"
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        ) : (
                                            <span className="text-sm font-medium text-slate-600">{user?.fullName?.charAt(0) || 'R'}</span>
                                        )}
                                    </div>
                                    <svg className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-[60]">
                                        <div className="px-4 py-2 border-b border-slate-100">
                                            <p className="text-sm font-semibold text-slate-900">{user?.fullName}</p>
                                            <p className="text-xs text-slate-500">{user?.email}</p>
                                        </div>
                                        <Link
                                            to="/recruiter/profile"
                                            onClick={() => setIsDropdownOpen(false)}
                                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                                        >
                                            <User size={16} />
                                            Profile
                                        </Link>
                                        <Link
                                            to="/recruiter/company"
                                            onClick={() => setIsDropdownOpen(false)}
                                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                                        >
                                            <Building2 size={16} />
                                            Company Profile
                                        </Link>
                                        <button
                                            onClick={() => { setIsDropdownOpen(false); handleLogout(); }}
                                            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 mt-1"
                                        >
                                            <LogOut size={16} />
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Mobile menu toggle */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                            >
                                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-slate-200 bg-white">
                        <div className="px-4 py-3 space-y-0.5">
                            {RecruiterNavLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`block px-4 py-2.5 text-sm font-medium rounded-lg ${
                                        isActive(link.path) ? 'bg-slate-100 text-slate-900' : 'text-slate-600'
                                    }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            {canPostJob && (
                                <Link
                                    to="/recruiter/post-job"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-2 px-4 py-2.5 mt-2 bg-[#29a08e] text-white text-sm font-semibold rounded-lg"
                                >
                                    <Plus size={18} />
                                    Post a Job
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </nav>
        );
    }

    // ─── Jobseeker Navbar ───
    const jobseekerLinks = [
        { label: 'Dashboard', path: '/seeker/dashboard' },
        { label: 'Profile', path: '/seeker/profile' },
        { label: 'Applications', path: '/seeker/applications' },
        { label: 'Find Jobs', path: '/seeker/jobs' }
    ];
    const jsActive = (path) => path === '/seeker/dashboard' ? location.pathname === path : location.pathname.startsWith(path);

    return (
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-14 gap-4">
                    <Link to="/seeker/dashboard" className="flex items-center gap-2 shrink-0">
                        <div className="h-8 w-8 rounded-lg bg-[#29a08e] flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <span className="text-lg font-semibold text-slate-900 hidden sm:inline">Naya Awasar</span>
                    </Link>

                    <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
                        {jobseekerLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                    jsActive(link.path) ? 'text-slate-900 bg-slate-100' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
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
                                viewAllLink="/seeker/notifications"
                                transformLink={(link) => (link.startsWith('/jobs/') ? `/jobseeker${link}` : link)}
                            />
                        </div>

                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                                    {user?.profileImage ? (
                                        <img
                                            src={user.profileImage.startsWith('http') ? user.profileImage : `${import.meta.env.VITE_API_URL}${user.profileImage}`}
                                            alt=""
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    ) : (
                                        <span className="text-sm font-medium text-slate-600">{user?.fullName?.charAt(0) || 'J'}</span>
                                    )}
                                </div>
                                <svg className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-[60]">
                                    <div className="px-4 py-2 border-b border-slate-100">
                                        <p className="text-sm font-semibold text-slate-900">{user?.fullName}</p>
                                        <p className="text-xs text-slate-500">{user?.email}</p>
                                    </div>
                                    <Link
                                        to="/seeker/profile"
                                        onClick={() => setIsDropdownOpen(false)}
                                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                                    >
                                        <User size={16} />
                                        Profile
                                    </Link>
                                    <button
                                        onClick={() => { setIsDropdownOpen(false); handleLogout(); }}
                                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 mt-1"
                                    >
                                        <LogOut size={16} />
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                        >
                            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>

                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-slate-200 bg-white">
                        <div className="px-4 py-3 space-y-0.5">
                            {jobseekerLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`block px-4 py-2.5 text-sm font-medium rounded-lg ${
                                        jsActive(link.path) ? 'bg-slate-100 text-slate-900' : 'text-slate-600'
                                    }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default DashboardNavbar;
