import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import CompanyLogo from './common/CompanyLogo';

/**
 * Horizontal row of similar roles (AI / embedding-based via backend).
 * @param {string} jobId - Current job Mongo _id
 */
const SimilarJobs = ({ jobId }) => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!jobId) {
            setLoading(false);
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const res = await api.get(`/jobs/${jobId}/similar`, { params: { limit: 5 } });
                const list = res.data?.similar_jobs || [];
                if (!cancelled) setJobs(Array.isArray(list) ? list.slice(0, 5) : []);
            } catch {
                if (!cancelled) setJobs([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [jobId]);

    if (!jobId) return null;

    if (!loading && jobs.length === 0) return null;

    return (
        <section className="mt-14 mb-8">
            <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-2 h-8 bg-[#29a08e] rounded-full" />
                Similar jobs you might like
            </h3>

            {loading ? (
                <div className="flex gap-4 overflow-x-auto pb-2">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="min-w-[260px] max-w-[260px] h-36 rounded-2xl bg-gray-100 animate-pulse shrink-0"
                        />
                    ))}
                </div>
            ) : (
                <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin">
                    {jobs.map((job) => {
                        const jid = job._id || job.job_id;
                        const score =
                            typeof job.matchScore === 'number'
                                ? job.matchScore
                                : Number(job.matchScore);
                        const showMatch =
                            Number.isFinite(score) && job.recommendationType === 'ai_match';
                        return (
                            <Link
                                key={jid}
                                to={`/jobs/${jid}`}
                                className="min-w-[260px] max-w-[260px] shrink-0 snap-start bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-[#29a08e]/30 transition-all flex flex-col gap-3"
                            >
                                <div className="flex items-start gap-3">
                                    <CompanyLogo
                                        job={job}
                                        className="w-12 h-12 rounded-xl shrink-0 overflow-hidden border border-gray-100"
                                        imgClassName="w-full h-full object-cover"
                                        fallbackClassName="text-lg font-bold text-[#29a08e]"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <h4 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug">
                                            {job.title}
                                        </h4>
                                        <p className="text-xs font-semibold text-gray-500 truncate mt-0.5">
                                            {job.company_name || job.company || 'Company'}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-[11px] text-gray-500 line-clamp-1 flex items-center gap-1">
                                    <span className="inline-block w-1 h-1 rounded-full bg-gray-300" />
                                    {job.location || 'Location TBD'}
                                </p>
                                <div className="flex items-center justify-between mt-auto pt-1">
                                    {showMatch ? (
                                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                                            {score}% match
                                        </span>
                                    ) : (
                                        <span className="text-[11px] font-semibold text-[#29a08e]">
                                            View role
                                        </span>
                                    )}
                                    <span className="text-[10px] text-gray-400 font-medium truncate max-w-[120px]">
                                        {job.matchReason || 'Similar role'}
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </section>
    );
};

export default SimilarJobs;
