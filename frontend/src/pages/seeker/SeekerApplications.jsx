import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ApplicationATSCard from '../../components/applications/ApplicationATSCard';
import api from '../../services/api';
import {
    Search, Filter, ArrowUpRight, FileText,
    Briefcase, Calendar, CheckCircle, XCircle,
    Clock, Loader, ChevronDown, TrendingUp,
    BarChart3, Zap, Target, ArrowRight
} from 'lucide-react';

const SeekerApplications = () => {
    const [searchParams] = useSearchParams();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [sortOrder, setSortOrder] = useState('newest');

    useEffect(() => {
        const filterParam = searchParams.get('filter');
        if (filterParam === 'interview') {
            setStatusFilter('Interview');
        }
    }, [searchParams]);

    useEffect(() => {
        const fetchApps = async () => {
            try {
                setLoading(true);
                const res = await api.get('/applications/my');
                setApplications(res.data);
            } catch (error) {
                console.error("Failed to fetch applications", error);
            } finally {
                setLoading(false);
            }
        };
        fetchApps();
    }, []);

    const stats = useMemo(() => {
        const total = applications.length;
        const active = applications.filter(app => !['rejected', 'withdrawn', 'hired'].includes(app.status)).length;
        const interviews = applications.filter(app => app.status === 'interview').length;
        const offers = applications.filter(app => app.status === 'offered').length;
        return { total, active, interviews, offers };
    }, [applications]);

    const filteredApplications = useMemo(() => {
        return applications.filter(app => {
            const jobTitle = app.job_id?.title || app.job_title || app.title || '';
            const companyName = app.job_id?.company_name || app.company_name || '';
            const matchesSearch = jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                companyName.toLowerCase().includes(searchQuery.toLowerCase());

            const normalizedStatus = (app.status || '').toLowerCase();
            const filterMap = {
                'Applied': ['applied'],
                'In Review': ['in_review', 'in-review'],
                'Interview': ['interview'],
                'Offer': ['offered'],
                'Hired': ['hired'],
                'Rejected': ['rejected', 'withdrawn']
            };

            const matchesStatus = statusFilter === 'All' || (filterMap[statusFilter] && filterMap[statusFilter].includes(normalizedStatus));

            return matchesSearch && matchesStatus;
        }).sort((a, b) => {
            const dateA = new Date(a.appliedAt || a.createdAt || a.updatedAt);
            const dateB = new Date(b.appliedAt || b.createdAt || b.updatedAt);
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });
    }, [applications, searchQuery, statusFilter, sortOrder]);

    const statCards = [
        { title: 'Total Applications', count: stats.total, icon: FileText, gradient: 'from-[#29a08e]/10 to-teal-50', iconColor: 'text-[#29a08e]', bgIcon: 'bg-[#29a08e]/10' },
        { title: 'Active', count: stats.active, icon: Clock, gradient: 'from-amber-50 to-orange-50', iconColor: 'text-amber-600', bgIcon: 'bg-amber-50' },
        { title: 'Interviews', count: stats.interviews, icon: Briefcase, gradient: 'from-purple-50 to-fuchsia-50', iconColor: 'text-purple-600', bgIcon: 'bg-purple-50' },
        { title: 'Offers Received', count: stats.offers, icon: CheckCircle, gradient: 'from-emerald-50 to-green-50', iconColor: 'text-emerald-600', bgIcon: 'bg-emerald-50' }
    ];

    const statusTabs = ['All', 'Applied', 'In Review', 'Interview', 'Offer', 'Hired', 'Rejected'];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-14 h-14 border-4 border-[#29a08e]/20 rounded-full"></div>
                        <div className="w-14 h-14 border-4 border-[#29a08e] border-t-transparent rounded-full animate-spin absolute inset-0"></div>
                    </div>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Loading Applications...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Page Hero Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1a2744] to-[#0d2137] text-white pt-10 pb-24 px-4 sm:px-6 lg:px-8">
                {/* Decorative elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-24 -right-24 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#29a08e]/8 rounded-full blur-3xl"></div>
                    <div className="absolute inset-0 opacity-[0.03]" style={{
                        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                        backgroundSize: '40px 40px'
                    }}></div>
                </div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-semibold text-gray-300 border border-white/10">
                                    <BarChart3 size={12} className="text-[#5eead4]" />
                                    Application Tracker
                                </span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
                                Your <span className="bg-gradient-to-r from-[#5eead4] to-[#29a08e] bg-clip-text text-transparent">Applications</span>
                            </h1>
                            <p className="text-gray-400 font-medium max-w-lg">Track and manage all your job applications in one place. Stay on top of every opportunity.</p>
                        </div>
                        <Link to="/seeker/jobs" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#29a08e] to-[#22877a] text-white rounded-xl font-bold text-sm hover:from-[#228377] hover:to-[#1a6b62] transition-all shadow-lg shadow-[#29a08e]/20 active:scale-95 shrink-0">
                            <Search size={16} strokeWidth={2.5} /> Find More Jobs
                        </Link>
                    </div>
                </div>
            </div>

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 -mt-14 relative z-10 pb-12">
                {/* Stats Summary */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {statCards.map((card, i) => (
                        <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-lg hover:border-[#29a08e]/20 transition-all">
                            <div>
                                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-wider mb-2">{card.title}</p>
                                <h3 className="text-3xl font-extrabold text-gray-900">{card.count}</h3>
                            </div>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.bgIcon} ${card.iconColor} group-hover:scale-110 transition-transform shadow-sm`}>
                                <card.icon size={22} strokeWidth={2.5} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters & Search */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-8">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-96 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#29a08e] transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search job title, company..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-gray-200 focus:shadow-sm transition-all font-bold text-sm text-gray-700"
                            />
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                            <div className="flex bg-gray-50 p-1 rounded-xl">
                                {statusTabs.map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setStatusFilter(tab)}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${statusFilter === tab
                                            ? 'bg-white text-[#29a08e] shadow-sm border border-gray-100'
                                            : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        {tab}
                                        {tab === 'All' && stats.total > 0 && (
                                            <span className="ml-1.5 text-[10px] text-gray-400">{stats.total}</span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="relative shrink-0">
                                <select
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value)}
                                    className="appearance-none pl-4 pr-10 py-2.5 bg-gray-50 border border-transparent rounded-xl outline-none font-bold text-xs text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors"
                                >
                                    <option value="newest">Most Recent</option>
                                    <option value="oldest">Oldest First</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Applications List */}
                <div className="space-y-4">
                    {filteredApplications.length > 0 ? (
                        <>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1 mb-2">
                                Showing {filteredApplications.length} application{filteredApplications.length !== 1 ? 's' : ''}
                            </p>
                            {filteredApplications.map(app => (
                                <ApplicationATSCard key={app.id || app._id} application={app} />
                            ))}
                        </>
                    ) : (
                        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
                            <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-gray-300">
                                <FileText size={36} />
                            </div>
                            <h3 className="text-xl font-extrabold text-gray-900 mb-2">
                                {applications.length === 0 ? 'No Applications Yet' : 'No Applications Found'}
                            </h3>
                            <p className="text-gray-500 font-medium max-w-sm mx-auto mb-8 text-sm">
                                {applications.length === 0
                                    ? 'You haven\'t applied to any jobs yet. Start exploring opportunities and submit your first application.'
                                    : statusFilter !== 'All'
                                        ? `No applications with status "${statusFilter}". Try a different filter or browse more jobs.`
                                        : 'We couldn\'t find any applications matching your criteria. Try adjusting your filters or search terms.'}
                            </p>
                            <div className="flex items-center justify-center gap-4 flex-wrap">
                                {applications.length > 0 && (
                                    <button onClick={() => { setStatusFilter('All'); setSearchQuery(''); }} className="px-5 py-2.5 border border-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all">
                                        Clear Filters
                                    </button>
                                )}
                                <Link to="/seeker/jobs" className="px-5 py-2.5 bg-[#29a08e] text-white text-xs font-bold rounded-xl hover:bg-[#228377] transition-all shadow-lg shadow-[#29a08e]/20 flex items-center gap-2">
                                    Browse Jobs <ArrowRight size={14} />
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </>
    );
};

export default SeekerApplications;
