import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PublicRoute = () => {
    const { loading } = useAuth();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="w-12 h-12 border-4 border-[#29a08e]/30 border-t-[#29a08e] rounded-full animate-spin"></div>
            </div>
        );
    }

    // Public pages are accessible to ALL users (logged in or out)
    return <Outlet />;
};

export default PublicRoute;
