import { Link } from 'react-router-dom';

const ProfileStrength = ({ profileStrength }) => {
    const metrics = [
        { label: 'Profile Completeness', value: profileStrength.completeness, color: 'bg-blue-600' },
        { label: 'Resume Quality', value: profileStrength.resumeQuality, color: 'bg-blue-400' },
        { label: 'Skills Match', value: profileStrength.skillsMatch, color: 'bg-blue-500' },
        { label: 'Activity Level', value: profileStrength.activityLevel, color: 'bg-blue-300' }
    ];

    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm h-full">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Profile Strength</h3>
            <p className="text-xs text-gray-400 font-medium mb-8">Metrics that matter</p>

            <div className="space-y-6 mb-8">
                {metrics.map((metric) => (
                    <div key={metric.label}>
                        <div className="flex justify-between text-[11px] font-bold text-gray-500 uppercase tracking-tighter mb-2">
                            <span>{metric.label}</span>
                            <span className="text-blue-600">{metric.value}%</span>
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

            <Link
                to="/seeker/profile"
                className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center justify-center hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-100"
            >
                Improve Profile
            </Link>
        </div>
    );
};

export default ProfileStrength;
