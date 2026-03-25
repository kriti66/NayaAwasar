import { useState, useEffect } from 'react';
import DashboardNavbar from '../../components/dashboard/DashboardNavbar';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import CompanyLogo from '../../components/common/CompanyLogo';

const normalizeSalaryRangeValue = (value, fallbackLabel = 'Negotiable') => {
    if (value == null) return fallbackLabel;
    const raw = String(value).trim();
    if (!raw) return fallbackLabel;
    if (!/\d/.test(raw) || /negotiable/i.test(raw)) return raw;
    return raw
        .replace(/\$/g, '')
        .replace(/\bUSD\b/gi, '')
        .replace(/\bdollar\b/gi, '')
        .replace(/^\s*(Rs\.?|Nrs\.?)\s*/i, '')
        .trim();
};

const FindOpportunity = () => {
    const [jobs, setJobs] = useState([]);
    const [recommendedJobs, setRecommendedJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        jobType: [],
        experienceLevel: []
    });

    const fetchJobs = async () => {
        try {
            const res = await api.get('/jobs');
            setJobs(res.data);

            // Fetch recommended (random for now)
            const recRes = await api.get('/jobs/recommended');
            setRecommendedJobs(recRes.data);
        } catch (error) {
            console.error("Error fetching jobs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
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

    const filteredJobs = jobs.filter(job => {
        const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.company_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filters.jobType.length === 0 || filters.jobType.includes(job.type);
        const matchesExp = filters.experienceLevel.length === 0 || filters.experienceLevel.includes(job.experience_level);
        return matchesSearch && matchesType && matchesExp;
    });

    const JobCard = ({ job, featured = false }) => (
        <div className={`bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group ${featured ? 'border-blue-100 ring-1 ring-blue-50' : 'border-slate-100'}`}>
            {featured && <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>}

            <div className="flex justify-between items-start mb-6">
                <CompanyLogo job={job} companyName={job.company_name} className="w-12 h-12 rounded-xl" imgClassName="w-full h-full object-cover" fallbackClassName="text-xs" />
                <button className="text-slate-300 hover:text-blue-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                </button>
            </div>

            <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{job.title}</h3>
            <p className="text-xs font-bold text-slate-400 mt-1 mb-4">{job.company_name}</p>

            <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <svg className="w-3.5 h-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                    {job.location}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <svg className="w-3.5 h-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {normalizeSalaryRangeValue(job.salary_range, 'N/A') || 'N/A'}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <svg className="w-3.5 h-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {new Date(job.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                <span className="px-3 py-1 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-widest">{job.type}</span>
                <Link to={`/jobs/${job._id}`} className="text-xs font-bold text-blue-600 hover:underline">View Details</Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col bg-[#FDFEFE] font-sans selection:bg-blue-100 selection:text-blue-900">
            <DashboardNavbar />

            <div className="flex-1 flex flex-col w-full">
                <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-10 sticky top-0 z-30">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Discovery /</span>
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-widest">Find Opportunity</span>
                    </div>
                </header>

                <main className="flex-1 p-10 max-w-7xl mx-auto w-full overflow-hidden">
                    <h1 className="text-3xl font-black text-slate-900 mb-10 tracking-tight">Find Your Dream Job</h1>

                    <div className="flex flex-col lg:flex-row gap-10">
                        {/* Sidebar Filters */}
                        <aside className="w-full lg:w-64 shrink-0 space-y-10">
                            <div>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-6">Job Type</h3>
                                <div className="space-y-3">
                                    {['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => toggleFilter('jobType', type)}
                                            className={`w-full text-left px-5 py-3 rounded-xl text-xs font-bold transition-all border ${filters.jobType.includes(type)
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200'
                                                : 'bg-white text-slate-600 border-slate-100 hover:border-blue-200'
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-6">Experience Level</h3>
                                <div className="space-y-3">
                                    {['Entry Level', 'Associate', 'Mid-Senior Level', 'Director', 'Executive'].map(level => (
                                        <button
                                            key={level}
                                            onClick={() => toggleFilter('experienceLevel', level)}
                                            className={`w-full text-left px-5 py-3 rounded-xl text-xs font-bold transition-all border ${filters.experienceLevel.includes(level)
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200'
                                                : 'bg-white text-slate-600 border-slate-100 hover:border-blue-200'
                                                }`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </aside>

                        {/* Main Search Area */}
                        <div className="flex-1 space-y-12">
                            {/* Search Bar */}
                            <div className="flex gap-4">
                                <div className="relative flex-1">
                                    <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    <input
                                        type="text"
                                        placeholder="Search by job title, keyword, or company..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all shadow-sm"
                                    />
                                </div>
                                <div className="flex items-center gap-2 bg-white border border-slate-100 px-4 py-2 rounded-2xl shadow-sm h-full">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sort by</span>
                                    <select className="bg-transparent text-xs font-bold text-slate-900 outline-none cursor-pointer pr-4">
                                        <option>Relevance</option>
                                        <option>Newest</option>
                                    </select>
                                </div>
                            </div>

                            {/* Recommended Section */}
                            {!searchQuery && filters.jobType.length === 0 && filters.experienceLevel.length === 0 && (
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-2">
                                        Recommended for You
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-[10px] font-black uppercase tracking-widest">AI MATCHED</span>
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {recommendedJobs.map(job => <JobCard key={job._id} job={job} featured={true} />)}
                                    </div>
                                </div>
                            )}

                            {/* Results Section */}
                            <div>
                                <h2 className="text-xl font-black text-slate-900 mb-8">All Search Results</h2>
                                {loading ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {Array(6).fill(0).map((_, i) => <div key={i} className="h-64 bg-slate-50 rounded-2xl animate-pulse"></div>)}
                                    </div>
                                ) : filteredJobs.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {filteredJobs.map(job => <JobCard key={job._id} job={job} />)}
                                    </div>
                                ) : (
                                    <div className="bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-[2.5rem] py-20 text-center">
                                        <div className="text-5xl mb-6">🔍</div>
                                        <h3 className="text-xl font-bold text-slate-900 uppercase">No matching jobs found</h3>
                                        <p className="text-slate-500 font-medium mt-2">Try broading your search or clearing filters.</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-center pt-10">
                                <button className="px-10 py-4 bg-white border border-slate-100 rounded-2xl text-xs font-black text-slate-500 hover:bg-slate-50 transition-all shadow-sm active:scale-95">
                                    Load More Jobs
                                </button>
                            </div>
                        </div>
                    </div>
                </main>

                <footer className="h-16 border-t border-slate-100 flex items-center justify-center mt-auto">
                    <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">
                        © {new Date().getFullYear()} Naya Awasar. Career Discovery Engine.
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default FindOpportunity;
