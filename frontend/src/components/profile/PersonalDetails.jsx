import React from 'react';

const PersonalDetails = ({ isEditing, profile, formData, handleInputChange }) => {
    if (isEditing) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Full Name</label>
                    <input
                        type="text"
                        name="fullName"
                        value={formData.fullName || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#29a08e] outline-none transition-all font-semibold text-gray-800"
                        placeholder="Your full name"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Professional Headline</label>
                    <input
                        type="text"
                        name="professionalHeadline"
                        value={formData.professionalHeadline || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#29a08e] outline-none transition-all font-semibold text-gray-800"
                        placeholder="e.g. Full Stack Developer"
                    />
                </div>
                <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">About Me</label>
                    <textarea
                        name="bio"
                        value={formData.bio || ''}
                        onChange={handleInputChange}
                        rows="4"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#29a08e] outline-none transition-all font-medium text-gray-700 resize-none"
                        placeholder="Tell us about yourself..."
                    ></textarea>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
            <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">First Name</p>
                <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">{profile.fullName?.split(' ')[0] || '---'}</p>
            </div>
            <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Last Name</p>
                <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">{profile.fullName?.split(' ').slice(1).join(' ') || '---'}</p>
            </div>
            <div className="md:col-span-2 space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Professional Headline</p>
                <p className="text-sm font-bold text-gray-800">{profile.professionalHeadline || '---'}</p>
            </div>
            <div className="md:col-span-2 space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">About Me</p>
                <p className="text-sm text-gray-600 leading-relaxed max-w-2xl font-medium">
                    {profile.bio || 'Add a bio to let recruiters know more about you.'}
                </p>
            </div>
        </div>
    );
};

export default PersonalDetails;
