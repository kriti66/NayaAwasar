import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { promotionService, PROMOTION_TYPE_LABELS } from '../../services/promotionService';
import { toast } from 'react-hot-toast';
import { Megaphone, ArrowLeft } from 'lucide-react';

const DURATIONS = [7, 15, 30];

const PromotionPayment = () => {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const initialJobId =
        searchParams.get('jobId') || location.state?.jobId || '';

    const [pricing, setPricing] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        jobId: initialJobId,
        recruiterName: '',
        companyName: '',
        email: '',
        phone: '',
        jobTitle: '',
        promotionType: 'FEATURED',
        durationDays: 7,
        paymentMethod: 'bank_transfer',
        transactionId: '',
        note: ''
    });
    const [screenshot, setScreenshot] = useState(null);

    useEffect(() => {
        const run = async () => {
            try {
                setLoading(true);
                const [priceRes, jobsRes, profRes] = await Promise.all([
                    promotionService.getPricing(),
                    api.get('/recruiter/jobs'),
                    api.get('/recruiter/profile-summary')
                ]);
                setPricing(priceRes.data?.pricing || null);
                setJobs(jobsRes.data || []);
                setProfile(profRes.data);
                const u = profRes.data?.user;
                const co = profRes.data?.company;
                setForm((f) => ({
                    ...f,
                    jobId: f.jobId || initialJobId,
                    recruiterName: u?.fullName || f.recruiterName,
                    email: u?.email || f.email,
                    phone: u?.phone || f.phone || '',
                    companyName: co?.name || f.companyName
                }));
            } catch (e) {
                toast.error(e.response?.data?.message || 'Failed to load form data');
            } finally {
                setLoading(false);
            }
        };
        run();
    }, [initialJobId]);

    const activeJobs = useMemo(
        () => (jobs || []).filter((j) => j.status === 'Active'),
        [jobs]
    );

    useEffect(() => {
        const j = activeJobs.find((x) => String(x._id || x.id) === String(form.jobId));
        if (j) {
            setForm((f) => ({ ...f, jobTitle: j.title || f.jobTitle }));
        }
    }, [form.jobId, activeJobs]);

    const amount =
        pricing?.[form.promotionType]?.[form.durationDays] ?? 0;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({
            ...f,
            [name]: name === 'durationDays' ? Number(value) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.jobId) {
            toast.error('Please select a job');
            return;
        }
        if (!screenshot) {
            toast.error('Payment screenshot is required');
            return;
        }
        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append('jobId', form.jobId);
            fd.append('recruiterName', form.recruiterName.trim());
            fd.append('companyName', form.companyName.trim());
            fd.append('email', form.email.trim());
            fd.append('phone', form.phone.trim());
            fd.append('jobTitle', form.jobTitle.trim());
            fd.append('promotionType', form.promotionType);
            fd.append('durationDays', String(form.durationDays));
            fd.append('amount', String(amount));
            fd.append('paymentMethod', form.paymentMethod);
            fd.append('transactionId', form.transactionId.trim());
            fd.append('note', form.note.trim());
            fd.append('paymentScreenshot', screenshot);

            await promotionService.submitPromotionPaymentRequest(fd);
            toast.success('Request submitted. We will review your payment and notify you.');
            setForm((f) => ({
                ...f,
                transactionId: '',
                note: ''
            }));
            setScreenshot(null);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit request');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#29a08e] border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F3F4F6] pb-16">
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#0d2f2b] to-slate-900 pt-10 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-10 w-64 h-64 bg-[#29a08e] rounded-full blur-3xl" />
                </div>
                <div className="relative max-w-3xl mx-auto">
                    <Link
                        to="/recruiter/promotions"
                        className="inline-flex items-center gap-2 text-sm font-bold text-white/80 hover:text-white mb-6"
                    >
                        <ArrowLeft size={18} />
                        Back to promotions
                    </Link>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm font-medium text-gray-200 mb-3">
                        <Megaphone size={14} />
                        Paid promotion
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                        Manual <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#29a08e] to-teal-300">payment request</span>
                    </h1>
                    <p className="text-gray-300 mt-2 max-w-xl">
                        After you pay via bank transfer or wallet, submit this form with your transaction reference and a
                        screenshot. An admin will verify and activate your job promotion.
                    </p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
                <form
                    onSubmit={handleSubmit}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-5"
                >
                    {!profile?.isVerified && (
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm font-semibold text-amber-900">
                            Your company must be verified and your recruiter profile approved before submitting a paid
                            promotion request.
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Recruiter name</label>
                            <input
                                name="recruiterName"
                                value={form.recruiterName}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#29a08e]/20 focus:border-[#29a08e]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Company name</label>
                            <input
                                name="companyName"
                                value={form.companyName}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#29a08e]/20 focus:border-[#29a08e]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#29a08e]/20 focus:border-[#29a08e]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Phone</label>
                            <input
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#29a08e]/20 focus:border-[#29a08e]"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Job</label>
                        <select
                            name="jobId"
                            value={form.jobId}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#29a08e]/20 focus:border-[#29a08e]"
                        >
                            <option value="">Select an active job</option>
                            {activeJobs.map((job) => (
                                <option key={job._id || job.id} value={job._id || job.id}>
                                    {job.title}
                                </option>
                            ))}
                        </select>
                        {form.jobId && (
                            <p className="text-xs text-gray-500 mt-1.5 font-mono">Job ID: {form.jobId}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Job title (as promoted)</label>
                        <input
                            name="jobTitle"
                            value={form.jobTitle}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#29a08e]/20 focus:border-[#29a08e]"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Promotion type</label>
                            <select
                                name="promotionType"
                                value={form.promotionType}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#29a08e]/20 focus:border-[#29a08e]"
                            >
                                {Object.entries(PROMOTION_TYPE_LABELS).map(([k, v]) => (
                                    <option key={k} value={k}>
                                        {v}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Duration</label>
                            <select
                                name="durationDays"
                                value={form.durationDays}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#29a08e]/20 focus:border-[#29a08e]"
                            >
                                {DURATIONS.map((d) => (
                                    <option key={d} value={d}>
                                        {d} days
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#29a08e]/5 border border-[#29a08e]/20">
                        <p className="text-sm font-black text-gray-900">
                            Amount due (must match this exactly):{' '}
                            <span className="text-[#29a08e]">Rs. {amount}</span>
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Payment method</label>
                            <select
                                name="paymentMethod"
                                value={form.paymentMethod}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#29a08e]/20 focus:border-[#29a08e]"
                            >
                                <option value="bank_transfer">Bank transfer</option>
                                <option value="esewa">eSewa</option>
                                <option value="khalti">Khalti</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                Transaction ID / reference
                            </label>
                            <input
                                name="transactionId"
                                value={form.transactionId}
                                onChange={handleChange}
                                required
                                placeholder="Reference from bank or wallet"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#29a08e]/20 focus:border-[#29a08e]"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Payment screenshot</label>
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            required
                            onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#29a08e]/10 file:text-[#29a08e] file:font-bold"
                        />
                        <p className="text-xs text-gray-500 mt-1">JPEG, PNG, WebP, or PDF — max 5 MB</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Note (optional)</label>
                        <textarea
                            name="note"
                            value={form.note}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#29a08e]/20 focus:border-[#29a08e] resize-none"
                            placeholder="Anything else we should know"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting || !profile?.isVerified}
                        className="w-full py-3.5 bg-[#29a08e] text-white rounded-xl font-bold hover:bg-[#228377] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Submitting…' : 'Submit payment request'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PromotionPayment;
