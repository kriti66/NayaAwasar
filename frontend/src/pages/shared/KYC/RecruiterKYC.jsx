import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { Building, UploadCloud, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

const RecruiterKYC = () => {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1); // Optional: if we want multi-step, but user asked for 2-col responsive

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
        <div className="w-full">
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="bg-blue-600 px-8 py-6 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Building className="h-6 w-6" />
                            Recruiter Verification
                        </h2>
                        <p className="text-blue-100 text-sm mt-1">
                            Complete your profile to unlock full platform access.
                        </p>
                    </div>
                    <Link to="/recruiter/dashboard" className="text-blue-100 hover:text-white flex items-center gap-1 text-sm font-medium transition-colors">
                        <ArrowLeft size={16} /> Dashboard
                    </Link>
                </div>

                {/* Status Indicator (if needed, or just steps) */}
                <div className="bg-blue-50 px-8 py-3 border-b border-blue-100 flex items-center gap-2 text-sm text-blue-800">
                    <AlertCircle size={16} />
                    <span className="font-medium">Status:</span> Not Submitted
                </div>

                <div className="p-8">
                    {error && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
                            <div className="flex">
                                <AlertCircle className="h-5 w-5 text-red-400" />
                                <div className="ml-3">
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* 1. Official Representative Details */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                                Official Representative
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        required
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm transition-all"
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
                                        className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm transition-all"
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
                                        className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm transition-all bg-gray-50"
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
                                        className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm transition-all"
                                        placeholder="+977 98XXXXXXXX"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 2. Company Information */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                                Company Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Company Name</label>
                                    <input
                                        type="text"
                                        name="companyName"
                                        required
                                        value={formData.companyName}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm transition-all"
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
                                        className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm transition-all"
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
                                        className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm transition-all"
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
                                        className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm transition-all"
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
                                        className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm transition-all"
                                        placeholder="https://"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 3. Document Uploads */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                                Required Documents
                            </h3>

                            {/* ID Section */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">ID Type</label>
                                    <select
                                        name="idType"
                                        value={formData.idType}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
                                    >
                                        <option value="citizenship">Citizenship</option>
                                        <option value="passport">Passport</option>
                                        <option value="national_id">National ID</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">ID Number</label>
                                    <input
                                        type="text"
                                        name="idNumber"
                                        required
                                        value={formData.idNumber}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    { label: "ID Front", name: "idFront", req: true },
                                    { label: "ID Back", name: "idBack", req: true },
                                    { label: "Company Registration", name: "registrationDocument", req: true },
                                    { label: "Tax Document (PAN/VAT)", name: "taxDocument", req: true },
                                    { label: "Company Logo", name: "companyLogo", req: false }
                                ].map((doc, i) => (
                                    <div key={i} className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${files[doc.name] ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}>
                                        <div className="flex flex-col items-center">
                                            {files[doc.name] ? (
                                                <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                                            ) : (
                                                <UploadCloud className="h-8 w-8 text-gray-400 mb-2" />
                                            )}
                                            <span className="text-sm font-medium text-gray-700">{doc.label} {doc.req && '*'}</span>
                                            {files[doc.name] ? (
                                                <span className="text-xs text-green-600 font-medium mt-1 truncate max-w-[200px]">{files[doc.name].name}</span>
                                            ) : (
                                                <span className="text-xs text-gray-400 mt-1">Click to upload</span>
                                            )}
                                            <input
                                                type="file"
                                                name={doc.name}
                                                required={doc.req}
                                                onChange={handleFileChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                // Make this relative container slightly simpler if absolute positioning is tricky,
                                                // but for this snippet I'll wrap it properly or assumes parent relative.
                                                // Actually, let's use a standard input style for reliability.
                                                style={{ display: 'none' }}
                                                id={`file-${doc.name}`}
                                            />
                                            <label htmlFor={`file-${doc.name}`} className="mt-2 text-xs font-bold text-blue-600 cursor-pointer hover:underline">
                                                {files[doc.name] ? 'Change File' : 'Browse Files'}
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                            <Link
                                to="/recruiter/dashboard"
                                className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                            >
                                {loading ? 'Submitting...' : 'Submit Assessment'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RecruiterKYC;
