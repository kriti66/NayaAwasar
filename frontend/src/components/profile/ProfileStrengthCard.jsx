import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

const ProfileStrengthCard = ({ profile }) => {
    const completion = profile?.profileStrength || 0;

    // Determine strength level
    let strength = 'Weak';
    let strengthColor = 'text-red-500';
    if (completion >= 70) {
        strength = 'Strong';
        strengthColor = 'text-green-500';
    } else if (completion >= 40) {
        strength = 'Medium';
        strengthColor = 'text-yellow-500';
    }

    const checklist = [
        { id: 'bio', label: 'Complete professional summary', done: profile?.bio && profile?.bio.length > 20 },
        { id: 'skills', label: 'Add core skills (min 5)', done: profile?.skills && (Array.isArray(profile.skills) ? profile.skills.length : profile.skills.split(',').length) >= 5 },
        { id: 'experience', label: 'Add work experience', done: profile?.workExperience?.length > 0 },
        { id: 'education', label: 'Add education', done: profile?.education?.length > 0 },
        { id: 'projects', label: 'Add projects (min 2)', done: profile?.projects?.length >= 2 },
        { id: 'resume', label: 'Upload resume/CV', done: !!((profile?.resume && profile?.resume?.fileUrl) || profile?.resume_url) },
    ];

    const completedCount = checklist.filter(item => item.done).length;

    return (
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden mb-6">
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Profile Strength</h3>
                        <p className="text-xs font-semibold text-gray-400">
                            {completedCount} of {checklist.length} items completed
                        </p>
                    </div>
                    <span className={`text-sm font-black uppercase ${strengthColor}`}>
                        {strength}
                    </span>
                </div>

                <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden mb-8">
                    <div
                        className={`h-full transition-all duration-1000 ${strength === 'Strong' ? 'bg-[#29a08e]' :
                            strength === 'Medium' ? 'bg-yellow-400' : 'bg-red-400'
                            }`}
                        style={{ width: `${completion}%` }}
                    ></div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Actionable Tips</h4>
                    <div className="space-y-3">
                        {checklist.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 group cursor-pointer">
                                {item.done ? (
                                    <CheckCircle2 size={18} className="text-[#29a08e]" />
                                ) : (
                                    <Circle size={18} className="text-gray-300 group-hover:text-gray-400" />
                                )}
                                <span className={`text-xs font-bold transition-colors ${item.done ? 'text-gray-400 line-through decoration-2' : 'text-gray-700 group-hover:text-gray-900'
                                    }`}>
                                    {item.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileStrengthCard;
