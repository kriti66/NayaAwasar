import { useState, useEffect } from 'react';
import RecruiterLayout from '../../components/layouts/RecruiterLayout';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Mail, MapPin, Phone, Building, Calendar, User, CheckCircle } from 'lucide-react';
import EditProfileModal from '../../components/profile/EditProfileModal';
import ChangePasswordModal from '../../components/profile/ChangePasswordModal';

const RecruiterProfile = () => {
    const { user: authUser } = useAuth();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    const fetchProfileSummary = async () => {
        try {
            setLoading(true);
            const res = await api.get('/recruiter/profile-summary');
            setSummary(res.data);
        } catch (error) {
            console.error("Error fetching profile summary:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authUser) {
            fetchProfileSummary();
        }
    }, [authUser]);

    // Data shortcuts
    const user = summary?.user || authUser;
    const stats = summary?.stats || {};
    const company = summary?.company;
    const isVerified = summary?.isVerified;

    // Format date joined
    const joinedDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    }) : 'January 2024';

    // Helper for image URL
    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${import.meta.env.VITE_API_URL}${path}`;
    };

    if (loading) return (
        <div className="flex-1 flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#29a08e]"></div>
        </div>
    );

    return (
        <>
            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
                <h1 className="text-2xl font-bold text-gray-900 mb-8">Profile</h1>

                {/* Profile Header Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        {/* Avatar */}
                        <div className="w-32 h-32 bg-[#29a08e] rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-[#29a08e]/20 text-white overflow-hidden">
                            {user?.profileImage ? (
                                <img
                                    src={getImageUrl(user.profileImage)}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <User size={48} strokeWidth={1.5} />
                            )}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 w-full">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-2">
                                <h2 className="text-2xl font-bold text-gray-900">{user?.fullName || 'Recruiter Name'}</h2>

                                {/* Verification Badge - Backend Driven */}
                                {isVerified ? (
                                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-200">
                                        <CheckCircle size={14} /> Verified
                                    </span>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-gray-200">
                                            Not Verified
                                        </span>
                                        {/* Optional: Show why */}
                                        {(!summary?.verificationDetails?.recruiterKyc || summary?.verificationDetails?.recruiterKyc !== 'approved') && (
                                            <span className="text-xs text-red-500 font-bold"> - Recruiter KYC Incomplete</span>
                                        )}
                                        {(summary?.verificationDetails?.recruiterKyc === 'approved' && summary?.verificationDetails?.companyStatus !== 'approved') && (
                                            <span className="text-xs text-yellow-600 font-bold"> - Company Profile Pending</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            <p className="text-gray-500 font-medium mb-6">
                                {user?.professionalHeadline || user?.role || 'Senior Recruiter'} at <span className="text-gray-900 font-semibold">{company?.name || 'Naya Awasar'}</span>
                            </p>

                            <div className="flex gap-4 mb-8">
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="px-6 py-2.5 bg-[#29a08e] text-white text-sm font-bold rounded-lg hover:bg-[#228377] transition-colors shadow-sm shadow-[#29a08e]/20"
                                >
                                    Edit Profile
                                </button>
                                <button
                                    onClick={() => setIsPasswordModalOpen(true)}
                                    className="px-6 py-2.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors border border-gray-200"
                                >
                                    Change Password
                                </button>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#29a08e] flex items-center justify-center shrink-0">
                                        <Mail size={20} />
                                    </div>
                                    <div>
                                        <span className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Email</span>
                                        <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#29a08e] flex items-center justify-center shrink-0">
                                        <Phone size={20} />
                                    </div>
                                    <div>
                                        <span className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Phone</span>
                                        <p className="text-sm font-medium text-gray-900">{user?.phoneNumber || 'Not provided'}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#29a08e] flex items-center justify-center shrink-0">
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <span className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Location</span>
                                        <p className="text-sm font-medium text-gray-900">{user?.location || 'Not provided'}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#29a08e] flex items-center justify-center shrink-0">
                                        <Building size={20} />
                                    </div>
                                    <div>
                                        <span className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Company</span>
                                        <p className="text-sm font-medium text-gray-900">{company?.name || 'Not Linked'}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#29a08e] flex items-center justify-center shrink-0">
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <span className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Joined</span>
                                        <p className="text-sm font-medium text-gray-900">{joinedDate}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="text-4xl font-bold text-gray-900 mb-1">{stats.totalJobs || 0}</div>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Jobs Posted</div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="text-4xl font-bold text-gray-900 mb-1">{stats.activeJobs || 0}</div>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Active Listings</div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="text-4xl font-bold text-gray-900 mb-1">{stats.totalApplications || 0}</div>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Applications</div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="text-4xl font-bold text-gray-900 mb-1">{stats.successfulHires || 0}</div>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Successful Hires</div>
                    </div>
                </div>
            </main>

            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                user={user}
                onUpdate={fetchProfileSummary}
            />

            <ChangePasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
            />
        </>
    );
};

export default RecruiterProfile;
