import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { promotionService, PROMOTION_TYPE_LABELS, STATUS_COLORS } from '../../services/promotionService';
import PromoteJobModal from '../../components/promotions/PromoteJobModal';
import { Megaphone, TrendingUp, CreditCard, Calendar, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

const RecruiterPromotions = () => {
    const [searchParams] = useSearchParams();
    const preselectedJobId = searchParams.get('jobId');

    const [summary, setSummary] = useState(null);
    const [promotions, setPromotions] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [sumRes, promRes, jobsRes] = await Promise.all([
                promotionService.getSummary(),
                promotionService.getMyPromotions(),
                api.get('/recruiter/jobs')
            ]);
            setSummary(sumRes.data);
            setPromotions(promRes.data);
            setJobs(jobsRes.data || []);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        if (preselectedJobId) setModalOpen(true);
    }, [preselectedJobId]);

    const formatDate = (d) => {
        if (!d) return '—';
        const x = new Date(d);
        return isNaN(x.getTime()) ? '—' : x.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-[#F3F4F6]">
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#0d2f2b] to-slate-900 pt-12 pb-28 px-4 sm:px-6 lg:px-8">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-10 w-64 h-64 bg-[#29a08e] rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 right-20 w-80 h-80 bg-teal-400 rounded-full blur-3xl"></div>
                </div>
                <div className="relative max-w-7xl mx-auto">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                        <div className="text-white">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm font-medium mb-4">
                                <Megaphone size={14} />
                                Job Promotion
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
                                Promote <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#29a08e] to-teal-300">Your Jobs</span>
                            </h1>
                            <p className="text-gray-300 text-lg">Boost visibility with featured, sponsored, or homepage promotions.</p>
                        </div>
                        <button
                            onClick={() => setModalOpen(true)}
                            className="inline-flex items-center px-7 py-3.5 bg-[#29a08e] text-white rounded-2xl text-sm font-bold hover:bg-[#228377] shadow-lg gap-2"
                        >
                            <TrendingUp size={18} />
                            Promote a Job
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 pb-12 relative z-10">
                {loading ? (
                    <div className="flex justify-center py-24">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#29a08e] border-t-transparent" />
                    </div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Free Used</p>
                                <p className="text-2xl font-black text-gray-900">{summary?.freeUsed ?? 0}/3</p>
                            </div>
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Free Remaining</p>
                                <p className="text-2xl font-black text-[#29a08e]">{summary?.freeRemaining ?? 3}</p>
                            </div>
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Promotions</p>
                                <p className="text-2xl font-black text-gray-900">{summary?.totalPromotions ?? 0}</p>
                            </div>
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Active Now</p>
                                <p className="text-2xl font-black text-emerald-600">{summary?.activePromotions ?? 0}</p>
                            </div>
                        </div>

                        {/* Promotion History */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <h2 className="text-lg font-black text-gray-900">Promotion History</h2>
                                <p className="text-sm text-gray-500 mt-1">All your promotion requests and their status</p>
                            </div>
                            {promotions.length === 0 ? (
                                <div className="p-12 text-center text-gray-500">
                                    <Megaphone size={48} className="mx-auto mb-4 text-gray-300" />
                                    <p className="font-bold">No promotions yet</p>
                                    <p className="text-sm mt-1">Promote your first job to get started</p>
                                    <button
                                        onClick={() => setModalOpen(true)}
                                        className="mt-4 px-6 py-2.5 bg-[#29a08e] text-white rounded-xl font-bold text-sm hover:bg-[#228377]"
                                    >
                                        Promote a Job
                                    </button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Job</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Type</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Payment</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Dates</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {promotions.map((p) => (
                                                <tr key={p._id} className="hover:bg-gray-50/50">
                                                    <td className="px-6 py-4">
                                                        <p className="font-bold text-gray-900">{p.jobId?.title || '—'}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        {PROMOTION_TYPE_LABELS[p.promotionType] || p.promotionType}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-600'}`}>
                                                            {p.status?.replace(/_/g, ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">
                                                        {p.isFreePromotion ? (
                                                            <span className="text-emerald-600 font-bold">Free</span>
                                                        ) : (
                                                            <span>Rs. {p.amount} — {p.paymentStatus}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {formatDate(p.startDate)} – {formatDate(p.endDate)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>

            <PromoteJobModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                jobs={jobs}
                preselectedJobId={preselectedJobId}
                onSuccess={fetchData}
            />
        </div>
    );
};

export default RecruiterPromotions;
