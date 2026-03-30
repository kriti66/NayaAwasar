import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { API_BASE_URL } from '../../config/api';
import {
    ShieldCheck,
    ShieldX,
    FileText,
    Building2,
    AlertTriangle,
    ExternalLink,
    Search,
    User,
    Clock,
    Check,
    ShieldQuestion,
    ImageOff,
    CheckCircle2,
    CircleDot,
    Loader2
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
        <div className="flex flex-col gap-2 min-w-0">
            <div className="relative aspect-square rounded-xl overflow-hidden border border-gray-200/80 bg-gradient-to-br from-gray-50 to-gray-100/80 group shadow-sm ring-1 ring-black/[0.03] hover:ring-[#29a08e]/20 hover:shadow-md transition-all">
                {showImage ? (
                    <>
                        <img
                            src={url}
                            alt={label}
                            className="w-full h-full object-cover"
                            onError={() => setFailed(true)}
                        />
                        <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/75 via-transparent to-transparent flex items-end justify-center pb-2.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <span className="flex items-center gap-1.5 text-white text-[11px] font-bold px-2 py-1 rounded-lg bg-black/30 backdrop-blur-sm">
                                <ExternalLink className="w-3.5 h-3.5 shrink-0" /> Open
                            </span>
                        </a>
                    </>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 px-2 text-center">
                        <div className="w-10 h-10 rounded-lg bg-gray-200/60 flex items-center justify-center text-gray-400">
                            <ImageOff className="w-5 h-5" strokeWidth={1.75} />
                        </div>
                        <p className="text-[10px] font-semibold text-gray-500 leading-tight">No file uploaded</p>
                    </div>
                )}
            </div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center leading-snug line-clamp-2" title={label}>
                {label}
            </p>
        </div>
    );
};

/** Single row in detail cards — value column handles long email/phone cleanly */
const DetailRow = ({ label, value, valueClassName = '' }) => (
    <div className="grid grid-cols-1 sm:grid-cols-[minmax(7rem,38%)_1fr] gap-1 sm:gap-4 py-2.5 border-b border-gray-100/90 last:border-0 last:pb-0 first:pt-0">
        <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide shrink-0 pt-0.5">
            {label}
        </div>
        <div
            className={`text-sm text-gray-900 font-medium min-w-0 ${valueClassName}`}
        >
            {value == null || value === '' ? '—' : value}
        </div>
    </div>
);

function getCompanyDetailRows(kyc) {
    return [
        { label: 'Company name', value: kyc?.company?.companyName || kyc.companyName },
        { label: 'Registration no.', value: kyc?.company?.registrationNumber || kyc.registrationNumber },
        { label: 'Industry', value: kyc?.company?.industry || kyc.industry },
        { label: 'Address', value: kyc?.company?.companyAddress || kyc.companyAddress },
        { label: 'Website', value: kyc?.company?.website || kyc.website, mono: true }
    ];
}

function identityValueTypography(label) {
    const l = String(label).toLowerCase();
    if (l.includes('email')) return 'break-all [overflow-wrap:anywhere] text-[13px] leading-snug';
    if (l.includes('phone')) return 'tabular-nums tracking-tight break-all sm:break-all text-[13px] leading-snug';
    return 'break-words [overflow-wrap:anywhere] leading-snug';
}

/** Normalize API status strings */
function normKycStatus(s) {
    return String(s || 'pending').toLowerCase();
}

/**
 * Recruiter KYC overall: approved only when both sections approved;
 * rejected if either section rejected; otherwise pending (includes partial progress).
 */
function getRecruiterKycOverallStatus(kyc) {
    const rep = normKycStatus(kyc?.representativeStatus);
    const comp = normKycStatus(kyc?.companyStatus);
    if (rep === 'approved' && comp === 'approved') return 'approved';
    if (rep === 'rejected' || comp === 'rejected') return 'rejected';
    return 'pending';
}

/**
 * Copy + styling hints for admin UI (queue row + detail header).
 */
function getRecruiterKycUiState(kyc) {
    const rep = normKycStatus(kyc?.representativeStatus);
    const comp = normKycStatus(kyc?.companyStatus);
    const overall = getRecruiterKycOverallStatus(kyc);

    if (overall === 'approved') {
        return {
            overall,
            rep,
            comp,
            label: 'Fully verified',
            description: 'Representative and company verification are complete.',
            tone: 'success',
            queueHint: 'Complete'
        };
    }
    if (overall === 'rejected') {
        let description = 'One or more verification steps were rejected.';
        if (rep === 'rejected' && comp !== 'rejected') {
            description = 'Representative verification was rejected.';
        } else if (comp === 'rejected' && rep !== 'rejected') {
            description = 'Company verification was rejected.';
        } else if (rep === 'rejected' && comp === 'rejected') {
            description = 'Representative and company verification were rejected.';
        }
        return {
            overall,
            rep,
            comp,
            label: 'Rejected',
            description,
            tone: 'danger',
            queueHint: 'Rejected'
        };
    }

    // Pending — includes “partial” (one approved, other still pending)
    if (rep === 'approved' && comp === 'pending') {
        return {
            overall,
            rep,
            comp,
            label: 'In progress',
            description: 'Representative approved, waiting for company verification.',
            tone: 'partial',
            queueHint: 'Rep ✓ · Company pending'
        };
    }
    if (rep === 'pending' && comp === 'approved') {
        return {
            overall,
            rep,
            comp,
            label: 'In progress',
            description: 'Company approved, waiting for representative verification.',
            tone: 'partial',
            queueHint: 'Company ✓ · Rep pending'
        };
    }
    return {
        overall,
        rep,
        comp,
        label: 'Awaiting review',
        description: 'Representative and company verification still need admin review.',
        tone: 'pending',
        queueHint: 'Both pending'
    };
}

