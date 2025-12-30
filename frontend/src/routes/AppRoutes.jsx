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

// Dashboards
import SeekerDashboard from '../pages/seeker/SeekerDashboard';
import SeekerProfile from '../pages/seeker/SeekerProfile';
import SeekerApplications from '../pages/seeker/SeekerApplications';
import RecruiterDashboard from '../pages/recruiter/RecruiterDashboard';
import PostJob from '../pages/recruiter/PostJob';
import RecruiterJobs from '../pages/recruiter/RecruiterJobs';
import EditJob from '../pages/recruiter/EditJob';
import RecruiterApplicants from '../pages/recruiter/RecruiterApplicants';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminUsers from '../pages/admin/AdminUsers';

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

            {/* Protected Routes - Job Seeker */}
            <Route element={<ProtectedRoute allowedRoles={['jobseeker']} />}>
                <Route path="/seeker/dashboard" element={<SeekerDashboard />} />
                <Route path="/seeker/profile" element={<SeekerProfile />} />
                <Route path="/seeker/applications" element={<SeekerApplications />} />
            </Route>

            {/* Protected Routes - Recruiter */}
            <Route element={<ProtectedRoute allowedRoles={['recruiter']} />}>
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
            </Route>

            {/* Catch All */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

export default AppRoutes;
