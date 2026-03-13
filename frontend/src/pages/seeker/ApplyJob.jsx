import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
    User,
    FileText,
    Upload,
    CheckCircle,
    ChevronRight,
    ChevronLeft,
    Briefcase,
    Mail,
    Phone
} from 'lucide-react';

const ApplyJob = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [job, setJob] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [coverLetter, setCoverLetter] = useState('');
    const [resumeType, setResumeType] = useState('Generated'); // 'Generated' or 'Uploaded'
    const [resumeFile, setResumeFile] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [jobRes, profileRes, appsRes] = await Promise.all([
                    api.get(`/jobs/${jobId}`),
                    api.get('/profile/me'),
                    api.get('/applications/my').catch(() => ({ data: [] }))
                ]);
                setJob(jobRes.data);
                setProfile(profileRes.data);

                // Check if already applied
                const existingApp = appsRes.data.find(app => {
                    const appId = (app.job_id && typeof app.job_id === 'object') ? app.job_id._id : app.job_id;
                    return String(appId) === String(jobId);
                });

                if (existingApp && existingApp.status !== 'withdrawn') {
                    toast.error(`You have already applied for this job. Status: ${existingApp.status}`);
                    navigate('/seeker/applications', { replace: true });
                    return;
                }

                // Set default cover letter
                setCoverLetter(`Dear Hiring Manager,\n\nI am writing to express my enthusiastic interest in the ${jobRes.data.title} position at ${jobRes.data.company_name}. With my background and skills, I am confident that I can contribute effectively to your team.`);
            } catch (error) {
                console.error("Error fetching application data:", error);
                toast.error("Failed to load job details.");
                navigate('/seeker/dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [jobId, navigate]);

    const handleNext = () => {
        if (step === 2) {
            if (coverLetter.trim().length < 50) {
                toast.error("Cover letter must be at least 50 characters.");
                return;
            }
        }
        setStep(prev => prev + 1);
    };

    const handleBack = () => {
        setStep(prev => prev - 1);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File size exceeds 5MB limit.");
                return;
            }
            setResumeFile(file);
        }
    };

    const handleSubmit = async () => {
        if (resumeType === 'Uploaded' && !resumeFile && !profile?.resume?.fileUrl) {
            toast.error("Please upload a resume or select generated CV.");
            return;
        }

        if (step !== 3) {
            toast.error("Please complete all steps before submitting.");
            return;
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('job_id', jobId);
            formData.append('coverLetter', coverLetter);
            formData.append('resumeType', resumeType);

            if (resumeType === 'Uploaded' && resumeFile) {
                formData.append('resume', resumeFile);
            }

            const res = await api.post('/applications/apply', formData);

            if (res.status === 201 || res.status === 200) {
                toast.success("Application submitted successfully. Recruiter will review your application.");
                navigate('/seeker/applications');
            }
        } catch (error) {
            console.error("Submission error:", error);
            if (error.response) {
                if (error.response.status === 409) {
                    toast.error("You have already applied for this job.");
                } else if (error.response.status === 400) {
                    toast.error(error.response.data.message || "Invalid application data.");
                } else {
                    toast.error("Failed to submit application. Please try again.");
                }
            } else if (error.request) {
                // Network error (ERR_CONNECTION_REFUSED falls here)
                toast.error("Network error. Please check your connection or try again later.");
            } else {
                toast.error("An unexpected error occurred.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="w-12 h-12 border-4 border-[#29a08e] border-t-transparent rounded-full animate-spin"></div>
                </div>
            </>
        );
    }

    return (
        <>
            <main className="max-w-4xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Apply for {job?.title}</h1>
                    <p className="text-gray-500 font-medium">{job?.company_name} • {job?.location}</p>
                </div>

                {/* Progress Stepper */}
                <div className="flex items-center justify-between mb-12 relative">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0"></div>
                    <div
                        className="absolute top-1/2 left-0 h-0.5 bg-[#29a08e] -translate-y-1/2 z-0 transition-all duration-500"
                        style={{ width: `${((step - 1) / 2) * 100}%` }}
                    ></div>

                    {[
                        { num: 1, label: 'Personal Info', icon: User },
                        { num: 2, label: 'Cover Letter', icon: FileText },
                        { num: 3, label: 'Resume', icon: Upload }
                    ].map((s) => (
                        <div key={s.num} className="relative z-10 flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-4 border-white shadow-sm ${step >= s.num ? 'bg-[#29a08e] text-white shadow-[#29a08e]/20' : 'bg-gray-100 text-gray-400'
                                }`}>
                                <s.icon size={18} />
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest mt-3 ${step >= s.num ? 'text-gray-900' : 'text-gray-400'
                                }`}>{s.label}</span>
                        </div>
                    ))}
                </div>

                {/* Step Content */}
                <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/50 p-8 md:p-12 mb-8">
                    {step === 1 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Confirm Your Details</h2>
                                <p className="text-sm text-gray-500 font-medium">Please review your contact information. To update these, go to your profile settings.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Full Name</label>
                                    <div className="flex items-center gap-3 text-gray-900 font-bold">
                                        <User size={18} className="text-[#29a08e]" />
                                        {user?.fullName}
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Email Address</label>
                                    <div className="flex items-center gap-3 text-gray-900 font-bold">
                                        <Mail size={18} className="text-[#29a08e]" />
                                        {user?.email}
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 md:col-span-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Job Category</label>
                                    <div className="flex items-center gap-3 text-gray-900 font-bold">
                                        <Briefcase size={18} className="text-[#29a08e]" />
                                        {job?.title} (Application Role)
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Write a Cover Letter</h2>
                                <p className="text-sm text-gray-500 font-medium">Introduce yourself and explain why you're a great fit for this role.</p>
                            </div>

                            <div className="relative">
                                <textarea
                                    className="w-full bg-gray-50 border border-gray-100 rounded-[24px] p-6 text-sm font-medium text-gray-700 focus:outline-none focus:ring-4 focus:ring-[#29a08e]/5 focus:border-[#29a08e] transition-all min-h-[300px] shadow-inner"
                                    value={coverLetter}
                                    onChange={(e) => setCoverLetter(e.target.value)}
                                    placeholder="Start writing..."
                                />
                                <div className={`absolute bottom-6 right-6 text-[10px] font-black tracking-widest uppercase ${coverLetter.length < 50 ? 'text-amber-500' : 'text-[#29a08e]'
                                    }`}>
                                    {coverLetter.length} / 50 characters min
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Select Your Resume</h2>
                                <p className="text-sm text-gray-500 font-medium">Choose how you want to present your professional experience.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* System Resume */}
                                <div
                                    onClick={() => setResumeType('Generated')}
                                    className={`p-6 rounded-[28px] border-2 cursor-pointer transition-all group ${resumeType === 'Generated'
                                        ? 'border-[#29a08e] bg-[#29a08e]/5 shadow-lg shadow-[#29a08e]/10'
                                        : 'border-gray-100 hover:border-[#29a08e]/30 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${resumeType === 'Generated' ? 'bg-[#29a08e] text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-[#29a08e]/10 group-hover:text-[#29a08e]'
                                        }`}>
                                        <Briefcase size={22} />
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-1">Use Generated CV</h3>
                                    <p className="text-xs text-gray-500 font-medium mb-4">Naya Awasar auto-generated resume based on your profile.</p>
                                    {profile?.resume?.source === 'generated' ? (
                                        <div className="flex items-center gap-1.5 text-[10px] font-black text-[#29a08e] uppercase tracking-wider bg-white rounded-lg px-3 py-1.5 shadow-sm border border-emerald-50 w-fit">
                                            <CheckCircle size={12} /> Ready to Use
                                        </div>
                                    ) : (
                                        <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest">No Generated CV Found</p>
                                    )}
                                </div>

                                {/* Custom Upload */}
                                <div
                                    onClick={() => setResumeType('Uploaded')}
                                    className={`p-6 rounded-[28px] border-2 cursor-pointer transition-all group ${resumeType === 'Uploaded'
                                        ? 'border-[#29a08e] bg-[#29a08e]/5 shadow-lg shadow-[#29a08e]/10'
                                        : 'border-gray-100 hover:border-[#29a08e]/30 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${resumeType === 'Uploaded' ? 'bg-[#29a08e] text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-[#29a08e]/10 group-hover:text-[#29a08e]'
                                        }`}>
                                        <Upload size={22} />
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-1">Upload Custom Resume</h3>
                                    <p className="text-xs text-gray-500 font-medium mb-4">Upload a specific PDF or DOCX file for this application.</p>

                                    {resumeType === 'Uploaded' && (
                                        <input
                                            type="file"
                                            accept=".pdf,.docx,.doc"
                                            onChange={handleFileChange}
                                            className="text-[10px] font-bold text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-[#111827] file:text-white hover:file:bg-black"
                                        />
                                    )}

                                    {resumeFile && (
                                        <div className="mt-3 flex items-center gap-2 text-[10px] font-black text-[#29a08e] uppercase tracking-wider">
                                            <CheckCircle size={12} /> {resumeFile.name.slice(0, 15)}...
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between">
                    {step > 1 ? (
                        <button
                            onClick={handleBack}
                            className="px-8 py-3 bg-white border border-gray-200 text-gray-600 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-gray-50 transition-all flex items-center gap-2"
                        >
                            <ChevronLeft size={16} /> Back
                        </button>
                    ) : (
                        <div></div>
                    )}

                    {step < 3 ? (
                        <button
                            onClick={handleNext}
                            className="px-12 py-3.5 bg-[#111827] text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-gray-900/10 flex items-center gap-2 group transform active:scale-95"
                        >
                            Next Step <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className={`px-12 py-3.5 bg-[#29a08e] text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-[#228377] transition-all shadow-xl shadow-[#29a08e]/20 flex items-center gap-2 ${submitting ? 'opacity-70 cursor-not-allowed' : 'transform active:scale-95'}`}
                        >
                            {submitting ? 'Submitting...' : 'Submit Application'} <CheckCircle size={16} />
                        </button>
                    )}
                </div>
            </main>
        </>
    );
};

export default ApplyJob;
