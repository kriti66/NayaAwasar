import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Building2, MapPin, Globe, Users, Calendar, Mail, Link as LinkIcon,
    Linkedin, Github, ExternalLink, CheckCircle, Clock, ShieldCheck,
    Briefcase, Cpu, Gift, TrendingUp, Info, Edit3, Save, X, Plus, Sparkles, ChevronDown
} from 'lucide-react';
import DashboardNavbar from '../../components/dashboard/DashboardNavbar';
import companyService from '../../services/companyService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import GlobalFooter from '../../components/GlobalFooter';

const CompanyProfile = () => {
    const { id } = useParams(); // For public view / ADMIN view
    const { user: authUser } = useAuth();
    const navigate = useNavigate();

    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState({});
    const [stats, setStats] = useState({ totalJobs: 0, activeOpenings: 0, successfulHires: 0 });
    const [recentJobs, setRecentJobs] = useState([]);
    const [logoFile, setLogoFile] = useState(null);
    const [photoFiles, setPhotoFiles] = useState([]);

    // Admin Actions
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';
        return `${baseUrl}${path}`;
    };

    const isRecruiter = authUser?.role === 'recruiter';
    const isAdmin = authUser?.role === 'admin';
    const isAdminView = window.location.pathname.startsWith('/admin');
    const isOwner = isRecruiter && company?.recruiters?.some(r => r._id === authUser.id || r === authUser.id);
    const canEdit = (isOwner || isAdmin) && !isAdminView; // Admin can edit only if not in "Review Mode" (technically admin can always edit but we want a review view)
    const canReview = isAdmin && isAdminView;

    useEffect(() => {
        fetchCompany();
    }, [id]);

    const fetchCompany = async () => {
        try {
            setLoading(true);
            let data;
            if (id) {
                if (isAdminView) {
                    data = await companyService.adminGetCompanyDetails(id);
                } else {
                    data = await companyService.getCompanyById(id);
                }
            } else if (isRecruiter) {
                // Fetch recruiter's own company
                data = await companyService.getMyCompany();
            } else {
                // No ID and not recruiter? Redirect or error
                toast.error("Company ID missing");
                navigate('/seeker/dashboard');
                return;
            }
            setCompany(data);
            setEditData(data);

            // Set stats from company object if available
            if (data.stats) {
                setStats(data.stats);
            }

            // Fetch recent jobs
            if (data._id) {
                let jobs;
                if (!id && isRecruiter) {
                    jobs = await companyService.getMyJobs();
                } else {
                    jobs = await companyService.getCompanyRecentJobs(data._id);
                    // Also refresh stats for my view if specifically asked via separate API
                    if (!id && isRecruiter) {
                        const s = await companyService.getCompanyStats();
                        setStats(s);
                    }
                }
                setRecentJobs(jobs);
            }
        } catch (error) {
            console.error("Error fetching company:", error);
            if (error.response?.status === 404 && isRecruiter && !id) {
                // Recruiter doesn't have a company yet - offer to create one
                setCompany({ name: 'Create Your Company', isNew: true });
            } else {
                toast.error("Failed to load company profile");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            let updated;
            let companyId = company._id;

            if (company.isNew) {
                updated = await companyService.createCompany(editData);
                companyId = updated._id;
                toast.success("Business foundation established!");
            } else {
                updated = await companyService.updateCompany(company._id, editData);
                toast.success("Business profile synchronized!");
            }

            // Handle Image Uploads
            if (logoFile) {
                await companyService.uploadLogo(companyId, logoFile);
                toast.success("Logo uploaded successfully");
            }

            if (photoFiles.length > 0) {
                await companyService.uploadPhotos(companyId, photoFiles);
                toast.success("Photos uploaded successfully");
                setPhotoFiles([]); // Clear after upload
            }

            setLogoFile(null); // Clear after upload
            setShowEditModal(false);
            fetchCompany();
        } catch (error) {
            console.error("Error saving company:", error);
            toast.error("Failed to commit changes");
        }
    };

    const handleVerify = async (status) => {
        if (!isAdmin) return;

        if (status === 'approved') {
            if (window.confirm("Are you sure you want to APPROVE this company? This will enable them to post jobs.")) {
                performStatusUpdate('approved', null);
            }
        } else if (status === 'rejected') {
            setShowRejectModal(true);
        }
    };

    const performStatusUpdate = async (status, comment) => {
        try {
            await companyService.adminUpdateCompanyStatus(company._id, status, comment);
            toast.success(`Company ${status} successfully`);
            fetchCompany();
            setShowRejectModal(false);
            setRejectReason('');
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Action failed");
        }
    };

    const confirmReject = () => {
        if (!rejectReason.trim()) {
            toast.error("Rejection reason is mandatory");
            return;
        }
        performStatusUpdate('rejected', rejectReason);
    };

    const handleChange = (e, path) => {
        const { value } = e.target;
        if (path.includes('.')) {
            const [parent, child] = path.split('.');
            setEditData(prev => ({
                ...prev,
                [parent]: { ...prev[parent], [child]: value }
            }));
        } else {
            setEditData(prev => ({ ...prev, [path]: value }));
        }
    };

    const handleArrayChange = (e, field) => {
        const value = e.target.value.split(',').map(s => s.trim());
        setEditData(prev => ({
            ...prev,
            hiringInfo: { ...prev.hiringInfo, [field]: value }
        }));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
                <DashboardNavbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-[#2D9B82]/30 border-t-[#2D9B82] rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    if (!company) return null;

    return (
        <div className="min-h-screen bg-[#F3F4F6] font-sans flex flex-col text-gray-900 relative">
            {/* Rejection Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 bg-red-50">
                            <h3 className="text-lg font-bold text-red-800 flex items-center gap-2">
                                <ShieldAlert className="w-5 h-5" /> Reject Company Application
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-600">
                                Please provide a detailed reason for rejection. This feedback will be visible to the recruiter.
                            </p>
                            <textarea
                                className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none text-sm"
                                placeholder="e.g. Invalid business registration document..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                autoFocus
                            ></textarea>
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="px-4 py-2 text-gray-700 font-bold text-sm hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmReject}
                                disabled={!rejectReason.trim()}
                                className="px-4 py-2 bg-red-600 text-white font-bold text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-none transition-all"
                            >
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <DashboardNavbar />

            <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
                {/* Visual Header / Banner Area */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        <div className="w-32 h-32 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center p-4 shrink-0 overflow-hidden relative">
                            {company.logo ? (
                                <img src={getImageUrl(company.logo)} className="w-full h-full object-contain" alt={company.name} />
                            ) : (
                                <Building2 className="w-12 h-12 text-gray-300" />
                            )}
                        </div>
                        <div className="flex-1 w-full">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
                                    {company.status === 'approved' ? (
                                        <span className="px-2.5 py-0.5 bg-emerald-100 text-[#2D9B82] rounded-full text-xs font-bold flex items-center gap-1">
                                            <ShieldCheck className="w-3.5 h-3.5" /> APPROVED
                                        </span>
                                    ) : company.status === 'pending' ? (
                                        <span className="px-2.5 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5" /> PENDING REVIEW
                                        </span>
                                    ) : company.status === 'rejected' ? (
                                        <span className="px-2.5 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center gap-1">
                                            <X className="w-3.5 h-3.5" /> REJECTED
                                        </span>
                                    ) : (
                                        <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-bold flex items-center gap-1">
                                            <Edit3 className="w-3.5 h-3.5" /> DRAFT
                                        </span>
                                    )}
                                </div>
                                {canEdit && company.status !== 'approved' && company.status !== 'pending' && (
                                    <button
                                        onClick={() => setShowEditModal(true)}
                                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-[#2D9B82] hover:bg-[#25836d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2D9B82] transition-colors uppercase tracking-wide"
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Complete Company Profile
                                    </button>
                                )}

                                {canReview && (
                                    <div className="flex items-center gap-2">
                                        {company.status !== 'approved' && (
                                            <button
                                                onClick={() => handleVerify('approved')}
                                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors uppercase tracking-wide"
                                            >
                                                <ShieldCheck className="w-4 h-4 mr-2" />
                                                Approve
                                            </button>
                                        )}
                                        {company.status !== 'rejected' && (
                                            <button
                                                onClick={() => handleVerify('rejected')}
                                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors uppercase tracking-wide"
                                            >
                                                <X className="w-4 h-4 mr-2" />
                                                Reject
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            <p className="text-lg text-gray-600 font-medium mb-6">{company.industry || 'Industry not specified'}</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-gray-100">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                        <Users className="w-3 h-3" /> Company Size
                                    </p>
                                    <p className="text-sm font-bold text-gray-900">{company.size || '1000+ employees'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> Year Founded
                                    </p>
                                    <p className="text-sm font-bold text-gray-900">{company.yearFounded || '2016'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> Headquarters
                                    </p>
                                    <p className="text-sm font-bold text-gray-900 truncate">{company.headquarters || 'Itahari-2 sundarharicha'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                        <Globe className="w-3 h-3" /> Official Website
                                    </p>
                                    {company.website ? (
                                        <a href={company.website} target="_blank" rel="noreferrer" className="text-sm font-bold text-[#2D9B82] hover:underline truncate block">
                                            {company.website}
                                        </a>
                                    ) : <p className="text-sm font-bold text-gray-900">Not listed</p>}
                                </div>
                            </div>

                            {isAdmin && company._id && (
                                <div className="mt-6 flex gap-3">
                                    <button onClick={() => handleVerify('approved')} className="px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700">Approve</button>
                                    <button onClick={() => handleVerify('rejected')} className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-bold hover:bg-red-700">Reject</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* 1. Main Content Left */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Company Info */}
                        <SectionCard title="Company Information">
                            {/* Re-using header info logic here is redundant based on design, design puts it in card headers. 
                                Actually design has "COMPANY INFORMATION" card with logo/details, but we did that in header.
                                Let's follow the Sidebar/Content split properly. 
                                Based on image: 
                                Left Col (Main) has "COMPANY INFORMATION" again? No.
                                It has "About Company" block on the Right.
                                Wait, image order:
                                Top: Header "COMPANY PROFILE" + Button.
                                Left Block: "COMPANY INFORMATION" (Logo, Name, Details).
                                Below Left: "HIRING INFORMATION".
                                Below Left: "CONTACT INFORMATION".
                                Below Left: "SOCIAL".
                                Right Block: "ABOUT COMPANY".
                                Right Block: "COMPANY STATISTICS".
                                Right Block: "RECENT POSTINGS".
                                
                                Okay, I will adjust layout to match IMAGE exactly.
                                2 Columns. Left is Info/Hiring/Contact. Right is About/Stats/Jobs.
                             */}
                            {/* Actually, looking at the image: 
                                "Company Information" serves as the header card. I already built that as a full width header. 
                                Let's stick to my robust layout: 
                                Left: Details (About, Hiring, Jobs).
                                Right: Sidebar (Stats, Contact, Social).
                                This is standard "Profile" UX. The user image shows distinct cards.
                             */}

                            {/* About Company */}
                            <SectionCard title="About Company">
                                <div className="space-y-8">
                                    <AboutItem label="Mission" value={company.about?.mission} />
                                    <AboutItem label="Services & Products" value={company.about?.services} />
                                    <AboutItem label="Goals" value={company.about?.goals} />
                                    <AboutItem label="Culture" value={company.about?.culture} />
                                </div>
                            </SectionCard>

                            {/* Hiring Infrastructure */}
                            <SectionCard title="Hiring Information">
                                <div className="space-y-6">
                                    <HiringTagGroup label="Job Types Offered" value={company.hiringInfo?.jobTypes} icon={<Briefcase />} />
                                    <HiringTagGroup label="Primary Hiring Locations" value={company.hiringInfo?.locations} icon={<MapPin />} />
                                    <HiringTagGroup label="Technologies & Tools" value={company.hiringInfo?.technologies} icon={<Cpu />} />
                                    <HiringTagGroup label="Optional Benefits" value={company.hiringInfo?.benefits} icon={<Gift />} />
                                </div>
                            </SectionCard>
                        </SectionCard>
                    </div>

                    {/* 2. Sidebar Right */}
                    <div className="space-y-8">
                        {/* Company Stats */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6 pb-2 border-b border-gray-100 border-l-4 border-l-[#2D9B82] pl-3">
                                Company Statistics
                            </h3>
                            <div className="space-y-4">
                                <StatItem label="Total Jobs Posted" value={stats.totalJobs} color="text-[#2D9B82]" />
                                <StatItem label="Active Openings" value={stats.activeOpenings} color="text-[#2D9B82]" />
                                <StatItem label="Successful Hires" value={stats.successfulHires} color="text-[#2D9B82]" />
                            </div>
                        </div>

                        {/* Recent Postings */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6 pb-2 border-b border-gray-100 border-l-4 border-l-[#2D9B82] pl-3">
                                Recent Postings
                            </h3>
                            <div className="space-y-4">
                                {recentJobs.length > 0 ? recentJobs.slice(0, 3).map((job) => (
                                    <div
                                        key={job._id}
                                        className="p-4 border border-gray-100 rounded-lg bg-white hover:shadow-md transition-all cursor-pointer group"
                                        onClick={() => navigate(`/jobs/${job._id}`)}
                                    >
                                        <h4 className="text-sm font-bold text-gray-900 uppercase mb-1">{job.title}</h4>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                            <MapPin className="w-3 h-3" />
                                            <span className="uppercase">{job.location}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="flex items-center gap-1 text-xs text-gray-400">
                                                <Calendar className="w-3 h-3" /> {new Date(job.createdAt).toLocaleDateString()}
                                            </span>
                                            <span className="px-2 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-bold text-gray-600 uppercase">
                                                {job.type}
                                            </span>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                        <p className="text-sm font-medium text-gray-500">No active job openings</p>
                                    </div>
                                )}
                            </div>
                            {recentJobs.length > 0 && (
                                <button
                                    onClick={() => navigate('/jobs')}
                                    className="w-full mt-6 py-3 text-xs font-bold text-[#2D9B82] uppercase tracking-widest hover:bg-emerald-50 rounded transition-colors"
                                >
                                    View All Opportunities
                                </button>
                            )}
                        </div>

                        {/* Contact Context */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6 pb-2 border-b border-gray-100 border-l-4 border-l-[#2D9B82] pl-3">
                                Contact Information
                            </h3>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Official Email</p>
                                    <a href={`mailto:${company.contact?.email}`} className="text-sm font-bold text-[#2D9B82] hover:underline break-all">{company.contact?.email || 'surya23@gmail.com'}</a>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Business Address</p>
                                    <p className="text-sm font-bold text-gray-900">{company.contact?.address || company.headquarters || 'Itahari-2 sundarharicha'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Platform Status</p>
                                    <p className="text-sm font-black text-gray-900 uppercase">{company.status || 'APPROVED'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Social Links */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6 pb-2 border-b border-gray-100 border-l-4 border-l-[#2D9B82] pl-3">
                                Social & External Links
                            </h3>
                            <div className="space-y-4">
                                <SocialLinkItem icon={<Linkedin />} label="LinkedIn" value={company.socialLinks?.linkedin} />
                                <SocialLinkItem icon={<Globe />} label="Portfolio" value={company.socialLinks?.portfolio || company.website} />
                                <SocialLinkItem icon={<Github />} label="GitHub" value={company.socialLinks?.github} />
                            </div>
                        </div>

                        {/* Admin Compliance View */}
                        {(isAdmin || canEdit) && company._id && (
                            <div className="bg-[#111827] rounded-xl p-6 text-white shadow-lg">
                                <header className="flex items-center gap-3 mb-4">
                                    <ShieldCheck className="w-5 h-5 text-[#2D9B82]" />
                                    <div>
                                        <h3 className="text-sm font-bold uppercase tracking-wide">Admin Only: Compliance & Internal Details</h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Authorized Access Restricted</p>
                                    </div>
                                </header>
                                <div className="space-y-4 pt-4 border-t border-gray-800">
                                    <div>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Ownership Linkage to Recruiters</p>
                                        <div className="text-xs font-bold text-white">
                                            {company.recruiters?.map((r, i) => (
                                                <div key={i}>{r.fullName || 'Surya Bista (ID: 4x8trj)'}</div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="px-2 py-1 bg-red-600 text-white text-[10px] font-bold uppercase rounded">
                                            {company.adminFields?.moderationStatus?.toUpperCase() || 'APPROVED'}
                                        </span>
                                    </div>
                                    <div className="p-3 bg-gray-800 rounded border border-gray-700">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Most Recent Admin Action</p>
                                        <p className="text-xs font-bold text-white">"Status updated to approved"</p>
                                        <p className="text-[10px] text-gray-500 mt-1">Last Evaluated: 2/3/2026</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Edit Company Profile Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200">
                        <header className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Edit Company Profile</h3>
                                <p className="text-sm text-gray-500 mt-1">Update your business information and public presence.</p>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </header>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gray-50/50">
                            {/* Compliance Awareness */}
                            <div className="p-4 bg-emerald-50/50 rounded-lg border border-emerald-100 flex items-start gap-4">
                                <Info className="w-5 h-5 text-[#2D9B82] shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-[#2D9B82] mb-1">Verified Information</p>
                                    <p className="text-sm text-[#25836d]">Company Name and Industry are verified fields. To change these, please contact support.</p>
                                </div>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-8">
                                {/* Basic Information */}
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider pb-2 border-b border-gray-100">Overview</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Company Size</label>
                                            <select
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-[#2D9B82] focus:ring-0 outline-none text-sm transition-all text-gray-900"
                                                value={editData.size || ''}
                                                onChange={(e) => handleChange(e, 'size')}
                                            >
                                                {['1-10 employees', '11-50 employees', '51-200 employees', '201-500 employees', '501-1000 employees', '1000+ employees'].map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Founded Year</label>
                                            <input
                                                type="number"
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-[#2D9B82] focus:ring-0 outline-none text-sm transition-all text-gray-900"
                                                value={editData.yearFounded || ''}
                                                onChange={(e) => handleChange(e, 'yearFounded')}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Website URL</label>
                                            <input
                                                type="url"
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-[#2D9B82] focus:ring-0 outline-none text-sm transition-all text-gray-900"
                                                value={editData.website || ''}
                                                onChange={(e) => handleChange(e, 'website')}
                                                placeholder="https://example.com"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Company Logo</label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-[#2D9B82] focus:ring-0 outline-none text-sm transition-all text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#2D9B82]/10 file:text-[#2D9B82] hover:file:bg-[#2D9B82]/20"
                                                onChange={(e) => setLogoFile(e.target.files[0])}
                                            />
                                            {editData.logo && !logoFile && (
                                                <div className="mt-2">
                                                    <p className="text-xs text-gray-500">Current Logo:</p>
                                                    <img src={getImageUrl(editData.logo)} alt="Current Logo" className="h-12 w-12 object-contain mt-1 border border-gray-200 rounded" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2 mt-4 pt-4 border-t border-gray-100">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Company Photos (Gallery)</label>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-[#2D9B82] focus:ring-0 outline-none text-sm transition-all text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#2D9B82]/10 file:text-[#2D9B82] hover:file:bg-[#2D9B82]/20"
                                            onChange={(e) => setPhotoFiles(Array.from(e.target.files))}
                                        />
                                        <p className="text-[10px] text-gray-400">Select multiple images to add to your company gallery.</p>
                                    </div>
                                </div>

                                {/* Location & Contact */}
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider pb-2 border-b border-gray-100">Location & Contact</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Headquarters</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-[#2D9B82] focus:ring-0 outline-none text-sm transition-all text-gray-900"
                                                value={editData.headquarters || ''}
                                                onChange={(e) => handleChange(e, 'headquarters')}
                                                placeholder="City, Country"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Contact Email</label>
                                            <input
                                                type="email"
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-[#2D9B82] focus:ring-0 outline-none text-sm transition-all text-gray-900"
                                                value={editData.contact?.email || ''}
                                                onChange={(e) => handleChange(e, 'contact.email')}
                                            />
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Full Address</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-[#2D9B82] focus:ring-0 outline-none text-sm transition-all text-gray-900"
                                                value={editData.contact?.address || ''}
                                                onChange={(e) => handleChange(e, 'contact.address')}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* About & Details */}
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider pb-2 border-b border-gray-100">Company Details</h4>
                                    <div className="grid grid-cols-1 gap-6">
                                        <AboutItem label="Mission Statement" isEditing={true} value={editData.about?.mission} onChange={(e) => handleChange(e, 'about.mission')} />
                                        <AboutItem label="Services & Products" isEditing={true} value={editData.about?.services} onChange={(e) => handleChange(e, 'about.services')} />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <AboutItem label="Goals" isEditing={true} value={editData.about?.goals} onChange={(e) => handleChange(e, 'about.goals')} />
                                            <AboutItem label="Culture" isEditing={true} value={editData.about?.culture} onChange={(e) => handleChange(e, 'about.culture')} />
                                        </div>
                                    </div>
                                </div>

                                {/* Hiring Data */}
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider pb-2 border-b border-gray-100">Hiring Info</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <HiringTagGroup label="Job Roles" isEditing={true} value={editData.hiringInfo?.jobTypes} onChange={(e) => handleArrayChange(e, 'jobTypes')} icon={<Briefcase />} />
                                        <HiringTagGroup label="Locations" isEditing={true} value={editData.hiringInfo?.locations} onChange={(e) => handleArrayChange(e, 'locations')} icon={<MapPin />} />
                                        <HiringTagGroup label="Technologies" isEditing={true} value={editData.hiringInfo?.technologies} onChange={(e) => handleArrayChange(e, 'technologies')} icon={<Cpu />} />
                                        <HiringTagGroup label="Benefits" isEditing={true} value={editData.hiringInfo?.benefits} onChange={(e) => handleArrayChange(e, 'benefits')} icon={<Gift />} />
                                    </div>
                                </div>

                                {/* Social Links */}
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider pb-2 border-b border-gray-100">Online Presence</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">LinkedIn</label>
                                            <input type="url" value={editData.socialLinks?.linkedin || ''} onChange={(e) => handleChange(e, 'socialLinks.linkedin')} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-[#2D9B82] focus:ring-0 outline-none text-sm transition-all text-gray-900" placeholder="URL" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Portfolio</label>
                                            <input type="url" value={editData.socialLinks?.portfolio || ''} onChange={(e) => handleChange(e, 'socialLinks.portfolio')} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-[#2D9B82] focus:ring-0 outline-none text-sm transition-all text-gray-900" placeholder="URL" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">GitHub</label>
                                            <input type="url" value={editData.socialLinks?.github || ''} onChange={(e) => handleChange(e, 'socialLinks.github')} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-[#2D9B82] focus:ring-0 outline-none text-sm transition-all text-gray-900" placeholder="URL" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 sticky bottom-0 bg-white/95 backdrop-blur py-4 z-10">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        className="px-6 py-2 border border-gray-300 shadow-sm text-sm font-bold rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2D9B82]"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-bold rounded-lg shadow-sm text-white bg-[#2D9B82] hover:bg-[#25836d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2D9B82]"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <GlobalFooter />
        </div>
    );
};

// HELPER COMPONENTS
const SectionCard = ({ title, children }) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 h-fit">
        <h2 className="text-sm font-bold text-gray-900 mb-6 pb-2 border-b border-gray-100 border-l-4 border-l-[#2D9B82] pl-3 uppercase tracking-wider">
            {title}
        </h2>
        {children}
    </div>
);

const AboutItem = ({ label, value, isEditing, onChange }) => (
    <div className="space-y-2">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</h4>
        {isEditing ? (
            <textarea
                value={value || ''}
                onChange={onChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg text-sm p-4 min-h-[100px] focus:bg-white focus:border-[#2D9B82] focus:ring-0 transition-all outline-none resize-none text-gray-900"
                placeholder={`Enter details...`}
            />
        ) : (
            <div className="text-sm text-gray-700 font-medium leading-relaxed italic">
                {value ? (
                    value.startsWith('"') ? value : `"${value}"`
                ) : (
                    <span className="text-gray-400">"No {label.toLowerCase()} statement provided."</span>
                )}
            </div>
        )}
    </div>
);

const HiringTagGroup = ({ label, value, isEditing, onChange, icon }) => (
    <div className="space-y-2">
        <div className="flex items-center gap-2 mb-1">
            <div className="text-gray-400">{React.cloneElement(icon, { className: 'w-3.5 h-3.5' })}</div>
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</h4>
        </div>
        {isEditing ? (
            <input
                value={value?.join(', ') || ''}
                onChange={onChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg text-sm px-4 py-2 focus:bg-white focus:border-[#2D9B82] focus:ring-0 transition-all outline-none"
                placeholder="Separate with commas..."
            />
        ) : (
            <div className="mt-1">
                {value?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {/* If it's just a comma separated string in current data structure? No, it's array. */}
                        <p className="text-sm font-bold text-gray-800">{value.join(', ')}</p>
                    </div>
                ) : <span className="text-sm text-gray-400 italic">None listed</span>}
            </div>
        )}
    </div>
);

const StatItem = ({ label, value, color = "text-gray-900" }) => (
    <div className="flex justify-between items-center py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 px-2 -mx-2 rounded transition-colors">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
        <span className={`text-xl font-bold ${color}`}>{value}</span>
    </div>
);

const SocialLinkItem = ({ icon, label, value }) => (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100 group">
        <div className="w-8 h-8 flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-gray-200 group-hover:text-[#2D9B82] transition-colors">
            {React.cloneElement(icon, { className: 'w-4 h-4' })}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
            {value ? (
                <a
                    href={value}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-[#2D9B82] hover:underline block truncate"
                >
                    Add Link
                </a>
            ) : (
                <span className="text-xs font-bold text-red-400">Add Link</span>
            )}
        </div>
    </div>
);

export default CompanyProfile;
