import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

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
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 overflow-auto p-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">My Profile</h1>
                    <button
                        onClick={() => { if (isEditing) handleUpdate(); else setIsEditing(true); }}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        {isEditing ? 'Save Changes' : 'Edit Profile'}
                    </button>
                </div>

                <div className="bg-white shadow rounded-lg p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <input type="text" value={profile.name || user?.name || ''} disabled className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input type="email" value={profile.email || user?.email || ''} disabled className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Location</label>
                            <input
                                type="text"
                                value={isEditing ? editForm.location : (profile.location || '')}
                                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                disabled={!isEditing}
                                className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 ${!isEditing ? 'bg-gray-50' : ''}`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Skills</label>
                            <input
                                type="text"
                                value={isEditing ? editForm.skills : (profile.skills || '')}
                                onChange={(e) => setEditForm({ ...editForm, skills: e.target.value })}
                                disabled={!isEditing}
                                placeholder="Comma separated, e.g. React, Node.js"
                                className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 ${!isEditing ? 'bg-gray-50' : ''}`}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Bio</label>
                            <textarea
                                rows="3"
                                value={isEditing ? editForm.bio : (profile.bio || '')}
                                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                disabled={!isEditing}
                                className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 ${!isEditing ? 'bg-gray-50' : ''}`}
                            ></textarea>
                        </div>
                        <div className="col-span-2 border-t pt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Resume/CV</label>
                            <div className="flex items-center space-x-4">
                                {profile.resume_url ? (
                                    <a
                                        href={`http://localhost:5000${profile.resume_url}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-blue-600 hover:text-blue-800 underline"
                                    >
                                        View Current Resume
                                    </a>
                                ) : (
                                    <span className="text-gray-500">No resume uploaded.</span>
                                )}
                                <div>
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        onChange={handleFileChange}
                                        className="ml-5 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SeekerProfile;
