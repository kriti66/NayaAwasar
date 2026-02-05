import React from 'react';

const PublicProfileSettings = ({ isEditing, profile, formData, onTogglePublic }) => {
    const isPublic = isEditing ? formData.isPublic : profile.isPublic;

    return (
        <div className="space-y-6">
            <div className={`p-6 rounded-2xl transition-all border ${isPublic ? 'bg-blue-50/30 border-blue-100' : 'bg-gray-50/50 border-gray-100'}`}>
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h4 className="text-sm font-black text-gray-900 border-b border-transparent w-fit">Make Profile Public</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {isPublic ? 'Your profile is visible to recruiters and employers.' : 'Only you can see your profile.'}
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isPublic}
                            onChange={(e) => onTogglePublic(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 transition-colors"></div>
                    </label>
                </div>

                {isPublic && (
                    <div className="mt-4 p-4 bg-white/60 border border-blue-50 rounded-xl">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                            <p className="text-[11px] font-bold text-blue-600 uppercase tracking-tight">Profile is Public</p>
                        </div>
                        <p className="text-[11px] font-medium text-gray-500 mt-1 leading-relaxed">
                            Your profile is visible to recruiters and appears in job searches. Make sure all your information is up to date.
                        </p>
                    </div>
                )}
            </div>

            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                Note: Recruiters may use your public profile to find and contact you for potential opportunities.
            </p>
        </div>
    );
};

export default PublicProfileSettings;
