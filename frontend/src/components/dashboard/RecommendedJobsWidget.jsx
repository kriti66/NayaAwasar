import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Sparkles, MapPin, Briefcase, Bookmark, ChevronRight } from 'lucide-react';
import useJobSaver from '../../hooks/useJobSaver';

const RecommendedJobsWidget = () => {
    const [jobs, setJobs] = useState([]);
    const [isAIRecommended, setIsAIRecommended] = useState(false);
    const [loading, setLoading] = useState(true);
    const { savedJobIds, toggleSaveJob } = useJobSaver();

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                const response = await api.get('/recommendations');

                if (Array.isArray(response.data)) {
                    setJobs(response.data);
                    setIsAIRecommended(false);
                } else if (response.data.jobs) {
                    setJobs(response.data.jobs);
                    setIsAIRecommended(response.data.isAIRecommended);
                }
            } catch (error) {
                console.error("Failed to fetch recommendations:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, []);

    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        return "Just now";
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-4">
                    {[1, 2].map(i => (
                        <div key={i} className="h-24 bg-gray-100 rounded-lg"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (jobs.length === 0) {
        return (
            <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm text-center relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 opacity-10">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-[#29a08e]" fill="currentColor">
                        <path d="M50 10 L60 40 L90 40 L65 60 L75 90 L50 75 L25 90 L35 60 L10 40 L40 40 Z" />
                    </svg>
                </div>
                <Sparkles className="w-12 h-12 text-[#29a08e] mx-auto mb-4 relative z-10" />
                <h3 className="text-lg font-bold text-gray-900 mb-2 relative z-10">No matches yet</h3>
                <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto relative z-10">Complete your profile and upload a CV to get personalized job picks.</p>
                <Link to="/seeker/profile" className="inline-block px-5 py-2.5 bg-[#29a08e] text-white text-sm font-bold rounded-lg hover:bg-[#228377] transition-colors relative z-10">
                    Update Profile
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        {isAIRecommended ? (
                            <>
                                <Sparkles className="w-5 h-5 text-[#29a08e] fill-[#29a08e]/20" />
                                AI Recommended For You
                            </>
                        ) : (
                            "Latest Jobs"
                        )}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium mt-1">
                        {isAIRecommended ? "AI-curated based on your profile & CV" : "Fresh opportunities just for you"}
                    </p>
                </div>
                {jobs.length > 5 && (
                    <Link to="/seeker/jobs?filter=recommended" className="text-xs font-bold text-[#29a08e] hover:text-[#228377] flex items-center gap-1">
                        View All <ChevronRight size={14} />
                    </Link>
                )}
            </div>

            <div className="divide-y divide-gray-50">
                {jobs.slice(0, 5).map((job) => {
                    const isSaved = savedJobIds.includes(job._id);
                    return (
                        <div key={job._id} className="p-5 hover:bg-gray-50 transition-colors group">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-sm border border-gray-200">
                                        {job.company_name?.charAt(0) || 'C'}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#29a08e] transition-colors line-clamp-1">
                                            {job.title}
                                        </h4>
                                        <p className="text-xs font-medium text-gray-500">{job.company_name}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    {isAIRecommended ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#29a08e]/10 text-[#29a08e] border border-[#29a08e]/20">
                                            {job.matchScore}% Match
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-[#29a08e] border-emerald-100">
                                            NEW
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* AI Reason */}
                            {isAIRecommended && (
                                <div className="mb-3 px-3 py-2 bg-[#29a08e]/5 rounded-lg border border-[#29a08e]/10">
                                    <p className="text-[10px] text-gray-700 font-medium leading-relaxed flex gap-2">
                                        <Sparkles size={12} className="shrink-0 mt-0.5 text-[#29a08e]" />
                                        {job.matchReason}
                                    </p>
                                </div>
                            )}

                            <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                                    <span className="flex items-center gap-1"><MapPin size={10} /> {job.location || 'Remote'}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1"><Briefcase size={10} /> {job.type}</span>
                                    <span>•</span>
                                    <span>{timeAgo(job.createdAt || job.posted_date)}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => toggleSaveJob(job._id)}
                                        className={`p-1.5 rounded-md transition-colors ${isSaved ? 'bg-[#29a08e]/10 text-[#29a08e]' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                                    >
                                        <Bookmark size={14} fill={isSaved ? "currentColor" : "none"} />
                                    </button>
                                    <Link
                                        to={`/jobseeker/jobs/${job._id}`}
                                        className="px-3 py-1.5 bg-[#29a08e] text-white text-[10px] font-bold rounded-lg hover:bg-[#228377] transition-colors"
                                    >
                                        Apply Now
                                    </Link>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RecommendedJobsWidget;
