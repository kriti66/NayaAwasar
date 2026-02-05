import React from 'react';

const ApplicationSummary = ({ stats }) => {
    const summaryItems = [
        { label: 'TOTAL', value: stats.total, color: 'text-slate-900 border-slate-100' },
        { label: 'ACTIVE', value: stats.active, color: 'text-slate-900 border-slate-100' },
        { label: 'INTERVIEWS', value: stats.interviews, color: 'text-purple-600 border-purple-100' },
        { label: 'OFFERS', value: stats.offers, color: 'text-emerald-600 border-emerald-100' }
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {summaryItems.map((item, index) => (
                <div key={index} className={`bg-white border rounded-2xl p-6 shadow-sm ${item.color.split(' ')[1]}`}>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{item.label}</p>
                    <p className={`text-3xl font-black ${item.color.split(' ')[0]}`}>{item.value}</p>
                </div>
            ))}
        </div>
    );
};

export default ApplicationSummary;
