import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const GuestOnlyRoute = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="w-12 h-12 border-4 border-[#29a08e]/30 border-t-[#29a08e] rounded-full animate-spin"></div>
            </div>
        );
    }

    if (user) {
        // Redirect based on role if they try to access guest-only auth pages (login, register, home, etc.)
        if (import.meta.env?.DEV) {
            console.debug('[GuestOnlyRoute] Redirecting logged-in user to dashboard:', user.role, '→', { admin: '/admin/dashboard', recruiter: '/recruiter/dashboard', jobseeker: '/seeker/dashboard' }[user.role] || '/seeker/dashboard');
        }
        if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
        if (user.role === 'recruiter') return <Navigate to="/recruiter/dashboard" replace />;
        return <Navigate to="/seeker/dashboard" replace />;
    }

    return <Outlet />;
};

export default GuestOnlyRoute;
