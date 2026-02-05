import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Building2, MapPin, Calendar, ChevronDown, ChevronUp,
    ExternalLink, CheckCircle2, Circle, Clock, MessageSquare,
    XSquare, ArrowRight, LayoutDashboard, Info
} from 'lucide-react';

const ApplicationATSCard = ({ application }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { job_id, status, createdAt, interview_details, offer_details } = application;

    const statusSteps = [
        { key: 'Applied', label: 'Applied' },
        { key: 'In Review', label: 'In Review' },
        { key: 'Interview', label: 'Interview' },
        { key: 'Offer', label: 'Offer' }
    ];

    const currentStatusSource = status === 'Under Review' ? 'In Review' :
        status === 'Interview Scheduled' ? 'Interview' :
            status === 'Offer Extended' ? 'Offer' :
                status === 'Rejected' ? 'Rejected' : 'Applied';

    const activeIndex = status === 'Rejected' ? -1 : statusSteps.findIndex(s => s.key === currentStatusSource);

    const getStatusStyles = (s) => {
        switch (s) {
            case 'Under Review': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'Interview Scheduled': return 'bg-purple-50 text-purple-600 border-purple-100';
            case 'Offer Extended': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Rejected': return 'bg-rose-50 text-rose-600 border-rose-100';
            case 'Withdrawn': return 'bg-gray-50 text-gray-500 border-gray-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    return (
        <div className={`bg-white border rounded-[32px] overflow-hidden transition-all duration-500 hover:border-[#2D9B82]/20 ${isExpanded ? 'shadow-2xl border-[#2D9B82]/10 ring-8 ring-[#2D9B82]/5' : 'shadow-sm border-gray-100 hover:shadow-xl hover:shadow-gray-200/50'}`}>
            {/* Collapsed View */}
            <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6 w-full md:w-auto">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 shrink-0 group-hover:scale-105 transition-transform overflow-hidden shadow-inner">
                        {job_id?.company_logo_url ? (
                            <img src={job_id.company_logo_url} alt={job_id.company_name} className="w-full h-full object-cover" />
                        ) : (
                            <Building2 size={28} className="text-gray-400" />
                        )}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-1.5 hover:text-[#2D9B82] transition-colors cursor-pointer">{job_id?.title}</h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-gray-500 text-sm font-semibold">
                            <span className="flex items-center gap-1.5">{job_id?.company_name}</span>
                            <span className="flex items-center gap-1.5 shadow-sm px-2 py-0.5 bg-gray-50 rounded-lg"><MapPin size={14} className="text-[#2D9B82]" /> {job_id?.location}</span>
                            <span className="flex items-center gap-1.5"><Calendar size={14} className="text-gray-300" /> Applied {new Date(createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                    <div className="flex flex-col items-end gap-2">
                        <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyles(status)} shadow-sm`}>
                            {status === 'Under Review' ? 'In Review' :
                                status === 'Interview Scheduled' ? 'Interview' :
                                    status === 'Offer Extended' ? 'Offer' : status}
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        {status === 'Interview Scheduled' ? (
                            <Link to="/seeker/interviews?focused=true" className="text-xs font-black text-[#2D9B82] hover:underline uppercase tracking-tight flex items-center gap-1.5">
                                View Interview <ArrowRight size={14} />
                            </Link>
                        ) : (
                            <button onClick={() => setIsExpanded(!isExpanded)} className="text-xs font-black text-gray-400 hover:text-[#2D9B82] uppercase tracking-tight flex items-center gap-1.5 transition-colors">
                                {isExpanded ? 'Hide Details' : 'View Details'} <ChevronDown size={14} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                        )}
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isExpanded ? 'bg-[#2D9B82] text-white shadow-lg shadow-[#2D9B82]/20' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                        >
                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Expanded View */}
            {isExpanded && (
                <div className="px-8 pb-10 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="h-px bg-gray-100 w-full mb-10"></div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Application Journey & Description */}
                        <div className="space-y-12">
                            <div>
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8">Application Journey</h4>
                                <div className="relative flex justify-between px-2">
                                    <div className="absolute top-4 left-0 right-0 h-1 bg-gray-100 -translate-y-1/2 rounded-full"></div>
                                    <div
                                        className="absolute top-4 left-0 h-1 bg-[#2D9B82] -translate-y-1/2 rounded-full transition-all duration-1000 shadow-sm"
                                        style={{ width: `${(activeIndex / (statusSteps.length - 1)) * 100}%` }}
                                    ></div>

                                    {statusSteps.map((step, idx) => {
                                        const isDone = status !== 'Rejected' && idx <= activeIndex;
                                        const isCurrent = status !== 'Rejected' && idx === activeIndex;
                                        return (
                                            <div key={idx} className="relative flex flex-col items-center">
                                                <div className={`w-8 h-8 rounded-full border-4 border-white flex items-center justify-center z-10 transition-all duration-700 shadow-sm ${isCurrent ? 'bg-[#2D9B82] text-white ring-4 ring-[#2D9B82]/10 scale-125' :
                                                    isDone ? 'bg-[#2D9B82] text-white' : 'bg-gray-100 text-gray-300'
                                                    }`}>
                                                    {isDone ? <CheckCircle2 size={14} strokeWidth={3} /> : <Circle size={10} fill="currentColor" />}
                                                </div>
                                                <span className={`text-[9px] font-black uppercase tracking-wider mt-5 transition-colors ${isDone ? 'text-gray-900' : 'text-gray-300'}`}>{step.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Role Description</h4>
                                <p className="text-sm text-gray-600 font-medium leading-relaxed line-clamp-3">
                                    {job_id?.description || "No description available for this role. Click on 'View Original Listing' to see the full job details on the main page."}
                                </p>
                                <Link to={`/jobs/${job_id?._id}`} className="text-[#2D9B82] text-xs font-bold hover:underline mt-4 inline-flex items-center gap-1.5">
                                    Read Full Description <ExternalLink size={12} />
                                </Link>
                            </div>
                        </div>

                        {/* Next Action Panel */}
                        <div className="bg-[#F8FAFC] rounded-[28px] p-6 lg:p-8 border border-gray-100 relative group/next">
                            <div className="flex justify-between items-start mb-6">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Next Action</h4>
                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tight ${getStatusStyles(status)}`}>{currentStatusSource}</span>
                            </div>

                            <div className="flex gap-5">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${status === 'Interview Scheduled' ? 'bg-purple-600 text-white shadow-purple-500/20' :
                                    status === 'Offer Extended' ? 'bg-[#2D9B82] text-white shadow-[#2D9B82]/20' :
                                        status === 'Rejected' ? 'bg-rose-600 text-white shadow-rose-500/20' : 'bg-blue-600 text-white shadow-blue-500/20'
                                    }`}>
                                    {status === 'Interview Scheduled' ? <MessageSquare size={22} /> :
                                        status === 'Offer Extended' ? <CheckCircle2 size={22} /> :
                                            status === 'Rejected' ? <XSquare size={22} /> : <Clock size={22} />}
                                </div>
                                <div className="flex-1">
                                    <h5 className="text-lg font-bold text-gray-900 mb-2">
                                        {status === 'Interview Scheduled' ? (interview_details?.type || 'Technical Round') :
                                            status === 'Offer Extended' ? 'Review Offer Letter' :
                                                status === 'Rejected' ? 'Application Closed' : 'Application Review'}
                                    </h5>

                                    {status === 'Interview Scheduled' && (
                                        <div className="space-y-4 mb-8">
                                            <div className="flex items-center gap-4 text-sm text-gray-600 font-medium">
                                                <div className="flex items-center gap-2 px-3 py-1 bg-white border border-gray-100 rounded-lg shadow-sm">
                                                    <Calendar size={14} className="text-[#2D9B82]" />
                                                    <span>{interview_details?.date ? new Date(interview_details.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'TBD'}</span>
                                                </div>
                                                <div className="flex items-center gap-2 px-3 py-1 bg-white border border-gray-100 rounded-lg shadow-sm">
                                                    <Clock size={14} className="text-[#2D9B82]" />
                                                    <span>{interview_details?.time || 'TBD'}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                                <LinkIcon size={14} />
                                                <span>{interview_details?.location || 'Online (Google Meet)'}</span>
                                            </div>
                                        </div>
                                    )}

                                    {status === 'Offer Extended' && (
                                        <p className="text-sm text-gray-500 font-medium mb-8 leading-relaxed">Congratulations! You've successfully cleared all rounds. Please review and respond to the offer by the due date.</p>
                                    )}

                                    {(status === 'Applied' || status === 'Under Review') && (
                                        <p className="text-sm text-gray-500 font-medium mb-8 leading-relaxed">The hiring team is currently evaluating your profile. You'll be notified of any further steps via email.</p>
                                    )}

                                    {status === 'Rejected' && (
                                        <p className="text-sm text-gray-500 font-medium mb-8 leading-relaxed">We appreciate your interest. While this isn't a match, keep exploring other opportunities on Naya Awasar.</p>
                                    )}

                                    <div className="space-y-3">
                                        {status === 'Interview Scheduled' ? (
                                            <>
                                                <button className="w-full py-3.5 bg-[#2D9B82] text-white rounded-xl font-black text-[11px] uppercase tracking-wider hover:bg-[#25836d] transition-all shadow-lg shadow-[#2D9B82]/10 transform active:scale-95">Join Meeting</button>
                                                <button className="w-full py-3.5 bg-white border border-gray-200 text-gray-600 rounded-xl font-black text-[11px] uppercase tracking-wider hover:bg-gray-50 transition-all transform active:scale-95">Prepare for Interview</button>
                                            </>
                                        ) : status === 'Offer Extended' ? (
                                            <>
                                                <button className="w-full py-3.5 bg-[#2D9B82] text-white rounded-xl font-black text-[11px] uppercase tracking-wider hover:bg-[#25836d] transition-all shadow-lg shadow-[#2D9B82]/10 transform active:scale-95">View & Accept Offer</button>
                                                <button className="w-full py-3.5 bg-white border border-gray-200 text-gray-600 rounded-xl font-black text-[11px] uppercase tracking-wider hover:bg-gray-50 transition-all transform active:scale-95">Decline Offer</button>
                                            </>
                                        ) : status === 'Rejected' ? (
                                            <Link to="/seeker/jobs" className="w-full py-3.5 bg-white border border-gray-200 text-gray-600 rounded-xl font-black text-[11px] uppercase tracking-wider hover:bg-gray-50 transition-all flex items-center justify-center transform active:scale-95">Find Similar Jobs</Link>
                                        ) : (
                                            <>
                                                <button className="w-full py-3.5 bg-[#2D9B82] text-white rounded-xl font-black text-[11px] uppercase tracking-wider hover:bg-[#25836d] transition-all transform active:scale-95">Check Detailed Status</button>
                                                <button className="w-full py-3.5 bg-transparent text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-rose-500 transition-all">Withdraw Application</button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-4 border-t border-gray-200/50 flex justify-between items-center opacity-0 group-hover/next:opacity-100 transition-opacity">
                                <Link to={`/jobs/${job_id?._id}`} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-[#2D9B82] flex items-center gap-1">
                                    View Original Listing <ExternalLink size={10} />
                                </Link>
                                <Info size={14} className="text-gray-200" />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const LinkIcon = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
);

export default ApplicationATSCard;
