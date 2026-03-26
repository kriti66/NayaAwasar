import React, { useState, useEffect, useRef } from 'react';
import {
    User, Mail, Phone, Globe, Linkedin, Briefcase, GraduationCap,
    Plus, Edit2, Download, Upload, CheckCircle, X, Save, Github, Link as LinkIcon,
    Bell, Settings, LayoutDashboard, FileText
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import profileService from '../../services/profileService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { API_BASE_URL } from '../../config/api';

const ProfileManagement = () => {
    const { user: authUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [editSection, setEditSection] = useState(null);
    const [formData, setFormData] = useState({});
    const resumeRef = useRef();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const data = await profileService.getProfile();
            setProfile(data);
            setFormData(data);
        } catch (error) {
            console.error("Error fetching profile:", error);
            toast.error("Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (section) => {
        setEditSection(section);
        setFormData({ ...profile });
    };

    const handleCloseEdit = () => {
        setEditSection(null);
    };

    const handleSave = async (section) => {
        try {
            const result = await profileService.updateProfile(formData);
            if (result.success) {
                setProfile(result.user);
                setEditSection(null);
                toast.success(`${section} updated successfully`);
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("Failed to update profile");
        }
    };

    const handleDownloadGeneratedCV = async () => {
        const element = resumeRef.current;
        if (!element) return;

        try {
            toast.loading("Preparing your premium resume...", { id: "pdf-gen" });

            // Temporary styles for perfect PDF output
            const originalStyle = element.style.cssText;
            element.style.maxHeight = 'none';
            element.style.overflow = 'visible';
            element.style.boxShadow = 'none';

            const canvas = await html2canvas(element, {
                scale: 2, // High quality but optimized size
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                width: 800, // Matches the container width
                windowWidth: 800
            });

            // Restore original styles
            element.style.cssText = originalStyle;

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${profile.fullName.replace(/\s+/g, '_')}_Premium_Resume.pdf`);

            toast.success("Premium resume downloaded!", { id: "pdf-gen" });
        } catch (error) {
            console.error("PDF generation error:", error);
            toast.error("Failed to generate PDF", { id: "pdf-gen" });
        }
    };


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        if (type === 'avatar') {
            uploadData.append('avatar', file);
            try {
                const res = await profileService.uploadAvatar(uploadData);
                if (res.success) {
                    setProfile(prev => ({ ...prev, profileImage: res.url }));
                    toast.success("Profile picture updated");
                }
            } catch (error) {
                toast.error("Failed to upload image");
            }
        } else if (type === 'resume') {
            uploadData.append('cv', file);
            try {
                const res = await profileService.uploadResume(uploadData);
                if (res.success) {
                    setProfile(prev => ({ ...prev, resume_url: res.url }));
                    toast.success("Resume uploaded successfully");
                }
            } catch (error) {
                toast.error("Failed to upload resume");
            }
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-slate-50 items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
            <Sidebar />

            <div className="flex-1 flex flex-col">
                {/* Global Topbar */}
                <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-30">
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-400 tracking-wider">PORTAL /</span>
                        <span className="text-xs font-black text-slate-900 tracking-widest uppercase">Profile & Resume</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <button className="relative text-slate-400 hover:text-slate-600 transition-colors">
                            <Bell className="w-5 h-5" />
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full border-2 border-white"></span>
                        </button>
                        <div className="w-px h-6 bg-slate-100"></div>
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-[11px] font-black text-slate-900 tracking-tight leading-tight uppercase">{profile?.fullName}</p>
                                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{profile?.role}</p>
                            </div>
                            <div className="w-9 h-9 rounded-full border border-slate-100 shadow-sm overflow-hidden bg-slate-50 ring-2 ring-blue-500/10">
                                {profile?.profileImage ? (
                                    <img src={`${API_BASE_URL}${profile.profileImage}`} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white font-black text-xs">
                                        {profile?.fullName?.charAt(0) || 'U'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-8 lg:p-12 max-w-7xl mx-auto w-full space-y-8">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Profile & Resume Management</h1>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-3 space-y-6">

                            {/* Personal Details */}
                            <SectionCard
                                title="Personal Details"
                                onEdit={() => handleEdit('personal')}
                                isEditing={editSection === 'personal'}
                                onSave={() => handleSave('Personal Details')}
                                onCancel={handleCloseEdit}
                            >
                                {editSection === 'personal' ? (
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
                                            <input
                                                type="text" name="fullName" value={formData.fullName || ''} onChange={handleInputChange}
                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-800"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Professional Headline</label>
                                            <input
                                                type="text" name="professionalHeadline" value={formData.professionalHeadline || ''} onChange={handleInputChange}
                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-800"
                                                placeholder="e.g. Full Stack Developer"
                                            />
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">About Me</label>
                                            <textarea
                                                name="bio" value={formData.bio || ''} onChange={handleInputChange} rows="4"
                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700"
                                            ></textarea>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">First Name</p>
                                            <p className="text-[13px] font-bold text-slate-900 tracking-tight">{profile.fullName?.split(' ')[0] || '---'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Last Name</p>
                                            <p className="text-[13px] font-bold text-slate-900 tracking-tight">{profile.fullName?.split(' ').slice(1).join(' ') || '---'}</p>
                                        </div>
                                        <div className="col-span-full space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Professional Headline</p>
                                            <p className="text-[13px] font-bold text-slate-900 tracking-tight uppercase">{profile.professionalHeadline || '---'}</p>
                                        </div>
                                        <div className="col-span-full space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">About Me</p>
                                            <p className="text-[13px] text-slate-600 leading-[1.6] font-medium max-w-2xl">
                                                {profile.bio || 'Tell us something about yourself...'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </SectionCard>

                            {/* Contact Information */}
                            <SectionCard
                                title="Contact Information"
                                onEdit={() => handleEdit('contact')}
                                isEditing={editSection === 'contact'}
                                onSave={() => handleSave('Contact Information')}
                                onCancel={handleCloseEdit}
                            >
                                {editSection === 'contact' ? (
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Phone Number</label>
                                            <input
                                                type="text" name="phoneNumber" value={formData.phoneNumber || ''} onChange={handleInputChange}
                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-800"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">LinkedIn Profile</label>
                                            <input
                                                type="url" name="linkedinUrl" value={formData.linkedinUrl || ''} onChange={handleInputChange}
                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-800"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Portfolio URL</label>
                                            <input
                                                type="url" name="portfolioUrl" value={formData.portfolioUrl || ''} onChange={handleInputChange}
                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-800"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Email</p>
                                            <p className="text-[13px] font-bold text-slate-900 tracking-tight lowercase">{profile.email}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Phone Number</p>
                                            <p className="text-[13px] font-bold text-slate-900 tracking-tight">{profile.phoneNumber || '---'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">LinkedIn</p>
                                            <div className="flex items-center gap-1.5 text-blue-600">
                                                <Linkedin className="w-3.5 h-3.5" />
                                                {profile.linkedinUrl ? <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-[13px] font-bold hover:underline">LinkedIn Profile</a> : <span className="text-[13px] font-bold text-slate-300">---</span>}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Portfolio</p>
                                            <div className="flex items-center gap-1.5 text-blue-600">
                                                <Globe className="w-3.5 h-3.5" />
                                                {profile.portfolioUrl ? <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-[13px] font-bold hover:underline">Portfolio Website</a> : <span className="text-[13px] font-bold text-slate-300">---</span>}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </SectionCard>

                            {/* Work Experience */}
                            <SectionCard
                                title="Work Experience"
                                onEdit={() => handleEdit('experience')}
                                isEditing={editSection === 'experience'}
                                onSave={() => handleSave('Work Experience')}
                                onCancel={handleCloseEdit}
                            >
                                {editSection === 'experience' ? (
                                    <WorkExperienceForm
                                        items={formData.workExperience || []}
                                        onChange={(items) => setFormData(p => ({ ...p, workExperience: items }))}
                                    />
                                ) : (
                                    <div className="space-y-10">
                                        {profile.workExperience?.length > 0 ? profile.workExperience.map((exp, idx) => (
                                            <div key={idx} className="relative pl-8 border-l-2 border-slate-100/10 group last:pb-0 pb-10">
                                                <div className="absolute left-[-6px] top-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-full ring-4 ring-blue-500/10 scale-110"></div>
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="text-[15px] font-black text-slate-900 tracking-tight leading-tight uppercase">{exp.title}</h4>
                                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">{exp.duration}</span>
                                                </div>
                                                <p className="text-[12px] font-bold text-blue-500 uppercase tracking-widest mb-3">{exp.company}</p>
                                                <p className="text-[13px] text-slate-600 font-medium leading-[1.6] max-w-3xl">{exp.description}</p>
                                            </div>
                                        )) : (
                                            <p className="text-sm text-slate-400 italic">No experience added yet.</p>
                                        )}
                                    </div>
                                )}
                            </SectionCard>

                            {/* Education */}
                            <SectionCard
                                title="Education"
                                onEdit={() => handleEdit('education')}
                                isEditing={editSection === 'education'}
                                onSave={() => handleSave('Education')}
                                onCancel={handleCloseEdit}
                            >
                                {editSection === 'education' ? (
                                    <EducationForm
                                        items={formData.education || []}
                                        onChange={(items) => setFormData(p => ({ ...p, education: items }))}
                                    />
                                ) : (
                                    <div className="space-y-8">
                                        {profile.education?.length > 0 ? profile.education.map((edu, idx) => (
                                            <div key={idx} className="flex gap-5">
                                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100/50">
                                                    <GraduationCap className="w-6 h-6" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="text-[14px] font-black text-slate-900 tracking-tight uppercase leading-tight">{edu.degree}</h4>
                                                        <span className="text-[11px] font-black text-slate-400 tracking-widest">{edu.year}</span>
                                                    </div>
                                                    <p className="text-[12px] font-bold text-slate-500 mt-2 tracking-tight">{edu.institution}</p>
                                                </div>
                                            </div>
                                        )) : (
                                            <p className="text-sm text-slate-400 italic">No education details added yet.</p>
                                        )}
                                    </div>
                                )}
                            </SectionCard>

                            {/* Skills */}
                            <SectionCard
                                title="Skills"
                                onEdit={() => handleEdit('skills')}
                                isEditing={editSection === 'skills'}
                                onSave={() => handleSave('Skills')}
                                onCancel={handleCloseEdit}
                            >
                                {editSection === 'skills' ? (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Skills (Comma separated)</label>
                                        <input
                                            type="text" name="skills" value={formData.skills || ''} onChange={handleInputChange}
                                            placeholder="React, Node.js, TypeScript..."
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-800"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {profile.skills ? profile.skills.split(',').map((skill, idx) => (
                                            <span key={idx} className="px-4 py-2 bg-slate-50 text-slate-600 text-[11px] font-bold uppercase tracking-wider rounded-xl border border-slate-100 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all cursor-default">
                                                {skill.trim()}
                                            </span>
                                        )) : (
                                            <p className="text-sm text-slate-400 italic">No skills listed.</p>
                                        )}
                                    </div>
                                )}
                            </SectionCard>

                            {/* Public Profile Settings */}
                            <SectionCard
                                title="Public Profile Settings"
                                onEdit={() => handleEdit('settings')}
                                isEditing={editSection === 'settings'}
                                onSave={() => handleSave('Settings')}
                                onCancel={handleCloseEdit}
                            >
                                <div className="flex items-center justify-between py-2">
                                    <div>
                                        <h4 className="text-sm font-black text-slate-900 leading-none">Make Profile Public</h4>
                                        <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Your profile is visible to recruiters and employers.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editSection === 'settings' ? formData.isPublic : profile.isPublic}
                                            onChange={(e) => {
                                                if (editSection === 'settings') {
                                                    setFormData(p => ({ ...p, isPublic: e.target.checked }));
                                                } else {
                                                    setProfile(p => ({ ...p, isPublic: e.target.checked }));
                                                    profileService.updateProfile({ isPublic: e.target.checked });
                                                }
                                            }}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </SectionCard>
                        </div>

                        {/* Sidebar Preview */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-[32px] border border-slate-100 shadow-2xl shadow-slate-900/10 p-1 sticky top-24">
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-6 px-1">
                                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Resume Preview</h3>
                                        <LinkIcon className="w-4 h-4 text-slate-300" />
                                    </div>

                                    {/* Mock Mini Resume Container */}
                                    <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-[#FDFEFE] mb-8">
                                        <div className="bg-blue-600 p-6 text-white">
                                            <h4 className="text-lg font-black uppercase tracking-tight leading-none mb-1">{profile.fullName || 'John Doe'}</h4>
                                            <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest">{profile.professionalHeadline || 'Awasar Platform User'}</p>
                                        </div>
                                        <div className="p-5 space-y-6">
                                            {/* Contact */}
                                            <div className="space-y-2.5">
                                                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-3">Contact</p>
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                                                    <Phone className="w-3 h-3 text-slate-300" /> {profile.phoneNumber || '+977-XXXXXXXXXX'}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                                                    <Mail className="w-3 h-3 text-slate-300" /> {profile.email}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                                                    <Globe className="w-3 h-3 text-slate-300" /> {profile.location || 'Kathmandu, Nepal'}
                                                </div>
                                            </div>

                                            {/* Profile */}
                                            <div className="space-y-2.5">
                                                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-2">Profile</p>
                                                <p className="text-[10px] leading-relaxed text-slate-500 font-medium line-clamp-4">
                                                    {profile.bio || 'Your professional summary will appear here.'}
                                                </p>
                                            </div>

                                            {/* Skills */}
                                            <div className="space-y-3">
                                                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-2">Skills</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {profile.skills ? profile.skills.split(',').slice(0, 6).map((s, i) => (
                                                        <span key={i} className="px-2 py-1 bg-slate-50 text-[8px] font-black text-slate-500 rounded uppercase tracking-tighter border border-slate-100">{s.trim()}</span>
                                                    )) : <span className="text-[10px] text-slate-400 italic">No skills listed</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="space-y-3 px-1">
                                        <button
                                            onClick={handleDownloadGeneratedCV}
                                            className="w-full py-3.5 px-4 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/25"
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                            Download Profile as PDF
                                        </button>

                                        {profile.resume_url ? (
                                            <button
                                                onClick={() => window.open(`${API_BASE_URL}${profile.resume_url}`)}
                                                className="w-full py-3.5 px-4 bg-white border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-all border-slate-100 shadow-sm"
                                            >
                                                <FileText className="w-3.5 h-3.5" />
                                                Download Original File
                                            </button>
                                        ) : (
                                            <div className="py-3.5 px-4 bg-slate-50 border border-dashed border-slate-100 text-slate-300 text-[10px] font-bold uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
                                                No Original File
                                            </div>
                                        )}

                                        <label className="w-full py-3.5 px-4 bg-white border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 active:scale-[0.98] transition-all cursor-pointer border-slate-100 shadow-sm mt-4">
                                            <Upload className="w-3.5 h-3.5" />
                                            Upload External Resume
                                            <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => handleFileUpload(e, 'resume')} />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Hidden High-Fidelity Resume for PDF Generation */}
                            <div className="fixed -left-[2000px] top-0 pointer-events-none">
                                <div
                                    ref={resumeRef}
                                    className="bg-white shadow-none overflow-hidden"
                                    style={{ width: '800px', minHeight: '1131px' }}
                                >
                                    {/* Header Banner */}
                                    <div className="bg-[#949494] p-12 text-center">
                                        <h1 className="text-5xl font-extrabold text-white tracking-[0.1em] uppercase mb-2">
                                            {profile.fullName || 'User Name'}
                                        </h1>
                                        <p className="text-lg font-medium text-white/90 tracking-widest uppercase">
                                            {profile.professionalHeadline || 'Professional Headline'}
                                        </p>
                                    </div>

                                    <div className="flex">
                                        <div className="w-[30%] bg-[#F3F2F7] p-8 min-h-[1000px] space-y-12">
                                            <section>
                                                <h3 className="text-[#5D3D60] font-black text-sm tracking-widest uppercase border-b-2 border-[#5D3D60] pb-1 mb-4">Contact</h3>
                                                <div className="space-y-4 text-[11px] font-medium text-slate-700">
                                                    {profile.phoneNumber && <div className="flex gap-3"><Phone className="w-3.5 h-3.5 text-[#5D3D60]" /><div><p className="font-black uppercase text-[8px]">Phone:</p><p>{profile.phoneNumber}</p></div></div>}
                                                    <div className="flex gap-3"><Mail className="w-3.5 h-3.5 text-[#5D3D60]" /><div><p className="font-black uppercase text-[8px]">Email:</p><p className="break-all">{profile.email}</p></div></div>
                                                    <div className="flex gap-3"><Globe className="w-3.5 h-3.5 text-[#5D3D60]" /><div><p className="font-black uppercase text-[8px]">Location:</p><p>Kathmandu, Nepal</p></div></div>
                                                </div>
                                            </section>
                                            <section>
                                                <h3 className="text-[#5D3D60] font-black text-sm tracking-widest uppercase border-b-2 border-[#5D3D60] pb-1 mb-4">Skills</h3>
                                                <ul className="space-y-2 text-[11px] font-bold text-slate-700 list-disc list-inside">
                                                    {profile.skills?.split(',').map((s, i) => <li key={i} className="capitalize">{s.trim()}</li>)}
                                                </ul>
                                            </section>
                                        </div>
                                        <div className="w-[70%] p-12 bg-white">
                                            <div className="relative pl-10 mb-12">
                                                <div className="absolute left-0 top-0 w-8 h-8 bg-[#333] rounded-sm flex items-center justify-center text-white"><User className="w-4 h-4" /></div>
                                                <h2 className="text-xl font-black text-[#5D3D60] tracking-widest uppercase border-b border-slate-200 pb-2 mb-6 ml-2">Profile</h2>
                                                <p className="text-[14px] text-slate-600 leading-relaxed font-medium text-justify">{profile.bio}</p>
                                            </div>
                                            <div className="relative pl-10 mb-12">
                                                <div className="absolute left-0 top-0 w-8 h-8 bg-[#333] rounded-sm flex items-center justify-center text-white"><Briefcase className="w-4 h-4" /></div>
                                                <h2 className="text-xl font-black text-[#5D3D60] tracking-widest uppercase border-b border-slate-200 pb-2 mb-6 ml-2">Experience</h2>
                                                <div className="space-y-8">
                                                    {profile.workExperience?.map((exp, i) => (
                                                        <div key={i} className="relative">
                                                            <div className="absolute left-[-27px] top-1.5 w-1.5 h-1.5 bg-[#333]"></div>
                                                            <div className="flex justify-between font-black uppercase"><h4 className="text-sm">{exp.title} — {exp.company}</h4><span className="text-[9px] text-slate-400">{exp.duration}</span></div>
                                                            <p className="text-[12px] text-slate-600 mt-2">{exp.description}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                <footer className="h-20 bg-transparent flex items-center justify-center px-12 mt-auto">
                    <p className="text-[10px] font-black text-slate-600 tracking-[0.5em] uppercase opacity-50">
                        Naya Awasar © {new Date().getFullYear()} — Career Propulsion Protocol
                    </p>
                </footer>
            </div>
        </div>
    );
};

// UI Components
const SectionCard = ({ title, children, onEdit, isEditing, onSave, onCancel }) => (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-900/5 p-8 lg:p-10 transition-all">
        <div className="flex justify-between items-center mb-10">
            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">{title}</h2>
            <div className="flex gap-2">
                {isEditing ? (
                    <>
                        <button onClick={onCancel} className="p-2.5 text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1">
                            <X className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Cancel</span>
                        </button>
                        <button onClick={onSave} className="px-5 py-2.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                            <CheckCircle className="w-4 h-4" />
                            Save Changes
                        </button>
                    </>
                ) : (
                    <button onClick={onEdit} className="px-5 py-2.5 bg-white text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2 border border-slate-200 shadow-sm active:scale-95">
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit
                    </button>
                )}
            </div>
        </div>
        {children}
    </div>
);

const WorkExperienceForm = ({ items, onChange }) => {
    const handleAdd = () => {
        onChange([...items, { title: '', company: '', duration: '', description: '' }]);
    };
    const handleRemove = (idx) => {
        onChange(items.filter((_, i) => i !== idx));
    };
    const updateItem = (idx, field, value) => {
        const newItems = [...items];
        newItems[idx] = { ...newItems[idx], [field]: value };
        onChange(newItems);
    };

    return (
        <div className="space-y-6">
            {items.map((exp, idx) => (
                <div key={idx} className="p-8 bg-slate-50 rounded-[24px] space-y-6 relative border border-slate-100">
                    <button onClick={() => handleRemove(idx)} className="absolute top-6 right-6 text-slate-300 hover:text-red-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Job Title</label>
                            <input
                                placeholder="e.g. Senior Software Engineer" value={exp.title} onChange={(e) => updateItem(idx, 'title', e.target.value)}
                                className="w-full p-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-[13px] font-bold text-slate-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Company</label>
                            <input
                                placeholder="e.g. Google" value={exp.company} onChange={(e) => updateItem(idx, 'company', e.target.value)}
                                className="w-full p-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-[13px] font-bold text-slate-800"
                            />
                        </div>
                        <div className="col-span-full space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Duration</label>
                            <input
                                placeholder="e.g. Jan 2020 - Present" value={exp.duration} onChange={(e) => updateItem(idx, 'duration', e.target.value)}
                                className="w-full p-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-[13px] font-bold text-slate-800"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Description</label>
                        <textarea
                            placeholder="Key responsibilities and achievements..." value={exp.description} onChange={(e) => updateItem(idx, 'description', e.target.value)}
                            className="w-full p-4 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-[13px] font-medium text-slate-700"
                            rows="4"
                        ></textarea>
                    </div>
                </div>
            ))}
            <button onClick={handleAdd} className="w-full py-5 border-2 border-dashed border-slate-100 rounded-[24px] text-slate-400 hover:border-blue-200 hover:text-blue-500 hover:bg-blue-50/30 transition-all font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 bg-white/50">
                <Plus className="w-4 h-4" />
                Add Work Experience
            </button>
        </div>
    );
};

const EducationForm = ({ items, onChange }) => {
    const handleAdd = () => {
        onChange([...items, { degree: '', institution: '', year: '' }]);
    };
    const handleRemove = (idx) => {
        onChange(items.filter((_, i) => i !== idx));
    };
    const updateItem = (idx, field, value) => {
        const newItems = [...items];
        newItems[idx] = { ...newItems[idx], [field]: value };
        onChange(newItems);
    };

    return (
        <div className="space-y-6">
            {items.map((edu, idx) => (
                <div key={idx} className="p-8 bg-slate-50 rounded-[24px] space-y-6 relative border border-slate-100">
                    <button onClick={() => handleRemove(idx)} className="absolute top-6 right-6 text-slate-300 hover:text-red-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Degree</label>
                            <input
                                placeholder="e.g. Master of Science" value={edu.degree} onChange={(e) => updateItem(idx, 'degree', e.target.value)}
                                className="w-full p-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-[13px] font-bold text-slate-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Institution</label>
                            <input
                                placeholder="e.g. State University" value={edu.institution} onChange={(e) => updateItem(idx, 'institution', e.target.value)}
                                className="w-full p-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-[13px] font-bold text-slate-800"
                            />
                        </div>
                        <div className="col-span-full space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Year</label>
                            <input
                                placeholder="e.g. 2017" value={edu.year} onChange={(e) => updateItem(idx, 'year', e.target.value)}
                                className="w-full p-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-[13px] font-bold text-slate-800"
                            />
                        </div>
                    </div>
                </div>
            ))}
            <button onClick={handleAdd} className="w-full py-5 border-2 border-dashed border-slate-100 rounded-[24px] text-slate-400 hover:border-blue-200 hover:text-blue-500 hover:bg-blue-50/30 transition-all font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 bg-white/50">
                <Plus className="w-4 h-4" />
                Add Education
            </button>
        </div>
    );
};

export default ProfileManagement;
