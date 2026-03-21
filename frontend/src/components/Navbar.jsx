import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [location]);

    const handleLogout = () => {
        logout();
        navigate('/', { replace: true });
    };

    const isActive = (path) =>
        location.pathname === path ? 'text-[#29a08e] font-semibold' : 'text-gray-500 hover:text-gray-900';

    const getDashboardPath = () => {
        if (!user) return '/login';
        switch (user.role) {
            case 'admin': return '/admin/dashboard';
            case 'recruiter': return '/recruiter/dashboard';
            case 'jobseeker':
            case 'job_seeker':
            default: return '/seeker/dashboard';
        }
    };

    const navLinks = [
        { name: 'Home', path: '/', publicOnly: true },
        { name: 'Find Jobs', path: '/jobs', publicOnly: false },
        { name: 'About', path: '/about', publicOnly: false },
        { name: 'Contact', path: '/contact', publicOnly: false },
    ];

    return (
        <>
            <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled || mobileOpen ? 'bg-white shadow-lg border-b border-gray-100' : 'bg-white/95 backdrop-blur-md border-b border-gray-100'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">

                        {/* Logo */}
                        <Link to={user ? getDashboardPath() : '/'} className="flex items-center gap-2.5 group shrink-0">
                            <div className="w-9 h-9 bg-[#29a08e] text-white rounded-xl flex items-center justify-center shadow-md shadow-[#29a08e]/20 group-hover:scale-105 transition-transform">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <span className="text-xl font-black text-gray-900 tracking-tight">
                                Naya <span className="text-[#29a08e]">Awasar</span>
                            </span>
                        </Link>

                        {/* Desktop Nav Links */}
                        <div className="hidden md:flex items-center space-x-1">
                            {navLinks.map((item) => {
                                if (user && item.publicOnly) return null;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${isActive(item.path)}`}
                                    >
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Desktop Auth Buttons */}
                        <div className="hidden md:flex items-center gap-3">
                            {user ? (
                                <>
                                    <span className="text-sm text-gray-500 hidden lg:block">
                                        Hi, <span className="font-semibold text-gray-700">{user.fullName?.split(' ')[0] || user.name}</span>
                                    </span>
                                    <Link
                                        to={getDashboardPath()}
                                        className="px-4 py-2 text-sm font-bold text-white bg-[#29a08e] rounded-xl hover:bg-[#228377] transition-colors shadow-sm shadow-[#29a08e]/20"
                                    >
                                        Dashboard
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="px-4 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all"
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="px-5 py-2 text-sm font-bold text-white bg-[#29a08e] rounded-xl hover:bg-[#228377] transition-all shadow-md shadow-[#29a08e]/20 hover:shadow-lg hover:shadow-[#29a08e]/30"
                                    >
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
                            aria-label="Toggle Menu"
                        >
                            {mobileOpen ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileOpen && (
                    <div className="md:hidden border-t border-gray-100 bg-white animate-fade-in">
                        <div className="px-4 py-4 space-y-1">
                            {navLinks.map((item) => {
                                if (user && item.publicOnly) return null;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors ${location.pathname === item.path ? 'bg-[#29a08e]/10 text-[#29a08e]' : 'text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        {item.name}
                                    </Link>
                                );
                            })}

                            <div className="pt-3 border-t border-gray-100 space-y-2">
                                {user ? (
                                    <>
                                        <Link
                                            to={getDashboardPath()}
                                            className="flex justify-center w-full px-4 py-3 text-sm font-bold text-white bg-[#29a08e] rounded-xl hover:bg-[#228377] transition-colors"
                                        >
                                            Dashboard
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="flex justify-center w-full px-4 py-3 text-sm font-medium text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                                        >
                                            Logout
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            to="/login"
                                            className="flex justify-center w-full px-4 py-3 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                                        >
                                            Sign In
                                        </Link>
                                        <Link
                                            to="/register"
                                            className="flex justify-center w-full px-4 py-3 text-sm font-bold text-white bg-[#29a08e] rounded-xl hover:bg-[#228377] transition-colors"
                                        >
                                            Get Started Free
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </nav>
        </>
    );
};

export default Navbar;