const MIN_REJECTION_REASON_LENGTH = 10;
const MAX_RESUBMISSION_ATTEMPTS = 3;

function getProofCardsByRole(kyc) {
    const role = kyc?.role === 'recruiter' ? 'recruiter' : 'jobseeker';

    if (role === 'recruiter') {
        return [
            { label: 'Representative Photo', path: kyc?.representative?.selfieUrl || kyc.selfieUrl || kyc.selfieWithId },
            { label: 'ID Front', path: kyc?.representative?.idFrontUrl || kyc.idFrontUrl || kyc.idFront || kyc.documentFront },
            { label: 'ID Back', path: kyc?.representative?.idBackUrl || kyc.idBackUrl || kyc.idBack || kyc.documentBack },
            { label: 'Business Registration Document', path: kyc?.company?.registrationDocUrl || kyc.registrationDocument || kyc.registrationDocUrl },
            { label: 'Tax Registration Document', path: kyc?.company?.taxDocUrl || kyc.taxDocument || kyc.taxDocUrl },
            { label: 'Company Logo', path: kyc?.company?.companyLogo || kyc.companyLogo }
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
        const rep = kyc?.representative || {};
        return [
            { label: 'Full Name', value: kyc?.fullName || kyc?.userId?.fullName || '—' },
            { label: 'ID Type', value: rep.idType || kyc.idType || '—' },
            { label: 'ID Number', value: rep.idNumber || kyc.idNumber || '—' },
            { label: 'Job Title', value: rep.jobTitle || kyc.jobTitle || '—' },
            { label: 'Official Email', value: rep.officialEmail || kyc.officialEmail || kyc.email || '—' },
            { label: 'Phone', value: rep.phoneNumber || kyc.phoneNumber || '—' }
        ];
    }

    return [
        { label: 'Full Name', value: kyc?.fullName || kyc?.userId?.fullName || '—' },
        { label: 'Type', value: kyc?.idType || '—' },
        { label: 'ID Number', value: kyc?.idNumber || '—' },
        {
            label: 'DOB',
            value: kyc?.dob || kyc?.dateOfBirth ? new Date(kyc.dob || kyc.dateOfBirth).toLocaleDateString() : '—'
        },
        { label: 'Nationality', value: kyc?.nationality || '—' },
        { label: 'Address', value: kyc?.address || '—' }
    ];
}

const AdminKYCPanel = () => {
    const [pendingKYC, setPendingKYC] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedKYC, setSelectedKYC] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [repRejectReason, setRepRejectReason] = useState('');
    const [companyRejectReason, setCompanyRejectReason] = useState('');
    const [processing, setProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [rejectInlineError, setRejectInlineError] = useState('');
    const [repRejectInlineError, setRepRejectInlineError] = useState('');
    const [companyRejectInlineError, setCompanyRejectInlineError] = useState('');
    const [rejectModalSection, setRejectModalSection] = useState(null);
    const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);
    const rejectModalRef = useRef(null);
    const rejectModalCancelRef = useRef(null);

    useEffect(() => {
        fetchPendingKYC();
    }, []);

    useEffect(() => {
        setRejectConfirmOpen(false);
        setRejectModalSection(null);
        setRepRejectReason('');
        setCompanyRejectReason('');
        setRepRejectInlineError('');
        setCompanyRejectInlineError('');
    }, [selectedKYC?._id]);

    const fetchPendingKYC = async (opts = {}) => {
        const quiet = opts.quiet === true;
        const preserveSelection = opts.preserveSelection === true;
        if (!quiet) setLoading(true);
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

            const next = [...seekerData, ...recruiterData];
            setPendingKYC(next);
            if (preserveSelection) {
                setSelectedKYC((prev) => {
                    if (!prev?._id) return prev;
                    return next.find((k) => k._id === prev._id) || null;
                });
            }
        } catch (err) {
            console.error('Error fetching KYC:', err);
        } finally {
            if (!quiet) setLoading(false);
        }
    };

    const getUserId = (kyc) => {
        return kyc.userId?._id || kyc.userId || kyc._id;
    };

    const handleApprove = async (kycRecord, section = 'representative') => {
        const userId = getUserId(kycRecord);
        const kycId = kycRecord._id;
        setProcessing(true);
        try {
            if (kycRecord.role === 'recruiter') {
                await api.put(`/admin/kyc/recruiter/review/${kycId}`, { decision: 'approved', section });
            } else {
                await api.patch(`/admin/kyc/${userId}/approve`);
            }
            await fetchPendingKYC({ quiet: true, preserveSelection: true });
        } catch (err) {
            alert(err.response?.data?.message || 'Approval failed');
        } finally {
            setProcessing(false);
        }
    };

    const executeReject = async (kycRecord, section = 'representative') => {
        const userId = getUserId(kycRecord);
        const kycId = kycRecord._id;
        const reason =
            kycRecord.role === 'recruiter'
                ? (section === 'company' ? companyRejectReason : repRejectReason).trim()
                : rejectionReason.trim();
        setProcessing(true);
        try {
            if (kycRecord.role === 'recruiter') {
                await api.put(`/admin/kyc/recruiter/review/${kycId}`, {
                    decision: 'rejected',
                    reason,
                    section
                });
            } else {
                await api.patch(`/admin/kyc/${userId}/reject`, { rejectionReason: reason });
            }

            await fetchPendingKYC({ quiet: true, preserveSelection: true });
            setRejectionReason('');
            setRejectInlineError('');
            setRepRejectInlineError('');
            setCompanyRejectInlineError('');
            if (kycRecord.role === 'recruiter') {
                if (section === 'company') setCompanyRejectReason('');
                else setRepRejectReason('');
            }
            setRejectConfirmOpen(false);
            setRejectModalSection(null);
            if (kycRecord.role === 'recruiter') {
                const msg =
                    section === 'company'
                        ? 'Company verification rejected. Recruiter has been notified.'
                        : 'Representative verification rejected. Recruiter has been notified.';
                toast.success(msg, { duration: 4000 });
            } else {
                toast.success('Verification rejected.', { duration: 4000 });
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Rejection failed');
        } finally {
            setProcessing(false);
        }
    };

    const onJobSeekerRejectClick = () => {
        const trimmed = rejectionReason.trim();
        if (trimmed.length < MIN_REJECTION_REASON_LENGTH) {
            setRejectInlineError('A reason is required before rejecting.');
            return;
        }
        setRejectInlineError('');
        executeReject(selectedKYC, 'representative');
    };

    const openRecruiterRejectModal = (section) => {
        const reason = section === 'company' ? companyRejectReason : repRejectReason;
        const trimmed = reason.trim();
        if (trimmed.length < MIN_REJECTION_REASON_LENGTH) {
            if (section === 'company') setCompanyRejectInlineError('A reason is required before rejecting.');
            else setRepRejectInlineError('A reason is required before rejecting.');
            return;
        }
        if (section === 'company') setCompanyRejectInlineError('');
        else setRepRejectInlineError('');
        setRejectModalSection(section);
        setRejectConfirmOpen(true);
    };

    const onConfirmRejectInModal = () => {
        if (!selectedKYC || selectedKYC.role !== 'recruiter' || !rejectModalSection) return;
        const reason = rejectModalSection === 'company' ? companyRejectReason : repRejectReason;
        const trimmed = reason.trim();
        if (trimmed.length < MIN_REJECTION_REASON_LENGTH) {
            if (rejectModalSection === 'company') setCompanyRejectInlineError('A reason is required before rejecting.');
            else setRepRejectInlineError('A reason is required before rejecting.');
            setRejectConfirmOpen(false);
            return;
        }
        executeReject(selectedKYC, rejectModalSection);
    };

    /** Modal: Escape = cancel; focus cancel on open; basic focus trap */
    useEffect(() => {
        if (!rejectConfirmOpen) return;
        const modalEl = rejectModalRef.current;
        const focusables = modalEl?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const list = focusables ? Array.from(focusables).filter((el) => !el.disabled) : [];
        rejectModalCancelRef.current?.focus();

        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                if (!processing) setRejectConfirmOpen(false);
                return;
            }
            if (e.key !== 'Tab' || list.length === 0) return;
            const first = list[0];
            const last = list[list.length - 1];
            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else if (document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [rejectConfirmOpen, rejectModalSection, processing]);

    const filteredKYC = pendingKYC.filter(kyc =>
        kyc.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        kyc.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const rejectionAttemptsUsed = selectedKYC?.rejectionHistory?.length ?? 0;
    const attemptsExhausted =
        selectedKYC?.role === 'recruiter' && rejectionAttemptsUsed >= MAX_RESUBMISSION_ATTEMPTS;
    const nextRejectionAttemptNumber = Math.min(rejectionAttemptsUsed + 1, MAX_RESUBMISSION_ATTEMPTS);
    const showFinalAttemptModalWarning =
        selectedKYC?.role === 'recruiter' && nextRejectionAttemptNumber === MAX_RESUBMISSION_ATTEMPTS;
    const repStatusNorm = normKycStatus(selectedKYC?.representativeStatus);
    const compStatusNorm = normKycStatus(selectedKYC?.companyStatus);
    const repRejectFormDisabled =
        selectedKYC?.role === 'recruiter' &&
        (attemptsExhausted ||
            repStatusNorm === 'approved' ||
            repStatusNorm === 'rejected' ||
            processing);
    const companyRejectFormDisabled =
        selectedKYC?.role === 'recruiter' &&
        (attemptsExhausted ||
            repStatusNorm !== 'approved' ||
            compStatusNorm === 'approved' ||
            compStatusNorm === 'rejected' ||
            processing);
    const repReasonOk = repRejectReason.trim().length >= MIN_REJECTION_REASON_LENGTH;
    const companyReasonOk = companyRejectReason.trim().length >= MIN_REJECTION_REASON_LENGTH;
    const rejectControlsDisabled =
        selectedKYC?.role !== 'recruiter' && (processing || attemptsExhausted);
    const reasonLengthOk = rejectionReason.trim().length >= MIN_REJECTION_REASON_LENGTH;
    const rejectSubmitDisabled = rejectControlsDisabled || !reasonLengthOk;

    const selectedRecruiterUi =
        selectedKYC?.role === 'recruiter' ? getRecruiterKycUiState(selectedKYC) : null;
    const recruiterStatusAccentClass = selectedRecruiterUi
        ? selectedRecruiterUi.tone === 'partial'
            ? 'text-sky-700'
            : selectedRecruiterUi.tone === 'rejected'
              ? 'text-red-700'
              : selectedRecruiterUi.tone === 'success'
                ? 'text-emerald-700'
                : 'text-amber-700'
        : 'text-amber-600';

    const recruiterBannerClass = selectedRecruiterUi
        ? selectedRecruiterUi.tone === 'partial'
            ? 'border-sky-200/90 bg-sky-50/90 text-sky-950'
            : selectedRecruiterUi.tone === 'rejected'
              ? 'border-red-200/90 bg-red-50/90 text-red-950'
              : selectedRecruiterUi.tone === 'success'
                ? 'border-emerald-200/90 bg-emerald-50/90 text-emerald-950'
                : 'border-amber-200/90 bg-amber-50/80 text-amber-950'
        : '';

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
                            <p className="text-gray-400 mt-1.5 font-medium text-sm max-w-xl">
                                Review and process pending verification requests. Recruiter entries stay in this queue until{' '}
                                <span className="text-gray-300">both representative and company</span> verification are approved.
                            </p>
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
                                {filteredKYC.map((kyc) => {
                                    const recruiterState = kyc.role === 'recruiter' ? getRecruiterKycUiState(kyc) : null;
                                    const rowName = kyc?.fullName || kyc?.userId?.fullName || 'Unknown User';
                                    const queueToneClass =
                                        recruiterState?.tone === 'partial'
                                            ? 'bg-sky-50 text-sky-800 border-sky-200/90'
                                            : recruiterState?.tone === 'rejected'
                                              ? 'bg-red-50 text-red-800 border-red-200/90'
                                              : recruiterState?.tone === 'success'
                                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200/90'
                                                : 'bg-amber-50 text-amber-900 border-amber-200/80';
                                    return (
                                    <div
                                        key={kyc._id || getUserId(kyc)}
                                        onClick={() => setSelectedKYC(kyc)}
                                        className={`p-4 cursor-pointer transition-all hover:bg-[#29a08e]/[0.03] border-l-[3px] ${selectedKYC?._id === kyc._id ? 'border-[#29a08e] bg-[#29a08e]/[0.04]' : 'border-transparent'}`}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${kyc.role === 'recruiter' ? 'bg-gradient-to-br from-purple-500 to-purple-600' : 'bg-gradient-to-br from-emerald-500 to-emerald-600'}`}>
                                                    {rowName.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-sm font-semibold text-gray-900 truncate">{rowName}</h3>
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
                                        {recruiterState && (
                                            <div className="mt-2 pl-[52px] pr-1">
                                                <span
                                                    className={`inline-flex items-center gap-1 max-w-full rounded-md border px-2 py-1 text-[10px] font-bold leading-tight ${queueToneClass}`}
                                                    title={recruiterState.description}
                                                >
                                                    {recruiterState.tone === 'partial' && (
                                                        <CircleDot className="w-3 h-3 shrink-0 text-sky-600" aria-hidden />
                                                    )}
                                                    <span className="break-words">{recruiterState.queueHint}</span>
                                                </span>
                                            </div>
                                        )}
                                        <div className="mt-2 text-[10px] text-gray-400 flex items-center gap-1 pl-[52px]">
                                            <Clock className="w-3 h-3 shrink-0" />
                                            {(kyc.submittedAt || kyc.createdAt)
                                                ? new Date(kyc.submittedAt || kyc.createdAt).toLocaleDateString()
                                                : '—'}
                                        </div>
                                    </div>
                                    );
                                })}
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
                                {/* Applicant header */}
                                <header className="p-5 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-[#0f172a]/[0.03] via-white to-white shrink-0">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="flex items-start gap-4 min-w-0 flex-1">
                                            <div
                                                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0 ${selectedKYC.role === 'recruiter' ? 'bg-gradient-to-br from-purple-500 to-purple-600' : 'bg-gradient-to-br from-[#29a08e] to-[#228377]'}`}
                                                aria-hidden
                                            >
                                                {selectedKYC.fullName.charAt(0)}
                                            </div>
                                            <div className="min-w-0 flex-1 space-y-2">
                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                    <h2 className="text-xl font-black text-gray-900 tracking-tight break-words">
                                                        {selectedKYC.fullName}
                                                    </h2>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${selectedKYC.role === 'recruiter' ? 'bg-purple-50 text-purple-700 border-purple-200/80' : 'bg-emerald-50 text-emerald-700 border-emerald-200/80'}`}
                                                    >
                                                        {selectedKYC.role}
                                                    </span>
                                                    <span className="hidden sm:inline text-gray-300" aria-hidden>
                                                        |
                                                    </span>
                                                    {selectedRecruiterUi ? (
                                                        <span className={`font-bold ${recruiterStatusAccentClass}`}>
                                                            {selectedRecruiterUi.label}
                                                        </span>
                                                    ) : (
                                                        <span className="text-amber-600 font-bold">Pending review</span>
                                                    )}
                                                </div>
                                                {selectedKYC.email && (
                                                    <p
                                                        className="text-sm text-gray-600 break-all [overflow-wrap:anywhere] leading-snug max-w-full"
                                                        title={selectedKYC.email}
                                                    >
                                                        {selectedKYC.email}
                                                    </p>
                                                )}
                                                {selectedKYC.role === 'recruiter' && (
                                                    <div className="flex flex-wrap gap-2 pt-0.5">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-[10px] font-bold uppercase tracking-wide text-gray-700 border border-gray-200/80">
                                                            Representative:{' '}
                                                            <span className="font-black text-gray-900 normal-case">
                                                                {selectedKYC.representativeStatus || 'pending'}
                                                            </span>
                                                        </span>
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-[10px] font-bold uppercase tracking-wide text-gray-700 border border-gray-200/80">
                                                            Company:{' '}
                                                            <span className="font-black text-gray-900 normal-case">
                                                                {selectedKYC.companyStatus || 'pending'}
                                                            </span>
                                                        </span>
                                                    </div>
                                                )}
                                                <p className="text-[11px] text-gray-400 font-medium">
                                                    Submitted:{' '}
                                                    {(selectedKYC.submittedAt || selectedKYC.createdAt)
                                                        ? new Date(selectedKYC.submittedAt || selectedKYC.createdAt).toLocaleDateString(undefined, {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })
                                                        : '—'}
                                                </p>
                                            </div>
                                        </div>
                                        {selectedKYC.role !== 'recruiter' && (
                                            <button
                                                type="button"
                                                disabled={processing}
                                                onClick={() => handleApprove(selectedKYC)}
                                                className="shrink-0 w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-[#29a08e] to-[#228377] text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-[#29a08e]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
                                            >
                                                <Check className="w-4 h-4 shrink-0" />
                                                Approve
                                            </button>
                                        )}
                                    </div>
                                </header>

                                {selectedRecruiterUi && (
                                    <div
                                        className={`shrink-0 mx-5 sm:mx-6 mt-4 rounded-xl border px-4 py-3 flex gap-3 ${recruiterBannerClass}`}
                                        role="status"
                                    >
                                        {selectedRecruiterUi.tone === 'partial' && (
                                            <CircleDot className="w-5 h-5 shrink-0 text-sky-600 mt-0.5" aria-hidden />
                                        )}
                                        {selectedRecruiterUi.tone === 'pending' && (
                                            <Clock className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" aria-hidden />
                                        )}
                                        {selectedRecruiterUi.tone === 'rejected' && (
                                            <ShieldX className="w-5 h-5 shrink-0 text-red-600 mt-0.5" aria-hidden />
                                        )}
                                        {selectedRecruiterUi.tone === 'success' && (
                                            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" aria-hidden />
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold leading-snug">
                                                {selectedRecruiterUi.tone === 'partial'
                                                    ? 'Partial approval'
                                                    : selectedRecruiterUi.tone === 'rejected'
                                                      ? 'Verification rejected'
                                                      : selectedRecruiterUi.tone === 'success'
                                                        ? 'Fully verified'
                                                        : 'Awaiting review'}
                                            </p>
                                            <p className="text-xs font-medium leading-relaxed mt-1 opacity-90">
                                                {selectedRecruiterUi.description}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 lg:space-y-8">
                                    {selectedKYC.role === 'recruiter' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
                                            <div className="space-y-4 min-w-0">
                                                <div className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-sm ring-1 ring-black/[0.02] flex flex-col min-h-[160px]">
                                                    <div className="flex items-start gap-3 mb-4">
                                                        <div className="w-10 h-10 rounded-xl bg-[#29a08e]/10 flex items-center justify-center text-[#29a08e] shrink-0 border border-[#29a08e]/15">
                                                            <User className="w-5 h-5" strokeWidth={2} />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                                                                    Representative verification
                                                                </h3>
                                                                {repStatusNorm === 'approved' && (
                                                                    <span className="inline-flex items-center gap-0.5 shrink-0 text-[10px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-100/80 border border-emerald-200/80 px-2 py-0.5 rounded-lg">
                                                                        <Check className="w-3 h-3" aria-hidden />
                                                                        Verified ✓
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                                                {repStatusNorm === 'approved'
                                                                    ? 'This step is complete. Continue with company verification below.'
                                                                    : 'Verify identity of the authorized representative.'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 mt-auto pt-1">
                                                        <button
                                                            type="button"
                                                            disabled={processing || repStatusNorm === 'approved'}
                                                            onClick={() => handleApprove(selectedKYC, 'representative')}
                                                            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#29a08e] to-[#228377] text-white shadow-sm disabled:opacity-50"
                                                        >
                                                            Approve representative
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="rounded-2xl border border-red-100/90 bg-gradient-to-br from-red-50/80 to-white p-5 shadow-sm ring-1 ring-red-100/60">
                                                    <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-3">
                                                        Reject representative
                                                    </p>
                                                    <p className="text-xs font-semibold text-gray-700 mb-3">
                                                        {rejectionAttemptsUsed}/{MAX_RESUBMISSION_ATTEMPTS} attempts used (shared with company)
                                                    </p>
                                                    {attemptsExhausted && (
                                                        <p
                                                            className="text-sm font-semibold text-red-900 mb-3 rounded-lg border border-red-200 bg-red-100/60 px-3 py-2"
                                                            role="alert"
                                                        >
                                                            Maximum re-submission attempts reached. This recruiter can no longer
                                                            re-submit verification.
                                                        </p>
                                                    )}
                                                    <label htmlFor="rep-reject-reason" className="block text-xs font-bold text-gray-800 mb-2">
                                                        Reason
                                                    </label>
                                                    <textarea
                                                        id="rep-reject-reason"
                                                        value={repRejectReason}
                                                        onChange={(e) => {
                                                            setRepRejectReason(e.target.value);
                                                            if (repRejectInlineError) setRepRejectInlineError('');
                                                        }}
                                                        disabled={repRejectFormDisabled}
                                                        className="w-full min-h-[88px] px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 bg-white border-2 border-red-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 resize-y disabled:opacity-60 disabled:cursor-not-allowed"
                                                        placeholder="Minimum 10 characters…"
                                                        aria-invalid={!!repRejectInlineError}
                                                        aria-describedby={repRejectInlineError ? 'rep-reject-error' : undefined}
                                                    />
                                                    {repRejectInlineError && (
                                                        <p id="rep-reject-error" className="mt-2 text-sm font-medium text-red-600" role="alert">
                                                            {repRejectInlineError}
                                                        </p>
                                                    )}
                                                    <button
                                                        type="button"
                                                        disabled={repRejectFormDisabled || !repReasonOk}
                                                        onClick={() => openRecruiterRejectModal('representative')}
                                                        className="mt-3 w-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Reject representative
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="space-y-4 min-w-0">
                                                <div className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-sm ring-1 ring-black/[0.02] flex flex-col min-h-[160px]">
                                                    <div className="flex items-start gap-3 mb-4">
                                                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 shrink-0 border border-purple-200/60">
                                                            <Building2 className="w-5 h-5" strokeWidth={2} />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                                                                    Company verification
                                                                </h3>
                                                                {compStatusNorm === 'approved' && (
                                                                    <span className="inline-flex items-center gap-0.5 shrink-0 text-[10px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-100/80 border border-emerald-200/80 px-2 py-0.5 rounded-lg">
                                                                        <Check className="w-3 h-3" aria-hidden />
                                                                        Verified ✓
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                                                {repStatusNorm !== 'approved'
                                                                    ? 'Unlocks after representative verification is approved.'
                                                                    : compStatusNorm === 'approved'
                                                                      ? 'Company verification is complete.'
                                                                      : 'Representative is approved — review company documents and approve when ready.'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 mt-auto pt-1">
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                processing ||
                                                                repStatusNorm !== 'approved' ||
                                                                compStatusNorm === 'approved'
                                                            }
                                                            onClick={() => handleApprove(selectedKYC, 'company')}
                                                            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#29a08e] to-[#228377] text-white shadow-sm disabled:opacity-50"
                                                        >
                                                            Approve company
                                                        </button>
                                                    </div>
                                                </div>
                                                <div
                                                    className={`rounded-2xl border p-5 shadow-sm ring-1 ${
                                                        repStatusNorm === 'approved'
                                                            ? 'border-red-100/90 bg-gradient-to-br from-red-50/80 to-white ring-red-100/60'
                                                            : 'border-gray-200/90 bg-gray-50/90 ring-gray-100 opacity-80'
                                                    }`}
                                                >
                                                    <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-3">
                                                        Reject company
                                                    </p>
                                                    {repStatusNorm !== 'approved' ? (
                                                        <p className="text-sm text-gray-500 font-medium leading-relaxed">
                                                            Company rejection will be available after representative is approved.
                                                        </p>
                                                    ) : (
                                                        <>
                                                            <p className="text-xs font-semibold text-gray-700 mb-3">
                                                                {rejectionAttemptsUsed}/{MAX_RESUBMISSION_ATTEMPTS} attempts used (shared)
                                                            </p>
                                                            {attemptsExhausted && (
                                                                <p
                                                                    className="text-sm font-semibold text-red-900 mb-3 rounded-lg border border-red-200 bg-red-100/60 px-3 py-2"
                                                                    role="alert"
                                                                >
                                                                    Maximum re-submission attempts reached. This recruiter can no longer
                                                                    re-submit verification.
                                                                </p>
                                                            )}
                                                            <label
                                                                htmlFor="company-reject-reason"
                                                                className="block text-xs font-bold text-gray-800 mb-2"
                                                            >
                                                                Reason
                                                            </label>
                                                            <textarea
                                                                id="company-reject-reason"
                                                                value={companyRejectReason}
                                                                onChange={(e) => {
                                                                    setCompanyRejectReason(e.target.value);
                                                                    if (companyRejectInlineError) setCompanyRejectInlineError('');
                                                                }}
                                                                disabled={companyRejectFormDisabled}
                                                                className="w-full min-h-[88px] px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 bg-white border-2 border-red-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 resize-y disabled:opacity-60 disabled:cursor-not-allowed"
                                                                placeholder="Minimum 10 characters…"
                                                                aria-invalid={!!companyRejectInlineError}
                                                                aria-describedby={
                                                                    companyRejectInlineError ? 'company-reject-error' : undefined
                                                                }
                                                            />
                                                            {companyRejectInlineError && (
                                                                <p
                                                                    id="company-reject-error"
                                                                    className="mt-2 text-sm font-medium text-red-600"
                                                                    role="alert"
                                                                >
                                                                    {companyRejectInlineError}
                                                                </p>
                                                            )}
                                                            <button
                                                                type="button"
                                                                disabled={companyRejectFormDisabled || !companyReasonOk}
                                                                onClick={() => openRecruiterRejectModal('company')}
                                                                className="mt-3 w-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                Reject company
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 items-start">
                                        <section className="rounded-2xl border border-gray-200/90 bg-white shadow-sm ring-1 ring-black/[0.02] overflow-hidden min-w-0">
                                            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/90 flex items-center gap-2">
                                                <User className="w-4 h-4 text-[#29a08e] shrink-0" />
                                                <h3 className="text-[11px] font-black text-gray-700 uppercase tracking-[0.14em]">
                                                    Identity details
                                                </h3>
                                            </div>
                                            <div className="p-4 sm:p-5">
                                                {getIdentityDetailsByRole(selectedKYC).map((item, i) => (
                                                    <DetailRow
                                                        key={i}
                                                        label={item.label}
                                                        value={item.value}
                                                        valueClassName={identityValueTypography(item.label)}
                                                    />
                                                ))}
                                            </div>
                                        </section>

                                        {selectedKYC.role === 'recruiter' ? (
                                            <section className="rounded-2xl border border-gray-200/90 bg-white shadow-sm ring-1 ring-black/[0.02] overflow-hidden min-w-0">
                                                <div className="px-4 py-3 border-b border-gray-100 bg-purple-50/50 flex items-center gap-2">
                                                    <Building2 className="w-4 h-4 text-purple-600 shrink-0" />
                                                    <h3 className="text-[11px] font-black text-gray-700 uppercase tracking-[0.14em]">
                                                        Company details
                                                    </h3>
                                                </div>
                                                <div className="p-4 sm:p-5">
                                                    {getCompanyDetailRows(selectedKYC).map((row, i) => (
                                                        <DetailRow
                                                            key={i}
                                                            label={row.label}
                                                            value={row.value}
                                                            valueClassName={
                                                                row.mono
                                                                    ? 'font-mono text-[13px] break-all [overflow-wrap:anywhere] leading-snug'
                                                                    : 'break-words [overflow-wrap:anywhere] leading-snug'
                                                            }
                                                        />
                                                    ))}
                                                </div>
                                            </section>
                                        ) : (
                                            <section className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 min-h-[180px] flex flex-col items-center justify-center text-center p-6 sm:p-8">
                                                <div className="w-12 h-12 rounded-xl bg-gray-200/60 flex items-center justify-center text-gray-400 mb-3">
                                                    <Building2 className="w-6 h-6" strokeWidth={1.75} />
                                                </div>
                                                <p className="text-sm font-bold text-gray-600">Company details</p>
                                                <p className="text-xs text-gray-500 mt-1.5 max-w-[240px] leading-relaxed">
                                                    Not required for job seeker applications.
                                                </p>
                                            </section>
                                        )}
                                    </div>

                                    <section className="rounded-2xl border border-gray-200/90 bg-white shadow-sm ring-1 ring-black/[0.02] overflow-hidden">
                                        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/90 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <FileText className="w-4 h-4 text-[#29a08e] shrink-0" />
                                                <h3 className="text-[11px] font-black text-gray-700 uppercase tracking-[0.14em] truncate">
                                                    Verification proofs
                                                </h3>
                                            </div>
                                            <p className="text-[11px] text-gray-400 font-medium shrink-0 hidden sm:block">
                                                Hover a thumbnail to open the full file
                                            </p>
                                        </div>
                                        <div className="p-4 sm:p-5">
                                            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                                                {getProofCardsByRole(selectedKYC).map((img, i) => (
                                                    <KycImagePreview key={i} label={img.label} path={img.path} />
                                                ))}
                                            </div>
                                        </div>
                                    </section>

                                    {selectedKYC.rejectionHistory && selectedKYC.rejectionHistory.length > 0 && (
                                        <div className="space-y-4">
                                            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                                Rejection history (
                                                {selectedKYC.role === 'recruiter'
                                                    ? `${rejectionAttemptsUsed}/${MAX_RESUBMISSION_ATTEMPTS} attempts used`
                                                    : `${selectedKYC.resubmissionCount || 0} resubmissions`}
                                                )
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

                                    {selectedKYC.role !== 'recruiter' && (
                                        <div className="p-6 bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl border border-red-100">
                                            <h3 className="text-sm font-black text-red-900 mb-2 flex items-center gap-2">
                                                <ShieldX className="w-4 h-4 text-red-500" />
                                                Reject verification
                                            </h3>
                                            <p className="text-sm font-medium text-red-800 mb-4">
                                                Provide a reason and reject this verification.
                                            </p>
                                            <div className="space-y-4">
                                                <div>
                                                    <label
                                                        htmlFor="rejection-reason"
                                                        className="block text-sm font-bold text-gray-900 mb-2"
                                                    >
                                                        Rejection reason
                                                    </label>
                                                    <textarea
                                                        id="rejection-reason"
                                                        value={rejectionReason}
                                                        onChange={(e) => {
                                                            setRejectionReason(e.target.value);
                                                            if (rejectInlineError) setRejectInlineError('');
                                                        }}
                                                        disabled={rejectControlsDisabled}
                                                        className="w-full min-h-[100px] px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 bg-white border-2 border-red-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all resize-y disabled:opacity-60 disabled:cursor-not-allowed"
                                                        placeholder="Provide a clear, specific reason for rejection..."
                                                        rows={3}
                                                        aria-required="true"
                                                        aria-invalid={!!rejectInlineError}
                                                        aria-describedby={rejectInlineError ? 'rejection-reason-error' : undefined}
                                                    />
                                                    {rejectInlineError && (
                                                        <p
                                                            id="rejection-reason-error"
                                                            className="mt-2 text-sm font-medium text-red-600"
                                                            role="alert"
                                                        >
                                                            {rejectInlineError}
                                                        </p>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    disabled={rejectSubmitDisabled}
                                                    onClick={onJobSeekerRejectClick}
                                                    className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold py-2.5 rounded-xl hover:shadow-lg hover:shadow-red-500/20 transition-all text-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Reject KYC
                                                </button>
                                            </div>
                                        </div>
                                    )}
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

            {rejectConfirmOpen && selectedKYC?.role === 'recruiter' && rejectModalSection && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="presentation">
                    <div
                        className="absolute inset-0 bg-black/50"
                        aria-hidden
                        onClick={() => !processing && setRejectConfirmOpen(false)}
                    />
                    <div
                        ref={rejectModalRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="reject-confirm-title"
                        className="relative z-[101] w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-center text-3xl mb-3" aria-hidden>
                            ⚠️
                        </div>
                        <h2 id="reject-confirm-title" className="text-lg font-black text-gray-900 text-center mb-2">
                            Confirm Rejection
                        </h2>
                        <p className="text-sm text-gray-600 text-center mb-4">
                            {rejectModalSection === 'company'
                                ? `You are about to reject ${selectedKYC.fullName}'s company verification.`
                                : `You are about to reject ${selectedKYC.fullName}'s representative verification.`}
                        </p>
                        <div className="mb-3">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Reason:</p>
                            <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 whitespace-pre-wrap max-h-36 overflow-y-auto">
                                {(rejectModalSection === 'company' ? companyRejectReason : repRejectReason).trim()}
                            </div>
                        </div>
                        <p className="text-sm text-gray-700 text-center mb-4 font-medium">
                            This will use attempt {nextRejectionAttemptNumber} of {MAX_RESUBMISSION_ATTEMPTS}.
                        </p>
                        {showFinalAttemptModalWarning && (
                            <div
                                className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2.5 text-sm text-red-900 font-medium"
                                role="alert"
                            >
                                ⚠️ This is the final re-submission attempt. Confirming will permanently block this
                                recruiter from re-submitting any verification.
                            </div>
                        )}
                        <div className="flex flex-wrap gap-2 justify-end">
                            <button
                                ref={rejectModalCancelRef}
                                type="button"
                                disabled={processing}
                                onClick={() => setRejectConfirmOpen(false)}
                                className="px-4 py-2.5 rounded-xl border-2 border-gray-300 text-sm font-bold text-gray-800 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={processing}
                                onClick={onConfirmRejectInModal}
                                className="inline-flex items-center justify-center gap-2 min-w-[10rem] px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-50"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden />
                                        Working…
                                    </>
                                ) : (
                                    'Confirm Rejection'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminKYCPanel;
