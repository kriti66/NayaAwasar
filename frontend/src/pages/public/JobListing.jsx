import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import FeaturedJobs from '../../components/jobs/FeaturedJobs';
import PromotionBadge from '../../components/jobs/PromotionBadge';
import { JOB_CATEGORIES } from '../../constants/jobCategories';

/** Public UI labels → Job schema experience_level */
const PUBLIC_EXP_TO_API = {
    'Entry-level': 'Entry Level',
    'Mid-level': 'Associate',
    'Senior': 'Mid-Senior Level',
    'Executive': 'Executive'
};

const initialCategories = () =>
    Object.fromEntries(JOB_CATEGORIES.map((c) => [c, false]));

const ListRowSkeleton = () => (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
        <div className="flex gap-4">
            <div className="w-14 h-14 bg-gray-100 rounded-xl shrink-0" />
            <div className="flex-1 space-y-3">
                <div className="h-4 bg-gray-100 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-1/4" />
                <div className="flex gap-2">
                    <div className="h-6 bg-gray-100 rounded-full w-20" />
                    <div className="h-6 bg-gray-100 rounded-full w-20" />
                </div>
            </div>
        </div>
    </div>
);

const normalizeSalaryRangeValue = (value, fallbackLabel) => {
    if (value == null) return fallbackLabel;
    const raw = String(value).trim();
    if (!raw) return fallbackLabel;

    // If it's a label (e.g., Competitive/Negotiable) keep it.
    if (!/\d/.test(raw)) return raw;

    // Strip any currency symbols/prefixes coming from backend (e.g. "$ 30000-40000")
    const cleaned = raw
        .replace(/\$/g, '')
        .replace(/\bUSD\b/gi, '')
        .replace(/\bdollar\b/gi, '')
        .replace(/^\s*(Rs\.?|Nrs\.?)\s*/i, '')
        .trim();

    return cleaned ? `Nrs ${cleaned}` : fallbackLabel;
};

