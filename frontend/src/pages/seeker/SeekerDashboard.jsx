import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useJobSaver from '../../hooks/useJobSaver';
import UpcomingInterviewWidget from '../../components/dashboard/UpcomingInterviewWidget';
import RecommendJobWidget from '../../components/dashboard/RecommendedJobsWidget';
import RecentActivityWidget from '../../components/dashboard/RecentActivityWidget';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import ActionRequiredBanner from '../../components/dashboard/ActionRequiredBanner';
import { resolveAssetUrl } from '../../utils/assetUrl';
import {
    Search,
    MapPin,
    Briefcase,
    Clock,
    Bookmark,
    ChevronRight,
    AlertCircle,
    CheckCircle,
    TrendingUp,
    Eye,
    FileText,
    UserCheck,
    Zap,
    ArrowUpRight,
    Calendar,
    Star,
    Sparkles,
    Target,
    Award,
    BarChart3
} from 'lucide-react';

const SeekerDashboard = () => {
    const { user } = useAuth();
    const { savedJobIds, setSavedJobIds, toggleSaveJob } = useJobSaver();
    const [stats, setStats] = useState({ applied: 0, saved: 0, interviews: 0, profileViews: 0 });
    const [appliedJobIds, setAppliedJobIds] = useState([]);
    const [upcomingInterviews, setUpcomingInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [locationQuery, setLocationQuery] = useState('');

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statsRes, savedRes, appsRes, interviewsRes] = await Promise.all([
                api.get('/dashboard/seeker/stats').catch(() => ({ data: { applied: 0, saved: 0, interviews: 0, profileViews: 0 } })),
                api.get('/jobs/saved').catch(() => ({ data: { savedJobIds: [], jobs: [] } })),
                api.get('/applications/my').catch(() => ({ data: [] })),
                api.get('/applications/my-interviews').catch(() => ({ data: [] }))
            ]);

            setStats(statsRes.data);
            const validSavedIds = savedRes.data?.savedJobIds || [];
            setSavedJobIds(Array.isArray(validSavedIds) ? validSavedIds.map(id => (id?.toString?.() || id)) : []);
            setAppliedJobIds(appsRes.data
                .filter(app => app.status !== 'withdrawn')
                .map(app => {
                    if (!app.job_id) return null;
                    return typeof app.job_id === 'object' ? app.job_id._id : app.job_id;
                })
                .filter(id => id));
            setUpcomingInterviews(interviewsRes.data || []);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    const refetchInterviews = async () => {
        try {
            const res = await api.get('/applications/my-interviews');
            setUpcomingInterviews(res.data || []);
        } catch (error) {
            console.error("Error refetching interviews:", error);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [setSavedJobIds]);


    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-14 h-14 border-4 border-[#29a08e]/20 rounded-full"></div>
                        <div className="w-14 h-14 border-4 border-[#29a08e] border-t-transparent rounded-full animate-spin absolute inset-0"></div>
                    </div>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Premium Hero Section with Gradient Mesh */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1a2744] to-[#0d2137] text-white pt-10 pb-28 px-4 sm:px-6 lg:px-8">
                {/* Decorative background elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#29a08e]/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-[#29a08e]/5 rounded-full blur-3xl"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-[#29a08e]/5 to-transparent rounded-full blur-3xl rotate-12"></div>
                    {/* Grid pattern overlay */}
                    <div className="absolute inset-0 opacity-[0.03]" style={{
                        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                        backgroundSize: '40px 40px'
                    }}></div>
                </div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                        <div className="flex-1">
                            {/* Greeting badge */}
                            <div className="flex items-center gap-3 mb-6">
                                <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-gray-300 border border-white/10">
                                    <Sparkles size={12} className="text-[#5eead4]" />
                                    {getGreeting()}
                                </span>
                                {stats.interviews > 0 && (
                                    <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#29a08e]/20 backdrop-blur-md rounded-full text-xs font-semibold text-[#5eead4] border border-[#29a08e]/30 animate-pulse">
                                        <Zap size={12} />
                                        {stats.interviews} interview{stats.interviews !== 1 ? 's' : ''} pending
                                    </span>
                                )}
                            </div>

                            <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight leading-tight">
                                Welcome back,{' '}
                                <span className="bg-gradient-to-r from-[#5eead4] to-[#29a08e] bg-clip-text text-transparent">
                                    {user?.fullName?.split(' ')[0] || user?.name || 'Seeker'}
                                </span>
                            </h1>
                            <p className="text-gray-400 mb-8 max-w-2xl text-base leading-relaxed">
                                {stats.interviews > 0
                                    ? `You have ${stats.interviews} interview invitation${stats.interviews !== 1 ? 's' : ''} waiting. Update your availability to secure your spot.`
                                    : 'Your career journey continues. Discover new opportunities tailored just for you.'}
                            </p>

                            {/* Search Bar */}
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-1.5 max-w-4xl flex flex-col md:flex-row gap-1.5 border border-white/10 shadow-2xl shadow-black/20">
                                <div className="flex-1 flex items-center px-4 bg-white/5 rounded-xl">
                                    <Search className="h-5 w-5 text-gray-400 mr-3 shrink-0" />
                                    <input
                                        type="text"
                                        placeholder="Job title, keywords..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full py-3.5 bg-transparent focus:outline-none text-white placeholder-gray-500 text-sm font-medium"
                                    />
                                </div>
                                <div className="flex-1 flex items-center px-4 bg-white/5 rounded-xl">
                                    <MapPin className="h-5 w-5 text-gray-400 mr-3 shrink-0" />
                                    <input
                                        type="text"
                                        placeholder="City or remote"
                                        value={locationQuery}
                                        onChange={(e) => setLocationQuery(e.target.value)}
                                        className="w-full py-3.5 bg-transparent focus:outline-none text-white placeholder-gray-500 text-sm font-medium"
                                    />
                                </div>
                                <Link
                                    to={`/seeker/jobs${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`}
                                    className="bg-gradient-to-r from-[#29a08e] to-[#22877a] text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:from-[#228377] hover:to-[#1a6b62] transition-all shrink-0 text-center shadow-lg shadow-[#29a08e]/20 active:scale-95"
                                >
                                    Search Jobs
                                </Link>
                            </div>

                            {/* Quick tags */}
                            <div className="mt-5 flex gap-2.5 text-xs text-gray-500 font-medium items-center flex-wrap">
                                <span className="text-gray-500">Trending:</span>
                                {['Remote', 'Full Stack', 'AI/ML', 'Design'].map(tag => (
                                    <Link
                                        key={tag}
                                        to={`/seeker/jobs?q=${encodeURIComponent(tag)}`}
                                        className="bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg text-gray-400 hover:text-white cursor-pointer transition-all border border-white/5 hover:border-white/10"
                                    >
                                        {tag}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Right side visual element */}
                        <div className="hidden lg:flex flex-col gap-4 w-72 shrink-0">
                            {/* Mini stat cards in hero - clickable */}
                            <Link
                                to="/seeker/applications"
                                className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-5 hover:bg-white/10 hover:border-white/20 transition-all duration-200 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#5eead4] focus:ring-offset-2 focus:ring-offset-[#0f172a] rounded-2xl"
                                tabIndex={0}
                                aria-label={`${stats.applied} applications sent. View applications`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-[#29a08e]/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                                        <Target size={22} className="text-[#5eead4]" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-extrabold text-white">{stats.applied}</p>
                                        <p className="text-xs text-gray-400 font-medium">Applications sent</p>
                                    </div>
                                </div>
                            </Link>
                            <Link
                                to="/seeker/interviews"
                                className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-5 hover:bg-white/10 hover:border-white/20 transition-all duration-200 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#5eead4] focus:ring-offset-2 focus:ring-offset-[#0f172a] rounded-2xl"
                                tabIndex={0}
                                aria-label={`${stats.interviews} upcoming interviews. View interviews`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                                        <Calendar size={22} className="text-purple-300" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-extrabold text-white">{stats.interviews}</p>
                                        <p className="text-xs text-gray-400 font-medium">Upcoming interviews</p>
                                    </div>
                                </div>
                            </Link>
                            <Link
                                to="/seeker/jobs?saved=true"
                                className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-5 hover:bg-white/10 hover:border-white/20 transition-all duration-200 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#5eead4] focus:ring-offset-2 focus:ring-offset-[#0f172a] rounded-2xl"
                                tabIndex={0}
                                aria-label={`${savedJobIds.length} jobs saved. View saved jobs`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                                        <Bookmark size={22} className="text-amber-300" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-extrabold text-white">{savedJobIds.length}</p>
                                        <p className="text-xs text-gray-400 font-medium">Jobs saved</p>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full -mt-16 pb-12 relative z-10">
                {user?.kycStatus !== 'approved' && (
                    <ActionRequiredBanner
                        message={user?.kycStatus === 'pending'
                            ? "Your verification is under review. You can browse jobs but application is restricted."
                            : "Please complete your KYC verification to unlock full features like applying for jobs."}
                        linkTo="/kyc/status"
                        linkText={user?.kycStatus === 'pending' ? "Check Status" : "Verify Identity"}
                        urgency="Important"
                    />
                )}

                {/* Summary Cards (Mobile visible, replaces hero stats) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 lg:hidden">
                    <Link
                        to="/seeker/applications"
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-[#29a08e]/30 transition-all duration-200 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#29a08e] focus:ring-offset-2 rounded-2xl"
                        aria-label={`${stats.applied} applications sent. View applications`}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-[#29a08e]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                                <Target size={20} className="text-[#29a08e]" />
                            </div>
                            <div>
                                <p className="text-2xl font-extrabold text-gray-900">{stats.applied}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Applied</p>
                            </div>
                        </div>
                    </Link>
                    <Link
                        to="/seeker/interviews"
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-[#29a08e]/30 transition-all duration-200 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#29a08e] focus:ring-offset-2 rounded-2xl"
                        aria-label={`${stats.interviews} upcoming interviews. View interviews`}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                                <Calendar size={20} className="text-purple-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-extrabold text-gray-900">{stats.interviews}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Interviews</p>
                            </div>
                        </div>
                    </Link>
                    <Link
                        to="/seeker/jobs?saved=true"
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-[#29a08e]/30 transition-all duration-200 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#29a08e] focus:ring-offset-2 rounded-2xl"
                        aria-label={`${savedJobIds.length} jobs saved. View saved jobs`}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                                <Bookmark size={20} className="text-amber-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-extrabold text-gray-900">{savedJobIds.length}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Saved</p>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Quick Stats Row (Desktop) */}
                <div className="hidden lg:grid grid-cols-3 gap-5 mb-8">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-lg hover:border-[#29a08e]/20 transition-all group cursor-default">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Discovery Score</p>
                            <div className="flex items-end gap-2">
                                <h3 className="text-3xl font-extrabold text-gray-900">20%</h3>
                                <span className="text-[#29a08e] text-xs font-bold mb-1 flex items-center gap-0.5">
                                    <TrendingUp size={12} /> +20%
                                </span>
                            </div>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                            <BarChart3 size={24} />
                        </div>
                    </div>

                    <Link
                        to="/seeker/applications"
                        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-lg hover:border-[#29a08e]/20 transition-all duration-200 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#29a08e] focus:ring-offset-2 rounded-2xl"
                        aria-label="View applications"
                    >
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Active Applications</p>
                            <div className="flex items-end gap-2">
                                <h3 className="text-3xl font-extrabold text-gray-900">{stats.applied}</h3>
                                {stats.interviews > 0 && (
                                    <p className="text-[10px] items-center flex gap-1 text-emerald-600 font-bold mb-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> {stats.interviews} Interview{stats.interviews !== 1 ? 's' : ''} Pending
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 text-[#29a08e] flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                            <FileText size={24} />
                        </div>
                    </Link>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-lg hover:border-[#29a08e]/20 transition-all group cursor-default">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Profile Views</p>
                            <div className="flex items-end gap-2">
                                <h3 className="text-3xl font-extrabold text-gray-900">{stats.profileViews || 0}</h3>
                                <span className="text-[#29a08e] text-xs font-bold mb-1 flex items-center gap-0.5">
                                    <TrendingUp size={12} /> +0%
                                </span>
                            </div>
                            <p className="text-[10px] text-gray-400 font-medium mt-0.5">total recruiter views</p>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                            <Eye size={24} />
                        </div>
                    </div>
                </div>

                {/* Interview Alert Banner */}
                {upcomingInterviews.length > 0 && (
                    <div className="bg-gradient-to-r from-[#29a08e]/10 via-emerald-50 to-teal-50 border border-[#29a08e]/20 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-[#29a08e] rounded-xl text-white shrink-0 shadow-lg shadow-[#29a08e]/20">
                                <AlertCircle size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-0.5 flex items-center gap-2">
                                    Action Required
                                    <span className="inline-flex h-2 w-2 rounded-full bg-[#29a08e] animate-pulse"></span>
                                </h3>
                                <p className="text-sm text-gray-600">
                                    <span className="font-bold">{upcomingInterviews[0].job_id?.company_name || 'A company'}</span> has scheduled an interview for the <span className="font-bold text-gray-800">{upcomingInterviews[0].job_id?.title || 'Job Role'}</span> position.
                                </p>
                            </div>
                        </div>
                        <Link
                            to="/seeker/interviews?focused=true"
                            className="px-6 py-2.5 bg-[#29a08e] text-white text-sm font-bold rounded-xl hover:bg-[#228377] transition-all shrink-0 shadow-lg shadow-[#29a08e]/20 flex items-center gap-2 active:scale-95"
                        >
                            View Details <ArrowUpRight size={14} />
                        </Link>
                    </div>
                )}

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Application Pipeline */}
                        <div>
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Application Pipeline</h3>
                                    <p className="text-xs text-gray-400 font-medium mt-0.5">Track your application progress</p>
                                </div>
                                <Link to="/seeker/applications" className="text-xs font-bold text-[#29a08e] hover:text-[#228377] flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-[#29a08e]/5 transition-all">
                                    View all <ChevronRight size={14} />
                                </Link>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {[
                                    { label: 'In Review', value: stats.applied, sub: 'Awaiting feedback', icon: Clock, gradient: 'from-orange-50 to-amber-50', iconColor: 'text-orange-500' },
                                    { label: 'Shortlisted', value: 0, sub: 'Action required', icon: FileText, gradient: 'from-sky-50 to-blue-50', iconColor: 'text-sky-500' },
                                    { label: 'Interview', value: stats.interviews, sub: 'Keep going!', icon: UserCheck, gradient: 'from-purple-50 to-fuchsia-50', iconColor: 'text-purple-500' },
                                    { label: 'Offer', value: 0, sub: 'Apply now!', icon: Award, gradient: 'from-emerald-50 to-teal-50', iconColor: 'text-[#29a08e]' }
                                ].map((item, index) => (
                                    <div key={index} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-[#29a08e]/20 transition-all group cursor-default">
                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} ${item.iconColor} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm`}>
                                            <item.icon size={18} />
                                        </div>
                                        <h4 className="text-2xl font-extrabold text-gray-900">{item.value}</h4>
                                        <p className="text-xs font-bold text-gray-500 mt-0.5">{item.label}</p>
                                        <p className="text-[10px] text-gray-400 mt-1">{item.sub}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <RecommendJobWidget appliedJobIds={appliedJobIds} savedJobIds={savedJobIds} toggleSaveJob={toggleSaveJob} />
                    </div>

                    <div className="space-y-6">
                        {/* Profile Strength */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all">
                            <div className="flex justify-center mb-5">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200 shadow-inner">
                                        {user?.profileImage ? (
                                            <img
                                                src={resolveAssetUrl(user.profileImage)}
                                                alt=""
                                                className="w-full h-full object-cover"
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        ) : (
                                            <UserCheck className="w-9 h-9 text-gray-400" />
                                        )}
                                    </div>
                                    {/* Progress ring */}
                                    <svg className="absolute -inset-1 w-[88px] h-[88px] -rotate-90" viewBox="0 0 88 88">
                                        <circle cx="44" cy="44" r="40" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                                        <circle cx="44" cy="44" r="40" fill="none" stroke="#29a08e" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${65 * 2.51} ${100 * 2.51}`} />
                                    </svg>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-bold text-gray-900">Profile Strength</h3>
                                <span className="h-8 px-3 rounded-xl bg-[#29a08e]/10 flex items-center text-xs font-bold text-[#29a08e]">65%</span>
                            </div>
                            <p className="text-xs text-gray-400 mb-5 font-medium flex items-center gap-1.5">
                                <TrendingUp size={12} className="text-[#29a08e]" /> Keep improving your profile
                            </p>

                            <div className="space-y-3.5">
                                {[
                                    { label: 'Profile Completeness', value: 95 },
                                    { label: 'Skills', value: 75 },
                                    { label: 'Work Experience', value: 45 }
                                ].map((item, index) => (
                                    <div key={index}>
                                        <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1.5">
                                            <span>{item.label}</span>
                                            <span className="text-gray-900">{item.value}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${item.value >= 80 ? 'bg-[#29a08e]' : item.value >= 60 ? 'bg-amber-400' : 'bg-orange-400'}`}
                                                style={{ width: `${item.value}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100/50">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <div className="w-5 h-5 rounded-md bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold">!</div>
                                    <span className="text-xs font-bold text-gray-900">Next Step</span>
                                </div>
                                <p className="text-[11px] text-gray-600 font-medium pl-7">Add 2 more skills to reach 90% match rate.</p>
                            </div>

                            <Link
                                to="/seeker/profile"
                                className="mt-5 flex items-center justify-center gap-2 w-full py-3 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition-all active:scale-95 shadow-lg shadow-gray-900/10"
                            >
                                Improve Profile <ChevronRight size={12} />
                            </Link>
                        </div>

                        <UpcomingInterviewWidget
                            interviews={upcomingInterviews}
                            loading={loading}
                            onRescheduleAction={refetchInterviews}
                        />

                        <RecentActivityWidget />
                    </div>
                </div>
            </main>
        </>
    );
};

export default SeekerDashboard;
