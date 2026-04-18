import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { Search, Briefcase, X, RefreshCw, MoreVertical, Building2, MapPin, DollarSign, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';

const STATUS_TABS = [
    { key: 'active', label: 'Live / Active' },
    { key: 'warned', label: 'Warned' },
    { key: 'hidden', label: 'Hidden' },
    { key: 'pending_review', label: 'Pending review' },
    { key: 'deleted', label: 'Deleted' }
];

function effectiveModerationStatus(job) {
    const m = job?.moderationStatus;
    if (!m || m === '' || m === 'Approved') return 'active';
    if (m === 'Flagged') return 'warned';
    if (m === 'Hidden') return 'hidden';
    if (m === 'Under Review') return 'pending_review';
    return m;
}

function statusBadge(effective) {
    switch (effective) {
        case 'active':
            return { className: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Live' };
        case 'warned':
            return { className: 'bg-amber-50 text-amber-800 border-amber-200', label: 'Live — Warning sent' };
        case 'hidden':
            return { className: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Hidden' };
        case 'pending_review':
            return { className: 'bg-yellow-50 text-yellow-800 border-yellow-200', label: 'Pending review' };
        case 'deleted':
            return { className: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Deleted' };
        default:
            return { className: 'bg-slate-50 text-slate-600 border-slate-200', label: effective || '—' };
    }
}

const MENU_W = 220;

const menuItemBase =
    'flex w-full items-center px-3 py-2.5 text-left text-xs font-bold transition-colors';
const menuItemNeutral = `${menuItemBase} text-gray-700 hover:bg-gray-50`;
const menuItemDanger = `${menuItemBase} text-red-700 hover:bg-red-50`;
const menuItemSuccess = `${menuItemBase} text-emerald-800 hover:bg-emerald-50`;

function JobPreviewModal({ job, loading, onClose }) {
    const badge = statusBadge(effectiveModerationStatus(job || {}));

    const valueOrFallback = (value, fallback = 'Not specified') => {
        if (value === null || value === undefined) return fallback;
        const cleaned = String(value).trim();
        return cleaned || fallback;
    };

    if (!job && !loading) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
                <header className="flex items-start justify-between gap-4 border-b border-gray-100 p-5">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400">Job preview</p>
                        <h3 className="mt-1 text-xl font-black text-gray-900">
                            {loading ? 'Loading listing…' : valueOrFallback(job?.title)}
                        </h3>
                        {!loading && (
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span
                                    className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-bold ${badge.className}`}
                                >
                                    {badge.label}
                                </span>
                            </div>
                        )}
                    </div>
                    <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:text-gray-700">
                        <X className="h-5 w-5" />
                    </button>
                </header>

                <div className="max-h-[calc(85vh-88px)] overflow-y-auto p-5">
                    {loading ? (
                        <div className="space-y-3 animate-pulse">
                            <div className="h-4 w-1/2 rounded bg-gray-100" />
                            <div className="h-20 rounded-xl bg-gray-50" />
                            <div className="h-32 rounded-xl bg-gray-50" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Company</p>
                                    <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-gray-900">
                                        <Building2 className="h-4 w-4 text-[#29a08e]" />
                                        {valueOrFallback(job?.company_name || job?.companyName)}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Job type</p>
                                    <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-gray-900">
                                        <Briefcase className="h-4 w-4 text-[#29a08e]" />
                                        {valueOrFallback(job?.type)}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Location</p>
                                    <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-gray-900">
                                        <MapPin className="h-4 w-4 text-[#29a08e]" />
                                        {valueOrFallback(job?.location)}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Salary</p>
                                    <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-gray-900">
                                        <DollarSign className="h-4 w-4 text-[#29a08e]" />
                                        {valueOrFallback(job?.salary_range || job?.salaryRange || 'Negotiable', 'Negotiable')}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Experience</p>
                                    <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-gray-900">
                                        <Clock className="h-4 w-4 text-[#29a08e]" />
                                        {valueOrFallback(job?.experience_level || job?.experienceLevel)}
                                    </p>
                                </div>
                            </div>

                            <section>
                                <h4 className="text-sm font-black uppercase tracking-wide text-gray-900">Job description</h4>
                                <div className="mt-2 rounded-xl border border-gray-100 bg-white p-4 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                                    {valueOrFallback(job?.description)}
                                </div>
                            </section>

                            <section>
                                <h4 className="text-sm font-black uppercase tracking-wide text-gray-900">Key requirements</h4>
                                <div className="mt-2 rounded-xl border border-gray-100 bg-white p-4 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                                    {valueOrFallback(job?.requirements)}
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ModerationActionsMenu({
    job,
    eff,
    statusTab,
    isOpen,
    onOpen,
    onClose,
    onWarn,
    onHide,
    onDelete,
    onApprove,
    onBadge,
    onViewListing
}) {
    const triggerRef = useRef(null);
    const menuRef = useRef(null);
    const [coords, setCoords] = useState({ top: 0, left: 0 });

    const updatePosition = useCallback(() => {
        const el = triggerRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        let left = r.right - MENU_W;
        if (left < 8) left = 8;
        if (left + MENU_W > window.innerWidth - 8) left = window.innerWidth - MENU_W - 8;
        const top = r.bottom + 6;
        setCoords({ top, left });
    }, []);

    useLayoutEffect(() => {
        if (isOpen) updatePosition();
    }, [isOpen, updatePosition]);

    useEffect(() => {
        if (!isOpen) return;
        const onMove = () => updatePosition();
        window.addEventListener('resize', onMove);
        window.addEventListener('scroll', onMove, true);
        return () => {
            window.removeEventListener('resize', onMove);
            window.removeEventListener('scroll', onMove, true);
        };
    }, [isOpen, updatePosition]);

    useEffect(() => {
        if (!isOpen) return;
        const onDoc = (e) => {
            if (triggerRef.current?.contains(e.target)) return;
            if (menuRef.current?.contains(e.target)) return;
            onClose();
        };
        const onKey = (e) => e.key === 'Escape' && onClose();
        document.addEventListener('mousedown', onDoc);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDoc);
            document.removeEventListener('keydown', onKey);
        };
    }, [isOpen, onClose]);

    const isDeleted = eff === 'deleted';
    const warnLabel =
        eff === 'warned' || statusTab === 'warned' ? 'Warn recruiter again' : 'Warn recruiter';
    const jobId = job._id?.toString?.() || job._id;

    const menu = isOpen ? (
        <div
            ref={menuRef}
            role="menu"
            style={{
                position: 'fixed',
                top: coords.top,
                left: coords.left,
                width: MENU_W,
                zIndex: 300
            }}
            className="rounded-xl border border-gray-200 bg-white py-1.5 shadow-xl ring-1 ring-black/5"
        >
            <button
                type="button"
                role="menuitem"
                className={menuItemNeutral}
                onClick={() => {
                    onClose();
                    onViewListing(job);
                }}
            >
                View listing
            </button>
            {!isDeleted && (
                <>
                    <button
                        type="button"
                        role="menuitem"
                        className={menuItemDanger}
                        onClick={() => {
                            onClose();
                            onWarn(job);
                        }}
                    >
                        {warnLabel}
                    </button>
                    <button
                        type="button"
                        role="menuitem"
                        className={menuItemDanger}
                        onClick={() => {
                            onClose();
                            onHide(job);
                        }}
                    >
                        Hide job
                    </button>
                    {eff === 'pending_review' && (
                        <button
                            type="button"
                            role="menuitem"
                            className={menuItemSuccess}
                            onClick={() => {
                                onClose();
                                onApprove(job);
                            }}
                        >
                            Approve
                        </button>
                    )}
                    <button
                        type="button"
                        role="menuitem"
                        className={menuItemNeutral}
                        onClick={() => {
                            onClose();
                            onBadge(job);
                        }}
                    >
                        Mark as Featured
                    </button>
                    <div className="my-1 border-t border-gray-100" />
                    <button
                        type="button"
                        role="menuitem"
                        className={menuItemDanger}
                        onClick={() => {
                            onClose();
                            onDelete(job);
                        }}
                    >
                        Delete permanently
                    </button>
                </>
            )}
            {isDeleted && (
                <button
                    type="button"
                    role="menuitem"
                    className={menuItemNeutral}
                    onClick={() => {
                        onClose();
                        onBadge(job);
                    }}
                >
                    Mark as Featured
                </button>
            )}
        </div>
    ) : null;

    return (
        <div className="flex justify-end">
            <button
                ref={triggerRef}
                type="button"
                aria-expanded={isOpen}
                aria-haspopup="menu"
                aria-label="Open job actions"
                onClick={() => (isOpen ? onClose() : onOpen())}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800"
            >
                <MoreVertical className="h-4 w-4" aria-hidden />
            </button>
            {typeof document !== 'undefined' && menu ? createPortal(menu, document.body) : null}
        </div>
    );
}

const AdminJobs = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusTab, setStatusTab] = useState('active');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;

    const [modal, setModal] = useState(null);
    const [modalText, setModalText] = useState('');
    const [modalNote, setModalNote] = useState('');
    const [modalJob, setModalJob] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const [labelModalJob, setLabelModalJob] = useState(null);
    const [labelOverrideDraft, setLabelOverrideDraft] = useState('');
    const [labelSaving, setLabelSaving] = useState(false);

    const [openActionsJobId, setOpenActionsJobId] = useState(null);
    const [previewJob, setPreviewJob] = useState(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);

    const fetchJobs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/moderation/jobs', {
                params: { status: statusTab, page, limit }
            });
            setJobs(res.data.jobs || []);
            setTotal(res.data.total ?? 0);
            setTotalPages(res.data.pages ?? 1);
        } catch (error) {
            console.error('Fetch jobs error:', error);
            toast.error(error.response?.data?.message || 'Failed to load jobs');
        } finally {
            setLoading(false);
        }
    }, [statusTab, page]);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    useEffect(() => {
        setPage(1);
    }, [statusTab]);

    useEffect(() => {
        setOpenActionsJobId(null);
    }, [statusTab, page]);

    const openModal = (type, job) => {
        setModal(type);
        setModalJob(job);
        setModalText('');
        setModalNote('');
    };

    const closeModal = () => {
        setModal(null);
        setModalJob(null);
        setModalText('');
        setModalNote('');
        setSubmitting(false);
    };

    const submitModeration = async () => {
        if (!modalJob?._id) return;
        const trimmed = modalText.trim();
        if (modal === 'warn' && !trimmed) {
            toast.error('Please enter a warning message');
            return;
        }
        if ((modal === 'hide' || modal === 'delete') && !trimmed) {
            toast.error('Please enter a reason');
            return;
        }
        setSubmitting(true);
        try {
            let res;
            if (modal === 'warn') {
                const payload = { message: trimmed };
                const note = modalNote.trim();
                if (note) payload.note = note;
                res = await api.patch(`/admin/moderation/jobs/${modalJob._id}/warn`, payload);
            } else if (modal === 'hide') {
                res = await api.patch(`/admin/moderation/jobs/${modalJob._id}/hide`, { reason: trimmed });
            } else if (modal === 'delete') {
                res = await api.patch(`/admin/moderation/jobs/${modalJob._id}/delete`, { reason: trimmed });
            }
            toast.success('Job updated');
            closeModal();
            fetchJobs();
            if (res?.data && modalJob._id) {
                setJobs((prev) => prev.map((j) => (j._id === modalJob._id ? { ...j, ...res.data } : j)));
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Action failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleApprove = async (job) => {
        try {
            await api.patch(`/admin/moderation/jobs/${job._id}/approve`);
            toast.success('Job approved');
            fetchJobs();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Approve failed');
        }
    };

    const openLabelModal = (job) => {
        setLabelModalJob(job);
        setLabelOverrideDraft(job.labelOverride || '');
    };

    const closePreviewModal = () => {
        setPreviewOpen(false);
        setPreviewLoading(false);
        setPreviewJob(null);
    };

    const handleViewListing = async (job) => {
        if (!job?._id) return;
        setPreviewOpen(true);
        setPreviewLoading(true);
        try {
            const res = await api.get(`/jobs/${job._id}`);
            setPreviewJob(res.data || job);
        } catch (error) {
            console.error('Failed to fetch job preview:', error);
            toast.error(error.response?.data?.message || 'Failed to load job preview');
            setPreviewOpen(false);
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleSaveLabelOverride = async (e) => {
        e.preventDefault();
        if (!labelModalJob?._id) return;
        setLabelSaving(true);
        try {
            const body =
                labelOverrideDraft === '' || labelOverrideDraft === 'AUTO'
                    ? { labelOverride: null }
                    : { labelOverride: labelOverrideDraft };
            const res = await api.patch(`/jobs/${labelModalJob._id}/label-override`, body);
            const updated = res.data?.job;
            if (updated) {
                setJobs((prev) => prev.map((j) => (j._id === updated._id ? { ...j, ...updated } : j)));
            }
            toast.success('Badge label saved');
            setLabelModalJob(null);
        } catch (err) {
            console.error(err);
            toast.error('Failed to save label override');
        } finally {
            setLabelSaving(false);
        }
    };

    const filteredJobs = jobs.filter(
        (job) =>
            job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.recruiterName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex-1 w-full flex flex-col min-h-[calc(100vh-64px)]">
            <div className="relative bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] overflow-hidden">
                <div
                    className="absolute inset-0 opacity-[0.07]"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)',
                        backgroundSize: '32px 32px'
                    }}
                />
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#29a08e]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="h-10 w-10 bg-[#29a08e]/20 rounded-xl flex items-center justify-center border border-[#29a08e]/30">
                                <Briefcase className="h-5 w-5 text-[#29a08e]" />
                            </div>
                            <span className="text-[11px] font-bold text-[#29a08e] uppercase tracking-[0.2em]">
                                Job moderation
                            </span>
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Manage jobs</h1>
                        <p className="text-gray-400 font-medium text-sm max-w-2xl">
                            Post-publish moderation: warn, hide, approve resubmissions, or permanently remove listings.
                        </p>
                        <div className="flex flex-wrap gap-2 pt-2">
                            {STATUS_TABS.map((t) => (
                                <button
                                    key={t.key}
                                    type="button"
                                    onClick={() => setStatusTab(t.key)}
                                    className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-colors ${
                                        statusTab === t.key
                                            ? 'bg-[#29a08e]/30 text-white border-[#29a08e]/50'
                                            : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                                    }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 pb-12 relative z-10 w-full flex-1">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search title, company, recruiter…"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#29a08e]/30 focus:border-[#29a08e] outline-none transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-sm font-medium text-gray-400">
                                <span className="text-gray-900 font-bold">{total}</span> total · page {page} /{' '}
                                {totalPages}
                            </span>
                            <button
                                type="button"
                                onClick={() => fetchJobs()}
                                className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl text-xs font-bold transition-all hover:shadow-sm"
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                                Refresh
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/80 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em]">
                                        Job
                                    </th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em]">
                                        Recruiter / company
                                    </th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em]">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em] text-right w-px whitespace-nowrap">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    [1, 2, 3, 4, 5].map((i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={4} className="px-6 py-5">
                                                <div className="h-10 bg-gray-50 rounded-xl w-full" />
                                            </td>
                                        </tr>
                                    ))
                                ) : filteredJobs.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-16 text-center text-sm text-gray-500">
                                            No jobs in this view.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredJobs.map((job) => {
                                        const eff = effectiveModerationStatus(job);
                                        const badge = statusBadge(eff);
                                        return (
                                            <tr key={job._id} className="hover:bg-[#29a08e]/[0.02] transition-colors">
                                                <td className="px-6 py-4 align-top">
                                                    <div className="flex items-start gap-2 flex-wrap">
                                                        <p className="text-sm font-semibold text-gray-900">{job.title}</p>
                                                        {(job.reportCount || 0) >= 1 && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                                                                {job.reportCount} report
                                                                {job.reportCount !== 1 ? 's' : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {job.company_name || job.companyName}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 align-top text-xs text-gray-600">
                                                    <p className="font-medium text-gray-800">
                                                        {job.recruiterName || job.recruiter_id?.fullName || '—'}
                                                    </p>
                                                    <p className="text-gray-400">{job.recruiterEmail || job.recruiter_id?.email}</p>
                                                    <p className="mt-1 text-[10px] uppercase tracking-wide text-gray-400">
                                                        Co. KYC: {job.companyKycStatus || job.company_id?.status || '—'}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 align-top whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${badge.className}`}
                                                    >
                                                        {badge.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 align-top text-right">
                                                    <ModerationActionsMenu
                                                        job={job}
                                                        eff={eff}
                                                        statusTab={statusTab}
                                                        isOpen={openActionsJobId === (job._id?.toString?.() || String(job._id))}
                                                        onOpen={() =>
                                                            setOpenActionsJobId(job._id?.toString?.() || String(job._id))
                                                        }
                                                        onClose={() => setOpenActionsJobId(null)}
                                                        onWarn={(j) => openModal('warn', j)}
                                                        onHide={(j) => openModal('hide', j)}
                                                        onDelete={(j) => openModal('delete', j)}
                                                        onApprove={handleApprove}
                                                        onBadge={openLabelModal}
                                                        onViewListing={handleViewListing}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between gap-4 flex-wrap">
                        <p className="text-xs text-gray-400 font-medium">
                            Showing {filteredJobs.length} of {jobs.length} on this page (filter: {statusTab})
                        </p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 disabled:opacity-40"
                            >
                                Previous
                            </button>
                            <button
                                type="button"
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => p + 1)}
                                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Warn / Hide / Delete modals */}
            {modal && modalJob && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100">
                        <header className="p-5 border-b border-gray-100 flex justify-between items-start gap-4">
                            <div>
                                <h3 className="text-lg font-black text-gray-900">
                                    {modal === 'warn' && 'Send warning to recruiter'}
                                    {modal === 'hide' && 'Hide this job post'}
                                    {modal === 'delete' && 'Permanently delete this job post'}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">{modalJob.title}</p>
                            </div>
                            <button type="button" onClick={closeModal} className="p-1 text-gray-400 hover:text-gray-700">
                                <X className="w-5 h-5" />
                            </button>
                        </header>
                        <div className="p-5 space-y-4">
                            {modal === 'warn' && (
                                <>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                        Warning message (recruiter will see this on their dashboard)
                                    </label>
                                    <textarea
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#29a08e]/30 min-h-[120px]"
                                        required
                                        value={modalText}
                                        onChange={(e) => setModalText(e.target.value)}
                                        placeholder="Describe what needs to be fixed…"
                                    />
                                    <p className="text-xs text-gray-500">
                                        The job stays live. The recruiter has 48 hours to fix the issue.
                                    </p>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider pt-2">
                                        Additional note (optional, shown to recruiter)
                                    </label>
                                    <textarea
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#29a08e]/30 min-h-[72px]"
                                        value={modalNote}
                                        onChange={(e) => setModalNote(e.target.value)}
                                        placeholder="Optional extra detail…"
                                    />
                                </>
                            )}
                            {modal === 'hide' && (
                                <>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                        Reason for hiding (recruiter will see this)
                                    </label>
                                    <textarea
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#29a08e]/30 min-h-[120px]"
                                        required
                                        value={modalText}
                                        onChange={(e) => setModalText(e.target.value)}
                                    />
                                    <p className="text-xs text-gray-500">
                                        The job goes offline. The recruiter can edit and resubmit for your review.
                                    </p>
                                </>
                            )}
                            {modal === 'delete' && (
                                <>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                        Reason for deletion (recruiter will see this)
                                    </label>
                                    <textarea
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#29a08e]/30 min-h-[100px]"
                                        required
                                        value={modalText}
                                        onChange={(e) => setModalText(e.target.value)}
                                    />
                                    <p className="text-xs font-semibold text-red-600">
                                        This action is permanent and cannot be undone.
                                    </p>
                                </>
                            )}
                            <div className="flex gap-2 justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2.5 rounded-xl text-xs font-bold border border-gray-200 text-gray-600 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={submitModeration}
                                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0f172a] hover:bg-[#29a08e] disabled:opacity-50"
                                >
                                    {submitting
                                        ? 'Saving…'
                                        : modal === 'warn'
                                          ? 'Send warning'
                                          : modal === 'hide'
                                            ? 'Hide job'
                                            : 'Delete permanently'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Label override */}
            {labelModalJob && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#0f172a]/50 backdrop-blur-sm" onClick={() => setLabelModalJob(null)} />
                    <form
                        onSubmit={handleSaveLabelOverride}
                        className="relative bg-white rounded-2xl shadow-xl w-full max-w-md border border-gray-100 p-6 space-y-4"
                    >
                        <div className="flex justify-between items-start">
                            <h3 className="text-lg font-black">Badge label override</h3>
                            <button type="button" onClick={() => setLabelModalJob(null)} className="text-gray-400 hover:text-gray-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-xs text-gray-500">{labelModalJob.title}</p>
                        <select
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium"
                            value={labelOverrideDraft || 'AUTO'}
                            onChange={(e) => setLabelOverrideDraft(e.target.value === 'AUTO' ? '' : e.target.value)}
                        >
                            <option value="AUTO">Auto (algorithm)</option>
                            <option value="SPONSORED">Sponsored</option>
                            <option value="AI_SUGGESTED">AI suggested</option>
                            <option value="FEATURED">Featured opportunity</option>
                            <option value="GOOD_MATCH">Good match</option>
                        </select>
                        <button
                            type="submit"
                            disabled={labelSaving}
                            className="w-full py-2.5 bg-[#0f172a] text-white rounded-xl text-xs font-bold disabled:opacity-60"
                        >
                            {labelSaving ? 'Saving…' : 'Save'}
                        </button>
                    </form>
                </div>
            )}

            {(previewOpen || previewLoading) && (
                <JobPreviewModal job={previewJob} loading={previewLoading} onClose={closePreviewModal} />
            )}
        </div>
    );
};

export default AdminJobs;
