import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useJobSaver from '../../hooks/useJobSaver';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
    MapPin,
    Briefcase,
    DollarSign,
    Clock,
    Building2,
    Globe,
    ExternalLink,
    ChevronLeft,
    Share2,
    Bookmark,
    CheckCircle2,
    Sparkles
} from 'lucide-react';

const JobDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasApplied, setHasApplied] = useState(false);
    const { savedJobIds, setSavedJobIds, toggleSaveJob } = useJobSaver();

    // Fetch saved jobs on mount
    useEffect(() => {
        const fetchSaved = async () => {
            try {
                const res = await api.get('/users/profile');
                if (res.data.savedJobs) {
                    setSavedJobIds(res.data.savedJobs);
                }
            } catch (err) {
                console.error("Failed to fetch saved jobs", err);
            }
        };
        fetchSaved();
    }, [setSavedJobIds]);

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const promises = [
                    api.get(`/jobs/${id}`),
                    api.post(`/jobs/${id}/view`).catch(err => console.error("View tracking failed", err))
                ];

                // If user is logged in as jobseeker, fetch their applications to check status
                if (user?.role === 'jobseeker') {
                    promises.push(api.get('/applications/my'));
                }

                const results = await Promise.all(promises);
                const jobData = results[0].data;
                setJob(jobData);

                if (user?.role === 'jobseeker' && results[2]) {
                    const myApps = results[2].data || [];
                    // Check if any application matches this job ID
                    const hasAppliedToJob = Array.isArray(myApps) && myApps.some(app => {
                        const appId = app.job_id?._id || app.job_id;
                        return String(appId) === String(id);
                    });
                    setHasApplied(hasAppliedToJob);
                }
            } catch (error) {
                console.error("Error fetching job details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchJob();
    }, [id, user]);

    const handleApplyClick = () => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (user.role !== 'jobseeker' && user.role !== 'job_seeker') {
            toast.error("Only job seekers can apply.");
            return;
        }
        navigate(`/apply/${id}`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#2D9B82] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Loading Job Details...</p>
                </div>
            </div>
        );
    }

    if (!job) return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-black text-gray-900 mb-4 uppercase tracking-tight">Job not found</h2>
            <Link to="/seeker/jobs" className="text-[#2D9B82] font-black text-xs uppercase tracking-widest hover:underline">Back to Job Search</Link>
        </div>
    );

    return (
        <div className="bg-[#F3F4F6] min-h-screen pb-20">
            {/* Header / Breadcrumb */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors group"
                        >
                            <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                            <span className="text-sm font-bold tracking-tight">Back to search</span>
                        </button>
                        <div className="flex items-center gap-3">
                            <button className="p-2 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-all">
                                <Share2 size={18} />
                            </button>
                            <button
                                onClick={() => toggleSaveJob(id)}
                                className={`p-2 rounded-lg transition-all ${savedJobIds.includes(id) ? 'text-[#2D9B82] bg-emerald-50' : 'text-gray-400 hover:text-[#2D9B82] hover:bg-emerald-50'}`}
                            >
                                <Bookmark size={18} fill={savedJobIds.includes(id) ? "currentColor" : "none"} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Left Column: Job Content */}
                    <div className="flex-1 space-y-6">
                        <div className="bg-white p-8 md:p-10 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden">
                            {/* Accent Bar */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-[#2D9B82]/20"></div>

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-[#2D9B82] font-black text-3xl shadow-inner">
                                        {job.company_name?.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">{job.title}</h1>
                                            <span className="px-2 py-0.5 bg-emerald-100 text-[#2D9B82] rounded text-[10px] font-black uppercase tracking-wider h-fit">Verified</span>
                                        </div>
                                        <p className="text-lg font-bold text-gray-500">{job.company_name}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Meta Info Bar */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gray-50 rounded-[24px] mb-10">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <MapPin size={12} className="text-[#2D9B82]" /> Location
                                    </p>
                                    <p className="text-sm font-bold text-gray-900">{job.location}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <Briefcase size={12} className="text-[#2D9B82]" /> Job Type
                                    </p>
                                    <p className="text-sm font-bold text-gray-900">{job.type}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <DollarSign size={12} className="text-[#2D9B82]" /> Salary
                                    </p>
                                    <p className="text-sm font-bold text-gray-900">{job.salary_range || 'Negotiable'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <Clock size={12} className="text-[#2D9B82]" /> Experience
                                    </p>
                                    <p className="text-sm font-bold text-gray-900">{job.experience_level || 'Not specified'}</p>
                                </div>
                            </div>

                            {/* Job Description */}
                            <section className="mb-10">
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-[#2D9B82] rounded-full"></div>
                                    Job Description
                                </h3>
                                <div className="text-gray-600 leading-relaxed font-medium whitespace-pre-wrap">
                                    {job.description}
                                </div>
                            </section>

                            {/* Requirements */}
                            {job.requirements && (
                                <section className="mb-10">
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-[#2D9B82] rounded-full"></div>
                                        Key Requirements
                                    </h3>
                                    <div className="text-gray-600 leading-relaxed font-medium whitespace-pre-wrap">
                                        {job.requirements}
                                    </div>
                                </section>
                            )}

                            {/* Skills Tagged */}
                            {job.skills && (
                                <section className="mb-10">
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-[#2D9B82] rounded-full"></div>
                                        Technologies & Skills
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {(job.skills.includes('[') ? JSON.parse(job.skills) : job.skills.split(',')).map((skill, i) => (
                                            <span key={i} className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700">
                                                {skill.trim()}
                                            </span>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Benefits */}
                            <section>
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-[#2D9B82] rounded-full"></div>
                                    Employee Benefits
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                                        "Competitive compensation package",
                                        "Professional development budget",
                                        "Health and wellness insurance",
                                        "Remote-first flexible culture"
                                    ].map((benefit, i) => (
                                        <div key={i} className="flex items-center gap-3 p-4 bg-emerald-50/30 border border-emerald-50 rounded-2xl">
                                            <CheckCircle2 size={18} className="text-[#2D9B82] shrink-0" />
                                            <span className="text-sm font-bold text-gray-700">{benefit}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>

                    {/* Right Column: Sidebar */}
                    <div className="w-full lg:w-96 space-y-6">

                        {/* Apply Card */}
                        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                            <div className="mb-8">
                                <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-2">Interested?</h4>
                                <p className="text-xs font-medium text-gray-500 leading-relaxed">Join a fast-growing company and build your future.</p>
                            </div>

                            {hasApplied ? (
                                <div className="w-full py-4 bg-gray-100 text-gray-500 rounded-2xl text-center font-black text-xs uppercase tracking-widest border border-gray-200">
                                    Application Submitted
                                </div>
                            ) : (
                                <button
                                    onClick={handleApplyClick}
                                    className="w-full py-4 bg-[#2D9B82] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#25836d] transition-all shadow-xl shadow-[#2D9B82]/20 transform active:scale-95 mb-4 group flex items-center justify-center gap-2"
                                >
                                    Apply Now <ChevronLeft size={16} className="rotate-180 group-hover:translate-x-0.5 transition-transform" />
                                </button>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => toggleSaveJob(id)}
                                    className={`py-3 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${savedJobIds.includes(id) ? 'bg-[#2D9B82] text-white border-[#2D9B82]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                >
                                    {savedJobIds.includes(id) ? 'Saved' : 'Save Job'}
                                </button>
                                <button className="py-3 bg-white border border-gray-200 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-colors">
                                    Share
                                </button>
                            </div>

                            <div className="mt-8 pt-8 border-t border-gray-50 text-center">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-[#2D9B82] rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
                                    <Sparkles size={10} /> 95% Profile Match
                                </div>
                                <p className="text-[10px] font-bold text-gray-400">Boost your profile for better chances!</p>
                            </div>
                        </div>

                        {/* Company Detail Sidebar Card */}
                        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">About Company</h4>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 min-w-[56px] h-14 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-[#2D9B82] font-black text-xl">
                                    {job.company_name?.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-black text-gray-900 truncate leading-tight">{job.company_name}</p>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1 flex items-center gap-1">
                                        <Building2 size={10} /> Tech Industry
                                    </p>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 font-medium leading-relaxed mb-6">
                                Leading innovation in recruitment and technology solutions. Join our diverse team of professionals.
                            </p>
                            <button
                                onClick={() => {
                                    const cid = job.company_id?._id || job.company_id;
                                    if (user?.role === 'jobseeker' || user?.role === 'job_seeker') {
                                        navigate(`/seeker/company/${cid}`);
                                    } else {
                                        navigate(`/company/${cid}`);
                                    }
                                }}
                                className="w-full py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors flex items-center justify-center gap-2"
                            >
                                View Profile <ExternalLink size={12} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobDetails;
