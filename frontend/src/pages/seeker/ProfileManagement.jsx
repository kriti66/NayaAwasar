import React, { useState, useEffect } from 'react';
import { User, Mail, Briefcase, GraduationCap, Link as LinkIcon, Box, Info, Settings } from 'lucide-react';
import SeekerLayout from '../../components/layouts/SeekerLayout';
import profileService from '../../services/profileService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

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
    const [isGenerating, setIsGenerating] = useState(false);

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
            if (result.success) { // Assuming result returns the updated profile or similar
                // If result is the profile object itself (based on backend controller logic usually returning updated profile)
                // logic in controller: res.json(profile);
                setProfile(result);
                setEditSection(null);
                toast.success(`${sectionLabel} updated!`, { id: "save-profile" });
            } else {
                // Fallback if structure is different
                setProfile(result);
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
            const result = await profileService.updateVisibility(isPublic);
            if (result) {
                setProfile(prev => ({ ...prev, visibleToRecruiters: result.visible }));
                toast.success(`Profile visibility set to ${result.visible ? 'Public' : 'Private'}`);
            }
        } catch (error) {
            toast.error("Failed to update visibility");
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('resume', file); // Field name must match backend 'upload.single("resume")'
        try {
            toast.loading("Uploading resume...", { id: "upload" });
            const res = await profileService.uploadResume(uploadData);
            // res is expected to be the resume object: { fileUrl, fileName, ... }
            if (res) {
                setProfile(prev => ({ ...prev, resume: res }));
                toast.success("Resume uploaded successfully!", { id: "upload" });
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to upload resume", { id: "upload" });
        }
    };

    const handleAutoGenerateCV = async () => {
        setIsGenerating(true);
        try {
            toast.loading("Syncing profile data to CV...", { id: "cv-gen" });
            const res = await profileService.generateCV();
            // Expected response: { success: true, resume: { ... } }
            if (res.success && res.resume) {
                setProfile(prev => ({ ...prev, resume: res.resume }));
                toast.success("CV synchronized with your latest profile changes!", { id: "cv-gen" });
            }
        } catch (error) {
            console.error("CV Gen error:", error);
            toast.error("Failed to generate CV", { id: "cv-gen" });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadResume = async () => {
        try {
            const blob = await profileService.downloadResume();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', profile?.resume?.fileName || 'resume.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success("Download started");
        } catch (error) {
            console.error("Download error:", error);
            toast.error("Failed to download resume");
        }
    };

    if (loading) {
        return (
            <SeekerLayout>
                <div className="flex-1 flex items-center justify-center min-h-[60vh]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-[#29a08e] border-t-transparent rounded-full animate-spin"></div>
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
                                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-[#29a08e]/10 focus:border-[#29a08e] outline-none transition-all font-bold text-gray-800"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Professional Headline</label>
                                        <input
                                            type="text"
                                            name="professionalHeadline"
                                            value={formData.professionalHeadline || ''}
                                            onChange={handleInputChange}
                                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-[#29a08e]/10 focus:border-[#29a08e] outline-none transition-all font-bold text-gray-800"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Phone Number</label>
                                        <input
                                            type="text"
                                            name="phoneNumber"
                                            value={formData.phoneNumber || ''}
                                            onChange={handleInputChange}
                                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-[#29a08e]/10 focus:border-[#29a08e] outline-none transition-all font-bold text-gray-800"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Location</label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={formData.location || ''}
                                            onChange={handleInputChange}
                                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-[#29a08e]/10 focus:border-[#29a08e] outline-none transition-all font-bold text-gray-800"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Portfolio URL</label>
                                        <input
                                            type="text"
                                            name="portfolioUrl"
                                            value={formData.portfolioUrl || ''}
                                            onChange={handleInputChange}
                                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-[#29a08e]/10 focus:border-[#29a08e] outline-none transition-all font-bold text-gray-800"
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
                            onDownloadPDF={handleDownloadResume}
                            onUploadClick={handleFileUpload}
                            onAutoGenerate={handleAutoGenerateCV}
                            isGenerating={isGenerating}
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
                            isPublic={profile?.visibleToRecruiters}
                            onToggle={handleTogglePublic}
                        />

                    </aside>
                </div>
            </main>
        </SeekerLayout>
    );
};

export default ProfileManagement;
