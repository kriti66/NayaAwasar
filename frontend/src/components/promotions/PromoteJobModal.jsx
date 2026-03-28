import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Megaphone } from 'lucide-react';
import { promotionService, PROMOTION_TYPE_LABELS } from '../../services/promotionService';
import { toast } from 'react-hot-toast';

const DURATIONS = [7, 15, 30];

const PromoteJobModal = ({ isOpen, onClose, jobs, preselectedJobId, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [pricing, setPricing] = useState(null);
    const [summary, setSummary] = useState(null);
    const [form, setForm] = useState({
        jobId: preselectedJobId || '',
        promotionType: 'FEATURED',
        durationDays: 7
    });

    const activeJobs = jobs?.filter(j => j.status === 'Active') || [];
    const canFree = Boolean(summary && summary.freeRemaining > 0);
    const freeExhausted = Boolean(summary && summary.freeRemaining === 0);
    const paidRequestHref =
        form.jobId && freeExhausted
            ? `/promotion-payment?jobId=${encodeURIComponent(form.jobId)}`
            : '/promotion-payment';

    useEffect(() => {
        if (isOpen) {
            promotionService.getPricing().then(r => setPricing(r.data.pricing));
            promotionService.getSummary().then(r => setSummary(r.data));
            if (preselectedJobId) setForm(f => ({ ...f, jobId: preselectedJobId }));
        }
    }, [isOpen, preselectedJobId]);

    const handleRequest = async (e) => {
        e.preventDefault();
        if (!form.jobId) {
            toast.error('Please select a job');
            return;
        }
        if (freeExhausted) {
            toast.error('Free promotions are used up. Use the paid promotion request form.');
            return;
        }
        if (!summary) {
            toast.error('Still loading promotion summary. Please wait.');
            return;
        }
        setLoading(true);
        try {
            const res = await promotionService.requestPromotion(form);
            toast.success(res.data.message);
            onSuccess?.();
            onClose();
        } catch (err) {
            const data = err.response?.data;
            if (err.response?.status === 403 && data?.paymentRequired) {
                toast.error(data.message || 'Paid promotion request required.');
            } else {
                toast.error(data?.message || 'Failed to request promotion');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                        <Megaphone size={22} className="text-[#29a08e]" />
                        Promote Job
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <form onSubmit={handleRequest} className="space-y-5">
                        {summary && (
                            <div className={`p-4 rounded-xl border ${canFree ? 'bg-[#29a08e]/5 border-[#29a08e]/20' : 'bg-amber-50 border-amber-200'}`}>
                                <p className="text-sm font-bold">
                                    {canFree
                                        ? `You can request a free promotion. Slots in use: ${summary.freeUsed}/3 (${summary.freeRemaining} remaining).`
                                        : 'You have used all 3 free promotions. Submit a paid promotion request with payment proof for admin review.'}
                                </p>
                                {freeExhausted && (
                                    <p className="text-sm text-amber-900/90 mt-2">
                                        Open the{' '}
                                        <Link
                                            to={paidRequestHref}
                                            onClick={onClose}
                                            className="font-black text-[#29a08e] underline underline-offset-2 hover:text-[#228377]"
                                        >
                                            paid promotion request form
                                        </Link>
                                        {form.jobId ? ' (job pre-selected)' : ''}.
                                    </p>
                                )}
                            </div>
                        )}
                        {!summary && (
                            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-600">
                                Loading your free promotion slots…
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Select Job</label>
                            <select
                                required
                                value={form.jobId}
                                onChange={e => setForm(f => ({ ...f, jobId: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#29a08e]/20 focus:border-[#29a08e]"
                            >
                                <option value="">Choose a job</option>
                                {activeJobs.map(job => (
                                    <option key={job._id || job.id} value={job._id || job.id}>
                                        {job.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Promotion Type</label>
                            <select
                                value={form.promotionType}
                                onChange={e => setForm(f => ({ ...f, promotionType: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#29a08e]/20"
                            >
                                {Object.entries(PROMOTION_TYPE_LABELS).map(([k, v]) => (
                                    <option key={k} value={k}>{v}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Duration</label>
                            <select
                                value={form.durationDays}
                                onChange={e => setForm(f => ({ ...f, durationDays: Number(e.target.value) }))}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#29a08e]/20"
                            >
                                {DURATIONS.map(d => (
                                    <option key={d} value={d}>{d} days</option>
                                ))}
                            </select>
                        </div>

                        {freeExhausted && pricing && (
                            <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-600">
                                <span className="font-bold text-gray-800">List price for your selection: </span>
                                Rs. {pricing?.[form.promotionType]?.[form.durationDays] ?? '—'} — pay first, then submit proof on the paid request page.
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50">
                                Cancel
                            </button>
                            {canFree ? (
                                <button type="submit" disabled={loading || !summary} className="flex-1 py-3 bg-[#29a08e] text-white rounded-xl font-bold hover:bg-[#228377] disabled:opacity-60">
                                    {loading ? 'Submitting...' : 'Request free promotion'}
                                </button>
                            ) : freeExhausted ? (
                                <Link
                                    to={paidRequestHref}
                                    onClick={onClose}
                                    className="flex-1 py-3 bg-[#29a08e] text-white rounded-xl font-bold hover:bg-[#228377] text-center"
                                >
                                    Paid promotion request
                                </Link>
                            ) : (
                                <button type="button" disabled className="flex-1 py-3 bg-gray-200 text-gray-500 rounded-xl font-bold cursor-not-allowed">
                                    Loading…
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PromoteJobModal;
