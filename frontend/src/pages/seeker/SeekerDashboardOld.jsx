import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import KycBanner from '../../components/KycBanner';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import { resolveAssetUrl } from '../../utils/assetUrl';

const SeekerDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        applied: 0,
        saved: 0,
        recommended: 0,
        interviews: 0,
        profileMetrics: null
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await api.get('/dashboard/seeker/stats');
                setStats({
                    applied: res.data.applied ?? 0,
                    saved: res.data.saved ?? 0,
                    recommended: 0,
                    interviews: res.data.interviews ?? 0,
                    profileMetrics: res.data.profileMetrics ?? null
                });
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const discoveryScore =
        typeof stats.profileMetrics?.profileCompletionPercent === 'number'
            ? stats.profileMetrics.profileCompletionPercent
            : typeof user?.profileCompletion === 'number'
              ? user.profileCompletion
              : 0;

    // Get current time comparison (mock for display)
    const getTimeStamp = (minutes = 15) => `${minutes} mins ago`;

    return (
        <div className="flex min-h-screen bg-[#FDFEFE] font-sans selection:bg-blue-100 selection:text-blue-900">
            <Sidebar />

            <div className="flex-1 flex flex-col">
                {/* Global Topbar */}
                <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-30">
                    <div className="flex items-center gap-1.5 backdrop-blur-sm">
                        <span className="text-xs font-bold text-slate-400">Portal /</span>
                        <span className="text-xs font-bold text-slate-900">Dashboard</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <button className="relative text-slate-400 hover:text-slate-600 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                        <div className="w-px h-6 bg-slate-200"></div>
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-[11px] font-bold text-slate-900 leading-tight">{user?.fullName}</p>
                                <p className="text-[10px] font-medium text-blue-500">Tier 1 Talent</p>
                            </div>
                            <div className="w-9 h-9 rounded-full border-2 border-white shadow-sm overflow-hidden bg-slate-100 ring-1 ring-slate-100 pointer-events-none">
                                {user?.profileImage ? (
                                    <img src={resolveAssetUrl(user.profileImage)} className="w-full h-full object-cover" alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center font-bold text-slate-400 text-xs">UN</div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-8 lg:p-12 max-w-7xl mx-auto w-full">
                    <KycBanner />

                    {/* Hero Section with Primary CTA */}
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-12 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="max-w-2xl">
                            <h1 className="text-4xl lg:text-5xl font-extrabold text-[#0F172A] tracking-tight leading-tight mb-4">
                                Welcome back, <span className="text-blue-600">{user?.fullName?.split(' ')[0] || 'Member'}</span>.
                            </h1>
                            <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-xl">
                                Your career journey is gaining momentum. You have <span className="text-slate-900 font-bold underline decoration-blue-200">{stats.interviews} pending interview</span> invitation waiting for your response.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-4">
                                <Link to="/seeker/search" className="px-8 py-4 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-xl shadow-blue-500/25 hover:bg-blue-700 hover:-translate-y-0.5 transition-all flex items-center gap-2.5 active:scale-[0.98]">
                                    Browse Career Matches
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                </Link>
                                <Link to="/seeker/profile" className="px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all">
                                    Refine My Profile
                                </Link>
                            </div>
                        </div>

                        {/* Profile Completion - Compact & Distinct */}
                        <div className="w-full lg:w-80 shrink-0">
                            <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <svg className="w-16 h-16 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>
                                </div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Discovery Score</h3>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-4xl font-black text-slate-900 tracking-tighter">{discoveryScore}%</span>
                                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                </div>
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-6">
                                    <div className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out" style={{ width: `${discoveryScore}%` }}></div>
                                </div>
                                <p className="text-[11px] font-semibold text-slate-500 leading-normal">
                                    High score profiles are 5x more likely to be contacted by <span className="text-slate-900 font-bold">Premium Recruiters</span>.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Broken Symmetry Stats Layout */}
                    <div className="mb-20">
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Activity Pipeline</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">

                            {/* Feature Card: Large */}
                            <div className="md:col-span-2 md:row-span-2 bg-[#0F172A] text-white p-10 rounded-2xl relative overflow-hidden group shrink-0">
                                <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                                <div className="relative z-10 h-full flex flex-col justify-between">
                                    <div>
                                        <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 rounded-md text-[10px] font-bold uppercase tracking-widest mb-6">Active Status</span>
                                        <h3 className="text-3xl font-bold mb-4 tracking-tight">Active In-Review<br />Applications</h3>
                                        <p className="text-slate-400 text-sm font-medium mb-10 max-w-xs leading-relaxed">Companies like Microsoft and Leapfrog are currently evaluating your portfolio details.</p>
                                    </div>
                                    <div className="flex items-end justify-between transition-transform group-hover:translate-x-2">
                                        <div className="text-6xl font-black tracking-tighter">{stats.applied}</div>
                                        <Link to="/seeker/applications" className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all">
                                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Standard Cards */}
                            <Link to="/seeker/interviews" className="bg-white border border-slate-100 p-8 rounded-2xl transition-all hover:border-blue-100 hover:shadow-xl hover:shadow-slate-200/40 group/card">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="text-3xl font-bold text-slate-900 tracking-tighter group-hover/card:text-blue-600 transition-colors">{stats.interviews}</div>
                                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold uppercase tracking-widest">Live</div>
                                </div>
                                <h4 className="text-sm font-semibold text-slate-500 mb-1">Interview Invites</h4>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                    <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
                                    Update: {getTimeStamp(4)}
                                </span>
                            </Link>

                            <div className="bg-white border border-slate-100 p-8 rounded-2xl transition-all hover:border-blue-100 hover:shadow-xl hover:shadow-slate-200/40">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="text-3xl font-bold text-slate-900 tracking-tighter">{stats.saved}</div>
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 font-bold">🏷️</div>
                                </div>
                                <h4 className="text-sm font-semibold text-slate-500 mb-1">Bookmarked Listings</h4>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                    Update: Yesterday
                                </span>
                            </div>

                            <div className="bg-white border border-slate-100 p-8 rounded-2xl transition-all hover:border-blue-100 hover:shadow-xl hover:shadow-slate-200/40 lg:col-start-3">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="text-3xl font-bold text-slate-900 tracking-tighter">{stats.recommended}</div>
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 font-bold">✨</div>
                                </div>
                                <h4 className="text-sm font-semibold text-slate-500 mb-1">Algorithmic Matches</h4>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                    <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                                    Update: {getTimeStamp(22)}
                                </span>
                            </div>

                            <div className="bg-slate-50/50 border border-dashed border-slate-200 p-8 rounded-2xl flex flex-col justify-center items-center text-center group cursor-pointer hover:bg-white hover:border-blue-200 transition-all">
                                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 mb-3 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                </div>
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-700 transition-colors">Configure Widgets</span>
                            </div>

                        </div>
                    </div>

                    {/* Intelligent Search Prompt */}
                    <div className="bg-white border-2 border-slate-50 p-10 lg:p-12 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-10">
                        <div className="flex-1">
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Refine your Naya search.</h3>
                            <p className="text-slate-500 font-medium">Use our advanced filters to target companies with high-growth cultures.</p>
                        </div>
                        <Link to="/seeker/search" className="shrink-0 px-8 py-4 bg-[#0F172A] text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-600 transition-all active:scale-[0.98]">
                            Start Smart Search
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </Link>
                    </div>

                </main>

                <footer className="h-20 bg-white border-t border-slate-100 flex items-center justify-between px-12 mt-auto">
                    <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">
                        Naya Awasar © {new Date().getFullYear()} — Career Propulsion Protocol
                    </p>
                    <div className="flex gap-6">
                        <span className="text-[10px] font-bold text-slate-400 hover:text-slate-900 cursor-pointer transition-colors uppercase tracking-[0.1em]">Security</span>
                        <span className="text-[10px] font-bold text-slate-400 hover:text-slate-900 cursor-pointer transition-colors uppercase tracking-[0.1em]">Legal</span>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default SeekerDashboard;
