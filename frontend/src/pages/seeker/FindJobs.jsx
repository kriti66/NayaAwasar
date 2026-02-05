import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import SeekerLayout from '../../components/layouts/SeekerLayout';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import {
    Search, MapPin, Briefcase, DollarSign, Clock,
    Filter, X, ChevronDown, Bookmark, Star,
    ArrowRight, LayoutGrid, List, Sparkles
} from 'lucide-react';

const FindJobs = () => {
    const { user } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [recommendedJobs, setRecommendedJobs] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const [viewMode, setViewMode] = useState('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const jobsPerPage = 6;

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [jobsRes, recRes] = await Promise.all([
                    api.get('/jobs'),
                    api.get('/jobs/recommended')
                ]);
                setJobs(jobsRes.data);
                setRecommendedJobs(recRes.data);
            } catch (error) {
                console.error("Error fetching jobs:", error);
                toast.error("Failed to load jobs");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

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
        return jobs.filter(job => {
            const titleMatch = (job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                job.company_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (job.title?.toLowerCase().includes(sidebarTitle.toLowerCase()));

            const locationMatch = !selectedLocation || job.location?.includes(selectedLocation) || job.location?.includes(headerLocation);

            const typeMatch = filters.jobType.length === 0 || filters.jobType.includes(job.type);

            const expMatch = filters.experienceLevel.length === 0 || filters.experienceLevel.includes(job.experience_level);

            const tagMatch = selectedTags.length === 0 ||
                selectedTags.some(tag => job.skills?.toLowerCase().includes(tag.toLowerCase()));

            // Simple salary match (if job has salary info)
            const salaryMatch = !job.salary_range || true;

            return titleMatch && locationMatch && typeMatch && expMatch && tagMatch;
        });
    }, [jobs, searchQuery, sidebarTitle, selectedLocation, headerLocation, filters, selectedTags]);

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

    const JobCard = ({ job, isRecommended = false }) => (
        <div className={`group bg-white rounded-xl border transition-all duration-300 hover:shadow-lg hover:border-[#2D9B82]/30 p-6 relative ${isRecommended ? 'border-[#2D9B82]/20 bg-emerald-50/10' : 'border-gray-200 shadow-sm'}`}>
            {isRecommended && (
                <div className="absolute -top-3 right-6">
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-[#2D9B82] text-white rounded-full text-[10px] font-bold uppercase tracking-wider shadow-md">
                        <Sparkles size={10} /> 95% Match
                    </span>
                </div>
            )}

            <div className={`flex flex-col ${viewMode === 'grid' ? '' : 'md:flex-row'} gap-6`}>
                <div className="w-16 h-16 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center p-2 shrink-0 group-hover:scale-105 transition-transform duration-300">
                    {job.company_logo_url ? (
                        <img src={job.company_logo_url} alt={job.company_name} className="w-full h-full object-contain" />
                    ) : (
                        <div className="text-[#2D9B82] font-bold text-2xl">
                            {job.company_name?.charAt(0)}
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#2D9B82] transition-colors line-clamp-1">{job.title}</h3>
                            <p className="text-sm font-medium text-gray-500">{job.company_name} • <span className="text-xs text-gray-400">4h ago</span></p>
                        </div>
                        <button className="text-gray-400 hover:text-[#2D9B82] p-1 rounded-full hover:bg-emerald-50 transition-colors">
                            <Bookmark size={18} />
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                        {[job.type, job.experience_level, job.location].filter(Boolean).slice(0, 3).map((badge, i) => (
                            <span key={i} className="inline-flex items-center px-2 py-1 rounded-md bg-gray-50 text-gray-600 text-[10px] font-bold border border-gray-100 uppercase tracking-wide">
                                {badge}
                            </span>
                        ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                        <div className="flex items-center gap-1 text-gray-700 font-bold text-xs">
                            <DollarSign size={14} className="text-[#2D9B82]" />
                            {job.salary_range || 'Negotiable'}
                        </div>
                        <Link
                            to={`/jobs/${job.id || job._id}`}
                            className="px-5 py-2 bg-[#2D9B82] text-white rounded-lg text-xs font-bold hover:bg-[#25836d] transition-all shadow-sm shadow-[#2D9B82]/20"
                        >
                            Details
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <SeekerLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-[#2D9B82] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Loading Jobs...</p>
                    </div>
                </div>
            </SeekerLayout>
        );
    }

    return (
        <SeekerLayout>
            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                {/* Header & Search */}
                <div className="mb-8">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2 flex flex-col md:flex-row gap-2">
                        <div className="flex-1 relative flex items-center group">
                            <Search className="absolute left-4 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Job title, keywords..."
                                className="w-full pl-11 pr-4 py-3 bg-transparent outline-none font-medium text-sm text-gray-700 placeholder:text-gray-400"
                            />
                        </div>
                        <div className="w-px bg-gray-200 hidden md:block my-2"></div>
                        <div className="flex-1 relative flex items-center group">
                            <MapPin className="absolute left-4 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={headerLocation}
                                onChange={(e) => setHeaderLocation(e.target.value)}
                                placeholder="City or location"
                                className="w-full pl-11 pr-4 py-3 bg-transparent outline-none font-medium text-sm text-gray-700 placeholder:text-gray-400"
                            />
                        </div>
                        <button className="px-8 py-3 bg-[#2D9B82] text-white rounded-xl font-bold text-sm hover:bg-[#25836d] transition-all shadow-lg shadow-[#2D9B82]/20">
                            Search
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Sidebar - Filters */}
                    <aside className="lg:col-span-3 space-y-6 order-2 lg:order-1">
                        <div className="sticky top-24 space-y-6">
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                        <Filter size={16} className="text-[#2D9B82]" /> Filters
                                    </h3>
                                    <button
                                        onClick={clearFilters}
                                        className="text-[10px] font-bold text-gray-400 hover:text-red-500 uppercase tracking-wider transition-colors"
                                    >
                                        Clear
                                    </button>
                                </div>

                                {/* Sidebar Search */}
                                <div className="space-y-4 mb-6">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Job Title</h4>
                                    <input
                                        type="text"
                                        value={sidebarTitle}
                                        onChange={(e) => setSidebarTitle(e.target.value)}
                                        placeholder="e.g. Designer"
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg outline-none focus:border-[#2D9B82] transition-colors text-xs font-bold"
                                    />
                                </div>

                                {/* Job Type Filter */}
                                <div className="space-y-3 mb-6">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Job Type</h4>
                                    <div className="space-y-2">
                                        {['Full-time', 'Part-time', 'Freelance', 'Internship'].map(type => (
                                            <label key={type} className="flex items-center cursor-pointer group">
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 transition-colors ${filters.jobType.includes(type) ? 'bg-[#2D9B82] border-[#2D9B82]' : 'border-gray-200 group-hover:border-[#2D9B82]'}`}>
                                                    {filters.jobType.includes(type) && <X size={10} className="text-white" />}
                                                </div>
                                                <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900">{type}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Experience Level */}
                                <div className="space-y-3 mb-6">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Experience</h4>
                                    <div className="space-y-2">
                                        {['Fresher', 'Intermediate', 'Expert'].map(level => (
                                            <label key={level} className="flex items-center cursor-pointer group">
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 transition-colors ${filters.experienceLevel.includes(level) ? 'bg-[#2D9B82] border-[#2D9B82]' : 'border-gray-200 group-hover:border-[#2D9B82]'}`}>
                                                    {filters.experienceLevel.includes(level) && <X size={10} className="text-white" />}
                                                </div>
                                                <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900">{level}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Tags */}
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tags</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {['React', 'Node', 'Design', 'Marketing'].map(tag => (
                                            <button
                                                key={tag}
                                                onClick={() => toggleTag(tag)}
                                                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all border ${selectedTags.includes(tag) ? 'bg-[#2D9B82] text-white border-[#2D9B82]' : 'bg-gray-50 text-gray-500 border-gray-100'}`}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Right Content - Job Listings */}
                    <div className="lg:col-span-9 space-y-6 order-1 lg:order-2">
                        {/* Results Header */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between shadow-sm">
                            <h2 className="text-sm font-bold text-gray-900">
                                <span className="text-[#2D9B82]">{filteredJobs.length}</span> Jobs Found
                            </h2>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-gray-100 text-[#2D9B82]' : 'text-gray-400'}`}><LayoutGrid size={16} /></button>
                                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-gray-100 text-[#2D9B82]' : 'text-gray-400'}`}><List size={16} /></button>
                            </div>
                        </div>

                        {/* Jobs Grid */}
                        <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} gap-4`}>
                            {currentJobs.length > 0 ? (
                                currentJobs.map(job => (
                                    <JobCard key={job._id || job.id} job={job} />
                                ))
                            ) : (
                                <div className="col-span-full bg-white rounded-xl border border-gray-200 p-12 text-center">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                        <Filter size={24} />
                                    </div>
                                    <h3 className="text-gray-900 font-bold">No jobs found</h3>
                                    <p className="text-gray-500 text-xs mt-1">Try adjusting your filters</p>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center gap-2 pt-6">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#2D9B82] disabled:opacity-50 text-xs font-bold"
                                >
                                    &lt;
                                </button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === i + 1 ? 'bg-[#2D9B82] text-white shadow-md' : 'bg-white border border-gray-200 text-gray-500'}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#2D9B82] disabled:opacity-50 text-xs font-bold"
                                >
                                    &gt;
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </SeekerLayout>
    );
};

export default FindJobs;
