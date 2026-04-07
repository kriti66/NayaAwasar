import { useState, useEffect } from 'react';
import RecruiterLayout from '../../components/layouts/RecruiterLayout';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Mail, MapPin, Phone, Building, Calendar, User, CheckCircle, Shield, Edit3, Lock } from 'lucide-react';
import EditProfileModal from '../../components/profile/EditProfileModal';
import { resolveAssetUrl } from '../../utils/assetUrl';
import { useNavigate } from 'react-router-dom';

const RecruiterProfile = () => {
    const { user: authUser } = useAuth();
    const navigate = useNavigate();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

    const user = summary?.user || authUser;
    const stats = summary?.stats || {};
    const company = summary?.company;
    const isVerified = summary?.isVerified;

    const joinedDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    }) : 'January 2024';

    const getImageUrl = (path) => {
        if (!path) return null;
        return resolveAssetUrl(path);
    };

    if (loading) return (
        <div className="flex-1 flex items-center justify-center min-h-screen bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#29a08e]/30 border-t-[#29a08e] mx-auto mb-4"></div>
                <p className="text-sm font-bold text-gray-400">Loading profile...</p>
            </div>
        </div>
    );

    return (
        <>
            {/* ─── Hero Header ─────────────────────────────── */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#0d2f2b] to-slate-900 pt-12 pb-40 px-4 sm:px-6 lg:px-8">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-[#29a08e] rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-400 rounded-full blur-3xl"></div>
                </div>
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

                <div className="relative max-w-7xl mx-auto">
                    <div className="text-white animate-fade-in-up">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-sm font-medium text-gray-200 backdrop-blur-sm mb-4">
                            <User size={14} />
                            Recruiter Profile
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
                            My <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#29a08e] to-teal-300">Profile</span>
                        </h1>
                        <p className="text-gray-300 text-lg">Manage your personal information and settings</p>
                    </div>
                </div>


            </div>

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 -mt-24 pb-16 relative z-10">
                {/* Profile Header Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#29a08e]/5 to-transparent rounded-full -translate-y-32 translate-x-32"></div>
                    
                    <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                        {/* Avatar */}
                        <div className="w-32 h-32 bg-gradient-to-br from-[#29a08e] to-teal-700 rounded-2xl flex items-center justify-center shrink-0 shadow-xl shadow-[#29a08e]/20 text-white overflow-hidden border-4 border-white">
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
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">{user?.fullName || 'Recruiter Name'}</h2>

                                {isVerified ? (
                                    <span className="inline-flex items-center gap-1.5 bg-[#29a08e]/10 text-[#29a08e] text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border border-[#29a08e]/20">
                                        <CheckCircle size={14} /> Verified
                                    </span>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border border-gray-200">
                                            <Shield size={14} /> Not Verified
                                        </span>
                                        {(!summary?.verificationDetails?.recruiterKyc || summary?.verificationDetails?.recruiterKyc !== 'approved') && (
                                            <span className="text-[10px] text-rose-500 font-black uppercase tracking-wider">KYC Incomplete</span>
                                        )}
                                        {(summary?.verificationDetails?.recruiterKyc === 'approved' && summary?.verificationDetails?.companyStatus !== 'approved') && (
                                            <span className="text-[10px] text-amber-600 font-black uppercase tracking-wider">Company Pending</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            <p className="text-gray-500 font-medium mb-6">
                                {user?.professionalHeadline || user?.role || 'Senior Recruiter'} at <span className="text-gray-900 font-bold">{company?.name || 'Naya Awasar'}</span>
                            </p>

                            <div className="flex gap-3 mb-8">
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#29a08e] text-white text-sm font-bold rounded-xl hover:bg-[#228377] transition-all shadow-lg shadow-[#29a08e]/20 active:scale-95"
                                >
                                    <Edit3 size={16} />
                                    Edit Profile
                                </button>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-12">
                                {[
                                    { icon: <Mail size={18} />, label: 'Email', value: user?.email },
                                    { icon: <Phone size={18} />, label: 'Phone', value: user?.phoneNumber || 'Not provided' },
                                    { icon: <MapPin size={18} />, label: 'Location', value: user?.location || 'Not provided' },
                                    { icon: <Building size={18} />, label: 'Company', value: company?.name || 'Not Linked' },
                                    { icon: <Calendar size={18} />, label: 'Joined', value: joinedDate },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-4 group">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#29a08e]/10 to-teal-50 text-[#29a08e] flex items-center justify-center shrink-0 group-hover:shadow-md transition-shadow">
                                            {item.icon}
                                        </div>
                                        <div>
                                            <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{item.label}</span>
                                            <p className="text-sm font-bold text-gray-900">{item.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { value: stats.totalJobs || 0, label: 'Total Jobs Posted', icon: '💼', gradient: 'from-[#29a08e]/5 to-teal-50' },
                        { value: stats.activeJobs || 0, label: 'Active Listings', icon: '🟢', gradient: 'from-emerald-50 to-green-50' },
                        { value: stats.totalApplications || 0, label: 'Total Applications', icon: '📩', gradient: 'from-blue-50 to-indigo-50' },
                        { value: stats.successfulHires || 0, label: 'Successful Hires', icon: '🏆', gradient: 'from-amber-50 to-yellow-50' },
                    ].map((stat, i) => (
                        <div key={i} className={`bg-gradient-to-br ${stat.gradient} p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-[#29a08e]/20 transition-all duration-300 hover:-translate-y-0.5`}>
                            <div className="text-2xl mb-3">{stat.icon}</div>
                            <div className="text-3xl font-black text-gray-900 mb-1">{stat.value}</div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-black text-gray-900">Password & Security</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Update your password regularly to keep your account safe.
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/recruiter/change-password')}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0a9e8f] text-white font-semibold hover:bg-[#088579] transition-colors"
                        >
                            <Lock size={16} />
                            Change Password
                        </button>
                    </div>
                </div>
            </main>

            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                user={user}
                onUpdate={fetchProfileSummary}
            />
        </>
    );
};

export default RecruiterProfile;
