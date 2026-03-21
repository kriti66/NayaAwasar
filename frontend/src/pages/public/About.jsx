import { Link } from 'react-router-dom';

const About = () => {
    const values = [
        { icon: '🤝', title: 'Integrity', desc: 'We operate with full transparency, honesty, and accountability in every interaction.', color: 'bg-blue-50 border-blue-100' },
        { icon: '💡', title: 'Innovation', desc: 'We leverage cutting-edge technology to simplify and modernize recruitment.', color: 'bg-amber-50 border-amber-100' },
        { icon: '🏆', title: 'Excellence', desc: 'We strive to deliver the best outcomes for job seekers and employers alike.', color: 'bg-violet-50 border-violet-100' },
        { icon: '🌏', title: 'Inclusivity', desc: 'We believe everyone deserves an equal chance to succeed, regardless of background.', color: 'bg-[#29a08e]/5 border-[#29a08e]/15' },
    ];

    const team = [
        { name: 'Aisha Khan', role: 'CEO & Co-Founder', bio: 'Former talent lead at Fortune 500 companies. Passionate about democratizing career opportunities.', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&h=256&q=80', linkedin: '#' },
        { name: 'Rohan Sharma', role: 'CTO & Co-Founder', bio: 'Full-stack engineer with 10+ years in building scalable platforms. AI/ML enthusiast.', img: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=256&h=256&q=80', linkedin: '#' },
        { name: 'Priya Singh', role: 'Head of Product', bio: 'UX-first product leader who shipped products used by millions across South Asia.', img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', linkedin: '#' },
    ];

    const milestones = [
        { year: '2022', title: 'Founded in Kathmandu', desc: 'Naya Awasar was born with a mission to fix Nepal\'s broken hiring process.' },
        { year: '2023', title: '10,000 Users', desc: 'Crossed 10K registered users within 6 months of launch.' },
        { year: '2023', title: 'AI Matching Launch', desc: 'Launched our AI-powered job matching algorithm.' },
        { year: '2024', title: '500+ Companies', desc: 'Onboarded 500 verified companies across Nepal.' },
    ];

    return (
        <div className="bg-white">
            {/* Hero */}
            <div className="relative bg-gradient-to-br from-slate-900 via-[#0d2f2b] to-slate-900 py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-20 w-80 h-80 bg-[#29a08e] rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 right-20 w-64 h-64 bg-teal-400 rounded-full blur-3xl"></div>
                </div>
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '28px 28px' }}></div>
                <div className="relative max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#29a08e]/20 border border-[#29a08e]/30 rounded-full text-sm font-medium text-[#29a08e] mb-6">
                        🇳🇵 Built for Nepal
                    </div>
                    <h1 className="text-5xl sm:text-6xl font-black text-white leading-tight mb-6 tracking-tight">
                        About <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#29a08e] to-teal-300">Naya Awasar</span>
                    </h1>
                    <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
                        We're on a mission to democratize career opportunities across Nepal — connecting ambition with the right opportunities.
                    </p>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="bg-[#f8fafc] border-b border-gray-100 py-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
                        {[
                            { value: '10K+', label: 'Jobs Posted', icon: '💼' },
                            { value: '50K+', label: 'Active Users', icon: '👥' },
                            { value: '500+', label: 'Verified Companies', icon: '🏢' },
                            { value: '95%', label: 'Satisfaction Rate', icon: '⭐' },
                        ].map((s, i) => (
                            <div key={i}>
                                <div className="text-2xl mb-1">{s.icon}</div>
                                <p className="text-3xl font-black text-gray-900">{s.value}</p>
                                <p className="text-sm text-gray-500 font-medium mt-1">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Mission & Vision */}
            <div className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-gradient-to-br from-[#29a08e]/5 to-[#29a08e]/10 border border-[#29a08e]/20 rounded-2xl p-8 hover:shadow-lg transition-all">
                            <div className="w-12 h-12 bg-[#29a08e] text-white rounded-xl flex items-center justify-center text-2xl mb-6">
                                🎯
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 mb-4">Our Mission</h2>
                            <p className="text-gray-600 leading-relaxed">
                                To create a transparent, efficient, and inclusive job market where every professional in Nepal can discover their ideal career path — and every company can find the right talent to grow.
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200 rounded-2xl p-8 hover:shadow-lg transition-all">
                            <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center text-2xl mb-6">
                                🔭
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 mb-4">Our Vision</h2>
                            <p className="text-gray-600 leading-relaxed">
                                To become Nepal's most trusted and loved recruitment platform, recognized for ethical practices, innovation, and helping millions build successful, fulfilling careers.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Core Values */}
            <div className="py-20 bg-[#f8fafc]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-14">
                        <p className="text-[#29a08e] font-semibold text-sm uppercase tracking-widest mb-3">What Drives Us</p>
                        <h2 className="text-4xl font-black text-gray-900">Our Core <span className="text-[#29a08e]">Values</span></h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {values.map((v, i) => (
                            <div key={i} className={`${v.color} border rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}>
                                <div className="text-4xl mb-4">{v.icon}</div>
                                <h3 className="text-lg font-black text-gray-900 mb-2">{v.title}</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">{v.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className="py-20 bg-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-14">
                        <p className="text-[#29a08e] font-semibold text-sm uppercase tracking-widest mb-3">Our Journey</p>
                        <h2 className="text-4xl font-black text-gray-900">Key <span className="text-[#29a08e]">Milestones</span></h2>
                    </div>
                    <div className="relative">
                        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#29a08e] via-[#29a08e]/30 to-transparent"></div>
                        <div className="space-y-8">
                            {milestones.map((m, i) => (
                                <div key={i} className="flex gap-6 group">
                                    <div className="relative flex-shrink-0">
                                        <div className="w-16 h-16 bg-[#29a08e] text-white rounded-xl flex items-center justify-center z-10 relative font-black text-sm shadow-lg shadow-[#29a08e]/20">
                                            {m.year}
                                        </div>
                                    </div>
                                    <div className="flex-1 bg-[#f8fafc] rounded-2xl p-5 border border-gray-100 group-hover:shadow-md group-hover:border-[#29a08e]/20 transition-all">
                                        <h3 className="font-bold text-gray-900 mb-1">{m.title}</h3>
                                        <p className="text-gray-500 text-sm">{m.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Team */}
            <div className="py-20 bg-[#f8fafc]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-14">
                        <p className="text-[#29a08e] font-semibold text-sm uppercase tracking-widest mb-3">The People</p>
                        <h2 className="text-4xl font-black text-gray-900">Meet Our <span className="text-[#29a08e]">Team</span></h2>
                        <p className="mt-4 text-gray-500 max-w-xl mx-auto">Passionate individuals driven by creating meaningful career opportunities for every Nepali professional.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        {team.map((m, i) => (
                            <div key={i} className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                                <div className="relative inline-block mb-5">
                                    <img
                                        className="w-24 h-24 rounded-2xl mx-auto object-cover border-4 border-[#29a08e]/10 group-hover:border-[#29a08e]/30 transition-colors"
                                        src={m.img}
                                        alt={m.name}
                                    />
                                    <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-[#29a08e] rounded-lg flex items-center justify-center shadow-md">
                                        <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                        </svg>
                                    </div>
                                </div>
                                <h3 className="text-lg font-black text-gray-900 mb-1">{m.name}</h3>
                                <p className="text-sm text-[#29a08e] font-semibold mb-3">{m.role}</p>
                                <p className="text-gray-500 text-sm leading-relaxed">{m.bio}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA */}
            <div className="relative py-24 overflow-hidden bg-gradient-to-br from-slate-900 via-[#0d2f2b] to-slate-900">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-[#29a08e] rounded-full blur-3xl"></div>
                </div>
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
                <div className="relative max-w-3xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                    <h2 className="text-4xl font-black text-white mb-6">
                        Ready to Work <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#29a08e] to-teal-300">with Us?</span>
                    </h2>
                    <p className="text-gray-300 mb-10 text-lg">Join thousands of professionals and companies building Nepal's future workforce.</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/contact" className="px-8 py-4 bg-white text-[#29a08e] rounded-2xl font-bold hover:bg-gray-100 transition-all shadow-xl">
                            Contact Us
                        </Link>
                        <Link to="/register" className="px-8 py-4 bg-[#29a08e] text-white rounded-2xl font-bold hover:bg-[#228377] transition-all shadow-xl shadow-[#29a08e]/30">
                            Join Now →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;
