import React from 'react';

const ProfileVisibilityCard = ({ isPublic, onToggle }) => {
    return (
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden mb-6">
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Profile Visibility</h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={isPublic}
                            onChange={(e) => onToggle(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#29a08e]"></div>
                    </label>
                </div>

                <p className="text-sm font-semibold text-gray-900 mb-2">
                    {isPublic ? 'Public Profile' : 'Private Profile'}
                </p>
                <p className="text-xs font-medium text-gray-400 leading-relaxed">
                    {isPublic
                        ? 'Your profile is discoverable by recruiters searching for candidates. This increases your chances of getting noticed.'
                        : 'Your profile is hidden from recruiters. You can still apply to jobs manually, but you won’t appear in search results.'}
                </p>

                <div className="mt-4 p-3 bg-green-50 rounded-xl border border-green-100/50">
                    <div className="flex items-start gap-2">
                        <div className="w-4 h-4 bg-[#29a08e] rounded-full flex items-center justify-center shrink-0 mt-0.5">
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-[10px] font-bold text-[#29a08e] leading-tight">
                            {isPublic ? 'Your profile is discoverable by recruiters searching for candidates.' : 'Recruiters can only see your profile if you apply to their jobs.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileVisibilityCard;
