import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { ShieldCheck, UploadCloud, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

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

    useEffect(() => {
        if (user) {
            setFormData((prev) => ({
                ...prev,
                fullName: user.fullName || prev.fullName
            }));
        }

        const fetchKycData = async () => {
            try {
                const res = await api.get('/kyc/status');
                if (res.data?.kycData && (res.data.kycStatus === 'rejected' || res.data.kycStatus === 'pending')) {
                    const prevData = res.data.kycData;
                    const dob = prevData.dateOfBirth
                        ? new Date(prevData.dateOfBirth).toISOString().slice(0, 10)
                        : '';
                    setFormData((prev) => ({
                        ...prev,
                        fullName: prevData.fullName || prev.fullName,
                        dateOfBirth: dob || prev.dateOfBirth,
                        nationality: prevData.nationality || prev.nationality,
                        address: prevData.address || prev.address,
                        idType: prevData.idType || prev.idType,
                        idNumber: prevData.idNumber || prev.idNumber
                    }));
                }
            } catch (err) {
                console.error('Failed to fetch previous KYC data for prefill:', err);
            }
        };
        fetchKycData();
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        if (e.target.files?.[0]) {
            setFiles({ ...files, [e.target.name]: e.target.files[0] });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!files.documentFront || !files.documentBack) {
                throw new Error('Please upload both front and back images of your ID document.');
            }

            const uploadData = new FormData();
            Object.keys(files).forEach((key) => {
                if (files[key]) uploadData.append(key, files[key]);
            });

            const uploadRes = await api.post('/upload/kyc', uploadData);
            const fileUrls = uploadRes.data.files;

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
                setError(err.response?.data?.message || err.message || 'Error submitting KYC');
            }
        } finally {
            setLoading(false);
        }
    };

    const statusLabel = (() => {
        const s = user?.kycStatus;
        if (s === 'rejected') return { text: 'REJECTED — RESUBMIT', tone: 'bg-red-100 text-red-700 border-red-200' };
        if (s === 'pending') return { text: 'PENDING REVIEW', tone: 'bg-amber-100 text-amber-800 border-amber-200' };
        return { text: 'NOT SUBMITTED', tone: 'bg-gray-200 text-gray-700 border-gray-300' };
    })();

    return (
        <div className="w-full sm:px-6 lg:px-8 max-w-6xl mx-auto pb-12 pt-6">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-[#29a08e] px-8 py-6 text-white flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <ShieldCheck className="h-7 w-7 shrink-0" />
                            Identity Verification
                        </h2>
                        <p className="text-white/90 text-sm mt-1">
                            Verify your identity to apply for jobs and build trust with recruiters.
                        </p>
                    </div>
                    <Link
                        to="/seeker/dashboard"
                        className="text-white/90 hover:text-white flex items-center gap-1 text-sm font-medium transition-colors shrink-0"
                    >
                        <ArrowLeft size={16} /> Back to Dashboard
                    </Link>
                </div>

                <div className="bg-gray-50 px-8 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Your status</span>
                        <span
                            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1 shadow-sm border ${statusLabel.tone}`}
                        >
                            <AlertCircle size={14} /> {statusLabel.text}
                        </span>
                    </div>
                    <span className="text-xs text-gray-400 font-medium">Your data is encrypted and reviewed securely.</span>
                </div>

                <div className="p-8 sm:p-12">
                    {error && (
                        <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-5 rounded-r-xl shadow-sm">
                            <div className="flex">
                                <AlertCircle className="h-6 w-6 text-red-500 shrink-0" />
                                <div className="ml-3">
                                    <h3 className="text-sm font-bold text-red-800">Submission Error</h3>
                                    <p className="text-sm text-red-700 mt-1">{error}</p>
                                    {error.includes('session has expired') && (
                                        <Link
                                            to="/login"
                                            className="mt-2 inline-block text-sm font-semibold text-[#29a08e] hover:underline"
                                        >
                                            Log in again
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-12">
                        <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <div className="mb-6 pb-4 border-b border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-[#29a08e]/10 text-[#29a08e] flex items-center justify-center text-sm font-bold">
                                        1
                                    </span>
                                    Personal details
                                </h3>
                                <p className="text-sm text-gray-500 mt-1 ml-10">Use the same name and address as on your government ID.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 lg:pl-10">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Full name</label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        required
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        className="w-full border px-4 py-3 rounded-lg border-gray-300 focus:border-[#29a08e] focus:ring-[#29a08e] shadow-sm transition-all"
                                        placeholder="As shown on your ID"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Date of birth</label>
                                    <input
                                        type="date"
                                        name="dateOfBirth"
                                        required
                                        value={formData.dateOfBirth}
                                        onChange={handleChange}
                                        className="w-full border px-4 py-3 rounded-lg border-gray-300 focus:border-[#29a08e] focus:ring-[#29a08e] shadow-sm transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nationality</label>
                                    <input
                                        type="text"
                                        name="nationality"
                                        required
                                        value={formData.nationality}
                                        onChange={handleChange}
                                        className="w-full border px-4 py-3 rounded-lg border-gray-300 focus:border-[#29a08e] focus:ring-[#29a08e] shadow-sm transition-all"
                                        placeholder="e.g. Nepali"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Current address</label>
                                    <input
                                        type="text"
                                        name="address"
                                        required
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="w-full border px-4 py-3 rounded-lg border-gray-300 focus:border-[#29a08e] focus:ring-[#29a08e] shadow-sm transition-all"
                                        placeholder="City, district"
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <div className="mb-6 pb-4 border-b border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-[#29a08e]/10 text-[#29a08e] flex items-center justify-center text-sm font-bold">
                                        2
                                    </span>
                                    ID information
                                </h3>
                                <p className="text-sm text-gray-500 mt-1 ml-10">Select the document you are uploading and enter its number.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 lg:pl-10">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">ID type</label>
                                    <select
                                        name="idType"
                                        value={formData.idType}
                                        onChange={handleChange}
                                        className="w-full border px-4 py-3 rounded-lg border-gray-300 focus:border-[#29a08e] focus:ring-[#29a08e] shadow-sm transition-all bg-white"
                                    >
                                        <option value="citizenship">Citizenship</option>
                                        <option value="passport">Passport</option>
                                        <option value="national_id">National ID</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">ID number</label>
                                    <input
                                        type="text"
                                        name="idNumber"
                                        required
                                        value={formData.idNumber}
                                        onChange={handleChange}
                                        className="w-full border px-4 py-3 rounded-lg border-gray-300 focus:border-[#29a08e] focus:ring-[#29a08e] shadow-sm transition-all"
                                        placeholder="Number on the document"
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="bg-[#f8fafc] p-6 lg:p-8 rounded-2xl border border-gray-200 shadow-sm">
                            <div className="mb-8 pb-4 border-b border-gray-200">
                                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                                    <span className="w-10 h-10 rounded-xl bg-[#29a08e]/15 text-[#29a08e] flex items-center justify-center text-lg font-bold shadow-inner">
                                        3
                                    </span>
                                    Upload documents
                                </h3>
                                <p className="text-sm text-gray-600 mt-2 lg:pl-[3.25rem]">
                                    Clear, readable photos or scans. PDF, JPG, or PNG — max 5MB per file.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-0 lg:pl-10">
                                {[
                                    { label: 'ID document (front)', name: 'documentFront', req: true },
                                    { label: 'ID document (back)', name: 'documentBack', req: true },
                                    { label: 'Selfie with ID', name: 'selfieWithId', req: false }
                                ].map((doc) => (
                                    <div
                                        key={doc.name}
                                        className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl transition-all group ${
                                            files[doc.name]
                                                ? 'border-emerald-400 bg-emerald-50 shadow-inner'
                                                : 'border-gray-300 hover:border-[#29a08e]/50 hover:bg-white bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex flex-col items-center text-center">
                                            {files[doc.name] ? (
                                                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mb-3 shadow-sm">
                                                    <CheckCircle className="h-7 w-7 text-emerald-600" />
                                                </div>
                                            ) : (
                                                <div className="w-14 h-14 bg-gray-100 group-hover:bg-[#29a08e]/10 rounded-full flex items-center justify-center mb-3 transition-colors">
                                                    <UploadCloud className="h-7 w-7 text-gray-400 group-hover:text-[#29a08e] transition-colors" />
                                                </div>
                                            )}

                                            <span className="text-sm font-bold text-gray-800 mb-1">
                                                {doc.label}{' '}
                                                {doc.req && <span className="text-red-500">*</span>}
                                            </span>

                                            {files[doc.name] ? (
                                                <span className="text-xs font-bold text-emerald-700 truncate max-w-[220px] bg-emerald-100/50 px-3 py-1 rounded-full">
                                                    {files[doc.name].name}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-500 mb-3">PDF, JPG, PNG up to 5MB</span>
                                            )}

                                            <input
                                                type="file"
                                                name={doc.name}
                                                required={doc.req && !files[doc.name]}
                                                accept="image/*,.pdf,application/pdf"
                                                onChange={handleFileChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                id={`file-${doc.name}`}
                                            />

                                            <div
                                                className={`mt-3 text-xs font-bold px-4 py-1.5 rounded-full border transition-colors ${
                                                    files[doc.name]
                                                        ? 'text-gray-600 border-gray-300 hover:bg-gray-100 bg-white'
                                                        : 'text-[#29a08e] border-[#29a08e]/30 bg-[#29a08e]/5 group-hover:bg-[#29a08e]/10'
                                                }`}
                                            >
                                                {files[doc.name] ? 'Change file' : 'Browse files'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <div className="pt-10 mt-10 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end gap-4 items-center">
                            <Link
                                to="/seeker/dashboard"
                                className="w-full sm:w-auto px-8 py-3.5 border-2 border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 transition-all text-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full sm:w-auto px-10 py-3.5 bg-gradient-to-r from-[#29a08e] to-[#228377] text-white rounded-xl font-bold shadow-lg shadow-[#29a08e]/30 hover:shadow-xl hover:-translate-y-0.5 transition-all outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#29a08e] ${
                                    loading ? 'opacity-70 cursor-not-allowed transform-none' : ''
                                }`}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Submitting…
                                    </span>
                                ) : (
                                    'Submit for verification'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default JobSeekerKYC;
