import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Public Pages
import Home from '../pages/public/Home';
import Login from '../pages/public/Login';
import Register from '../pages/public/Register';
import Unauthorized from '../pages/public/Unauthorized';
import NotFound from '../pages/public/NotFound';
import JobListing from '../pages/public/JobListing';
import JobDetails from '../pages/public/JobDetails';

// KYC Pages (authenticated, role-based)
import KYCStatus from '../pages/shared/KYC/KYCStatus';
import JobSeekerKYC from '../pages/shared/KYC/JobSeekerKYC';
import RecruiterKYC from '../pages/shared/KYC/RecruiterKYC';

// Dashboards
import SeekerDashboard from '../pages/seeker/SeekerDashboard';
import SeekerApplications from '../pages/seeker/SeekerApplications';
import RecruiterDashboard from '../pages/recruiter/RecruiterDashboard';
import PostJob from '../pages/recruiter/PostJob';
import RecruiterJobs from '../pages/recruiter/RecruiterJobs';
import EditJob from '../pages/recruiter/EditJob';
import RecruiterApplicants from '../pages/recruiter/RecruiterApplicants';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminKYCPanel from '../pages/admin/AdminKYCPanel';

const AppRoutes = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/jobs" element={<JobListing />} />
            <Route path="/jobs/:id" element={<JobDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* KYC Routes - require login; role determines which form */}
            <Route element={<ProtectedRoute allowedRoles={['job_seeker', 'recruiter', 'admin']} requireKYC={false} />}>
                <Route path="/kyc" element={<KYCStatus />} />
                <Route path="/kyc/status" element={<KYCStatus />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={['job_seeker']} requireKYC={false} />}>
                <Route path="/kyc/job-seeker" element={<JobSeekerKYC />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={['recruiter']} requireKYC={false} />}>
                <Route path="/kyc/recruiter" element={<RecruiterKYC />} />
            </Route>

            {/* Protected Routes - Job Seeker (KYC verified required for full access) */}
            <Route element={<ProtectedRoute allowedRoles={['job_seeker', 'jobseeker']} requireKYC />}>
                <Route path="/seeker/dashboard" element={<SeekerDashboard />} />
                <Route path="/seeker/applications" element={<SeekerApplications />} />
            </Route>

            {/* Protected Routes - Recruiter (KYC verified required) */}
            <Route element={<ProtectedRoute allowedRoles={['recruiter']} requireKYC />}>
                <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
                <Route path="/recruiter/post-job" element={<PostJob />} />
                <Route path="/recruiter/jobs" element={<RecruiterJobs />} />
                <Route path="/recruiter/jobs/:id/edit" element={<EditJob />} />
                <Route path="/recruiter/applications" element={<RecruiterApplicants />} />
            </Route>

            {/* Protected Routes - Admin */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/kyc" element={<AdminKYCPanel />} />
            </Route>

            {/* Catch All */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

export default AppRoutes;
