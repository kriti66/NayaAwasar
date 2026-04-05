import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import FeaturedJobs from '../../components/jobs/FeaturedJobs';
import api from '../../services/api';

const TestimonialAvatar = ({ photo, name }) => {
    const [imgError, setImgError] = useState(false);
    const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';
    const showPlaceholder = !photo?.trim() || imgError;
    if (showPlaceholder) {
        return (
            <div
                className="w-11 h-11 rounded-full object-cover border-2 border-[#29a08e]/20 bg-gradient-to-br from-[#29a08e] to-[#228377] text-white text-sm font-bold flex items-center justify-center shrink-0"
                aria-hidden
            >
                {initial}
            </div>
        );
    }
    return (
        <img
            className="w-11 h-11 rounded-full object-cover border-2 border-[#29a08e]/20 shrink-0"
            src={photo}
            alt={name || 'Reviewer'}
            onError={() => setImgError(true)}
        />
    );
};

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

const Home = () => {
    const [activeTab, setActiveTab] = useState('seeker');
    const [testimonials, setTestimonials] = useState([]);
    const [testimonialsLoading, setTestimonialsLoading] = useState(true);

    const categories = [
        { icon: '💻', label: 'Technology', count: '2.4K+' },
        { icon: '🎨', label: 'Design', count: '1.2K+' },
        { icon: '📊', label: 'Marketing', count: '890+' },
        { icon: '💰', label: 'Finance', count: '750+' },
        { icon: '🏥', label: 'Healthcare', count: '630+' },
        { icon: '📚', label: 'Education', count: '520+' },
    ];

    const howItWorksSeeker = [
        { step: '01', title: 'Create Profile', desc: 'Build your professional profile in minutes and showcase your skills.', icon: '👤' },
        { step: '02', title: 'Browse Jobs', desc: 'Explore thousands of curated job listings matched to your skills.', icon: '🔍' },
        { step: '03', title: 'Apply & Connect', desc: 'Apply with one click and connect directly with employers.', icon: '✅' },
    ];

    const howItWorksRecruiter = [
        { step: '01', title: 'Post a Job', desc: 'Create detailed job listings and reach thousands of candidates.', icon: '📋' },
        { step: '02', title: 'Review Applicants', desc: 'Browse smart-matched candidates filtered by your requirements.', icon: '👥' },
        { step: '03', title: 'Hire Top Talent', desc: 'Interview shortlisted candidates and make your next great hire.', icon: '🏆' },
    ];

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setTestimonialsLoading(true);
                const res = await api.get('/testimonials');
                const list = Array.isArray(res.data) ? res.data : [];
                if (!cancelled) setTestimonials(list);
            } catch {
                if (!cancelled) setTestimonials([]);
            } finally {
                if (!cancelled) setTestimonialsLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const partners = [
        { name: 'Microsoft', logo: 'MS' },
        { name: 'Google', logo: 'G' },
        { name: 'Deloitte', logo: 'D' },
        { name: 'Accenture', logo: 'A' },
        { name: 'Infosys', logo: 'I' },
        { name: 'Amazon', logo: 'Am' },
    ];

    return (
        <>
            {/* ─── Hero Section ─────────────────────────────── */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#0d2f2b] to-slate-900 min-h-screen flex items-center">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-[#29a08e] rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-400 rounded-full blur-3xl"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#29a08e] rounded-full blur-[120px] opacity-10"></div>
                </div>

                {/* Grid dots */}
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        {/* Left Content */}
                        <div className="text-white space-y-8 animate-fade-in-up">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-sm font-medium text-gray-200 backdrop-blur-sm">
                                <span className="w-2 h-2 bg-[#29a08e] rounded-full animate-pulse"></span>
                                Nepal's #1 Job Portal — 10,000+ Active Listings
                            </div>

                            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight tracking-tight">
                                Find Your
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#29a08e] via-teal-300 to-[#29a08e]">
                                    Dream Career
                                </span>
                                in Nepal
                            </h1>

                            <p className="text-lg text-gray-300 max-w-xl leading-relaxed">
                                Discover thousands of opportunities or hire the perfect talent. Naya Awasar bridges ambition with opportunity — faster, smarter, and more securely.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 pt-2">
                                <Link
                                    to="/register?role=jobseeker"
                                    className="group px-8 py-4 bg-[#29a08e] text-white rounded-2xl font-bold text-base hover:bg-[#228377] transition-all duration-200 shadow-lg shadow-[#29a08e]/30 hover:shadow-[#29a08e]/50 text-center flex items-center justify-center gap-2"
                                >
                                    Find Jobs Now
                                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </Link>
                                <Link
                                    to="/register?role=recruiter"
                                    className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-2xl font-bold text-base hover:bg-white/20 transition-all duration-200 text-center"
                                >
                                    Post a Job
                                </Link>
                            </div>

                            <div className="flex items-center gap-6 pt-4 border-t border-white/10">
                                <div className="flex -space-x-3">
                                    {['?auto=format&fit=facearea&facepad=2&w=40&h=40&q=80&person=1', '?auto=format&fit=facearea&facepad=2&w=40&h=40&q=80&person=2', '?auto=format&fit=facearea&facepad=2&w=40&h=40&q=80&person=3'].map((_, i) => (
                                        <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-[#29a08e] to-teal-700 border-2 border-slate-900 flex items-center justify-center text-white text-xs font-bold">
                                            {['SR', 'RT', 'PS'][i]}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-gray-300 text-sm">
                                    <span className="text-white font-bold">12,000+</span> professionals hired this month
                                </p>
                            </div>
                        </div>

                        {/* Right — Floating Cards */}
                        <div className="hidden lg:block relative">
                            <div className="relative w-full h-[520px]">
                                {/* Main card */}
                                <div className="absolute top-8 left-0 right-0 mx-auto bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-white font-bold">Top Matches For You</span>
                                        <span className="text-[#29a08e] text-xs font-bold bg-[#29a08e]/20 px-2 py-1 rounded-full">AI Powered</span>
                                    </div>
                                    {[
                                        { title: 'Senior React Developer', co: 'TechNepal', salary: 'NPR 80K-120K', match: '96%' },
                                        { title: 'UX Designer', co: 'DesignHub', salary: 'NPR 60K-90K', match: '91%' },
                                        { title: 'Product Manager', co: 'StartupKTM', salary: 'NPR 100K-150K', match: '87%' },
                                    ].map((job, i) => (
                                        <div key={i} className="flex items-center gap-3 py-3 border-b border-white/10 last:border-0">
                                            <div className="w-10 h-10 bg-[#29a08e]/20 rounded-lg flex items-center justify-center text-[#29a08e] font-bold text-sm shrink-0">
                                                {job.co[0]}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white text-sm font-semibold truncate">{job.title}</p>
                                                <p className="text-gray-400 text-xs">{job.co} • {job.salary}</p>
                                            </div>
                                            <span className="text-[#29a08e] text-xs font-bold bg-[#29a08e]/15 px-2 py-1 rounded-full shrink-0">{job.match}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Floating stat cards */}
                                <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl p-4 shadow-2xl animate-bounce" style={{ animationDuration: '3s' }}>
                                    <p className="text-2xl font-black text-gray-900">10K+</p>
                                    <p className="text-xs text-gray-500 font-medium">Jobs Posted</p>
                                </div>
                                <div className="absolute -top-4 -right-4 bg-[#29a08e] rounded-2xl p-4 shadow-2xl animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }}>
                                    <p className="text-2xl font-black text-white">98%</p>
                                    <p className="text-xs text-[#29a08e]/80 font-medium text-white/80">Satisfaction</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Wave divider */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 60L1440 60L1440 30C1440 30 1080 0 720 0C360 0 0 30 0 30L0 60Z" fill="#f8fafc" />
                    </svg>
                </div>
            </div>

            {/* ─── Stats Bar ─────────────────────────────── */}
            <div className="bg-white border-b border-gray-100 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
                        {[
                            { value: 10000, suffix: '+', label: 'Jobs Posted', icon: '💼' },
                            { value: 50000, suffix: '+', label: 'Active Seekers', icon: '👥' },
                            { value: 500, suffix: '+', label: 'Companies', icon: '🏢' },
                            { value: 95, suffix: '%', label: 'Success Rate', icon: '⭐' },
                        ].map((stat, i) => (
                            <div key={i} className="text-center group">
                                <div className="text-3xl mb-1">{stat.icon}</div>
                                <p className="text-3xl font-black text-gray-900 mb-1">
                                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                                </p>
                                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ─── Featured Promotions ─────────────────────────────── */}
            <FeaturedJobs />

            {/* ─── Job Categories ─────────────────────────────── */}
            <div className="py-20 bg-[#f8fafc]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-14">
                        <p className="text-[#29a08e] font-semibold text-sm uppercase tracking-widest mb-3">Explore by Category</p>
                        <h2 className="text-4xl font-black text-gray-900 tracking-tight">Browse Top <span className="text-[#29a08e]">Job Categories</span></h2>
                        <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">Explore roles across Nepal's fastest-growing industries.</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        {categories.map((cat, i) => (
                            <Link
                                key={i}
                                to="/jobs"
                                className="group bg-white rounded-2xl p-5 text-center border border-gray-100 shadow-sm hover:shadow-lg hover:border-[#29a08e]/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                            >
                                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">{cat.icon}</div>
                                <h3 className="text-sm font-bold text-gray-900 mb-1 group-hover:text-[#29a08e] transition-colors">{cat.label}</h3>
                                <p className="text-xs text-gray-400 font-medium">{cat.count} jobs</p>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* ─── How It Works ─────────────────────────────── */}
            <div className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <p className="text-[#29a08e] font-semibold text-sm uppercase tracking-widest mb-3">Simple & Fast</p>
                        <h2 className="text-4xl font-black text-gray-900 tracking-tight">How <span className="text-[#29a08e]">It Works</span></h2>
                        <p className="mt-4 text-lg text-gray-500">Get started in minutes, not days.</p>
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex justify-center mb-12">
                        <div className="inline-flex bg-gray-100 rounded-xl p-1">
                            <button
                                onClick={() => setActiveTab('seeker')}
                                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'seeker' ? 'bg-[#29a08e] text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                For Job Seekers
                            </button>
                            <button
                                onClick={() => setActiveTab('recruiter')}
                                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'recruiter' ? 'bg-[#29a08e] text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                For Recruiters
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                        <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-transparent via-[#29a08e]/30 to-transparent"></div>
                        {(activeTab === 'seeker' ? howItWorksSeeker : howItWorksRecruiter).map((item, i) => (
                            <div key={`${activeTab}-${i}`} className="relative text-center animate-fade-in">
                                <div className="relative inline-flex">
                                    <div className="w-20 h-20 bg-[#29a08e]/10 text-4xl rounded-2xl flex items-center justify-center mx-auto mb-6 border border-[#29a08e]/20">
                                        {item.icon}
                                    </div>
                                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#29a08e] text-white rounded-full text-xs font-black flex items-center justify-center shadow-md">
                                        {i + 1}
                                    </div>
                                </div>
                                <h3 className="text-xl font-black text-gray-900 mb-2">{item.title}</h3>
                                <p className="text-gray-500 leading-relaxed text-sm">{item.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-12">
                        <Link
                            to={activeTab === 'seeker' ? '/register?role=jobseeker' : '/register?role=recruiter'}
                            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#29a08e] text-white rounded-xl font-bold hover:bg-[#228377] transition-all shadow-lg shadow-[#29a08e]/20"
                        >
                            Get Started Free
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>

            {/* ─── Why Choose Us ─────────────────────────────── */}
            <div className="py-20 bg-[#f8fafc]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <p className="text-[#29a08e] font-semibold text-sm uppercase tracking-widest mb-3">Why Naya Awasar</p>
                        <h2 className="text-4xl font-black text-gray-900 tracking-tight">Built for <span className="text-[#29a08e]">Nepal's Job Market</span></h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                icon: '🤖',
                                title: 'AI-Powered Matching',
                                desc: 'Our algorithm matches you with the most relevant opportunities based on skills and preferences.',
                                color: 'from-violet-50 to-violet-100/50',
                                border: 'border-violet-100',
                            },
                            {
                                icon: '🔒',
                                title: 'Verified Employers',
                                desc: 'Every recruiter goes through our KYC verification process for a safe and trusted experience.',
                                color: 'from-[#29a08e]/5 to-[#29a08e]/10',
                                border: 'border-[#29a08e]/15',
                            },
                            {
                                icon: '⚡',
                                title: 'Instant Applications',
                                desc: 'Apply to jobs with a single click using your pre-built profile. No more repetitive forms.',
                                color: 'from-amber-50 to-amber-100/50',
                                border: 'border-amber-100',
                            },
                            {
                                icon: '📱',
                                title: 'Real-Time Tracking',
                                desc: 'Track your application status, schedule interviews, and get notifications in real-time.',
                                color: 'from-blue-50 to-blue-100/50',
                                border: 'border-blue-100',
                            },
                        ].map((item, i) => (
                            <div key={i} className={`bg-gradient-to-br ${item.color} p-6 rounded-2xl border ${item.border} hover:shadow-lg transition-all duration-300 hover:-translate-y-1 card-hover`}>
                                <div className="text-4xl mb-4">{item.icon}</div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ─── Testimonials ─────────────────────────────── */}
            <div className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <p className="text-[#29a08e] font-semibold text-sm uppercase tracking-widest mb-3">Success Stories</p>
                        <h2 className="text-4xl font-black text-gray-900 tracking-tight">What Our <span className="text-[#29a08e]">Users Say</span></h2>
                    </div>
                    {testimonialsLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div
                                className="w-12 h-12 border-[3px] border-[#29a08e]/25 border-t-[#29a08e] rounded-full animate-spin"
                                aria-hidden
                            />
                            <p className="text-sm font-medium text-gray-500">Loading testimonials…</p>
                        </div>
                    ) : testimonials.length === 0 ? (
                        <p className="text-center text-gray-500 text-sm font-medium py-12">
                            Success stories will appear here soon.
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {testimonials.map((t) => {
                                const id = t._id || t.id;
                                const rating = Math.min(5, Math.max(1, Number(t.rating) || 5));
                                return (
                                    <div
                                        key={id || `${t.name}-${t.review?.slice(0, 20)}`}
                                        className="bg-[#f8fafc] p-8 rounded-2xl border border-gray-100 hover:shadow-lg hover:border-[#29a08e]/20 transition-all duration-300 hover:-translate-y-1 flex flex-col"
                                    >
                                        <div className="flex gap-1 mb-4" aria-label={`${rating} out of 5 stars`}>
                                            {Array.from({ length: rating }).map((_, j) => (
                                                <span key={j} className="text-amber-400 text-lg">
                                                    ★
                                                </span>
                                            ))}
                                            {Array.from({ length: 5 - rating }).map((_, j) => (
                                                <span key={`e-${j}`} className="text-gray-200 text-lg">
                                                    ★
                                                </span>
                                            ))}
                                        </div>
                                        <p className="text-gray-700 leading-relaxed flex-1 mb-6 italic text-justify">
                                            &ldquo;{t.review}&rdquo;
                                        </p>
                                        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                                            <TestimonialAvatar photo={t.photo} name={t.name} />
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                                                <p className="text-[#29a08e] text-xs font-medium">{t.role || '—'}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Trusted Companies ─────────────────────────────── */}
            <div className="py-14 bg-[#f8fafc] border-y border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-sm font-semibold text-gray-400 uppercase tracking-widest mb-10">Trusted by top companies in Nepal</p>
                    <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-12">
                        {partners.map((p, i) => (
                            <div key={i} className="flex items-center gap-2 opacity-40 hover:opacity-70 transition-opacity cursor-default">
                                <div className="w-9 h-9 bg-gray-800 text-white rounded-lg flex items-center justify-center text-sm font-black">{p.logo}</div>
                                <span className="text-gray-700 font-bold text-sm">{p.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ─── CTA Section ─────────────────────────────── */}
            <div className="relative py-24 overflow-hidden bg-gradient-to-br from-slate-900 via-[#0d2f2b] to-slate-900">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-[#29a08e] rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-72 h-72 bg-teal-400 rounded-full blur-3xl"></div>
                </div>
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

                <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#29a08e]/20 border border-[#29a08e]/30 rounded-full text-sm font-medium text-[#29a08e] mb-8">
                        🚀 Your Career Journey Starts Today
                    </div>
                    <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 leading-tight">
                        Ready to Take the
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#29a08e] to-teal-300">
                            Next Big Step?
                        </span>
                    </h2>
                    <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto">
                        Join thousands of professionals finding success on Naya Awasar. It's free to get started.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/register"
                            className="px-10 py-4 bg-[#29a08e] text-white rounded-2xl font-bold text-lg hover:bg-[#228377] transition-all shadow-2xl shadow-[#29a08e]/30 hover:shadow-[#29a08e]/50"
                        >
                            Create Free Account
                        </Link>
                        <Link
                            to="/jobs"
                            className="px-10 py-4 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all"
                        >
                            Browse Jobs →
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Home;
