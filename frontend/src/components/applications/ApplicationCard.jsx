import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, Calendar, ChevronDown, ChevronUp, ExternalLink, MessageSquare, FileCheck, XCircle } from 'lucide-react';

const ApplicationCard = ({ application }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { job_id, status, createdAt, interview_details, offer_details } = application;

    const statusSteps = ['Applied', 'Review', 'Interview', 'Offer'];
    const currentStatusSource = status === 'Under Review' ? 'Review' :
        status === 'Interview Scheduled' ? 'Interview' :
            status === 'Offer Extended' ? 'Offer' :
                status === 'Rejected' ? 'Rejected' : 'Applied';

    const getStatusIndex = (s) => {
        if (s === 'Rejected') return -1;
        const idx = statusSteps.indexOf(s);
        return idx !== -1 ? idx : 0;
    };

    const activeIndex = getStatusIndex(currentStatusSource);

    const getStatusBadgeStyles = (s) => {
        switch (s) {
            case 'Under Review': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'Interview Scheduled': return 'bg-purple-50 text-purple-600 border-purple-100';
            case 'Offer Extended': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Rejected': return 'bg-rose-50 text-rose-600 border-rose-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    return (
        <div className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 ${isExpanded ? 'shadow-lg border-blue-100 ring-1 ring-blue-50' : 'shadow-sm border-slate-100 hover:border-slate-200'}`}>
            {/* Header / Summary Section */}
            <div className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 text-slate-400 group-hover:scale-105 transition-transform">
                        <Building2 size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-900 leading-tight mb-1">{job_id?.title}</h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 text-[13px] font-bold">
                            <span className="flex items-center gap-1.5">{job_id?.company_name}</span>
                            <span className="flex items-center gap-1.5"><MapPin size={14} className="opacity-50" /> {job_id?.location}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:items-end gap-3 w-full md:w-auto">
                    <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusBadgeStyles(status)}`}>
                            {status}
                        </span>
                        <div className="md:hidden">
                            <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 text-slate-400 hover:text-slate-600">
                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Calendar size={14} />
                            <span className="text-xs font-bold uppercase tracking-tighter">Applied {new Date(createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>

                        <div className="hidden md:flex items-center gap-3">
                            {status === 'Interview Scheduled' && (
                                <Link to="/seeker/interviews" className="px-5 py-2 bg-blue-600 text-white text-[11px] font-black uppercase tracking-wider rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95">
                                    View Interview
                                </Link>
                            )}
                            {status === 'Offer Extended' && (
                                <button className="px-5 py-2 bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all active:scale-95">
                                    View Offer
                                </button>
                            )}
                            {(status === 'Applied' || status === 'Under Review') && (
                                <button className="px-5 py-2 bg-slate-100 text-slate-600 text-[11px] font-black uppercase tracking-wider rounded-xl border border-slate-200 hover:bg-slate-200 transition-all active:scale-95">
                                    Track Status
                                </button>
                            )}
                            <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 text-slate-400 hover:text-slate-600">
                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Expandable Section */}
            {isExpanded && (
                <div className="border-t border-slate-50 bg-slate-50/30 p-8 md:p-10 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="space-y-10">
                        <div className="max-w-3xl mx-auto">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 text-center">Application Progress</p>
                            <div className="relative flex justify-between">
                                {/* Timeline line */}
                                <div className="absolute top-4 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 rounded-full"></div>
                                <div
                                    className="absolute top-4 left-0 h-1 transition-all duration-1000 shadow-sm"
                                    style={{
                                        width: status === 'Rejected' ? '100%' : `${(activeIndex / (statusSteps.length - 1)) * 100}%`,
                                        backgroundColor: status === 'Rejected' ? '#f87171' : '#2563eb'
                                    }}
                                ></div>

                                {statusSteps.map((step, idx) => {
                                    const isActive = status !== 'Rejected' && idx <= activeIndex;
                                    const isCurrent = status !== 'Rejected' && idx === activeIndex;

                                    return (
                                        <div key={step} className="relative flex flex-col items-center group">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black z-10 border-4 border-white transition-all duration-500 ${status === 'Rejected' ? 'bg-slate-100 text-slate-400' :
                                                isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-50 scale-125' :
                                                    isActive ? 'bg-blue-500 text-white' :
                                                        'bg-slate-100 text-slate-400'
                                                }`}>
                                                {isActive ? <FileCheck size={14} strokeWidth={3} /> : idx + 1}
                                            </div>
                                            <span className={`text-[10px] font-bold mt-4 uppercase tracking-wider transition-colors ${status === 'Rejected' ? 'text-slate-400' :
                                                isActive ? 'text-slate-900' : 'text-slate-400'
                                                }`}>
                                                {step}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Next Actions Card */}
                        <div className={`rounded-2xl p-6 border ${status === 'Interview Scheduled' ? 'bg-purple-50/50 border-purple-100 text-purple-900' :
                            status === 'Offer Extended' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-900' :
                                status === 'Rejected' ? 'bg-rose-50/50 border-rose-100 text-rose-900' :
                                    'bg-blue-50/50 border-blue-100 text-blue-900'
                            }`}>
                            <div className="flex gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${status === 'Interview Scheduled' ? 'bg-purple-600 text-white' :
                                    status === 'Offer Extended' ? 'bg-emerald-600 text-white' :
                                        status === 'Rejected' ? 'bg-rose-600 text-white' :
                                            'bg-blue-600 text-white'
                                    }`}>
                                    {status === 'Interview Scheduled' ? <MessageSquare size={18} /> :
                                        status === 'Offer Extended' ? <ExternalLink size={18} /> :
                                            status === 'Rejected' ? <XCircle size={18} /> :
                                                <FileCheck size={18} />}
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-[11px] font-black uppercase tracking-widest mb-2 opacity-60">
                                        Next Action: {status === 'Interview Scheduled' ? 'Prepare for Interview' :
                                            status === 'Offer Extended' ? 'Review Your Offer' :
                                                status === 'Rejected' ? 'Application Closed' : 'Review in Progress'}
                                    </h4>

                                    {status === 'Interview Scheduled' && interview_details && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase opacity-40 mb-1">Schedule</p>
                                                    <p className="text-sm font-bold">
                                                        {new Date(interview_details.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} at {interview_details.time}
                                                    </p>
                                                </div>
                                                {interview_details.location && (
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase opacity-40 mb-1">Location</p>
                                                        <p className="text-sm font-bold">{interview_details.location}</p>
                                                    </div>
                                                )}
                                            </div>
                                            {interview_details.link && (
                                                <a href={interview_details.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-black text-purple-700 hover:underline">
                                                    Join Interview <ExternalLink size={14} />
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    {status === 'Offer Extended' && (
                                        <div className="space-y-4">
                                            <p className="text-sm font-medium leading-relaxed">Congratulations! The recruiter has extended an offer for this position. Please review the details below.</p>
                                            <div className="flex gap-3">
                                                <button className="px-6 py-2.5 bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wider rounded-xl hover:bg-emerald-700 transition-all">Accept Offer</button>
                                                <button className="px-6 py-2.5 bg-white border border-rose-200 text-rose-600 text-[11px] font-black uppercase tracking-wider rounded-xl hover:bg-rose-50 transition-all">Decline</button>
                                            </div>
                                        </div>
                                    )}

                                    {status === 'Rejected' && (
                                        <p className="text-sm font-medium leading-relaxed">We appreciate the time you invested in applying for this role. Unfortunately, the company has decided to move forward with other candidates at this time.</p>
                                    )}

                                    {(status === 'Applied' || status === 'Under Review') && (
                                        <p className="text-sm font-medium leading-relaxed">The hiring team is currently reviewing your profile. No further action is required from your side. We will notify you once there is an update.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApplicationCard;