const JobListing = () => {
    const { user } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [listLoading, setListLoading] = useState(true);
    const listFetchGen = useRef(0);
    const [keyword, setKeyword] = useState('');
    const [location, setLocation] = useState('');
    const [jobTypes, setJobTypes] = useState({ 'Full-time': false, 'Part-time': false, 'Contract': false, 'Internship': false });
    const [experienceLevels, setExperienceLevels] = useState({ 'Entry-level': false, 'Mid-level': false, 'Senior': false, 'Executive': false });
    const [jobCategories, setJobCategories] = useState(() => initialCategories());
    const [currentPage, setCurrentPage] = useState(1);
    const jobsPerPage = 8;

    useEffect(() => {
        const gen = ++listFetchGen.current;
        const ctrl = new AbortController();
        const q = keyword.trim();
        const debounceMs = q ? 380 : 0;
        const t = setTimeout(async () => {
            try {
                setListLoading(true);
                const params = {};
                if (q) params.q = q;
                const loc = location.trim();
                if (loc) params.location = loc;
                const types = Object.keys(jobTypes).filter((k) => jobTypes[k]);
                if (types.length) params.jobType = types.join(',');
                const cats = JOB_CATEGORIES.filter((c) => jobCategories[c]);
                if (cats.length) params.category = cats.join(',');
                const levels = Object.keys(experienceLevels)
                    .filter((k) => experienceLevels[k])
                    .map((k) => PUBLIC_EXP_TO_API[k])
                    .filter(Boolean);
                if (levels.length) params.experienceLevel = [...new Set(levels)].join(',');
                const res = await api.get('/jobs', { params, signal: ctrl.signal });
                if (ctrl.signal.aborted || gen !== listFetchGen.current) return;
                setJobs(Array.isArray(res.data) ? res.data : []);
            } catch (error) {
                if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') return;
                console.error('Error fetching jobs:', error);
                if (gen === listFetchGen.current) setJobs([]);
            } finally {
                if (!ctrl.signal.aborted && gen === listFetchGen.current) setListLoading(false);
            }
        }, debounceMs);
        return () => {
            clearTimeout(t);
            ctrl.abort();
        };
    }, [keyword, location, jobTypes, experienceLevels, jobCategories]);

    const handleCheckboxChange = (category, value) => {
        if (category === 'type') setJobTypes(prev => ({ ...prev, [value]: !prev[value] }));
        else if (category === 'level') setExperienceLevels(prev => ({ ...prev, [value]: !prev[value] }));
        setCurrentPage(1);
    };

    const toggleJobCategory = (cat) => {
        setJobCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setKeyword('');
        setLocation('');
        setJobTypes({ 'Full-time': false, 'Part-time': false, 'Contract': false, 'Internship': false });
        setExperienceLevels({ 'Entry-level': false, 'Mid-level': false, 'Senior': false, 'Executive': false });
        setJobCategories(initialCategories());
        setCurrentPage(1);
    };

    const totalPages = Math.ceil(jobs.length / jobsPerPage);
    const currentJobs = jobs.slice((currentPage - 1) * jobsPerPage, currentPage * jobsPerPage);

    const activeFilterCount = Object.values(jobTypes).filter(Boolean).length +
        Object.values(experienceLevels).filter(Boolean).length +
        Object.values(jobCategories).filter(Boolean).length +
        (keyword ? 1 : 0) + (location ? 1 : 0);

    const typeColors = {
        'Full-time': 'bg-[#29a08e]/10 text-[#29a08e] border-[#29a08e]/20',
        'Part-time': 'bg-blue-50 text-blue-600 border-blue-100',
        'Contract': 'bg-amber-50 text-amber-600 border-amber-100',
        'Internship': 'bg-violet-50 text-violet-600 border-violet-100',
        'Freelance': 'bg-rose-50 text-rose-600 border-rose-100',
    };

    return (
        <div className="bg-[#f8fafc] min-h-screen">
            {/* Hero Header */}
            <div className="bg-gradient-to-br from-slate-900 via-[#0d2f2b] to-slate-900 py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-20 w-72 h-72 bg-[#29a08e] rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-20 w-64 h-64 bg-teal-400 rounded-full blur-3xl"></div>
                </div>
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '28px 28px' }}></div>

                <div className="relative max-w-5xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#29a08e]/20 border border-[#29a08e]/30 rounded-full text-sm font-medium text-[#29a08e] mb-4">
                        💼{' '}
                        {listLoading && jobs.length === 0 ? '…' : `${jobs.length}+`} Opportunities Available
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight">
                        Explore <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#29a08e] to-teal-300">Jobs</span> in Nepal
                    </h1>
                    <p className="text-gray-300 text-lg mb-8">Find the perfect role that matches your skills and aspirations.</p>

                    {/* Search Bar */}
                    <div className="bg-white rounded-2xl p-2 flex flex-col md:flex-row gap-2 shadow-2xl max-w-3xl mx-auto">
                        <div className="flex-1 flex items-center px-4 border-b md:border-b-0 md:border-r border-gray-100">
                            <svg className="w-5 h-5 text-gray-400 mr-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Job title, profession, keywords..."
                                value={keyword}
                                onChange={(e) => { setKeyword(e.target.value); setCurrentPage(1); }}
                                className="w-full py-3 bg-transparent outline-none text-gray-700 text-sm font-medium placeholder-gray-400"
                            />
                        </div>
                        <div className="flex-1 flex items-center px-4">
                            <svg className="w-5 h-5 text-gray-400 mr-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="City, region..."
                                value={location}
                                onChange={(e) => { setLocation(e.target.value); setCurrentPage(1); }}
                                className="w-full py-3 bg-transparent outline-none text-gray-700 text-sm font-medium placeholder-gray-400"
                            />
                        </div>
                        <button className="px-8 py-3 bg-[#29a08e] text-white rounded-xl font-bold text-sm hover:bg-[#228377] transition-all shadow-lg shadow-[#29a08e]/20">
                            Search
                        </button>
                    </div>
                </div>
            </div>

            {/* Promoted jobs are unfiltered; hide while any list filter is active */}
            {activeFilterCount === 0 && <FeaturedJobs />}

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar */}
                    <aside className="w-full lg:w-72 flex-shrink-0">
                        <div className="sticky top-20 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-black text-gray-900 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-[#29a08e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                                    </svg>
                                    Filters
                                    {activeFilterCount > 0 && (
                                        <span className="w-5 h-5 bg-[#29a08e] text-white text-xs rounded-full flex items-center justify-center font-black">{activeFilterCount}</span>
                                    )}
                                </h3>
                                {activeFilterCount > 0 && (
                                    <button onClick={clearFilters} className="text-xs font-bold text-red-500 hover:text-red-600 bg-red-50 px-2 py-1 rounded-lg transition-colors">
                                        Clear All
                                    </button>
                                )}
                            </div>

                            {/* Profession / Category */}
                            <div className="mb-6">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Profession / Category</h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {JOB_CATEGORIES.map((cat) => (
                                        <label
                                            key={cat}
                                            className="flex items-center gap-3 cursor-pointer group"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                toggleJobCategory(cat);
                                            }}
                                        >
                                            <div
                                                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${jobCategories[cat] ? 'bg-[#29a08e] border-[#29a08e]' : 'border-gray-300 group-hover:border-[#29a08e]'}`}
                                            >
                                                {jobCategories[cat] && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                            </div>
                                            <span className={`text-sm font-medium transition-colors ${jobCategories[cat] ? 'text-[#29a08e]' : 'text-gray-600 group-hover:text-gray-900'}`}>{cat}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Job Type */}
                            <div className="mb-6">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Job Type</h4>
                                <div className="space-y-2">
                                    {Object.keys(jobTypes).map(type => (
                                        <label key={type} className="flex items-center gap-3 cursor-pointer group">
                                            <div
                                                onClick={() => { handleCheckboxChange('type', type); setCurrentPage(1); }}
                                                className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${jobTypes[type] ? 'bg-[#29a08e] border-[#29a08e]' : 'border-gray-300 group-hover:border-[#29a08e]'}`}
                                            >
                                                {jobTypes[type] && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                            </div>
                                            <span className={`text-sm font-medium transition-colors ${jobTypes[type] ? 'text-[#29a08e]' : 'text-gray-600 group-hover:text-gray-900'}`}>{type}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Experience Level */}
                            <div>
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Experience Level</h4>
                                <div className="space-y-2">
                                    {Object.keys(experienceLevels).map(level => (
                                        <label key={level} className="flex items-center gap-3 cursor-pointer group">
                                            <div
                                                onClick={() => { handleCheckboxChange('level', level); setCurrentPage(1); }}
                                                className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${experienceLevels[level] ? 'bg-[#29a08e] border-[#29a08e]' : 'border-gray-300 group-hover:border-[#29a08e]'}`}
                                            >
                                                {experienceLevels[level] && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                            </div>
                                            <span className={`text-sm font-medium transition-colors ${experienceLevels[level] ? 'text-[#29a08e]' : 'text-gray-600 group-hover:text-gray-900'}`}>{level}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Sign Up CTA */}
                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <div className="bg-gradient-to-br from-[#29a08e]/5 to-[#29a08e]/10 border border-[#29a08e]/20 rounded-xl p-4">
                                    <p className="text-xs font-black text-[#29a08e] uppercase tracking-wider mb-1">Get More Matches</p>
                                    <p className="text-xs text-gray-600 leading-relaxed mb-3">Sign up to get AI-powered job recommendations.</p>
                                    <Link to="/register" className="block w-full py-2 text-center text-xs font-bold text-white bg-[#29a08e] rounded-lg hover:bg-[#228377] transition-colors">
                                        Create Free Account
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Jobs List */}
                    <div className="flex-1 relative">
                        {/* Results header */}
                        <div className="flex items-center justify-between mb-5 bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-3.5">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-black text-[#29a08e] text-lg">
                                    {listLoading ? '…' : jobs.length}
                                </span>
                                <span className="text-gray-500 text-sm font-medium">jobs found</span>
                                {listLoading && (
                                    <span className="inline-flex h-4 w-4 border-2 border-[#29a08e]/30 border-t-[#29a08e] rounded-full animate-spin" aria-hidden />
                                )}
                                {activeFilterCount > 0 && (
                                    <span className="text-gray-400 text-sm ml-1">with {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>Sort by:</span>
                                <select className="text-sm font-semibold text-gray-700 bg-transparent outline-none cursor-pointer">
                                    <option>Newest</option>
                                    <option>Relevant</option>
                                </select>
                            </div>
                        </div>

                        {listLoading && jobs.length === 0 && (
                            <div className="space-y-4">
                                {[...Array(4)].map((_, i) => (
                                    <ListRowSkeleton key={`sk-${i}`} />
                                ))}
                            </div>
                        )}
                        {currentJobs.length > 0 && (
                            <div className={`space-y-4 ${listLoading ? 'relative min-h-[120px]' : ''}`}>
                                {currentJobs.map((job) => (
                                    <div
                                        key={job._id}
                                        className={`group rounded-2xl border p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 ${
                                            job.activePromotion
                                                ? 'bg-gradient-to-br from-white to-[#29a08e]/[0.02] border-[#29a08e]/30 ring-1 ring-[#29a08e]/5'
                                                : 'bg-white border-gray-100 hover:border-[#29a08e]/20'
                                        }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-14 h-14 bg-[#29a08e]/10 rounded-xl flex items-center justify-center text-[#29a08e] font-black text-xl border border-[#29a08e]/20 shrink-0 group-hover:bg-[#29a08e]/15 transition-colors">
                                                {job.company_name?.charAt(0) || job.company_id?.name?.charAt(0) || 'N'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                                            <h3 className="font-black text-gray-900 text-lg group-hover:text-[#29a08e] transition-colors truncate">
                                                                <Link to={`/jobs/${job._id}`}>{job.title}</Link>
                                                            </h3>
                                                            <PromotionBadge job={job} />
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                                            <span className="text-sm font-semibold text-gray-600">{job.company_name || job.company_id?.name}</span>
                                                            <span className="text-gray-300">•</span>
                                                            <span className="text-sm text-gray-400 flex items-center gap-1">
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                </svg>
                                                                {job.location || 'Remote'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button type="button" className="p-2 text-gray-300 hover:text-[#29a08e] hover:bg-[#29a08e]/5 rounded-lg transition-all shrink-0">
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                                        </svg>
                                                    </button>
                                                </div>

                                                <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-50">
                                                    <div className="flex flex-wrap gap-2">
                                                        {job.type && (
                                                            <span className={`px-3 py-1 text-xs font-bold rounded-full border ${typeColors[job.type] || 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                                                                {job.type}
                                                            </span>
                                                        )}
                                                        {job.category && (
                                                            <span className="px-3 py-1 text-xs font-bold rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                                                                {job.category}
                                                            </span>
                                                        )}
                                                        <span className="px-3 py-1 text-xs font-bold bg-gray-50 text-gray-600 rounded-full border border-gray-100">
                                                            {normalizeSalaryRangeValue(job.salary_range, 'Competitive')}
                                                        </span>
                                                        {job.experience_level && (
                                                            <span className="px-3 py-1 text-xs font-bold bg-gray-50 text-gray-600 rounded-full border border-gray-100">
                                                                {job.experience_level}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Link
                                                            to={`/jobs/${job._id}`}
                                                            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
                                                        >
                                                            View Details
                                                        </Link>
                                                        <Link
                                                            to={
                                                                user?.role === 'jobseeker' || user?.role === 'job_seeker'
                                                                    ? `/apply/${job._id}`
                                                                    : user
                                                                        ? `/jobs/${job._id}`
                                                                        : `/login`
                                                            }
                                                            className="px-5 py-2 bg-[#29a08e] text-white rounded-xl text-sm font-bold hover:bg-[#228377] transition-all shadow-sm shadow-[#29a08e]/20"
                                                        >
                                                            Apply Now
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {listLoading && (
                                    <div
                                        className="absolute inset-0 rounded-2xl bg-white/55 backdrop-blur-[1px] flex items-start justify-center pt-16 z-10 pointer-events-none"
                                        aria-busy="true"
                                    >
                                        <div className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 border border-gray-100 shadow-md text-xs font-bold text-gray-600">
                                            <span className="inline-flex h-4 w-4 border-2 border-[#29a08e]/30 border-t-[#29a08e] rounded-full animate-spin" />
                                            Updating results…
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {!listLoading && currentJobs.length === 0 && (
                            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                                <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-4xl">🔍</div>
                                <h3 className="text-lg font-black text-gray-900 mb-2">No jobs found</h3>
                                <p className="text-gray-500 text-sm mb-6">Try adjusting your filters or search terms.</p>
                                <button onClick={clearFilters} className="px-6 py-2.5 text-sm font-bold text-[#29a08e] border border-[#29a08e]/30 rounded-xl hover:bg-[#29a08e]/5 transition-colors">
                                    Clear All Filters
                                </button>
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-8 flex justify-center">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-[#29a08e] hover:text-white hover:border-[#29a08e] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        ←
                                    </button>
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${currentPage === i + 1 ? 'bg-[#29a08e] text-white shadow-md shadow-[#29a08e]/20' : 'border border-gray-200 text-gray-600 hover:border-[#29a08e] hover:text-[#29a08e]'}`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-[#29a08e] hover:text-white hover:border-[#29a08e] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        →
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobListing;
