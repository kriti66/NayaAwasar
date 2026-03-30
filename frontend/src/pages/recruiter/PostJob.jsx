import { useState, useEffect } from 'react';
import RecruiterLayout from '../../components/layouts/RecruiterLayout';
import api from '../../services/api';
import companyService from '../../services/companyService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Building2, AlertTriangle, Briefcase, MapPin, DollarSign, FileText, List, Tag } from 'lucide-react';
import { JOB_CATEGORIES } from '../../constants/jobCategories';
import { toast } from 'react-hot-toast';

const PostJob = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loadingCompany, setLoadingCompany] = useState(true);
    const [company, setCompany] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        company_name: '',
        category: '',
        type: '',
        experience_level: '',
        location: '',
        description: '',
        salary_range: '',
        requirements: '',
        tags: ''
    });
    const [errors, setErrors] = useState({});
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [pendingSubmitData, setPendingSubmitData] = useState(null);
    const [profileError, setProfileError] = useState(false);
    const DRAFT_KEY = 'post_job_draft';

    useEffect(() => {
        if (user.kycStatus !== 'approved' && user.role === 'recruiter') {
            return;
        }

        const loadDraftIfAny = () => {
            try {
                const raw = window.localStorage.getItem(DRAFT_KEY);
                if (!raw) return;
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object') {
                    setFormData((prev) => ({ ...prev, ...parsed }));
                }
            } catch {
                // ignore corrupt draft
            }
        };

        const fetchRecruiterCompany = async () => {
            try {
                const myCompany = await companyService.getMyCompany();
                setCompany(myCompany);
                if (myCompany) {
                    setFormData(prev => ({
                        ...prev,
                        company_name: myCompany.name,
                        location: myCompany.headquarters
                    }));
                    setProfileError(false);
                }
            } catch (error) {
                console.error("Failed to load company profile", error);
                setProfileError(true);
            } finally {
                setLoadingCompany(false);
            }
        };
        loadDraftIfAny();
        fetchRecruiterCompany();
    }, [user.kycStatus, user.role]);

    if (user.kycStatus !== 'approved' && user.role === 'recruiter') {
        return (
            <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[60vh] bg-gray-50">
                <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 transform transition-all">
                    <div className="bg-gradient-to-br from-rose-500 via-red-500 to-rose-600 px-8 py-10 text-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full blur-3xl"></div>
                        </div>
                        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm mb-5 inline-block shadow-inner ring-4 ring-white/10">
                                <AlertTriangle className="h-10 w-10 text-white" />
                            </div>
                            <h2 className="text-2xl font-black text-white tracking-tight">
                                Identity Verification Required
                            </h2>
                        </div>
                    </div>
                    <div className="px-8 py-10 text-center">
                        <h3 className="text-lg font-black text-gray-900 mb-3 tracking-tight">Action Needed to access Job Postings</h3>
                        <p className="text-gray-600 mb-8 leading-relaxed">
                            To maintain trust and safety within Naya Awasar, all recruiters must have their <strong className="text-gray-900">Personal KYC</strong> verified by an admin before they can post jobs.
                        </p>
                        <div className="bg-gray-50 rounded-2xl p-4 mb-8 inline-flex items-center gap-3 border border-gray-200 shadow-sm">
                            <span className="text-[10px] tracking-widest uppercase font-black text-gray-400">Current Status:</span>
                            <span className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-full tracking-wider ${
                                user.kycStatus === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                user.kycStatus === 'rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                'bg-gray-100 text-gray-700 border border-gray-200'
                            }`}>
                                {user.kycStatus?.replace('_', ' ') || 'NOT SUBMITTED'}
                            </span>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button
                                onClick={() => navigate('/kyc/recruiter')}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl shadow-lg text-sm font-bold text-white bg-[#29a08e] hover:bg-[#228377] hover:shadow-[#29a08e]/30 transition-all duration-300 active:scale-95"
                            >
                                Go to KYC Verification
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </button>
                            <button
                                onClick={() => navigate('/recruiter/dashboard')}
                                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 border border-gray-200 rounded-2xl text-sm font-bold text-gray-600 bg-white hover:bg-gray-50 hover:text-gray-900 transition-colors"
                            >
                                Return to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    if (loadingCompany) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[#29a08e]/30 border-t-[#29a08e] rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-sm font-bold text-gray-400">Loading company profile...</p>
                </div>
            </div>
        );
    }

    if (!company || company.status !== 'approved') {
        return (
            <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[60vh] bg-gray-50">
                <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 transform transition-all">
                    <div className="bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 px-8 py-10 text-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full blur-3xl"></div>
                        </div>
                        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm mb-5 inline-block shadow-inner ring-4 ring-white/10">
                                <Building2 className="h-10 w-10 text-white" />
                            </div>
                            <h2 className="text-2xl font-black text-white tracking-tight">
                                Company Profile Incomplete
                            </h2>
                        </div>
                    </div>
                    <div className="px-8 py-10 text-center">
                        <h3 className="text-lg font-black text-gray-900 mb-3 tracking-tight">Action Needed to Access Job Postings</h3>
                        <p className="text-gray-600 mb-8 leading-relaxed">
                            You need an <strong className="text-gray-900">Approved Company Profile</strong> before you can post jobs.
                        </p>
                        <div className="bg-gray-50 rounded-2xl p-4 mb-8 inline-flex items-center gap-3 border border-gray-200 shadow-sm">
                            <span className="text-[10px] tracking-widest uppercase font-black text-gray-400">Company Status:</span>
                            <span className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-full tracking-wider ${
                                company?.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                company?.status === 'rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                'bg-gray-100 text-gray-700 border border-gray-200'
                            }`}>
                                {company ? company.status : 'NOT CREATED'}
                            </span>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button
                                onClick={() => navigate('/recruiter/company')}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl shadow-lg text-sm font-bold text-white bg-[#29a08e] hover:bg-[#228377] hover:shadow-[#29a08e]/30 transition-all duration-300 active:scale-95"
                            >
                                Go to Company Profile
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </button>
                            <button
                                onClick={() => navigate('/recruiter/dashboard')}
                                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 border border-gray-200 rounded-2xl text-sm font-bold text-gray-600 bg-white hover:bg-gray-50 hover:text-gray-900 transition-colors"
                            >
                                Return to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        const next = { ...formData, [name]: value };
        setFormData(next);
        setErrors((prev) => ({ ...prev, [name]: undefined }));
        try {
            window.localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
        } catch {
            // ignore storage errors
        }
    };

    const validateForm = () => {
        const nextErrors = {};
        const title = (formData.title || '').trim();
        if (title.length < 3 || title.length > 100) {
            nextErrors.title = 'Job title must be between 3 and 100 characters';
        }
        if (!formData.category) {
            nextErrors.category = 'Please select a category';
        }
        if (!formData.experience_level) {
            nextErrors.experience_level = 'Please select an experience level';
        }
        if (!formData.type) {
            nextErrors.type = 'Please select a job type';
        }
        const salary = (formData.salary_range || '').trim();
        if (salary && !/\d/.test(salary)) {
            nextErrors.salary_range_warning = 'Please check your salary format';
        }
        const desc = (formData.description || '').trim();
        if (desc.length < 50) {
            nextErrors.description = 'Job description must be at least 50 characters';
        }
        const reqs = (formData.requirements || '').trim();
        if (reqs.length < 20) {
            nextErrors.requirements = 'Requirements must be at least 20 characters';
        }
        const tagsRaw = (formData.tags || '').trim();
        if (tagsRaw) {
            const tagsArr = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);
            if (tagsArr.length > 10) {
                nextErrors.tags = 'Maximum 10 tags allowed';
            } else if (tagsArr.some(t => t.length > 30)) {
                nextErrors.tags = 'Each tag must be under 30 characters';
            }
        }
        setErrors(nextErrors);
        // treat warnings as non-blocking
        const { salary_range_warning, ...hard } = nextErrors;
        return Object.keys(hard).length === 0;
    };

    const performPostJob = async (payload) => {
        try {
            setLoadingSubmit(true);
            const res = await api.post('/jobs', payload);
            try {
                window.localStorage.removeItem(DRAFT_KEY);
            } catch {
                // ignore
            }
            toast.success('Job posted successfully!', { duration: 4000 });
            navigate('/recruiter/jobs');
            return res;
        } catch (error) {
            const status = error?.response?.status;
            if (status === 401) {
                // Session expired
                toast.error('Your session has expired. Please log in again.', { duration: 4000 });
                navigate('/login');
            } else if (status === 403) {
                toast.error('You must complete recruiter verification before posting jobs.', { duration: 4000 });
                navigate('/kyc/recruiter');
            } else if (status === 422) {
                const fieldErrors = error?.response?.data?.errors || {};
                setErrors((prev) => ({ ...prev, ...fieldErrors }));
            } else if (status === 429) {
                toast.error('You are posting too frequently. Please wait a moment and try again.', { duration: 4000 });
            } else if (error?.name === 'NetworkError' || error?.code === 'ECONNABORTED') {
                toast.error('Connection lost. Please check your internet and try again.', { duration: 4000 });
            } else {
                toast.error('Something went wrong. Please try again.', { duration: 4000 });
                console.error('Post job error:', error);
            }
            throw error;
        } finally {
            setLoadingSubmit(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const payload = { ...formData };

        try {
            const dupRes = await api.get('/jobs/check-duplicate', {
                params: { title: formData.title }
            });
            if (dupRes.data?.duplicate) {
                setPendingSubmitData(payload);
                setShowDuplicateModal(true);
                return;
            }
        } catch (err) {
            // if duplicate check fails, fall back to normal submission
            console.warn('Duplicate check failed', err);
        }

        await performPostJob(payload);
    };

    return (
        <>
            {/* ─── Hero Header ─────────────────────────────── */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#0d2f2b] to-slate-900 pt-12 pb-28 px-4 sm:px-6 lg:px-8">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-10 w-64 h-64 bg-[#29a08e] rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 right-20 w-80 h-80 bg-teal-400 rounded-full blur-3xl"></div>
                </div>
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

                <div className="relative max-w-4xl mx-auto">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                        <div className="text-white animate-fade-in-up">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-sm font-medium text-gray-200 backdrop-blur-sm mb-4">
                                <Briefcase size={14} />
                                New Listing
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
                                Post a <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#29a08e] to-teal-300">Job</span>
                            </h1>
                            <p className="text-gray-300 text-lg">Create a compelling listing to attract top talent</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-2xl font-bold text-sm hover:bg-white/20 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>


            </div>

            <main className="flex-1 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full -mt-16 pb-12 relative z-10">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    {/* Form Header */}
                    <div className="px-8 pt-8 pb-6 border-b border-gray-50">
                        <p className="text-[#29a08e] font-bold text-[10px] uppercase tracking-[0.2em] mb-1">Job Details</p>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Fill in the details below</h3>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                    <Briefcase size={14} className="text-[#29a08e]" />
                                    Job Title
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g. Senior Software Engineer"
                                    className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-[#29a08e] focus:ring-[#29a08e] sm:text-sm px-4 py-3.5 border bg-gray-50/50 hover:bg-white transition-colors"
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                    <Building2 size={14} className="text-[#29a08e]" />
                                    Company Name
                                </label>
                                <input
                                    type="text"
                                    name="company_name"
                                    value={formData.company_name}
                                    readOnly
                                    className="block w-full rounded-xl border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed shadow-sm focus:ring-0 sm:text-sm px-4 py-3.5 border"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    {profileError
                                        ? 'Could not load company details. Please refresh the page.'
                                        : 'Auto-filled from your verified company profile'}
                                </p>
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                    <MapPin size={14} className="text-[#29a08e]" />
                                    Location
                                </label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    readOnly
                                    className="block w-full rounded-xl border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed shadow-sm focus:ring-0 sm:text-sm px-4 py-3.5 border"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    {profileError
                                        ? 'Could not load company details. Please refresh the page.'
                                        : 'Auto-filled from your verified company profile'}
                                </p>
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                    <Briefcase size={14} className="text-[#29a08e]" />
                                    Category <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    required
                                    className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-[#29a08e] focus:ring-[#29a08e] sm:text-sm px-4 py-3.5 border bg-gray-50/50 hover:bg-white transition-colors"
                                >
                                    <option value="" disabled>Select category</option>
                                    {JOB_CATEGORIES.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                                <p className="mt-1 text-xs text-gray-500">Used for search and filters on Find Jobs.</p>
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                    <List size={14} className="text-[#29a08e]" />
                                    Job Type
                                </label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-[#29a08e] focus:ring-[#29a08e] sm:text-sm px-4 py-3.5 border bg-gray-50/50 hover:bg-white transition-colors"
                                >
                                    <option value="">Select job type</option>
                                    <option value="Full-time">Full-time</option>
                                    <option value="Part-time">Part-time</option>
                                    <option value="Contract">Contract</option>
                                    <option value="Internship">Internship</option>
                                </select>
                                {errors.type && (
                                    <p className="mt-1 text-xs text-red-600 font-medium">{errors.type}</p>
                                )}
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                    <List size={14} className="text-[#29a08e]" />
                                    Experience Level <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="experience_level"
                                    value={formData.experience_level}
                                    onChange={handleChange}
                                    className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-[#29a08e] focus:ring-[#29a08e] sm:text-sm px-4 py-3.5 border bg-gray-50/50 hover:bg-white transition-colors"
                                >
                                    <option value="">Select experience level</option>
                                    <option value="Entry-level">Entry-level</option>
                                    <option value="Mid-level">Mid-level</option>
                                    <option value="Senior">Senior</option>
                                    <option value="Executive">Executive</option>
                                </select>
                                {errors.experience_level && (
                                    <p className="mt-1 text-xs text-red-600 font-medium">{errors.experience_level}</p>
                                )}
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                    <DollarSign size={14} className="text-[#29a08e]" />
                                    Salary Range
                                </label>
                                <input
                                    type="text"
                                    name="salary_range"
                                    value={formData.salary_range}
                                    onChange={handleChange}
                                    placeholder="e.g. NRs. 50,000 - 80,000"
                                    className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-[#29a08e] focus:ring-[#29a08e] sm:text-sm px-4 py-3.5 border bg-gray-50/50 hover:bg-white transition-colors"
                                />
                                <p className="mt-1 text-xs text-gray-500">Use format like: NRs. 50,000 - 80,000</p>
                                {errors.salary_range_warning && (
                                    <p className="mt-1 text-xs text-amber-600 font-medium">
                                        {errors.salary_range_warning}
                                    </p>
                                )}
                            </div>
                            <div className="col-span-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                    <FileText size={14} className="text-[#29a08e]" />
                                    Job Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                    rows="5"
                                    placeholder="Describe the role and responsibilities..."
                                    className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-[#29a08e] focus:ring-[#29a08e] sm:text-sm px-4 py-3.5 border bg-gray-50/50 hover:bg-white transition-colors"
                                ></textarea>
                                <p className={`mt-1 text-xs font-medium ${ (formData.description || '').trim().length >= 50 ? 'text-emerald-600' : 'text-gray-500' }`}>
                                    {(formData.description || '').trim().length} / 50 minimum characters
                                </p>
                                {errors.description && (
                                    <p className="mt-1 text-xs text-red-600 font-medium">{errors.description}</p>
                                )}
                            </div>
                            <div className="col-span-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                    <List size={14} className="text-[#29a08e]" />
                                    Requirements
                                </label>
                                <textarea
                                    name="requirements"
                                    value={formData.requirements}
                                    onChange={handleChange}
                                    rows="5"
                                    placeholder="List the required skills and qualifications..."
                                    className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-[#29a08e] focus:ring-[#29a08e] sm:text-sm px-4 py-3.5 border bg-gray-50/50 hover:bg-white transition-colors"
                                ></textarea>
                                {errors.requirements && (
                                    <p className="mt-1 text-xs text-red-600 font-medium">{errors.requirements}</p>
                                )}
                            </div>
                            <div className="col-span-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                    <Tag size={14} className="text-[#29a08e]" />
                                    Tags <span className="text-gray-400 font-normal">(optional)</span>
                                </label>
                                <input
                                    type="text"
                                    name="tags"
                                    value={formData.tags}
                                    onChange={handleChange}
                                    placeholder="e.g. nurse, icu, bilingual — comma separated"
                                    className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-[#29a08e] focus:ring-[#29a08e] sm:text-sm px-4 py-3.5 border bg-gray-50/50 hover:bg-white transition-colors"
                                />
                                <p className="mt-1 text-xs text-gray-500">Stored lowercase; improves keyword search.</p>
                                {errors.tags && (
                                    <p className="mt-1 text-xs text-red-600 font-medium">{errors.tags}</p>
                                )}
                            </div>
                        </div>
                        <div className="pt-6 border-t border-gray-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={loadingSubmit}
                                className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#29a08e] text-white rounded-2xl font-bold text-sm hover:bg-[#228377] shadow-lg shadow-[#29a08e]/20 hover:shadow-[#29a08e]/30 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loadingSubmit ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        Posting...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                        </svg>
                                        + Post Job
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </>
    );
};

export default PostJob;
