import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SeekerLayout from '../../components/layouts/SeekerLayout';
import RecentActivityWidget from '../../components/dashboard/RecentActivityWidget';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import ActionRequiredBanner from '../../components/dashboard/ActionRequiredBanner';
import KycGuard from '../../components/common/KycGuard';
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
    Eye
} from 'lucide-react';

const SeekerDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ applied: 0, saved: 0, interviews: 0 });
    const [recommendedJobs, setRecommendedJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Parallel fetch for stats and recommended jobs
                // Adjust endpoints as per actual backend routes
                const [statsRes, jobsRes] = await Promise.all([
                    api.get('/dashboard/seeker/stats').catch(() => ({ data: { applied: 0, saved: 0, interviews: 0 } })),
                    api.get('/jobs/recommended').catch(() => ({ data: [] }))
                ]);

                setStats(statsRes.data);
                setRecommendedJobs(jobsRes.data);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const handleApply = async (jobId) => {
        try {
            const response = await api.post('/applications/apply', { job_id: jobId });
            if (response.data.success) {
                alert('Applied successfully!');
                // Optionally refresh stats
                setStats(prev => ({ ...prev, applied: prev.applied + 1 }));
            }
        } catch (error) {
            console.error("Application failed", error);
            alert(error.response?.data?.message || 'Failed to apply');
        }
    };

    return (
        <SeekerLayout>
            {/* Hero Section */}
            <div className="bg-[#111827] text-white pt-12 pb-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="bg-gray-700 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider text-gray-300 flex items-center gap-2">
                            <TrendingUp size={12} className="text-[#2D9B82]" />
                            Boost your career today
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-2">
                        Welcome back, {user?.fullName?.split(' ')[0] || user?.name || 'Seeker'}
                    </h1>
                    <p className="text-[#2D9B82] text-xl font-medium mb-6">
                        You're in demand!
                    </p>
                    <p className="text-gray-400 mb-8 max-w-2xl">
                        You have <span className="text-white font-semibold">{stats.interviews} interview invitation{stats.interviews !== 1 ? 's' : ''}</span> waiting. Update your availability to secure your spot.
                    </p>

                    {/* Search Bar */}
                    <div className="bg-white rounded-lg p-2 max-w-4xl flex flex-col md:flex-row gap-2 shadow-lg text-gray-900">
                        <div className="flex-1 flex items-center px-4 border-b md:border-b-0 md:border-r border-gray-200">
                            <Search className="h-5 w-5 text-gray-400 mr-3" />
                            <input
                                type="text"
                                placeholder="Product Designer"
                                className="w-full py-3 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400 text-sm font-medium"
                            />
                        </div>
                        <div className="flex-1 flex items-center px-4">
                            <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                            <input
                                type="text"
                                placeholder="San Francisco, CA"
                                className="w-full py-3 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400 text-sm font-medium"
                            />
                        </div>
                        <button className="bg-[#2D9B82] text-white px-8 py-3 rounded-md font-bold text-sm hover:bg-[#25836d] transition-colors">
                            Search
                        </button>
                    </div>

                    <div className="mt-6 flex gap-3 text-xs text-gray-400 font-medium">
                        <span>Recent:</span>
                        <span className="bg-gray-800 px-2 py-1 rounded text-gray-300 hover:text-white cursor-pointer">Remote</span>
                        <span className="bg-gray-800 px-2 py-1 rounded text-gray-300 hover:text-white cursor-pointer">UX Research</span>
                        <span className="bg-gray-800 px-2 py-1 rounded text-gray-300 hover:text-white cursor-pointer">Senior Designer</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full -mt-16 pb-12">

                {/* KYC Banner */}
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

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Discovery Score */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                                <Search size={20} />
                            </div>
                            <span className="text-[#2D9B82] text-xs font-bold">+20%</span>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Discovery Score</p>
                            <h3 className="text-2xl font-bold text-gray-900">20%</h3>
                        </div>
                    </div>

                    {/* Active Applications */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                                <Briefcase size={20} />
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Active Applications</p>
                            <div className="flex items-end gap-2">
                                <h3 className="text-2xl font-bold text-gray-900">{stats.applied}</h3>
                                <p className="text-[10px] items-center flex gap-1 text-emerald-600 font-bold mb-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {stats.interviews} Interview Pending</p>
                            </div>
                        </div>
                    </div>

                    {/* Profile Views */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                                <Eye size={20} />
                            </div>
                            <span className="text-[#2D9B82] text-xs font-bold">+12%</span>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Profile Views</p>
                            <div className="flex items-end gap-2">
                                <h3 className="text-2xl font-bold text-gray-900">24</h3>
                                <p className="text-[10px] text-gray-400 font-bold mb-1.5">Last 30 days</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Banner */}
                {stats.interviews > 0 && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-[#2D9B82] rounded-full text-white shrink-0">
                                <AlertCircle size={20} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-sm font-bold text-gray-900">Action Required</h3>
                                    <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-[10px] font-black uppercase rounded">Urgent</span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    TechFlow Inc. has invited you to a technical interview for the <span className="font-bold text-gray-800">Senior Product Designer</span> role. Slots are filling up fast!
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <button className="flex-1 md:flex-none px-6 py-2.5 bg-[#2D9B82] text-white text-sm font-bold rounded-lg hover:bg-[#25836d] shadow-sm shadow-[#2D9B82]/20 transition-all">
                                Respond Now &rarr;
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Application Pipeline */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-900">Application Pipeline</h3>
                                <Link to="/seeker/applications" className="text-xs font-bold text-[#2D9B82] hover:underline">View all &rarr;</Link>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center mb-3">
                                        <Clock size={16} />
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-900">{stats.applied}</h4>
                                    <p className="text-xs font-bold text-gray-500">In Review</p>
                                    <p className="text-[10px] text-gray-400 mt-1">Awaiting feedback</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#2D9B82] flex items-center justify-center mb-3">
                                        <Briefcase size={16} />
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-900">{stats.interviews}</h4>
                                    <p className="text-xs font-bold text-gray-500">Interview</p>
                                    <p className="text-[10px] text-gray-400 mt-1">Action required</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-500 flex items-center justify-center mb-3">
                                        <CheckCircle size={16} />
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-900">0</h4>
                                    <p className="text-xs font-bold text-gray-500">Offers</p>
                                    <p className="text-[10px] text-gray-400 mt-1">Keep going!</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center mb-3">
                                        <Bookmark size={16} />
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-900">{stats.saved}</h4>
                                    <p className="text-xs font-bold text-gray-500">Saved</p>
                                    <p className="text-[10px] text-gray-400 mt-1">Apply later</p>
                                </div>
                            </div>
                        </div>

                        {/* Recommended Jobs */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Recommended Jobs</h3>
                                    <p className="text-xs font-medium text-gray-400">Based on your profile and preferences</p>
                                </div>
                                <Link to="/seeker/jobs" className="text-xs font-bold text-[#2D9B82] hover:underline">View all</Link>
                            </div>

                            <div className="space-y-4">
                                {loading ? (
                                    <div className="p-8 text-center text-gray-400 text-sm font-medium">Loading recommendations...</div>
                                ) : recommendedJobs.length > 0 ? (
                                    recommendedJobs.slice(0, 3).map(job => (
                                        <div key={job._id || job.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-lg group-hover:bg-[#2D9B82] group-hover:text-white transition-colors">
                                                        {job.company_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-base font-bold text-gray-900 group-hover:text-[#2D9B82] transition-colors">{job.title}</h4>
                                                        <p className="text-xs font-medium text-gray-500 mb-2">{job.company_name} • {Math.floor((new Date() - new Date(job.posted_at)) / (86400000))}d ago</p>

                                                        <div className="flex flex-wrap gap-2">
                                                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-50 text-gray-600 text-[10px] font-medium border border-gray-100">
                                                                <MapPin size={10} className="mr-1" /> {job.location || 'Remote'}
                                                            </span>
                                                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-50 text-gray-600 text-[10px] font-medium border border-gray-100">
                                                                NRs. {job.salary_range || 'Negotiable'}
                                                            </span>
                                                            {job.skills && (job.skills.includes('[')
                                                                ? JSON.parse(job.skills).slice(0, 2)
                                                                : job.skills.split(',').slice(0, 2)).map((skill, i) => (
                                                                    <span key={i} className="inline-flex items-center px-2 py-1 rounded-md bg-gray-50 text-gray-600 text-[10px] font-medium border border-gray-100">
                                                                        {skill.trim().replace(/^['"]|['"]$/g, '')}
                                                                    </span>
                                                                ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className="px-2 py-0.5 bg-emerald-50 text-[#2D9B82] rounded text-[10px] font-bold uppercase tracking-wide">95% Match</span>
                                                    <p className="text-[10px] text-gray-400">Profile match</p>
                                                </div>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                                                <KycGuard>
                                                    <button
                                                        onClick={() => handleApply(job._id || job.id)}
                                                        className="flex-1 bg-gray-800 text-white py-2 rounded-lg text-xs font-bold hover:bg-[#2D9B82] transition-colors mr-3 w-full"
                                                    >
                                                        Apply Now
                                                    </button>
                                                </KycGuard>
                                                <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-900 transition-colors">
                                                    <Bookmark size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 bg-white rounded-xl border border-gray-200 text-center">
                                        <p className="text-sm font-medium text-gray-500">No stats available yet</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">

                        {/* Profile Strength */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-gray-900">Profile Strength</h3>
                                <div className="h-8 w-8 rounded-full border-2 border-[#2D9B82] flex items-center justify-center text-[10px] font-bold text-[#2D9B82]">
                                    75%
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 mb-4 font-medium">Keep improving</p>

                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1">
                                        <span>Profile Completeness</span>
                                        <span>85%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#2D9B82] w-[85%] rounded-full"></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1">
                                        <span>Resume Quality</span>
                                        <span>70%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#2D9B82] w-[70%] rounded-full"></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1">
                                        <span>Skills Match</span>
                                        <span>45%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#2D9B82] w-[45%] rounded-full"></div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 p-3 bg-amber-50 rounded-lg border border-amber-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-amber-500">⚡</span>
                                    <span className="text-xs font-bold text-gray-900">Next Step</span>
                                </div>
                                <p className="text-[10px] text-gray-600 font-medium pl-6">Add 2 more skills to reach 80% match rate.</p>
                            </div>

                            <button className="w-full mt-4 py-2 bg-[#111827] text-white text-xs font-bold rounded-lg hover:bg-black transition-colors flex items-center justify-center gap-2">
                                Improve Profile <ChevronRight size={12} />
                            </button>
                        </div>

                        {/* Upcoming Interview */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-gray-900">Upcoming Interview</h3>
                                <button className="text-gray-400 hover:text-gray-600">
                                    <span className="sr-only">Menu</span>
                                    ...
                                </button>
                            </div>
                            <div className="p-4 border border-gray-100 rounded-xl bg-gray-50">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900">Product Designer</h4>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">TechFlow Inc.</p>
                                    </div>
                                    <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-xs font-bold text-[#2D9B82] border border-gray-200 shadow-sm">
                                        T
                                    </div>
                                </div>
                                <div className="space-y-2 mt-4">
                                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                                        <Clock size={14} className="text-[#2D9B82]" />
                                        Tomorrow, Feb 6
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                                        <span className="w-3.5 h-3.5 flex items-center justify-center text-[10px] font-bold text-gray-400">@</span>
                                        10:00 - 11:00 AM
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                                        <MapPin size={14} className="text-gray-400" />
                                        Google Meet
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <button className="py-2 bg-[#2D9B82] text-white text-xs font-bold rounded-lg hover:bg-[#25836d] shadow-sm">
                                        Join
                                    </button>
                                    <button className="py-2 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-50">
                                        Reschedule
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <RecentActivityWidget />

                    </div>
                </div>

            </main>
        </SeekerLayout>
    );
};

export default SeekerDashboard;
