import React, { useState, useEffect } from 'react';
import {
    User, MapPin, Briefcase, GraduationCap, FileText,
    Github, ExternalLink, Plus, Edit2, Trash2,
    CheckCircle, AlertCircle, Upload, Eye, EyeOff, Loader, X, File, Download, RefreshCw
} from 'lucide-react';

import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import profileService from '../../services/profileService';
import projectService from '../../services/projectService';
import activityService from '../../services/activityService';

const JobseekerProfileDashboard = () => {

    const { user: authUser } = useAuth(); // Basic auth info
    const [profile, setProfile] = useState(null);
    const [projects, setProjects] = useState([]);
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null); // { type: 'summary'|'experience'|etc, data: null|obj }

    // Fetch Data
    const fetchData = async () => {
        try {
            const [profileData, projectsData, activityData] = await Promise.all([
                profileService.getMyProfile(),
                projectService.getMyProjects(),
                activityService.getMyActivity()
            ]);
            setProfile(profileData);
            setProjects(projectsData);
            setActivity(activityData);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load profile data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- HANDLERS ---

    // Visibility Toggle
    const toggleVisibility = async () => {
        const newVal = !profile.visibleToRecruiters;
        // Optimistic update
        setProfile(prev => ({ ...prev, visibleToRecruiters: newVal }));
        try {
            await profileService.updateVisibility(newVal);
            toast.success(`Profile is now ${newVal ? 'Visible' : 'Hidden'}`);
        } catch (err) {
            setProfile(prev => ({ ...prev, visibleToRecruiters: !newVal })); // Rollback
            toast.error("Failed to update visibility");
        }
    };

    // Generic Refresh to update strength specific fields
    const refreshProfile = async () => {
        const p = await profileService.getMyProfile();
        setProfile(p);
    };

    // Resume Upload
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
            refreshProfile(); // Strength changes
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

    const handleGenerateCV = async () => {
        const toastId = toast.loading("Generating your CV...");
        try {
            const res = await profileService.generateCV();
            setProfile(prev => ({ ...prev, resume: res.resume }));
            toast.success("CV Generated Successfully!", { id: toastId });
            refreshProfile(); // May update strength if first time
        } catch (err) {
            console.error(err);
            toast.error("Failed to generate CV", { id: toastId });
        }
    };


    // Delete Helpers
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
            refreshProfile(); // projects affect user strength if checking via user model (but here we check profile model which doesn't count projects in prompt logic? Wait, User model had projects. Profile model has distinct projects. Current strength logic ONLY checks profile fields: summary, skills, exp, edu, resume. Projects NOT in prompt strength rules. So no refresh needed? Wait, prompt "Profile Strength Rules... +20 if project count >= 2? No, prompt says Summary, Skills, Exp, Edu, Resume. Projects NOT listed in backend strength rules section. Okay. )
        } catch (e) { toast.error("Error removing project"); }
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader className="animate-spin text-emerald-600" size={40} /></div>;

    if (!profile) return <div className="p-8 text-center">Failed to load profile.</div>;

    // --- RENDER ---
    return (
        <>
            <div className="min-h-screen bg-gray-50/50 pb-12 font-sans text-gray-800">
                {/* 1. Header Section */}
                {/* 1. Header Section */}
                <div className="bg-white border-b border-gray-100 shadow-sm transition-all">
                    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
                        {/* Profile Header Card */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-7 flex flex-col md:flex-row gap-8 items-start justify-between">

                            {/* LEFT COLUMN: Avatar + Info */}
                            <div className="flex items-start gap-6 w-full md:w-3/5">
                                {/* Avatar */}
                                <div className="shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-full bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center text-emerald-600 text-3xl font-bold shadow-sm">
                                    {profile.user?.fullName?.[0] || 'U'}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">
                                        {profile.user?.fullName || 'User'}
                                    </h1>

                                    {/* Headline */}
                                    {profile.headline ? (
                                        <p className="text-gray-900 font-medium text-base mt-1 line-clamp-2">
                                            {profile.headline}
                                        </p>
                                    ) : (
                                        <button
                                            onClick={() => setModal({ type: 'basic', data: { headline: profile.headline, location: profile.location, summary: profile.summary } })}
                                            className="text-emerald-600 text-sm font-medium mt-1 hover:underline flex items-center gap-1"
                                        >
                                            <Plus size={14} /> Add headline
                                        </button>
                                    )}

                                    {/* Meta Row */}
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <MapPin size={14} className="text-gray-400" />
                                            <span>{profile.location || 'Add location'}</span>
                                        </div>
                                        {profile.jobPreferences?.seniority && (
                                            <div className="flex items-center gap-1 before:content-['•'] before:mr-2 before:text-gray-300">
                                                <Briefcase size={14} className="text-gray-400" />
                                                <span>{profile.jobPreferences.seniority}</span>
                                            </div>
                                        )}
                                        {/* Open to Work Chip (Static for now based on context) */}
                                        <span className="inline-flex items-center px-2 py-0.5 rounded textxs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ml-1">
                                            Open to work
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: Actions & Stats */}
                            <div className="w-full md:w-2/5 flex flex-col gap-5 border-t md:border-t-0 md:border-l border-gray-100 pt-5 md:pt-0 md:pl-8">

                                {/* Profile Strength Block */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-bold text-gray-700">Profile Strength</span>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${(profile.profileStrength || 0) < 40 ? 'bg-red-100 text-red-600' :
                                            (profile.profileStrength || 0) < 80 ? 'bg-amber-100 text-amber-600' :
                                                'bg-emerald-100 text-emerald-600'
                                            }`}>
                                            {(profile.profileStrength || 0) < 40 ? 'Weak' : (profile.profileStrength || 0) < 80 ? 'Good' : 'Strong'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${(profile.profileStrength || 0) < 40 ? 'bg-red-500' :
                                                    (profile.profileStrength || 0) < 80 ? 'bg-amber-500' :
                                                        'bg-emerald-500'
                                                    }`}
                                                style={{ width: `${profile.profileStrength || 0}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-sm font-bold text-gray-900 min-w-[3ch] text-right">{profile.profileStrength || 0}%</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1.5 font-medium">Complete your profile to get noticed</p>
                                </div>

                                {/* Actions Row */}
                                <div className="flex items-center justify-between gap-4 mt-auto">
                                    {/* Visibility Badge */}
                                    <div className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border ${profile.visibleToRecruiters
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                        : 'bg-gray-50 text-gray-500 border-gray-200'
                                        }`}>
                                        {profile.visibleToRecruiters ? <Eye size={14} /> : <EyeOff size={14} />}
                                        {profile.visibleToRecruiters ? 'Visible to Recruiters' : 'Hidden from Recruiters'}
                                    </div>

                                    <button
                                        onClick={() => setModal({ type: 'basic', data: { headline: profile.headline, location: profile.location, summary: profile.summary } })}
                                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-md shadow-emerald-200 transition-all flex items-center gap-2"
                                    >
                                        <Edit2 size={14} /> Edit Profile
                                    </button>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* --- LEFT COLUMN (Content) --- */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* About */}
                        <Section title="About" onEdit={() => setModal({ type: 'basic', data: { headline: profile.headline, location: profile.location, summary: profile.summary } })}>
                            {profile.summary ? (
                                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{profile.summary}</p>
                            ) : (
                                <EmptyState text="Add a professional summary to tell your story." />
                            )}
                        </Section>

                        {/* Skills */}
                        <Section title="Skills" onEdit={() => setModal({ type: 'skills', data: profile.skills })}>
                            {profile.skills?.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {profile.skills.map((skill, i) => (
                                        <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium border border-gray-200">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState text="No skills listed." />
                            )}
                        </Section>

                        {/* Experience */}
                        <Section title="Work Experience" onAdd={() => setModal({ type: 'experience', data: null })}>
                            <div className="space-y-6">
                                {profile.experience?.map((exp, i) => (
                                    <div key={exp._id || i} className="group relative pl-4 border-l-2 border-gray-100">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-gray-900">{exp.role}</h3>
                                                <h4 className="text-emerald-600 font-medium">{exp.company}</h4>
                                                <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">
                                                    {new Date(exp.startDate).getFullYear()} - {exp.current ? 'Present' : new Date(exp.endDate).getFullYear()}
                                                </p>
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => setModal({ type: 'experience', data: exp })} className="p-1 hover:bg-gray-100 rounded text-gray-500"><Edit2 size={14} /></button>
                                                <button onClick={() => handleDeleteExperience(exp._id)} className="p-1 hover:bg-red-50 rounded text-red-500"><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                        {exp.description && <p className="text-gray-600 text-sm mt-3">{exp.description}</p>}
                                    </div>
                                ))}
                                {(!profile.experience || profile.experience.length === 0) && <EmptyState text="Add your work history." />}
                            </div>
                        </Section>

                        {/* Education */}
                        <Section title="Education" onAdd={() => setModal({ type: 'education', data: null })}>
                            <div className="space-y-6">
                                {profile.education?.map((edu, i) => (
                                    <div key={edu._id || i} className="group relative pl-4 border-l-2 border-gray-100">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-gray-900">{edu.degree}</h3>
                                                <h4 className="text-gray-600 font-medium">{edu.institute}</h4>
                                                <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">
                                                    {edu.startYear} - {edu.current ? 'Present' : edu.endYear}
                                                </p>
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => setModal({ type: 'education', data: edu })} className="p-1 hover:bg-gray-100 rounded text-gray-500"><Edit2 size={14} /></button>
                                                <button onClick={() => handleDeleteEducation(edu._id)} className="p-1 hover:bg-red-50 rounded text-red-500"><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!profile.education || profile.education.length === 0) && <EmptyState text="Add your education." />}
                            </div>
                        </Section>

                        {/* Projects */}
                        <Section title="Projects & Portfolio" onAdd={() => setModal({ type: 'project', data: null })}>
                            <div className="space-y-6">
                                {projects.map((proj) => (
                                    <div key={proj._id} className="group bg-white border border-gray-100 rounded-xl p-5 hover:border-emerald-200 transition-colors shadow-sm">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-900">{proj.title}</h3>
                                                <p className="text-gray-600 text-sm mt-2">{proj.description}</p>
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => setModal({ type: 'project', data: proj })} className="p-1 hover:bg-gray-100 rounded text-gray-500"><Edit2 size={14} /></button>
                                                <button onClick={() => handleDeleteProject(proj._id)} className="p-1 hover:bg-red-50 rounded text-red-500"><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-4">
                                            {proj.techStack?.map((tag, i) => (
                                                <span key={i} className="text-xs font-semibold px-2 py-1 bg-gray-50 text-gray-500 rounded border border-gray-100 uppercase tracking-tight">{tag}</span>
                                            ))}
                                        </div>
                                        <div className="flex gap-4 mt-4 pt-4 border-t border-gray-50">
                                            {proj.githubUrl && (
                                                <a href={proj.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-900">
                                                    <Github size={14} /> Source Code
                                                </a>
                                            )}
                                            {proj.liveDemoUrl && (
                                                <a href={proj.liveDemoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700">
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

                    {/* --- RIGHT COLUMN (Sidebar) --- */}
                    <div className="space-y-6">

                        {/* Strength Detail Card */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-900">Profile Strength</h3>
                                <span className={`text-xs font-bold px-2 py-1 rounded bg-gray-100 ${profile.strengthLabel === 'WEAK' ? 'text-red-500' :
                                    profile.strengthLabel === 'GOOD' ? 'text-yellow-600' : 'text-emerald-600'
                                    }`}>
                                    {profile.strengthLabel}
                                </span>
                            </div>
                            {profile.tips && profile.tips.length > 0 ? (
                                <ul className="space-y-3">
                                    {profile.tips.map((tip, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                                            {tip}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                                    <CheckCircle size={16} /> All set! Your profile is strong.
                                </div>
                            )}
                        </div>

                        {/* Resume Card */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-6">Resume Management</h3>

                            {/* Auto Builder Promo (if no resume) */}
                            {(!profile.resume || !profile.resume.fileUrl) && (
                                <div className="mb-4">
                                    <button
                                        onClick={handleGenerateCV}
                                        className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 border-dashed rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all mb-2"
                                    >
                                        <RefreshCw size={16} /> Auto-Generate CV from Profile
                                    </button>
                                    <div className="text-center text-xs text-gray-400 mb-4">OR</div>
                                </div>
                            )}

                            {profile.resume && profile.resume.fileUrl ? (
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center relative group">
                                    <FileText size={32} className={`mx-auto mb-3 ${profile.resume.source === 'generated' ? 'text-emerald-500' : 'text-gray-400'}`} />

                                    <p className="text-sm font-medium text-gray-900 truncate px-4">{profile.resume.fileName || 'Resume.pdf'}</p>

                                    {profile.resume.source === 'generated' && (
                                        <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded">
                                            Auto Generated
                                        </span>
                                    )}

                                    <p className="text-xs text-gray-400 mt-1">
                                        {profile.resume.source === 'generated' ? 'Generated ' : 'Uploaded '}
                                        {new Date(profile.resume.uploadedAt || profile.resume.lastGeneratedAt).toLocaleDateString()}
                                    </p>

                                    <div className="grid grid-cols-2 gap-2 mt-4">

                                        <button
                                            onClick={() => profileService.viewGeneratedCV()}
                                            className="col-span-2 flex items-center justify-center gap-2 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black transition-colors"
                                        >
                                            <Eye size={14} /> View CV
                                        </button>

                                        <button
                                            onClick={() => profileService.downloadGeneratedCV(profile.resume.fileName)}
                                            className="col-span-2 flex items-center justify-center gap-2 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                                        >
                                            <Download size={14} /> Download PDF
                                        </button>



                                        {profile.resume.source === 'generated' ? (
                                            <button
                                                onClick={handleGenerateCV}
                                                className="flex items-center justify-center gap-2 py-2 bg-white border border-emerald-200 text-emerald-600 rounded-lg text-sm font-medium hover:bg-emerald-50 transition-colors"
                                            >
                                                <RefreshCw size={14} /> Update
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => document.getElementById('resume-upload').click()}
                                                className="flex items-center justify-center gap-2 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                                            >
                                                Replace
                                            </button>
                                        )}

                                        <button
                                            onClick={handleDeleteResume}
                                            className="flex items-center justify-center gap-2 py-2 bg-white border border-red-100 text-red-500 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    onClick={() => document.getElementById('resume-upload').click()}
                                    className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all"
                                >
                                    <Upload size={24} className="mx-auto text-gray-400 mb-3" />
                                    <p className="text-sm font-medium text-gray-900">Upload Custom Resume</p>
                                    <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX up to 5MB</p>
                                </div>
                            )}
                            <input id="resume-upload" type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeUpload} />

                        </div>

                        {/* Job Preferences */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-gray-900">Job Preferences</h3>
                                <button onClick={() => setModal({ type: 'preferences', data: profile.jobPreferences })} className="text-xs px-2 py-1 bg-gray-50 hover:bg-gray-100 rounded text-gray-600 font-medium transition-colors">Edit</button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Roles</p>
                                    <div className="flex flex-wrap gap-1">
                                        {profile.jobPreferences?.jobTypes?.map((t, i) => (
                                            <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">{t}</span>
                                        )) || <span className="text-xs text-gray-400">Not specified</span>}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Seniority</p>
                                    <p className="text-sm font-medium text-gray-700">{profile.jobPreferences?.seniority || 'Any'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Preferred Location</p>
                                    <p className="text-sm font-medium text-gray-700">{profile.jobPreferences?.preferredLocation || 'Anywhere'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Activity */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-4">Recent Activity</h3>
                            <div className="relative border-l border-gray-100 ml-2 space-y-6">
                                {activity.map((act, i) => (
                                    <div key={i} className="pl-4 relative">
                                        <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-white box-content shadow-sm bg-emerald-500"></div>
                                        <p className="text-sm text-gray-800 font-medium">
                                            {act.type === 'APPLIED_JOB' && `Applied to ${act.meta?.jobTitle || 'a job'}`}
                                            {act.type === 'RECRUITER_VIEW' && `Profile viewed by a recruiter`}
                                            {act.type === 'MESSAGE' && `Received a new message`}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">{new Date(act.createdAt).toLocaleDateString()}</p>
                                    </div>
                                ))}
                                {activity.length === 0 && <p className="pl-4 text-xs text-gray-400">No recent activity.</p>}
                            </div>
                        </div>

                        {/* Visibility Toggle Card */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-900">Profile Visibility</h3>
                                    <p className="text-xs text-gray-500 mt-1 max-w-[200px]">Allow recruiters to find you in search results.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={profile.visibleToRecruiters || false} onChange={toggleVisibility} />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                </label>
                            </div>
                        </div>

                    </div>
                </div>

                {/* --- MODALS --- */}
                {modal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                                <h3 className="text-xl font-bold text-gray-900 capitalize">
                                    {modal.type === 'basic' && 'Edit Basic Info'}
                                    {modal.type === 'experience' && (modal.data ? 'Edit Experience' : 'Add Experience')}
                                    {modal.type === 'education' && (modal.data ? 'Edit Education' : 'Add Education')}
                                    {modal.type === 'project' && (modal.data ? 'Edit Project' : 'Add Project')}
                                    {modal.type === 'skills' && 'Update Skills'}
                                    {modal.type === 'preferences' && 'Job Preferences'}
                                </h3>
                                <button onClick={() => setModal(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><X size={20} /></button>
                            </div>
                            <div className="p-6">
                                <ModalForm
                                    type={modal.type}
                                    initialData={modal.data}
                                    onClose={() => setModal(null)}
                                    onSuccess={() => {
                                        setModal(null);
                                        fetchData(); // Refresh everything to be safe
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );

};

// --- SUB-COMPONENTS ---

const Section = ({ title, children, onEdit, onAdd }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transition-all hover:shadow-md">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                {title}
            </h2>
            <div className="flex gap-2">
                {onAdd && <button onClick={onAdd} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"><Plus size={20} /></button>}
                {onEdit && <button onClick={onEdit} className="p-2 text-gray-400 hover:bg-gray-50 hover:text-emerald-600 rounded-full transition-colors"><Edit2 size={18} /></button>}
            </div>
        </div>
        {children}
    </div>
);

const EmptyState = ({ text }) => (
    <div className="py-8 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
        <p className="text-gray-400 text-sm font-medium">{text}</p>
    </div>
);

// --- FORM COMPONENT ---
const ModalForm = ({ type, initialData, onClose, onSuccess }) => {
    // We use a single large form handler for simplicity in this artifact
    const [formData, setFormData] = useState(initialData || {});

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
                await profileService.updateProfile(formData);
            } else if (type === 'skills') {
                // formData expected to be array for skills, but here we might handle text input
                // If type=skills, initialData was array.
                // We'll handle skills distinctively below.
            } else if (type === 'experience') {
                if (initialData?._id) await profileService.updateExperience(initialData._id, formData);
                else await profileService.addExperience(formData);
            } else if (type === 'education') {
                if (initialData?._id) await profileService.updateEducation(initialData._id, formData);
                else await profileService.addEducation(formData);
            } else if (type === 'project') {
                // Stack is array
                const data = { ...formData, techStack: typeof formData.techStack === 'string' ? formData.techStack.split(',').map(s => s.trim()) : formData.techStack };
                if (initialData?._id) await projectService.updateProject(initialData._id, data);
                else await projectService.addProject(data);
            } else if (type === 'preferences') {
                // jobTypes array
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

    // Skills specific handler
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma separated)</label>
                    <textarea
                        className="w-full rounded-lg border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
                        rows={4}
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        placeholder="React, Node.js, Design, Communication..."
                    />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                    <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Save Skills</button>
                </div>
            </form>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">

            {type === 'basic' && (
                <>
                    <Input label="Professional Headline" name="headline" value={formData.headline} onChange={handleChange} placeholder="e.g. Senior Frontend Developer" />
                    <Input label="Location" name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Kathmandu, Nepal" />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">About</label>
                        <textarea name="summary" value={formData.summary} onChange={handleChange} rows={5} className="w-full rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="Tell us about yourself..." />
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
                        <input type="checkbox" name="current" checked={formData.current} onChange={handleChange} className="rounded text-emerald-600 focus:ring-emerald-500" />
                        <span className="text-sm text-gray-700">I currently work here</span>
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

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-50 mt-4">
                <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium shadow-lg shadow-emerald-200 transition-all transform hover:-translate-y-0.5">Save Changes</button>
            </div>
        </form>
    );
};

const Input = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
        <input className="w-full rounded-lg border border-gray-300 p-2.5 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:outline-none transition-all" {...props} />
    </div>
);

const TextArea = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
        <textarea className="w-full rounded-lg border border-gray-300 p-2.5 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:outline-none transition-all" rows={4} {...props} />
    </div>
);

export default JobseekerProfileDashboard;
