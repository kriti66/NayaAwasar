import { useState, useEffect } from 'react';
import api from '../../services/api';
import { API_BASE_URL } from '../../config/api';
import {
    ShieldCheck,
    ShieldX,
    FileText,
    Calendar,
    Building2,
    BadgeCheck,
    AlertTriangle,
    ChevronRight,
    ExternalLink,
    Search,
    User,
    Clock,
    Eye,
    Check,
    X,
    ShieldQuestion
} from 'lucide-react';

const resolveAssetUrl = (path) => {
    if (!path || typeof path !== 'string') return '';
    const trimmed = path.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (trimmed.startsWith('/')) return `${API_BASE_URL}${trimmed}`;
    return `${API_BASE_URL}/${trimmed}`;
};

const KycImagePreview = ({ label, path }) => {
    const [failed, setFailed] = useState(false);
    const url = resolveAssetUrl(path);
    const showImage = !!url && !failed;

    return (
        <div className="space-y-2">
            <div className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 bg-gray-50 group shadow-sm hover:shadow-md transition-shadow">
                {showImage ? (
                    <>
                        <img
                            src={url}
                            alt={label}
                            className="w-full h-full object-cover"
                            onError={() => setFailed(true)}
                        />
                        <a href={url} target="_blank" rel="noreferrer" className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/70 to-transparent flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="flex items-center gap-1.5 text-white text-xs font-bold">
                                <ExternalLink className="w-3.5 h-3.5" /> View Full
                            </span>
                        </a>
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center px-3 text-center">
                        <p className="text-[11px] font-semibold text-gray-400">No image uploaded</p>
                    </div>
                )}
            </div>
            <p className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-wider">{label}</p>
        </div>
    );
};

function getProofCardsByRole(kyc) {
    const role = kyc?.role === 'recruiter' ? 'recruiter' : 'jobseeker';

    if (role === 'recruiter') {
        return [
            { label: 'ID Front', path: kyc.idFrontUrl || kyc.idFront || kyc.documentFront },
            { label: 'ID Back', path: kyc.idBackUrl || kyc.idBack || kyc.documentBack },
            { label: 'Company Reg', path: kyc.registrationDocument || kyc.registrationDocUrl },
            { label: 'Tax Doc', path: kyc.taxDocument || kyc.taxDocUrl },
            { label: 'Company Logo', path: kyc.companyLogo }
        ];
    }

    return [
        { label: 'ID Front', path: kyc.documentFront || kyc.idFront },
        { label: 'ID Back', path: kyc.documentBack || kyc.idBack },
        { label: 'Selfie', path: kyc.selfieWithId || kyc.selfie }
    ];
}

function getIdentityDetailsByRole(kyc) {
    if (kyc?.role === 'recruiter') {
        return [
            { label: 'Type', value: kyc.idType || '—' },
            { label: 'ID Number', value: kyc.idNumber || '—' },
            { label: 'Job Title', value: kyc.jobTitle || '—' },
            { label: 'Official Email', value: kyc.officialEmail || kyc.email || '—' },
            { label: 'Phone', value: kyc.phoneNumber || '—' }
        ];
    }

    return [
        { label: 'Type', value: kyc?.idType || '—' },
        { label: 'ID Number', value: kyc?.idNumber || '—' },
        {
            label: 'DOB',
            value: kyc?.dateOfBirth ? new Date(kyc.dateOfBirth).toLocaleDateString() : '—'
        },
        { label: 'Nationality', value: kyc?.nationality || '—' }
    ];
}

