import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const JobDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const res = await api.get(`/jobs/${id}`);
                setJob(res.data);
            } catch (error) {
                console.error("Error fetching job details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchJob();
    }, [id]);

    const handleApply = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (user.role !== 'jobseeker') {
            toast.error("Only job seekers can apply.");
            return;
        }

        if (!window.confirm("Are you sure you want to apply for this position?")) return;

        setApplying(true);
        try {
            await api.post('/applications/apply', { job_id: job.id });
            setHasApplied(true);
            toast.success("Application submitted successfully!");
            // Optional: Redirect to My Applications after short delay
            setTimeout(() => navigate('/seeker/applications'), 1500);
        } catch (error) {
            console.error("Application error:", error);
            const errorData = error.response?.data || {};
            const code = errorData.code;
            const msg = errorData.message || "Failed to apply.";

            // Handle specific errors with helpful redirects based on ERROR CODES
            if (code === 'KYC_REQUIRED') {
                toast.error(msg, { duration: 5000 });
                setTimeout(() => navigate('/kyc/status'), 2000);
            } else if (code === 'RESUME_REQUIRED') {
                toast.error(msg, { duration: 5000 });
                // Assuming profile page has a hash or section capable logic, or just guide them
                setTimeout(() => navigate('/seeker/profile'), 2000);
            } else if (code === 'SKILLS_REQUIRED') {
                toast.error(msg, { duration: 5000 });
                setTimeout(() => navigate('/seeker/profile'), 2000);
            } else if (code === 'PROFILE_WEAK') {
                toast.error(msg, { duration: 5000 });
                setTimeout(() => navigate('/seeker/profile'), 2000);
            } else if (code === 'DUPLICATE_APPLICATION') {
                toast.error("You've already applied for this job!");
            } else {
                // Fallback for other errors (or legacy if any)
                if (msg.toLowerCase().includes("kyc")) {
                    toast.error(msg);
                    setTimeout(() => navigate('/kyc/status'), 2000);
                } else {
                    toast.error(msg);
                }
            }
        } finally {
            setApplying(false);
        }
    };

    if (loading) return <Layout><div className="text-center py-20">Loading...</div></Layout>;
    if (!job) return <Layout><div className="text-center py-20">Job not found.</div></Layout>;

    return (
        <Layout>
            <div className="bg-gray-50 min-h-screen py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row gap-8">

                        {/* Main Content (Left) */}
                        <div className="flex-1 space-y-6">
                            <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
                                <h1 className="text-3xl font-bold text-gray-900 mb-6">{job.title}</h1>

                                {/* Job Meta Tags */}
                                <div className="flex flex-wrap gap-2 mb-8">
                                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-100">
                                        {job.company_name}
                                    </span>
                                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold border border-gray-200">
                                        {job.location}
                                    </span>
                                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-100">
                                        {job.salary_range || 'Competitive'}
                                    </span>
                                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold border border-gray-200">
                                        {job.type}
                                    </span>
                                </div>

                                {/* Job Description */}
                                <div className="mb-8">
                                    <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Job Description</h2>
                                    <div className="prose prose-blue text-gray-600 max-w-none whitespace-pre-line">
                                        {job.description}
                                    </div>
                                </div>

                                {/* Requirements */}
                                {job.requirements && (
                                    <div className="mb-8">
                                        <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Requirements</h2>
                                        <div className="prose prose-blue text-gray-600 max-w-none whitespace-pre-line">
                                            {job.requirements}
                                        </div>
                                    </div>
                                )}

                                {/* Benefits */}
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Benefits</h2>
                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {[
                                            "Competitive salary",
                                            "Health & Insurance",
                                            "Paid time off",
                                            "Learning budget"
                                        ].map((benefit, i) => (
                                            <li key={i} className="flex items-center text-gray-600">
                                                <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                {benefit}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar (Right) */}
                        <div className="w-full lg:w-80 flex-shrink-0 space-y-6">

                            {/* Actions Card */}
                            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
                                {hasApplied ? (
                                    <div className="w-full py-3 bg-blue-50 text-blue-600 rounded-lg text-center font-bold border border-blue-100">
                                        Applied
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleApply}
                                        disabled={applying}
                                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors shadow-sm"
                                    >
                                        {applying ? 'Submitting...' : 'Apply Now'}
                                    </button>
                                )}
                                <div className="flex gap-2">
                                    <button className="flex-1 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2">
                                        Save
                                    </button>
                                    <button className="flex-1 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2">
                                        Share
                                    </button>
                                </div>
                            </div>

                            {/* Company Info */}
                            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                                <div className="flex items-center mb-4">
                                    <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xl border border-blue-100">
                                        {job.company_name.charAt(0)}
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="font-bold text-gray-900">{job.company_name}</h3>
                                        <p className="text-xs text-gray-500">Tech Industry</p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 mb-4">
                                    Leading innovation in recruitment and technology solutions.
                                </p>
                                <button
                                    onClick={() => navigate(`/company/${job.company_id?._id || job.company_id}`)}
                                    className="w-full py-2 text-sm font-bold text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-50 transition-colors"
                                >
                                    View Profile
                                </button>
                            </div>

                            {/* Sidebar Jobs */}
                            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                                <h3 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b">Recent Jobs</h3>
                                <div className="space-y-4">
                                    {[
                                        { title: "Frontend Developer", location: "Kathmandu" },
                                        { title: "Backend Engineer", location: "Remote" }
                                    ].map((j, i) => (
                                        <div key={i} className="group cursor-pointer">
                                            <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{j.title}</h4>
                                            <p className="text-xs text-gray-500">{j.location}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default JobDetails;
