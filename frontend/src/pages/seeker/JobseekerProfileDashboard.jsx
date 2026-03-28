import React, { useState, useEffect } from 'react';
import {
    User, MapPin, Briefcase, GraduationCap, FileText,
    Github, ExternalLink, Plus, Edit2, Trash2,
    CheckCircle, AlertCircle, Upload, Eye, EyeOff, Loader, X, File, Download, RefreshCw,
    Shield, Clock, Zap, TrendingUp, ChevronRight
} from 'lucide-react';

import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import profileService from '../../services/profileService';
import projectService from '../../services/projectService';
import activityService from '../../services/activityService';
import { resolveAssetUrl } from '../../utils/assetUrl';
import { getCvTemplateLabel } from '../../constants/cvTemplates';
import CvTemplatePickerModal from '../../components/profile/CvTemplatePickerModal';

const JobseekerProfileDashboard = () => {

    const { user: authUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [projects, setProjects] = useState([]);
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [modal, setModal] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [cvTemplateModalOpen, setCvTemplateModalOpen] = useState(false);
    const [avatarFailed, setAvatarFailed] = useState(false);

    // Fetch Data
    const fetchData = async () => {
        try {
            const [profileResult, projectsResult, activityResult] = await Promise.allSettled([
                profileService.getMyProfile(),
                projectService.getMyProjects(),
                activityService.getMyActivity(10)
            ]);

            if (profileResult.status === 'fulfilled') {
                setProfile(profileResult.value);
            } else {
                console.error("Profile fetch failed:", profileResult.reason);
                setFetchError(profileResult.reason?.response?.data?.message || profileResult.reason?.message || "Unknown API Error");
            }

            if (projectsResult.status === 'fulfilled') {
                setProjects(projectsResult.value);
            } else {
                setProjects([]);
            }

            if (activityResult.status === 'fulfilled') {
                setActivity(activityResult.value);
            } else {
                setActivity([]);
            }
        } catch (error) {
            console.error(error);
            setFetchError(error.message);
            toast.error("Failed to load profile data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        setAvatarFailed(false);
    }, [profile?.user?.profileImage]);

    // --- HANDLERS ---
    const toggleVisibility = async () => {
        const newVal = !profile.visibleToRecruiters;
        setProfile(prev => ({ ...prev, visibleToRecruiters: newVal }));
        try {
            await profileService.updateVisibility(newVal);
            toast.success(`Profile is now ${newVal ? 'Visible' : 'Hidden'}`);
        } catch (err) {
            setProfile(prev => ({ ...prev, visibleToRecruiters: !newVal }));
            toast.error("Failed to update visibility");
        }
    };

    const refreshProfile = async () => {
        const p = await profileService.getMyProfile();
        setProfile(p);
    };

    const handleResumeUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('resume', file);
        const toastId = toast.loading("Uploading resume...");
        try {
            const res = await profileService.uploadResume(formData);
            setProfile(prev => ({ ...prev, resume: res }));
            toast.success("Resume uploaded!", { id: toastId });
            refreshProfile();
        } catch (err) {
            toast.error("Upload failed", { id: toastId });
        }
    };

    const handleDeleteResume = async () => {
        if (!window.confirm("Delete resume?")) return;
        try {
            await profileService.deleteResume();
            setProfile(prev => ({ ...prev, resume: null }));
            toast.success("Resume deleted");
            refreshProfile();
        } catch (err) {
            toast.error("Failed to delete");
        }
    };

    const runGenerateCV = async (templateId, { closeModal = false } = {}) => {
        if (isGenerating) return;
        setIsGenerating(true);
        const toastId = toast.loading('Building your CV PDF...');
        try {
            const res = await profileService.generateCV(templateId);
            if (res.success && res.resume) {
                setProfile((prev) => ({ ...prev, resume: res.resume }));
                toast.success('CV updated with your latest profile data!', { id: toastId });
                if (closeModal) setCvTemplateModalOpen(false);
                await refreshProfile();
            } else {
                toast.error('Unexpected response from server', { id: toastId });
            }
        } catch (err) {
            console.error(err);
            const payload = err?.response?.data;
            const backendMessage = payload?.error || payload?.message || err?.message || 'Failed to generate CV';
            const details = payload?.details;
            const detailsShort =
                typeof details === 'string'
                    ? details.slice(0, 240)
                    : details
                        ? JSON.stringify(details).slice(0, 240)
                        : '';
            toast.error(detailsShort ? `${backendMessage}: ${detailsShort}` : backendMessage, { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDeleteExperience = async (id) => {
        if (!window.confirm("Remove this experience?")) return;
        try {
            await profileService.deleteExperience(id);
            toast.success("Removed");
            refreshProfile();
        } catch (e) { toast.error("Error removing experience"); }
    };

    const handleDeleteEducation = async (id) => {
        if (!window.confirm("Remove this education?")) return;
        try {
            await profileService.deleteEducation(id);
            toast.success("Removed");
            refreshProfile();
        } catch (e) { toast.error("Error removing education"); }
    };

    const handleDeleteProject = async (id) => {
        if (!window.confirm("Remove this project?")) return;
        try {
            await projectService.deleteProject(id);
            setProjects(prev => prev.filter(p => p._id !== id));
            toast.success("Removed");
            refreshProfile();
        } catch (e) { toast.error("Error removing project"); }
    };

    if (loading) return (
        <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50 gap-4">
            <div className="w-12 h-12 border-4 border-[#29a08e]/30 border-t-[#29a08e] rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-gray-400">Loading your profile...</p>
        </div>
    );

    if (!profile) return (
        <div className="p-8 text-center flex flex-col items-center justify-center min-h-[50vh] bg-gray-50 m-8 rounded-2xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-4 border border-rose-100">
                <AlertCircle size={32} className="text-rose-400" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2 tracking-tight">Failed to load profile</h2>
            <p className="text-gray-500 font-medium mb-6 max-w-md">{fetchError || "An unexpected error occurred while loading your profile data."}</p>
            <button onClick={fetchData} className="px-6 py-3 bg-[#29a08e] text-white rounded-xl hover:bg-[#228377] font-bold transition-all shadow-lg shadow-[#29a08e]/20 active:scale-95">
                Try Again
            </button>
        </div>
    );

    // Profile strength calculations
    const strengthPercent = profile.strengthScore || 0;
    const strengthColor = strengthPercent >= 80 ? '#29a08e' : strengthPercent >= 50 ? '#F59E0B' : '#EF4444';

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-800">
            {/* ─── Hero Banner ─────────────────────────────── */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#0d2f2b] to-slate-900 pt-10 pb-32 px-4 sm:px-6 lg:px-8">
                {/* Background effects */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-[#29a08e] rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-400 rounded-full blur-3xl"></div>
                </div>
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

                <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row gap-8 items-start justify-between">
                    {/* LEFT: Avatar + Info */}
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6 w-full md:w-3/5">
                        {/* Avatar */}
                        <div className="shrink-0 w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br from-[#29a08e] to-teal-700 p-1 flex items-center justify-center shadow-xl shadow-[#29a08e]/20 relative group border-2 border-white/20">
                            <div className="w-full h-full rounded-xl overflow-hidden bg-white flex items-center justify-center relative">
                                {profile.user?.profileImage && !avatarFailed ? (
                                    <img
                                        src={resolveAssetUrl(profile.user.profileImage)}
                                        alt={profile.user?.fullName}
                                        className="w-full h-full object-cover"
                                        onError={() => setAvatarFailed(true)}
                                    />
                                ) : (
                                    <span className="text-[#29a08e] text-3xl font-black">{profile.user?.fullName?.[0] || 'U'}</span>
                                )}
                                <div onClick={() => setModal({ type: 'basic', data: { headline: profile.headline, location: profile.location, summary: profile.summary, profileImage: profile.user?.profileImage } })} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded-xl">
                                    <Edit2 size={20} className="text-white" />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <h1 className="text-3xl md:text-4xl font-black text-white truncate tracking-tight mb-1">
                                {profile.user?.fullName || 'User'}
                            </h1>

                            {profile.headline ? (
                                <p className="text-gray-300 font-medium text-base leading-snug mb-3">
                                    {profile.headline}
                                </p>
                            ) : (
                                <button
                                    onClick={() => setModal({ type: 'basic', data: { headline: profile.headline, location: profile.location, summary: profile.summary, profileImage: profile.user?.profileImage } })}
                                    className="text-[#29a08e] text-sm font-bold hover:text-teal-300 py-1 flex items-center gap-1 mb-2 transition-colors"
                                >
                                    <Plus size={14} /> Add professional headline
                                </button>
                            )}

                            {/* Meta Row */}
                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 font-medium">
                                <div className="flex items-center gap-1.5">
                                    <MapPin size={14} className="text-[#29a08e]" />
                                    <span>{profile.location || 'Add location'}</span>
                                </div>
                                {profile.jobPreferences?.seniority && (
                                    <>
                                        <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                                        <div className="flex items-center gap-1.5">
                                            <Briefcase size={14} className="text-[#29a08e]" />
                                            <span>{profile.jobPreferences.seniority} Level</span>
                                        </div>
                                    </>
                                )}
                                <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-[#29a08e]/20 text-[#29a08e] border border-[#29a08e]/30">
                                    Open to work
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Actions */}
                    <div className="w-full md:w-auto flex flex-col items-start md:items-end gap-3 mt-2 md:mt-0">
                        <button
                            onClick={toggleVisibility}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border transition-all ${profile.visibleToRecruiters
                                ? 'bg-[#29a08e]/20 text-[#29a08e] border-[#29a08e]/30 hover:bg-[#29a08e]/30'
                                : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                                }`}
                        >
                            {profile.visibleToRecruiters ? <Eye size={14} /> : <EyeOff size={14} />}
                            {profile.visibleToRecruiters ? 'Visible to Recruiters' : 'Hidden from Recruiters'}
                        </button>

                        <button
                            onClick={() => setModal({ type: 'basic', data: { headline: profile.headline, location: profile.location, summary: profile.summary, profileImage: profile.user?.profileImage } })}
                            className="w-full md:w-auto px-5 py-2.5 bg-white text-gray-900 border border-transparent hover:bg-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                            <Edit2 size={14} /> Edit Profile
                        </button>
                    </div>
                </div>
            </div>

            {/* ─── Main Content ─────────────────────────────── */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-20 relative z-20 grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ─── LEFT COLUMN (Content) ─── */}
                <div className="lg:col-span-2 space-y-5">

                    {/* About */}
                    <Section title="About" icon={<User size={18} />} onEdit={() => setModal({ type: 'basic', data: { headline: profile.headline, location: profile.location, summary: profile.summary, profileImage: profile.user?.profileImage } })}>
                        {profile.summary ? (
                            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-[15px]">{profile.summary}</p>
                        ) : (
                            <EmptyState text="Add a professional summary to tell recruiters your story." />
                        )}
                    </Section>

                    {/* Skills */}
                    <Section title="Skills" icon={<Zap size={18} />} onEdit={() => setModal({ type: 'skills', data: profile.skills })}>
                        {profile.skills?.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {profile.skills.map((skill, i) => (
                                    <span key={i} className="px-3.5 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-sm font-bold border border-gray-200 hover:border-[#29a08e]/30 hover:bg-[#29a08e]/5 hover:text-[#29a08e] transition-colors cursor-default">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <EmptyState text="No skills listed yet." />
                        )}
                    </Section>

                    {/* Work Experience */}
                    <Section title="Work Experience" icon={<Briefcase size={18} />} onAdd={() => setModal({ type: 'experience', data: null })}>
                        <div className="space-y-1">
                            {profile.experience?.map((exp, i) => (
                                <div key={exp._id || i} className="group relative flex gap-4 p-4 rounded-xl hover:bg-gray-50 -mx-4 transition-colors">
                                    {/* Timeline indicator */}
                                    <div className="flex flex-col items-center pt-1.5">
                                        <div className="w-3 h-3 rounded-full bg-[#29a08e] border-2 border-white shadow-sm ring-2 ring-[#29a08e]/20"></div>
                                        {i < (profile.experience?.length || 0) - 1 && <div className="w-px flex-1 bg-gray-200 mt-2"></div>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-[15px]">{exp.role}</h3>
                                                <h4 className="text-[#29a08e] font-semibold text-sm">{exp.company}</h4>
                                                <p className="text-[11px] text-gray-400 mt-1 uppercase tracking-wider font-bold">
                                                    {new Date(exp.startDate).getFullYear()} — {exp.current ? 'Present' : new Date(exp.endDate).getFullYear()}
                                                </p>
                                            </div>
                                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => setModal({ type: 'experience', data: exp })} className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-[#29a08e] transition-colors border border-transparent hover:border-gray-200"><Edit2 size={14} /></button>
                                                <button onClick={() => handleDeleteExperience(exp._id)} className="p-2 hover:bg-rose-50 rounded-lg text-gray-400 hover:text-rose-500 transition-colors border border-transparent hover:border-rose-100"><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                        {exp.description && <p className="text-gray-500 text-sm mt-2 leading-relaxed">{exp.description}</p>}
                                    </div>
                                </div>
                            ))}
                            {(!profile.experience || profile.experience.length === 0) && <EmptyState text="Add your work history." />}
                        </div>
                    </Section>

                    {/* Education */}
                    <Section title="Education" icon={<GraduationCap size={18} />} onAdd={() => setModal({ type: 'education', data: null })}>
                        <div className="space-y-1">
                            {profile.education?.map((edu, i) => (
                                <div key={edu._id || i} className="group relative flex gap-4 p-4 rounded-xl hover:bg-gray-50 -mx-4 transition-colors">
                                    <div className="flex flex-col items-center pt-1.5">
                                        <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm ring-2 ring-blue-500/20"></div>
                                        {i < (profile.education?.length || 0) - 1 && <div className="w-px flex-1 bg-gray-200 mt-2"></div>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-[15px]">{edu.degree}</h3>
                                                <h4 className="text-gray-600 font-semibold text-sm">{edu.institute}</h4>
                                                <p className="text-[11px] text-gray-400 mt-1 uppercase tracking-wider font-bold">
                                                    {edu.startYear} — {edu.current ? 'Present' : edu.endYear}
                                                </p>
                                            </div>
                                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => setModal({ type: 'education', data: edu })} className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-[#29a08e] transition-colors border border-transparent hover:border-gray-200"><Edit2 size={14} /></button>
                                                <button onClick={() => handleDeleteEducation(edu._id)} className="p-2 hover:bg-rose-50 rounded-lg text-gray-400 hover:text-rose-500 transition-colors border border-transparent hover:border-rose-100"><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {(!profile.education || profile.education.length === 0) && <EmptyState text="Add your education." />}
                        </div>
                    </Section>

                    {/* Projects */}
                    <Section title="Projects & Portfolio" icon={<Github size={18} />} onAdd={() => setModal({ type: 'project', data: null })}>
                        <div className="space-y-4">
                            {projects.map((proj) => (
                                <div key={proj._id} className="group bg-gray-50 border border-gray-100 rounded-xl p-5 hover:border-[#29a08e]/20 hover:bg-[#29a08e]/5 transition-all">
                                    <div className="flex justify-between items-start">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-bold text-gray-900">{proj.title}</h3>
                                            <p className="text-gray-500 text-sm mt-1.5 leading-relaxed">{proj.description}</p>
                                        </div>
                                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity ml-4 shrink-0">
                                            <button onClick={() => setModal({ type: 'project', data: proj })} className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-[#29a08e] transition-colors border border-transparent hover:border-gray-200"><Edit2 size={14} /></button>
                                            <button onClick={() => handleDeleteProject(proj._id)} className="p-2 hover:bg-rose-50 rounded-lg text-gray-400 hover:text-rose-500 transition-colors border border-transparent hover:border-rose-100"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                    {proj.techStack?.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-3">
                                            {proj.techStack.map((tag, i) => (
                                                <span key={i} className="text-[10px] font-black px-2.5 py-1 bg-white text-gray-500 rounded-md border border-gray-200 uppercase tracking-wider">{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex gap-4 mt-4 pt-3 border-t border-gray-200/50">
                                        {proj.githubUrl && (
                                            <a href={proj.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors">
                                                <Github size={14} /> Source Code
                                            </a>
                                        )}
                                        {proj.liveDemoUrl && (
                                            <a href={proj.liveDemoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-[#29a08e] hover:text-[#228377] transition-colors">
                                                <ExternalLink size={14} /> Live Demo
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {projects.length === 0 && <EmptyState text="Showcase your best work." />}
                        </div>
                    </Section>
                </div>

                {/* ─── RIGHT COLUMN (Sidebar) ─── */}
                <div className="space-y-5">

                    {/* Profile Strength Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                                <TrendingUp size={16} className="text-[#29a08e]" />
                                Profile Strength
                            </h3>
                            <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border ${
                                profile.strengthLabel === 'WEAK' ? 'text-rose-600 bg-rose-50 border-rose-200' :
                                profile.strengthLabel === 'GOOD' ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-[#29a08e] bg-[#29a08e]/10 border-[#29a08e]/20'
                            }`}>
                                {profile.strengthLabel}
                            </span>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-gray-100 rounded-full h-2 mb-4 overflow-hidden">
                            <div
                                className="h-2 rounded-full transition-all duration-700"
                                style={{ width: `${strengthPercent}%`, backgroundColor: strengthColor }}
                            ></div>
                        </div>

                        {profile.tips && profile.tips.length > 0 ? (
                            <ul className="space-y-2.5">
                                {profile.tips.map((tip, i) => (
                                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                                        <div className="w-5 h-5 rounded-md bg-rose-50 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                                            <AlertCircle size={12} />
                                        </div>
                                        <span className="leading-snug">{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="flex items-center gap-2.5 text-[#29a08e] text-sm font-bold bg-[#29a08e]/5 px-3 py-2.5 rounded-xl border border-[#29a08e]/10">
                                <CheckCircle size={16} /> All set! Your profile is strong.
                            </div>
                        )}
                    </div>

                    {/* Resume Management Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2 text-sm">
                            <FileText size={16} className="text-[#29a08e]" />
                            Resume Management
                        </h3>

                        {(!profile.resume || !profile.resume.fileUrl) && (
                            <div className="mb-4">
                                <button
                                    type="button"
                                    onClick={() => setCvTemplateModalOpen(true)}
                                    disabled={isGenerating}
                                    className="w-full py-3 bg-gradient-to-r from-[#29a08e]/10 to-teal-50 hover:from-[#29a08e]/20 hover:to-teal-100 text-[#29a08e] border border-[#29a08e]/20 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <RefreshCw size={16} className={isGenerating ? 'animate-spin' : ''} />
                                    Auto-Generate CV from Profile
                                </button>
                                <p className="text-[10px] text-gray-400 text-center mt-2 font-medium">Choose a template in the next step</p>
                                <div className="text-center text-[10px] font-black text-gray-300 uppercase tracking-widest my-3">or upload manually</div>
                            </div>
                        )}

                        {profile.resume && profile.resume.fileUrl ? (
                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 text-center relative group">
                                <div className="w-12 h-12 bg-gradient-to-br from-[#29a08e]/10 to-teal-50 rounded-xl flex items-center justify-center mx-auto mb-3 border border-[#29a08e]/10">
                                    <FileText size={24} className={profile.resume.source === 'generated' ? 'text-[#29a08e]' : 'text-gray-400'} />
                                </div>
                                <p className="text-sm font-bold text-gray-900 truncate px-4">{profile.resume.fileName || 'Resume.pdf'}</p>

                                {profile.resume.source === 'generated' && (
                                    <span className="inline-block mt-1.5 px-2.5 py-0.5 bg-[#29a08e]/10 text-[#29a08e] text-[9px] font-black uppercase tracking-widest rounded-full border border-[#29a08e]/20">
                                        Auto Generated
                                    </span>
                                )}

                                {profile.resume.source === 'generated' && profile.resume.cvTemplate && (
                                    <p className="text-[11px] text-gray-600 mt-2 font-bold">
                                        Template: <span className="text-[#29a08e]">{getCvTemplateLabel(profile.resume.cvTemplate)}</span>
                                    </p>
                                )}

                                <p className="text-[11px] text-gray-400 mt-1 font-medium">
                                    {profile.resume.source === 'generated' ? 'Generated ' : 'Uploaded '}
                                    {new Date(profile.resume.uploadedAt || profile.resume.lastGeneratedAt).toLocaleDateString()}
                                </p>

                                <div className="grid grid-cols-2 gap-2 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => profileService.viewGeneratedCV()}
                                        className="col-span-2 flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-colors"
                                    >
                                        <Eye size={14} /> View CV
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => profileService.downloadGeneratedCV(profile.resume.fileName)}
                                        className="col-span-2 flex items-center justify-center gap-2 py-2.5 bg-[#29a08e] text-white rounded-xl text-xs font-bold hover:bg-[#228377] transition-all shadow-md shadow-[#29a08e]/20"
                                    >
                                        <Download size={14} /> Download PDF
                                    </button>

                                    {profile.resume.source === 'generated' ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => setCvTemplateModalOpen(true)}
                                                disabled={isGenerating}
                                                className="col-span-2 flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
                                            >
                                                Change template
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => runGenerateCV(profile.resume?.cvTemplate || 'professional')}
                                                disabled={isGenerating}
                                                className="flex items-center justify-center gap-2 py-2.5 bg-white border border-[#29a08e]/20 text-[#29a08e] rounded-xl text-xs font-bold hover:bg-[#29a08e]/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <RefreshCw size={14} className={isGenerating ? 'animate-spin' : ''} />
                                                {isGenerating ? 'Updating...' : 'Update'}
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => document.getElementById('resume-upload').click()}
                                            className="flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors"
                                        >
                                            Replace
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={handleDeleteResume}
                                        className="flex items-center justify-center gap-2 py-2.5 bg-white border border-rose-100 text-rose-500 rounded-xl text-xs font-bold hover:bg-rose-50 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={() => document.getElementById('resume-upload').click()}
                                className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-[#29a08e]/30 hover:bg-[#29a08e]/5 transition-all group"
                            >
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-[#29a08e]/10 transition-colors">
                                    <Upload size={20} className="text-gray-400 group-hover:text-[#29a08e] transition-colors" />
                                </div>
                                <p className="text-sm font-bold text-gray-900">Upload Custom Resume</p>
                                <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX up to 5MB</p>
                            </div>
                        )}
                        <input id="resume-upload" type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeUpload} />
                    </div>

                    {/* Job Preferences */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                                <Briefcase size={16} className="text-[#29a08e]" />
                                Job Preferences
                            </h3>
                            <button onClick={() => setModal({ type: 'preferences', data: profile.jobPreferences })} className="text-[10px] font-black px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-[#29a08e] transition-colors uppercase tracking-wider border border-gray-100">Edit</button>
                        </div>
                        <div className="space-y-4">
                            {[
                                { label: 'Roles', value: profile.jobPreferences?.jobTypes?.length > 0 ? profile.jobPreferences.jobTypes.join(', ') : 'Not specified' },
                                { label: 'Seniority', value: profile.jobPreferences?.seniority || 'Any' },
                                { label: 'Preferred Location', value: profile.jobPreferences?.preferredLocation || 'Anywhere' },
                            ].map((item, i) => (
                                <div key={i}>
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">{item.label}</p>
                                    <p className="text-sm font-bold text-gray-700">{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-sm">
                            <Clock size={16} className="text-[#29a08e]" />
                            Recent Activity
                        </h3>
                        <div className="relative border-l-2 border-gray-100 ml-2 space-y-5">
                            {activity.map((act, i) => {
                                const getTimeAgo = (date) => {
                                    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
                                    let interval = seconds / 31536000;
                                    if (interval > 1) return Math.floor(interval) + "y ago";
                                    interval = seconds / 2592000;
                                    if (interval > 1) return Math.floor(interval) + "mo ago";
                                    interval = seconds / 86400;
                                    if (interval > 1) return Math.floor(interval) + "d ago";
                                    interval = seconds / 3600;
                                    if (interval > 1) return Math.floor(interval) + "h ago";
                                    interval = seconds / 60;
                                    if (interval > 1) return Math.floor(interval) + "m ago";
                                    return "Just now";
                                };

                                let colorClass = 'bg-gray-400';
                                if (act.type === 'APPLIED_JOB') colorClass = 'bg-[#29a08e]';
                                if (act.type === 'RECRUITER_VIEW') colorClass = 'bg-blue-500';
                                if (act.type === 'MESSAGE') colorClass = 'bg-purple-500';
                                if (act.type === 'STATUS_CHANGE') colorClass = 'bg-amber-500';

                                return (
                                    <div key={act._id || i} className="pl-5 relative">
                                        <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white ${colorClass}`}></div>
                                        <p className="text-sm text-gray-700 font-medium leading-snug">{act.message}</p>
                                        <p className="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-wider">{getTimeAgo(act.createdAt)}</p>
                                    </div>
                                );
                            })}
                            {activity.length === 0 && <p className="pl-5 text-xs text-gray-400 font-medium">No recent activity found. Apply to jobs to populate this feed!</p>}
                        </div>
                    </div>

                    {/* Visibility Toggle Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                                    <Shield size={16} className="text-[#29a08e]" />
                                    Profile Visibility
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">Allow recruiters to find you in search results.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={profile.visibleToRecruiters || false} onChange={toggleVisibility} />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#29a08e]/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#29a08e]"></div>
                            </label>
                        </div>
                    </div>

                </div>
            </div>

            {/* ─── MODALS ─── */}
            <CvTemplatePickerModal
                open={cvTemplateModalOpen}
                onClose={() => {
                    if (!isGenerating) setCvTemplateModalOpen(false);
                }}
                initialTemplateId={profile?.resume?.cvTemplate || 'professional'}
                isGenerating={isGenerating}
                title={
                    profile?.resume?.fileUrl && profile?.resume?.source === 'generated'
                        ? 'Change resume template'
                        : 'Choose a resume template'
                }
                subtitle="Your profile data is unchanged—we only update the PDF layout. Pick a design, then generate."
                onConfirm={(templateId) => runGenerateCV(templateId, { closeModal: true })}
            />

            {modal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100">
                        {/* Dark gradient header */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#0d2f2b] to-slate-900 px-6 py-5 rounded-t-2xl">
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#29a08e] rounded-full blur-3xl"></div>
                            </div>
                            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                            <div className="relative z-10 flex justify-between items-center">
                                <h3 className="text-lg font-black text-white tracking-tight">
                                    {modal.type === 'basic' && 'Edit Basic Info'}
                                    {modal.type === 'experience' && (modal.data ? 'Edit Experience' : 'Add Experience')}
                                    {modal.type === 'education' && (modal.data ? 'Edit Education' : 'Add Education')}
                                    {modal.type === 'project' && (modal.data ? 'Edit Project' : 'Add Project')}
                                    {modal.type === 'skills' && 'Update Skills'}
                                    {modal.type === 'preferences' && 'Job Preferences'}
                                </h3>
                                <button onClick={() => setModal(null)} className="p-2 hover:bg-white/10 rounded-xl text-gray-300 hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <ModalForm
                                type={modal.type}
                                initialData={modal.data}
                                onClose={() => setModal(null)}
                                onSuccess={() => {
                                    setModal(null);
                                    fetchData();
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

};

// --- SUB-COMPONENTS ---

const Section = ({ title, icon, children, onEdit, onAdd }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transition-all hover:shadow-md relative overflow-hidden">
        <div className="flex justify-between items-center mb-5 w-full">
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#29a08e]/10 to-teal-50 flex items-center justify-center text-[#29a08e]">
                    {icon}
                </div>
                {title}
            </h2>
            <div className="flex gap-2 shrink-0">
                {onAdd && <button onClick={onAdd} className="w-9 h-9 flex items-center justify-center bg-gray-50 text-gray-400 hover:text-[#29a08e] hover:bg-[#29a08e]/5 rounded-xl transition-all border border-gray-100 hover:border-[#29a08e]/20"><Plus size={16} /></button>}
                {onEdit && <button onClick={onEdit} className="w-9 h-9 flex items-center justify-center bg-gray-50 text-gray-400 hover:text-[#29a08e] hover:bg-[#29a08e]/5 rounded-xl transition-all border border-gray-100 hover:border-[#29a08e]/20"><Edit2 size={14} /></button>}
            </div>
        </div>
        <div className="text-[15px]">
            {children}
        </div>
    </div>
);

const EmptyState = ({ text }) => (
    <div className="py-10 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">{text}</p>
    </div>
);

// --- FORM COMPONENT ---
const ModalForm = ({ type, initialData, onClose, onSuccess }) => {
    const { refreshUser } = useAuth();
    const [formData, setFormData] = useState(initialData || {});
    const [imageFile, setImageFile] = useState(null);
    const [previewImage, setPreviewImage] = useState(initialData?.profileImage ? resolveAssetUrl(initialData.profileImage) : null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const toastId = toast.loading("Saving...");
        try {
            if (type === 'basic') {
                if (imageFile) {
                    const imgData = new FormData();
                    imgData.append('profileImage', imageFile);
                    await profileService.uploadProfileImage(imgData);
                }
                await profileService.updateProfile(formData);
                await refreshUser();
            } else if (type === 'skills') {
                // handled separately
            } else if (type === 'experience') {
                if (initialData?._id) await profileService.updateExperience(initialData._id, formData);
                else await profileService.addExperience(formData);
            } else if (type === 'education') {
                if (initialData?._id) await profileService.updateEducation(initialData._id, formData);
                else await profileService.addEducation(formData);
            } else if (type === 'project') {
                const data = { ...formData, techStack: typeof formData.techStack === 'string' ? formData.techStack.split(',').map(s => s.trim()) : formData.techStack };
                if (initialData?._id) await projectService.updateProject(initialData._id, data);
                else await projectService.addProject(data);
            } else if (type === 'preferences') {
                const data = {
                    jobPreferences: {
                        ...formData,
                        jobTypes: typeof formData.jobTypes === 'string' ? formData.jobTypes.split(',').map(s => s.trim()) : formData.jobTypes
                    }
                };
                await profileService.updateProfile(data);
            }

            toast.success("Saved!", { id: toastId });
            onSuccess();
        } catch (err) {
            console.error(err);
            toast.error("Failed to save", { id: toastId });
        }
    };

    // Skills specific
    const [skillInput, setSkillInput] = useState(type === 'skills' ? (initialData || []).join(', ') : '');
    const handleSkillsSubmit = async (e) => {
        e.preventDefault();
        const skillsArray = skillInput.split(',').map(s => s.trim()).filter(Boolean);
        try {
            await profileService.updateSkills(skillsArray);
            toast.success("Skills updated");
            onSuccess();
        } catch (e) { toast.error("Fail"); }
    };

    if (type === 'skills') {
        return (
            <form onSubmit={handleSkillsSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Skills (comma separated)</label>
                    <textarea
                        className="w-full rounded-xl border border-gray-200 p-3 focus:ring-2 focus:ring-[#29a08e]/20 focus:border-[#29a08e] focus:outline-none transition-all bg-gray-50/50 hover:bg-white text-sm"
                        rows={4}
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        placeholder="React, Node.js, Design, Communication..."
                    />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-bold text-sm transition-colors">Cancel</button>
                    <button type="submit" className="px-6 py-2.5 bg-[#29a08e] text-white rounded-xl hover:bg-[#228377] font-bold text-sm shadow-lg shadow-[#29a08e]/20 transition-all active:scale-95">Save Skills</button>
                </div>
            </form>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">

            {type === 'basic' && (
                <>
                    <div className="flex flex-col items-center justify-center gap-3 mb-6">
                        <div className="relative group cursor-pointer w-20 h-20">
                            <div className="w-full h-full rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm bg-gray-100 group-hover:border-[#29a08e]/30 transition-colors">
                                {previewImage ? (
                                    <img
                                        src={previewImage}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                        onError={() => setPreviewImage(null)}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                                        <User size={28} />
                                    </div>
                                )}
                            </div>
                            <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 rounded-xl transition-opacity cursor-pointer">
                                <Plus size={20} />
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                            </label>
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Click to change photo</p>
                    </div>

                    <Input label="Professional Headline" name="headline" value={formData.headline} onChange={handleChange} placeholder="e.g. Senior Frontend Developer" />
                    <Input label="Location" name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Kathmandu, Nepal" />
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">About</label>
                        <textarea name="summary" value={formData.summary} onChange={handleChange} rows={5} className="w-full rounded-xl border border-gray-200 p-3 focus:ring-2 focus:ring-[#29a08e]/20 focus:border-[#29a08e] focus:outline-none transition-all bg-gray-50/50 hover:bg-white text-sm" placeholder="Tell us about yourself..." />
                    </div>
                </>
            )}

            {type === 'experience' && (
                <>
                    <Input label="Role/Title" name="role" value={formData.role} onChange={handleChange} required />
                    <Input label="Company" name="company" value={formData.company} onChange={handleChange} required />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Start Date" name="startDate" type="date" value={formData.startDate?.split('T')[0]} onChange={handleChange} />
                        <Input label="End Date" name="endDate" type="date" value={formData.endDate?.split('T')[0]} onChange={handleChange} disabled={formData.current} />
                    </div>
                    <label className="flex items-center gap-2">
                        <input type="checkbox" name="current" checked={formData.current} onChange={handleChange} className="rounded text-[#29a08e] focus:ring-[#29a08e]" />
                        <span className="text-sm text-gray-700 font-medium">I currently work here</span>
                    </label>
                    <TextArea label="Description" name="description" value={formData.description} onChange={handleChange} />
                </>
            )}

            {type === 'education' && (
                <>
                    <Input label="Degree/Qualification" name="degree" value={formData.degree} onChange={handleChange} required placeholder="Bachelors in CsIT" />
                    <Input label="Institute" name="institute" value={formData.institute} onChange={handleChange} required />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Start Year" name="startYear" value={formData.startYear} onChange={handleChange} placeholder="2018" />
                        <Input label="End Year" name="endYear" value={formData.endYear} onChange={handleChange} placeholder="2022" />
                    </div>
                </>
            )}

            {type === 'project' && (
                <>
                    <Input label="Project Title" name="title" value={formData.title} onChange={handleChange} required />
                    <TextArea label="Description" name="description" value={formData.description} onChange={handleChange} />
                    <Input label="Tech Stack (comma separated)" name="techStack" value={Array.isArray(formData.techStack) ? formData.techStack.join(', ') : formData.techStack} onChange={handleChange} placeholder="React, Mongo..." />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="GitHub URL" name="githubUrl" value={formData.githubUrl} onChange={handleChange} />
                        <Input label="Live Demo URL" name="liveDemoUrl" value={formData.liveDemoUrl} onChange={handleChange} />
                    </div>
                </>
            )}

            {type === 'preferences' && (
                <>
                    <Input label="Seniority Level" name="seniority" value={formData.seniority} onChange={handleChange} placeholder="Entry, Mid, Senior..." />
                    <Input label="Preferred Location" name="preferredLocation" value={formData.preferredLocation} onChange={handleChange} />
                    <Input label="Job Types (comma separated)" name="jobTypes" value={Array.isArray(formData.jobTypes) ? formData.jobTypes.join(', ') : formData.jobTypes} onChange={handleChange} placeholder="Full-time, Remote..." />
                </>
            )}

            <div className="flex justify-end gap-3 pt-5 border-t border-gray-100 mt-4">
                <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-bold text-sm transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-[#29a08e] text-white rounded-xl hover:bg-[#228377] font-bold text-sm shadow-lg shadow-[#29a08e]/20 transition-all active:scale-95">Save Changes</button>
            </div>
        </form>
    );
};

const Input = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
        <input className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-900 focus:ring-2 focus:ring-[#29a08e]/20 focus:border-[#29a08e] focus:outline-none transition-all bg-gray-50/50 hover:bg-white" {...props} />
    </div>
);

const TextArea = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
        <textarea className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-900 focus:ring-2 focus:ring-[#29a08e]/20 focus:border-[#29a08e] focus:outline-none transition-all bg-gray-50/50 hover:bg-white" rows={4} {...props} />
    </div>
);

export default JobseekerProfileDashboard;
