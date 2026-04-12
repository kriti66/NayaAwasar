import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Sparkles, MapPin, Briefcase, Bookmark, ChevronRight, AlertCircle, ArrowUpRight, CheckCircle } from 'lucide-react';
import useJobSaver from '../../hooks/useJobSaver';
import CompanyLogo from '../common/CompanyLogo';
import { getMatchStrengthDisplay } from '../../utils/recommendationFriendly';
import { JobMatchProgressBar, JobMatchScoreCorner, JobMatchWhyBlock } from '../jobs/JobMatchUi';

const DEFAULT_REC_META = {
    provider: 'fallback',
    source: 'unknown',
    overallStrength: 0,
    kycVerified: false,
    showMatchScores: false,
    professionCategories: []
};

const RecommendedJobsWidget = ({ appliedJobIds = [], savedJobIds: propSavedIds, toggleSaveJob: propToggleSave }) => {
    const [jobs, setJobs] = useState([]);
    const [isCompleteProfile, setIsCompleteProfile] = useState(true);
    const [hasPersonalizationData, setHasPersonalizationData] = useState(true);
    const [recommendationNotice, setRecommendationNotice] = useState('');
    const [serverMessage, setServerMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [usingFallbackJobs, setUsingFallbackJobs] = useState(false);
    const [recommendationMeta, setRecommendationMeta] = useState(() => ({ ...DEFAULT_REC_META }));
    const hookSaver = useJobSaver();
    const savedJobIds = propSavedIds ?? hookSaver.savedJobIds;
    const toggleSaveJob = propToggleSave ?? hookSaver.toggleSaveJob;

    useEffect(() => {
        const fetchLatestJobsFallback = async () => {
            const fallbackRes = await api.get('/jobs');
            const rawJobs = Array.isArray(fallbackRes.data)
                ? fallbackRes.data
                : (Array.isArray(fallbackRes.data?.jobs) ? fallbackRes.data.jobs : []);
            const sorted = rawJobs
                .slice()
                .sort((a, b) => new Date(b.createdAt || b.posted_date || 0) - new Date(a.createdAt || a.posted_date || 0))
                .slice(0, 5);
            setJobs(sorted);
            setUsingFallbackJobs(true);
            setRecommendationNotice('');
            setServerMessage('');
            setRecommendationMeta({ ...DEFAULT_REC_META });
        };

        const fetchRecommendations = async () => {
            try {
                const response = await api.get('/recommendations');

                if (response.data && response.data.jobs) {
                    const recommendationJobs = Array.isArray(response.data.jobs) ? response.data.jobs : [];
                    if (recommendationJobs.length === 0) {
                        await fetchLatestJobsFallback();
                        return;
                    }
                    setJobs(recommendationJobs);
                    setUsingFallbackJobs(false);
                    setHasPersonalizationData(response.data.hasPersonalizationData !== false);
                    setIsCompleteProfile(response.data.isComplete !== false);
                    setRecommendationNotice(response.data.recommendationNotice || '');
                    setServerMessage(response.data.message || '');
                    setRecommendationMeta({
                        ...DEFAULT_REC_META,
                        ...(response.data.recommendationMeta &&
                        typeof response.data.recommendationMeta === 'object'
                            ? response.data.recommendationMeta
                            : {})
                    });
                } else if (Array.isArray(response.data)) {
                    if (response.data.length === 0) {
                        await fetchLatestJobsFallback();
                        return;
                    }
                    setJobs(response.data);
                    setUsingFallbackJobs(false);
                    setHasPersonalizationData(true);
                    setRecommendationMeta({ ...DEFAULT_REC_META });
                } else {
                    await fetchLatestJobsFallback();
                }
            } catch (error) {
                console.error('Failed to fetch recommendations:', error);
                try {
                    await fetchLatestJobsFallback();
                } catch (fallbackError) {
                    console.error('Failed to fetch latest jobs fallback:', fallbackError);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, []);

    const visibleJobs = useMemo(() => jobs.slice(0, 5), [jobs]);

    const timeAgo = (date) => {
        if (!date) return 'Just now';
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + 'd ago';
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + 'h ago';
        return 'Just now';
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 min-h-[400px] flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-[#29a08e]/20 border-t-[#29a08e] animate-spin"></div>
                <p className="mt-4 text-sm font-semibold text-gray-500">Loading recommendations...</p>
            </div>
        );
    }

    if (jobs.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-10 border border-gray-100 shadow-sm text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-20 h-20 bg-[#29a08e]/10 rounded-full flex items-center justify-center mb-5">
                    <Sparkles className="w-10 h-10 text-[#29a08e]" />
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 mb-2 z-10">No jobs available right now</h3>
                <p className="text-sm text-gray-600 mb-8 max-w-sm mx-auto z-10 leading-relaxed">
                    Check back soon for new opportunities.
                </p>
                <Link
                    to="/seeker/jobs"
                    className="px-6 py-3 bg-[#29a08e] text-white text-sm font-bold rounded-xl hover:bg-[#228377] transition-all shadow-lg shadow-[#29a08e]/20 hover:shadow-[#29a08e]/30 z-10"
                >
                    Browse Jobs
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                <div>
                    <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                        <div className="p-1.5 bg-[#29a08e]/10 rounded-lg">
                            <Sparkles className="w-5 h-5 text-[#29a08e] fill-[#29a08e]/20" />
                        </div>
                        {usingFallbackJobs
                            ? 'Recommended Jobs'
                            : recommendationMeta.provider === 'ai'
                              ? 'AI Recommended For You'
                              : 'Jobs Matching Your Profile'}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium mt-1">
                        {usingFallbackJobs
                            ? 'Latest opportunities selected for you'
                            : recommendationMeta.provider === 'ai'
                              ? 'Curated matches based on your skills, experience, and location'
                              : recommendationMeta.source === 'fallback_scored'
                                ? 'Ranked using your field, skills, and preferences (AI offline)'
                                : 'Opportunities aligned with your profile'}
                    </p>
                </div>
                <Link
                    to="/seeker/jobs"
                    className="text-xs font-bold text-[#29a08e] hover:text-[#228377] flex items-center gap-1 bg-[#29a08e]/5 hover:bg-[#29a08e]/10 px-3 py-1.5 rounded-lg transition-all line-clamp-1 truncate ml-2"
                >
                    View Match Board <ChevronRight size={14} />
                </Link>
            </div>

            {recommendationNotice && !usingFallbackJobs ? (
                <div className="mx-6 mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                    <span className="font-bold">Note: </span>
                    {recommendationNotice}
                </div>
            ) : null}

            {(!usingFallbackJobs && (!isCompleteProfile || !hasPersonalizationData)) && (
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

            <div className="p-6 space-y-4">
                {visibleJobs.map((job) => {
                    const jobId = job._id?.toString?.() || job._id;
                    const isSaved = savedJobIds.some((sid) => (sid?.toString?.() || sid) === jobId);
                    const hasApplied = appliedJobIds.includes(job._id);
                    const strength = getMatchStrengthDisplay(job, recommendationMeta);
                    const rawReason = String(job.matchReason || job.reason || '').trim();
                    const companyName = job.company_id?.name || job.company_name || 'Company';
                    const whyOverride =
                        !rawReason && isSaved ? 'Similar to jobs you have saved' : undefined;

                    return (
                        <div
                            key={job._id}
                            className="p-5 rounded-xl border border-gray-100 hover:border-[#29a08e]/30 bg-white hover:shadow-md transition-all group relative overflow-hidden"
                        >
                            {(strength.pct ?? 0) >= 75 && (
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                            )}

                            <JobMatchScoreCorner job={job} recMeta={recommendationMeta} />

                            <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-3 pr-24 sm:pr-28 relative z-10">
                                <div className="flex gap-4 min-w-0 flex-1">
                                    <CompanyLogo
                                        job={job}
                                        className="w-12 h-12 rounded-xl border border-gray-100 shrink-0 shadow-sm"
                                        imgClassName="w-full h-full object-cover"
                                        fallbackClassName="text-lg"
                                    />
                                    <div className="min-w-0">
                                        <Link to={`/seeker/jobs/${job._id}`} className="block">
                                            <h4 className="text-base font-extrabold text-gray-900 group-hover:text-[#29a08e] transition-colors leading-tight mb-1">
                                                {job.title}
                                            </h4>
                                        </Link>
                                        <p className="text-sm font-semibold text-gray-500 truncate">{companyName}</p>
                                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-gray-400 mt-2">
                                            {job.category && <span>{job.category}</span>}
                                            {job.category && (job.type || job.experience_level) && <span>·</span>}
                                            <span className="flex items-center gap-1">
                                                <Briefcase size={12} /> {job.type || '—'}
                                            </span>
                                            {job.experience_level && (
                                                <>
                                                    <span>·</span>
                                                    <span>{job.experience_level}</span>
                                                </>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 mt-1.5">
                                            <MapPin size={12} /> {job.location || 'Remote'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <JobMatchProgressBar job={job} recMeta={recommendationMeta} className="relative z-10 mb-3" />

                            <JobMatchWhyBlock
                                job={job}
                                recMeta={recommendationMeta}
                                friendlyOverride={whyOverride}
                                className="relative z-10 mb-4"
                            />

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    {timeAgo(job.createdAt || job.posted_date)}
                                </span>
                                <div className="flex gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => toggleSaveJob(job._id)}
                                        className={`p-2 rounded-xl transition-all border ${
                                            isSaved
                                                ? 'bg-[#29a08e]/10 text-[#29a08e] border-[#29a08e]/20'
                                                : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50 hover:text-gray-600'
                                        }`}
                                        title={isSaved ? 'Saved Job' : 'Save Job'}
                                    >
                                        <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
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
