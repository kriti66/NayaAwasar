import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = () => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#29a08e]" />
            </div>
        );
    }

    if (!user) {
        const from = `${location.pathname}${location.search || ''}`;
        return <Navigate to="/login" replace state={{ from }} />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
