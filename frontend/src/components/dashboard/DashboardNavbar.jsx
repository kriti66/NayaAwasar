import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut } from 'lucide-react';

const DashboardNavbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const dropdownRef = useRef(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    const navLinks = {
        admin: [
            { label: 'Dashboard', path: '/admin/dashboard' },
            { label: 'Manage Users', path: '/admin/users' },
            { label: 'Manage Companies', path: '/admin/companies' },
            { label: 'Manage Jobs', path: '/admin/jobs' },
            { label: 'KYC Panel', path: '/admin/kyc' },
            { label: 'Manage Location', path: '/admin/location' },
        ],
        recruiter: [
            { label: 'Dashboard', path: '/recruiter/dashboard' },
            { label: 'Profile', path: '/recruiter/profile' },
            { label: 'Post a Job', path: '/recruiter/post-job' },
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
                    <div className="flex items-center gap-12">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="bg-blue-600 text-white p-2 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold text-white tracking-tight">Naya <span className="text-blue-500">Awasar</span></span>
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
                                            <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full mb-1"></span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <button className="relative w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-gray-900"></span>
                        </button>

                        <div className="relative" ref={dropdownRef}>
                            <div
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-3 pl-6 border-l border-gray-800 group cursor-pointer"
                            >
                                <div className="text-right hidden sm:block">
                                    <p className="text-xs font-bold text-white">{user?.fullName || 'User'}</p>
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{user?.role || 'Guest'}</p>
                                </div>
                                <div className={`w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden border-2 transition-all ${isDropdownOpen ? 'border-blue-500 shadow-md shadow-blue-500/20' : 'border-gray-700 group-hover:border-blue-500/50'}`}>
                                    {user?.avatar ? (
                                        <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xs font-bold text-gray-400">{user?.fullName?.charAt(0) || 'U'}</span>
                                    )}
                                </div>
                                <svg className={`w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-all duration-300 ${isDropdownOpen ? 'rotate-180 text-blue-500' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
