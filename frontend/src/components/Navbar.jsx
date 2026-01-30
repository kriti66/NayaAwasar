import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        window.location.replace('/');
    };

    const isActive = (path) => {
        return location.pathname === path ? "text-gray-900 font-semibold" : "text-gray-500 hover:text-gray-900";
    };

    return (
        <nav className="bg-white shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Left: Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="bg-blue-500 text-white p-1.5 rounded-lg">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <span className="text-2xl font-bold text-blue-500">Naya <span className="text-blue-500">Awasar</span></span>
                        </Link>
                    </div>

                    {/* Center: Navigation Links */}
                    <div className="hidden md:flex space-x-8">
                        <Link to="/" className={isActive('/')}>Home</Link>
                        <Link to="/jobs" className={isActive('/jobs')}>Job Listings</Link>
                        <Link to="/about" className={isActive('/about')}>About Us</Link>
                        <Link to="/contact" className={isActive('/contact')}>Contact Us</Link>
                    </div>

                    {/* Right: Auth Buttons */}
                    <div className="flex items-center space-x-4">
                        {user ? (
                            <div className="flex items-center space-x-4">
                                <span className="text-gray-700 hidden lg:block">Hi, {user.name}</span>
                                <Link
                                    to={
                                        user.role === 'admin' ? '/admin/dashboard' :
                                            user.role === 'recruiter' ? '/recruiter/dashboard' :
                                                '/seeker/dashboard'
                                    }
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                                >
                                    Dashboard
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="text-gray-500 hover:text-gray-700 font-medium"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-6">
                                <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium text-sm">
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-6 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors"
                                >
                                    Register
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
