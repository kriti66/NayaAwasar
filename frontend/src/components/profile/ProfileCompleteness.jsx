import React, { useMemo } from 'react';

const ProfileCompleteness = ({ profile }) => {
    const { score, missing } = useMemo(() => {
        let currentScore = 0;
        const missingFields = [];

        if (profile.fullName) currentScore += 10; else missingFields.push('Full Name');
        if (profile.professionalHeadline) currentScore += 10; else missingFields.push('Headline');
        if (profile.bio) currentScore += 15; else missingFields.push('About Me');
        if (profile.phoneNumber) currentScore += 10; else missingFields.push('Phone Number');
        if (profile.location) currentScore += 5; else missingFields.push('Location');
        if (profile.profileImage) currentScore += 10; else missingFields.push('Profile Picture');
        if (profile.skills && profile.skills.split(',').length >= 3) currentScore += 15; else missingFields.push('Skills (min 3)');
        if (profile.workExperience?.length > 0) currentScore += 15; else missingFields.push('Work Experience');
        if (profile.education?.length > 0) currentScore += 10; else missingFields.push('Education');

        return { score: Math.min(currentScore, 100), missing: missingFields };
    }, [profile]);

    return (
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Profile Completeness</h3>
                <span className="text-sm font-black text-[#29a08e] tracking-tighter">{score}%</span>
            </div>

            <div className="h-2 bg-gray-50 rounded-full overflow-hidden mb-8">
                <div
                    className="h-full bg-[#29a08e] rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(41,160,142,0.3)]"
                    style={{ width: `${score}%` }}
                ></div>
            </div>

            {score < 100 ? (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-[#29a08e]/10 text-[#29a08e] flex items-center justify-center">
                            <svg size={10} fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-2.5 h-2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Missing to reach 100%:</p>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5">
                        {missing.slice(0, 3).map((field, i) => (
                            <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50/50 rounded-lg border border-gray-50 group">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-[#29a08e] transition-colors"></div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight group-hover:text-gray-600 transition-colors">{field}</span>
                            </div>
                        ))}
                        {missing.length > 3 && (
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest pl-1 italic">
                                + {missing.length - 3} more items
                            </p>
                        )}
                    </div>
                </div>
            ) : (
                <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl flex items-center gap-3 border border-emerald-100 shadow-sm animate-bounce-short">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 border border-emerald-200">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest">Profile Optimized</p>
                        <p className="text-[9px] font-bold opacity-80 uppercase tracking-tighter">You are ready to stand out!</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileCompleteness;
