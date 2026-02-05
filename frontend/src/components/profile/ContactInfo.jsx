import React from 'react';
import { Mail, Phone, Linkedin, Globe, MapPin } from 'lucide-react';

const ContactInfo = ({ isEditing, profile, formData, handleInputChange }) => {
    if (isEditing) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Email (Read-only)</label>
                    <input
                        type="email"
                        value={profile.email || ''}
                        disabled
                        className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl outline-none font-semibold text-gray-500 cursor-not-allowed"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Phone Number</label>
                    <input
                        type="text"
                        name="phoneNumber"
                        value={formData.phoneNumber || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold text-gray-800"
                        placeholder="+977-XXXXXXXXXX"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">LinkedIn Profile</label>
                    <input
                        type="url"
                        name="linkedinUrl"
                        value={formData.linkedinUrl || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold text-gray-800"
                        placeholder="https://linkedin.com/in/username"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Portfolio URL</label>
                    <input
                        type="url"
                        name="portfolioUrl"
                        value={formData.portfolioUrl || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold text-gray-800"
                        placeholder="https://yourportfolio.com"
                    />
                </div>
                <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Location</label>
                    <input
                        type="text"
                        name="location"
                        value={formData.location || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold text-gray-800"
                        placeholder="City, Country"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
            <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Email</p>
                <div className="flex items-center gap-2 text-sm font-bold text-gray-900 border-b border-gray-50 pb-1 w-fit">
                    <Mail size={14} className="text-blue-500" />
                    <span>{profile.email}</span>
                </div>
            </div>
            <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Phone Number</p>
                <div className="flex items-center gap-2 text-sm font-bold text-gray-900 border-b border-gray-50 pb-1 w-fit">
                    <Phone size={14} className="text-blue-500" />
                    <span>{profile.phoneNumber || '---'}</span>
                </div>
            </div>
            <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">LinkedIn</p>
                {profile.linkedinUrl ? (
                    <a
                        href={profile.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline border-b border-transparent hover:border-blue-600 pb-1 w-fit transition-all uppercase tracking-tight"
                    >
                        <Linkedin size={14} />
                        <span>View LinkedIn Profile</span>
                    </a>
                ) : <span className="text-sm font-bold text-gray-300">---</span>}
            </div>
            <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Portfolio</p>
                {profile.portfolioUrl ? (
                    <a
                        href={profile.portfolioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline border-b border-transparent hover:border-blue-600 pb-1 w-fit transition-all uppercase tracking-tight"
                    >
                        <Globe size={14} />
                        <span>View Portfolio</span>
                    </a>
                ) : <span className="text-sm font-bold text-gray-300">---</span>}
            </div>
            <div className="md:col-span-2 space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Location</p>
                <div className="flex items-center gap-2 text-sm font-bold text-gray-900 border-b border-gray-50 pb-1 w-fit">
                    <MapPin size={14} className="text-blue-500" />
                    <span>{profile.location || '---'}</span>
                </div>
            </div>
        </div>
    );
};

export default ContactInfo;
