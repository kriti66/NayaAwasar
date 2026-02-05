import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const SeekerApplications = () => {
    const { user } = useAuth();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [sortBy, setSortBy] = useState('Newest');

    useEffect(() => {
        const fetchApps = async () => {
            try {
                const res = await api.get('/applications/my');
                setApplications(res.data);
            } catch (error) {
                console.error("Fetch applications error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchApps();
    }, []);

    const statusSteps = ['Applied', 'Under Review', 'Interview Scheduled', 'Offer Extended', 'Rejected'];

    const getStatusIndex = (status) => {
        const idx = statusSteps.indexOf(status);
        return idx !== -1 ? idx : 0;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Under Review': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'Interview Scheduled': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            case 'Offer Extended': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Rejected': return 'bg-rose-50 text-rose-600 border-rose-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    const filteredApplications = applications
        .filter(app => {
            const matchesSearch = app.job_id?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                app.job_id?.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            if (sortBy === 'Newest') return new Date(b.createdAt) - new Date(a.createdAt);
            return new Date(a.createdAt) - new Date(b.createdAt);
        });

    return (
        <div className="flex min-h-screen bg-[#FDFEFE] font-sans selection:bg-blue-100 selection:text-blue-900">
            <Sidebar />

            <div className="flex-1 flex flex-col">
                {/* Topbar */}
                <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-10 sticky top-0 z-30">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tracking /</span>
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-widest">Job Applications</span>
                    </div>
                </header>

                <main className="flex-1 p-10 max-w-5xl mx-auto w-full">
                    <h1 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Your Job Applications</h1>

                    {/* Filters Row */}
                    <div className="flex flex-wrap items-center gap-4 mb-10">
                        <div className="relative flex-1 min-w-[300px]">
                            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            <input
                                type="text"
                                placeholder="Search applications..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-xl text-sm font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all shadow-sm"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-white border border-slate-100 p-1.5 rounded-xl shadow-sm">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Filter by</span>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer pr-4"
                                >
                                    <option>All</option>
                                    {statusSteps.map(s => <option key={s}>{s}</option>)}
                                </select>
                            </div>

                            <div className="flex items-center gap-2 bg-white border border-slate-100 p-1.5 rounded-xl shadow-sm">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Sort by</span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer pr-4"
                                >
                                    <option>Newest</option>
                                    <option>Oldest</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Applications List */}
                    <div className="space-y-6">
                        {loading ? (
                            Array(3).fill(0).map((_, i) => (
                                <div key={i} className="h-64 bg-slate-50 rounded-2xl animate-pulse"></div>
                            ))
                        ) : filteredApplications.length > 0 ? (
                            filteredApplications.map((app) => (
                                <div key={app._id} className="bg-white border border-slate-100 rounded-2xl px-10 py-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                    <div className="flex justify-between items-start mb-8">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{app.job_id?.title}</h3>
                                            <p className="text-sm font-bold text-slate-500 mt-1">{app.job_id?.company_name} • {app.job_id?.location}</p>
                                        </div>
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(app.status)}`}>
                                            {app.status}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-slate-400 mb-10">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        <span className="text-xs font-bold">Application Date: {new Date(app.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                    </div>

                                    {/* Professional Stepper */}
                                    <div className="relative mb-10 px-4">
                                        <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-100 -translate-y-1/2 rounded-full"></div>
                                        <div
                                            className="absolute top-1/2 left-4 h-1 bg-blue-500 -translate-y-1/2 rounded-full transition-all duration-1000"
                                            style={{ width: `${(getStatusIndex(app.status) / 4) * 100}%` }}
                                        ></div>

                                        <div className="relative flex justify-between">
                                            {statusSteps.map((step, idx) => {
                                                const isActive = idx <= getStatusIndex(app.status);
                                                const isCurrent = idx === getStatusIndex(app.status);

                                                return (
                                                    <div key={step} className="flex flex-col items-center">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black z-10 border-4 border-white transition-all ${isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-50 scale-110' :
                                                                isActive ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'
                                                            }`}>
                                                            {idx + 1}
                                                        </div>
                                                        <span className={`text-[10px] font-bold mt-3 uppercase tracking-tighter ${isActive ? 'text-slate-900' : 'text-slate-300'}`}>
                                                            {step}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4 border-t border-slate-50">
                                        <button className="px-6 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-black border border-slate-100 hover:bg-slate-100 transition-all">
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-3xl p-20 text-center">
                                <div className="text-5xl mb-6 opacity-30">📋</div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">No applications found</h3>
                                <p className="text-slate-500 font-medium">Try adjusting your filters or search terms.</p>
                                <button onClick={() => { setSearchQuery(''); setStatusFilter('All'); }} className="mt-8 text-blue-600 font-bold hover:underline">Clear all filters</button>
                            </div>
                        )}
                    </div>
                </main>

                <footer className="h-20 bg-white border-t border-slate-100 flex items-center justify-center mt-auto">
                    <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">
                        © {new Date().getFullYear()} Naya Awasar. All rights reserved.
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default SeekerApplications;
