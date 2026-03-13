import { useState, useEffect } from 'react';
import RecruiterLayout from '../../components/layouts/RecruiterLayout';
import api from '../../services/api';
import companyService from '../../services/companyService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Building2, AlertTriangle } from 'lucide-react';

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
                <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 transform transition-all">
                    {/* Header Banner */}
                    <div className="bg-gradient-to-r from-red-500 to-rose-600 px-6 py-8 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 -tr-10 opacity-10 flex">
                           <AlertTriangle className="w-48 h-48 rotate-12 transform translate-x-12 -translate-y-12" />
                        </div>
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm mb-4 inline-block shadow-inner ring-4 ring-white/10">
                                <AlertTriangle className="h-10 w-10 text-white" />
                            </div>
                            <h2 className="text-2xl font-extrabold text-white tracking-wide">
                                Identity Verification Required
                            </h2>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="px-8 py-10 text-center">
                        <h3 className="text-lg font-bold text-gray-900 mb-3">Action Needed to access Job Postings</h3>
                        <p className="text-gray-600 mb-8 leading-relaxed">
                            To maintain trust and safety within Naya Awasar, all recruiters must have their <strong className="text-gray-900 tracking-wide">Personal KYC</strong> verified by an admin before they can post jobs or create a company profile.
                        </p>

                        {/* Status Box */}
                        <div className="bg-gray-50 rounded-xl p-4 mb-8 inline-flex items-center gap-3 border border-gray-200 shadow-sm">
                            <span className="text-xs tracking-widest uppercase font-bold text-gray-500">Current Status:</span>
                            <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${
                                user.kycStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                user.kycStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-gray-200 text-gray-700'
                            }`}>
                                {user.kycStatus?.replace('_', ' ') || 'NOT SUBMITTED'}
                            </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button
                                onClick={() => navigate('/kyc/recruiter')}
                                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-[#29a08e] hover:bg-[#228377] hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#29a08e] transition-all duration-300"
                            >
                                Go to KYC Verification
                                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </button>
                            <button
                                onClick={() => navigate('/recruiter/dashboard')}
                                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 bg-white hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors"
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
            <div className="flex h-screen items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#29a08e]/30 border-t-[#29a08e] rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!company || company.status !== 'approved') {
        return (
            <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[60vh] bg-gray-50">
                <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 transform transition-all">
                    {/* Header Banner */}
                    <div className="bg-gradient-to-r from-amber-400 to-yellow-600 px-6 py-8 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 -tr-10 opacity-10 flex">
                           <AlertTriangle className="w-48 h-48 rotate-12 transform translate-x-12 -translate-y-12 text-white" />
                        </div>
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm mb-4 inline-block shadow-inner ring-4 ring-white/10">
                                <AlertTriangle className="h-10 w-10 text-white" />
                            </div>
                            <h2 className="text-2xl font-extrabold text-white tracking-wide">
                                Company Profile Incomplete
                            </h2>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="px-8 py-10 text-center">
                        <h3 className="text-lg font-bold text-gray-900 mb-3">Action Needed to Access Job Postings</h3>
                        <p className="text-gray-600 mb-8 leading-relaxed">
                            You need an <strong className="text-gray-900 tracking-wide">Approved Company Profile</strong> before you can post jobs.
                        </p>

                        {/* Status Box */}
                        <div className="bg-gray-50 rounded-xl p-4 mb-8 inline-flex items-center gap-3 border border-gray-200 shadow-sm">
                            <span className="text-xs tracking-widest uppercase font-bold text-gray-500">Company Status:</span>
                            <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${
                                company?.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                company?.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-gray-200 text-gray-700'
                            }`}>
                                {company ? company.status : 'NOT CREATED'}
                            </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button
                                onClick={() => navigate('/recruiter/company')}
                                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-[#29a08e] hover:bg-[#228377] hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#29a08e] transition-all duration-300"
                            >
                                Go to Company Profile
                                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </button>
                            <button
                                onClick={() => navigate('/recruiter/dashboard')}
                                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 bg-white hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors"
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
            <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
                <div className="md:flex md:items-center md:justify-between mb-8">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                            Post a Job
                        </h2>
                    </div>
                    <div className="mt-4 flex md:mt-0 md:ml-4">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#29a08e]"
                        >
                            Cancel
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1">Job Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g. Senior Software Engineer"
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#29a08e] focus:ring-[#29a08e] sm:text-sm px-4 py-3 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Company Name</label>
                                <input
                                    type="text"
                                    name="company_name"
                                    value={formData.company_name}
                                    readOnly
                                    className="block w-full rounded-lg border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed shadow-sm focus:ring-0 sm:text-sm px-4 py-3 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Location</label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    readOnly
                                    className="block w-full rounded-lg border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed shadow-sm focus:ring-0 sm:text-sm px-4 py-3 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Job Type</label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#29a08e] focus:ring-[#29a08e] sm:text-sm px-4 py-3 border"
                                >
                                    <option>Full-time</option>
                                    <option>Part-time</option>
                                    <option>Contract</option>
                                    <option>Internship</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Salary Range</label>
                                <input
                                    type="text"
                                    name="salary_range"
                                    value={formData.salary_range}
                                    onChange={handleChange}
                                    placeholder="e.g. NRs. 50,000 - 80,000"
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#29a08e] focus:ring-[#29a08e] sm:text-sm px-4 py-3 border"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1">Job Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                    rows="5"
                                    placeholder="Describe the role and responsibilities..."
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#29a08e] focus:ring-[#29a08e] sm:text-sm px-4 py-3 border"
                                ></textarea>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1">Requirements</label>
                                <textarea
                                    name="requirements"
                                    value={formData.requirements}
                                    onChange={handleChange}
                                    rows="5"
                                    placeholder="List the required skills and qualifications..."
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#29a08e] focus:ring-[#29a08e] sm:text-sm px-4 py-3 border"
                                ></textarea>
                            </div>
                        </div>
                        <div className="pt-6 border-t border-gray-200 flex justify-end">
                            <button
                                type="submit"
                                className="ml-3 inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-bold rounded-lg text-white bg-[#29a08e] hover:bg-[#228377] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#29a08e]"
                            >
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
