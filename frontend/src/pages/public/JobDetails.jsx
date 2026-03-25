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
import CompanyLogo from '../../components/common/CompanyLogo';

const normalizeSalaryValue = (value, fallbackLabel) => {
    if (value == null) return fallbackLabel;
    const raw = String(value).trim();
    if (!raw) return fallbackLabel;

    // Keep non-numeric labels as-is (e.g., Negotiable)
    if (!/\d/.test(raw)) return raw;

    // Backend may store "$ 50000-80000" — remove $ and Rs/Nrs prefixes.
    return raw
        .replace(/\$/g, '')
        .replace(/\bUSD\b/gi, '')
        .replace(/\bdollar\b/gi, '')
        .replace(/^\s*(Rs\.?|Nrs\.?)\s*/i, '')
        .trim();
};

const JobDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasApplied, setHasApplied] = useState(false);
    const [applicationStatus, setApplicationStatus] = useState(null);
    const { savedJobIds, setSavedJobIds, toggleSaveJob } = useJobSaver();

    // Fetch saved jobs from single source of truth
    useEffect(() => {
        const fetchSaved = async () => {
            try {
                const res = await api.get('/jobs/saved');
                const ids = res.data?.savedJobIds || [];
                setSavedJobIds(Array.isArray(ids) ? ids.map(i => (i?.toString?.() || i)) : []);
            } catch (err) {
                if (process.env.NODE_ENV === 'development') {
                    console.warn("[JobDetails] Failed to fetch saved jobs:", err?.message);
                }
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
                    const existingApp = Array.isArray(myApps) ? myApps.find(app => {
                        const appId = app.job_id?._id || app.job_id;
                        return String(appId) === String(id);
                    }) : null;

                    if (existingApp) {
                        setHasApplied(true);
                        setApplicationStatus(existingApp.status);
                    } else {
                        setHasApplied(false);
                        setApplicationStatus(null);
                    }
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

    // Helper to render application button state
    const renderApplicationButton = () => {
        if (!hasApplied) {
            return (
                <button
                    onClick={handleApplyClick}
                    className="w-full py-4 bg-[#29a08e] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#228377] transition-all shadow-xl shadow-[#29a08e]/20 transform active:scale-95 mb-4 group flex items-center justify-center gap-2"
                >
                    Apply Now <ChevronLeft size={16} className="rotate-180 group-hover:translate-x-0.5 transition-transform" />
                </button>
            );
        }

        if (applicationStatus === 'withdrawn') {
            return (
                <button
                    onClick={handleApplyClick}
                    className="w-full py-4 bg-[#29a08e] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#228377] transition-all shadow-xl shadow-[#29a08e]/20 transform active:scale-95 mb-4 group flex items-center justify-center gap-2"
                >
                    Reapply <ChevronLeft size={16} className="rotate-180 group-hover:translate-x-0.5 transition-transform" />
                </button>
            );
        }

        if (applicationStatus === 'rejected') {
            return (
                <div className="w-full py-4 bg-red-50 text-red-500 rounded-2xl text-center font-black text-xs uppercase tracking-widest border border-red-100 mb-4 cursor-not-allowed">
                    Application Rejected
                </div>
            );
        }

        return (
            <div className="w-full py-4 bg-gray-100 text-gray-500 rounded-2xl text-center font-black text-xs uppercase tracking-widest border border-gray-200 mb-4 cursor-default">
                Application Submitted
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#29a08e] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Loading Job Details...</p>
                </div>
            </div>
        );
    }

    if (!job) return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-black text-gray-900 mb-4 uppercase tracking-tight">Job not found</h2>
            <Link to="/seeker/jobs" className="text-[#29a08e] font-black text-xs uppercase tracking-widest hover:underline">Back to Job Search</Link>
        </div>
    );

    return (
        <div className="bg-[#F3F4F6] min-h-screen pb-20 font-sans">
            {/* Dark Modern Hero Banner */}
            <div className="bg-[#111827] text-white pt-10 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                {/* Decorative Gradients */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-[#29a08e]/10 blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-[#29a08e]/10 blur-3xl pointer-events-none"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 group w-fit"
                    >
                        <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-bold tracking-tight">Back to search</span>
                    </button>

                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="flex items-start gap-6">
                            <CompanyLogo job={job} companyName={job.company_name} className="w-20 h-20 md:w-24 md:h-24 rounded-2xl p-2 shadow-xl border border-gray-800 bg-white" imgClassName="w-full h-full object-contain rounded-xl" fallbackClassName="text-3xl" />
                            <div>
                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                    <span className="px-3 py-1 bg-[#29a08e] text-white rounded-full text-xs font-black uppercase tracking-wider shadow-sm">
                                        Urgent
                                    </span>
                                    <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-xs font-bold border border-gray-700">
                                        Active
                                    </span>
                                    <span className="text-gray-400 text-xs font-bold flex items-center gap-1.5">
                                        <Clock size={12} /> Posted {new Date(job.createdAt || job.posted_date).toLocaleDateString()}
                                    </span>
                                </div>
                                <h1 className="text-3xl md:text-5xl font-black text-white mb-3 tracking-tight">{job.title}</h1>
                                <div className="flex flex-wrap items-center gap-3 md:gap-4 text-gray-300 text-sm font-bold">
                                    <span className="text-white text-base md:text-lg">{job.company_name}</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                                    <span className="flex items-center gap-1.5"><MapPin size={16} className="text-[#29a08e]" /> {job.location || 'Remote'}</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                                    <span className="flex items-center gap-1.5"><Briefcase size={16} className="text-[#29a08e]" /> {job.type}</span>
                                </div>
                            </div>
                        </div>

                        {/* Top-right Actions */}
                        <div className="flex items-center gap-3 mt-4 md:mt-0">
                            <button
                                onClick={() => toggleSaveJob(id)}
                                className={`p-3 rounded-xl flex items-center justify-center transition-all ${savedJobIds.some(sid => (sid?.toString?.() || sid) === (id?.toString?.() || id)) ? 'bg-[#29a08e]/20 text-[#29a08e] border border-[#29a08e]/30' : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10 hover:text-white'}`}
                            >
                                <Bookmark size={20} fill={savedJobIds.some(sid => (sid?.toString?.() || sid) === (id?.toString?.() || id)) ? "currentColor" : "none"} />
                            </button>
                            <button className="p-3 bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10 rounded-xl transition-all flex items-center justify-center hover:text-white">
                                <Share2 size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
                <div className="flex flex-col lg:flex-row gap-8">
                    
                    {/* Left Column: Job Details */}
                    <div className="flex-1 space-y-6">
                        
                        <div className="bg-white p-8 md:p-10 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden">
                            {/* Meta Info Bar */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 md:p-8 bg-gray-50 rounded-[24px] mb-12 border border-gray-100">
                                <div className="space-y-2">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-100/50 flex items-center justify-center text-[#29a08e] shadow-sm mb-4">
                                        <Briefcase size={20} />
                                    </div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Job Type</p>
                                    <p className="text-sm font-bold text-gray-900">{job.type}</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shadow-sm mb-4">
                                        <MapPin size={20} />
                                    </div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Location</p>
                                    <p className="text-sm font-bold text-gray-900">{job.location}</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shadow-sm mb-4">
                                        <span className="font-black tracking-tight text-lg">Rs</span>
                                    </div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Salary</p>
                                    <p className="text-sm font-bold text-gray-900">{normalizeSalaryValue(job.salary_range || 'Negotiable', 'Negotiable')}</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 shadow-sm mb-4">
                                        <Clock size={20} />
                                    </div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Experience</p>
                                    <p className="text-sm font-bold text-gray-900">{job.experience_level || 'Not specified'}</p>
                                </div>
                            </div>

                            {/* Job Description */}
                            <section className="mb-12">
                                <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                                    <div className="w-2 h-8 bg-[#29a08e] rounded-full"></div>
                                    Job Description
                                </h3>
                                <div className="text-gray-600 font-medium leading-relaxed whitespace-pre-wrap text-[15px]">
                                    {job.description}
                                </div>
                            </section>

                            {/* Requirements */}
                            {job.requirements && (
                                <section className="mb-12">
                                    <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                                        <div className="w-2 h-8 bg-[#29a08e] rounded-full"></div>
                                        Key Requirements
                                    </h3>
                                    <div className="text-gray-600 font-medium leading-relaxed whitespace-pre-wrap text-[15px]">
                                        {job.requirements}
                                    </div>
                                </section>
                            )}

                            {/* Skills Tagged */}
                            {job.skills && (
                                <section className="mb-12">
                                    <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                                        <div className="w-2 h-8 bg-[#29a08e] rounded-full"></div>
                                        Technologies & Skills
                                    </h3>
                                    <div className="flex flex-wrap gap-2.5">
                                        {(job.skills.includes('[') ? JSON.parse(job.skills) : job.skills.split(',')).map((skill, i) => (
                                            <span key={i} className="px-5 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-600 shadow-sm hover:border-gray-200 transition-colors">
                                                {skill.trim()}
                                            </span>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Benefits */}
                            <section>
                                <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                                    <div className="w-2 h-8 bg-[#29a08e] rounded-full"></div>
                                    Employee Benefits
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                                        "Competitive compensation package",
                                        "Professional development budget",
                                        "Health and wellness insurance",
                                        "Remote-first flexible culture",
                                        "Paid time off & holidays",
                                        "Team building events"
                                    ].map((benefit, i) => (
                                        <div key={i} className="flex items-center gap-3 p-4 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl hover:bg-emerald-50 transition-colors">
                                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                                                <CheckCircle2 size={16} className="text-[#29a08e]" />
                                            </div>
                                            <span className="text-sm font-bold text-gray-700">{benefit}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>

                    {/* Right Column: Sidebar */}
                    <div className="w-full lg:w-96">
                        <div className="space-y-6 sticky top-28">
                            
                            {/* Apply Card */}
                            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                                <div className="mb-8 text-center bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                    <h4 className="text-lg font-black text-gray-900 mb-1">Interested in this role?</h4>
                                    <p className="text-xs font-medium text-gray-500">Join a fast-growing team and build your future.</p>
                                </div>

                                {renderApplicationButton()}

                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <button
                                        onClick={() => toggleSaveJob(id)}
                                        className={`py-3.5 border rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${savedJobIds.some(sid => (sid?.toString?.() || sid) === (id?.toString?.() || id)) ? 'bg-[#29a08e] text-white border-[#29a08e]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        {savedJobIds.some(sid => (sid?.toString?.() || sid) === (id?.toString?.() || id)) ? 'Saved' : 'Save Job'}
                                    </button>
                                    <button className="py-3.5 bg-white border border-gray-200 text-gray-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm">
                                        Share
                                    </button>
                                </div>

                                <div className="mt-8 pt-8 border-t border-gray-100 text-center">
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 border border-emerald-100 text-[#29a08e] rounded-full text-xs font-black tracking-wide mb-3">
                                        <Sparkles size={14} /> 95% Profile Match
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-400">Boost your profile for even better chances!</p>
                                </div>
                            </div>

                            {/* Company Detail Sidebar Card */}
                            <div className="bg-[#111827] text-white p-8 rounded-[32px] shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#29a08e]/20 rounded-bl-full pointer-events-none blur-2xl"></div>
                            
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-800 pb-4">Hiring Company</h4>
                            
                            <div className="flex items-center gap-4 mb-6 relative z-10">
                                <CompanyLogo job={job} companyName={job.company_name} className="w-16 h-16 shrink-0 rounded-2xl bg-white shadow-xl" imgClassName="w-full h-full object-contain p-1 rounded-xl" fallbackClassName="text-2xl text-[#29a08e]" />
                                <div>
                                    <p className="text-xl font-black text-white leading-tight mb-1">{job.company_name}</p>
                                    <p className="text-[10px] font-black text-[#29a08e] uppercase tracking-widest flex items-center gap-1.5">
                                        <Building2 size={12} /> Tech Industry
                                    </p>
                                </div>
                            </div>
                            
                            <p className="text-sm text-gray-400 font-medium leading-relaxed mb-8 relative z-10">
                                Leading innovation in recruitment and technology solutions. Join our diverse team of professionals today.
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
                                className="w-full py-4 bg-[#29a08e] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#228377] transition-all shadow-lg flex items-center justify-center gap-2 relative z-10"
                            >
                                View Company Profile <ExternalLink size={14} />
                            </button>
                        </div>
                        
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobDetails;
