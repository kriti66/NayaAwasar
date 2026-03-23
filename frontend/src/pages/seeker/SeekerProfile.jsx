import { useState, useEffect } from 'react';
import DashboardNavbar from '../../components/dashboard/DashboardNavbar';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { API_BASE_URL } from '../../config/api';

const SeekerProfile = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ bio: '', location: '', skills: '' });
    const [loading, setLoading] = useState(true);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/profile');
            setProfile(res.data || {});
            setEditForm({
                bio: res.data?.bio || '',
                location: res.data?.location || '',
                skills: res.data?.skills || ''
            });
        } catch (error) {
            console.error("Error fetching profile", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('cv', file);

        try {
            await api.post('/upload/cv', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('CV uploaded successfully!');
            fetchProfile(); // Refresh
        } catch (error) {
            console.error("Upload failed", error);
            alert('CV upload failed');
        }
    };

    const handleUpdate = async () => {
        try {
            await api.put('/profile', editForm);
            alert("Profile updated successfully!");
            setIsEditing(false);
            fetchProfile();
        } catch (error) {
            console.error(error);
            alert("Failed to update profile");
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="min-h-screen flex flex-col bg-[#f9fafb]">
            <DashboardNavbar />
            <div className="flex-1 w-full">
                <main className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
                    <div className="flex items-center justify-between mb-12">
                        <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight italic">
                            My <span className="text-[#29a08e]">Profile</span>
                        </h1>
                        <button
                            onClick={() => { if (isEditing) handleUpdate(); else setIsEditing(true); }}
                            className="px-8 py-4 bg-[#29a08e] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#228377] transition-all shadow-xl shadow-[#29a08e]/20 transform active:scale-95"
                        >
                            {isEditing ? 'Save Changes' : 'Edit Profile'}
                        </button>
                    </div>

                    <div className="bg-white rounded-[3rem] shadow-2xl shadow-gray-200/50 border border-gray-50 overflow-hidden">
                        <div className="p-12 space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                            <div className="h-2 w-2 rounded-full bg-[#29a08e]/40"></div>
                                        </div>
                                        <input
                                            type="text"
                                            value={profile.name || user?.name || ''}
                                            disabled
                                            className="block w-full pl-12 pr-6 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl text-sm font-black text-gray-400 cursor-not-allowed italic"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Terminal</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                            <div className="h-2 w-2 rounded-full bg-[#29a08e]/40"></div>
                                        </div>
                                        <input
                                            type="email"
                                            value={profile.email || user?.email || ''}
                                            disabled
                                            className="block w-full pl-12 pr-6 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl text-sm font-black text-gray-400 cursor-not-allowed italic"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Current Location</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={isEditing ? editForm.location : (profile.location || '')}
                                            onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                            disabled={!isEditing}
                                            placeholder="e.g. Kathmandu, Nepal"
                                            className={`block w-full px-6 py-4 rounded-2xl text-sm font-black transition-all outline-none border-2 
                                                ${isEditing
                                                    ? 'bg-white border-[#29a08e] text-gray-900 shadow-lg shadow-[#29a08e]/5'
                                                    : 'bg-gray-50 border-gray-50 text-gray-900'}`}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Skill Matrix</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={isEditing ? editForm.skills : (profile.skills || '')}
                                            onChange={(e) => setEditForm({ ...editForm, skills: e.target.value })}
                                            disabled={!isEditing}
                                            placeholder="React, Node.js, Python..."
                                            className={`block w-full px-6 py-4 rounded-2xl text-sm font-black transition-all outline-none border-2 
                                                ${isEditing
                                                    ? 'bg-white border-[#29a08e] text-gray-900 shadow-lg shadow-[#29a08e]/5'
                                                    : 'bg-gray-50 border-gray-50 text-gray-900'}`}
                                        />
                                    </div>
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Professional Bio</label>
                                    <textarea
                                        rows="4"
                                        value={isEditing ? editForm.bio : (profile.bio || '')}
                                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                        disabled={!isEditing}
                                        placeholder="Tell us about your professional journey..."
                                        className={`block w-full px-6 py-4 rounded-2xl text-sm font-black transition-all outline-none border-2 resize-none
                                            ${isEditing
                                                ? 'bg-white border-[#29a08e] text-gray-900 shadow-lg shadow-[#29a08e]/5'
                                                : 'bg-gray-50 border-gray-50 text-gray-900'}`}
                                    ></textarea>
                                </div>

                                <div className="col-span-2 pt-10 border-t border-gray-50">
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-gray-50/50 p-8 rounded-[2rem] border border-gray-100">
                                        <div className="flex items-center gap-6">
                                            <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center text-[#29a08e] border border-gray-100 shadow-sm font-black">PDF</div>
                                            <div>
                                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Resume / CV File</h4>
                                                {profile.resume_url ? (
                                                    <a
                                                        href={`${API_BASE_URL}${profile.resume_url}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-xs font-black text-[#29a08e] hover:text-[#228377] underline underline-offset-4 decoration-2 uppercase tracking-widest italic"
                                                    >
                                                        Current_Manifest_v1.0.pdf
                                                    </a>
                                                ) : (
                                                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest italic">No File Uploaded</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="relative group">
                                            <input
                                                type="file"
                                                accept=".pdf,.doc,.docx"
                                                onChange={handleFileChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            <div className="px-8 py-3 bg-white border-2 border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-900 rounded-xl group-hover:bg-gray-900 group-hover:text-white group-hover:border-gray-900 transition-all duration-300 shadow-sm flex items-center gap-3">
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                </svg>
                                                Upload New File
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SeekerProfile;
