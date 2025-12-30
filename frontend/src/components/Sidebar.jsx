import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path ? "bg-gray-900 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white";
    };

    const navItems = {
        admin: [
            { name: 'Dashboard', path: '/admin/dashboard' },
            { name: 'Manage Users', path: '/admin/users' },
            { name: 'Manage Jobs', path: '/admin/jobs' },
        ],
        recruiter: [
            { name: 'Dashboard', path: '/recruiter/dashboard' },
            { name: 'Post a Job', path: '/recruiter/post-job' },
            { name: 'My Jobs', path: '/recruiter/jobs' },
            { name: 'Applications', path: '/recruiter/applications' },
        ],
        jobseeker: [
            { name: 'Dashboard', path: '/seeker/dashboard' },
            { name: 'My Profile', path: '/seeker/profile' },
            { name: 'Applied Jobs', path: '/seeker/applications' },
            { name: 'Saved Jobs', path: '/seeker/saved-jobs' },
        ],
    };

    const role = user?.role || 'jobseeker'; // Fallback if role is not strictly defined yet
    const items = navItems[role] || [];

    return (
        <div className="flex flex-col w-64 bg-gray-800 min-h-screen">
            <div className="flex items-center justify-center h-16 bg-gray-900">
                <span className="text-white text-2xl font-semibold">Dashboard</span>
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto">
                <nav className="flex-1 px-2 py-4 space-y-1">
                    {items.map((item) => (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`${isActive(item.path)} group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                        >
                            {item.name}
                        </Link>
                    ))}
                </nav>
            </div>
            <div className="p-4 border-t border-gray-700">
                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
