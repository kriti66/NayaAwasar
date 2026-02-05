import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

const RecruiterKYC = () => {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setFiles({ ...files, [e.target.name]: e.target.files[0] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. Upload Files
            const uploadData = new FormData();
            Object.keys(files).forEach(key => {
                if (files[key]) uploadData.append(key, files[key]);
            });

            const uploadRes = await api.post('/upload/kyc', uploadData);
            const fileUrls = uploadRes.data.files;

            // 2. Submit KYC Data
            await api.post('/kyc/submit', {
                role: 'recruiter',
                ...formData,
                idFront: fileUrls.idFront,
                idBack: fileUrls.idBack,
                registrationDocument: fileUrls.registrationDocument,
                taxDocument: fileUrls.taxDocument,
                companyLogo: fileUrls.companyLogo
            });

            await refreshUser();
            navigate('/kyc/status');
        } catch (err) {
            const status = err.response?.status;
            const code = err.response?.data?.code;
            if (status === 401 || code === 'SESSION_EXPIRED') {
                setError('Your session has expired. Please log in again.');
            } else {
                setError(err.response?.data?.message || 'Error submitting KYC');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="text-center text-3xl font-extrabold text-gray-900">
                    Recruiter Verification
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Verify your business account to start posting jobs
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-3xl">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {error && (
                        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 text-red-700">
                            <p>{error}</p>
                            {error.includes('session has expired') && (
                                <Link to="/login" className="mt-2 inline-block text-sm font-medium text-blue-600 hover:text-blue-800 underline">
                                    Log in again
                                </Link>
                            )}
                        </div>
                    )}

                    <form className="space-y-8" onSubmit={handleSubmit}>
                        {/* Personal Details Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Personal Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        required
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Job Title</label>
                                    <input
                                        type="text"
                                        name="jobTitle"
                                        required
                                        value={formData.jobTitle}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Official Email</label>
                                    <input
                                        type="email"
                                        name="officialEmail"
                                        required
                                        value={formData.officialEmail}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                                    <input
                                        type="text"
                                        name="phoneNumber"
                                        required
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Company Details Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Company Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Company Name</label>
                                    <input
                                        type="text"
                                        name="companyName"
                                        required
                                        value={formData.companyName}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Registration Number</label>
                                    <input
                                        type="text"
                                        name="registrationNumber"
                                        required
                                        value={formData.registrationNumber}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Industry</label>
                                    <input
                                        type="text"
                                        name="industry"
                                        required
                                        value={formData.industry}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Company Website (Optional)</label>
                                    <input
                                        type="url"
                                        name="website"
                                        value={formData.website}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Company Address</label>
                                    <input
                                        type="text"
                                        name="companyAddress"
                                        required
                                        value={formData.companyAddress}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Personal ID Verification Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">ID Verification</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">ID Type</label>
                                    <select
                                        name="idType"
                                        value={formData.idType}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    >
                                        <option value="citizenship">Citizenship</option>
                                        <option value="passport">Passport</option>
                                        <option value="national_id">National ID</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">ID Number</label>
                                    <input
                                        type="text"
                                        name="idNumber"
                                        required
                                        value={formData.idNumber}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Document Upload Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Documents</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">ID Front Side</label>
                                    <input
                                        type="file"
                                        name="idFront"
                                        required
                                        onChange={handleFileChange}
                                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">ID Back Side</label>
                                    <input
                                        type="file"
                                        name="idBack"
                                        required
                                        onChange={handleFileChange}
                                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Registration Document (PDF/Image)</label>
                                    <input
                                        type="file"
                                        name="registrationDocument"
                                        required
                                        onChange={handleFileChange}
                                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Tax Document (VAT/PAN)</label>
                                    <input
                                        type="file"
                                        name="taxDocument"
                                        required
                                        onChange={handleFileChange}
                                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Company Logo (Optional)</label>
                                    <input
                                        type="file"
                                        name="companyLogo"
                                        onChange={handleFileChange}
                                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {loading ? 'Submitting Application...' : 'Submit Verification Request'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RecruiterKYC;
