import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Mail, Phone, MapPin, Briefcase, GraduationCap, ChevronLeft, Download, User, Sparkles, Clock, Globe } from 'lucide-react';
import DashboardNavbar from '../../components/dashboard/DashboardNavbar';
import GlobalFooter from '../../components/GlobalFooter';

const SeekerProfilePreview = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // We'll use the profile service to get any user's profile
                const res = await api.get(`/profile/user/${id}`);
                setProfile(res.data);
            } catch (error) {
                console.error("Error fetching profile preview:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            <DashboardNavbar />
            <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#29a08e]"></div>
            </div>
        </div>
    );

    if (!profile) return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            <DashboardNavbar />
            <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mb-6">
                    <User className="w-10 h-10 text-rose-500" />
                </div>
                <h1 className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-tight">Profile Not Found</h1>
                <p className="text-gray-500 font-medium mb-12 max-w-sm">The candidate profile you are looking for could not be retrieved or may have been deactivated.</p>
                <button
                    onClick={() => navigate(-1)}
                    className="px-12 py-5 bg-gray-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all active:scale-95"
                >
                    Return to Workflow
                </button>
            </main>
            <GlobalFooter />
        </div>
    );

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-[#29a08e]/10 selection:text-[#29a08e] flex flex-col transition-all duration-700">
            <DashboardNavbar />

            <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <button
                        onClick={() => navigate(-1)}
                        className="mb-10 flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-all group"
                    >
                        <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Back to Candidates</span>
                    </button>

                    <div className="bg-white rounded-[3.5rem] shadow-[0_32px_128px_-32px_rgba(0,0,0,0.08)] overflow-hidden border border-gray-100 group">
                        {/* Elegant Header Area */}
                        <div className="h-64 bg-[#0A0B0D] p-12 relative flex items-end">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1b1e] to-black"></div>
                            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#29a08e]/10 rounded-full blur-[100px] -mr-48 -mt-48"></div>

                            <div className="flex flex-col md:flex-row items-center md:items-end gap-10 relative z-10 w-full">
                                <div className="w-40 h-40 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center text-[#29a08e] text-6xl font-black uppercase border-8 border-white transform md:translate-y-24 transition-transform duration-700 group-hover:scale-105">
                                    {profile.fullName?.charAt(0)}
                                </div>
                                <div className="mb-4 text-center md:text-left flex-1">
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4">
                                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">{profile.fullName}</h1>
                                        {profile.kycStatus === 'approved' && (
                                            <span className="px-4 py-1.5 bg-[#29a08e] text-white rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-[#29a08e]/20">
                                                <Sparkles className="w-3.5 h-3.5" /> Verified Talent
                                            </span>
                                        )}
                                        {profile.kycStatus === 'pending' && (
                                            <span className="px-4 py-1.5 bg-yellow-100 text-yellow-800 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border border-yellow-200">
                                                <Clock className="w-3.5 h-3.5" /> KYC Pending
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[#29a08e] font-black uppercase tracking-[0.4em] text-[11px] opacity-90">{profile.professionalHeadline || 'Elite Candidate Protocol'}</p>
                                </div>
                                <button className="mb-4 px-8 py-4 bg-white/10 text-white rounded-[1.2rem] text-[9px] font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-2 backdrop-blur-md border border-white/10 group/btn">
                                    <Download className="w-4 h-4 group-hover/btn:translate-y-0.5 transition-transform" /> Export Dossier
                                </button>
                            </div>
                        </div>

                        <div className="md:pt-32 pb-16 px-8 md:px-12 grid grid-cols-1 lg:grid-cols-3 gap-16">
                            {/* Metadata Sidebar */}
                            <div className="space-y-12">
                                <section>
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-8 border-b border-gray-50 pb-4">Connectivity Hub</h3>
                                    <div className="space-y-6">
                                        <ContactInfoItem icon={<Mail />} label="Email Node" value={profile.user_id?.email || 'Confidential'} color="text-[#29a08e]" />
                                        <ContactInfoItem icon={<Phone />} label="Communication" value={profile.phoneNumber || 'Node Inactive'} color="text-[#29a08e]" />
                                        <ContactInfoItem icon={<MapPin />} label="Deployment Base" value={profile.address || 'Remote Protocol'} color="text-[#29a08e]" />
                                        <ContactInfoItem icon={<Globe />} label="Social Identity" value={profile.website || 'NayaAwasar/Protocol'} color="text-[#29a08e]" />
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-8 border-b border-gray-50 pb-4">Skill Architecture</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {profile.skills ? profile.skills.split(',').map((skill, i) => (
                                            <span key={i} className="px-5 py-2.5 bg-gray-50 border border-gray-100 text-[10px] font-black text-gray-500 rounded-[1rem] uppercase tracking-widest hover:border-[#29a08e] hover:text-[#29a08e] hover:bg-white transition-all cursor-default shadow-sm">
                                                {skill.trim()}
                                            </span>
                                        )) : <span className="text-[10px] font-black text-gray-300 uppercase italic tracking-widest">Metadata Empty</span>}
                                    </div>
                                </section>

                                {/* System Score Placeholder */}
                                <section className="p-8 bg-[#29a08e]/5 rounded-[2.5rem] border border-[#29a08e]/10 relative overflow-hidden">
                                    <div className="absolute -bottom-4 -right-4 text-[#29a08e]/5"><Sparkles className="w-24 h-24" /></div>
                                    <h3 className="text-[10px] font-black text-[#29a08e] uppercase tracking-widest mb-4">Discovery Index</h3>
                                    <div className="flex items-end gap-2 mb-2">
                                        <span className="text-4xl font-black text-gray-900 tracking-tighter">9.4</span>
                                        <span className="text-sm font-black text-gray-400 mb-1">/10</span>
                                    </div>
                                    <p className="text-[11px] font-bold text-gray-500 leading-relaxed uppercase">Top 5% candidate match for infrastructure roles</p>
                                </section>
                            </div>

                            {/* Narrative Content Area */}
                            <div className="lg:col-span-2 space-y-16">
                                <section>
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-8 flex items-center gap-3">
                                        <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-[#29a08e]"><User className="w-4 h-4" /></div>
                                        Professional Narrative
                                    </h3>
                                    <p className="text-gray-600 leading-[1.8] font-medium text-lg italic border-l-4 border-emerald-50 pl-10 py-2">
                                        {profile.bio ? `"${profile.bio}"` : 'Candidate preferred a direct narrative via technical experience. Check the professional blueprint below for mission history.'}
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-12 flex items-center gap-3">
                                        <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-[#29a08e]"><Briefcase className="w-4 h-4" /></div>
                                        Professional Blueprint
                                    </h3>
                                    <div className="space-y-12 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-gray-100">
                                        {profile.workExperience?.length > 0 ? profile.workExperience.map((exp, i) => (
                                            <div key={i} className="relative pl-12 group/exp">
                                                <div className="absolute left-0 top-1.5 w-8 h-8 bg-white border-2 border-gray-100 rounded-full group-hover/exp:border-[#29a08e] transition-all z-10 transition-transform flex items-center justify-center shadow-sm">
                                                    <div className="w-2.5 h-2.5 bg-gray-100 group-hover/exp:bg-[#29a08e] rounded-full transition-colors"></div>
                                                </div>
                                                <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                                                    <div>
                                                        <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight group-hover/exp:text-[#29a08e] transition-colors">{exp.jobTitle}</h4>
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">{exp.companyName}</p>
                                                    </div>
                                                    <span className="text-[10px] font-black text-[#29a08e] bg-emerald-50 px-4 py-1.5 rounded-full uppercase tracking-widest whitespace-nowrap border border-emerald-100/50">
                                                        {exp.startDate} — {exp.endDate || 'Present'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-2xl">{exp.description}</p>
                                            </div>
                                        )) : <p className="text-[11px] font-black text-gray-300 uppercase tracking-widest pl-12">No mission history logged in database.</p>}
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-12 flex items-center gap-3">
                                        <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-[#29a08e]"><GraduationCap className="w-4 h-4" /></div>
                                        Academic Foundation
                                    </h3>
                                    <div className="space-y-12 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-gray-100">
                                        {profile.education?.length > 0 ? profile.education.map((edu, i) => (
                                            <div key={i} className="relative pl-12 group/edu">
                                                <div className="absolute left-0 top-1.5 w-8 h-8 bg-white border-2 border-gray-100 rounded-full group-hover/edu:border-[#29a08e] transition-all z-10 transition-transform flex items-center justify-center shadow-sm">
                                                    <div className="w-2.5 h-2.5 bg-gray-100 group-hover/edu:bg-[#29a08e] rounded-full transition-colors"></div>
                                                </div>
                                                <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                                                    <div>
                                                        <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight group-hover/edu:text-[#29a08e] transition-colors">{edu.degree}</h4>
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">{edu.school} • {edu.fieldOfStudy}</p>
                                                    </div>
                                                    <span className="text-[10px] font-black text-[#29a08e] bg-emerald-50 px-4 py-1.5 rounded-full uppercase tracking-widest whitespace-nowrap border border-emerald-100/50">
                                                        Graduation Phase {edu.endYear || edu.graduationYear}
                                                    </span>
                                                </div>
                                            </div>
                                        )) : <p className="text-[11px] font-black text-gray-300 uppercase tracking-widest pl-12">No academic credentials on file.</p>}
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>

                    <div className="mt-20 text-center space-y-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.6em]">Official Naya Awasar Ecosystem Document</p>
                        <div className="flex items-center justify-center gap-3 text-gray-300">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Snapshot Authenticated: {new Date().toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </main>
            <GlobalFooter />
        </div>
    );
};

// Internal Helper
const ContactInfoItem = ({ icon, label, value, color }) => (
    <div className="flex items-center gap-5 group/contact">
        <div className={`w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover/contact:bg-white group-hover/contact:shadow-xl transition-all border border-gray-100 group-hover/contact:border-[#29a08e]/20`}>
            {React.cloneElement(icon, { className: 'w-5 h-5 group-hover/contact:scale-110 transition-all' })}
        </div>
        <div className="min-w-0 flex-1">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none mb-1.5 group-hover/contact:text-gray-900 transition-colors">{label}</p>
            <p className={`text-xs font-black truncate ${color} opacity-80 group-hover/contact:opacity-100 transition-opacity`}>{value}</p>
        </div>
    </div>
);

export default SeekerProfilePreview;
