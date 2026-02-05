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
import About from '../pages/public/About';
import Contact from '../pages/public/Contact';
import CompanyProfile from '../pages/shared/CompanyProfile';

// KYC Pages (authenticated, role-based)
import KYCStatus from '../pages/shared/KYC/KYCStatus';
import JobSeekerKYC from '../pages/shared/KYC/JobSeekerKYC';
import RecruiterKYC from '../pages/shared/KYC/RecruiterKYC';

// Dashboards
import SeekerDashboard from '../pages/seeker/SeekerDashboard';
import SeekerApplications from '../pages/seeker/SeekerApplications';
import ProfileManagement from '../pages/seeker/ProfileManagement';
import FindJobs from '../pages/seeker/FindJobs';
import RecruiterDashboard from '../pages/recruiter/RecruiterDashboard';
import RecruiterProfile from '../pages/recruiter/RecruiterProfile';
import PostJob from '../pages/recruiter/PostJob';
import RecruiterJobs from '../pages/recruiter/RecruiterJobs';
import EditJob from '../pages/recruiter/EditJob';
import RecruiterApplicants from '../pages/recruiter/RecruiterApplicants';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminKYCPanel from '../pages/admin/AdminKYCPanel';
import AdminCompanies from '../pages/admin/AdminCompanies';
import AdminCompanyReview from '../pages/admin/AdminCompanyReview';
import AdminLocationManager from '../pages/admin/AdminLocationManager';
import AdminJobs from '../pages/admin/AdminJobs';

const AppRoutes = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/jobs" element={<JobListing />} />
            <Route path="/jobs/:id" element={<JobDetails />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/company/:id" element={<CompanyProfile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* KYC Routes - require login; role determines which form */}
            <Route element={<ProtectedRoute allowedRoles={['jobseeker', 'recruiter', 'admin']} requireKYC={false} />}>
                <Route path="/kyc" element={<KYCStatus />} />
                <Route path="/kyc/status" element={<KYCStatus />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={['jobseeker']} requireKYC={false} />}>
                <Route path="/kyc/job-seeker" element={<JobSeekerKYC />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={['recruiter']} requireKYC={false} />}>
                <Route path="/kyc/recruiter" element={<RecruiterKYC />} />
            </Route>

            {/* Protected Routes - Job Seeker (KYC verified required for full access) */}
            {/* Protected Routes - Job Seeker (KYC verified NOT required for dashboard access) */}
            <Route element={<ProtectedRoute allowedRoles={['job_seeker', 'jobseeker']} requireKYC={false} />}>
                <Route path="/seeker/dashboard" element={<SeekerDashboard />} />
                <Route path="/seeker/applications" element={<SeekerApplications />} />
                <Route path="/seeker/profile" element={<ProfileManagement />} />
                <Route path="/seeker/jobs" element={<FindJobs />} />
            </Route>

            {/* Protected Routes - Recruiter (KYC verified NOT required for dashboard access) */}
            <Route element={<ProtectedRoute allowedRoles={['recruiter']} requireKYC={false} />}>
                <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
                <Route path="/recruiter/company" element={<CompanyProfile />} />
                <Route path="/recruiter/profile" element={<RecruiterProfile />} />
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
                <Route path="/admin/companies" element={<AdminCompanies />} />
                <Route path="/admin/companies/:id" element={<CompanyProfile />} />
                <Route path="/admin/location" element={<AdminLocationManager />} />
                <Route path="/admin/jobs" element={<AdminJobs />} />
            </Route>

            {/* Catch All */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

export default AppRoutes;
