import { useState, useEffect, useMemo } from 'react';
import DashboardNavbar from '../../components/dashboard/DashboardNavbar';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

// New Components
import ApplicationSummary from '../../components/applications/ApplicationSummary';
import ApplicationFilters from '../../components/applications/ApplicationFilters';
import ApplicationCard from '../../components/applications/ApplicationCard';

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
                setLoading(true);
                const res = await api.get('/applications/my');
                setApplications(res.data);
            } catch (error) {
                console.error("Fetch applications error:", error);
                toast.error("Failed to load your applications");
            } finally {
                setLoading(false);
            }
        };
        fetchApps();
    }, []);

    // Derived stats
    const stats = useMemo(() => {
        return {
            total: applications.length,
            active: applications.filter(app => app.status !== 'Rejected' && app.status !== 'Accepted').length,
            interviews: applications.filter(app => app.status === 'Interview Scheduled').length,
            offers: applications.filter(app => app.status === 'Offer Extended').length
        };
    }, [applications]);

    const filteredApplications = useMemo(() => {
        return applications
            .filter(app => {
                const title = app.job_id?.title?.toLowerCase() || '';
                const company = app.job_id?.company_name?.toLowerCase() || '';
                const query = searchQuery.toLowerCase();
                const matchesSearch = title.includes(query) || company.includes(query);
                const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
                return matchesSearch && matchesStatus;
            })
            .sort((a, b) => {
                const dateA = new Date(a.createdAt);
                const dateB = new Date(b.createdAt);
                return sortBy === 'Newest' ? dateB - dateA : dateA - dateB;
            });
    }, [applications, searchQuery, statusFilter, sortBy]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFEFE] flex flex-col">
                <DashboardNavbar />
                <div className="flex-1 flex flex-col items-center justify-center p-10">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Synchronizing Applications...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFEFE] font-sans selection:bg-blue-100 selection:text-blue-900 flex flex-col">
            <DashboardNavbar />

            <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 md:py-16">
                <div className="mb-12">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Your Job Applications</h1>
                    <p className="text-slate-500 font-medium tracking-tight">Track and manage all your job applications in one place</p>
                </div>

                <ApplicationSummary stats={stats} />

                <ApplicationFilters
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    count={filteredApplications.length}
                />

                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
                    {filteredApplications.length > 0 ? (
                        filteredApplications.map((app) => (
                            <ApplicationCard key={app._id} application={app} />
                        ))
                    ) : (
                        <div className="bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-3xl p-16 md:p-24 text-center">
                            <div className="w-20 h-20 bg-white border border-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm">
                                <span className="text-4xl">📋</span>
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">No applications matches your search</h3>
                            <p className="text-slate-500 font-medium max-w-xs mx-auto mb-10 leading-relaxed">We couldn't find any applications that match your current filters. Try adjusting your search criteria.</p>
                            <button
                                onClick={() => { setSearchQuery(''); setStatusFilter('All'); setSortBy('Newest'); }}
                                className="px-8 py-3 bg-blue-600 text-white text-xs font-black uppercase tracking-[0.15em] rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
                            >
                                Reset All Filters
                            </button>
                        </div>
                    )}
                </div>
            </main>

            <footer className="py-12 border-t border-slate-50 mt-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                        Naya Awasar © {new Date().getFullYear()} — Career Propulsion Protocol
                    </p>
                    <div className="flex gap-8">
                        <span className="text-[10px] font-black text-slate-400 hover:text-blue-600 cursor-pointer transition-colors uppercase tracking-[0.1em]">Help Center</span>
                        <span className="text-[10px] font-black text-slate-400 hover:text-blue-600 cursor-pointer transition-colors uppercase tracking-[0.1em]">Terms of Service</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default SeekerApplications;
