import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PublicRoute = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (user) {
        // Redirect based on role
        if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
        if (user.role === 'recruiter') return <Navigate to="/recruiter/dashboard" replace />;
        return <Navigate to="/seeker/dashboard" replace />;
    }

    return <Outlet />;
};

export default PublicRoute;
