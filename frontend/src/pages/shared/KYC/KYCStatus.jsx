import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import { Clock, CheckCircle, XCircle, HelpCircle, ArrowRight, RefreshCw } from 'lucide-react';

const KYCStatus = () => {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [rejectionReason, setRejectionReason] = useState(user?.rejectionReason || '');
    const [companyStatus, setCompanyStatus] = useState(null);
    const [resubmissionCount, setResubmissionCount] = useState(0);

    useEffect(() => {
        refreshUser();
    }, []);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await api.get('/kyc/status');
                if (res.data.rejectionReason) setRejectionReason(res.data.rejectionReason);
                if (res.data.companyStatus) setCompanyStatus(res.data.companyStatus);
                if (res.data.resubmissionCount !== undefined) setResubmissionCount(res.data.resubmissionCount);
            } catch (_) { }
        };
        fetchStatus();
    }, []);

    useEffect(() => {
        if (user?.kycStatus === 'not_started' || user?.kycStatus === 'not_submitted') {
            if (user.role === 'recruiter') {
                navigate('/kyc/recruiter', { replace: true });
            } else {
                navigate('/kyc/job-seeker', { replace: true });
            }
        }
    }, [user, navigate]);

    if (user?.kycStatus === 'not_started' || user?.kycStatus === 'not_submitted') {
        return null; // Render nothing while redirecting
    }

    const renderStatus = () => {
        switch (user?.kycStatus) {
            case 'pending':
                return (
                    <div className="text-center p-12 lg:p-20 bg-amber-50/50 rounded-2xl border border-amber-100 mx-auto w-full max-w-4xl">
                        <div className="relative inline-flex items-center justify-center mb-6">
                            <div className="absolute inset-0 bg-amber-200 rounded-full animate-ping opacity-25"></div>
                            <div className="bg-amber-100 text-amber-500 w-20 h-20 rounded-full flex items-center justify-center shadow-inner relative z-10">
                                <Clock size={40} strokeWidth={2.5} />
                            </div>
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Verification in Progress</h2>
                        <p className="text-gray-600 text-sm leading-relaxed mb-8 max-w-md mx-auto font-medium">
                            Your identity information is currently in our secure review queue. This usually takes <strong className="text-gray-800">24-48 hours</strong>.
                            We will notify you via email the moment your account is fully unlocked.
                        </p>
                        <div className="flex flex-col-reverse sm:flex-row items-center justify-center gap-3">
                            <button
                                onClick={() => navigate(user?.role === 'recruiter' ? '/recruiter/dashboard' : '/seeker/dashboard')}
                                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#29a08e] to-[#228377] text-white rounded-xl font-bold shadow-lg shadow-[#29a08e]/30 hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm flex items-center justify-center gap-2"
                            >
                                Continue to Dashboard <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                );
            case 'rejected':
                return (
                    <div className="text-center p-12 lg:p-20 bg-red-50/50 rounded-2xl border border-red-100 mx-auto w-full max-w-4xl">
                        <div className="bg-red-100 text-red-500 w-20 h-20 rounded-full flex items-center justify-center shadow-inner mx-auto mb-6">
                            <XCircle size={40} strokeWidth={2.5} />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Verification Rejected</h2>
                        <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto font-medium">
                            Unfortunately, we could not verify your identity. Please review the specific issue below and resubmit your documents.
                        </p>
                        <div className="bg-white p-5 rounded-xl border border-red-200 shadow-sm mb-8 text-left relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                            <div className="flex justify-between items-start ml-2 mb-1.5">
                                <h4 className="text-xs font-bold text-red-800 uppercase tracking-widest">Reason for rejection</h4>
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-600 rounded-md uppercase">
                                    Attempts used: {resubmissionCount}/3
                                </span>
                            </div>
                            <p className="text-red-600 text-sm font-medium ml-2">
                                "{rejectionReason || user?.rejectionReason || 'No specific reason provided by the reviewer.'}"
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <button
                                onClick={() => navigate(user?.role === 'recruiter' ? '/recruiter/dashboard' : '/seeker/dashboard')}
                                className="w-full sm:w-auto px-6 py-3.5 border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all text-sm"
                            >
                                Cancel Status
                            </button>
                            <button
                                onClick={() => navigate(user?.role === 'recruiter' ? '/kyc/recruiter' : '/kyc/job-seeker')}
                                className="w-full sm:w-auto px-8 py-3.5 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-600/30 hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm"
                            >
                                Fix & Re-upload 
                            </button>
                        </div>
                    </div>
                );
            case 'resubmission_locked':
                return (
                    <div className="text-center p-12 lg:p-20 bg-gray-50 rounded-2xl border border-gray-200 mx-auto w-full max-w-4xl">
                        <div className="bg-gray-200 text-gray-600 w-20 h-20 rounded-full flex items-center justify-center shadow-inner mx-auto mb-6">
                            <HelpCircle size={40} strokeWidth={2.5} />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Verification Locked</h2>
                        <p className="text-gray-600 text-sm mb-8 max-w-md mx-auto font-medium">
                            You have reached the maximum verification resubmission limit (3/3 attempts used). For security purposes, manual review is now required. Please contact admin/support for further assistance.
                        </p>
                        <div className="bg-white p-5 rounded-xl border border-gray-300 shadow-sm mb-8 text-left relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-600"></div>
                            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5 ml-2">Last feedback</h4>
                            <p className="text-gray-600 text-sm font-medium ml-2">
                                "{rejectionReason || user?.rejectionReason || 'Multiple inconsistent resubmissions.'}"
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <button
                                onClick={() => navigate(user?.role === 'recruiter' ? '/recruiter/dashboard' : '/seeker/dashboard')}
                                className="w-full sm:w-auto px-8 py-3.5 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-900 transition-all text-sm shadow-md"
                            >
                                Go to Dashboard
                            </button>
                            <a
                                href="/contact"
                                className="w-full sm:w-auto px-6 py-3.5 border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all text-sm"
                            >
                                Contact Support
                            </a>
                        </div>
                    </div>
                );
            case 'verified':
            case 'approved':
                // Two-stage UI for recruiters
                if (user?.role === 'recruiter') {
                     if (companyStatus === 'rejected') {
                         return (
                             <div className="text-center p-12 lg:p-20 bg-red-50/50 rounded-2xl border border-red-100 mx-auto w-full max-w-4xl">
                                 <div className="bg-red-100 text-red-500 w-20 h-20 rounded-full flex items-center justify-center shadow-inner mx-auto mb-6">
                                     <XCircle size={40} strokeWidth={2.5} />
                                 </div>
                                 <h2 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Company Verification Rejected</h2>
                                 <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto font-medium">
                                     Your identity is verified, but your company verification was rejected. Please contact support.
                                 </p>
                                 <button
                                     onClick={() => navigate('/recruiter/dashboard')}
                                     className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-600/30 hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm"
                                 >
                                     Go to Dashboard
                                 </button>
                             </div>
                         );
                     } else if (companyStatus !== 'approved') {
                         return (
                             <div className="text-center p-12 lg:p-20 bg-blue-50/50 rounded-2xl border border-blue-100 mx-auto w-full max-w-4xl">
                                 <div className="bg-blue-100 text-blue-500 w-20 h-20 rounded-full flex items-center justify-center shadow-inner mx-auto mb-6 relative">
                                     <div className="absolute inset-0 bg-blue-200 rounded-full animate-ping opacity-25"></div>
                                     <Clock size={40} strokeWidth={3} />
                                 </div>
                                 <h2 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Step 2: Company Review</h2>
                                 <p className="text-gray-600 text-sm mb-8 max-w-sm mx-auto font-medium">
                                     Your personal identity is <strong className="text-emerald-600">approved</strong>. Your company profiling is currently under review by our team.
                                 </p>
                                 <button
                                     onClick={() => navigate('/recruiter/dashboard')}
                                     className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#29a08e] to-[#228377] text-white rounded-xl font-bold shadow-lg shadow-[#29a08e]/30 hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm"
                                 >
                                     View Dashboard (Limited)
                                 </button>
                             </div>
                         );
                     }
                }
                
                return (
                    <div className="text-center p-12 lg:p-20 bg-emerald-50/50 rounded-2xl border border-emerald-100 mx-auto w-full max-w-4xl">
                        <div className="bg-emerald-100 text-emerald-500 w-20 h-20 rounded-full flex items-center justify-center shadow-inner mx-auto mb-6">
                            <CheckCircle size={40} strokeWidth={3} />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Identity Verified</h2>
                        <p className="text-gray-600 text-sm mb-8 max-w-sm mx-auto font-medium">
                            {user?.role === 'recruiter' 
                                ? 'Congratulations! Both your personal identity and company profile have been authenticated. You now have full recruiter access.' 
                                : 'Congratulations! Your documentation has been authenticated. You now have unrestricted access to all portal features.'}
                        </p>
                        <button
                            onClick={() => navigate(user?.role === 'recruiter' ? '/recruiter/dashboard' : '/seeker/dashboard')}
                            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#29a08e] to-[#228377] text-white rounded-xl font-bold shadow-lg shadow-[#29a08e]/30 hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                );
            default:
                return (
                    <div className="text-center p-12 lg:p-20 bg-gray-50 rounded-2xl border border-gray-200 mx-auto w-full max-w-4xl">
                        <div className="bg-gray-200 text-gray-400 w-20 h-20 rounded-full flex items-center justify-center shadow-inner mx-auto mb-6">
                            <HelpCircle size={40} strokeWidth={2.5} />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Unknown Status</h2>
                        <p className="text-gray-600 text-sm mb-6 font-medium">
                            Current Status: <span className="px-2 py-1 bg-gray-200 rounded text-gray-800 font-bold uppercase tracking-widest text-[10px] ml-1">{user?.kycStatus || 'None'}</span>
                        </p>
                        <button
                            onClick={() => refreshUser()}
                            className="flex items-center justify-center gap-2 mx-auto w-full sm:w-auto px-8 py-3.5 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-900 transition-all text-sm shadow-md"
                        >
                            <RefreshCw size={16} /> Sync Status
                        </button>
                    </div>
                );
        }
    };

    return (
        <div className="w-full flex justify-center items-start min-h-[calc(100vh-8rem)]">
            <div className="w-full max-w-6xl shadow-xl rounded-2xl overflow-hidden bg-white border border-gray-100 animate-in fade-in zoom-in duration-300">
                <div className="bg-[#29a08e] px-8 py-8 text-white text-center">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Verification Center
                    </h1>
                    <p className="text-white/90 text-sm mt-2 font-medium tracking-wide">Secure identity & compliance checks</p>
                </div>
                
                <div className="p-8 sm:p-16 w-full flex justify-center">
                    {renderStatus()}
                </div>
            </div>
        </div>
    );
};

export default KYCStatus;
