import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import ActionRequiredBanner from '../../components/dashboard/ActionRequiredBanner';
import KycGuard from '../../components/common/KycGuard';
import CompanyLogo from '../../components/common/CompanyLogo';
import RecruiterModerationWarningsBanner from '../../components/recruiter/RecruiterModerationWarningsBanner';

const AnimatedCounter = ({ end, suffix = '' }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        const duration = 1800;
        const steps = 60;
        const increment = end / steps;
        let current = 0;
        const interval = setInterval(() => {
            current += increment;
            if (current >= end) {
                setCount(end);
                clearInterval(interval);
            } else {
                setCount(Math.floor(current));
            }
        }, duration / steps);
        return () => clearInterval(interval);
    }, [end]);
    return <span>{count.toLocaleString()}{suffix}</span>;
};

const RecruiterDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ posted_jobs: 0, applicants: 0 });
    const [recentJobs, setRecentJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    const NumberSkeleton = ({ w = 40 }) => (
        <div
            className="h-8 bg-white/15 rounded-md animate-pulse mx-auto"
            style={{ width: `${w}px` }}
            aria-hidden
        />
    );

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                const statsRes = await api.get('/dashboard/recruiter/stats');
                setStats(statsRes.data);
                const jobsRes = await api.get('/companies/me/jobs?limit=3');
                setRecentJobs(jobsRes.data);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    useEffect(() => {
        if (!user) return;
        const onAppsUpdated = async () => {
            try {
                setLoading(true);
                const statsRes = await api.get('/dashboard/recruiter/stats');
                setStats(statsRes.data);
            } catch (error) {
                console.error("Error refreshing recruiter stats:", error);
            } finally {
                setLoading(false);
            }
        };

        window.addEventListener('recruiter:applicationsUpdated', onAppsUpdated);
        return () => window.removeEventListener('recruiter:applicationsUpdated', onAppsUpdated);
    }, [user]);

    const quickActions = [
        { label: 'Post a Job', desc: 'Create a new job listing', icon: '📋', to: '/recruiter/post-job', color: 'from-[#29a08e] to-teal-700' },
        { label: 'My Jobs', desc: 'Manage your postings', icon: '💼', to: '/recruiter/jobs', color: 'from-blue-500 to-blue-700' },
        { label: 'Applications', desc: 'Review applicants', icon: '👥', to: '/recruiter/applications', color: 'from-purple-500 to-purple-700' },
        { label: 'My Profile', desc: 'Update your info', icon: '⚙️', to: '/recruiter/profile', color: 'from-amber-500 to-orange-600' },
    ];

    return (
        <>
            {/* ─── Hero Section ─────────────────────────────── */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#0d2f2b] to-slate-900 pt-12 pb-32 px-4 sm:px-6 lg:px-8">
                {/* Background effects */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-[#29a08e] rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-400 rounded-full blur-3xl"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#29a08e] rounded-full blur-[120px] opacity-10"></div>
                </div>
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

                <div className="relative max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                        <div className="text-white space-y-4 animate-fade-in-up">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-sm font-medium text-gray-200 backdrop-blur-sm">
                                <span className="w-2 h-2 bg-[#29a08e] rounded-full animate-pulse"></span>
                                🚀 Recruiter Command Center
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight">
                                Welcome back,
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#29a08e] via-teal-300 to-[#29a08e]">
                                    {user?.name?.split(' ')[0] || 'Recruiter'}
                                </span>
                            </h1>
                            <p className="text-lg text-gray-300 max-w-xl leading-relaxed">
                                You have <span className="text-white font-bold">{stats.applicants} active applications</span> waiting for review. Let's find your next great hire.
                            </p>
                        </div>

                        {/* Quick Stats floating cards */}
                        <div className="flex gap-4 flex-wrap lg:flex-nowrap">
                            {[
                                { value: stats.recruiter_strength || 0, label: 'Strength Score', icon: '⚡' },
                                { value: stats.applicants || 0, label: 'Applicants', icon: '👥' },
                                { value: stats.profile_views || 0, label: 'Profile Views', icon: '👁️' },
                            ].map((s, i) => (
                                <div key={i} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 text-center min-w-[120px] hover:bg-white/15 transition-all duration-300" style={{ animationDelay: `${i * 0.1}s` }}>
                                    <div className="text-2xl mb-2">{s.icon}</div>
                                    <p className="text-3xl font-black text-white mb-1">
                                        {loading ? <NumberSkeleton w={70} /> : <AnimatedCounter end={s.value} />}
                                    </p>
                                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>


            </div>

            {/* ─── Main Content ─────────────────────────────── */}
            <main className="flex-1 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full -mt-16 pb-16 relative z-10">

                {/* KYC Banner */}
                {user?.kycStatus !== 'approved' && (
                    <div className="mb-8">
                        <ActionRequiredBanner
                            message={user?.kycStatus === 'pending'
                                ? "Your verification is under review. You can browse but posting jobs is restricted."
                                : "Please complete company verification to post jobs and view applicants."}
                            linkTo="/kyc/status"
                            linkText={user?.kycStatus === 'pending' ? "Check Status" : "Verify Company"}
                            urgency="Important"
                        />
                    </div>
                )}

                {/* ─── Quick Actions Grid ─────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                    {quickActions.map((action, i) => (
                        <Link
                            key={i}
                            to={action.to}
                            className="group bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:border-[#29a08e]/20 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                        >
                            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${action.color} rounded-full blur-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-500 translate-x-8 -translate-y-8`}></div>
                            <div className="relative z-10">
                                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">{action.icon}</div>
                                <h3 className="text-sm font-bold text-gray-900 mb-1 group-hover:text-[#29a08e] transition-colors">{action.label}</h3>
                                <p className="text-xs text-gray-400 font-medium">{action.desc}</p>
                            </div>
                            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                                <svg className="w-5 h-5 text-[#29a08e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* ─── Stats Overview Cards ─────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    {/* Card 1: Recruiter Strength */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-48 hover:shadow-lg hover:border-[#29a08e]/20 transition-all duration-300 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#29a08e]/5 to-teal-100/10 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Recruiter Strength</p>
                                <h3 className="text-4xl font-black text-gray-900">{stats.recruiter_strength || 0}</h3>
                            </div>
                            <div className="p-3 bg-gradient-to-br from-[#29a08e]/10 to-teal-50 rounded-xl text-[#29a08e]">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                        </div>
                        <div className="relative z-10">
                            {user?.kycStatus === 'approved' ? (
                                <span className="bg-[#29a08e]/10 text-[#29a08e] text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-1.5 w-fit uppercase tracking-wider border border-[#29a08e]/20">
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                                    Verified
                                </span>
                            ) : user?.kycStatus === 'pending' ? (
                                <span className="bg-amber-50 text-amber-700 text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-1.5 w-fit uppercase tracking-wider border border-amber-200">
                                    ⏳ Pending
                                </span>
                            ) : user?.kycStatus === 'rejected' ? (
                                <span className="bg-rose-50 text-rose-700 text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-1.5 w-fit uppercase tracking-wider border border-rose-200">
                                    ❌ Rejected
                                </span>
                            ) : (
                                <span className="bg-gray-50 text-gray-500 text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-1.5 w-fit uppercase tracking-wider border border-gray-200">
                                    Not Verified
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Card 2: Inbound Talent */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-48 hover:shadow-lg hover:border-[#29a08e]/20 transition-all duration-300 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-blue-100/20 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Inbound Talent</p>
                                {loading ? (
                                    <NumberSkeleton w={90} />
                                ) : (
                                    <h3 className="text-4xl font-black text-gray-900">{stats.applicants}</h3>
                                )}
                            </div>
                            <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl text-blue-500">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                        </div>
                        <div className="relative z-10">
                            <p className="text-xs text-gray-400 font-medium">Total Applicants</p>
                        </div>
                    </div>

                    {/* Card 3: Profile Views */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-48 hover:shadow-lg hover:border-[#29a08e]/20 transition-all duration-300 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-50 to-purple-100/20 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Profile Views</p>
                                <h3 className="text-4xl font-black text-gray-900">{stats.profile_views?.toLocaleString() || 0}</h3>
                            </div>
                            <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl text-purple-500">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </div>
                        </div>
                        <div className="relative z-10">
                            <p className={`text-xs font-bold ${stats.profile_views_growth >= 0 ? 'text-[#29a08e]' : 'text-red-500'}`}>
                                {stats.profile_views_growth >= 0 ? '+' : ''}{stats.profile_views_growth || 0}%{' '}
                                <span className="text-gray-400 font-medium">from last month</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* ─── Active Applications Banner ─────────────────────────────── */}
                <Link to="/recruiter/applications" className="block bg-gradient-to-r from-slate-900 via-[#0d2f2b] to-slate-900 rounded-2xl p-8 mb-10 shadow-lg hover:shadow-2xl transition-all group relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-[#29a08e] rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-400 rounded-full blur-2xl"></div>
                    </div>
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <p className="text-[#29a08e] text-[10px] font-black uppercase tracking-[0.3em] mb-2">Inbound Talent</p>
                            <h3 className="text-2xl font-bold text-white mb-1">Active Applications</h3>
                            <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#29a08e] to-teal-300 mt-2 group-hover:from-teal-300 group-hover:to-[#29a08e] transition-all">{stats.applicants}</p>
                        </div>
                        <div className="h-14 w-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:bg-[#29a08e] transition-all duration-300 border border-white/20">
                            <svg className="h-6 w-6 text-white group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </div>
                    </div>
                </Link>

                <RecruiterModerationWarningsBanner />

                {/* ─── Recent Postings Section ─────────────────────────────── */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
                        <div>
                            <p className="text-[#29a08e] font-bold text-[10px] uppercase tracking-[0.2em] mb-1">Your Listings</p>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Recent Postings</h3>
                        </div>
                        <Link to="/recruiter/jobs" className="text-sm font-bold text-[#29a08e] hover:text-[#228377] flex items-center gap-1.5 group/link transition-colors">
                            View All
                            <svg className="w-4 h-4 group-hover/link:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>

                    <div className="p-6">
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2].map(i => (
                                    <div key={i} className="animate-pulse flex items-center justify-between p-5 bg-gray-50 rounded-xl">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                                            <div className="space-y-2">
                                                <div className="h-4 bg-gray-200 rounded w-40"></div>
                                                <div className="h-3 bg-gray-100 rounded w-24"></div>
                                            </div>
                                        </div>
                                        <div className="h-8 bg-gray-200 rounded-lg w-16"></div>
                                    </div>
                                ))}
                            </div>
                        ) : recentJobs.length > 0 ? (
                            <div className="space-y-3">
                                {recentJobs.map(job => (
                                    <div key={job._id || job.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-gray-100 rounded-2xl hover:bg-gray-50/50 hover:border-[#29a08e]/10 transition-all duration-300 group">
                                        <div className="flex items-start gap-4">
                                            <CompanyLogo job={job} companyName={job.company?.name} className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#29a08e]/10 to-teal-50 border border-[#29a08e]/10" imgClassName="w-full h-full object-cover" fallbackClassName="text-sm" />
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#29a08e] transition-colors">
                                                    {job.title}
                                                </h4>
                                                <p className="text-xs text-gray-500 font-medium mt-0.5">
                                                    {job.company?.name || job.company_name}
                                                </p>
                                                <div className="flex items-center gap-3 mt-1.5">
                                                    <div className="flex items-center text-[10px] text-gray-400 font-medium">
                                                        <svg className="h-3 w-3 mr-1 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                        {job.location || job.company?.headquarters || 'Location N/A'}
                                                    </div>
                                                    <span className="text-gray-200">•</span>
                                                    <span className="text-[10px] text-gray-400 font-medium">
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
                                        <div className="mt-3 sm:mt-0">
                                            <div className="flex flex-col items-center px-4 py-2 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl min-w-[80px] border border-gray-100 group-hover:border-[#29a08e]/20 transition-colors">
                                                <span className="block text-2xl font-black text-gray-900 group-hover:text-[#29a08e] transition-colors">{job.applicantCount || 0}</span>
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Applicants</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-gradient-to-br from-gray-50/50 to-[#29a08e]/5 rounded-2xl border border-dashed border-gray-200">
                                <div className="text-4xl mb-4">📋</div>
                                <h3 className="text-lg font-black text-gray-900 mb-2">No active job postings</h3>
                                <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">Start attracting top talent by posting your first job listing.</p>
                                <Link to="/recruiter/post-job" className="inline-flex items-center gap-2 px-6 py-3 bg-[#29a08e] text-white rounded-xl font-bold text-sm hover:bg-[#228377] transition-all shadow-lg shadow-[#29a08e]/20">
                                    Create your first job post
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </Link>
                            </div>
                        )}

                        <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
                            <KycGuard>
                                <Link
                                    to="/recruiter/post-job"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#29a08e] text-white text-sm font-bold rounded-xl hover:bg-[#228377] shadow-lg shadow-[#29a08e]/20 hover:shadow-[#29a08e]/30 transition-all active:scale-95"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Broadcast Job Post
                                </Link>
                            </KycGuard>
                            <Link to="/recruiter/jobs" className="text-sm font-bold text-gray-400 hover:text-[#29a08e] transition-colors flex items-center gap-1.5">
                                Manage Listings
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
};

export default RecruiterDashboard;
