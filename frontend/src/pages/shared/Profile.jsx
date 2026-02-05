import { useState, useEffect, useRef } from 'react';
import DashboardNavbar from '../../components/dashboard/DashboardNavbar';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const Profile = () => {
    const { user, refreshUser } = useAuth();
    const [profile, setProfile] = useState({});
    const [loading, setLoading] = useState(true);
    const [editingSection, setEditingSection] = useState(null); // 'personal', 'contact', 'experience', 'education', 'skills', 'public'
    const [toast, setToast] = useState({ show: false, message: '', type: '' });

    // Shared Form State
    const [formData, setFormData] = useState({
        fullName: '',
        professionalHeadline: '',
        bio: '',
        phoneNumber: '',
        location: '',
        linkedinUrl: '',
        portfolioUrl: '',
        workExperience: [],
        education: [],
        skills: '',
        isPublic: true
    });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
    };

    const fetchProfile = async () => {
        try {
            const res = await api.get('/users/me');
            const data = res.data || {};
            setProfile(data);
            setFormData({
                fullName: data.fullName || '',
                professionalHeadline: data.professionalHeadline || '',
                bio: data.bio || '',
                phoneNumber: data.phoneNumber || '',
                location: data.location || '',
                linkedinUrl: data.linkedinUrl || '',
                portfolioUrl: data.portfolioUrl || '',
                workExperience: data.workExperience || [],
                education: data.education || [],
                skills: data.skills || '',
                isPublic: data.isPublic !== undefined ? data.isPublic : true
            });
        } catch (error) {
            console.error("Error fetching profile", error);
            showToast("Failed to load profile", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleUpdate = async (section) => {
        try {
            setLoading(true);
            await api.put('/users/me', formData);
            await fetchProfile();
            await refreshUser();
            setEditingSection(null);
            showToast(`${section} updated successfully!`);
        } catch (error) {
            showToast(error.response?.data?.message || "Update failed", "error");
        } finally {
            setLoading(false);
        }
    };

    // Helper to add/remove array items
    const handleArrayChange = (field, index, subfield, value) => {
        const newData = [...formData[field]];
        newData[index][subfield] = value;
        setFormData(prev => ({ ...prev, [field]: newData }));
    };

    const addArrayItem = (field, template) => {
        setFormData(prev => ({ ...prev, [field]: [...prev[field], template] }));
    };

    const removeArrayItem = (field, index) => {
        const newData = [...formData[field]];
        newData.splice(index, 1);
        setFormData(prev => ({ ...prev, [field]: newData }));
    };

    if (loading && !profile.fullName) {
        return (
            <div className="flex h-screen bg-white items-center justify-center">
                <div className="animate-pulse space-y-4 text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full mx-auto"></div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#FDFEFE] font-sans selection:bg-blue-100 selection:text-blue-900">
            <DashboardNavbar />

            <div className="flex-1 flex flex-col w-full">
                {/* Header */}
                <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-10 sticky top-0 z-30">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Management /</span>
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-widest">Profile & Resume</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white shadow-sm overflow-hidden">
                            {profile.profileImage && <img src={`${import.meta.env.VITE_API_URL}${profile.profileImage}`} className="w-full h-full object-cover" />}
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-10 max-w-7xl mx-auto w-full">
                    <h1 className="text-3xl font-black text-slate-900 mb-10 tracking-tight">Profile & Resume Management</h1>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                        {/* LEFT COLUMN: Main Profile Sections */}
                        <div className="xl:col-span-2 space-y-8">

                            {/* Personal Details */}
                            <section className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm group hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-50">
                                    <h2 className="text-lg font-bold text-slate-900">Personal Details</h2>
                                    <button
                                        onClick={() => setEditingSection('personal')}
                                        className="text-xs font-bold text-slate-400 hover:text-blue-600 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        Edit
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</p>
                                        <p className="text-sm font-semibold text-slate-800">{profile.fullName}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Professional Headline</p>
                                        <p className="text-sm font-semibold text-slate-800 text-blue-600">{profile.professionalHeadline || 'Add a headline...'}</p>
                                    </div>
                                    <div className="md:col-span-2 space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">About Me</p>
                                        <p className="text-sm font-medium text-slate-500 leading-relaxed whitespace-pre-wrap">
                                            {profile.bio || 'Share a bit about your professional journey...'}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Contact Information */}
                            <section className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm group hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-50">
                                    <h2 className="text-lg font-bold text-slate-900">Contact Information</h2>
                                    <button
                                        onClick={() => setEditingSection('contact')}
                                        className="text-xs font-bold text-slate-400 hover:text-blue-600 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        Edit
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</p>
                                        <p className="text-sm font-semibold text-slate-800">{profile.email}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone Number</p>
                                        <p className="text-sm font-semibold text-slate-800">{profile.phoneNumber || 'Not provided'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">LinkedIn Profile</p>
                                        {profile.linkedinUrl ? (
                                            <a href={profile.linkedinUrl} target="_blank" className="text-sm font-semibold text-blue-600 truncate block">Profile Link</a>
                                        ) : (
                                            <p className="text-sm font-medium text-slate-400 italic">Not added</p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Portfolio URL</p>
                                        {profile.portfolioUrl ? (
                                            <a href={profile.portfolioUrl} target="_blank" className="text-sm font-semibold text-blue-600 truncate block">Example URL</a>
                                        ) : (
                                            <p className="text-sm font-medium text-slate-400 italic">Not added</p>
                                        )}
                                    </div>
                                </div>
                            </section>

                            {/* Work Experience */}
                            <section className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm group hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-50">
                                    <h2 className="text-lg font-bold text-slate-900">Work Experience</h2>
                                    <button
                                        onClick={() => setEditingSection('experience')}
                                        className="text-xs font-bold text-slate-400 hover:text-blue-600 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        Edit
                                    </button>
                                </div>
                                <div className="space-y-8">
                                    {profile.workExperience?.length > 0 ? profile.workExperience.map((exp, i) => (
                                        <div key={i} className="relative pl-6 border-l-2 border-slate-100 py-2">
                                            <div className="absolute top-0 left-[-7px] w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow-sm"></div>
                                            <h4 className="text-sm font-bold text-slate-900">{exp.title} at {exp.company}</h4>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">{exp.duration}</p>
                                            <p className="text-sm text-slate-500 mt-3 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                                        </div>
                                    )) : (
                                        <p className="text-sm text-slate-400 italic py-4">No work experience added yet.</p>
                                    )}
                                </div>
                            </section>

                            {/* Education */}
                            <section className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm group hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-50">
                                    <h2 className="text-lg font-bold text-slate-900">Education</h2>
                                    <button
                                        onClick={() => setEditingSection('education')}
                                        className="text-xs font-bold text-slate-400 hover:text-blue-600 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        Edit
                                    </button>
                                </div>
                                <div className="space-y-6">
                                    {profile.education?.length > 0 ? profile.education.map((edu, i) => (
                                        <div key={i} className="flex gap-4">
                                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                                                🎓
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-900">{edu.degree}</h4>
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">{edu.institution} ({edu.year})</p>
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-sm text-slate-400 italic py-4">No education history added yet.</p>
                                    )}
                                </div>
                            </section>

                            {/* Skills Tagged */}
                            <section className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm group hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-50">
                                    <h2 className="text-lg font-bold text-slate-900">Skills</h2>
                                    <button
                                        onClick={() => setEditingSection('skills')}
                                        className="text-xs font-bold text-slate-400 hover:text-blue-600 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        Edit
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {profile.skills ? profile.skills.split(',').map((skill, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-blue-50/50 text-blue-600 rounded-lg text-xs font-bold border border-blue-100">
                                            {skill.trim()}
                                        </span>
                                    )) : (
                                        <p className="text-sm text-slate-400 italic">Mention your key technical or soft skills...</p>
                                    )}
                                </div>
                            </section>

                            {/* Public Profile Settings */}
                            <section className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm group hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900">Public Profile Settings</h2>
                                        <p className="text-xs text-slate-400 font-medium mt-1">Manage who can view your professional profile.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="isPublic"
                                            checked={formData.isPublic}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                setFormData(prev => ({ ...prev, isPublic: checked }));
                                                // Immediate update for toggle
                                                api.put('/users/me', { isPublic: checked });
                                            }}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                                <p className="text-xs font-bold text-slate-600">Your profile is currently {formData.isPublic ? 'visible to recruiters and employers' : 'private'}.</p>
                            </section>
                        </div>

                        {/* RIGHT COLUMN: Resume Preview Column */}
                        <div className="space-y-8">
                            <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm sticky top-24">
                                <h2 className="text-lg font-bold text-slate-900 mb-8 border-b border-slate-50 pb-4">Resume Preview</h2>

                                <div className="bg-slate-50/30 border border-slate-100 rounded-xl p-6 min-h-[600px] text-[11px] leading-relaxed text-slate-500 font-mono overflow-y-auto custom-scrollbar">
                                    <div className="mb-4">
                                        <p className="font-bold text-slate-900 text-sm mb-1">{profile.fullName}</p>
                                        <p className="font-bold">{profile.professionalHeadline || 'Your Professional Headline'}</p>
                                        <p>{profile.email} | {profile.phoneNumber || '+0 (000) 000-0000'}</p>
                                        <p>{profile.linkedinUrl || 'LinkedIn URL'} | {profile.portfolioUrl || 'Portfolio URL'}</p>
                                    </div>

                                    <div className="mb-4">
                                        <p className="font-bold text-slate-900 border-b border-slate-200 mb-2 py-1 uppercase tracking-widest text-[10px]">--- About Me ---</p>
                                        <p>{profile.bio || 'Your bio will appear here...'}</p>
                                    </div>

                                    <div className="mb-4">
                                        <p className="font-bold text-slate-900 border-b border-slate-200 mb-2 py-1 uppercase tracking-widest text-[10px]">--- Experience ---</p>
                                        {profile.workExperience?.length > 0 ? profile.workExperience.map((exp, i) => (
                                            <div key={i} className="mb-3">
                                                <p className="font-bold text-slate-700">{exp.title} at {exp.company}</p>
                                                <p className="italic text-[10px]">{exp.duration}</p>
                                                <p className="mt-1">{exp.description}</p>
                                            </div>
                                        )) : <p>Professional experience details...</p>}
                                    </div>

                                    <div className="mb-4">
                                        <p className="font-bold text-slate-900 border-b border-slate-200 mb-2 py-1 uppercase tracking-widest text-[10px]">--- Education ---</p>
                                        {profile.education?.length > 0 ? profile.education.map((edu, i) => (
                                            <div key={i} className="mb-2">
                                                <p className="font-bold text-slate-700">{edu.degree}</p>
                                                <p>{edu.institution} ({edu.year})</p>
                                            </div>
                                        )) : <p>Academic background details...</p>}
                                    </div>

                                    <div>
                                        <p className="font-bold text-slate-900 border-b border-slate-200 mb-2 py-1 uppercase tracking-widest text-[10px]">--- Skills ---</p>
                                        <p>{profile.skills || 'Technical skills and expertise...'}</p>
                                    </div>
                                </div>

                                <div className="mt-8 space-y-3">
                                    <button className="w-full py-4 text-xs font-black text-slate-500 hover:text-blue-600 flex items-center justify-center gap-2 border border-slate-100 rounded-xl hover:bg-blue-50 transition-all">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        Download Current Resume
                                    </button>
                                    <button className="w-full py-4 bg-blue-600 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                        Upload New Resume
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* MODALS FOR EDITING */}
                {editingSection && (
                    <div className="fixed inset-0 z-[100] bg-[#0F172A]/80 backdrop-blur-md flex items-center justify-center p-6 sm:p-10 animate-in fade-in duration-300">
                        <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Edit {editingSection}</h3>
                                <button onClick={() => setEditingSection(null)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400">✕</button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                                {/* Conditional form fields based on editingSection */}
                                {editingSection === 'personal' && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Full Name</label>
                                            <input name="fullName" value={formData.fullName} onChange={handleChange} className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-semibold" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Professional Headline</label>
                                            <input name="professionalHeadline" value={formData.professionalHeadline} onChange={handleChange} className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-semibold" placeholder="e.g. Senior Software Engineer | Full-stack Developer" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Bio (Max 500 chars)</label>
                                            <textarea name="bio" value={formData.bio} onChange={handleChange} rows="5" className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-semibold resize-none" maxLength="500"></textarea>
                                        </div>
                                    </>
                                )}

                                {editingSection === 'contact' && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Phone Number</label>
                                            <input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-semibold" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">LinkedIn URL</label>
                                            <input name="linkedinUrl" value={formData.linkedinUrl} onChange={handleChange} className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-semibold" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Portfolio/Portfolio Website</label>
                                            <input name="portfolioUrl" value={formData.portfolioUrl} onChange={handleChange} className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-semibold" />
                                        </div>
                                    </>
                                )}

                                {editingSection === 'experience' && (
                                    <div className="space-y-10">
                                        {formData.workExperience.map((exp, i) => (
                                            <div key={i} className="p-6 bg-slate-50/50 border border-slate-100 rounded-2xl relative space-y-4">
                                                <button onClick={() => removeArrayItem('workExperience', i)} className="absolute top-4 right-4 text-rose-500 font-bold text-xs uppercase hover:underline">Remove</button>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-black text-slate-400 tracking-widest uppercase">Job Title</label>
                                                        <input value={exp.title} onChange={(e) => handleArrayChange('workExperience', i, 'title', e.target.value)} className="w-full p-3 rounded-lg border border-slate-100 focus:border-blue-500 text-sm font-bold" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-black text-slate-400 tracking-widest uppercase">Company</label>
                                                        <input value={exp.company} onChange={(e) => handleArrayChange('workExperience', i, 'company', e.target.value)} className="w-full p-3 rounded-lg border border-slate-100 focus:border-blue-500 text-sm font-bold" />
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-black text-slate-400 tracking-widest uppercase">Duration (e.g. Jan 2020 - Present)</label>
                                                    <input value={exp.duration} onChange={(e) => handleArrayChange('workExperience', i, 'duration', e.target.value)} className="w-full p-3 rounded-lg border border-slate-100 focus:border-blue-500 text-sm font-bold" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-black text-slate-400 tracking-widest uppercase">Description</label>
                                                    <textarea value={exp.description} onChange={(e) => handleArrayChange('workExperience', i, 'description', e.target.value)} className="w-full p-3 rounded-lg border border-slate-100 focus:border-blue-500 text-sm font-medium resize-none" rows="3"></textarea>
                                                </div>
                                            </div>
                                        ))}
                                        <button onClick={() => addArrayItem('workExperience', { title: '', company: '', duration: '', description: '' })} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:bg-slate-50 hover:border-blue-200 hover:text-blue-500 transition-all text-sm">+ Add Experience</button>
                                    </div>
                                )}

                                {editingSection === 'education' && (
                                    <div className="space-y-10">
                                        {formData.education.map((edu, i) => (
                                            <div key={i} className="p-6 bg-slate-50/50 border border-slate-100 rounded-2xl relative space-y-4">
                                                <button onClick={() => removeArrayItem('education', i)} className="absolute top-4 right-4 text-rose-500 font-bold text-xs uppercase hover:underline">Remove</button>
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-black text-slate-400 tracking-widest uppercase">Degree / Course</label>
                                                    <input value={edu.degree} onChange={(e) => handleArrayChange('education', i, 'degree', e.target.value)} className="w-full p-3 rounded-lg border border-slate-100 focus:border-blue-500 text-sm font-bold" />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-black text-slate-400 tracking-widest uppercase">Institution</label>
                                                        <input value={edu.institution} onChange={(e) => handleArrayChange('education', i, 'institution', e.target.value)} className="w-full p-3 rounded-lg border border-slate-100 focus:border-blue-500 text-sm font-bold" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-black text-slate-400 tracking-widest uppercase">Year</label>
                                                        <input value={edu.year} onChange={(e) => handleArrayChange('education', i, 'year', e.target.value)} className="w-full p-3 rounded-lg border border-slate-100 focus:border-blue-500 text-sm font-bold" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <button onClick={() => addArrayItem('education', { degree: '', institution: '', year: '' })} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:bg-slate-50 hover:border-blue-200 hover:text-blue-500 transition-all text-sm">+ Add Education History</button>
                                    </div>
                                )}

                                {editingSection === 'skills' && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Skills (Comma separated)</label>
                                        <textarea name="skills" value={formData.skills} onChange={handleChange} rows="4" className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-semibold resize-none" placeholder="React, Node.js, Project Management, Figma..."></textarea>
                                        <p className="text-[10px] text-slate-400 font-medium">Adding skills helps our algorithm match you with the best roles.</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
                                <button onClick={() => setEditingSection(null)} className="flex-1 py-4 font-black text-slate-400 hover:text-slate-600 transition-all text-sm">Dismiss</button>
                                <button onClick={() => handleUpdate(editingSection)} className="flex-[2] py-4 bg-blue-600 text-white rounded-xl font-black shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all text-sm">Save Changes</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
