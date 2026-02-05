import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const RecommendedJobs = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                // In a real app, we'd use /api/jobs/recommended
                const res = await api.get('/api/jobs');
                setJobs(res.data.slice(0, 3)); // Just take first 3 for dashboard
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
                        <svg className="w-3.5 h-3.5 text-[#2D9B82]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                        </svg>
                        <p className="text-xs font-semibold text-gray-400">Based on your profile and preferences</p>
                    </div>
                </div>
                <Link to="/jobs" className="text-sm font-bold text-[#2D9B82] hover:text-[#25836d] flex items-center gap-1 transition-colors">
                    View all
                </Link>
            </div>

            <div className="space-y-4">
                {jobs.length > 0 ? jobs.map((job, idx) => (
                    <div key={job._id || idx} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Company Logo/Icon */}
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${idx === 0 ? 'bg-pink-100 text-pink-500' :
                                    idx === 1 ? 'bg-blue-100 text-blue-500' :
                                        'bg-indigo-100 text-indigo-500'
                                }`}>
                                {job.company_logo ? (
                                    <img src={job.company_logo} alt="" className="w-full h-full object-cover rounded-2xl" />
                                ) : (
                                    <span className="text-xl font-bold">{job.company_name?.charAt(0) || 'J'}</span>
                                )}
                            </div>

                            {/* Job Info */}
                            <div className="flex-1">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
                                    <div>
                                        <h4 className="text-lg font-bold text-gray-900 group-hover:text-[#2D9B82] transition-colors line-clamp-1">{job.title}</h4>
                                        <p className="text-sm font-semibold text-gray-400">
                                            {job.company_name} • {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : '2d ago'}
                                        </p>
                                    </div>
                                    <div className="px-3 py-1 bg-green-50 text-[#2D9B82] rounded-lg text-xs font-bold border border-green-100/50">
                                        {85 + idx * 2}% Match
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-6">
                                    <span className="px-3 py-1 bg-gray-50 text-gray-500 rounded-lg text-xs font-semibold border border-gray-100 flex items-center gap-1.5">
                                        <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        </svg>
                                        {job.location}
                                    </span>
                                    <span className="px-3 py-1 bg-gray-50 text-gray-500 rounded-lg text-xs font-semibold border border-gray-100">
                                        {job.salary_range || '$80k - $120k'}
                                    </span>
                                    {(job.skills_required || 'Figma, React, UI/UX').split(',').slice(0, 3).map(skill => (
                                        <span key={skill} className="px-3 py-1 bg-gray-50 text-gray-500 rounded-lg text-xs font-semibold border border-gray-100">
                                            {skill.trim()}
                                        </span>
                                    ))}
                                </div>

                                <div className="flex items-center gap-3">
                                    <Link
                                        to={`/jobs/${job._id}`}
                                        className="flex-1 md:flex-none text-center px-8 py-3 bg-[#333333] text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg shadow-black/5"
                                    >
                                        Apply Now
                                    </Link>
                                    <button className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-[#2D9B82] hover:border-[#2D9B82]/20 hover:bg-[#2D9B82]/5 transition-all">
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
                        <Link to="/jobs" className="text-[#2D9B82] font-bold mt-4 inline-block hover:underline">Explore all jobs</Link>
                    </div>
                )}
            </div>
        </section>
    );
};

export default RecommendedJobs;
