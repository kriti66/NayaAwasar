import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import CompanyLogo from '../common/CompanyLogo';

const RecommendedJobs = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                // Call the new real AI Recommendation endpoint
                const res = await api.get('/recommendations');
                
                if (Array.isArray(res.data)) {
                    setJobs(res.data.slice(0, 3));
                } else if (res.data.jobs) {
                    setJobs(res.data.jobs.slice(0, 3));
                }
            } catch (err) {
                console.error("Error fetching recommended jobs:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, []);

    if (loading) {
        return (
            <div className="mt-12">
                <div className="h-8 w-48 bg-gray-100 rounded-lg animate-pulse mb-8"></div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-40 bg-gray-50 rounded-3xl animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <section className="mt-12">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Recommended Jobs</h3>
                    <div className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-[#29a08e]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                        </svg>
                        <p className="text-xs font-semibold text-gray-400">Based on your profile and preferences</p>
                    </div>
                </div>
                <Link to="/jobs" className="text-sm font-bold text-[#29a08e] hover:text-[#228377] flex items-center gap-1 transition-colors">
                    View all
                </Link>
            </div>

            <div className="space-y-4">
                {jobs.length > 0 ? jobs.map((job, idx) => (
                    <div key={job._id || idx} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Company Logo/Icon */}
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden ${idx === 0 ? 'bg-pink-100 text-pink-500' :
                                    idx === 1 ? 'bg-[#29a08e]/20 text-[#29a08e]' :
                                        'bg-[#29a08e]/10 text-[#228377]'
                                }`}>
                                <CompanyLogo job={job} className="w-full h-full rounded-2xl bg-transparent border-0" imgClassName="w-full h-full object-cover rounded-2xl" fallbackClassName="text-xl font-bold" />
                            </div>

                            {/* Job Info */}
                            <div className="flex-1">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
                                    <div>
                                        <h4 className="text-lg font-bold text-gray-900 group-hover:text-[#29a08e] transition-colors line-clamp-1">{job.title}</h4>
                                        <p className="text-sm font-semibold text-gray-400">
                                            {job.company_name} • {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : (job.posted_date ? new Date(job.posted_date).toLocaleDateString() : 'Just now')}
                                        </p>
                                    </div>
                                        {(() => {
                                            const type = job.recommendationType || (job.matchReason?.includes('platform trends') ? 'trending' : 'ai_match');
                                            const confidence = job.recommendationConfidence || 'low';
                                            const score = typeof job.matchScore === 'number' ? job.matchScore : Number(job.matchScore);
                                            const showScoreBadge = type === 'ai_match' && confidence !== 'low' && Number.isFinite(score) && score >= 20;

                                            if (type === 'ai_match') {
                                                if (showScoreBadge) {
                                                    return (
                                                        <div className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200">
                                                            {score}% Match
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-200">
                                                        AI Match (Low confidence)
                                                    </div>
                                                );
                                            }
                                            if (type === 'trending') {
                                                return (
                                                    <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-200">
                                                        Trending Near You
                                                    </div>
                                                );
                                            }
                                            return (
                                                <div className="px-3 py-1 bg-gray-50 text-gray-600 rounded-lg text-xs font-bold border border-gray-200">
                                                    Recommendation
                                                </div>
                                            );
                                        })()}
                                </div>

                                {job.matchReason && (
                                        <p className="text-xs text-gray-500 mb-3 bg-gray-50 p-2 rounded-lg border border-gray-100">
                                            <span className="font-bold text-[#29a08e]">
                                                {(job.recommendationType || '').toLowerCase() === 'ai_match' ? 'Why this role?' : 'Why recommended?'}
                                            </span>{' '}
                                            {job.matchReason}
                                        </p>
                                )}

                                <div className="flex flex-wrap gap-2 mb-6">
                                    <span className="px-3 py-1 bg-gray-50 text-gray-500 rounded-lg text-xs font-semibold border border-gray-100 flex items-center gap-1.5">
                                        <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        </svg>
                                        {job.location || 'Remote'}
                                    </span>
                                    <span className="px-3 py-1 bg-gray-50 text-gray-500 rounded-lg text-xs font-semibold border border-gray-100 flex items-center gap-1.5">
                                        <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        {job.type || job.job_type || 'Full-time'}
                                    </span>
                                    {(job.matchedSkills || job.missingSkills) ? (
                                        (job.matchedSkills || []).slice(0, 3).map(skill => (
                                            <span key={skill} className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-semibold border border-green-100">
                                                {skill}
                                            </span>
                                        ))
                                    ) : (
                                        (job.requirements || job.skills_required || '').split(',').filter(Boolean).slice(0, 3).map(skill => (
                                            <span key={skill} className="px-3 py-1 bg-gray-50 text-gray-500 rounded-lg text-xs font-semibold border border-gray-100">
                                                {skill.trim()}
                                            </span>
                                        ))
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                    <Link
                                        to={`/jobs/${job._id || job.job_id}`}
                                        className="flex-1 md:flex-none text-center px-8 py-3 bg-[#333333] text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg shadow-black/5"
                                    >
                                        Apply Now
                                    </Link>
                                    <button className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-[#29a08e] hover:border-[#29a08e]/20 hover:bg-[#29a08e]/5 transition-all">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="bg-gray-50 rounded-3xl p-12 text-center border border-dashed border-gray-200">
                        <p className="text-gray-500 font-medium">No recommended jobs found at this time.</p>
                        <Link to="/jobs" className="text-[#29a08e] font-bold mt-4 inline-block hover:underline">Explore all jobs</Link>
                    </div>
                )}
            </div>
        </section>
    );
};

export default RecommendedJobs;
