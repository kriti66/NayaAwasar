import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { Building, ArrowLeft, AlertCircle } from 'lucide-react';

const RecruiterKYC = () => {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [statusMeta, setStatusMeta] = useState({
        representativeStatus: 'not_submitted',
        companyStatus: 'not_submitted',
        representativeRejectionReason: '',
        companyRejectionReason: ''
    });

    const [formData, setFormData] = useState({
        fullName: user?.fullName || '',
        jobTitle: '',
        officialEmail: user?.email || '',
        phoneNumber: '',
        companyName: '',
        registrationNumber: '',
        industry: '',
        companyAddress: '',
        website: '',
        idType: 'national_id',
        idNumber: ''
    });

    const [files, setFiles] = useState({
        representativePhoto: null,
        idFront: null,
        idBack: null,
        registrationDocument: null,
        taxDocument: null,
        companyLogo: null
    });

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                fullName: user.fullName || prev.fullName,
                officialEmail: user.email || prev.officialEmail
            }));
        }
        
        // Fetch previous submission to prefill if rejected
        const fetchKycData = async () => {
            try {
                const res = await api.get('/kyc/recruiter/status');
                setStatusMeta({
                    representativeStatus: res.data?.representativeStatus || 'not_submitted',
                    companyStatus: res.data?.companyStatus || 'not_submitted',
                    representativeRejectionReason: res.data?.representativeRejectionReason || '',
                    companyRejectionReason: res.data?.companyRejectionReason || ''
                });
                if (res.data?.kycData) {
                    const prevData = res.data.kycData;
                    const representative = prevData.representative || {};
                    const company = prevData.company || {};
                    setFormData(prev => ({
                        ...prev,
                        fullName: representative.fullName || prevData.fullName || prev.fullName,
                        jobTitle: representative.jobTitle || prevData.jobTitle || prev.jobTitle,
                        officialEmail: representative.officialEmail || prevData.officialEmail || prev.officialEmail,
                        phoneNumber: representative.phoneNumber || prevData.phoneNumber || prev.phoneNumber,
                        companyName: company.companyName || prevData.companyName || prev.companyName,
                        registrationNumber: company.registrationNumber || prevData.registrationNumber || prev.registrationNumber,
                        industry: company.industry || prevData.industry || prev.industry,
                        companyAddress: company.companyAddress || prevData.companyAddress || prev.companyAddress,
                        website: company.website || prevData.website || prev.website,
                        idType: representative.idType || prevData.idType || prev.idType,
                        idNumber: representative.idNumber || prevData.idNumber || prev.idNumber
                    }));
                }
            } catch (err) {
                console.error("Failed to fetch previous KYC data for prefill:", err);
            }
        };
        fetchKycData();
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFiles({ ...files, [e.target.name]: e.target.files[0] });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. Upload Files
            const uploadData = new FormData();
            let hasFiles = false;
            Object.keys(files).forEach(key => {
                if (files[key]) {
                    uploadData.append(key, files[key]);
                    hasFiles = true;
                }
            });

            if (!hasFiles) {
                throw new Error("Please upload all required documents.");
            }

            const uploadRes = await api.post('/upload/kyc', uploadData);
            const fileUrls = uploadRes.data.files;

            // 2. Submit KYC Data
            await api.post('/kyc/recruiter/submit', {
                ...formData,
                representativePhoto: fileUrls.representativePhoto,
                idFront: fileUrls.idFront,
                idBack: fileUrls.idBack,
                registrationDocument: fileUrls.registrationDocument,
                taxDocument: fileUrls.taxDocument,
                companyLogo: fileUrls.companyLogo // Optional
            });

            await refreshUser();
            navigate('/recruiter/dashboard'); // Redirect to dashboard per request (or status page)
        } catch (err) {
            console.error("KYC Submit Error:", err);
            const msg = err.response?.data?.message || err.message || 'Error submitting KYC';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full sm:px-6 lg:px-8 max-w-6xl mx-auto pb-8">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="bg-[#29a08e] px-8 py-6 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Building className="h-6 w-6" />
                            Recruiter Verification
                        </h2>
                        <p className="text-white/90 text-sm mt-1">
                            Complete your profile to unlock full platform access.
                        </p>
                    </div>
                    <Link to="/recruiter/dashboard" className="text-white/90 hover:text-white flex items-center gap-1 text-sm font-medium transition-colors">
                        <ArrowLeft size={16} /> Dashboard
                    </Link>
                </div>

                {/* Status Indicator */}
                <div className="bg-gray-50 px-8 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Verification Status</span>
                        <span className="px-3 py-1 bg-gray-200 text-gray-700 text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1 shadow-sm">
                            Representative: {statusMeta.representativeStatus}
                        </span>
                        <span className="px-3 py-1 bg-gray-200 text-gray-700 text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1 shadow-sm">
                            Company: {statusMeta.companyStatus}
                        </span>
                    </div>
                    <span className="hidden sm:inline-block text-xs text-gray-400 font-medium">All information is securely encrypted.</span>
                </div>

                <div className="p-8 sm:p-12">
                    {error && (
                        <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-5 rounded-r-xl shadow-sm">
                            <div className="flex">
                                <AlertCircle className="h-6 w-6 text-red-500" />
                                <div className="ml-3">
                                    <h3 className="text-sm font-bold text-red-800">Submission Error</h3>
                                    <p className="text-sm text-red-700 mt-1">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-12">

                        {/* 1. Representative Verification */}
                        <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <div className="mb-6 pb-4 border-b border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-[#29a08e]/10 text-[#29a08e] flex items-center justify-center text-sm font-bold">1</span>
                                    Representative Verification
                                </h3>
                                <p className="text-sm text-gray-500 mt-1 ml-10">Verify the identity of the authorized representative.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 lg:pl-10">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        required
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        className="w-full border px-4 py-3 rounded-lg border-gray-300 focus:border-[#29a08e] focus:ring-[#29a08e] shadow-sm transition-all"
                                        placeholder="Enter your full name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Job Title</label>
                                    <input
                                        type="text"
                                        name="jobTitle"
                                        required
                                        value={formData.jobTitle}
                                        onChange={handleChange}
                                        className="w-full border px-4 py-3 rounded-lg border-gray-300 focus:border-[#29a08e] focus:ring-[#29a08e] shadow-sm transition-all"
                                        placeholder="e.g. HR Manager"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Official Email</label>
                                    <input
                                        type="email"
                                        name="officialEmail"
                                        required
                                        value={formData.officialEmail}
                                        onChange={handleChange}
                                        className="w-full border px-4 py-3 rounded-lg border-gray-300 focus:border-[#29a08e] focus:ring-[#29a08e] shadow-sm transition-all bg-gray-50"
                                        readOnly
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phoneNumber"
                                        required
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        className="w-full border px-4 py-3 rounded-lg border-gray-300 focus:border-[#29a08e] focus:ring-[#29a08e] shadow-sm transition-all"
                                        placeholder="+977 98XXXXXXXX"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Representative Photo / Selfie</label>
                                    <input
                                        type="file"
                                        name="representativePhoto"
                                        required={!files.representativePhoto}
                                        onChange={handleFileChange}
                                        className="w-full border px-4 py-3 rounded-lg border-gray-300 bg-gray-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Identity Document (ID Type)</label>
                                    <select
                                        name="idType"
                                        value={formData.idType}
                                        onChange={handleChange}
                                        className="w-full border rounded-xl border-gray-300 focus:border-[#29a08e] focus:ring-[#29a08e] shadow-sm py-3 px-4 transition-all bg-white"
                                    >
                                        <option value="citizenship">Citizenship</option>
                                        <option value="passport">Passport</option>
                                        <option value="national_id">National ID</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">ID Number</label>
                                    <input
                                        type="text"
                                        name="idNumber"
                                        required
                                        value={formData.idNumber}
                                        onChange={handleChange}
                                        placeholder="Enter ID Number"
                                        className="w-full border rounded-xl border-gray-300 focus:border-[#29a08e] focus:ring-[#29a08e] shadow-sm py-3 px-4 transition-all bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Upload ID Front</label>
                                    <input
                                        type="file"
                                        name="idFront"
                                        required={!files.idFront}
                                        onChange={handleFileChange}
                                        className="w-full border px-4 py-3 rounded-lg border-gray-300 bg-gray-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Upload ID Back</label>
                                    <input
                                        type="file"
                                        name="idBack"
                                        required={!files.idBack}
                                        onChange={handleFileChange}
                                        className="w-full border px-4 py-3 rounded-lg border-gray-300 bg-gray-50"
                                    />
                                </div>
                            </div>
                            {statusMeta.representativeRejectionReason && (
                                <div className="mt-4 ml-10 bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-700">
                                    Representative rejection reason: {statusMeta.representativeRejectionReason}
                                </div>
                            )}
                        </section>

                        {/* 2. Company Verification */}
                        <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <div className="mb-6 pb-4 border-b border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-[#29a08e]/10 text-[#29a08e] flex items-center justify-center text-sm font-bold">2</span>
                                    Company Verification
                                </h3>
                                <p className="text-sm text-gray-500 mt-1 ml-10">Verify the legal and business information of the company.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 lg:pl-10">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Company Name</label>
                                    <input
                                        type="text"
                                        name="companyName"
                                        required
                                        value={formData.companyName}
                                        onChange={handleChange}
                                        className="w-full border px-4 py-3 rounded-lg border-gray-300 focus:border-[#29a08e] focus:ring-[#29a08e] shadow-sm transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Registration Number</label>
                                    <input
                                        type="text"
                                        name="registrationNumber"
                                        required
                                        value={formData.registrationNumber}
                                        onChange={handleChange}
                                        className="w-full border px-4 py-3 rounded-lg border-gray-300 focus:border-[#29a08e] focus:ring-[#29a08e] shadow-sm transition-all"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Company Address</label>
                                    <input
                                        type="text"
                                        name="companyAddress"
                                        required
                                        value={formData.companyAddress}
                                        onChange={handleChange}
                                        className="w-full border px-4 py-3 rounded-lg border-gray-300 focus:border-[#29a08e] focus:ring-[#29a08e] shadow-sm transition-all"
                                        placeholder="Full registered address"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Industry</label>
                                    <input
                                        type="text"
                                        name="industry"
                                        required
                                        value={formData.industry}
                                        onChange={handleChange}
                                        className="w-full border px-4 py-3 rounded-lg border-gray-300 focus:border-[#29a08e] focus:ring-[#29a08e] shadow-sm transition-all"
                                        placeholder="e.g. IT, Healthcare"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Website (Optional)</label>
                                    <input
                                        type="url"
                                        name="website"
                                        value={formData.website}
                                        onChange={handleChange}
                                        className="w-full border px-4 py-3 rounded-lg border-gray-300 focus:border-[#29a08e] focus:ring-[#29a08e] shadow-sm transition-all"
                                        placeholder="https://"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Business Registration Document</label>
                                    <input
                                        type="file"
                                        name="registrationDocument"
                                        required={!files.registrationDocument}
                                        onChange={handleFileChange}
                                        className="w-full border px-4 py-3 rounded-lg border-gray-300 bg-gray-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tax Registration Document</label>
                                    <input
                                        type="file"
                                        name="taxDocument"
                                        required={!files.taxDocument}
                                        onChange={handleFileChange}
                                        className="w-full border px-4 py-3 rounded-lg border-gray-300 bg-gray-50"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Company Logo</label>
                                    <input
                                        type="file"
                                        name="companyLogo"
                                        onChange={handleFileChange}
                                        className="w-full border px-4 py-3 rounded-lg border-gray-300 bg-gray-50"
                                    />
                                </div>
                            </div>
                            {statusMeta.companyRejectionReason && (
                                <div className="mt-4 ml-10 bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-700">
                                    Company rejection reason: {statusMeta.companyRejectionReason}
                                </div>
                            )}
                        </section>

                        <div className="pt-10 mt-10 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end gap-4 items-center">
                            <Link
                                to="/recruiter/dashboard"
                                className="w-full sm:w-auto px-8 py-3.5 border-2 border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 transition-all text-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
                            >
                                Cancel Form
                            </Link>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full sm:w-auto px-10 py-3.5 bg-gradient-to-r from-[#29a08e] to-[#228377] text-white rounded-xl font-bold shadow-lg shadow-[#29a08e]/30 hover:shadow-xl hover:-translate-y-0.5 transition-all outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#29a08e] ${loading ? 'opacity-70 cursor-not-allowed transform-none' : ''}`}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Uploading...
                                    </span>
                                ) : 'Submit for Verification'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RecruiterKYC;