const AdminKYCPanel = () => {
    const [pendingKYC, setPendingKYC] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedKYC, setSelectedKYC] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [processing, setProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchPendingKYC();
    }, []);

    const fetchPendingKYC = async () => {
        try {
            const [seekerRes, recruiterRes] = await Promise.all([
                api.get('/admin/kyc/pending'),
                api.get('/admin/kyc/recruiter/pending')
            ]);

            const recruiterData = recruiterRes.data.map(k => ({
                ...k,
                role: 'recruiter',
                fullName: k.userId?.fullName || k.fullName,
                email: k.userId?.email || k.officialEmail,
                userId: k.userId
            }));

            const seekerData = seekerRes.data.map(k => ({
                ...k,
                role: k.role || 'jobseeker'
            }));

            setPendingKYC([...seekerData, ...recruiterData]);
        } catch (err) {
            console.error('Error fetching KYC:', err);
        } finally {
            setLoading(false);
        }
    };

    const getUserId = (kyc) => {
        return kyc.userId?._id || kyc.userId || kyc._id;
    };

    const handleApprove = async (kycRecord) => {
        const userId = getUserId(kycRecord);
        const kycId = kycRecord._id;
        setProcessing(true);
        try {
            if (kycRecord.role === 'recruiter') {
                await api.put(`/admin/kyc/recruiter/review/${kycId}`, { decision: 'approved' });
            } else {
                await api.patch(`/admin/kyc/${userId}/approve`);
            }
            setPendingKYC((prev) => prev.filter((k) => k._id !== kycId && getUserId(k) !== userId));
            setSelectedKYC(null);
        } catch (err) {
            alert(err.response?.data?.message || 'Approval failed');
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async (kycRecord) => {
        if (!rejectionReason.trim()) {
            alert('Please enter a reason for rejection.');
            return;
        }
        const userId = getUserId(kycRecord);
        const kycId = kycRecord._id;
        setProcessing(true);
        try {
            if (kycRecord.role === 'recruiter') {
                await api.put(`/admin/kyc/recruiter/review/${kycId}`, { decision: 'rejected', reason: rejectionReason.trim() });
            } else {
                await api.patch(`/admin/kyc/${userId}/reject`, { rejectionReason: rejectionReason.trim() });
            }

            setPendingKYC((prev) => prev.filter((k) => k._id !== kycId && getUserId(k) !== userId));
            setSelectedKYC(null);
            setRejectionReason('');
        } catch (err) {
            alert(err.response?.data?.message || 'Rejection failed');
        } finally {
            setProcessing(false);
        }
    };

    const filteredKYC = pendingKYC.filter(kyc =>
        kyc.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        kyc.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex-1 w-full flex flex-col min-h-[calc(100vh-64px)]">
            {/* Hero Header */}
            <div className="relative bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] overflow-hidden shrink-0">
                <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-10 w-10 bg-purple-500/20 rounded-xl flex items-center justify-center border border-purple-500/30">
                                    <ShieldCheck className="h-5 w-5 text-purple-400" />
                                </div>
                                <span className="text-[11px] font-bold text-purple-400 uppercase tracking-[0.2em]">Identity Verification</span>
                            </div>
                            <h1 className="text-3xl font-black text-white tracking-tight">KYC Verification</h1>
                            <p className="text-gray-400 mt-1.5 font-medium text-sm">Review and process pending verification requests.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="px-4 py-2.5 rounded-xl border bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs font-bold">
                                {pendingKYC.length} Pending
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 pb-12 relative z-10 w-full">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full" style={{ minHeight: '600px' }}>
                    {/* Queue List */}
                    <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-gray-100 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                    <div className="h-6 w-6 bg-[#29a08e]/10 rounded-lg flex items-center justify-center">
                                        <Clock className="w-3 h-3 text-[#29a08e]" />
                                    </div>
                                    Queue
                                </h2>
                                <span className="text-[11px] font-bold text-[#29a08e] bg-[#29a08e]/10 px-2.5 py-1 rounded-lg">
                                    {pendingKYC.length} items
                                </span>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search applicants..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#29a08e]/30 focus:border-[#29a08e] outline-none transition-all"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <div className="divide-y divide-gray-50">
                                {filteredKYC.map(kyc => (
                                    <div
                                        key={kyc._id || getUserId(kyc)}
                                        onClick={() => setSelectedKYC(kyc)}
                                        className={`p-4 cursor-pointer transition-all hover:bg-[#29a08e]/[0.03] border-l-[3px] ${selectedKYC?._id === kyc._id ? 'border-[#29a08e] bg-[#29a08e]/[0.04]' : 'border-transparent'}`}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${kyc.role === 'recruiter' ? 'bg-gradient-to-br from-purple-500 to-purple-600' : 'bg-gradient-to-br from-emerald-500 to-emerald-600'}`}>
                                                    {kyc.fullName.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-sm font-semibold text-gray-900 truncate">{kyc.fullName}</h3>
                                                    <p className="text-xs text-gray-400 truncate">{kyc.email}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-tight shrink-0 border ${kyc.role === 'recruiter'
                                                ? 'bg-purple-50 text-purple-600 border-purple-200'
                                                : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                            }`}>
                                                {kyc.role}
                                            </span>
                                        </div>
                                        <div className="mt-2 text-[10px] text-gray-400 flex items-center gap-1 ml-13">
                                            <Clock className="w-3 h-3" />
                                            {kyc.createdAt ? new Date(kyc.createdAt).toLocaleDateString() : '—'}
                                        </div>
                                    </div>
                                ))}
                                {loading ? (
                                    [1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-50 animate-pulse m-3 rounded-xl"></div>)
                                ) : filteredKYC.length === 0 && (
                                    <div className="p-10 text-center">
                                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-gray-100">
                                            <ShieldCheck className="w-6 h-6 text-gray-300" />
                                        </div>
                                        <p className="text-sm font-semibold text-gray-500">Queue is empty</p>
                                        <p className="text-xs text-gray-400 mt-1">No pending verifications.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Detail View */}
                    <div className="lg:col-span-8 h-full">
                        {selectedKYC ? (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-full flex flex-col overflow-hidden">
                                {/* Detail Header */}
                                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-sm ${selectedKYC.role === 'recruiter' ? 'bg-gradient-to-br from-purple-500 to-purple-600' : 'bg-gradient-to-br from-[#29a08e] to-[#228377]'}`}>
                                            {selectedKYC.fullName.charAt(0)}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-gray-900">{selectedKYC.fullName}</h2>
                                            <p className="text-xs text-gray-400 font-medium mt-0.5">
                                                <span className="capitalize">{selectedKYC.role}</span> applicant • <span className="text-amber-500 font-bold">Pending Review</span>
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        disabled={processing}
                                        onClick={() => handleApprove(selectedKYC)}
                                        className="px-6 py-2.5 bg-gradient-to-r from-[#29a08e] to-[#228377] text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-[#29a08e]/20 transition-all disabled:opacity-50 flex items-center gap-2 active:scale-[0.98]"
                                    >
                                        <Check className="w-4 h-4" />
                                        Approve
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <User className="w-3.5 h-3.5 text-[#29a08e]" />
                                                Identity Details
                                            </h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                {getIdentityDetailsByRole(selectedKYC).map((item, i) => (
                                                    <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">{item.label}</p>
                                                        <p className="text-sm font-semibold text-gray-900">{item.value}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {selectedKYC.role === 'recruiter' && (
                                            <div className="space-y-4">
                                                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                    <Building2 className="w-3.5 h-3.5 text-purple-500" />
                                                    Company Info
                                                </h3>
                                                <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 space-y-3">
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Company Name</p>
                                                        <p className="text-sm font-semibold text-gray-900">{selectedKYC.companyName || '—'}</p>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Reg No</p>
                                                            <p className="text-xs font-semibold text-gray-900">{selectedKYC.registrationNumber || '—'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Industry</p>
                                                            <p className="text-xs font-semibold text-gray-900">{selectedKYC.industry || '—'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Address</p>
                                                            <p className="text-xs font-semibold text-gray-900">{selectedKYC.companyAddress || '—'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Website</p>
                                                            <p className="text-xs font-semibold text-gray-900">{selectedKYC.website || '—'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <FileText className="w-3.5 h-3.5 text-[#29a08e]" />
                                            Verification Proofs
                                        </h3>
                                        <div className="grid grid-cols-3 gap-4">
                                            {getProofCardsByRole(selectedKYC).map((img, i) => (
                                                <KycImagePreview key={i} label={img.label} path={img.path} />
                                            ))}
                                        </div>
                                    </div>

                                    {selectedKYC.rejectionHistory && selectedKYC.rejectionHistory.length > 0 && (
                                        <div className="space-y-4">
                                            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                                Rejection History ({selectedKYC.resubmissionCount || 0}/3 used)
                                            </h3>
                                            <div className="space-y-3">
                                                {selectedKYC.rejectionHistory.map((hist, i) => (
                                                    <div key={i} className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-[10px] font-bold uppercase text-amber-600 bg-amber-100 px-2 py-0.5 rounded-md">Attempt {i + 1} Rejected</span>
                                                            <span className="text-[10px] text-gray-400">{new Date(hist.rejectedAt).toLocaleString()}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-700 italic mt-2">"{hist.reason}"</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-6 bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl border border-red-100">
                                        <h3 className="text-sm font-black text-red-900 mb-2 flex items-center gap-2">
                                            <ShieldX className="w-4 h-4 text-red-500" />
                                            Reject Verification
                                        </h3>
                                        <p className="text-sm font-medium text-red-800 mb-4">
                                            {selectedKYC.resubmissionCount >= 3 
                                                ? "Note: User has reached max attempts and will be locked upon this rejection." 
                                                : `User has used ${selectedKYC.resubmissionCount || 0}/3 allowed re-submissions.`}
                                        </p>
                                        <div className="space-y-4">
                                            <div>
                                                <label htmlFor="rejection-reason" className="block text-sm font-bold text-gray-900 mb-2">
                                                    Rejection Reason
                                                </label>
                                                <textarea
                                                    id="rejection-reason"
                                                    value={rejectionReason}
                                                    onChange={(e) => setRejectionReason(e.target.value)}
                                                    className="w-full min-h-[100px] px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 bg-white border-2 border-red-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all resize-y"
                                                    placeholder="Provide a clear, specific reason for rejection..."
                                                    rows="3"
                                                    aria-required="true"
                                                />
                                            </div>
                                            <button
                                                disabled={processing}
                                                onClick={() => handleReject(selectedKYC)}
                                                className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold py-2.5 rounded-xl hover:shadow-lg hover:shadow-red-500/20 transition-all text-sm active:scale-[0.98] disabled:opacity-50"
                                            >
                                                Reject KYC
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center p-12">
                                <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 border border-gray-100 text-gray-200">
                                    <ShieldQuestion className="w-9 h-9" />
                                </div>
                                <h3 className="text-lg font-black text-gray-900">Select an Applicant</h3>
                                <p className="text-sm text-gray-400 mt-1 max-w-xs">Choose an applicant from the queue to view their verification details.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminKYCPanel;
