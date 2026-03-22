import { useState, useEffect } from 'react';
import { promotionService, PROMOTION_TYPE_LABELS, STATUS_COLORS, PROMOTION_TYPE_COLORS, PAYMENT_STATUS_COLORS } from '../../services/promotionService';
import { toast } from 'react-hot-toast';
import {
    Megaphone,
    Search,
    Filter,
    CheckCircle,
    XCircle,
    CreditCard,
    Eye,
    X,
    RefreshCw,
    ChevronDown
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5001';

const AdminPromotionRequests = () => {
    const [promotions, setPromotions] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterType, setFilterType] = useState('');
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('promotions'); // promotions | payments
    const [rejectReason, setRejectReason] = useState('');
    const [rejectModal, setRejectModal] = useState({ open: false, id: null, type: 'promotion' });

    const fetchData = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filterStatus) params.status = filterStatus;
            if (filterType) params.type = filterType;
            if (search) params.search = search;

            const [promRes, payRes] = await Promise.all([
                promotionService.adminGetAll(params),
                promotionService.adminGetPayments({ status: 'pending_verification' })
            ]);
            setPromotions(promRes.data);
            setPayments(payRes.data);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [filterStatus, filterType, search]);

    const handleApprove = async (promotionId) => {
        try {
            await promotionService.adminApprove(promotionId);
            toast.success('Promotion approved');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to approve');
        }
    };

    const handleRejectPromotion = async () => {
        if (!rejectModal.id) return;
        try {
            await promotionService.adminReject(rejectModal.id, rejectReason);
            toast.success('Promotion rejected');
            setRejectModal({ open: false, id: null, type: 'promotion' });
            setRejectReason('');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reject');
        }
    };

    const handleExpire = async (promotionId) => {
        if (!window.confirm('Expire this promotion?')) return;
        try {
            await promotionService.adminExpire(promotionId);
            toast.success('Promotion expired');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to expire');
        }
    };

    const handleApprovePayment = async (paymentId) => {
        try {
            await promotionService.adminApprovePayment(paymentId);
            toast.success('Payment approved. You can now approve the promotion.');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to approve');
        }
    };

    const handleRejectPayment = async () => {
        if (!rejectModal.id) return;
        try {
            await promotionService.adminRejectPayment(rejectModal.id, rejectReason);
            toast.success('Payment rejected');
            setRejectModal({ open: false, id: null, type: 'payment' });
            setRejectReason('');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reject');
        }
    };

    const formatDate = (d) => {
        if (!d) return '—';
        const x = new Date(d);
        return isNaN(x.getTime()) ? '—' : x.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const approvablePromotions = promotions.filter(p =>
        ['pending', 'payment_submitted'].includes(p.status)
    );
    const paymentsPending = payments.filter(p => p.paymentStatus === 'pending_verification');

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">Promotion Requests</h1>
                        <p className="text-slate-600 text-sm mt-1">Approve promotion requests and verify payments</p>
                    </div>
                    <button
                        onClick={fetchData}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('promotions')}
                        className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors ${activeTab === 'promotions' ? 'bg-[#29a08e] text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'}`}
                    >
                        Promotion Requests
                    </button>
                    <button
                        onClick={() => setActiveTab('payments')}
                        className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors ${activeTab === 'payments' ? 'bg-[#29a08e] text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'}`}
                    >
                        Payment Verification ({paymentsPending.length})
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-6">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search company or job..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#29a08e] focus:border-transparent"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#29a08e] focus:border-transparent"
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="payment_required">Payment Required</option>
                        <option value="payment_submitted">Payment Submitted</option>
                        <option value="active">Active</option>
                        <option value="rejected">Rejected</option>
                        <option value="expired">Expired</option>
                    </select>
                    <select
                        value={filterType}
                        onChange={e => setFilterType(e.target.value)}
                        className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#29a08e] focus:border-transparent"
                    >
                        <option value="">All Types</option>
                        {Object.entries(PROMOTION_TYPE_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                        ))}
                    </select>
                </div>

                {loading ? (
                    <div className="flex justify-center py-24">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#29a08e] border-t-transparent" />
                    </div>
                ) : activeTab === 'promotions' ? (
                    <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-800">
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-200 uppercase tracking-wider">Company / Job</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-200 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-200 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-200 uppercase tracking-wider">Payment</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-200 uppercase tracking-wider">Requested</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-slate-200 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {promotions.map((p) => (
                                        <tr
                                            key={p._id}
                                            className="bg-white hover:bg-slate-50 transition-colors duration-150"
                                        >
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-slate-900">{p.companyId?.name || '—'}</p>
                                                <p className="text-sm text-slate-600 mt-0.5">{p.jobId?.title || '—'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${PROMOTION_TYPE_COLORS[p.promotionType] || 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                                                    {PROMOTION_TYPE_LABELS[p.promotionType] || p.promotionType}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[p.status] || 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                                                    {p.status?.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {p.isFreePromotion ? (
                                                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                                        Free
                                                    </span>
                                                ) : (
                                                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${PAYMENT_STATUS_COLORS[p.paymentStatus] || 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                                                        Rs. {p.amount ?? 0} · {(p.paymentStatus || 'unpaid').replace(/_/g, ' ')}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-700">{formatDate(p.requestedAt)}</td>
                                            <td className="px-6 py-4 text-right">
                                                {['pending', 'payment_submitted'].includes(p.status) && (
                                                    <div className="flex gap-2 justify-end">
                                                        <button
                                                            onClick={() => handleApprove(p._id)}
                                                            className="p-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors"
                                                            title="Approve"
                                                            aria-label="Approve"
                                                        >
                                                            <CheckCircle size={18} strokeWidth={2.5} />
                                                        </button>
                                                        <button
                                                            onClick={() => setRejectModal({ open: true, id: p._id, type: 'promotion' })}
                                                            className="p-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                                                            title="Reject"
                                                            aria-label="Reject"
                                                        >
                                                            <XCircle size={18} strokeWidth={2.5} />
                                                        </button>
                                                    </div>
                                                )}
                                                {p.status === 'active' && (
                                                    <button
                                                        onClick={() => handleExpire(p._id)}
                                                        className="px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-100 rounded-lg hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors border border-amber-200"
                                                    >
                                                        Expire
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {promotions.length === 0 && (
                            <div className="p-16 text-center">
                                <p className="text-slate-600 font-medium">No promotion requests found.</p>
                                <p className="text-sm text-slate-500 mt-1">Requests will appear here when companies request job promotions.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-800">
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-200 uppercase tracking-wider">Company / Job</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-200 uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-200 uppercase tracking-wider">Transaction ID</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-200 uppercase tracking-wider">Receipt</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-slate-200 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {payments.map((pay) => {
                                        const promo = pay.promotionId;
                                        const job = promo?.jobId;
                                        const company = promo?.companyId;
                                        return (
                                            <tr
                                                key={pay._id}
                                                className="bg-white hover:bg-slate-50 transition-colors duration-150"
                                            >
                                                <td className="px-6 py-4">
                                                    <p className="font-semibold text-slate-900">{company?.name || '—'}</p>
                                                    <p className="text-sm text-slate-600 mt-0.5">{job?.title || '—'}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-slate-900">Rs. {pay.amount}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-mono text-slate-700 bg-slate-100 px-2 py-1 rounded">{pay.transactionId || '—'}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {pay.receiptImage ? (
                                                        <a
                                                            href={`${API_BASE}${pay.receiptImage}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#29a08e] hover:text-[#238276] focus:outline-none focus:ring-2 focus:ring-[#29a08e] focus:ring-offset-2 rounded px-2 py-1"
                                                        >
                                                            <Eye size={16} />
                                                            View Receipt
                                                        </a>
                                                    ) : (
                                                        <span className="text-slate-400 text-sm">—</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex gap-2 justify-end">
                                                        <button
                                                            onClick={() => handleApprovePayment(pay._id)}
                                                            className="p-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors"
                                                            title="Approve"
                                                            aria-label="Approve"
                                                        >
                                                            <CheckCircle size={18} strokeWidth={2.5} />
                                                        </button>
                                                        <button
                                                            onClick={() => setRejectModal({ open: true, id: pay._id, type: 'payment' })}
                                                            className="p-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                                                            title="Reject"
                                                            aria-label="Reject"
                                                        >
                                                            <XCircle size={18} strokeWidth={2.5} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {payments.length === 0 && (
                            <div className="p-16 text-center">
                                <p className="text-slate-600 font-medium">No payments pending verification.</p>
                                <p className="text-sm text-slate-500 mt-1">Payment submissions will appear here when companies upload proof.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Reject Modal */}
            {rejectModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-black text-slate-900 mb-4">Reject {rejectModal.type === 'promotion' ? 'Promotion' : 'Payment'}</h3>
                        <textarea
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="Reason for rejection (optional)"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 mb-4 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            rows={3}
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setRejectModal({ open: false, id: null, type: 'promotion' });
                                    setRejectReason('');
                                }}
                                className="flex-1 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={rejectModal.type === 'promotion' ? handleRejectPromotion : handleRejectPayment}
                                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPromotionRequests;
