import React from 'react';
import { Link } from 'react-router-dom';

const ProfileStrengthWidget = ({ profileStrength }) => {
    const metrics = [
        { label: 'Profile Completeness', value: profileStrength?.completeness || 0, color: 'bg-[#29a08e]' },
        { label: 'Resume Quality', value: profileStrength?.resumeQuality || 0, color: 'bg-[#4ADE80]' },
        { label: 'Skills Match', value: profileStrength?.skillsMatch || 0, color: 'bg-[#29a08e]/60' }
    ];

    const overall = profileStrength?.completeness || 0;

    return (
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Profile Strength</h3>
                    <p className="text-xs font-semibold text-gray-400">Keep improving</p>
                </div>
                <div className="relative w-12 h-12 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="24"
                            cy="24"
                            r="20"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="transparent"
                            className="text-gray-100"
                        />
                        <circle
                            cx="24"
                            cy="24"
                            r="20"
                            stroke="currentColor"
                            strokeWidth="4"
                            strokeDasharray={125.6}
                            strokeDashoffset={125.6 - (125.6 * overall) / 100}
                            fill="transparent"
                            className="text-[#29a08e] transition-all duration-1000"
                            strokeLinecap="round"
                        />
                    </svg>
                    <span className="absolute text-[10px] font-black text-gray-900">{overall}%</span>
                </div>
            </div>

            <div className="space-y-5 mb-8">
                {metrics.map((metric) => (
                    <div key={metric.label}>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">{metric.label}</span>
                            <span className="text-[11px] font-black text-gray-900">{metric.value}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${metric.color} rounded-full transition-all duration-1000`}
                                style={{ width: `${metric.value}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-[#FFFCEB] border border-[#FFE7A3]/30 rounded-2xl p-4 mb-6">
                <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-lg bg-yellow-400 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-gray-900 mb-0.5 whitespace-nowrap">Next Step</p>
                        <p className="text-[10px] text-gray-600 leading-tight">Add 2 more skills to reach 85% match rate.</p>
                    </div>
                </div>
            </div>

            <Link
                to="/seeker/profile"
                className="w-full py-3.5 bg-[#0A0B0D] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95 shadow-lg shadow-black/5"
            >
                Improve Profile
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
            </Link>
        </div>
    );
};

export default ProfileStrengthWidget;
