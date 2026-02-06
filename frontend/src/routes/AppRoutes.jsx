import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Layouts
import Layout from '../components/Layout';
import SeekerLayout from '../components/layouts/SeekerLayout';
import RecruiterLayout from '../components/layouts/RecruiterLayout';
import AdminLayout from '../components/layouts/AdminLayout';

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
import JobseekerProfileDashboard from '../pages/seeker/JobseekerProfileDashboard';
import ApplyJob from '../pages/seeker/ApplyJob';
import FindJobs from '../pages/seeker/FindJobs';
import SeekerInterviews from '../pages/seeker/SeekerInterviews';
import RecruiterDashboard from '../pages/recruiter/RecruiterDashboard';
import RecruiterProfile from '../pages/recruiter/RecruiterProfile';
import PostJob from '../pages/recruiter/PostJob';
import RecruiterJobs from '../pages/recruiter/RecruiterJobs';
import EditJob from '../pages/recruiter/EditJob';
import RecruiterApplicants from '../pages/recruiter/RecruiterApplicants';
import JobAnalytics from '../pages/recruiter/JobAnalytics';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminKYCPanel from '../pages/admin/AdminKYCPanel';
import AdminCompanies from '../pages/admin/AdminCompanies';
import AdminLocationManager from '../pages/admin/AdminLocationManager';
import AdminJobs from '../pages/admin/AdminJobs';

const AppRoutes = () => {
    return (
        <Routes>
            {/* Public Routes with Layout */}
            <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/jobs" element={<JobListing />} />
                <Route path="/jobs/:id" element={<JobDetails />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/company/:id" element={<CompanyProfile />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
            </Route>

            {/* KYC Routes - require login */}
            <Route element={<ProtectedRoute allowedRoles={['jobseeker', 'recruiter', 'admin']} requireKYC={false} />}>
                <Route element={<Layout />}>
                    <Route path="/kyc" element={<KYCStatus />} />
                    <Route path="/kyc/status" element={<KYCStatus />} />
                </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['jobseeker']} requireKYC={false} />}>
                <Route element={<Layout />}>
                    <Route path="/kyc/job-seeker" element={<JobSeekerKYC />} />
                </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['recruiter']} requireKYC={false} />}>
                <Route element={<Layout />}>
                    <Route path="/kyc/recruiter" element={<RecruiterKYC />} />
                </Route>
            </Route>

            {/* Protected Routes - Job Seeker */}
            <Route element={<ProtectedRoute allowedRoles={['job_seeker', 'jobseeker']} requireKYC={false} />}>
                <Route element={<SeekerLayout />}>
                    <Route path="/seeker/dashboard" element={<SeekerDashboard />} />
                    <Route path="/seeker/applications" element={<SeekerApplications />} />
                    <Route path="/seeker/profile" element={<JobseekerProfileDashboard />} />
                    <Route path="/seeker/jobs" element={<FindJobs />} />
                    <Route path="/seeker/interviews" element={<SeekerInterviews />} />
                    <Route path="/seeker/company/:id" element={<CompanyProfile />} />
                    <Route path="/jobseeker/jobs/:id" element={<JobDetails />} />
                    <Route path="/apply/:jobId" element={<ApplyJob />} />
                </Route>
            </Route>

            {/* Protected Routes - Recruiter */}
            <Route element={<ProtectedRoute allowedRoles={['recruiter']} requireKYC={false} />}>
                <Route element={<RecruiterLayout />}>
                    <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
                    <Route path="/recruiter/company" element={<CompanyProfile />} />
                    <Route path="/recruiter/profile" element={<RecruiterProfile />} />
                    <Route path="/recruiter/post-job" element={<PostJob />} />
                    <Route path="/recruiter/jobs" element={<RecruiterJobs />} />
                    <Route path="/recruiter/jobs/:id/edit" element={<EditJob />} />
                    <Route path="/recruiter/applications" element={<RecruiterApplicants />} />
                    <Route path="/recruiter/jobs/:jobId/analytics" element={<JobAnalytics />} />
                </Route>
            </Route>

            {/* Protected Routes - Admin */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route element={<AdminLayout />}>
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/admin/users" element={<AdminUsers />} />
                    <Route path="/admin/kyc" element={<AdminKYCPanel />} />
                    <Route path="/admin/companies" element={<AdminCompanies />} />
                    <Route path="/admin/companies/:id" element={<CompanyProfile />} />
                    <Route path="/admin/location" element={<AdminLocationManager />} />
                    <Route path="/admin/jobs" element={<AdminJobs />} />
                </Route>
            </Route>

            {/* Catch All */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

export default AppRoutes;
