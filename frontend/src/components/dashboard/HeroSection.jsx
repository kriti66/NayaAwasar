import React from 'react';
import { Link } from 'react-router-dom';

const HeroSection = ({ user, interviewCount, stats }) => {
    const isRecruiter = user?.role === 'recruiter';

    return (
        <div className={`relative ${isRecruiter ? 'bg-[#000000]' : 'rounded-[32px] overflow-hidden bg-[#0A0B0D]'} text-white min-h-[440px] flex flex-col justify-center py-12 transition-all duration-500`}>
            {/* Background Content */}
            <div className="absolute inset-0 z-0">
                {isRecruiter ? (
                    <div className="absolute inset-0 bg-[#000000]"></div>
                ) : (
                    <>
                        <img
                            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1600"
                            alt="Background"
                            className="w-full h-full object-cover opacity-40"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0B0D] via-[#0A0B0D]/80 to-transparent"></div>
                    </>
                )}
            </div>

            <div className={`relative z-10 w-full ${isRecruiter ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' : 'px-8 md:px-16'}`}>
                <div className="max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 mb-6 transition-all hover:bg-white/20">
                        <span className="text-xs font-bold uppercase tracking-wider">
                            {isRecruiter ? '📈 Grow your team today' : '🚀 Boost your career today'}
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold mb-2">
                        Welcome back, <span className="text-white">{user?.fullName?.split(' ')[0] || 'Partner'}</span>
                    </h1>
                    <h2 className="text-3xl md:text-4xl font-bold text-[#4ADE80] mb-6">
                        {isRecruiter ? 'Talent is waiting!' : "You're in demand!"}
                    </h2>

                    <p className="text-lg text-gray-300 mb-10 max-w-lg leading-relaxed">
                        {isRecruiter ? (
                            <>You have <span className="text-white font-bold">{stats?.activeJobs || 0} active role{stats?.activeJobs !== 1 ? 's' : ''}</span> currently attracting top talent.</>
                        ) : (
                            <>You have <span className="text-white font-bold">{interviewCount} interview invitation{interviewCount !== 1 ? 's' : ''}</span> waiting. Update your availability to secure your spot.</>
                        )}
                    </p>

                    {isRecruiter ? (
                        <div className="flex flex-wrap gap-4 mb-10">
                            <Link to="/recruiter/post-job" className="bg-[#2D9B82] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#25836d] transition-all transform active:scale-95 shadow-lg shadow-[#2D9B82]/20 flex items-center gap-2">
                                Broadcast Job Post
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </Link>
                            <Link to="/recruiter/jobs" className="bg-white/10 backdrop-blur-md border border-white/10 text-white px-8 py-4 rounded-xl font-bold hover:bg-white/20 transition-all transform active:scale-95">
                                Manage Listings
                            </Link>
                        </div>
                    ) : (
                        <>
                            {/* Search Bar */}
                            <div className="bg-white p-2 rounded-2xl flex flex-col md:flex-row gap-2 shadow-2xl shadow-black/50 mb-6">
                                <div className="flex-1 flex items-center px-4 border-b md:border-b-0 md:border-r border-gray-100">
                                    <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Product Designer"
                                        className="w-full py-3 text-gray-900 focus:outline-none text-sm font-medium placeholder:text-gray-300"
                                    />
                                </div>
                                <div className="flex-1 flex items-center px-4">
                                    <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="San Francisco, CA"
                                        className="w-full py-3 text-gray-900 focus:outline-none text-sm font-medium placeholder:text-gray-300"
                                    />
                                </div>
                                <button className="bg-[#2D9B82] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#25836d] transition-all transform active:scale-95 shadow-lg shadow-[#2D9B82]/20">
                                    Search
                                </button>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm">
                                <span className="text-gray-400 font-medium">Recent:</span>
                                {['Remote', 'UX Research', 'Senior Designer'].map(tag => (
                                    <button key={tag} className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs font-medium">
                                        {tag}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-10">
                                <Link to="/seeker/interviews" className="inline-flex items-center gap-2 group text-sm font-bold text-white hover:text-[#4ADE80] transition-colors">
                                    Respond to Interview
                                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HeroSection;
