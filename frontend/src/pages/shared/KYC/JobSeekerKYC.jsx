import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

const JobSeekerKYC = () => {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        fullName: user?.fullName || '',
        dateOfBirth: '',
        nationality: '',
        address: '',
        idType: 'citizenship',
        idNumber: ''
    });

    const [files, setFiles] = useState({
        documentFront: null,
        documentBack: null,
        selfieWithId: null
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

            // 2. Submit KYC Data (backend expects documentFront, documentBack for job_seeker)
            await api.post('/kyc/submit', {
                role: 'jobseeker',
                ...formData,
                dateOfBirth: formData.dateOfBirth || undefined,
                documentFront: fileUrls.documentFront,
                documentBack: fileUrls.documentBack,
                selfieWithId: fileUrls.selfieWithId || undefined
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
                    KYC Verification
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Verify your identity to start applying for jobs
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
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

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    required
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                                <input
                                    type="date"
                                    name="dateOfBirth"
                                    required
                                    value={formData.dateOfBirth}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nationality</label>
                                <input
                                    type="text"
                                    name="nationality"
                                    required
                                    value={formData.nationality}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Current Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    required
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">ID Type</label>
                                <select
                                    name="idType"
                                    value={formData.idType}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
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
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Documents</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Document Front</label>
                                    <input
                                        type="file"
                                        name="documentFront"
                                        required
                                        onChange={handleFileChange}
                                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Document Back</label>
                                    <input
                                        type="file"
                                        name="documentBack"
                                        required
                                        onChange={handleFileChange}
                                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Selfie with ID (Optional)</label>
                                    <input
                                        type="file"
                                        name="selfieWithId"
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
                                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {loading ? 'Submitting...' : 'Submit for Verification'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default JobSeekerKYC;
