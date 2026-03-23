import { useState, useEffect } from 'react';
import { X, Megaphone, CreditCard } from 'lucide-react';
import { promotionService, PROMOTION_TYPE_LABELS, STATUS_COLORS } from '../../services/promotionService';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';

const DURATIONS = [7, 15, 30];
const API_BASE = API_BASE_URL;

const PromoteJobModal = ({ isOpen, onClose, jobs, preselectedJobId, onSuccess }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [pricing, setPricing] = useState(null);
    const [summary, setSummary] = useState(null);
    const [form, setForm] = useState({
        jobId: preselectedJobId || '',
        promotionType: 'FEATURED',
        durationDays: 7
    });
    const [paymentForm, setPaymentForm] = useState({
        transactionId: '',
        paymentMethod: 'bank_transfer',
        receiptImage: null
    });

    const activeJobs = jobs?.filter(j => j.status === 'Active') || [];
    const selectedJob = activeJobs.find(j => (j._id || j.id) === form.jobId);
    const amount = pricing?.[form.promotionType]?.[form.durationDays] || 0;
    const canFree = summary && summary.freeRemaining > 0;

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
        setLoading(true);
        try {
            const res = await promotionService.requestPromotion(form);
            toast.success(res.data.message);
            if (res.data.promotion?.paymentRequired) {
                setStep(2);
                setForm(f => ({ ...f, promotionId: res.data.promotion._id, amount: res.data.promotion.amount }));
            } else {
                onSuccess?.();
                onClose();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to request promotion');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitPayment = async (e) => {
        e.preventDefault();
        if (!paymentForm.transactionId || !paymentForm.receiptImage) {
            toast.error('Transaction ID and receipt image are required');
            return;
        }
        setLoading(true);
        try {
            const fd = new FormData();
            fd.append('transactionId', paymentForm.transactionId);
            fd.append('paymentMethod', paymentForm.paymentMethod);
            fd.append('receiptImage', paymentForm.receiptImage);
            if (!form.promotionId) { toast.error('Invalid promotion'); return; }
            await promotionService.submitPayment(form.promotionId, fd);
            toast.success('Payment submitted. Awaiting admin verification.');
            onSuccess?.();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit payment');
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
                        {step === 1 ? 'Promote Job' : 'Submit Payment'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {step === 1 && (
                        <form onSubmit={handleRequest} className="space-y-5">
                            {summary && (
                                <div className={`p-4 rounded-xl border ${canFree ? 'bg-[#29a08e]/5 border-[#29a08e]/20' : 'bg-amber-50 border-amber-200'}`}>
                                    <p className="text-sm font-bold">
                                        {canFree
                                            ? `This promotion can be used for free. Free promotions used: ${summary.freeUsed}/3`
                                            : 'Free promotions exhausted. Payment is required for the next promotion.'}
                                    </p>
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

                            {!canFree && (
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <p className="text-sm font-bold text-gray-700">
                                        Amount: Rs. {amount}
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50">
                                    Cancel
                                </button>
                                <button type="submit" disabled={loading} className="flex-1 py-3 bg-[#29a08e] text-white rounded-xl font-bold hover:bg-[#228377] disabled:opacity-60">
                                    {loading ? 'Submitting...' : canFree ? 'Request Free Promotion' : 'Proceed to Payment'}
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleSubmitPayment} className="space-y-5">
                            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                                <p className="text-sm font-bold text-amber-800">Amount: Rs. {form.amount ?? amount}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Transaction ID</label>
                                <input
                                    type="text"
                                    required
                                    value={paymentForm.transactionId}
                                    onChange={e => setPaymentForm(f => ({ ...f, transactionId: e.target.value }))}
                                    placeholder="Enter bank transaction ID"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Payment Method</label>
                                <select
                                    value={paymentForm.paymentMethod}
                                    onChange={e => setPaymentForm(f => ({ ...f, paymentMethod: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                                >
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="esewa">eSewa</option>
                                    <option value="khalti">Khalti</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Payment Receipt (Screenshot/PDF)</label>
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    required
                                    onChange={e => setPaymentForm(f => ({ ...f, receiptImage: e.target.files?.[0] }))}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#29a08e]/10 file:text-[#29a08e] file:font-bold"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-600">
                                    Back
                                </button>
                                <button type="submit" disabled={loading} className="flex-1 py-3 bg-[#29a08e] text-white rounded-xl font-bold hover:bg-[#228377] disabled:opacity-60">
                                    {loading ? 'Submitting...' : 'Submit Payment'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PromoteJobModal;
