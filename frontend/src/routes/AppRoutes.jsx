import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import GuestOnlyRoute from './GuestOnlyRoute';
import RoleRoute from './RoleRoute';

// Layouts
import PublicLayout from '../components/layouts/PublicLayout';
import SeekerLayout from '../components/layouts/SeekerLayout';
import RecruiterLayout from '../components/layouts/RecruiterLayout';
import AdminLayout from '../components/layouts/AdminLayout';
import KycLayout from '../components/layouts/KycLayout';
import DashboardNavbar from '../components/dashboard/DashboardNavbar';
import GlobalFooter from '../components/GlobalFooter';

// Public Pages
import Home from '../pages/public/Home';
import Login from '../pages/public/Login';
import Register from '../pages/public/Register';
import ForgotPassword from '../pages/public/ForgotPassword';
import VerifyOtp from '../pages/public/VerifyOtp';
import ResetPassword from '../pages/public/ResetPassword';
import Unauthorized from '../pages/public/Unauthorized';
import NotFound from '../pages/public/NotFound';
import JobListing from '../pages/public/JobListing';
import JobDetails from '../pages/public/JobDetails';
import About from '../pages/public/About';
import Contact from '../pages/public/Contact';
import HelpCenter from '../pages/public/HelpCenter';
import CompanyProfile from '../pages/shared/CompanyProfile';
import TermsPage from '../pages/TermsPage';
import PrivacyPage from '../pages/PrivacyPage';
import CookiesPage from '../pages/CookiesPage';
import HelpPage from '../pages/HelpPage';

// KYC Pages
import KYCStatus from '../pages/shared/KYC/KYCStatus';
import JobSeekerKYC from '../pages/shared/KYC/JobSeekerKYC';
import RecruiterKYC from '../pages/shared/KYC/RecruiterKYC';

// Dashboards & Private Pages
import SeekerDashboard from '../pages/seeker/SeekerDashboard';
import SeekerApplications from '../pages/seeker/SeekerApplications';
import JobseekerProfileDashboard from '../pages/seeker/JobseekerProfileDashboard';
import ApplyJob from '../pages/seeker/ApplyJob';
import FindJobs from '../pages/seeker/FindJobs';
import SeekerInterviews from '../pages/seeker/SeekerInterviews';
import JobseekerCalendar from '../pages/seeker/JobseekerCalendar';
import RecruiterDashboard from '../pages/recruiter/RecruiterDashboard';
import RecruiterProfile from '../pages/recruiter/RecruiterProfile';
import PostJob from '../pages/recruiter/PostJob';
import RecruiterJobs from '../pages/recruiter/RecruiterJobs';
import EditJob from '../pages/recruiter/EditJob';
import RecruiterApplicants from '../pages/recruiter/RecruiterApplicants';
import RecruiterCalendar from '../pages/recruiter/RecruiterCalendar';
import RecruiterInterviews from '../pages/recruiter/RecruiterInterviews';
import RecruiterPromotions from '../pages/recruiter/RecruiterPromotions';
import PromotionPayment from '../pages/recruiter/PromotionPayment';
import JobAnalytics from '../pages/recruiter/JobAnalytics';
import RecruiterChangePassword from '../pages/recruiter/RecruiterChangePassword';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminKYCPanel from '../pages/admin/AdminKYCPanel';
import AdminCompanies from '../pages/admin/AdminCompanies';
import AdminLocationManager from '../pages/admin/AdminLocationManager';
import AdminJobs from '../pages/admin/AdminJobs';
import AdminContactMessages from '../pages/admin/AdminContactMessages';
import ManageTestimonials from '../pages/admin/ManageTestimonials';
import ManageTeam from '../pages/admin/ManageTeam';
import AdminPromotedJobs from '../pages/admin/AdminPromotedJobs';
import AdminPromotionRequests from '../pages/admin/AdminPromotionRequests';
import Notifications from '../pages/shared/Notifications';
import InterviewCall from '../pages/shared/InterviewCall';

const UserInfoLayout = () => (
    <div className="min-h-screen flex flex-col bg-[#F3F4F6] font-sans text-gray-900">
        <DashboardNavbar />
        <div className="flex-1 w-full">
            <main className="w-full">
                <Outlet />
            </main>
        </div>
        <GlobalFooter />
    </div>
);

