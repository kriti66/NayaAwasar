import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/', { replace: true });
    };

    const isActive = (path) => {
        return location.pathname === path ? "text-blue-600 font-semibold" : "text-gray-500 hover:text-blue-600";
    };

    const getDashboardPath = () => {
        if (!user) return '/login';
        switch (user.role) {
            case 'admin': return '/admin/dashboard';
            case 'recruiter': return '/recruiter/dashboard';
            case 'jobseeker': return '/seeker/dashboard';
            case 'job_seeker': return '/seeker/dashboard';
            default: return '/seeker/dashboard';
        }
    };

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Left: Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link to={user ? getDashboardPath() : '/'} className="flex items-center gap-2">
                            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold text-gray-900 tracking-tight">Naya <span className="text-blue-600">Awasar</span></span>
                        </Link>
                    </div>

                    {/* Center: Navigation Links */}
                    <div className="hidden md:flex space-x-8">
                        {[
                            { name: 'Home', path: '/', publicOnly: true },
                            { name: 'Find Jobs', path: '/jobs', publicOnly: false },
                            { name: 'About', path: '/about', publicOnly: false },
                            { name: 'Contact', path: '/contact', publicOnly: false }
                        ].map((item) => {
                            // If user is logged in, hide "Home" (which redirects to dashboard anyway)
                            // or just keep it and let it redirect.
                            // Better UX: Show "Dashboard" instead of Home if logged in?
                            // Actually, let's just hide 'Home' if logged in, as they have 'Dashboard' on the right.
                            if (user && item.publicOnly) return null;

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`text-sm font-medium transition-colors ${isActive(item.path)}`}
                                >
                                    {item.name}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right: Auth Buttons */}
                    <div className="flex items-center space-x-4">
                        {user ? (
                            <div className="flex items-center space-x-4">
                                <span className="text-sm text-gray-500 hidden sm:block">
                                    Hi, {user.fullName?.split(' ')[0] || user.name}
                                </span>
                                <Link
                                    to={getDashboardPath()}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Dashboard
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="text-sm font-medium text-gray-500 hover:text-red-600"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-4">
                                <Link to="/login" className="text-sm font-medium text-gray-500 hover:text-blue-600">
                                    Sign In
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
