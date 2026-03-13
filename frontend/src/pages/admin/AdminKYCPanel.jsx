import { useState, useEffect } from 'react';
import DashboardNavbar from '../../components/dashboard/DashboardNavbar';
import api from '../../services/api';
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

const API_BASE = import.meta.env.VITE_API_URL || '';

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

            // Transform Recruiter Data to match UI structure if needed
            const recruiterData = recruiterRes.data.map(k => ({
                ...k,
                role: 'recruiter', // Ensure role identifies it
                fullName: k.userId?.fullName || k.fullName,
                email: k.userId?.email || k.officialEmail,
                userId: k.userId
            }));

            // Transform Seeker Data just in case
            const seekerData = seekerRes.data.map(k => ({
                ...k,
                role: k.role || 'jobseeker' // Default if not present
            }));

            // Merge
            setPendingKYC([...seekerData, ...recruiterData]);
        } catch (err) {
            console.error('Error fetching KYC:', err);
        } finally {
            setLoading(false);
        }
    };

    const getUserId = (kyc) => {
        // Handle different ID structures
        return kyc.userId?._id || kyc.userId || kyc._id;
    };

    const handleApprove = async (kycRecord) => {
        const userId = getUserId(kycRecord);
        const kycId = kycRecord._id; // Recruiter kyc uses its own ID for review
        setProcessing(true);
        try {
            if (kycRecord.role === 'recruiter') {
                await api.put(`/admin/kyc/recruiter/review/${kycId}`, { decision: 'approved' });
            } else {
                await api.patch(`/admin/kyc/${userId}/approve`);
            }
            // Remove from list
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
        <div className="flex-1 w-full flex flex-col h-[calc(100vh-64px)] overflow-hidden">
            <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">KYC Verification</h1>
                    <p className="text-xs text-gray-500">Review pending verification requests.</p>
                </div>
            </header>

            <main className="flex-1 p-8 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
                    {/* Queue List */}
                    <div className="lg:col-span-4 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-200 space-y-4">
                            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                                Queue ({pendingKYC.length})
                            </h2>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#29a08e] outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <div className="divide-y divide-gray-100">
                                {filteredKYC.map(kyc => (
                                    <div
                                        key={kyc._id || getUserId(kyc)}
                                        onClick={() => setSelectedKYC(kyc)}
                                        className={`p-4 cursor-pointer transition-all hover:bg-gray-50 border-l-4 ${selectedKYC?._id === kyc._id ? 'border-[#29a08e] bg-[#29a08e]/5' : 'border-transparent'}`}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <h3 className="text-sm font-semibold text-gray-900 truncate">{kyc.fullName}</h3>
                                                <p className="text-xs text-gray-500 truncate">{kyc.email}</p>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight shrink-0 ${kyc.role === 'recruiter'
                                                ? 'bg-purple-100 text-purple-700'
                                                : 'bg-green-100 text-green-700'
                                                }`}>
                                                {kyc.role}
                                            </span>
                                        </div>
                                        <div className="mt-2 text-[10px] text-gray-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {kyc.createdAt ? new Date(kyc.createdAt).toLocaleDateString() : '—'}
                                        </div>
                                    </div>
                                ))}
                                {loading ? (
                                    [1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-50 animate-pulse m-4 rounded-lg"></div>)
                                ) : filteredKYC.length === 0 && (
                                    <div className="p-8 text-center">
                                        <p className="text-xs text-gray-400">Queue is empty</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Detail View */}
                    <div className="lg:col-span-8 h-full">
                        {selectedKYC ? (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full flex flex-col overflow-hidden">
                                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-[#29a08e]/20 rounded-lg flex items-center justify-center text-[#29a08e] font-bold text-xl">
                                            {selectedKYC.fullName.charAt(0)}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">{selectedKYC.fullName}</h2>
                                            <p className="text-xs text-gray-500">{selectedKYC.role} applicant • Pending</p>
                                        </div>
                                    </div>
                                    <button
                                        disabled={processing}
                                        onClick={() => handleApprove(selectedKYC)}
                                        className="px-6 py-2 bg-[#29a08e] text-white rounded-lg text-sm font-bold hover:bg-[#228377] transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <Check className="w-4 h-4" />
                                        Approve
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Identity Details</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                {[
                                                    { label: 'Type', value: selectedKYC.idType },
                                                    { label: 'ID Number', value: selectedKYC.idNumber },
                                                    { label: 'DOB', value: selectedKYC.dateOfBirth ? new Date(selectedKYC.dateOfBirth).toLocaleDateString() : '—' },
                                                    { label: 'Nationality', value: selectedKYC.nationality || '—' }
                                                ].map((item, i) => (
                                                    <div key={i}>
                                                        <p className="text-[10px] text-gray-400 font-medium mb-0.5">{item.label}</p>
                                                        <p className="text-sm font-semibold text-gray-900">{item.value}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {selectedKYC.role === 'recruiter' && (
                                            <div className="space-y-4">
                                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Company Info</h3>
                                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3">
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 font-medium">Company Name</p>
                                                        <p className="text-sm font-semibold text-gray-900">{selectedKYC.companyName}</p>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <p className="text-[10px] text-gray-400 font-medium">Reg No</p>
                                                            <p className="text-xs font-semibold text-gray-900">{selectedKYC.registrationNumber}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-gray-400 font-medium">Industry</p>
                                                            <p className="text-xs font-semibold text-gray-900">{selectedKYC.industry}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Verification Proofs</h3>
                                        <div className="grid grid-cols-3 gap-4">
                                            {[
                                                { label: 'ID Front', path: selectedKYC.documentFront || selectedKYC.idFrontUrl },
                                                { label: 'ID Back', path: selectedKYC.documentBack || selectedKYC.idBackUrl },
                                                { label: 'Selfie', path: selectedKYC.selfieWithId },
                                                { label: 'Company Reg', path: selectedKYC.registrationDocument || selectedKYC.registrationDocUrl },
                                                { label: 'Tax Doc', path: selectedKYC.taxDocument || selectedKYC.taxDocUrl },
                                                { label: 'Company Logo', path: selectedKYC.companyLogo }
                                            ].filter(p => p.path).map((img, i) => (
                                                <div key={i} className="space-y-2">
                                                    <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 bg-gray-50 group">
                                                        <img
                                                            src={`${API_BASE}${img.path}`}
                                                            alt={img.label}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <a href={`${API_BASE}${img.path}`} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <ExternalLink className="w-5 h-5 text-white" />
                                                        </a>
                                                    </div>
                                                    <p className="text-[10px] font-medium text-gray-500 text-center">{img.label}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {selectedKYC.rejectionHistory && selectedKYC.rejectionHistory.length > 0 && (
                                        <div className="space-y-4">
                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Rejection History ({selectedKYC.resubmissionCount || 0}/3 used)</h3>
                                            <div className="space-y-3">
                                                {selectedKYC.rejectionHistory.map((hist, i) => (
                                                    <div key={i} className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-[10px] font-bold uppercase text-orange-600">Attempt {i + 1} Rejected</span>
                                                            <span className="text-[10px] text-gray-400">{new Date(hist.rejectedAt).toLocaleString()}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-700 italic">"{hist.reason}"</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-6 bg-red-50 rounded-xl border border-red-100">
                                        <h3 className="text-sm font-bold text-red-900 mb-2">Reject Verification</h3>
                                        <p className="text-xs text-red-700 mb-4 opacity-80">
                                            {selectedKYC.resubmissionCount >= 3 
                                                ? "Note: User has reached max attempts and will be locked upon this rejection." 
                                                : `User has used ${selectedKYC.resubmissionCount || 0}/3 allowed re-submissions.`}
                                        </p>
                                        <div className="space-y-4">
                                            <textarea
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                className="w-full bg-white border border-red-200 rounded-lg p-3 text-sm outline-none focus:ring-1 focus:ring-red-500"
                                                placeholder="Reason for rejection..."
                                                rows="2"
                                            />
                                            <button
                                                disabled={processing}
                                                onClick={() => handleReject(selectedKYC)}
                                                className="w-full bg-red-600 text-white font-bold py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                                            >
                                                Reject KYC
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center p-12">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-200">
                                    <ShieldQuestion className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Selection Required</h3>
                                <p className="text-sm text-gray-500 mt-1">Select an applicant from the list to view details.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminKYCPanel;
