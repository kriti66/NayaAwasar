import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useJobSaver from '../../hooks/useJobSaver';
import UpcomingInterviewWidget from '../../components/dashboard/UpcomingInterviewWidget';
import RecommendJobWidget from '../../components/dashboard/RecommendedJobsWidget';
import RecentActivityWidget from '../../components/dashboard/RecentActivityWidget';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import ActionRequiredBanner from '../../components/dashboard/ActionRequiredBanner';
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
    UserCheck
} from 'lucide-react';

const SeekerDashboard = () => {
    const { user } = useAuth();
    const { savedJobIds, setSavedJobIds } = useJobSaver();
    const [stats, setStats] = useState({ applied: 0, saved: 0, interviews: 0 });
    const [appliedJobIds, setAppliedJobIds] = useState([]);
    const [upcomingInterviews, setUpcomingInterviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsRes, profileRes, appsRes, interviewsRes] = await Promise.all([
                    api.get('/dashboard/seeker/stats').catch(() => ({ data: { applied: 0, saved: 0, interviews: 0 } })),
                    api.get('/users/profile').catch(() => ({ data: { savedJobs: [] } })),
                    api.get('/applications/my').catch(() => ({ data: [] })),
                    api.get('/applications/my-interviews').catch(() => ({ data: [] }))
                ]);

                setStats(statsRes.data);
                if (profileRes.data && profileRes.data.savedJobs) {
                    setSavedJobIds(profileRes.data.savedJobs);
                }
                setAppliedJobIds(appsRes.data.map(app => {
                    if (!app.job_id) return null;
                    return typeof app.job_id === 'object' ? app.job_id._id : app.job_id;
                }).filter(id => id));
                setUpcomingInterviews(interviewsRes.data);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [setSavedJobIds]);

    useEffect(() => {
        setStats(prev => ({ ...prev, saved: savedJobIds?.length ?? 0 }));
    }, [savedJobIds]);

    return (
        <>
            {/* Dark Hero Section */}
            <div className="bg-[#111827] text-white pt-12 pb-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="bg-gray-700 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider text-gray-300 flex items-center gap-2">
                                <TrendingUp size={12} className="text-[#29a08e]" />
                                Boost your career today
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-2">
                            Welcome back, {user?.fullName?.split(' ')[0] || user?.name || 'Seeker'}
                        </h1>
                        <p className="text-[#29a08e] text-xl font-medium mb-6">
                            You're in demand!
                        </p>
                        <p className="text-gray-400 mb-8 max-w-2xl">
                            You have <span className="text-white font-semibold">{stats.interviews} interview invitation{stats.interviews !== 1 ? 's' : ''}</span> waiting. Update your availability to secure your spot.
                        </p>

                        <div className="bg-white rounded-lg p-2 max-w-4xl flex flex-col md:flex-row gap-2 shadow-lg text-gray-900">
                            <div className="flex-1 flex items-center px-4 border-b md:border-b-0 md:border-r border-gray-200">
                                <Search className="h-5 w-5 text-gray-400 mr-3 shrink-0" />
                                <input
                                    type="text"
                                    placeholder="Product Designer"
                                    className="w-full py-3 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400 text-sm font-medium"
                                />
                            </div>
                            <div className="flex-1 flex items-center px-4">
                                <MapPin className="h-5 w-5 text-gray-400 mr-3 shrink-0" />
                                <input
                                    type="text"
                                    placeholder="San Francisco, CA"
                                    className="w-full py-3 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400 text-sm font-medium"
                                />
                            </div>
                            <button className="bg-[#29a08e] text-white px-8 py-3 rounded-md font-bold text-sm hover:bg-[#228377] transition-colors shrink-0">
                                Search
                            </button>
                        </div>

                        <div className="mt-6 flex gap-3 text-xs text-gray-400 font-medium items-center flex-wrap">
                            <span>Recent:</span>
                            <span className="bg-gray-800 px-2 py-1 rounded text-gray-300 hover:text-white cursor-pointer">Remote</span>
                            <span className="bg-gray-800 px-2 py-1 rounded text-gray-300 hover:text-white cursor-pointer">UX Research</span>
                            <span className="bg-gray-800 px-2 py-1 rounded text-gray-300 hover:text-white cursor-pointer">Senior Designer</span>
                        </div>
                    </div>
                    <div className="hidden lg:block w-64 h-48 rounded-xl bg-gray-800/50 border border-gray-700 flex items-center justify-center shrink-0">
                        <div className="text-gray-500 text-center text-sm">Career illustration</div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full -mt-16 pb-12">
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

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-orange-50 rounded-lg text-orange-500">
                                <TrendingUp size={20} />
                            </div>
                            <span className="text-[#29a08e] text-xs font-bold">+20%</span>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Discovery Score</p>
                            <h3 className="text-2xl font-bold text-gray-900">20%</h3>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-[#29a08e]/10 rounded-lg text-[#29a08e]">
                                <FileText size={20} />
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Active Applications</p>
                            <div className="flex items-end gap-2">
                                <h3 className="text-2xl font-bold text-gray-900">{stats.applied}</h3>
                                <p className="text-[10px] items-center flex gap-1 text-emerald-600 font-bold mb-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {stats.interviews} Interview Pending
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-500">
                                <Eye size={20} />
                            </div>
                            <span className="text-[#29a08e] text-xs font-bold">+12%</span>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Profile Views</p>
                            <div className="flex items-end gap-2">
                                <h3 className="text-2xl font-bold text-gray-900">24</h3>
                                <p className="text-[10px] text-gray-400 font-bold mb-1.5">last 30 days</p>
                            </div>
                        </div>
                    </div>
                </div>

                {upcomingInterviews.length > 0 && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-[#29a08e] rounded-full text-white shrink-0">
                                <AlertCircle size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-0.5">Action Required</h3>
                                <p className="text-sm text-gray-600">
                                    <span className="font-bold">{upcomingInterviews[0].job_id?.company_name || 'A company'}</span> has scheduled an interview for the <span className="font-bold text-gray-800">{upcomingInterviews[0].job_id?.title || 'Job Role'}</span> position.
                                </p>
                            </div>
                        </div>
                        <Link
                            to="/seeker/interviews?focused=true"
                            className="px-6 py-2.5 bg-[#29a08e] text-white text-sm font-bold rounded-lg hover:bg-[#228377] transition-colors shrink-0"
                        >
                            View Details →
                        </Link>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Application Pipeline */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-900">Application Pipeline</h3>
                                <Link to="/seeker/applications" className="text-xs font-bold text-[#29a08e] hover:underline flex items-center gap-1">
                                    View all <ChevronRight size={14} />
                                </Link>
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
                                    <div className="w-8 h-8 rounded-lg bg-[#29a08e]/10 text-[#29a08e] flex items-center justify-center mb-3">
                                        <FileText size={16} />
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-900">0</h4>
                                    <p className="text-xs font-bold text-gray-500">Shortlisted</p>
                                    <p className="text-[10px] text-gray-400 mt-1">Action required</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-500 flex items-center justify-center mb-3">
                                        <UserCheck size={16} />
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-900">{stats.interviews}</h4>
                                    <p className="text-xs font-bold text-gray-500">Interview</p>
                                    <p className="text-[10px] text-gray-400 mt-1">Keep going!</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#29a08e] flex items-center justify-center mb-3">
                                        <CheckCircle size={16} />
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-900">0</h4>
                                    <p className="text-xs font-bold text-gray-500">Offer</p>
                                    <p className="text-[10px] text-gray-400 mt-1">Apply now!</p>
                                </div>
                            </div>
                        </div>

                        <RecommendJobWidget />
                    </div>

                    <div className="space-y-6">
                        {/* Profile Strength */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex justify-center mb-4">
                                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                    <UserCheck className="w-8 h-8 text-gray-400" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-bold text-gray-900">Profile Strength</h3>
                                <span className="h-8 px-2 rounded-lg border-2 border-[#29a08e] flex items-center text-xs font-bold text-[#29a08e]">65%</span>
                            </div>
                            <p className="text-xs text-gray-400 mb-4 font-medium flex items-center gap-1">
                                <TrendingUp size={12} className="text-[#29a08e]" /> Keep improving
                            </p>

                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1">
                                        <span>Profile Completeness</span>
                                        <span>95%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-gray-700 rounded-full" style={{ width: '95%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1">
                                        <span>Skills</span>
                                        <span>75%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-gray-700 rounded-full" style={{ width: '75%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1">
                                        <span>Work Experience</span>
                                        <span>45%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-gray-700 rounded-full" style={{ width: '45%' }}></div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 p-3 bg-amber-50 rounded-lg border border-amber-100 shadow-sm">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-red-500 font-bold">!</span>
                                    <span className="text-xs font-bold text-gray-900">Next Step</span>
                                </div>
                                <p className="text-[10px] text-gray-600 font-medium pl-5">Add 2 more skills to reach 90% match rate.</p>
                            </div>

                            <Link
                                to="/seeker/profile"
                                className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-[#111827] text-white text-xs font-bold rounded-lg hover:bg-gray-900 transition-colors"
                            >
                                Improve Profile <ChevronRight size={12} />
                            </Link>
                        </div>

                        <UpcomingInterviewWidget interviews={upcomingInterviews} />

                        <RecentActivityWidget />
                    </div>
                </div>
            </main>
        </>
    );
};

export default SeekerDashboard;
