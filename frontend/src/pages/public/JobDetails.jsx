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
            <div className="bg-white min-h-screen py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-blue-600 px-8 py-10 md:flex md:items-center md:justify-between">
                        <div>
                            <h1 className="text-3xl font-extrabold text-white">{job.title}</h1>
                            <p className="mt-2 text-blue-100 text-lg">{job.company_name} • {job.location}</p>
                        </div>
                        <div className="mt-6 md:mt-0">
                            {hasApplied ? (
                                <button disabled className="bg-green-500 text-white font-bold py-3 px-8 rounded opacity-75 cursor-not-allowed">
                                    Applied
                                </button>
                            ) : (
                                <button
                                    onClick={handleApply}
                                    disabled={applying}
                                    className="bg-white text-blue-600 hover:bg-blue-50 font-bold py-3 px-8 rounded shadow-md transition duration-150 ease-in-out"
                                >
                                    {applying ? 'Applying...' : 'Apply Now'}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="px-8 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="col-span-2 space-y-8">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4">Job Description</h3>
                                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{job.description}</p>
                            </div>

                            {job.requirements && (
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4">Requirements</h3>
                                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{job.requirements}</p>
                                </div>
                            )}
                        </div>

                        <div className="col-span-1 space-y-6">
                            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                                <h4 className="font-bold text-gray-900 mb-4">Job Overview</h4>
                                <ul className="space-y-3 text-sm text-gray-600">
                                    <li className="flex justify-between">
                                        <span className="font-medium">Type:</span>
                                        <span>{job.type}</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="font-medium">Salary:</span>
                                        <span>{job.salary_range || 'Not specified'}</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="font-medium">Date Posted:</span>
                                        <span>{new Date(job.posted_at).toLocaleDateString()}</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="text-center">
                                <Link to="/jobs" className="text-blue-600 hover:text-blue-800 font-medium">
                                    &larr; Back to Listings
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default JobDetails;
