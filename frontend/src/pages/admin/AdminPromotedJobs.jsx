import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import CompanyLogo from '../../components/common/CompanyLogo';
import {
    Briefcase,
    Search,
    Star,
    Award,
    Calendar,
    ArrowUpRight,
    Megaphone,
    X,
    Filter,
    Shield,
    Trash2,
    CheckCircle2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdminPromotedJobs = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('PROMOTED'); // 'ALL' or 'PROMOTED'

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [formData, setFormData] = useState({
        promotionType: 'FEATURED',
        promotionStartDate: '',
        promotionEndDate: '',
        promotionPriority: 0
    });

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const res = await api.get('/jobs/admin/all');
            setJobs(res.data);
        } catch (error) {
            console.error('Error fetching jobs:', error);
            toast.error('Failed to load jobs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    const handleOpenModal = (job) => {
        if (job.status !== 'Active') {
            toast.error('Only active open jobs can be promoted.');
            return;
        }

        setSelectedJob(job);
        
        // Initial setup for existing promotions vs new ones
        if (job.isPromoted) {
            setFormData({
                promotionType: job.promotionType || 'FEATURED',
                promotionStartDate: job.promotionStartDate ? new Date(job.promotionStartDate).toISOString().split('T')[0] : '',
                promotionEndDate: job.promotionEndDate ? new Date(job.promotionEndDate).toISOString().split('T')[0] : '',
                promotionPriority: job.promotionPriority || 0
            });
        } else {
            const today = new Date().toISOString().split('T')[0];
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            
            setFormData({
                promotionType: 'FEATURED',
                promotionStartDate: today,
                promotionEndDate: nextWeek.toISOString().split('T')[0],
                promotionPriority: 0
            });
        }
        setShowModal(true);
    };

    const handleSavePromotion = async (e) => {
        e.preventDefault();
        
        if (!formData.promotionStartDate || !formData.promotionEndDate) {
            toast.error('Please provide valid start and end dates.');
            return;
        }

        if (new Date(formData.promotionEndDate) <= new Date(formData.promotionStartDate)) {
            toast.error('End date must be firmly after the start date.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await api.patch(`/admin/jobs/${selectedJob._id}/promote`, {
                promotionType: formData.promotionType,
                promotionStartDate: formData.promotionStartDate,
                promotionEndDate: formData.promotionEndDate,
                promotionPriority: Number(formData.promotionPriority)
            });

            toast.success('Job promotion saved successfully!');
            setJobs(prev => prev.map(j => j._id === selectedJob._id ? res.data.job : j));
            setTimeout(() => setShowModal(false), 200);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update promotion');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRemovePromotion = async (jobId) => {
        if (!window.confirm('Are you sure you want to completely remove this job\'s promotion status?')) return;
        
        try {
            const res = await api.patch(`/admin/jobs/${jobId}/remove-promotion`);
            toast.success('Promotion removed completely.');
            setJobs(prev => prev.map(j => j._id === jobId ? res.data.job : j));
        } catch (error) {
            toast.error('Failed to remove promotion');
        }
    };

    const getPromoBadge = (type) => {
        const specs = {
            NONE: { c: 'bg-gray-100 text-gray-500', t: 'None' },
            FEATURED: { c: 'bg-indigo-50 text-indigo-700 border-indigo-200 border', t: 'Featured' },
            HOMEPAGE_BANNER: { c: 'bg-amber-50 text-amber-700 border-amber-200 border', t: 'Homepage Banner' },
            TOP_LISTING: { c: 'bg-emerald-50 text-emerald-700 border-emerald-200 border', t: 'Top Listing' }
        };
        const active = specs[type] || specs.NONE;
        return <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${active.c}`}>{active.t}</span>;
    };

    const isPromotionActive = (job) => {
        if (!job.isPromoted) return false;
        const now = new Date();
        const start = new Date(job.promotionStartDate);
        const end = new Date(job.promotionEndDate);
        return now >= start && now <= end;
    };

    const filteredJobs = jobs.filter(job => {
        const matchesSearch = job.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              job.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (filter === 'PROMOTED') {
            return job.isPromoted && matchesSearch;
        }
        return matchesSearch;
    });

    const activePromotionsCount = jobs.filter(isPromotionActive).length;
    const totalPromotedCount = jobs.filter(j => j.isPromoted).length;

    return (
        <div className="flex-1 w-full min-h-[calc(100vh-64px)] pb-12">
            {/* Header Hero */}
            <div className="relative bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] pt-10 pb-20 px-4 sm:px-6 lg:px-8 border-b border-[#29a08e]/20">
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-10 w-10 bg-amber-500/20 rounded-xl flex items-center justify-center border border-amber-500/30">
                                    <Megaphone className="h-5 w-5 text-amber-400" />
                                </div>
                                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-[0.2em]">Advertisement Center</span>
                            </div>
                            <h1 className="text-3xl font-black text-white tracking-tight">Promoted Jobs</h1>
                            <p className="text-gray-400 mt-2 text-sm max-w-xl">Curate job highlights and run banner advertisements for premium companies ensuring higher visibility.</p>
                        </div>
                        
                        <div className="flex items-center gap-4 flex-wrap bg-[#1e293b]/50 border border-white/5 rounded-2xl p-4 backdrop-blur-md">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Sponsored</p>
                                <p className="text-2xl font-black text-white">{totalPromotedCount}</p>
                            </div>
                            <div className="w-px h-10 bg-white/10 mx-2"></div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Currently Active</p>
                                <div className="flex items-center gap-2">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    <p className="text-2xl font-black text-white">{activePromotionsCount}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[600px]">
                    
                    {/* Control Bar */}
                    <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search all jobs by title or company..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all shadow-sm"
                            />
                        </div>
                        <div className="flex items-center gap-2 bg-gray-100/80 p-1 rounded-xl border border-gray-200">
                            {[
                                { id: 'PROMOTED', label: 'Ad Campaigns' },
                                { id: 'ALL', label: 'All Platform Jobs' }
                            ].map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setFilter(opt.id)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === opt.id ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#f8fafc] border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Job Posting</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Promo Type</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Duration</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Priority</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap text-right">Settings</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-gray-400 font-medium text-sm">Loading listings...</td>
                                    </tr>
                                ) : filteredJobs.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-16 text-center">
                                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                                <Megaphone className="w-6 h-6 text-gray-300" />
                                            </div>
                                            <h3 className="text-sm font-bold text-gray-900">No records found</h3>
                                            <p className="text-xs text-gray-500 mt-1">{filter === 'PROMOTED' ? "You aren't running any promotions right now." : "No jobs matching your search."}</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredJobs.map(job => {
                                        const nowActive = isPromotionActive(job);
                                        return (
                                            <tr key={job._id} className={`hover:bg-gray-50 transition-colors ${nowActive ? 'bg-amber-50/10' : ''}`}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <CompanyLogo job={job} companyName={job.company_name} className="w-10 h-10 rounded-xl" imgClassName="w-full h-full object-cover" fallbackClassName="text-sm" />
                                                        <div className="min-w-0">
                                                            <Link to={`/admin/jobs?search=${job._id}`} className="text-sm font-bold text-gray-900 hover:text-[#29a08e] truncate block line-clamp-1">{job.title}</Link>
                                                            <p className="text-xs text-gray-500 truncate">{job.company_name}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase ${job.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                                        {job.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getPromoBadge(job.isPromoted ? job.promotionType : 'NONE')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {job.isPromoted && job.promotionStartDate ? (
                                                        <div className="space-y-1">
                                                            <p className="text-[11px] text-gray-600 font-medium flex items-center gap-1.5"><span className="text-green-500 text-[10px]">●</span> {new Date(job.promotionStartDate).toLocaleDateString()}</p>
                                                            <p className="text-[11px] text-gray-600 font-medium flex items-center gap-1.5"><span className="text-red-500 text-[10px]">●</span> {new Date(job.promotionEndDate).toLocaleDateString()}</p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">Not set</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {job.isPromoted ? (
                                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-gray-100 text-gray-700 text-xs font-black border border-gray-200">
                                                            {job.promotionPriority || 0}
                                                        </span>
                                                    ) : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {job.isPromoted && (
                                                            <button
                                                                onClick={() => handleRemovePromotion(job._id)}
                                                                className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
                                                                title="Revoke Promotion"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleOpenModal(job)}
                                                            disabled={job.status !== 'Active'}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                                                                job.isPromoted 
                                                                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                                                                    : 'bg-gradient-to-r from-gray-900 to-gray-800 text-white hover:shadow-md hover:from-[#29a08e] hover:to-[#228377] shadow-sm disabled:opacity-50'
                                                            }`}
                                                        >
                                                            <Star className="w-3.5 h-3.5" />
                                                            {job.isPromoted ? 'Edit Ad' : 'Promote'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Promote Job Modal */}
            {showModal && selectedJob && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100">
                        <header className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                    <Star className="w-5 h-5 text-amber-500 fill-amber-500/20" />
                                    Configure Advertisement
                                </h3>
                                <p className="text-xs text-gray-500 mt-1 font-medium">Targeted campaign for: <strong className="text-gray-900">{selectedJob.title}</strong> at {selectedJob.company_name}</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </header>

                        <form onSubmit={handleSavePromotion} className="p-6 space-y-5">
                            
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block">Advertisement Tier</label>
                                <select
                                    value={formData.promotionType}
                                    onChange={(e) => setFormData({...formData, promotionType: e.target.value})}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all shadow-sm"
                                    required
                                >
                                    <option value="FEATURED">Featured Tag (Minimal emphasis)</option>
                                    <option value="HOMEPAGE_BANNER">Homepage Banner (Maximum visibility)</option>
                                    <option value="TOP_LISTING">Top Listing (Sticks to top of search)</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block">Start Date</label>
                                    <input
                                        type="date"
                                        value={formData.promotionStartDate}
                                        onChange={(e) => setFormData({...formData, promotionStartDate: e.target.value})}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all shadow-sm"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block">End Date</label>
                                    <input
                                        type="date"
                                        value={formData.promotionEndDate}
                                        onChange={(e) => setFormData({...formData, promotionEndDate: e.target.value})}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all shadow-sm"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block">Display Priority (Numeric weight)</label>
                                    <span className="text-[10px] text-gray-400 font-medium">Higher solves tie-breaks</span>
                                </div>
                                <input
                                    type="number"
                                    min="0"
                                    max="1000"
                                    value={formData.promotionPriority}
                                    onChange={(e) => setFormData({...formData, promotionPriority: e.target.value})}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all shadow-sm"
                                    required
                                />
                            </div>

                            <div className="pt-4 flex gap-3 border-t border-gray-100">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : <><CheckCircle2 className="w-4 h-4" /> Finalize Campaign</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPromotedJobs;
