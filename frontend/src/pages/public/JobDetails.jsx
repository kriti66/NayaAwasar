import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
            alert("Only job seekers can apply.");
            return;
        }

        if (!window.confirm("Are you sure you want to apply for this position?")) return;

        setApplying(true);
        try {
            await api.post('/applications/apply', { job_id: job.id });
            setHasApplied(true);
            alert("Application submitted successfully!");
        } catch (error) {
            console.error("Application error:", error);
            alert("Failed to apply. You might have already applied.");
        } finally {
            setApplying(false);
        }
    };

    if (loading) return <Layout><div className="text-center py-20">Loading...</div></Layout>;
    if (!job) return <Layout><div className="text-center py-20">Job not found.</div></Layout>;

    return (
        <Layout>
            <div className="bg-gray-50 min-h-screen py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row gap-8">

                        {/* Main Content (Left) */}
                        <div className="flex-1">
                            <h1 className="text-3xl font-extrabold text-gray-900 mb-4">{job.title}</h1>

                            {/* Tags Bubble List */}
                            <div className="flex flex-wrap gap-2 mb-8">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                    {job.company_name}
                                </span>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                    {job.location}
                                </span>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                                    {job.salary_range || '$60k - $80k'}
                                </span>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                    {job.type}
                                </span>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                                    5+ years exp
                                </span>
                            </div>

                            {/* Job Description */}
                            <div className="mb-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Job Description</h2>
                                <div className="prose text-gray-600 max-w-none whitespace-pre-line">
                                    {job.description}
                                </div>
                            </div>

                            {/* Requirements (Assuming structure or falling back to description) */}
                            {job.requirements && (
                                <div className="mb-8">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4">Requirements</h2>
                                    <div className="prose text-gray-600 max-w-none whitespace-pre-line">
                                        {job.requirements}
                                    </div>
                                </div>
                            )}

                            {/* Benefits Section (Placeholder/Example as API might not have it yet) */}
                            <div className="mb-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Benefits</h2>
                                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                                    <li>Competitive salary and performance bonuses.</li>
                                    <li>Comprehensive health, dental, and vision insurance.</li>
                                    <li>Generous paid time off and flexible working arrangements.</li>
                                    <li>401(k) retirement plan with company matching.</li>
                                </ul>
                            </div>
                        </div>

                        {/* Sidebar (Right) */}
                        <div className="w-full lg:w-80 flex-shrink-0 space-y-6">

                            {/* Company Card */}
                            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                                <div className="flex items-center mb-4">
                                    <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl mr-4">
                                        {job.company_name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{job.company_name}</h3>
                                        <p className="text-sm text-gray-500">Tech & Innovation</p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 mb-4">
                                    {job.company_name} is a leading company specializing in scalable web solutions.
                                </p>
                                <button className="w-full py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                                    Visit Website
                                </button>
                            </div>

                            {/* Actions Card */}
                            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm space-y-3">
                                {hasApplied ? (
                                    <button disabled className="w-full py-2.5 bg-green-500 text-white rounded-md font-bold text-sm opacity-75 cursor-not-allowed">
                                        Applied
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleApply}
                                        disabled={applying}
                                        className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md font-bold text-sm transition-colors"
                                    >
                                        {applying ? 'Applying...' : 'Apply Now'}
                                    </button>
                                )}
                                <button className="w-full py-2.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                    </svg>
                                    Save Job
                                </button>
                                <button className="w-full py-2.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                    Share Job
                                </button>
                            </div>

                            {/* Related Jobs */}
                            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                                <h3 className="font-bold text-gray-900 mb-4">Related Jobs</h3>
                                <div className="space-y-4">
                                    <div className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                                        <h4 className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer">Junior UI/UX Designer</h4>
                                        <p className="text-sm text-gray-500 mt-1">Creative Hub Ltd. • New York</p>
                                    </div>
                                    <div className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                                        <h4 className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer">Data Scientist</h4>
                                        <p className="text-sm text-gray-500 mt-1">Analytics Pros • Remote</p>
                                    </div>
                                    <div className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                                        <h4 className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer">Product Manager</h4>
                                        <p className="text-sm text-gray-500 mt-1">Market Movers • Seattle</p>
                                    </div>
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
