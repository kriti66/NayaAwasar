import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import useJobSaver from '../../hooks/useJobSaver';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import {
    Search, MapPin, Briefcase, DollarSign, Clock,
    Filter, X, ChevronDown, Bookmark, Star,
    ArrowRight, LayoutGrid, List, Sparkles,
    SlidersHorizontal, Compass, TrendingUp, Building2
} from 'lucide-react';
import CompanyLogo from '../../components/common/CompanyLogo';
import Pagination from '../../components/common/Pagination';
import FeaturedJobs from '../../components/jobs/FeaturedJobs';
import PromotionBadge from '../../components/jobs/PromotionBadge';

const FindJobs = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const showSavedOnly = searchParams.get('saved') === 'true';
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const { savedJobIds, setSavedJobIds, toggleSaveJob } = useJobSaver();

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [headerLocation, setHeaderLocation] = useState('');
    const [sidebarTitle, setSidebarTitle] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [salaryRange, setSalaryRange] = useState(50000);
    const [selectedTags, setSelectedTags] = useState([]);
    const [filters, setFilters] = useState({
        jobType: [],
        experienceLevel: [],
        category: [],
        datePosted: 'All'
    });
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    const [viewMode, setViewMode] = useState('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const jobsPerPage = 6;

    useEffect(() => {
        const normalizeIds = (ids) =>
            Array.isArray(ids) ? ids.map(id => (id?.toString?.() || id)) : [];

        const fetchData = async () => {
            try {
                setLoading(true);
                if (showSavedOnly) {
                    const savedRes = await api.get('/jobs/saved');
                    const jobList = savedRes.data?.jobs || [];
                    setJobs(Array.isArray(jobList) ? jobList : []);
                    setSavedJobIds(normalizeIds(savedRes.data?.savedJobIds));
                } else {
                    const [jobsRes, savedRes] = await Promise.all([
                        api.get('/jobs/for-seeker'),
                        api.get('/jobs/saved')
                    ]);
                    setJobs(Array.isArray(jobsRes.data) ? jobsRes.data : []);
                    setSavedJobIds(normalizeIds(savedRes.data?.savedJobIds));
                }
            } catch (error) {
                console.error("[FindJobs] Error fetching jobs:", error?.message || error);
                toast.error("Failed to load jobs");
                setJobs([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [showSavedOnly, setSavedJobIds]);

    const toggleFilter = (category, value) => {
        setFilters(prev => {
            const current = [...prev[category]];
            if (current.includes(value)) {
                return { ...prev, [category]: current.filter(v => v !== value) };
            } else {
                return { ...prev, [category]: [...current, value] };
            }
        });
    };

    const toggleTag = (tag) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const clearFilters = () => {
        setFilters({ jobType: [], experienceLevel: [], category: [], datePosted: 'All' });
        setSearchQuery('');
        setHeaderLocation('');
        setSidebarTitle('');
        setSelectedLocation('');
        setSalaryRange(50000);
        setSelectedTags([]);
    };

    const filteredJobs = useMemo(() => {
        let result = jobs;
        if (showSavedOnly) {
            const savedSet = new Set(savedJobIds.map(id => (id?.toString?.() || id)));
            result = result.filter(job => savedSet.has((job._id || job.id)?.toString?.()));
        }
        return result.filter(job => {
            const titleMatch = (job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                job.company_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (job.title?.toLowerCase().includes(sidebarTitle.toLowerCase()));

            const locationMatch = !selectedLocation || job.location?.includes(selectedLocation) || job.location?.includes(headerLocation);

            const typeMatch = filters.jobType.length === 0 || filters.jobType.includes(job.type);

            const expMatch = filters.experienceLevel.length === 0 || filters.experienceLevel.includes(job.experience_level);

            const tagMatch = selectedTags.length === 0 ||
                selectedTags.some(tag => job.skills?.toLowerCase().includes(tag.toLowerCase()));

            return titleMatch && locationMatch && typeMatch && expMatch && tagMatch;
        });
    }, [jobs, searchQuery, sidebarTitle, selectedLocation, headerLocation, filters, selectedTags, showSavedOnly, savedJobIds]);

    const activeFilterCount = useMemo(() => {
        let count = filters.jobType.length + filters.experienceLevel.length + filters.category.length + selectedTags.length;
        if (selectedLocation) count += 1;
        if (searchQuery) count += 1;
        return count;
    }, [filters, selectedTags, selectedLocation, searchQuery]);

    const indexOfLastJob = currentPage * jobsPerPage;
    const indexOfFirstJob = indexOfLastJob - jobsPerPage;
    const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);
    const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);

    const timeAgo = (date) => {
        if (!date) return 'Recently';
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + 'd ago';
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + 'h ago';
        return 'Just now';
    };

    const getMatchBadgeLabel = (job) => {
        const score = job.matchScore;
        if (score != null && score >= 10) return `${score}% Match`;
        if (job.isRecommended) return 'AI Suggested';
        return null;
    };

    const JobCard = ({ job }) => {
        const matchLabel = getMatchBadgeLabel(job);
        const isRecommended = !!matchLabel;
        const isPromoted = job?.activePromotion || (job?.isPromoted && job?.promotionType && job.promotionType !== 'NONE');
        return (
        <div className={`group rounded-2xl border transition-all duration-300 hover:shadow-xl p-6 relative ${
            isPromoted
                ? 'bg-gradient-to-br from-white to-amber-50/30 border-amber-200/50 ring-1 ring-amber-200/30 shadow-sm'
                : isRecommended
                    ? 'bg-white border-[#29a08e]/20 ring-1 ring-[#29a08e]/10'
                    : 'bg-white border-gray-100 shadow-sm hover:border-[#29a08e]/20'
        }`}>
            {matchLabel && (
                <div className="absolute -top-3 right-6">
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-[#29a08e] to-[#22877a] text-white rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-[#29a08e]/20">
                        <Sparkles size={10} /> {matchLabel}
                    </span>
                </div>
            )}

            <div className={`flex flex-col ${viewMode === 'grid' ? '' : 'md:flex-row'} gap-5`}>
                <CompanyLogo job={job} className="w-14 h-14 rounded-xl p-2 group-hover:scale-105 transition-transform duration-300 shadow-inner" imgClassName="w-full h-full" fallbackClassName="text-xl" />

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                <h3 className="text-base font-bold text-gray-900 group-hover:text-[#29a08e] transition-colors line-clamp-1">{job.title}</h3>
                                <PromotionBadge job={job} />
                            </div>
                            <p className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
                                <Building2 size={12} className="text-gray-400" />
                                {job.company_name}
                                <span className="text-gray-300">·</span>
                                <span className="text-xs text-gray-400">{timeAgo(job.createdAt || job.posted_date)}</span>
                            </p>
                        </div>
                        <button
                            onClick={() => toggleSaveJob(job.id || job._id)}
                            className={`p-2 rounded-xl transition-all ${savedJobIds.includes(job.id || job._id) ? 'text-[#29a08e] bg-[#29a08e]/10' : 'text-gray-400 hover:text-[#29a08e] hover:bg-[#29a08e]/5'}`}
                        >
                            <Bookmark size={16} fill={savedJobIds.includes(job.id || job._id) ? "currentColor" : "none"} />
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {[job.type, job.experience_level, job.location].filter(Boolean).slice(0, 3).map((badge, i) => (
                            <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-50 text-gray-600 text-[10px] font-bold border border-gray-100 uppercase tracking-wide">
                                {badge}
                            </span>
                        ))}
                    </div>

                    {job.matchReason && (
                        <div className="mb-4 text-xs font-medium text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                            <span className="font-bold text-gray-800">Why this job?</span> {job.matchReason}
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                        <div className="flex items-center gap-1 text-gray-700 font-bold text-xs">
                            <DollarSign size={14} className="text-[#29a08e]" />
                            {job.salary_range || 'Negotiable'}
                        </div>
                        <Link
                            to={`/jobseeker/jobs/${job.id || job._id}`}
                            className="px-5 py-2 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                        >
                            Details <ArrowRight size={12} />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
        );
    };

    // Filter sidebar content (shared between desktop and mobile)
    const FilterContent = () => (
        <div className="space-y-6">
            {/* Sidebar Search */}
            <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Job Title</h4>
                <input
                    type="text"
                    value={sidebarTitle}
                    onChange={(e) => setSidebarTitle(e.target.value)}
                    placeholder="e.g. Designer"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[#29a08e] focus:ring-2 focus:ring-[#29a08e]/10 transition-all text-xs font-bold"
                />
            </div>

            {/* Job Type Filter */}
            <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Job Type</h4>
                <div className="space-y-2">
                    {['Full-time', 'Part-time', 'Freelance', 'Internship'].map(type => (
                        <label key={type} className="flex items-center cursor-pointer group py-1" onClick={() => toggleFilter('jobType', type)}>
                            <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center mr-3 transition-all ${filters.jobType.includes(type) ? 'bg-[#29a08e] border-[#29a08e] shadow-sm shadow-[#29a08e]/20' : 'border-gray-200 group-hover:border-[#29a08e]/50'}`}>
                                {filters.jobType.includes(type) && (
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900 transition-colors">{type}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Experience Level */}
            <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Experience</h4>
                <div className="space-y-2">
                    {['Fresher', 'Intermediate', 'Expert'].map(level => (
                        <label key={level} className="flex items-center cursor-pointer group py-1" onClick={() => toggleFilter('experienceLevel', level)}>
                            <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center mr-3 transition-all ${filters.experienceLevel.includes(level) ? 'bg-[#29a08e] border-[#29a08e] shadow-sm shadow-[#29a08e]/20' : 'border-gray-200 group-hover:border-[#29a08e]/50'}`}>
                                {filters.experienceLevel.includes(level) && (
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900 transition-colors">{level}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Tags */}
            <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Skills & Tags</h4>
                <div className="flex flex-wrap gap-2">
                    {['React', 'Node', 'Design', 'Marketing', 'Python', 'DevOps'].map(tag => (
                        <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${selectedTags.includes(tag) ? 'bg-[#29a08e] text-white border-[#29a08e] shadow-sm shadow-[#29a08e]/20' : 'bg-gray-50 text-gray-500 border-gray-100 hover:border-[#29a08e]/50 hover:text-[#29a08e]'}`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <div className="w-14 h-14 border-4 border-[#29a08e]/20 rounded-full"></div>
                            <div className="w-14 h-14 border-4 border-[#29a08e] border-t-transparent rounded-full animate-spin absolute inset-0"></div>
                        </div>
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Loading Jobs...</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            {/* Hero Search Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1a2744] to-[#0d2137] text-white pt-10 pb-24 px-4 sm:px-6 lg:px-8">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#29a08e]/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl"></div>
                    <div className="absolute inset-0 opacity-[0.03]" style={{
                        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                        backgroundSize: '40px 40px'
                    }}></div>
                </div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-semibold text-gray-300 border border-white/10">
                                <Compass size={12} className="text-[#5eead4]" />
                                {showSavedOnly ? 'Saved Jobs' : 'Job Explorer'}
                            </span>
                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-[#29a08e]/20 backdrop-blur-md rounded-full text-[10px] font-semibold text-[#5eead4] border border-[#29a08e]/30">
                                <TrendingUp size={12} />
                                {showSavedOnly ? `${savedJobIds.length} saved` : `${jobs.length} opportunities`}
                            </span>
                            {showSavedOnly && (
                                <Link to="/seeker/jobs" className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 backdrop-blur-md rounded-full text-[10px] font-semibold text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors">
                                    View all jobs
                                </Link>
                            )}
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
                            {showSavedOnly ? (
                                <>Your <span className="bg-gradient-to-r from-[#5eead4] to-[#29a08e] bg-clip-text text-transparent">Saved Jobs</span></>
                            ) : (
                                <>Find Your <span className="bg-gradient-to-r from-[#5eead4] to-[#29a08e] bg-clip-text text-transparent">Dream Job</span></>
                            )}
                        </h1>
                        <p className="text-gray-400 font-medium max-w-lg mx-auto">
                            {showSavedOnly ? 'Jobs you\'ve bookmarked for later. Apply when you\'re ready.' : 'Discover opportunities matched to your skills and aspirations'}
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-1.5 flex flex-col md:flex-row gap-1.5 border border-white/10 shadow-2xl shadow-black/20">
                            <div className="flex-1 flex items-center px-4 bg-white/5 rounded-xl">
                                <Search className="text-gray-400 mr-3 shrink-0" size={18} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Job title, keywords..."
                                    className="w-full py-3.5 bg-transparent outline-none font-medium text-sm text-white placeholder:text-gray-500"
                                />
                            </div>
                            <div className="flex-1 flex items-center px-4 bg-white/5 rounded-xl">
                                <MapPin className="text-gray-400 mr-3 shrink-0" size={18} />
                                <input
                                    type="text"
                                    value={headerLocation}
                                    onChange={(e) => setHeaderLocation(e.target.value)}
                                    placeholder="City or location"
                                    className="w-full py-3.5 bg-transparent outline-none font-medium text-sm text-white placeholder:text-gray-500"
                                />
                            </div>
                            <button className="px-8 py-3.5 bg-gradient-to-r from-[#29a08e] to-[#22877a] text-white rounded-xl font-bold text-sm hover:from-[#228377] hover:to-[#1a6b62] transition-all shadow-lg shadow-[#29a08e]/20 active:scale-95 shrink-0">
                                Search
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Featured Opportunities - same as public page, when not viewing saved only */}
            {!showSavedOnly && <FeaturedJobs />}

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 -mt-10 relative z-10 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Sidebar - Filters */}
                    <aside className="lg:col-span-3 order-2 lg:order-1">
                        {/* Mobile filter toggle */}
                        <button
                            onClick={() => setShowMobileFilters(!showMobileFilters)}
                            className="lg:hidden w-full flex items-center justify-center gap-2 p-3 bg-white rounded-xl border border-gray-100 shadow-sm mb-4 text-sm font-bold text-gray-700"
                        >
                            <SlidersHorizontal size={16} />
                            {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
                            {activeFilterCount > 0 && (
                                <span className="w-5 h-5 rounded-full bg-[#29a08e] text-white text-[10px] font-bold flex items-center justify-center">{activeFilterCount}</span>
                            )}
                        </button>

                        <div className={`${showMobileFilters ? 'block' : 'hidden'} lg:block`}>
                            <div className="sticky top-24 space-y-5">
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                            <SlidersHorizontal size={16} className="text-[#29a08e]" /> Filters
                                            {activeFilterCount > 0 && (
                                                <span className="w-5 h-5 rounded-full bg-[#29a08e] text-white text-[10px] font-bold flex items-center justify-center">{activeFilterCount}</span>
                                            )}
                                        </h3>
                                        <button
                                            onClick={clearFilters}
                                            className="text-[10px] font-bold text-gray-400 hover:text-red-500 uppercase tracking-wider transition-colors"
                                        >
                                            Clear all
                                        </button>
                                    </div>
                                    <FilterContent />
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Right Content - Job Listings */}
                    <div className="lg:col-span-9 space-y-5 order-1 lg:order-2">
                        {/* Results Header */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between shadow-sm">
                            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <span className="text-[#29a08e] font-extrabold text-lg">{filteredJobs.length}</span> Jobs Found
                            </h2>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setViewMode('grid')} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${viewMode === 'grid' ? 'bg-gray-100 text-[#29a08e]' : 'text-gray-400 hover:bg-gray-50'}`}><LayoutGrid size={16} /></button>
                                <button onClick={() => setViewMode('list')} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${viewMode === 'list' ? 'bg-gray-100 text-[#29a08e]' : 'text-gray-400 hover:bg-gray-50'}`}><List size={16} /></button>
                            </div>
                        </div>

                        {/* Jobs Grid */}
                        <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} gap-4`}>
                            {currentJobs.length > 0 ? (
                                currentJobs.map(job => (
                                    <JobCard key={job._id || job.id} job={job} />
                                ))
                            ) : (
                                <div className="col-span-full bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300 shadow-inner">
                                        {showSavedOnly ? <Star size={24} /> : <Search size={24} />}
                                    </div>
                                    <h3 className="text-gray-900 font-bold mb-1">
                                        {showSavedOnly ? 'No saved jobs yet' : 'No jobs found'}
                                    </h3>
                                    <p className="text-gray-500 text-xs mt-1 mb-6">
                                        {showSavedOnly
                                            ? 'Save jobs you\'re interested in by clicking the bookmark icon. They\'ll appear here.'
                                            : 'Try adjusting your filters or search criteria'}
                                    </p>
                                    <div className="flex items-center justify-center gap-3 flex-wrap">
                                        {showSavedOnly ? (
                                            <Link to="/seeker/jobs" className="px-5 py-2.5 bg-[#29a08e] text-white text-xs font-bold rounded-xl hover:bg-[#228377] transition-all shadow-lg shadow-[#29a08e]/20">
                                                Browse Jobs
                                            </Link>
                                        ) : (
                                            <button onClick={clearFilters} className="px-5 py-2.5 bg-[#29a08e] text-white text-xs font-bold rounded-xl hover:bg-[#228377] transition-all shadow-lg shadow-[#29a08e]/20">
                                                Clear All Filters
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        )}
                    </div>
                </div>
            </main>
        </>
    );
};

export default FindJobs;
