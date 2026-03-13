import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardNavbar from '../../components/dashboard/DashboardNavbar';
import companyService from '../../services/companyService';
import {
    Building2,
    MapPin,
    Globe,
    Users,
    Calendar,
    Mail,
    ShieldCheck,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ChevronLeft,
    Briefcase,
    Globe2,
    History,
    FileText,
    ExternalLink
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdminCompanyReview = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchCompanyData = async () => {
        try {
            setLoading(true);
            const data = await companyService.adminGetCompanyDetails(id);
            setCompany(data);
        } catch (error) {
            console.error(error);
            toast.error("Data Retrevial Error: Failed to fetch organization dossier.");
            navigate('/admin/companies');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanyData();
    }, [id]);

    const handleAction = async (status) => {
        try {
            let comment = '';
            if (status === 'rejected' || status === 'suspended') {
                comment = prompt(`MANDATORY: Enter reason for ${status.toUpperCase()} status:`);
                if (!comment) return;
            }

            await companyService.adminUpdateCompanyStatus(id, status, comment);
            toast.success(`Protocol updated to ${status.toUpperCase()}`);
            fetchCompanyData();
        } catch (error) {
            toast.error("Execution Failure: Protocol update rejected.");
        }
    };

    if (loading) return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <DashboardNavbar />
            <div className="flex-1 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#29a08e]/20 border-t-[#29a08e] rounded-full animate-spin"></div>
            </div>
        </div>
    );

    if (!company) return null;

    const isRecruiterApproved = company.recruiters?.some(r => r.kycStatus === 'approved');

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <DashboardNavbar />
            <div className="flex-1 w-full flex flex-col">
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0 sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/admin/companies')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <ChevronLeft className="w-5 h-5 text-gray-400" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{company.name}</h1>
                            <p className="text-xs text-gray-500">Review organization details</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {!isRecruiterApproved && (company.status === 'pending' || company.status === 'waiting_for_recruiter_approval') && (
                            <span className="text-xs text-orange-600 font-bold flex items-center gap-1 bg-orange-50 px-3 py-1.5 rounded-md mr-2">
                                <AlertCircle className="w-4 h-4" /> Company review locked until recruiter identity is approved.
                            </span>
                        )}
                        {company.status !== 'approved' && (
                            <button
                                onClick={() => handleAction('approved')}
                                disabled={!isRecruiterApproved}
                                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${
                                    isRecruiterApproved 
                                    ? 'bg-green-600 text-white hover:bg-green-700' 
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
                                }`}
                                title={!isRecruiterApproved ? "Approve the recruiter identity first" : ""}
                            >
                                <CheckCircle2 className="w-4 h-4" /> Approve
                            </button>
                        )}
                        {company.status !== 'rejected' && (
                            <button
                                onClick={() => handleAction('rejected')}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors flex items-center gap-2"
                            >
                                <XCircle className="w-4 h-4" /> Reject
                            </button>
                        )}
                        {company.status === 'approved' && (
                            <button
                                onClick={() => handleAction('suspended')}
                                className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-bold hover:bg-yellow-700 transition-colors flex items-center gap-2"
                            >
                                <AlertCircle className="w-4 h-4" /> Suspend
                            </button>
                        )}
                    </div>
                </header>

                <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-8">
                    {/* Status Overview Card */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${company.status === 'approved' ? 'bg-green-100 text-green-700' :
                                company.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                    company.status === 'suspended' ? 'bg-yellow-100 text-yellow-700' : 'bg-[#29a08e]/20 text-[#29a08e]'
                                }`}>
                                {company.status === 'approved' ? <ShieldCheck className="w-8 h-8" /> :
                                    company.status === 'rejected' ? <XCircle className="w-8 h-8" /> :
                                        company.status === 'suspended' ? <AlertCircle className="w-8 h-8" /> : <Clock className="w-8 h-8" />}
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Current Status</p>
                                <p className={`text-2xl font-bold capitalize ${company.status === 'approved' ? 'text-green-700' :
                                    company.status === 'rejected' ? 'text-red-700' :
                                        company.status === 'suspended' ? 'text-yellow-700' : 'text-[#29a08e]'
                                    }`}>{company.status}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Active Job Listings</p>
                            <p className="text-3xl font-bold text-gray-900">{company.stats?.totalJobs || 0}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            {/* Profile Details */}
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-[#29a08e]" />
                                    Company Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-400 font-medium">Industry</p>
                                        <p className="text-sm font-semibold text-gray-900">{company.industry}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-400 font-medium">Website</p>
                                        <a href={company.website} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#29a08e] hover:underline flex items-center gap-1">
                                            {company.website} <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-400 font-medium">Company Size</p>
                                        <p className="text-sm font-semibold text-gray-900">{company.size} Employees</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-400 font-medium">Headquarters</p>
                                        <p className="text-sm font-semibold text-gray-900">{company.headquarters}</p>
                                    </div>
                                </div>
                                <div className="mt-8 pt-8 border-t border-gray-100">
                                    <p className="text-xs text-gray-400 font-medium mb-3">About / Mission</p>
                                    <p className="text-sm text-gray-600 leading-relaxed italic">
                                        {company.about?.mission || 'No mission statement provided.'}
                                    </p>
                                </div>
                            </div>

                            {/* Activity History */}
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                                    <History className="w-4 h-4 text-[#29a08e]" />
                                    Review History
                                </h3>
                                <div className="space-y-4">
                                    {company.adminFields?.reviewHistory?.slice().reverse().map((log, i) => (
                                        <div key={i} className="flex gap-4 p-4 bg-gray-50 border border-gray-100 rounded-lg">
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-bold text-gray-900 uppercase">{log.action}</span>
                                                    <span className="text-[10px] text-gray-500">{new Date(log.date).toLocaleString()}</span>
                                                </div>
                                                <p className="text-sm text-gray-600 italic">"{log.comment}"</p>
                                                <p className="text-[10px] text-gray-400 mt-2">Admin: {log.adminId?.fullName || log.adminId || 'System'}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!company.adminFields?.reviewHistory || company.adminFields.reviewHistory.length === 0) && (
                                        <p className="text-center py-6 text-xs text-gray-400">No review logs available.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            {/* Ownership & Contact */}
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6 border-b border-gray-100 pb-2">Ownership</h3>
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-xs text-gray-400 font-medium mb-3">Recruiter</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-[#29a08e] text-white flex items-center justify-center font-bold">
                                                {company.recruiters?.[0]?.fullName?.charAt(0) || 'R'}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-gray-900 truncate">{company.recruiters?.[0]?.fullName}</p>
                                                <p className="text-xs text-gray-500 truncate">{company.recruiters?.[0]?.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-medium mb-1">Contact Email</p>
                                        <p className="text-sm font-semibold text-gray-900">{company.contact?.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-medium mb-1">Office Address</p>
                                        <p className="text-xs font-medium text-gray-600">{company.contact?.address}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Placeholder Documents Section */}
                            <div className="bg-gray-900 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                                <FileText className="absolute -top-4 -right-4 w-24 h-24 text-white/5" />
                                <h3 className="text-xs font-bold text-[#29a08e]/80 uppercase tracking-wider mb-6 relative z-10">Verification</h3>
                                <div className="space-y-4 relative z-10">
                                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Legal Documents</p>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-xs text-gray-300 hover:text-white transition-colors cursor-pointer">
                                                <ExternalLink className="w-3 h-3" /> Business_License.pdf
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-300 hover:text-white transition-colors cursor-pointer">
                                                <ExternalLink className="w-3 h-3" /> Tax_Clearance.pdf
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-4 py-2 bg-[#29a08e]/20 border border-[#29a08e]/20 rounded-lg flex flex-col items-start">
                                        <p className="text-[10px] font-bold text-[#29a08e]/80 uppercase">Recruiter Status</p>
                                        <div className={`mt-1 text-xs font-bold uppercase rounded-md px-2 py-0.5 ${
                                            isRecruiterApproved ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'
                                        }`}>
                                            {isRecruiterApproved ? 'Identity Verified' : 'Identity Pending'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminCompanyReview;
