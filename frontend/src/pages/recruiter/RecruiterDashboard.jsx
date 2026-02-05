import { useState, useEffect } from 'react';
import RecruiterLayout from '../../components/layouts/RecruiterLayout';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import ActionRequiredBanner from '../../components/dashboard/ActionRequiredBanner';
import KycGuard from '../../components/common/KycGuard';

const RecruiterDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ posted_jobs: 0, applicants: 0 });
    const [recentJobs, setRecentJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Stats
                const statsRes = await api.get('/dashboard/recruiter/stats');
                setStats(statsRes.data);

                // Fetch Recent Jobs using the correct endpoint with populated company data
                const jobsRes = await api.get('/companies/me/jobs?limit=3');
                setRecentJobs(jobsRes.data);

            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchData();
    }, [user]);

    return (
        <RecruiterLayout>
            {/* Hero Section */}
            <div className="bg-[#111827] text-white pt-12 pb-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="bg-gray-700 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider text-gray-300">
                            🚀 Boost Your Hiring
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-2">
                        Welcome back, {user?.name?.split(' ')[0] || 'Recruiter'}
                    </h1>
                    <p className="text-[#2D9B82] text-xl font-medium mb-6">
                        You're in demand!
                    </p>
                    <p className="text-gray-400 mb-8 max-w-2xl">
                        You have <span className="text-white font-semibold">{stats.applicants} active applications</span> waiting for review. Update your job postings to attract more talent.
                    </p>

                    {/* Search Bar (Visual Only) */}
                    <div className="bg-white rounded-lg p-2 max-w-4xl flex flex-col md:flex-row gap-2 shadow-lg text-gray-900">
                        <div className="flex-1 flex items-center px-4 border-b md:border-b-0 md:border-r border-gray-200">
                            <svg className="h-5 w-5 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search specific roles..."
                                className="w-full py-3 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                            />
                        </div>
                        <div className="flex-1 flex items-center px-4">
                            <svg className="h-5 w-5 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Location"
                                className="w-full py-3 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                            />
                        </div>
                        <button className="bg-[#2D9B82] text-white px-8 py-3 rounded-md font-medium hover:bg-[#25836d] transition-colors">
                            Search
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content (Overlapping Hero) */}
            <main className="flex-1 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full -mt-16 pb-12">

                {/* KYC Banner */}
                {user?.kycStatus !== 'approved' && (
                    <ActionRequiredBanner
                        message={user?.kycStatus === 'pending'
                            ? "Your verification is under review. You can browse but posting jobs is restricted."
                            : "Please complete company verification to post jobs and view applicants."}
                        linkTo="/kyc/status"
                        linkText={user?.kycStatus === 'pending' ? "Check Status" : "Verify Company"}
                        urgency="Important"
                    />
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Card 1 */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-48 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Recruiter Strength</p>
                                <h3 className="text-4xl font-bold text-gray-900">{stats.recruiter_strength || 0}</h3>
                            </div>
                            <div className="p-2 bg-emerald-50 rounded-lg text-[#2D9B82]">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                        </div>
                        <div>
                            {user?.kycStatus === 'approved' ? (
                                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded flex items-center gap-1 w-fit">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                                    Verified
                                </span>
                            ) : user?.kycStatus === 'pending' ? (
                                <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2.5 py-0.5 rounded flex items-center gap-1 w-fit">
                                    ⏳ Pending
                                </span>
                            ) : user?.kycStatus === 'rejected' ? (
                                <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-0.5 rounded flex items-center gap-1 w-fit">
                                    ❌ Rejected
                                </span>
                            ) : (
                                <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2.5 py-0.5 rounded flex items-center gap-1 w-fit">
                                    Not Verified
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-48 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Inbound Talent</p>
                                <h3 className="text-4xl font-bold text-gray-900">{stats.applicants}</h3>
                            </div>
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Applicants</p>
                        </div>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-48 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Profile Views</p>
                                <h3 className="text-4xl font-bold text-gray-900">{stats.profile_views?.toLocaleString() || 0}</h3>
                            </div>
                            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </div>
                        </div>
                        <div>
                            <p className="text-[#2D9B82] text-sm font-medium">+18% <span className="text-gray-400 font-normal">from last month</span></p>
                        </div>
                    </div>
                </div>

                {/* Active Applications Banner */}
                <Link to="/recruiter/applicants" className="block bg-white rounded-xl p-8 mb-8 shadow-sm border border-gray-100 hover:shadow-md transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full transform translate-x-12 -translate-y-12 opacity-50"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <p className="text-[#2D9B82] text-xs font-bold uppercase tracking-wider mb-2">Inbound Talent</p>
                            <h3 className="text-2xl font-bold text-gray-900">Active Applications</h3>
                            <p className="text-5xl font-black text-gray-900 mt-3 group-hover:text-[#2D9B82] transition-colors">{stats.applicants}</p>
                        </div>
                        <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-[#2D9B82] group-hover:text-white transition-colors shadow-sm">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </div>
                    </div>
                </Link>

                {/* Recent Postings Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900">Recent Postings</h3>
                        <Link to="/recruiter/jobs" className="text-sm font-medium text-[#2D9B82] hover:text-[#25836d]">View All</Link>
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2].map(i => (
                                <div key={i} className="animate-pulse flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                                    <div className="h-4 bg-gray-100 rounded w-1/3"></div>
                                    <div className="h-4 bg-gray-100 rounded w-10"></div>
                                </div>
                            ))}
                        </div>
                    ) : recentJobs.length > 0 ? (
                        <div className="space-y-4">
                            {recentJobs.map(job => (
                                <div key={job._id || job.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors group">
                                    <div className="flex items-start gap-4">
                                        {/* Company Logo */}
                                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200 text-xs font-bold text-gray-400">
                                            {job.company?.logo ? (
                                                <img
                                                    src={`${import.meta.env.VITE_API_URL}${job.company.logo}`}
                                                    alt={job.company.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { e.target.onerror = null; e.target.src = '' }}
                                                />
                                            ) : (
                                                <span>{job.company?.name?.[0] || 'NA'}</span>
                                            )}
                                        </div>

                                        <div>
                                            <h4 className="text-base font-bold text-gray-900 uppercase tracking-tight group-hover:text-[#2D9B82] transition-colors">
                                                {job.title}
                                            </h4>

                                            {/* Company Name */}
                                            <p className="text-xs text-gray-500 font-semibold mb-1">
                                                {job.company?.name || job.company_name}
                                            </p>

                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center text-xs text-gray-500 font-medium">
                                                    <svg className="h-3.5 w-3.5 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    {job.location || job.company?.headquarters || 'Location N/A'}
                                                </div>
                                                <span className="text-gray-300">|</span>
                                                <span className="text-xs text-gray-400 font-medium">
                                                    Posted {(() => {
                                                        const date = new Date(job.createdAt);
                                                        if (isNaN(date.getTime())) return 'recently';
                                                        const diff = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
                                                        if (diff === 0) return 'Today';
                                                        if (diff === 1) return 'Yesterday';
                                                        return `${diff} days ago`;
                                                    })()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 sm:mt-0 text-right">
                                        <div className="flex flex-col items-center sm:items-end p-2 bg-gray-50 rounded-lg min-w-[80px]">
                                            <span className="block text-2xl font-bold text-gray-900">{job.applicantCount || 0}</span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Applicants</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <p className="text-gray-500 text-sm mb-4">No active job postings found.</p>
                            <Link to="/recruiter/post-job" className="text-[#2D9B82] font-medium text-sm hover:underline">Create your first job post</Link>
                        </div>
                    )}

                    <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-8">
                        <KycGuard>
                            <Link
                                to="/recruiter/post-job"
                                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-bold rounded-lg text-white bg-[#2D9B82] hover:bg-[#25836d] shadow-sm hover:shadow-lg hover:shadow-[#2D9B82]/20 transition-all transform active:scale-95"
                            >
                                Broadcast Job Post +
                            </Link>
                        </KycGuard>
                        <Link to="/recruiter/jobs" className="text-sm font-bold text-gray-500 hover:text-gray-900">
                            Manage Listings
                        </Link>
                    </div>
                </div>

            </main>
        </RecruiterLayout>
    );
};

export default RecruiterDashboard;
