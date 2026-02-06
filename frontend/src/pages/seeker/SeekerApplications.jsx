import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import ApplicationATSCard from '../../components/applications/ApplicationATSCard';
import api from '../../services/api';
import {
    Search, Filter, ArrowUpRight, FileText,
    Briefcase, Calendar, CheckCircle, XCircle,
    Clock, Loader, ChevronDown
} from 'lucide-react';

const SeekerApplications = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [sortOrder, setSortOrder] = useState('newest');

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
                'In Review': ['in_review'],
                'Interview': ['interview'],
                'Offer': ['offered'],
                'Hired': ['hired'],
                'Rejected': ['rejected', 'withdrawn']
            };

            const matchesStatus = statusFilter === 'All' || (filterMap[statusFilter] && filterMap[statusFilter].includes(normalizedStatus));

            return matchesSearch && matchesStatus;
        }).sort((a, b) => {
            const dateA = new Date(a.applied_at || a.createdAt);
            const dateB = new Date(b.applied_at || b.createdAt);
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });
    }, [applications, searchQuery, statusFilter, sortOrder]);

    const StatCard = ({ title, count, icon: Icon, colorClass, borderClass }) => (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
            <div>
                <p className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-2">{title}</p>
                <h3 className="text-3xl font-black text-gray-900">{count}</h3>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass} group-hover:scale-110 transition-transform`}>
                <Icon size={24} strokeWidth={2.5} />
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#2D9B82] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Loading Applications...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Your Job Applications</h1>
                        <p className="text-gray-500 font-medium">Track and manage all your job applications in one place</p>
                    </div>
                    <Link to="/seeker/jobs" className="inline-flex items-center gap-2 px-6 py-3 bg-[#2D9B82] text-white rounded-xl font-bold text-sm hover:bg-[#25836d] transition-all shadow-lg shadow-[#2D9B82]/20 transform active:scale-95">
                        <Search size={16} strokeWidth={2.5} /> Find More Jobs
                    </Link>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                    <StatCard
                        title="Total Applications"
                        count={stats.total}
                        icon={FileText}
                        colorClass="bg-blue-50 text-blue-600"
                    />
                    <StatCard
                        title="Active Applications"
                        count={stats.active}
                        icon={Clock}
                        colorClass="bg-amber-50 text-amber-600"
                    />
                    <StatCard
                        title="Interviews"
                        count={stats.interviews}
                        icon={Briefcase}
                        colorClass="bg-purple-50 text-purple-600"
                    />
                    <StatCard
                        title="Offers Received"
                        count={stats.offers}
                        icon={CheckCircle}
                        colorClass="bg-emerald-50 text-emerald-600"
                    />
                </div>

                {/* Filters & Search */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-8">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-96 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2D9B82] transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search job title, company..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-gray-200 transition-all font-bold text-sm text-gray-700"
                            />
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                            <div className="flex bg-gray-50 p-1 rounded-xl">
                                {['All', 'Applied', 'In Review', 'Interview', 'Offer', 'Hired', 'Rejected'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setStatusFilter(tab)}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${statusFilter === tab ? 'bg-white text-[#2D9B82] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        {tab}
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
                        filteredApplications.map(app => (
                            <ApplicationATSCard key={app.id || app._id} application={app} />
                        ))
                    ) : (
                        <div className="bg-white rounded-[24px] border border-gray-200 p-16 text-center shadow-sm">
                            <div className="w-20 h-20 bg-gray-50 rounded-[28px] flex items-center justify-center mx-auto mb-6 text-gray-300">
                                <FileText size={40} />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2">No Applications Found</h3>
                            <p className="text-gray-500 font-medium max-w-sm mx-auto mb-8 text-sm">We couldn't find any applications matching your criteria. Try adjusting your filters or search terms.</p>
                            <button onClick={() => { setStatusFilter('All'); setSearchQuery(''); }} className="text-[#2D9B82] font-black text-xs uppercase tracking-widest hover:underline">Clear Filters</button>
                        </div>
                    )}
                </div>
            </main>
        </>
    );
};

export default SeekerApplications;
