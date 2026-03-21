import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, Bell } from 'lucide-react';
import api from '../../services/api';

const DashboardNavbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const dropdownRef = useRef(null);
    const notificationRef = useRef(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Notification State
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data.notifications);
            setUnreadCount(res.data.unreadCount);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
            // Polling for demo purposes (every 30s)
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

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
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setIsNotificationOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    const [companyStatus, setCompanyStatus] = useState(null);

    useEffect(() => {
        if (user?.role === 'recruiter') {
            api.get('/companies/my')
                .then(res => setCompanyStatus(res.data.status))
                .catch(() => setCompanyStatus(null));
        } else {
            setCompanyStatus(null);
        }
    }, [user]);

    const navLinks = {
        admin: [
            { label: 'Dashboard', path: '/admin/dashboard' },
            { label: 'Manage Users', path: '/admin/users' },
            { label: 'Manage Companies', path: '/admin/companies' },
            { label: 'Manage Jobs', path: '/admin/jobs' },
            { label: 'Promoted Jobs', path: '/admin/promoted-jobs' },
            { label: 'KYC Panel', path: '/admin/kyc' },
            { label: 'Contact Messages', path: '/admin/contact-messages' },
            { label: 'Manage Location', path: '/admin/location' },
        ],
        recruiter: [
            { label: 'Dashboard', path: '/recruiter/dashboard' },
            { label: 'Profile', path: '/recruiter/profile' },
            // Only show Post Job if BOTH Recruiter KYC and Company Profile are approved
            ...((user?.kycStatus === 'approved' && companyStatus === 'approved') ? [{ label: 'Post a Job', path: '/recruiter/post-job' }] : []),
            { label: 'My Jobs', path: '/recruiter/jobs' },
            { label: 'Applications', path: '/recruiter/applications' },
            { label: 'Company Profile', path: '/recruiter/company' }
        ],
        jobseeker: [
            { label: 'Dashboard', path: '/seeker/dashboard' },
            { label: 'Profile', path: '/seeker/profile' },
            { label: 'Applications', path: '/seeker/applications' },
            { label: 'Find Jobs', path: '/seeker/jobs' }
        ],
        // Fallback for role 'job_seeker' which is sometimes used alternatively
        job_seeker: [
            { label: 'Dashboard', path: '/seeker/dashboard' },
            { label: 'Profile', path: '/seeker/profile' },
            { label: 'Applications', path: '/seeker/applications' },
            { label: 'Find Jobs', path: '/seeker/jobs' }
        ]
    };

    const currentRole = user?.role || 'jobseeker';
    const links = navLinks[currentRole] || navLinks['jobseeker'];

    return (
        <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Logo */}
                    <Link to={user?.role === 'admin' ? '/admin/dashboard' : user?.role === 'recruiter' ? '/recruiter/dashboard' : '/seeker/dashboard'} className="flex items-center gap-2 group">
                        <div className="bg-[#29a08e] text-white p-2 rounded-xl flex items-center justify-center shadow-lg shadow-[#29a08e]/20 group-hover:scale-105 transition-transform">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold text-white tracking-tight">Naya <span className="text-[#29a08e]">Awasar</span></span>
                    </Link>

                    {/* Nav Links */}
                    <div className="hidden md:flex items-center gap-6 pt-1">
                        {links.map((link) => {
                            const active = location.pathname === link.path;
                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`text-sm font-medium transition-all relative px-3 py-2 rounded-lg ${active ? 'text-white bg-gray-800' : 'text-gray-300 hover:text-white hover:bg-gray-800'}`}
                                >
                                    {link.label}
                                    {active && (
                                        <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-[#29a08e] rounded-full mb-1"></span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right side: Notifications and User Dropdown */}
                    <div className="flex items-center gap-6">
                        {/* Notifications */}
                        <div className="relative" ref={notificationRef}>
                            <button
                                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                                className={`relative w-10 h-10 flex items-center justify-center rounded-xl transition-all ${isNotificationOpen ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                    }`}
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-gray-900"></span>
                                    </span>
                                )}
                            </button>

                            {isNotificationOpen && (
                                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-gray-900 rounded-2xl shadow-2xl shadow-black/80 border border-gray-800 overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="px-5 py-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/95 backdrop-blur-sm">
                                        <div>
                                            <h3 className="text-sm font-bold text-white tracking-wide">Notifications</h3>
                                            <p className="text-[10px] font-medium text-gray-500 mt-0.5">You have {unreadCount} unread messages</p>
                                        </div>
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={markAllRead}
                                                className="text-[10px] font-bold text-[#29a08e] hover:text-[#228377] uppercase tracking-widest hover:underline decoration-[#29a08e]/30 underline-offset-4 transition-all"
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                    </div>

                                    <div className="max-h-[28rem] overflow-y-auto custom-scrollbar">
                                        {notifications.length > 0 ? (
                                            notifications.map((notif) => (
                                                <div
                                                    key={notif._id}
                                                    onClick={() => {
                                                        markRead(notif._id);
                                                        if (notif.link) {
                                                            setIsNotificationOpen(false);
                                                            let targetLink = notif.link;
                                                            if (targetLink.startsWith('/jobs/')) {
                                                                targetLink = `/jobseeker${targetLink}`;
                                                            }
                                                            navigate(targetLink);
                                                        }
                                                    }}
                                                    className={`group px-5 py-4 border-b border-gray-800 hover:bg-gray-800/60 transition-all cursor-pointer relative ${!notif.isRead ? 'bg-gray-800/30' : ''
                                                        }`}
                                                >
                                                    {!notif.isRead && (
                                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#29a08e] to-[#228377]"></div>
                                                    )}

                                                    <div className="flex gap-4">
                                                        <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${!notif.isRead ? 'bg-[#29a08e] shadow-[0_0_8px_rgba(41,160,142,0.6)]' : 'bg-transparent'}`}></div>
                                                        <div className="flex-1 min-w-0"> {/* min-w-0 ensures truncation works */}
                                                            <div className="flex justify-between items-start gap-2 mb-1">
                                                                <h4 className={`text-sm ${!notif.isRead ? 'text-white font-bold' : 'text-gray-300 font-semibold'} line-clamp-1`}>
                                                                    {notif.title || 'Notification'}
                                                                </h4>
                                                                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider shrink-0 whitespace-nowrap">
                                                                    {new Date(notif.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                                </span>
                                                            </div>
                                                            <p className={`text-xs leading-relaxed ${!notif.isRead ? 'text-gray-300' : 'text-gray-500'} line-clamp-2 break-words`}>
                                                                {notif.message}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-12 px-8 text-center">
                                                <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-600">
                                                    <Bell size={20} />
                                                </div>
                                                <p className="text-gray-400 text-sm font-medium">No notifications yet</p>
                                                <p className="text-gray-600 text-xs mt-1">We'll notify you when something important happens.</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-2 border-t border-gray-800 bg-gray-900/90 backdrop-blur-sm">
                                        <Link
                                            to={`/${(currentRole === 'jobseeker' || currentRole === 'job_seeker') ? 'seeker' : currentRole}/notifications`}
                                            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-gray-800 transition-all uppercase tracking-wide group"
                                            onClick={() => setIsNotificationOpen(false)}
                                        >
                                            View All Notification
                                            <svg className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                            </svg>
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="relative" ref={dropdownRef}>
                            <div
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-3 pl-6 border-l border-gray-800 group cursor-pointer"
                            >
                                <div className="text-right hidden sm:block">
                                    <p className="text-xs font-bold text-white">{user?.fullName || 'User'}</p>
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{user?.role || 'Guest'}</p>
                                </div>
                                <div className={`w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden border-2 transition-all ${isDropdownOpen ? 'border-[#29a08e] shadow-md shadow-[#29a08e]/20' : 'border-gray-700 group-hover:border-[#29a08e]/50'}`}>
                                    {user?.profileImage ? (
                                        <img
                                            src={user.profileImage.startsWith('http') ? user.profileImage : `${import.meta.env.VITE_API_URL}${user.profileImage}`}
                                            alt=""
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    ) : (
                                        <span className="text-xs font-bold text-gray-400">{user?.fullName?.charAt(0) || 'U'}</span>
                                    )}
                                </div>
                                <svg className={`w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-all duration-300 ${isDropdownOpen ? 'rotate-180 text-[#29a08e]' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-3 w-48 bg-gray-900 rounded-2xl shadow-2xl shadow-black/50 border border-gray-800 py-2 z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="px-4 py-3 border-b border-gray-800">
                                        <p className="text-sm font-bold text-white">My Account</p>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full px-4 py-3 flex items-center gap-3 text-rose-500 hover:bg-rose-500/10 transition-colors text-sm font-bold mt-1"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center">
                                            <LogOut size={16} />
                                        </div>
                                        <span>Logout</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default DashboardNavbar;
