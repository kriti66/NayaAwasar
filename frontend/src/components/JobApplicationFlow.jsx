import React, { useState, useEffect } from 'react';
import {
    X, User, FileText, CheckCircle, ChevronRight, ChevronLeft,
    Upload, Briefcase, Mail, Phone, Globe, Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import profileService from '../services/profileService';
import applicationService from '../services/applicationService';

const JobApplicationFlow = ({ job, onClose, onApplySuccess }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState(null);

    // Application State
    const [applicationData, setApplicationData] = useState({
        personalInfo: {
            fullName: '',
            email: '',
            phone: ''
        },
        coverLetter: '',
        resumeType: 'Generated', // Default to portal-generated
        resumeUrl: '',
        resumeSnapshot: null
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const data = await profileService.getProfile();
            setProfile(data);
            setApplicationData(prev => ({
                ...prev,
                personalInfo: {
                    fullName: data.fullName || '',
                    email: data.email || '',
                    phone: data.phoneNumber || ''
                },
                resumeSnapshot: data, // Snapshot for generated resume
                resumeUrl: data.resume_url || ''
            }));
        } catch (error) {
            console.error("Error fetching profile for application:", error);
            toast.error("Failed to load your profile details");
        }
    };

    const handleNext = () => {
        if (step === 1) {
            if (!applicationData.personalInfo.fullName || !applicationData.personalInfo.email) {
                return toast.error("Please fill in basic personal details");
            }
            const phone = (applicationData.personalInfo.phone || '').trim();
            if (phone && !/^\+[0-9][0-9\s-]{6,14}$/.test(phone)) {
                return toast.error("Please enter a valid phone number with country code");
            }
        }
        if (step === 2) {
            if (applicationData.coverLetter.length < 50) {
                return toast.error("Cover letter is too short (min 50 chars)");
            }
        }
        if (step === 3) {
            if (applicationData.resumeType === 'External' && !profile?.resume_url) {
                return toast.error("No external resume found. Please upload one in your profile.");
            }
        }
        setStep(prev => prev + 1);
    };

    const handleBack = () => setStep(prev => prev - 1);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const finalData = {
                job_id: job._id,
                personalInfo: applicationData.personalInfo,
                coverLetter: applicationData.coverLetter,
                resumeType: applicationData.resumeType,
                // If generated, we pass the snapshot. If external, we pass the URL.
                resumeUrl: applicationData.resumeType === 'External' ? profile.resume_url : 'Portal_Generated',
                resumeSnapshot: applicationData.resumeType === 'Generated' ? profile : null
            };

            const result = await applicationService.apply(finalData);
            if (result.success) {
                toast.success("Application submitted successfully!");
                onApplySuccess();
                onClose();
            }
        } catch (error) {
            toast.error(error.message || "Failed to submit application");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-8 border-b border-slate-100 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Apply for {job.title}</h2>
                        <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">{job.company_name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="px-8 pt-6">
                    <div className="flex justify-between items-center mb-4">
                        {[1, 2, 3, 4].map((s) => (
                            <div key={s} className="flex flex-col items-center flex-1 relative">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs transition-all z-10 
                                    ${step >= s ? 'bg-[#29a08e] text-white shadow-lg shadow-[#29a08e]/20' : 'bg-slate-100 text-slate-400'}`}>
                                    {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-tighter mt-2 
                                    ${step === s ? 'text-[#29a08e]' : 'text-slate-400'}`}>
                                    {s === 1 ? 'Personal' : s === 2 ? 'Cover Letter' : s === 3 ? 'Resume' : 'Review'}
                                </span>
                                {s < 4 && (
                                    <div className={`absolute left-[50%] top-5 w-full h-[2px] -z-0 
                                        ${step > s ? 'bg-[#29a08e]' : 'bg-slate-100'}`}></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step Content */}
                <div className="flex-1 overflow-y-auto p-8 pt-4">

                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="bg-[#29a08e]/10 border border-[#29a08e]/20 p-4 rounded-2xl flex gap-3 text-blue-700">
                                <Info className="w-5 h-5 shrink-0" />
                                <p className="text-xs font-medium leading-relaxed">We've pre-filled your details from your profile. Feel free to update them for this specific application.</p>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={applicationData.personalInfo.fullName}
                                        onChange={(e) => setApplicationData(p => ({ ...p, personalInfo: { ...p.personalInfo, fullName: e.target.value } }))}
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#29a08e] font-bold text-slate-800"
                                        placeholder="Enter your full name"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
                                    <input
                                        type="email"
                                        value={applicationData.personalInfo.email}
                                        onChange={(e) => setApplicationData(p => ({ ...p, personalInfo: { ...p.personalInfo, email: e.target.value } }))}
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#29a08e] font-bold text-slate-800"
                                        placeholder="email@example.com"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                                        Phone Number <span className="font-normal lowercase text-slate-400">(optional)</span>
                                    </label>
                                    <input
                                        type="tel"
                                        value={applicationData.personalInfo.phone}
                                        onChange={(e) => setApplicationData(p => ({ ...p, personalInfo: { ...p.personalInfo, phone: e.target.value } }))}
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#29a08e] font-bold text-slate-800"
                                        placeholder="e.g. +977 9800000000"
                                    />
                                    <p className="text-[11px] text-slate-400">
                                        {profile?.phoneNumber
                                            ? 'Using your saved phone number — you can adjust it for this application.'
                                            : 'Include country code. Starts with + and 7–15 digits.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Write your Cover Letter</label>
                                <textarea
                                    rows="10"
                                    value={applicationData.coverLetter}
                                    onChange={(e) => setApplicationData(p => ({ ...p, coverLetter: e.target.value }))}
                                    className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[28px] outline-none focus:ring-2 focus:ring-[#29a08e] font-medium text-slate-700 leading-relaxed text-sm"
                                    placeholder="Explain why you are the best fit for this role..."
                                ></textarea>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-right">{applicationData.coverLetter.length} characters</p>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="grid grid-cols-1 gap-4">
                                <button
                                    onClick={() => setApplicationData(p => ({ ...p, resumeType: 'Generated' }))}
                                    className={`p-6 rounded-[28px] border-2 text-left transition-all flex items-center gap-5
                                        ${applicationData.resumeType === 'Generated' ? 'border-[#29a08e] bg-[#29a08e]/10 shadow-xl shadow-[#29a08e]/5' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center 
                                        ${applicationData.resumeType === 'Generated' ? 'bg-[#29a08e] text-white' : 'bg-slate-100 text-slate-400'}`}>
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-black text-slate-900 tracking-tight uppercase text-sm">Naya Awasar Smart Resume</h4>
                                        <p className="text-xs font-bold text-slate-400 uppercase mt-1">Generated from your profile activity</p>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                                        ${applicationData.resumeType === 'Generated' ? 'border-blue-600' : 'border-slate-100'}`}>
                                        {applicationData.resumeType === 'Generated' && <div className="w-3 h-3 bg-[#29a08e] rounded-full" />}
                                    </div>
                                </button>

                                <button
                                    onClick={() => setApplicationData(p => ({ ...p, resumeType: 'External' }))}
                                    className={`p-6 rounded-[28px] border-2 text-left transition-all flex items-center gap-5
                                        ${applicationData.resumeType === 'External' ? 'border-[#29a08e] bg-[#29a08e]/10 shadow-xl shadow-[#29a08e]/5' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center 
                                        ${applicationData.resumeType === 'External' ? 'bg-[#29a08e] text-white' : 'bg-slate-100 text-slate-400'}`}>
                                        <Upload className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-black text-slate-900 tracking-tight uppercase text-sm">Original Hand-crafted CV</h4>
                                        <p className="text-xs font-bold text-slate-400 uppercase mt-1">
                                            {profile?.resume_url ? 'file-uploaded.pdf' : 'No file found in profile'}
                                        </p>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                                        ${applicationData.resumeType === 'External' ? 'border-blue-600' : 'border-slate-100'}`}>
                                        {applicationData.resumeType === 'External' && <div className="w-3 h-3 bg-[#29a08e] rounded-full" />}
                                    </div>
                                </button>
                            </div>

                            <div className="p-6 bg-slate-900 rounded-[28px] text-white">
                                <h5 className="text-[10px] font-black uppercase text-[#29a08e]/80 tracking-widest mb-4">Quick Preview</h5>
                                {applicationData.resumeType === 'Generated' ? (
                                    <div className="space-y-4 opacity-80">
                                        <div className="h-4 w-1/2 bg-white/10 rounded"></div>
                                        <div className="h-3 w-1/3 bg-white/5 rounded"></div>
                                        <div className="grid grid-cols-2 gap-4 mt-6">
                                            <div className="h-2 w-full bg-white/5 rounded"></div>
                                            <div className="h-2 w-full bg-white/5 rounded"></div>
                                            <div className="h-2 w-full bg-white/5 rounded"></div>
                                            <div className="h-2 w-full bg-white/5 rounded"></div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-4 space-y-3 opacity-60">
                                        <Upload className="w-8 h-8" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">{profile?.resume_url ? 'Original Document Selected' : 'No Document Found'}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-4">
                            <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 space-y-6">
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Target Opportunity</h4>
                                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{job.title}</p>
                                    <p className="text-xs font-bold text-[#29a08e] mt-1 uppercase tracking-widest">{job.company_name}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200">
                                    <div>
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Candidate</h4>
                                        <p className="text-[13px] font-bold text-slate-800">{applicationData.personalInfo.fullName}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Contact</h4>
                                        <p className="text-[13px] font-bold text-slate-800">{applicationData.personalInfo.phone}</p>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-slate-200">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Selected Credential</h4>
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-[#29a08e]/20 text-[#29a08e] rounded-lg">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <p className="text-[13px] font-bold text-slate-800 uppercase tracking-tight">
                                            {applicationData.resumeType === 'Generated' ? 'Smart Portal Resume' : 'Hand-crafted Document'}
                                        </p>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-slate-200">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Cover Letter Snippet</h4>
                                    <p className="text-[13px] text-slate-600 leading-relaxed font-medium line-clamp-4 bg-white p-4 rounded-2xl border border-slate-100 italic">
                                        "{applicationData.coverLetter}"
                                    </p>
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center px-4">By clicking submit, you agree to share your professional snapshot with the recruiters of this role.</p>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <button
                        onClick={step === 1 ? onClose : handleBack}
                        className="px-8 py-3.5 text-slate-500 font-black text-[11px] uppercase tracking-widest hover:text-slate-900 transition-colors"
                    >
                        {step === 1 ? 'Discard' : 'Go Back'}
                    </button>

                    {step < 4 ? (
                        <button
                            onClick={handleNext}
                            className="px-10 py-3.5 bg-[#29a08e] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-xl shadow-[#29a08e]/20 hover:bg-[#228377] active:scale-95 transition-all flex items-center gap-2"
                        >
                            Next Step
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-10 py-3.5 bg-[#29a08e] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-xl shadow-[#29a08e]/20 hover:bg-[#228377] active:scale-95 transition-all text-center min-w-[160px] flex items-center justify-center"
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Confirm & Submit'}
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};

export default JobApplicationFlow;
