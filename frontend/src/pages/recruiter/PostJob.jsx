import { useState, useEffect } from 'react';
import RecruiterLayout from '../../components/layouts/RecruiterLayout';
import api from '../../services/api';
import companyService from '../../services/companyService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Building2, AlertTriangle, Briefcase, MapPin, DollarSign, FileText, List } from 'lucide-react';

const PostJob = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loadingCompany, setLoadingCompany] = useState(true);
    const [company, setCompany] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        company_name: '',
        type: 'Full-time',
        location: '',
        description: '',
        salary_range: '',
        requirements: ''
    });

    useEffect(() => {
        if (user.kycStatus !== 'approved' && user.role === 'recruiter') {
            return;
        }
        const fetchRecruiterCompany = async () => {
            try {
                const myCompany = await companyService.getMyCompany();
                setCompany(myCompany);
                if (myCompany) {
                    setFormData(prev => ({
                        ...prev,
                        company_name: myCompany.name,
                        location: myCompany.headquarters
                    }));
                }
            } catch (error) {
                console.error("Failed to load company profile", error);
            } finally {
                setLoadingCompany(false);
            }
        };
        fetchRecruiterCompany();
    }, [user.kycStatus, user.role]);

    if (user.kycStatus !== 'approved' && user.role === 'recruiter') {
        return (
            <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[60vh] bg-gray-50">
                <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 transform transition-all">
                    <div className="bg-gradient-to-br from-rose-500 via-red-500 to-rose-600 px-8 py-10 text-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full blur-3xl"></div>
                        </div>
                        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm mb-5 inline-block shadow-inner ring-4 ring-white/10">
                                <AlertTriangle className="h-10 w-10 text-white" />
                            </div>
                            <h2 className="text-2xl font-black text-white tracking-tight">
                                Identity Verification Required
                            </h2>
                        </div>
                    </div>
                    <div className="px-8 py-10 text-center">
                        <h3 className="text-lg font-black text-gray-900 mb-3 tracking-tight">Action Needed to access Job Postings</h3>
                        <p className="text-gray-600 mb-8 leading-relaxed">
                            To maintain trust and safety within Naya Awasar, all recruiters must have their <strong className="text-gray-900">Personal KYC</strong> verified by an admin before they can post jobs.
                        </p>
                        <div className="bg-gray-50 rounded-2xl p-4 mb-8 inline-flex items-center gap-3 border border-gray-200 shadow-sm">
                            <span className="text-[10px] tracking-widest uppercase font-black text-gray-400">Current Status:</span>
                            <span className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-full tracking-wider ${
                                user.kycStatus === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                user.kycStatus === 'rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                'bg-gray-100 text-gray-700 border border-gray-200'
                            }`}>
                                {user.kycStatus?.replace('_', ' ') || 'NOT SUBMITTED'}
                            </span>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button
                                onClick={() => navigate('/kyc/recruiter')}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl shadow-lg text-sm font-bold text-white bg-[#29a08e] hover:bg-[#228377] hover:shadow-[#29a08e]/30 transition-all duration-300 active:scale-95"
                            >
                                Go to KYC Verification
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </button>
                            <button
                                onClick={() => navigate('/recruiter/dashboard')}
                                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 border border-gray-200 rounded-2xl text-sm font-bold text-gray-600 bg-white hover:bg-gray-50 hover:text-gray-900 transition-colors"
                            >
                                Return to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    if (loadingCompany) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[#29a08e]/30 border-t-[#29a08e] rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-sm font-bold text-gray-400">Loading company profile...</p>
                </div>
            </div>
        );
    }

    if (!company || company.status !== 'approved') {
        return (
            <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[60vh] bg-gray-50">
                <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 transform transition-all">
                    <div className="bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 px-8 py-10 text-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full blur-3xl"></div>
                        </div>
                        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm mb-5 inline-block shadow-inner ring-4 ring-white/10">
                                <Building2 className="h-10 w-10 text-white" />
                            </div>
                            <h2 className="text-2xl font-black text-white tracking-tight">
                                Company Profile Incomplete
                            </h2>
                        </div>
                    </div>
                    <div className="px-8 py-10 text-center">
                        <h3 className="text-lg font-black text-gray-900 mb-3 tracking-tight">Action Needed to Access Job Postings</h3>
                        <p className="text-gray-600 mb-8 leading-relaxed">
                            You need an <strong className="text-gray-900">Approved Company Profile</strong> before you can post jobs.
                        </p>
                        <div className="bg-gray-50 rounded-2xl p-4 mb-8 inline-flex items-center gap-3 border border-gray-200 shadow-sm">
                            <span className="text-[10px] tracking-widest uppercase font-black text-gray-400">Company Status:</span>
                            <span className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-full tracking-wider ${
                                company?.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                company?.status === 'rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                'bg-gray-100 text-gray-700 border border-gray-200'
                            }`}>
                                {company ? company.status : 'NOT CREATED'}
                            </span>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button
                                onClick={() => navigate('/recruiter/company')}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl shadow-lg text-sm font-bold text-white bg-[#29a08e] hover:bg-[#228377] hover:shadow-[#29a08e]/30 transition-all duration-300 active:scale-95"
                            >
                                Go to Company Profile
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </button>
                            <button
                                onClick={() => navigate('/recruiter/dashboard')}
                                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 border border-gray-200 rounded-2xl text-sm font-bold text-gray-600 bg-white hover:bg-gray-50 hover:text-gray-900 transition-colors"
                            >
                                Return to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/jobs', { ...formData, recruiter_id: user.id });
            alert('Job posted successfully!');
            navigate('/recruiter/dashboard');
        } catch (error) {
            console.error('Error posting job', error);
            alert('Failed to post job');
        }
    };

    return (
        <>
            {/* ─── Hero Header ─────────────────────────────── */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#0d2f2b] to-slate-900 pt-12 pb-28 px-4 sm:px-6 lg:px-8">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-10 w-64 h-64 bg-[#29a08e] rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 right-20 w-80 h-80 bg-teal-400 rounded-full blur-3xl"></div>
                </div>
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

                <div className="relative max-w-4xl mx-auto">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                        <div className="text-white animate-fade-in-up">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-sm font-medium text-gray-200 backdrop-blur-sm mb-4">
                                <Briefcase size={14} />
                                New Listing
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
                                Post a <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#29a08e] to-teal-300">Job</span>
                            </h1>
                            <p className="text-gray-300 text-lg">Create a compelling listing to attract top talent</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-2xl font-bold text-sm hover:bg-white/20 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>


            </div>

            <main className="flex-1 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full -mt-16 pb-12 relative z-10">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    {/* Form Header */}
                    <div className="px-8 pt-8 pb-6 border-b border-gray-50">
                        <p className="text-[#29a08e] font-bold text-[10px] uppercase tracking-[0.2em] mb-1">Job Details</p>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Fill in the details below</h3>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                    <Briefcase size={14} className="text-[#29a08e]" />
                                    Job Title
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g. Senior Software Engineer"
                                    className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-[#29a08e] focus:ring-[#29a08e] sm:text-sm px-4 py-3.5 border bg-gray-50/50 hover:bg-white transition-colors"
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                    <Building2 size={14} className="text-[#29a08e]" />
                                    Company Name
                                </label>
                                <input
                                    type="text"
                                    name="company_name"
                                    value={formData.company_name}
                                    readOnly
                                    className="block w-full rounded-xl border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed shadow-sm focus:ring-0 sm:text-sm px-4 py-3.5 border"
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                    <MapPin size={14} className="text-[#29a08e]" />
                                    Location
                                </label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    readOnly
                                    className="block w-full rounded-xl border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed shadow-sm focus:ring-0 sm:text-sm px-4 py-3.5 border"
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                    <List size={14} className="text-[#29a08e]" />
                                    Job Type
                                </label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-[#29a08e] focus:ring-[#29a08e] sm:text-sm px-4 py-3.5 border bg-gray-50/50 hover:bg-white transition-colors"
                                >
                                    <option>Full-time</option>
                                    <option>Part-time</option>
                                    <option>Contract</option>
                                    <option>Internship</option>
                                </select>
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                    <DollarSign size={14} className="text-[#29a08e]" />
                                    Salary Range
                                </label>
                                <input
                                    type="text"
                                    name="salary_range"
                                    value={formData.salary_range}
                                    onChange={handleChange}
                                    placeholder="e.g. NRs. 50,000 - 80,000"
                                    className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-[#29a08e] focus:ring-[#29a08e] sm:text-sm px-4 py-3.5 border bg-gray-50/50 hover:bg-white transition-colors"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                    <FileText size={14} className="text-[#29a08e]" />
                                    Job Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                    rows="5"
                                    placeholder="Describe the role and responsibilities..."
                                    className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-[#29a08e] focus:ring-[#29a08e] sm:text-sm px-4 py-3.5 border bg-gray-50/50 hover:bg-white transition-colors"
                                ></textarea>
                            </div>
                            <div className="col-span-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                    <List size={14} className="text-[#29a08e]" />
                                    Requirements
                                </label>
                                <textarea
                                    name="requirements"
                                    value={formData.requirements}
                                    onChange={handleChange}
                                    rows="5"
                                    placeholder="List the required skills and qualifications..."
                                    className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-[#29a08e] focus:ring-[#29a08e] sm:text-sm px-4 py-3.5 border bg-gray-50/50 hover:bg-white transition-colors"
                                ></textarea>
                            </div>
                        </div>
                        <div className="pt-6 border-t border-gray-100 flex justify-end">
                            <button
                                type="submit"
                                className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#29a08e] text-white rounded-2xl font-bold text-sm hover:bg-[#228377] shadow-lg shadow-[#29a08e]/20 hover:shadow-[#29a08e]/30 transition-all active:scale-95"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                </svg>
                                Post Job
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </>
    );
};

export default PostJob;
