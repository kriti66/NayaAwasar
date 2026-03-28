import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

import companyService from '../../services/companyService';
import { getRecruiterKycVerificationDisplay } from '../../utils/recruiterVerificationDisplay';
import {
    Building2,
    MapPin,
    Globe,
    Users,
    Calendar,
    Mail,
    ShieldCheck,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ChevronLeft,
    Briefcase,
    Globe2,
    History,
    FileText,
    ExternalLink,
    Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdminCompanyReview = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchCompanyData = async () => {
        try {
            setLoading(true);
            const data = await companyService.adminGetCompanyDetails(id);
            setCompany(data);
        } catch (error) {
            console.error(error);
            toast.error("Data Retrieval Error: Failed to fetch organization dossier.");
            navigate('/admin/companies');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanyData();
    }, [id]);

    const handleSuspend = async () => {
        const comment = prompt('Suspend this company?\n\nEnter a reason (required):');
        if (comment === null) return;
        if (!comment.trim()) {
            toast.error('Suspension reason is required.');
            return;
        }
        try {
            const res = await companyService.adminUpdateCompanyStatus(id, 'suspended', comment.trim());
            toast.success(res.message || 'Company suspended.');
            fetchCompanyData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to suspend company.');
        }
    };

    const handleReactivate = async () => {
        if (!window.confirm('Reactivate this company?')) return;
        try {
            const res = await companyService.adminUpdateCompanyStatus(id, 'approved', '');
            toast.success(res.message || 'Company reactivated.');
            fetchCompanyData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reactivate company.');
        }
    };

    if (loading) return (
        <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-64px)]">
            <div className="w-10 h-10 border-[3px] border-[#29a08e]/20 border-t-[#29a08e] rounded-full animate-spin"></div>
        </div>
    );

    if (!company) return null;

    const primaryRecruiter = company.recruiters?.[0];
    const kycDisplay = getRecruiterKycVerificationDisplay(primaryRecruiter);
    const isRecruiterKycVerified = kycDisplay.tone === 'verified';

    const getStatusConfig = (status) => {
        switch(status) {
            case 'approved': return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', gradient: 'from-emerald-500 to-emerald-600', icon: CheckCircle2 };
            case 'rejected': return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', gradient: 'from-red-500 to-red-600', icon: XCircle };
            case 'suspended': return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', gradient: 'from-amber-500 to-amber-600', icon: AlertCircle };
            default: return { bg: 'bg-[#29a08e]/10', text: 'text-[#29a08e]', border: 'border-[#29a08e]/20', gradient: 'from-[#29a08e] to-[#228377]', icon: Clock };
        }
    };

    const statusConfig = getStatusConfig(company.status);
    const StatusIcon = statusConfig.icon;

    return (
        <div className="flex-1 w-full flex flex-col">
                {/* Hero Header */}
                <div className="relative bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    
                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <button onClick={() => navigate('/admin/companies')} className="mt-1 p-2.5 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white border border-white/10">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="h-10 w-10 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30">
                                            <Building2 className="h-5 w-5 text-indigo-400" />
                                        </div>
                                        <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Company Review</span>
                                    </div>
                                    <h1 className="text-3xl font-black text-white tracking-tight">{company.name}</h1>
                                    <p className="text-gray-400 mt-1.5 font-medium text-sm max-w-xl">
                                        Organization details and moderation. Verification approve/reject is done in the{' '}
                                        <Link to="/admin/kyc" className="text-indigo-300 hover:text-white underline font-semibold">
                                            KYC panel
                                        </Link>
                                        .
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                <Link
                                    to="/admin/kyc"
                                    className="px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-all"
                                >
                                    <ShieldCheck className="w-4 h-4" /> KYC panel
                                </Link>
                                {!isRecruiterKycVerified && (
                                    <span className="text-xs text-orange-300 font-bold flex items-center gap-1.5 bg-orange-500/20 px-3.5 py-2 rounded-xl border border-orange-500/30">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        Recruiter verification: use KYC panel
                                    </span>
                                )}
                                {company.status === 'approved' && (
                                    <button
                                        type="button"
                                        onClick={handleSuspend}
                                        className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-amber-500/20 transition-all flex items-center gap-2 active:scale-[0.98]"
                                    >
                                        <AlertCircle className="w-4 h-4" /> Suspend
                                    </button>
                                )}
                                {company.status === 'suspended' && (
                                    <button
                                        type="button"
                                        onClick={handleReactivate}
                                        className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center gap-2 active:scale-[0.98]"
                                    >
                                        <CheckCircle2 className="w-4 h-4" /> Reactivate
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 -mt-6 pb-12 relative z-10 space-y-8">
                    {/* Status Overview Card */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${statusConfig.gradient} text-white shadow-sm`}>
                                <StatusIcon className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">Profile status</p>
                                <p className="text-2xl font-black capitalize text-gray-900">{company.status}</p>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-2">Recruiter KYC</p>
                                <p
                                    className={`text-sm font-black mt-0.5 ${
                                        kycDisplay.tone === 'verified'
                                            ? 'text-emerald-700'
                                            : kycDisplay.tone === 'rejected'
                                              ? 'text-red-700'
                                              : 'text-sky-800'
                                    }`}
                                >
                                    {kycDisplay.label}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">{kycDisplay.detail}</p>
                                {company.status === 'rejected' && (company.rejectionReason || company.adminFeedback) && (
                                    <p className="text-sm text-red-600 font-medium mt-2 max-w-md">Reason: {company.rejectionReason || company.adminFeedback}</p>
                                )}
                                {company.reapplyCount > 0 && (
                                    <p className="text-xs text-gray-500 mt-1">Resubmissions: {company.reapplyCount} / 3</p>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">Active Job Listings</p>
                            <p className="text-3xl font-black text-gray-900">{company.stats?.totalJobs || 0}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            {/* Profile Details */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-[#29a08e]" />
                                    Company Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[
                                        { label: 'Industry', value: company.industry },
                                        { label: 'Company Size', value: company.size ? `${company.size} Employees` : '—' },
                                        { label: 'Headquarters', value: company.headquarters || '—' },
                                    ].map((item, i) => (
                                        <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{item.label}</p>
                                            <p className="text-sm font-semibold text-gray-900">{item.value}</p>
                                        </div>
                                    ))}
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Website</p>
                                        <a href={company.website} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#29a08e] hover:text-[#228377] flex items-center gap-1 transition-colors">
                                            {company.website} <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                </div>
                                <div className="mt-8 pt-8 border-t border-gray-100">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-3">About / Mission</p>
                                    <p className="text-sm text-gray-600 leading-relaxed italic bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        {company.about?.mission || 'No mission statement provided.'}
                                    </p>
                                </div>
                            </div>

                            {/* Verification Audit Log */}
                            {company.adminFields?.verificationAuditLog?.length > 0 && (
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                                    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-[#29a08e]" />
                                        Verification Audit Log
                                    </h3>
                                    <div className="space-y-4">
                                        {company.adminFields.verificationAuditLog.slice().reverse().map((log, i) => (
                                            <div key={i} className={`flex gap-4 p-4 rounded-xl border ${
                                                log.action === 'rejected' || log.action === 'locked' ? 'bg-red-50 border-red-100' :
                                                log.action === 'resubmitted' ? 'bg-amber-50 border-amber-100' :
                                                'bg-gray-50 border-gray-100'
                                            }`}>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                                                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md ${
                                                            log.action === 'rejected' || log.action === 'locked' ? 'bg-red-200 text-red-800' :
                                                            log.action === 'resubmitted' ? 'bg-amber-200 text-amber-800' :
                                                            'bg-emerald-200 text-emerald-800'
                                                        }`}>{log.action}</span>
                                                        <span className="text-[10px] text-gray-400 font-medium">{new Date(log.date).toLocaleString()}</span>
                                                    </div>
                                                    {log.rejectionReason && <p className="text-sm text-gray-700 mb-1"><strong>Reason:</strong> {log.rejectionReason}</p>}
                                                    {log.reapplyCount != null && <p className="text-xs text-gray-500">Resubmission # {log.reapplyCount}</p>}
                                                    <p className="text-[10px] text-gray-400 mt-2 font-medium">By: {log.adminId?.fullName || log.adminId || 'System'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Activity History */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <History className="w-4 h-4 text-[#29a08e]" />
                                    Review History
                                </h3>
                                <div className="space-y-4">
                                    {company.adminFields?.reviewHistory?.slice().reverse().map((log, i) => (
                                        <div key={i} className="flex gap-4 p-4 bg-gray-50 border border-gray-100 rounded-xl hover:border-[#29a08e]/20 transition-colors">
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] font-black text-[#29a08e] uppercase bg-[#29a08e]/10 px-2.5 py-0.5 rounded-md">{log.action}</span>
                                                    <span className="text-[10px] text-gray-400 font-medium">{new Date(log.date).toLocaleString()}</span>
                                                </div>
                                                <p className="text-sm text-gray-600 italic">"{log.comment}"</p>
                                                <p className="text-[10px] text-gray-400 mt-2 font-medium">Admin: {log.adminId?.fullName || log.adminId || 'System'}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!company.adminFields?.reviewHistory || company.adminFields.reviewHistory.length === 0) && (
                                        <div className="text-center py-8">
                                            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-gray-100">
                                                <History className="w-6 h-6 text-gray-300" />
                                            </div>
                                            <p className="text-sm font-semibold text-gray-500">No review logs available</p>
                                            <p className="text-xs text-gray-400 mt-1">History will appear when actions are taken.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            {/* Ownership & Contact */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 border-b border-gray-100 pb-3">Ownership & Contact</h3>
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-3">Recruiter</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#29a08e] to-[#228377] text-white flex items-center justify-center font-bold shadow-sm">
                                                {company.recruiters?.[0]?.fullName?.charAt(0) || 'R'}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-gray-900 truncate">{company.recruiters?.[0]?.fullName}</p>
                                                <p className="text-xs text-gray-400 truncate">{company.recruiters?.[0]?.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Contact Email</p>
                                        <p className="text-sm font-semibold text-gray-900">{company.contact?.email}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Office Address</p>
                                        <p className="text-xs font-medium text-gray-600">{company.contact?.address}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Verification Section */}
                            <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden border border-white/10">
                                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                                <FileText className="absolute -top-4 -right-4 w-24 h-24 text-white/5" />
                                <h3 className="text-[11px] font-black text-[#29a08e] uppercase tracking-[0.2em] mb-6 relative z-10">Verification</h3>
                                <div className="space-y-4 relative z-10">
                                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-3 tracking-wider">Legal Documents</p>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-xs text-gray-300 hover:text-[#29a08e] transition-colors cursor-pointer p-2 hover:bg-white/5 rounded-lg">
                                                <ExternalLink className="w-3 h-3" /> Business_License.pdf
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-300 hover:text-[#29a08e] transition-colors cursor-pointer p-2 hover:bg-white/5 rounded-lg">
                                                <ExternalLink className="w-3 h-3" /> Tax_Clearance.pdf
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-4 py-3 bg-[#29a08e]/10 border border-[#29a08e]/20 rounded-xl flex flex-col items-start">
                                        <p className="text-[10px] font-black text-[#29a08e] uppercase tracking-wider">Recruiter KYC</p>
                                        <div
                                            className={`mt-1.5 text-xs font-bold uppercase rounded-lg px-3 py-1 ${
                                                kycDisplay.tone === 'verified'
                                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                    : kycDisplay.tone === 'rejected'
                                                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                                      : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                            }`}
                                        >
                                            {kycDisplay.label}
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
                                            Approve or reject in the{' '}
                                            <Link to="/admin/kyc" className="text-[#29a08e] hover:underline font-bold">
                                                KYC panel
                                            </Link>
                                            .
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
        </div>
    );
};

export default AdminCompanyReview;
