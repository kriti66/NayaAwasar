import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Protects routes by role and optionally by KYC status.
 * - allowedRoles: array of roles that can access (e.g. ['job_seeker', 'recruiter'])
 * - requireKYC: if true, job_seeker/recruiter must have kycStatus === 'verified' to access
 */
const ProtectedRoute = ({ allowedRoles, requireKYC = false }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const roleAllowed = allowedRoles && allowedRoles.includes(user.role);
    if (!roleAllowed) {
        return <Navigate to="/unauthorized" replace />;
    }

    // Access control: Job Seeker cannot apply for jobs unless verified; Recruiter cannot post/view applicants unless verified
    if (requireKYC && (user.role === 'job_seeker' || user.role === 'jobseeker' || user.role === 'recruiter')) {
        if (user.kycStatus !== 'verified' && user.kycStatus !== 'approved') {
            return <Navigate to="/kyc" replace />;
        }
    }

    return <Outlet />;
};

export default ProtectedRoute;
