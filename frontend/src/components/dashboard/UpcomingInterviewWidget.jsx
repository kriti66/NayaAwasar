import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';

const UpcomingInterviewWidget = ({ interviews }) => {
    const nextInterview = interviews && interviews.length > 0 ? interviews[0] : null;

    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Upcoming Interview</h3>
                <Link to="/seeker/interviews" className="text-xs font-bold text-[#29a08e] hover:underline">View all</Link>
            </div>

            {nextInterview ? (
                <div className="space-y-6">
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 mb-1">{nextInterview.job_id?.title || 'Job Position'}</h4>
                                <p className="text-xs font-semibold text-gray-400">{nextInterview.job_id?.company_name || 'Company Name'}</p>
                            </div>
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-gray-400 shadow-sm border border-gray-100 font-bold text-xs uppercase">
                                {nextInterview.job_id?.company_name?.charAt(0) || 'C'}
                            </div>
                        </div>

                        <div className="space-y-3 mb-4">
                            <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>{nextInterview.interview?.date ? new Date(nextInterview.interview.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }) : 'Date TBD'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{nextInterview.interview?.time || 'Time TBD'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-[#29a08e] font-bold">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                {nextInterview.interview?.mode === 'Online' ? (
                                    <a
                                        href={nextInterview.interview?.meetLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="underline cursor-pointer hover:text-[#228377]"
                                    >
                                        Join Meeting
                                    </a>
                                ) : (
                                    <span>{nextInterview.interview?.location || 'Onsite Interview'}</span>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {nextInterview.interview?.mode === 'Online' && nextInterview.interview?.meetLink && (
                                <a
                                    href={nextInterview.interview.meetLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-1 py-2 bg-[#29a08e] text-white text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-[#228377] transition-all text-center flex items-center justify-center"
                                >
                                    Join
                                </a>
                            )}
                            <Link
                                to={`/seeker/interviews?focused=true`}
                                className="flex-1 py-2 bg-white border border-gray-200 text-gray-500 text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-gray-50 transition-all text-center flex items-center justify-center"
                            >
                                Details
                            </Link>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="py-10 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <Calendar className="w-12 h-12 text-[#29a08e] mx-auto mb-3" />
                    <p className="text-sm text-gray-600 font-medium">No interviews scheduled yet</p>
                </div>
            )}
        </div>
    );
};

export default UpcomingInterviewWidget;
