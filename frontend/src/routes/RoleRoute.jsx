import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RoleRoute = ({ allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
        );
    }

    // Double check auth (though PrivateRoute should handle it)
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const userRole = user.role || 'jobseeker'; // Default fallback
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    // Normalize role check (handle job_seeker vs jobseeker inconsistency if any)
    const normalizedRole = userRole === 'job_seeker' ? 'jobseeker' : userRole;
    const normalizedAllowed = roles.map(r => r === 'job_seeker' ? 'jobseeker' : r);

    if (!normalizedAllowed.includes(normalizedRole)) {
        // Redirect to their appropriate dashboard if unauthorized
        if (normalizedRole === 'admin') return <Navigate to="/admin/dashboard" replace />;
        if (normalizedRole === 'recruiter') return <Navigate to="/recruiter/dashboard" replace />;
        return <Navigate to="/seeker/dashboard" replace />;
    }

    return <Outlet />;
};

export default RoleRoute;
