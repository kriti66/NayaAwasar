import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Sparkles, Star, MapPin, Briefcase, Bookmark, ChevronRight, AlertCircle, ArrowUpRight, CheckCircle } from 'lucide-react';
import useJobSaver from '../../hooks/useJobSaver';
import CompanyLogo from '../common/CompanyLogo';
import { applyVisibleBadgeLimits, BADGE_CONFIG, getJobDisplayReason } from '../../utils/jobLabelDisplay';

const RecommendedJobsWidget = ({ appliedJobIds = [], savedJobIds: propSavedIds, toggleSaveJob: propToggleSave }) => {
    const [jobs, setJobs] = useState([]);
    const [isCompleteProfile, setIsCompleteProfile] = useState(true);
    const [hasPersonalizationData, setHasPersonalizationData] = useState(true);
    const [loading, setLoading] = useState(true);
    const hookSaver = useJobSaver();
    const savedJobIds = propSavedIds ?? hookSaver.savedJobIds;
    const toggleSaveJob = propToggleSave ?? hookSaver.toggleSaveJob;

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                const response = await api.get('/recommendations');

                if (response.data && response.data.jobs) {
                    setJobs(response.data.jobs);
                    setHasPersonalizationData(response.data.hasPersonalizationData !== false);
                    setIsCompleteProfile(response.data.isComplete !== false);
                } else if (Array.isArray(response.data)) {
                    setJobs(response.data);
                    setHasPersonalizationData(true);
                }
            } catch (error) {
                console.error("Failed to fetch recommendations:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, []);

    const jobsWithBadges = useMemo(() => applyVisibleBadgeLimits(jobs.slice(0, 5)), [jobs]);

    const timeAgo = (date) => {
        if (!date) return 'Just now';
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        return "Just now";
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 min-h-[400px]">
                <div className="flex items-center justify-between mb-6 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-100 rounded w-16"></div>
                </div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-gray-50 rounded-xl animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (jobs.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-10 border border-gray-100 shadow-sm text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
                <div className="absolute right-0 top-0 w-64 h-64 opacity-5 pointer-events-none">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-[#29a08e]" fill="currentColor">
                        <path d="M50 10 L60 40 L90 40 L65 60 L75 90 L50 75 L25 90 L35 60 L10 40 L40 40 Z" />
                    </svg>
                </div>
                
                <div className="w-20 h-20 bg-[#29a08e]/10 rounded-full flex items-center justify-center mb-5">
                    <Sparkles className="w-10 h-10 text-[#29a08e]" />
                </div>
                
                <h3 className="text-xl font-extrabold text-gray-900 mb-2 z-10">No suitable recommendations found yet.</h3>
                <p className="text-sm text-gray-500 mb-8 max-w-sm mx-auto z-10 leading-relaxed">
                    Improve your recommendations by adding more skills, experience, and updating your preferred job categories.
                </p>
                <Link to="/seeker/profile" className="px-6 py-3 bg-[#29a08e] text-white text-sm font-bold rounded-xl hover:bg-[#228377] transition-all shadow-lg shadow-[#29a08e]/20 hover:shadow-[#29a08e]/30 z-10">
                    Complete Your Profile
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                <div>
                    <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                        <div className="p-1.5 bg-[#29a08e]/10 rounded-lg">
                            <Sparkles className="w-5 h-5 text-[#29a08e] fill-[#29a08e]/20" />
                        </div>
                        AI Recommended For You
                    </h3>
                    <p className="text-xs text-gray-500 font-medium mt-1">
                        Curated matches based on your skills, experience, and location
                    </p>
                </div>
                <Link to="/seeker/jobs" className="text-xs font-bold text-[#29a08e] hover:text-[#228377] flex items-center gap-1 bg-[#29a08e]/5 hover:bg-[#29a08e]/10 px-3 py-1.5 rounded-lg transition-all line-clamp-1 truncate ml-2">
                    View Match Board <ChevronRight size={14} />
                </Link>
            </div>

            {/* Incomplete Profile Alert */}
            {(!isCompleteProfile || !hasPersonalizationData) && (
                <div className="mx-6 mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-bold text-gray-900">Improve your match quality</h4>
                        <p className="text-xs text-gray-600 mt-1">
                            {!hasPersonalizationData
                                ? 'Complete your profile to get personalized job suggestions.'
                                : 'Your profile is currently incomplete. Add more specific skills and preferences to get highly targeted recommendations.'}
                        </p>
                        <Link to="/seeker/profile" className="inline-block mt-2 text-xs font-bold text-[#29a08e] hover:underline">
                            Update profile now →
                        </Link>
                    </div>
                </div>
            )}

            {/* Job List */}
            <div className={`p-6 space-y-4`}>
                {jobsWithBadges.map((job) => {
                    const jobId = job._id?.toString?.() || job._id;
                    const isSaved = savedJobIds.some(sid => (sid?.toString?.() || sid) === jobId);
                    const hasApplied = appliedJobIds.includes(job._id);
                    const cfg = job.visibleLabel ? BADGE_CONFIG[job.visibleLabel] : null;
                    const typeBadge = cfg
                        ? { label: `${cfg.icon} ${cfg.label}`, className: cfg.className }
                        : isSaved
                          ? { label: 'Similar to Saved Jobs', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
                          : { label: 'Job listing', className: 'bg-gray-50 text-gray-600 border-gray-200' };
                    const displayReason = getJobDisplayReason(job);

                    return (
                        <div key={job._id} className="p-5 rounded-xl border border-gray-100 hover:border-[#29a08e]/30 bg-white hover:shadow-md transition-all group relative overflow-hidden">
                            
                            {/* Decorative background gradient on high match */}
                            {(job.matchScore >= 80 || job.visibleLabel === 'AI_SUGGESTED') && (
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                            )}

                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4 relative z-10">
                                {/* Title and Company */}
                                <div className="flex gap-4">
                                    <CompanyLogo job={job} className="w-12 h-12 rounded-xl border border-gray-100 shrink-0 shadow-sm" imgClassName="w-full h-full object-cover" fallbackClassName="text-lg" />
                                    <div>
                                        <Link to={`/seeker/jobs/${job._id}`} className="block">
                                            <h4 className="text-base font-extrabold text-gray-900 group-hover:text-[#29a08e] transition-colors leading-tight mb-1">
                                                {job.title}
                                            </h4>
                                        </Link>
                                        <p className="text-sm font-semibold text-gray-500">{job.company_name}</p>
                                        
                                        <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-gray-400 mt-2">
                                            <span className="flex items-center gap-1.5"><MapPin size={12} /> {job.location || 'Remote'}</span>
                                            <span className="flex items-center gap-1.5"><Briefcase size={12} /> {job.type}</span>
                                            {job.experience_level && (
                                                <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">{job.experience_level}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Match Score */}
                                <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1.5 shrink-0">
                                    <div
                                        className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 ${typeBadge.className}`}
                                        aria-label={`Recommendation: ${typeBadge.label}`}
                                        title={displayReason ? `Why this job? ${displayReason}` : 'Why this job?'}
                                    >
                                        {job.visibleLabel ? (
                                            <Sparkles size={12} className="text-[#29a08e]" />
                                        ) : (
                                            <Star size={12} className="text-blue-500" />
                                        )}
                                        <span className="text-xs font-black">{typeBadge.label}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Recommendation reason */}
                            {displayReason && (
                                <div
                                    className="mb-4 text-xs font-medium text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100"
                                    title={`Why this job? ${displayReason}`}
                                >
                                    <span className="font-bold text-gray-800">Why this job?</span>{' '}
                                    {isSaved && (
                                        <span className="font-bold text-[#29a08e]">Similar to what you saved. </span>
                                    )}
                                    {displayReason}
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{timeAgo(job.createdAt || job.posted_date)}</span>
                                <div className="flex gap-2.5">
                                    <button
                                        onClick={() => toggleSaveJob(job._id)}
                                        className={`p-2 rounded-xl transition-all border ${isSaved ? 'bg-[#29a08e]/10 text-[#29a08e] border-[#29a08e]/20' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50 hover:text-gray-600'}`}
                                        title={isSaved ? "Saved Job" : "Save Job"}
                                    >
                                        <Bookmark size={16} fill={isSaved ? "currentColor" : "none"} />
                                    </button>
                                    {hasApplied ? (
                                        <span className="px-5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5">
                                            <CheckCircle size={14} /> Applied
                                        </span>
                                    ) : (
                                        <Link
                                            to={`/apply/${job._id}`}
                                            className="px-5 py-2 bg-gradient-to-r from-gray-900 to-gray-800 text-white text-xs font-bold rounded-xl hover:from-[#29a08e] hover:to-[#228377] transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                                        >
                                            Apply Now <ArrowUpRight size={14} />
                                        </Link>
                                    )}
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
