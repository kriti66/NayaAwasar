import React from 'react';
import { Link } from 'react-router-dom';

const StatsOverview = ({ stats, role }) => {
    const isRecruiter = role === 'recruiter';

    if (isRecruiter) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Active Applications Card */}
                <Link to="/recruiter/applications" className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:border-[#29a08e]/20 transition-all group">
                    <div className="flex items-center justify-between mb-8">
                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-[#29a08e]/5 transition-colors">
                            <svg className="w-6 h-6 text-gray-400 group-hover:text-[#29a08e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-gray-400">Active Applications</p>
                        <div className="flex items-baseline gap-1">
                            <h3 className="text-4xl font-bold text-gray-900">{stats?.totalApplications || 0}</h3>
                        </div>
                    </div>
                    <p className="mt-8 text-xs font-semibold text-gray-400">Inbound Talent</p>
                </Link>

                {/* Total Jobs Hosted Card */}
                <Link to="/recruiter/jobs" className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:border-[#29a08e]/20 transition-all group">
                    <div className="flex items-center justify-between mb-8">
                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-[#29a08e]/5 transition-colors">
                            <svg className="w-6 h-6 text-gray-400 group-hover:text-[#29a08e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <div className="px-2 py-1 rounded-lg bg-[#29a08e]/10 text-[#29a08e] flex items-center gap-1">
                            <span className="text-[10px] font-bold uppercase">Total</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-gray-400">Total Jobs Hosted</p>
                        <div className="flex items-baseline gap-1">
                            <h3 className="text-4xl font-bold text-gray-900">{stats?.totalJobs || 0}</h3>
                        </div>
                    </div>
                    <p className="mt-8 text-xs font-semibold text-gray-400">Lifetime Posting Stats</p>
                </Link>

                {/* Active Opportunities Card */}
                <Link to="/recruiter/jobs" className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:border-[#29a08e]/20 transition-all group">
                    <div className="flex items-center justify-between mb-8">
                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-[#29a08e]/5 transition-colors">
                            <svg className="w-6 h-6 text-gray-400 group-hover:text-[#29a08e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 flex items-center gap-1">
                            <span className="text-[10px] font-bold uppercase">Live</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-gray-400">Active Opportunities</p>
                        <div className="flex items-baseline gap-1">
                            <h3 className="text-4xl font-bold text-gray-900">{stats?.activeJobs || 0}</h3>
                        </div>
                    </div>
                    <p className="mt-8 text-xs font-semibold text-gray-400">Currently Accepting</p>
                </Link>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Discovery Score Card */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-8">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-400">Discovery Score</p>
                    <div className="flex items-baseline gap-1">
                        <h3 className="text-4xl font-bold text-gray-900">{stats?.discoveryScore || 0}%</h3>
                    </div>
                </div>
                <div className="mt-6 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-[#29a08e] rounded-full transition-all duration-1000"
                        style={{ width: `${stats?.discoveryScore || 0}%` }}
                    ></div>
                </div>
                <p className="mt-4 text-xs font-semibold text-gray-400">Top 20% of candidates</p>
            </div>

            {/* Active Applications Card */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-8">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-400">Active Applications</p>
                    <div className="flex items-baseline gap-1">
                        <h3 className="text-4xl font-bold text-gray-900">{stats?.activeApplications || 0}</h3>
                    </div>
                </div>
                <div className="mt-8 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#29a08e]"></div>
                    <p className="text-xs font-semibold text-gray-400">
                        {stats?.interviews || 0} Interview{stats?.interviews !== 1 ? 's' : ''} Pending
                    </p>
                </div>
            </div>

            {/* Profile Views Card */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-8">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    </div>
                    <div className="px-2 py-1 rounded-lg bg-green-50 text-green-600 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                        <span className="text-[10px] font-bold">+12%</span>
                    </div>
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-400">Profile Views</p>
                    <div className="flex items-baseline gap-1">
                        <h3 className="text-4xl font-bold text-gray-900">{stats?.profileViews || 0}</h3>
                    </div>
                </div>
                <p className="mt-8 text-xs font-semibold text-gray-400">Last 30 days</p>
            </div>
        </div>
    );
};

export default StatsOverview;