const AppRoutes = () => {
    return (
        <Routes>
            {/* 
              =========================================
              GUEST ONLY ROUTES (Auth Pages & Marketing)
              =========================================
              Logged-in users are redirected to their dashboard.
              NOTE: /jobs and /jobs/:id are NOT guest-only - they must be
              accessible to logged-in jobseekers for Fast-Track Apply / Apply flow.
            */}
            <Route element={<GuestOnlyRoute />}>
                <Route element={<PublicLayout />}>
                    {/* Auth */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/verify-otp" element={<VerifyOtp />} />
                    <Route path="/reset-password" element={<ResetPassword />} />

                    {/* Marketing / Public Landing (Guests only - logged-in users go to dashboard) */}
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/company/:id" element={<CompanyProfile />} />
                </Route>
            </Route>

            {/* 
              =========================================
              PUBLIC JOB PAGES (Guests + Logged-in)
              =========================================
              Accessible to everyone so jobseekers can view jobs and use Fast-Track Apply.
            */}
            <Route element={<PublicLayout />}>
                <Route path="/jobs" element={<JobListing />} />
                <Route path="/jobs/:id" element={<JobDetails />} />
                <Route path="/help-center" element={<HelpCenter />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/cookies" element={<CookiesPage />} />
                <Route path="/help" element={<HelpPage />} />
            </Route>

            {/* 
              =========================================
              SHARED ROUTES (Everyone + Authenticated)
              =========================================
            */}
            <Route element={<PublicLayout />}>
                <Route path="/unauthorized" element={<Unauthorized />} />
            </Route>



            {/* 
              =========================================
              PRIVATE ROUTES (Authenticated Only)
              =========================================
            */}
            <Route element={<ProtectedRoute />}>

                {/* SHARED / STATUS ROUTES */}
                <Route element={<KycLayout />}>
                    <Route path="/kyc" element={<KYCStatus />} />
                    <Route path="/kyc/status" element={<KYCStatus />} />
                    {/* Note: Notifications is shared but might need specific layout depending on role in future */}
                </Route>

                {/* SHARED INTERVIEW ROUTE */}
                <Route element={<RoleRoute allowedRoles={['jobseeker', 'recruiter', 'admin']} />}>
                    <Route path="/interview/call/:id" element={<InterviewCall />} />
                </Route>

                {/* SHARED USER INFO ROUTES (Seeker + Recruiter only) */}
                <Route element={<RoleRoute allowedRoles={['jobseeker', 'job_seeker', 'recruiter']} />}>
                    <Route element={<UserInfoLayout />}>
                        <Route path="/user/terms" element={<TermsPage />} />
                        <Route path="/user/privacy" element={<PrivacyPage />} />
                        <Route path="/user/cookies" element={<CookiesPage />} />
                        <Route path="/user/help" element={<HelpPage />} />
                    </Route>
                </Route>

                {/* 
                  -------------------------------------
                  JOB SEEKER ROUTES
                  -------------------------------------
                */}
                <Route element={<RoleRoute allowedRoles={['jobseeker', 'job_seeker']} />}>
                    <Route element={<SeekerLayout />}>
                        <Route path="/kyc/job-seeker" element={<JobSeekerKYC />} />
                        <Route path="/seeker/dashboard" element={<SeekerDashboard />} />
                        <Route path="/seeker/applications" element={<SeekerApplications />} />
                        <Route path="/seeker/profile" element={<JobseekerProfileDashboard />} />
                        <Route path="/seeker/jobs" element={<FindJobs />} />
                        <Route path="/seeker/interviews" element={<SeekerInterviews />} />
                        <Route path="/seeker/calendar" element={<JobseekerCalendar />} />
                        <Route path="/jobseeker/calendar" element={<JobseekerCalendar />} />
                        <Route path="/dashboard/calendar" element={<JobseekerCalendar />} />
                        <Route path="/seeker/notifications" element={<Notifications />} />
                        <Route path="/seeker/company/:id" element={<CompanyProfile />} />
                        <Route path="/jobseeker/jobs/:id" element={<JobDetails />} />
                        <Route path="/apply/:jobId" element={<ApplyJob />} />
                    </Route>
                </Route>

                {/* 
                  -------------------------------------
                  RECRUITER ROUTES
                  -------------------------------------
                */}
                <Route element={<RoleRoute allowedRoles={['recruiter']} />}>
                    {/* Recruiter KYC within KycLayout */}
                    <Route element={<KycLayout />}>
                        <Route path="/kyc/recruiter" element={<RecruiterKYC />} />
                    </Route>

                    <Route element={<RecruiterLayout />}>
                        <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
                        <Route path="/recruiter/profile" element={<RecruiterProfile />} />
                        <Route path="/recruiter/company" element={<CompanyProfile />} />
                        <Route path="/recruiter/post-job" element={<PostJob />} />
                        <Route path="/recruiter/jobs" element={<RecruiterJobs />} />
                        <Route path="/recruiter/jobs/:id/edit" element={<EditJob />} />
                        <Route path="/recruiter/applications" element={<RecruiterApplicants />} />
                        <Route path="/recruiter/interviews" element={<RecruiterInterviews />} />
                        <Route path="/recruiter/calendar" element={<RecruiterCalendar />} />
                        <Route path="/recruiter/jobs/:jobId/analytics" element={<JobAnalytics />} />
                        <Route path="/recruiter/promotions" element={<RecruiterPromotions />} />
                        <Route path="/promotion-payment" element={<PromotionPayment />} />
                        <Route path="/recruiter/change-password" element={<RecruiterChangePassword />} />
                        <Route path="/recruiter/notifications" element={<Notifications />} />
                    </Route>
                </Route>

                {/* 
                  -------------------------------------
                  ADMIN ROUTES
                  -------------------------------------
                */}
                <Route element={<RoleRoute allowedRoles={['admin']} />}>
                    <Route element={<AdminLayout />}>
                        <Route path="/admin/dashboard" element={<AdminDashboard />} />
                        <Route path="/admin/users" element={<AdminUsers />} />
                        <Route path="/admin/kyc" element={<AdminKYCPanel />} />
                        <Route path="/admin/companies" element={<AdminCompanies />} />
                        <Route path="/admin/companies/:id" element={<CompanyProfile />} />
                        <Route path="/admin/location" element={<AdminLocationManager />} />
                        <Route path="/admin/jobs" element={<AdminJobs />} />
                        <Route path="/admin/promoted-jobs" element={<AdminPromotedJobs />} />
                        <Route path="/admin/promotion-requests" element={<AdminPromotionRequests />} />
                        <Route path="/admin/notifications" element={<Notifications />} />
                        <Route path="/admin/contact-messages" element={<AdminContactMessages />} />
                        <Route path="/admin/testimonials" element={<ManageTestimonials />} />
                        <Route path="/admin/team" element={<ManageTeam />} />
                    </Route>
                </Route>

            </Route>

            {/* 404 Not Found */}
            <Route path="*" element={<PublicLayout><NotFound /></PublicLayout>} />
        </Routes>
    );
};

export default AppRoutes;
