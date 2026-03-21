import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import companyService from '../../services/companyService';
import CompanyLogo from '../../components/common/CompanyLogo';
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
    ShieldCheck,
    RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';

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

            const res = await companyService.adminUpdateCompanyStatus(id, status, comment);
            toast.success(res.message || `Protocol executed: Company status updated to ${status}.`);
            fetchCompanies();
        } catch (error) {
            console.error('Status Change Error:', error.response?.data || error);
            const errorMessage = error.response?.data?.message || "System Error: Failed to execute status override.";
            toast.error(errorMessage);
        }
    };

    const filteredCompanies = companies.filter(company =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.industry?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const statusCounts = {
        approved: companies.filter(c => c.status === 'approved').length,
        submitted: companies.filter(c => c.status === 'submitted').length,
        rejected: companies.filter(c => c.status === 'rejected').length,
        suspended: companies.filter(c => c.status === 'suspended').length,
    };

    const getStatusBadge = (status) => {
        const configs = {
            approved: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
            rejected: { color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
            submitted: { color: 'bg-[#29a08e]/10 text-[#29a08e] border-[#29a08e]/20', icon: Clock },
            draft: { color: 'bg-gray-50 text-gray-600 border-gray-200', icon: Calendar },
            suspended: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertCircle }
        };

        const config = configs[status] || configs.submitted;
        const Icon = config.icon;

        return (
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${config.color}`}>
                <Icon className="w-3.5 h-3.5" />
                {status === 'submitted' ? 'Under Review' : status === 'draft' ? 'Draft' : status}
            </div>
        );
    };

    return (
        <div className="flex-1 w-full min-h-[calc(100vh-64px)]">
            {/* Hero Header */}
            <div className="relative bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] overflow-hidden">
                <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-10 w-10 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30">
                                    <Building2 className="h-5 w-5 text-indigo-400" />
                                </div>
                                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Organization Management</span>
                            </div>
                            <h1 className="text-3xl font-black text-white tracking-tight">Manage Companies</h1>
                            <p className="text-gray-400 mt-1.5 font-medium text-sm">Review and approve recruiter organizations.</p>
                        </div>

                        {/* Status Summary Pills */}
                        <div className="flex items-center gap-2 flex-wrap">
                            {[
                                { label: 'Approved', count: statusCounts.approved, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
                                { label: 'Review', count: statusCounts.submitted, color: 'bg-[#29a08e]/20 text-[#5eead4] border-[#29a08e]/30' },
                                { label: 'Rejected', count: statusCounts.rejected, color: 'bg-red-500/20 text-red-300 border-red-500/30' },
                                { label: 'Suspended', count: statusCounts.suspended, color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
                            ].map((pill, i) => (
                                <div key={i} className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold ${pill.color}`}>
                                    {pill.count} {pill.label}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 pb-12 relative z-10">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
                    {/* Search and Filters */}
                    <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search companies by name or industry..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#29a08e]/30 focus:border-[#29a08e] outline-none transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-400">
                                <span className="text-gray-900 font-bold">{filteredCompanies.length}</span> companies
                            </span>
                            <button onClick={() => fetchCompanies()} className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl text-xs font-bold transition-all hover:shadow-sm">
                                <RefreshCw className="h-3.5 w-3.5" />
                                Refresh
                            </button>
                        </div>
                    </div>

                    {/* Companies Table */}
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/80 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em]">Company</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em]">Owner</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em]">Status</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em]">Activity</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    [1, 2, 3, 4, 5].map(i => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan="5" className="px-6 py-5">
                                                <div className="h-10 bg-gray-50 rounded-xl w-full"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : filteredCompanies.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 border border-gray-100">
                                                    <Building2 className="w-7 h-7 text-gray-300" />
                                                </div>
                                                <p className="text-sm font-semibold text-gray-500">No companies found</p>
                                                <p className="text-xs text-gray-400 mt-1">Try adjusting your search criteria.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCompanies.map((company) => (
                                        <tr key={company._id} className="hover:bg-[#29a08e]/[0.02] transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <CompanyLogo job={company} companyName={company.name} className="w-10 h-10 rounded-xl" imgClassName="w-full h-full object-cover" fallbackClassName="text-sm" />
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-[#29a08e] transition-colors">{company.name}</p>
                                                        <p className="text-xs text-gray-400 truncate">{company.industry}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm">
                                                    <p className="font-medium text-gray-700">{company.recruiters?.[0]?.fullName || 'N/A'}</p>
                                                    <p className="text-gray-400 text-xs">{company.recruiters?.[0]?.email || ''}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(company.status)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2.5 py-1 bg-gray-50 text-gray-700 rounded-lg text-xs font-bold border border-gray-100">
                                                        {company.totalJobs || 0} Jobs
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        {new Date(company.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Link
                                                        to={`/admin/companies/${company._id}`}
                                                        className="p-2 text-gray-400 hover:text-[#29a08e] rounded-xl hover:bg-[#29a08e]/10 transition-all border border-transparent hover:border-[#29a08e]/20"
                                                        title="View"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Link>

                                                    {company.status !== 'approved' && (
                                                        <button
                                                            onClick={() => handleStatusChange(company._id, 'approved')}
                                                            className="p-2 text-emerald-500 hover:text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all border border-transparent hover:border-emerald-100"
                                                            title="Approve"
                                                        >
                                                            <ShieldCheck className="w-4 h-4" />
                                                        </button>
                                                    )}

                                                    {(company.status !== 'rejected' && company.status !== 'suspended') && (
                                                        <button
                                                            onClick={() => handleStatusChange(company._id, 'rejected')}
                                                            className="p-2 text-red-500 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
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
                    <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-xs text-gray-400 font-medium">Showing {filteredCompanies.length} companies</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminCompanies;
