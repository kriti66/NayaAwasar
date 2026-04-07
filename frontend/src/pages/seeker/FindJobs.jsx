import { useState, useEffect, useMemo, useRef, memo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import useJobSaver from '../../hooks/useJobSaver';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import {
    Search, MapPin, Briefcase, Clock,
    Filter, X, ChevronDown, Bookmark, Star,
    ArrowRight, LayoutGrid, List,
    SlidersHorizontal, Compass, TrendingUp, Building2
} from 'lucide-react';
import CompanyLogo from '../../components/common/CompanyLogo';
import Pagination from '../../components/common/Pagination';
import FeaturedJobs from '../../components/jobs/FeaturedJobs';
import PromotionBadge from '../../components/jobs/PromotionBadge';
import { JOB_CATEGORIES } from '../../constants/jobCategories';
import { applyVisibleBadgeLimits, BADGE_CONFIG } from '../../utils/jobLabelDisplay';
import { jobHasRecommendationScore } from '../../utils/recommendationFriendly';
import { JobMatchProgressBar, JobMatchScoreCorner, JobMatchWhyBlock } from '../../components/jobs/JobMatchUi';

/** Sidebar experience labels → Job.experience_level values (exact match) */
const SEEKER_EXP_TO_API = {
    'Entry-level': ['Entry-level'],
    'Mid-level': ['Mid-level'],
    Senior: ['Senior'],
    Executive: ['Executive']
};

const JobCardSkeleton = () => (
    <div className="rounded-2xl border border-gray-100 shadow-sm p-6 animate-pulse bg-white">
        <div className="flex gap-5">
            <div className="w-14 h-14 rounded-xl bg-gray-100 shrink-0" />
            <div className="flex-1 space-y-3">
                <div className="h-4 bg-gray-100 rounded w-2/3" />
                <div className="h-3 bg-gray-50 rounded w-1/2" />
                <div className="flex gap-2 pt-2">
                    <div className="h-6 w-16 bg-gray-50 rounded-lg" />
                    <div className="h-6 w-20 bg-gray-50 rounded-lg" />
                </div>
                <div className="h-10 bg-gray-50 rounded-lg mt-4" />
            </div>
        </div>
    </div>
);

const normalizeSalaryRangeToNrsValue = (value) => {
    if (value == null) return 'Negotiable';
    const raw = String(value).trim();
    if (!raw) return 'Negotiable';

    // Keep non-numeric labels as-is (e.g., Negotiable/Competitive)
    if (/negotiable/i.test(raw) || !/\d/.test(raw)) {
        return raw;
    }

    // Strip any currency symbols/prefixes from backend (e.g. "$ 30000-40000")
    return raw
        .replace(/\$/g, '')
        .replace(/\bUSD\b/gi, '')
        .replace(/\bdollar\b/gi, '')
        .replace(/^\s*(Rs\.?|Nrs\.?)\s*/i, '')
        .trim();
};

// Keep typing smooth by storing the "raw" input value inside the input component.
// Only the debounced/applied value updates FindJobs, which drives API fetch + heavy rendering.
const DebouncedTextInput = memo(function DebouncedTextInput({
    placeholder,
    className,
    onDebouncedChange,
    resetToken,
    debounceMs = 400,
    defaultValue = ''
}) {
    const [localValue, setLocalValue] = useState(defaultValue);

    useEffect(() => {
        setLocalValue(defaultValue);
    }, [defaultValue, resetToken]);

    useEffect(() => {
        const t = setTimeout(() => {
            onDebouncedChange(localValue.trim());
        }, debounceMs);
        return () => clearTimeout(t);
    }, [localValue, onDebouncedChange, debounceMs]);

    return (
        <input
            type="text"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            placeholder={placeholder}
            className={className}
        />
    );
});

const LEGACY_TITLE_CATEGORY_KEYWORDS = {
    Health: ['health', 'medical', 'hospital', 'doctor', 'nurse', 'nursing', 'clinic', 'patient', 'healthcare', 'pharma', 'pharmacy', 'surgeon', 'dentist', 'therapy', 'therapist', 'paramedic', 'midwife'],
    Education: ['education', 'teaching', 'teacher', 'school', 'lecturer', 'tutor', 'academic', 'university', 'college', 'principal', 'professor', 'instructor', 'curriculum'],
    IT: ['it', 'software', 'developer', 'programming', 'programmer', 'tech', 'technology', 'computer', 'coding', 'devops', 'frontend', 'backend', 'full stack', 'fullstack', 'data science', 'cyber', 'network admin', 'sysadmin', 'saas'],
    Finance: ['finance', 'financial', 'accounting', 'accountant', 'bank', 'banking', 'audit', 'investment', 'cfo', 'bookkeeping', 'tax', 'treasury', 'insurance'],
    Engineering: ['engineering', 'engineer', 'civil', 'mechanical', 'electrical', 'structural', 'construction', 'survey', 'cad', 'manufacturing', 'plant'],
    Government: ['government', 'public sector', 'civil service', 'municipal', 'ministry', 'nepal government']
};

function inferLegacyCategoryFromTitle(title) {
    const text = String(title || '').toLowerCase();
    if (!text) return '';
    for (const category of Object.keys(LEGACY_TITLE_CATEGORY_KEYWORDS)) {
        const keywords = LEGACY_TITLE_CATEGORY_KEYWORDS[category];
        if (keywords.some((kw) => text.includes(kw))) return category;
    }
    return '';
}

function matchesSavedJobFilters(job, ctx) {
    const { searchQuery, sidebarTitle, headerLocation, selectedLocation, filters, selectedTags } = ctx;
    const combinedQ = [searchQuery, sidebarTitle].filter(Boolean).join(' ').trim().toLowerCase();
    if (combinedQ) {
        const blob = [
            job.title,
            job.company_name,
            job.description,
            job.job_description,
            job.category,
            ...(Array.isArray(job.tags) ? job.tags : [])
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
        const words = combinedQ.split(/\s+/).filter(Boolean);
        if (!words.every((w) => blob.includes(w))) return false;
    }
    const loc = (selectedLocation || headerLocation || '').trim();
    if (loc && !(job.location || '').toLowerCase().includes(loc.toLowerCase())) return false;
    
    if (filters.jobType.length && !filters.jobType.includes(job.type)) return false;
    
    if (filters.category.length) {
        const jobCategory = String(job.category || '').trim();
        if (jobCategory) {
            if (!filters.category.includes(jobCategory)) return false;
        } else {
            // Temporary fallback for old jobs missing category.
            const inferred = inferLegacyCategoryFromTitle(job.title);
            if (!inferred || !filters.category.includes(inferred)) return false;
        }
    }
    
    if (filters.experienceLevel.length) {
        const allowed = filters.experienceLevel.flatMap((l) => SEEKER_EXP_TO_API[l] || []);
        const exp = job.experience_level;
        if (!exp) return false; // Old jobs without experience_level should not appear when filter is active
        if (!allowed.includes(exp)) return false;
    }
    
    if (selectedTags.length) {
        const skillStr = (job.skills || '').toLowerCase();
        const tagStr = (Array.isArray(job.tags) ? job.tags.join(' ') : '').toLowerCase();
        const comb = `${skillStr} ${tagStr}`;
        if (!selectedTags.every((t) => comb.includes(t.toLowerCase()))) return false;
    }
    return true;
}

const timeAgo = (date) => {
    if (!date) return 'Recently';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + 'd ago';
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + 'h ago';
    return 'Just now';
};

const JobCard = memo(({ job, savedJobIds, toggleSaveJob, viewMode }) => {
    const badgeCfg = job.visibleLabel ? BADGE_CONFIG[job.visibleLabel] : null;
    const hasRecScore = jobHasRecommendationScore(job);
    const showLegacyPromoBadge =
        badgeCfg &&
        (!hasRecScore ||
            job.visibleLabel === 'SPONSORED' ||
            job.visibleLabel === 'FEATURED');
    const isAiStyle = ['AI_SUGGESTED', 'GOOD_MATCH'].includes(job.visibleLabel || '');
    const isPromoted = job?.activePromotion || (job?.isPromoted && job?.promotionType && job.promotionType !== 'NONE');
    const salaryValue = normalizeSalaryRangeToNrsValue(job.salary_range || 'Negotiable');
    const salaryHasDigits = /\d/.test(salaryValue);
    const companyLine = job.company_id?.name || job.company_name;
    return (
    <div className={`group rounded-2xl border transition-all duration-300 hover:shadow-xl p-6 relative ${
        isPromoted && job.visibleLabel === 'SPONSORED'
            ? 'bg-gradient-to-br from-white to-amber-50/30 border-amber-200/50 ring-1 ring-amber-200/30 shadow-sm'
            : isAiStyle
                ? 'bg-white border-[#29a08e]/20 ring-1 ring-[#29a08e]/10'
                : isPromoted
                    ? 'bg-gradient-to-br from-white to-amber-50/30 border-amber-200/50 ring-1 ring-amber-200/30 shadow-sm'
                    : 'bg-white border-gray-100 shadow-sm hover:border-[#29a08e]/20'
    }`}>
        {(hasRecScore || showLegacyPromoBadge) && (
            <div className="absolute top-4 right-6 z-[1] flex flex-col items-end gap-2 max-w-[58%] text-right">
                {hasRecScore && <JobMatchScoreCorner job={job} layout="inline" />}
                {showLegacyPromoBadge && (
                    <span
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-md ${badgeCfg.className}`}
                    >
                        <span aria-hidden>{badgeCfg.icon}</span> {badgeCfg.label}
                    </span>
                )}
            </div>
        )}

        <div className={`flex flex-col ${viewMode === 'grid' ? '' : 'md:flex-row'} gap-5 ${hasRecScore || showLegacyPromoBadge ? 'pt-2' : ''}`}>
            <CompanyLogo job={job} className="w-14 h-14 rounded-xl p-2 group-hover:scale-105 transition-transform duration-300 shadow-inner" imgClassName="w-full h-full" fallbackClassName="text-xl" />

            <div className={`flex-1 min-w-0 ${hasRecScore ? 'pr-2 sm:pr-28' : showLegacyPromoBadge ? 'pr-2 sm:pr-24' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                    <div className="min-w-0 pr-2">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                            <h3 className="text-base font-bold text-gray-900 group-hover:text-[#29a08e] transition-colors line-clamp-1">{job.title}</h3>
                            {!job.visibleLabel && <PromotionBadge job={job} />}
                        </div>
                        <p className="text-sm font-medium text-gray-500 flex items-center gap-1.5 flex-wrap">
                            <Building2 size={12} className="text-gray-400 shrink-0" />
                            <span className="truncate">{companyLine}</span>
                            <span className="text-gray-300">·</span>
                            <span className="text-xs text-gray-400 shrink-0">{timeAgo(job.createdAt || job.posted_date)}</span>
                        </p>
                    </div>
                    <button
                        onClick={() => toggleSaveJob(job.id || job._id)}
                        className={`p-2 rounded-xl transition-all shrink-0 ${savedJobIds.includes(job.id || job._id) ? 'text-[#29a08e] bg-[#29a08e]/10' : 'text-gray-400 hover:text-[#29a08e] hover:bg-[#29a08e]/5'}`}
                    >
                        <Bookmark size={16} fill={savedJobIds.includes(job.id || job._id) ? "currentColor" : "none"} />
                    </button>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                    {[job.category, job.type, job.experience_level, job.location].filter(Boolean).slice(0, 4).map((badge, i) => (
                        <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-50 text-gray-600 text-[10px] font-bold border border-gray-100 uppercase tracking-wide">
                            {badge}
                        </span>
                    ))}
                </div>

                <JobMatchProgressBar job={job} className="mb-3" />

                <JobMatchWhyBlock job={job} className="mb-4" />

                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-1 text-gray-700 font-bold text-xs">
                        {salaryHasDigits ? (
                            <>
                                <span className="text-[#29a08e] font-bold">Nrs</span>
                                {salaryValue}
                            </>
                        ) : (
                            salaryValue
                        )}
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
}, (prevProps, nextProps) => {
    return prevProps.job === nextProps.job &&
           prevProps.savedJobIds.includes(prevProps.job.id || prevProps.job._id) === nextProps.savedJobIds.includes(nextProps.job.id || nextProps.job._id) &&
           prevProps.viewMode === nextProps.viewMode;
});

const FilterContent = ({
    inputResetToken,
    setSidebarTitle,
    filters,
    toggleFilter,
    selectedTags,
    toggleTag
}) => (
    <div className="space-y-6">
        {/* Sidebar Search */}
        <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Job Title</h4>
            <DebouncedTextInput
                placeholder="e.g. Designer, nurse, teaching"
                resetToken={inputResetToken}
                onDebouncedChange={setSidebarTitle}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[#29a08e] focus:ring-2 focus:ring-[#29a08e]/10 transition-all text-xs font-bold"
            />
        </div>

        {/* Profession / Category */}
        <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Profession / Category</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {JOB_CATEGORIES.map((cat) => (
                    <label key={cat} className="flex items-center cursor-pointer group py-0.5" onClick={() => toggleFilter('category', cat)}>
                        <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center mr-3 transition-all ${filters.category.includes(cat) ? 'bg-[#29a08e] border-[#29a08e] shadow-sm shadow-[#29a08e]/20' : 'border-gray-200 group-hover:border-[#29a08e]/50'}`}>
                            {filters.category.includes(cat) && (
                                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                        <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900 transition-colors">{cat}</span>
                    </label>
                ))}
            </div>
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

const FindJobs = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const showSavedOnly = searchParams.get('saved') === 'true';
    const [jobs, setJobs] = useState([]);
    const [hasPersonalizationData, setHasPersonalizationData] = useState(true);
    /** List fetch in progress (scoped to results — does not unmount the page). */
    const [listLoading, setListLoading] = useState(true);
    const listFetchGen = useRef(0);
    const { savedJobIds, setSavedJobIds, toggleSaveJob } = useJobSaver();

    // Search & Filter State
    // Applied values drive fetching + heavy logic. Raw typing state lives inside the input components.
    const [searchQuery, setSearchQuery] = useState(() => (searchParams.get('q') || '').trim());
    const [headerLocation, setHeaderLocation] = useState(() => (searchParams.get('location') || '').trim());
    const [sidebarTitle, setSidebarTitle] = useState('');
    const [inputResetToken, setInputResetToken] = useState(0);
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

    const normalizeIds = (ids) =>
        Array.isArray(ids) ? ids.map((id) => (id?.toString?.() || id)) : [];

    const filterQueryKey = useMemo(
        () =>
            JSON.stringify({
                searchQuery,
                sidebarTitle,
                headerLocation,
                selectedLocation,
                filters,
                selectedTags
            }),
        [searchQuery, sidebarTitle, headerLocation, selectedLocation, filters, selectedTags]
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [filterQueryKey, showSavedOnly]);

    const searchParamsKey = searchParams.toString();
    useEffect(() => {
        if (showSavedOnly) return;
        const sp = new URLSearchParams(searchParamsKey);
        setSearchQuery((sp.get('q') || '').trim());
        setHeaderLocation((sp.get('location') || '').trim());
    }, [searchParamsKey, showSavedOnly]);

    useEffect(() => {
        if (!showSavedOnly) return;
        const gen = ++listFetchGen.current;
        let cancelled = false;
        (async () => {
            try {
                setListLoading(true);
                const savedRes = await api.get('/jobs/saved');
                if (cancelled || gen !== listFetchGen.current) return;
                const jobList = savedRes.data?.jobs || [];
                setJobs(Array.isArray(jobList) ? jobList : []);
                setHasPersonalizationData(true);
                setSavedJobIds(normalizeIds(savedRes.data?.savedJobIds));
            } catch (error) {
                if (!cancelled && gen === listFetchGen.current) {
                    console.error('[FindJobs] Error fetching saved jobs:', error?.message || error);
                    toast.error('Failed to load saved jobs');
                    setJobs([]);
                }
            } finally {
                if (!cancelled && gen === listFetchGen.current) setListLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [showSavedOnly, setSavedJobIds]);

    useEffect(() => {
        if (showSavedOnly) return;
        const gen = ++listFetchGen.current;
        const ctrl = new AbortController();
        const combinedQ = [searchQuery, sidebarTitle].filter(Boolean).join(' ').trim();
        // Search input is already debounced (raw -> applied). Avoid double-debouncing.
        const debounceMs = 0;
        const t = setTimeout(async () => {
            try {
                setListLoading(true);
                const params = {};
                if (combinedQ) params.q = combinedQ;
                const loc = (headerLocation || selectedLocation || '').trim();
                if (loc) params.location = loc;
                if (filters.jobType.length) params.jobType = filters.jobType.join(',');
                if (filters.category.length) params.category = filters.category.join(',');
                const expLevels = filters.experienceLevel.flatMap((l) => SEEKER_EXP_TO_API[l] || []);
                if (expLevels.length) params.experienceLevel = [...new Set(expLevels)].join(',');
                if (selectedTags.length) params.tags = selectedTags.join(',');
                const [jobsOutcome, savedOutcome] = await Promise.allSettled([
                    api.get('/jobs/for-seeker', { params, signal: ctrl.signal }),
                    api.get('/jobs/saved', { signal: ctrl.signal })
                ]);
                if (ctrl.signal.aborted || gen !== listFetchGen.current) return;

                if (jobsOutcome.status === 'fulfilled') {
                    const payload = jobsOutcome.value.data;
                    const list = Array.isArray(payload?.jobs)
                        ? payload.jobs
                        : Array.isArray(payload)
                          ? payload
                          : [];
                    setJobs(list);
                    setHasPersonalizationData(payload?.hasPersonalizationData !== false);
                } else {
                    const err = jobsOutcome.reason;
                    if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return;
                    console.error('[FindJobs] Error fetching jobs:', err?.message || err);
                    toast.error('Failed to load jobs');
                    setJobs([]);
                }

                if (savedOutcome.status === 'fulfilled') {
                    setSavedJobIds(normalizeIds(savedOutcome.value.data?.savedJobIds));
                } else {
                    const err = savedOutcome.reason;
                    if (err?.code !== 'ERR_CANCELED' && err?.name !== 'CanceledError') {
                        console.warn('[FindJobs] Saved jobs fetch failed (list still shown):', err?.message || err);
                    }
                }
            } catch (error) {
                if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') return;
                console.error('[FindJobs] Error fetching jobs:', error?.message || error);
                if (gen === listFetchGen.current) {
                    toast.error('Failed to load jobs');
                    setJobs([]);
                }
            } finally {
                if (!ctrl.signal.aborted && gen === listFetchGen.current) setListLoading(false);
            }
        }, debounceMs);
        return () => {
            clearTimeout(t);
            ctrl.abort();
        };
    }, [showSavedOnly, filterQueryKey, setSavedJobIds]);

    const toggleFilter = (category, value) => {
        setCurrentPage(1);
        setFilters((prev) => {
            const current = [...prev[category]];
            if (current.includes(value)) {
                return { ...prev, [category]: current.filter((v) => v !== value) };
            }
            return { ...prev, [category]: [...current, value] };
        });
    };

    const toggleTag = (tag) => {
        setCurrentPage(1);
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    };

    const clearFilters = () => {
        setFilters({ jobType: [], experienceLevel: [], category: [], datePosted: 'All' });
        setSearchQuery('');
        setHeaderLocation('');
        setSidebarTitle('');
        setInputResetToken((t) => t + 1);
        setSelectedLocation('');
        setSalaryRange(50000);
        setSelectedTags([]);
    };

    const filteredJobs = useMemo(() => {
        if (!showSavedOnly) return jobs;
        const savedSet = new Set(savedJobIds.map((id) => (id?.toString?.() || id)));
        const savedList = jobs.filter((job) =>
            savedSet.has((job._id || job.id)?.toString?.())
        );
        const ctx = {
            searchQuery,
            sidebarTitle,
            headerLocation,
            selectedLocation,
            filters,
            selectedTags
        };
        return savedList.filter((job) => matchesSavedJobFilters(job, ctx));
    }, [
        jobs,
        showSavedOnly,
        savedJobIds,
        searchQuery,
        sidebarTitle,
        headerLocation,
        selectedLocation,
        filters,
        selectedTags
    ]);

    const activeFilterCount = useMemo(() => {
        let count =
            filters.jobType.length +
            filters.experienceLevel.length +
            filters.category.length +
            selectedTags.length;
        if (selectedLocation?.trim()) count += 1;
        if (searchQuery?.trim()) count += 1;
        if (sidebarTitle?.trim()) count += 1;
        if (headerLocation?.trim()) count += 1;
        return count;
    }, [filters, selectedTags, selectedLocation, searchQuery, sidebarTitle, headerLocation]);

    const indexOfLastJob = currentPage * jobsPerPage;
    const indexOfFirstJob = indexOfLastJob - jobsPerPage;
    const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);
    const currentJobsWithBadges = useMemo(
        () => applyVisibleBadgeLimits(currentJobs),
        [currentJobs]
    );
    const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);



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
                                {showSavedOnly
                                    ? `${filteredJobs.length} shown`
                                    : listLoading && jobs.length === 0
                                        ? '…'
                                        : `${filteredJobs.length} opportunities`}
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
                                <DebouncedTextInput
                                    placeholder="Job title, keywords..."
                                    resetToken={inputResetToken}
                                    defaultValue={searchQuery}
                                    onDebouncedChange={setSearchQuery}
                                    className="w-full py-3.5 bg-transparent outline-none font-medium text-sm text-white placeholder:text-gray-500"
                                />
                            </div>
                            <div className="flex-1 flex items-center px-4 bg-white/5 rounded-xl">
                                <MapPin className="text-gray-400 mr-3 shrink-0" size={18} />
                                <DebouncedTextInput
                                    placeholder="City or location"
                                    resetToken={inputResetToken}
                                    defaultValue={headerLocation}
                                    onDebouncedChange={setHeaderLocation}
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

            {/* Promoted jobs ignore list filters — hide while filtering so results match user expectations */}
            {!showSavedOnly && activeFilterCount === 0 && <FeaturedJobs />}

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
                                        <FilterContent 
                                            inputResetToken={inputResetToken}
                                            setSidebarTitle={setSidebarTitle}
                                            filters={filters}
                                            toggleFilter={toggleFilter}
                                            selectedTags={selectedTags}
                                            toggleTag={toggleTag}
                                        />
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Right Content - Job Listings */}
                    <div className="lg:col-span-9 space-y-5 order-1 lg:order-2">
                        {user &&
                            (user.role === 'jobseeker' || user.role === 'job_seeker') &&
                            !showSavedOnly &&
                            hasPersonalizationData === false && (
                                <div className="rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 font-medium">
                                    Complete your profile to get personalized job suggestions.
                                </div>
                            )}
                        {/* Results Header */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between shadow-sm">
                            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <span className="text-[#29a08e] font-extrabold text-lg">
                                    {listLoading ? '…' : filteredJobs.length}
                                </span>
                                Jobs Found
                                {listLoading && (
                                    <span className="ml-2 inline-flex h-4 w-4 border-2 border-[#29a08e]/30 border-t-[#29a08e] rounded-full animate-spin" aria-hidden />
                                )}
                            </h2>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setViewMode('grid')} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${viewMode === 'grid' ? 'bg-gray-100 text-[#29a08e]' : 'text-gray-400 hover:bg-gray-50'}`}><LayoutGrid size={16} /></button>
                                <button onClick={() => setViewMode('list')} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${viewMode === 'list' ? 'bg-gray-100 text-[#29a08e]' : 'text-gray-400 hover:bg-gray-50'}`}><List size={16} /></button>
                            </div>
                        </div>

                        {/* Jobs Grid — keep mounted; overlay refresh instead of full-page flash */}
                        <div className={`relative grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} gap-4`}>
                            {listLoading && jobs.length === 0 && (
                                <>
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <JobCardSkeleton key={`sk-${i}`} />
                                    ))}
                                </>
                            )}
                            {!listLoading && currentJobsWithBadges.length > 0 &&
                                currentJobsWithBadges.map((job) => (
                                    <JobCard key={job._id || job.id} job={job} savedJobIds={savedJobIds} toggleSaveJob={toggleSaveJob} viewMode={viewMode} />
                                ))}
                            {listLoading && jobs.length > 0 && (
                                <>
                                    {currentJobsWithBadges.map((job) => (
                                        <JobCard key={job._id || job.id} job={job} savedJobIds={savedJobIds} toggleSaveJob={toggleSaveJob} viewMode={viewMode} />
                                    ))}
                                    <div
                                        className="absolute inset-0 rounded-2xl bg-white/55 backdrop-blur-[1px] flex items-start justify-center pt-24 z-10 pointer-events-none"
                                        aria-busy="true"
                                    >
                                        <div className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 border border-gray-100 shadow-md text-xs font-bold text-gray-600">
                                            <span className="inline-flex h-4 w-4 border-2 border-[#29a08e]/30 border-t-[#29a08e] rounded-full animate-spin" />
                                            Updating results…
                                        </div>
                                    </div>
                                </>
                            )}
                            {!listLoading && currentJobsWithBadges.length === 0 && (
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
