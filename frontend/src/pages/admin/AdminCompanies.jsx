import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardNavbar from '../../components/dashboard/DashboardNavbar';
import companyService from '../../services/companyService';
import {
    Building2,
    Search,
    ChevronRight,
    Users,
    Briefcase,
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    MoreVertical,
    Eye,
    ShieldAlert,
    ShieldCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || '';


const AdminCompanies = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const data = await companyService.adminListCompanies();
            setCompanies(data);
        } catch (error) {
            console.error("Error fetching companies:", error);
            toast.error("Cloud Access Error: Failed to fetch organization database.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const handleStatusChange = async (id, status) => {
        try {
            let comment = '';
            if (status === 'rejected' || status === 'suspended') {
                comment = prompt(`MANDATORY: Enter reason for ${status.toUpperCase()} status:`);
                if (!comment) {
                    toast.error("Action Cancelled: Feedback is required for this status change.");
                    return;
                }
            }

            await companyService.adminUpdateCompanyStatus(id, status, comment);
            toast.success(`Protocol executed: Company status updated to ${status}.`);
            fetchCompanies();
        } catch (error) {
            console.error(error);
            toast.error("System Error: Failed to execute status override.");
        }
    };

    const filteredCompanies = companies.filter(company =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.industry?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status) => {
        const configs = {
            approved: { color: 'bg-green-100 text-green-700', icon: CheckCircle2, text: 'Approved' },
            rejected: { color: 'bg-red-100 text-red-700', icon: XCircle, text: 'Rejected' },
            submitted: { color: 'bg-[#29a08e]/20 text-[#29a08e]', icon: Clock, text: 'Under Review' },
            draft: { color: 'bg-gray-100 text-gray-600', icon: Calendar, text: 'Draft' },
            suspended: { color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle, text: 'Suspended' }
        };

        const config = configs[status] || configs.submitted;
        const Icon = config.icon;

        return (
            <div className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${config.color}`}>
                <Icon className="w-3.5 h-3.5" />
                {config.text}
            </div>
        );
    };

    return (
        <div className="flex-1 w-full">
            <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Manage Companies</h1>
                    <p className="text-xs text-gray-500">Review and approve recruiter organizations.</p>
                </div>
            </header>

            <main className="flex-1 p-8">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
                    {/* Search and Filters */}
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search companies..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#29a08e] outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-500">
                                Total: <span className="text-gray-900 font-bold">{companies.length}</span>
                            </span>
                        </div>
                    </div>

                    {/* Companies Table */}
                    <div className="flex-1">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Owner</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Activity</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loading ? (
                                    [1, 2, 3, 4, 5].map(i => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan="5" className="px-6 py-4">
                                                <div className="h-10 bg-gray-50 rounded w-full"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    filteredCompanies.map((company) => (
                                        <tr key={company._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-200 overflow-hidden">
                                                        {company.logo ? (
                                                            <img 
                                                                src={company.logo.startsWith('http') ? company.logo : `${API_BASE}${company.logo}`} 
                                                                className="w-full h-full object-cover" 
                                                                alt="" 
                                                            />
                                                        ) : <Building2 className="w-5 h-5" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 truncate">{company.name}</p>
                                                        <p className="text-xs text-gray-500 truncate">{company.industry}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm">
                                                    <p className="font-medium text-gray-700">{company.recruiters?.[0]?.fullName || 'N/A'}</p>
                                                    <p className="text-gray-500 text-xs">{company.recruiters?.[0]?.email || ''}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(company.status)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                                                        {company.totalJobs || 0} Jobs
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(company.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link
                                                        to={`/admin/companies/${company._id}`}
                                                        className="p-1.5 text-gray-400 hover:text-[#29a08e] rounded-lg hover:bg-[#29a08e]/10 transition-colors"
                                                        title="View"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Link>

                                                    {company.status !== 'approved' && (
                                                        <button
                                                            onClick={() => handleStatusChange(company._id, 'approved')}
                                                            className="p-1.5 text-green-500 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                                                            title="Approve"
                                                        >
                                                            <ShieldCheck className="w-4 h-4" />
                                                        </button>
                                                    )}

                                                    {(company.status !== 'rejected' && company.status !== 'suspended') && (
                                                        <button
                                                            onClick={() => handleStatusChange(company._id, 'rejected')}
                                                            className="p-1.5 text-red-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                                            title="Reject"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                        <p className="text-xs text-gray-500">Showing {filteredCompanies.length} companies</p>
                        <div className="flex gap-2">
                            <button className="px-4 py-1.5 bg-white border border-gray-200 rounded text-xs font-semibold text-gray-400 cursor-not-allowed">Prev</button>
                            <button className="px-4 py-1.5 bg-white border border-gray-200 rounded text-xs font-semibold text-gray-400 cursor-not-allowed">Next</button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminCompanies;
