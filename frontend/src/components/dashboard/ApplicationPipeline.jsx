import React from 'react';
import { Link } from 'react-router-dom';

const ApplicationPipeline = ({ pipeline }) => {
    const stages = [
        {
            label: 'In Review', count: pipeline?.inReview || 0, subtext: 'Awaiting feedback', icon: (
                <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ), bgColor: 'bg-orange-50'
        },
        {
            label: 'Interview', count: pipeline?.interviews || 0, subtext: 'Action required', icon: (
                <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            ), bgColor: 'bg-teal-50'
        },
        {
            label: 'Offers', count: 0, subtext: 'Keep going!', icon: (
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ), bgColor: 'bg-purple-50'
        },
        {
            label: 'Saved', count: pipeline?.bookmarked || 0, subtext: 'Apply later', icon: (
                <svg className="w-5 h-5 text-[#29a08e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
            ), bgColor: 'bg-[#29a08e]/10'
        }
    ];

    return (
        <section className="mt-12">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-gray-900">Application Pipeline</h3>
                <Link to="/seeker/applications" className="text-sm font-bold text-[#29a08e] hover:text-[#228377] flex items-center gap-1 transition-colors">
                    View all
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {stages.map((stage) => (
                    <div key={stage.label} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group cursor-pointer hover:-translate-y-1">
                        <div className="flex items-center justify-between mb-6">
                            <div className={`w-10 h-10 ${stage.bgColor} rounded-xl flex items-center justify-center`}>
                                {stage.icon}
                            </div>
                            <span className="text-3xl font-bold text-gray-900 leading-none">{stage.count}</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900 mb-0.5">{stage.label}</p>
                            <p className="text-xs font-semibold text-gray-400">{stage.subtext}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default ApplicationPipeline;
