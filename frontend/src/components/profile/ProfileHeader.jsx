import React from 'react';
import { MapPin, Globe, Edit2 } from 'lucide-react';

const ProfileHeader = ({ profile, onEdit }) => {
    const completion = profile?.profileCompletion || 0;

    return (
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden mb-8">
            {/* Cover Photo Placeholder */}
            <div className="h-32 bg-gradient-to-r from-[#2D9B82] to-[#A5C9CA] opacity-20"></div>

            <div className="px-8 pb-8">
                <div className="relative flex flex-col md:flex-row md:items-end gap-6 -mt-12 mb-6">
                    {/* Avatar */}
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-[2rem] bg-white p-1.5 shadow-xl border border-gray-100 overflow-hidden">
                            {profile?.profileImage ? (
                                <img
                                    src={profile.profileImage}
                                    className="w-full h-full object-cover rounded-[1.75rem]"
                                    alt={profile.fullName}
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-50 flex items-center justify-center text-4xl font-bold text-gray-300 rounded-[1.75rem]">
                                    {profile?.fullName?.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div className="absolute bottom-2 right-2 w-6 h-6 bg-[#2D9B82] border-4 border-white rounded-full"></div>
                    </div>

                    {/* Basic Info */}
                    <div className="flex-1 pt-4">
                        <div className="flex flex-wrap items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold text-gray-900">{profile?.fullName}</h1>
                            {profile?.isPublic && (
                                <span className="px-2.5 py-1 bg-green-50 text-[#2D9B82] text-[10px] font-black uppercase tracking-wider rounded-lg border border-green-100">
                                    Public Profile
                                </span>
                            )}
                        </div>
                        <p className="text-gray-500 font-semibold mb-3 max-w-2xl leading-relaxed">
                            {profile?.professionalHeadline || 'Professional ready for new opportunities'}
                        </p>

                        <div className="flex flex-wrap items-center gap-6 text-sm">
                            <div className="flex items-center gap-2 text-gray-400 font-bold">
                                <MapPin size={16} className="text-[#2D9B82]" />
                                <span>{profile?.location || 'Add location'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400 font-bold">
                                <Globe size={16} className="text-[#2D9B82]" />
                                <span>{profile?.isPublic ? 'Visible to recruiters' : 'Hidden profile'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-4 md:mt-0 flex items-center gap-4">
                        <button
                            onClick={onEdit}
                            className="flex items-center gap-2 px-6 py-3 bg-[#2D9B82] text-white rounded-xl font-bold hover:bg-[#25836d] transition-all transform active:scale-95 shadow-lg shadow-[#2D9B82]/20"
                        >
                            <Edit2 size={16} />
                            <span>Edit Profile</span>
                        </button>
                    </div>
                </div>

                {/* Profile Completion Bar */}
                <div className="pt-6 border-t border-gray-50">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Profile Strength</span>
                        <span className="text-xs font-black text-[#2D9B82]">{completion}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#2D9B82] rounded-full transition-all duration-1000"
                            style={{ width: `${completion}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileHeader;
