import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Briefcase, GraduationCap, Link as LinkIcon, Box, Info, Settings } from 'lucide-react';
import SeekerLayout from '../../components/layouts/SeekerLayout';
import profileService from '../../services/profileService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Components
import ProfileHeader from '../../components/profile/ProfileHeader';
import ProfileSectionCard from '../../components/profile/ProfileSectionCard';
import AboutSection from '../../components/profile/AboutSection';
import WorkExperience from '../../components/profile/WorkExperience';
import Education from '../../components/profile/Education';
import Skills from '../../components/profile/Skills';
import ProjectsSection from '../../components/profile/ProjectsSection';
import ResumeManagementCard from '../../components/profile/ResumeManagementCard';
import ProfileVisibilityCard from '../../components/profile/ProfileVisibilityCard';
import ProfileStrengthCard from '../../components/profile/ProfileStrengthCard';
import RecentActivityWidget from '../../components/dashboard/RecentActivityWidget';

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

    const handleSave = async (sectionLabel) => {
        try {
            toast.loading(`Saving ${sectionLabel}...`, { id: "save-profile" });
            const result = await profileService.updateProfile(formData);
            if (result.success) {
                setProfile(result.user);
                setEditSection(null);
                toast.success(`${sectionLabel} updated!`, { id: "save-profile" });
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("Failed to update profile", { id: "save-profile" });
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleItemsChange = (field, newItems) => {
        setFormData(prev => ({ ...prev, [field]: newItems }));
    };

    const handleTogglePublic = async (isPublic) => {
        try {
            const result = await profileService.updateProfile({ isPublic });
            if (result.success) {
                setProfile(prev => ({ ...prev, isPublic }));
                toast.success(`Profile visibility set to ${isPublic ? 'Public' : 'Private'}`);
            }
        } catch (error) {
            toast.error("Failed to update visibility");
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('cv', file);
        try {
            toast.loading("Uploading resume...", { id: "upload" });
            const res = await profileService.uploadResume(uploadData);
            if (res.success) {
                setProfile(prev => ({ ...prev, resume_url: res.url }));
                toast.success("Resume uploaded successfully!", { id: "upload" });
            }
        } catch (error) {
            toast.error("Failed to upload resume", { id: "upload" });
        }
    };

    const handleDownloadGeneratedCV = async () => {
        const element = resumeRef.current;
        if (!element) return;

        try {
            toast.loading("Generating professional PDF...", { id: "pdf-gen" });

            const canvas = await html2canvas(element, {
                scale: 3,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                width: 800,
                windowWidth: 800
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${profile.fullName.replace(/\s+/g, '_')}_Resume.pdf`);

            toast.success("Resume PDF downloaded!", { id: "pdf-gen" });
        } catch (error) {
            console.error("PDF generation error:", error);
            toast.error("Failed to generate PDF", { id: "pdf-gen" });
        }
    };

    if (loading) {
        return (
            <SeekerLayout>
                <div className="flex-1 flex items-center justify-center min-h-[60vh]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-[#2D9B82] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-500 font-bold animate-pulse uppercase tracking-widest text-[10px]">Synchronizing Profile Data...</p>
                    </div>
                </div>
            </SeekerLayout>
        );
    }

    return (
        <SeekerLayout>
            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12">

                {/* Profile Header */}
                <ProfileHeader
                    profile={profile}
                    onEdit={() => handleEdit('personal')}
                />

                {/* Edit Personal Details - Only visible when editing from Header */}
                {editSection === 'personal' && (
                    <div className="mb-12 animate-in slide-in-from-top-4 duration-500">
                        <ProfileSectionCard
                            title="Edit Profile Information"
                            subtitle="Update your basic identity and contact details"
                            icon={User}
                            isEditing={true}
                            onSave={() => handleSave('Profile Information')}
                            onCancel={handleCloseEdit}
                        >
                            <div className="space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Full Name</label>
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={formData.fullName || ''}
                                            onChange={handleInputChange}
                                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-[#2D9B82]/10 focus:border-[#2D9B82] outline-none transition-all font-bold text-gray-800"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Professional Headline</label>
                                        <input
                                            type="text"
                                            name="professionalHeadline"
                                            value={formData.professionalHeadline || ''}
                                            onChange={handleInputChange}
                                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-[#2D9B82]/10 focus:border-[#2D9B82] outline-none transition-all font-bold text-gray-800"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Phone Number</label>
                                        <input
                                            type="text"
                                            name="phoneNumber"
                                            value={formData.phoneNumber || ''}
                                            onChange={handleInputChange}
                                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-[#2D9B82]/10 focus:border-[#2D9B82] outline-none transition-all font-bold text-gray-800"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Location</label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={formData.location || ''}
                                            onChange={handleInputChange}
                                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-[#2D9B82]/10 focus:border-[#2D9B82] outline-none transition-all font-bold text-gray-800"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Portfolio URL</label>
                                        <input
                                            type="text"
                                            name="portfolioUrl"
                                            value={formData.portfolioUrl || ''}
                                            onChange={handleInputChange}
                                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-[#2D9B82]/10 focus:border-[#2D9B82] outline-none transition-all font-bold text-gray-800"
                                        />
                                    </div>
                                    <div className="space-y-2 text-gray-400">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Email (Locked)</label>
                                        <div className="w-full px-5 py-3.5 bg-gray-100 border border-gray-100 rounded-2xl font-bold">
                                            {profile?.email}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ProfileSectionCard>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">

                    {/* Left Column - Main Content */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* About Section */}
                        <ProfileSectionCard
                            title="About"
                            subtitle="Last updated recently"
                            icon={Info}
                            onEdit={() => handleEdit('about')}
                            isEditing={editSection === 'about'}
                            onSave={() => handleSave('About')}
                            onCancel={handleCloseEdit}
                        >
                            <AboutSection
                                isEditing={editSection === 'about'}
                                profile={profile}
                                formData={formData}
                                handleInputChange={handleInputChange}
                            />
                        </ProfileSectionCard>

                        {/* Skills */}
                        <ProfileSectionCard
                            title="Skills"
                            subtitle="Core competencies"
                            icon={LinkIcon}
                            onEdit={() => handleEdit('skills')}
                            isEditing={editSection === 'skills'}
                            onSave={() => handleSave('Skills')}
                            onCancel={handleCloseEdit}
                        >
                            <Skills
                                isEditing={editSection === 'skills'}
                                profile={profile}
                                formData={formData}
                                handleInputChange={handleInputChange}
                            />
                        </ProfileSectionCard>

                        {/* Work Experience */}
                        <ProfileSectionCard
                            title="Work Experience"
                            subtitle="Your career timeline"
                            icon={Briefcase}
                            onEdit={() => handleEdit('experience')}
                            isEditing={editSection === 'experience'}
                            onSave={() => handleSave('Work Experience')}
                            onCancel={handleCloseEdit}
                            onAdd={() => !editSection && handleEdit('experience')}
                            addLabel="Add Experience"
                        >
                            <WorkExperience
                                isEditing={editSection === 'experience'}
                                profile={profile}
                                formData={formData}
                                onItemsChange={handleItemsChange}
                            />
                        </ProfileSectionCard>

                        {/* Education */}
                        <ProfileSectionCard
                            title="Education"
                            subtitle="Qualifications & Degrees"
                            icon={GraduationCap}
                            onEdit={() => handleEdit('education')}
                            isEditing={editSection === 'education'}
                            onSave={() => handleSave('Education')}
                            onCancel={handleCloseEdit}
                            onAdd={() => !editSection && handleEdit('education')}
                            addLabel="Add Education"
                        >
                            <Education
                                isEditing={editSection === 'education'}
                                profile={profile}
                                formData={formData}
                                onItemsChange={handleItemsChange}
                            />
                        </ProfileSectionCard>

                        {/* Projects & Portfolio */}
                        <ProfileSectionCard
                            title="Projects & Portfolio"
                            subtitle="Selected works"
                            icon={Box}
                            onEdit={() => handleEdit('projects')}
                            isEditing={editSection === 'projects'}
                            onSave={() => handleSave('Projects')}
                            onCancel={handleCloseEdit}
                        >
                            <ProjectsSection
                                isEditing={editSection === 'projects'}
                                profile={profile}
                                formData={formData}
                                onItemsChange={handleItemsChange}
                            />
                        </ProfileSectionCard>
                    </div>

                    {/* Right Column - Sidebar */}
                    <aside className="space-y-6">

                        {/* Profile Strength */}
                        <ProfileStrengthCard profile={profile} />

                        {/* Resume Management */}
                        <ResumeManagementCard
                            profile={profile}
                            onDownloadPDF={handleDownloadGeneratedCV}
                            onUploadClick={handleFileUpload}
                        />

                        {/* Job Preferences (UI Card) */}
                        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-[1rem] bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100/50">
                                    <Settings size={22} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 leading-none mb-1">Job Preferences</h3>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Target roles</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-6">
                                <span className="px-3 py-1.5 bg-gray-50 text-gray-600 text-[10px] font-black uppercase rounded-lg border border-gray-100">Remote</span>
                                <span className="px-3 py-1.5 bg-gray-50 text-gray-600 text-[10px] font-black uppercase rounded-lg border border-gray-100">Full Time</span>
                                <span className="px-3 py-1.5 bg-gray-50 text-gray-600 text-[10px] font-black uppercase rounded-lg border border-gray-100">Senior Level</span>
                                <span className="px-3 py-1.5 bg-gray-50 text-gray-600 text-[10px] font-black uppercase rounded-lg border border-gray-100">Kathmandu</span>
                            </div>
                            <button className="w-full py-3 border border-gray-200 text-gray-500 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors">
                                Edit Preferences
                            </button>
                        </div>

                        {/* Recent Activity */}
                        <RecentActivityWidget />

                        {/* Visibility */}
                        <ProfileVisibilityCard
                            isPublic={profile?.isPublic}
                            onToggle={handleTogglePublic}
                        />

                    </aside>
                </div>
            </main>

            {/* Hidden Resume Template for PDF Generation */}
            <div className="fixed -left-[2000px] top-0 pointer-events-none">
                <div ref={resumeRef} className="bg-white p-12" style={{ width: '800px', minHeight: '1131px' }}>
                    <div className="border-b-4 border-[#2D9B82] pb-8 mb-10">
                        <h1 className="text-4xl font-extrabold text-gray-900 uppercase tracking-tight mb-2">{profile?.fullName}</h1>
                        <p className="text-lg font-bold text-[#2D9B82] uppercase tracking-widest">{profile?.professionalHeadline}</p>
                        <div className="flex gap-6 mt-4 text-sm text-gray-500 font-bold">
                            <span>{profile?.email}</span>
                            <span>{profile?.phoneNumber}</span>
                            <span>{profile?.location}</span>
                        </div>
                    </div>

                    <div className="space-y-10">
                        <section>
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em] mb-4 border-l-4 border-[#2D9B82] pl-3">Professional Summary</h3>
                            <p className="text-sm text-gray-600 leading-relaxed text-justify font-medium">{profile?.bio}</p>
                        </section>

                        <section>
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em] mb-6 border-l-4 border-[#2D9B82] pl-3">Experience</h3>
                            <div className="space-y-8">
                                {profile?.workExperience?.map((exp, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h4 className="text-base font-bold text-gray-800">{exp.title}</h4>
                                            <span className="text-xs text-gray-400 font-bold">{exp.duration}</span>
                                        </div>
                                        <p className="text-sm font-bold text-[#2D9B82] mb-2">{exp.company}</p>
                                        <p className="text-xs text-gray-600 leading-relaxed text-justify font-medium whitespace-pre-line">{exp.description}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <div className="grid grid-cols-2 gap-10">
                            <section>
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em] mb-4 border-l-4 border-[#2D9B82] pl-3">Education</h3>
                                <div className="space-y-6">
                                    {profile?.education?.map((edu, i) => (
                                        <div key={i}>
                                            <h4 className="text-sm font-bold text-gray-800">{edu.degree}</h4>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-tight">{edu.institution}</p>
                                            <p className="text-[10px] text-[#2D9B82] font-black mt-1 font-mono">{edu.year}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em] mb-4 border-l-4 border-[#2D9B82] pl-3">Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {profile?.skills?.split(',').map((s, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-black uppercase text-gray-600 tracking-tighter">
                                            {s.trim()}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </SeekerLayout>
    );
};

export default ProfileManagement;
