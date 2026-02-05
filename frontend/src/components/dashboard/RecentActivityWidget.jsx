import React from 'react';

const RecentActivityWidget = () => {
    // Mock data for recent activity
    const activities = [
        { id: 1, text: 'TechFlow Inc. viewed your application for', highlight: 'Senior Product Designer', time: '2 hours ago', color: 'bg-orange-500' },
        { id: 2, text: 'You applied to', highlight: 'UX Researcher at Global Tech', time: 'Yesterday', color: 'bg-teal-500' },
        { id: 3, text: 'New message from', highlight: 'Sarah Jenkins (Recruiter)', time: '2 days ago', color: 'bg-purple-500' }
    ];

    return (
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-8">Recent Activity</h3>

            <div className="space-y-8 relative before:absolute before:inset-0 before:left-1.5 before:top-1 before:w-px before:bg-gray-100 pb-1">
                {activities.map((activity) => (
                    <div key={activity.id} className="relative pl-8">
                        <div className={`absolute left-0 top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ring-2 ring-transparent ${activity.color}`}></div>
                        <p className="text-xs font-semibold text-gray-400 mb-1 leading-relaxed">
                            <span className="text-gray-900">{activity.text} </span>
                            <span className="text-[#2D9B82] font-bold">{activity.highlight}</span>
                        </p>
                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">{activity.time}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecentActivityWidget;
