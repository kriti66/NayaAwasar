import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../../../services/api';
import { resolveAssetUrl } from '../../../utils/assetUrl';
import { useAuth } from '../../../contexts/AuthContext';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const allowedFileTypes = ['image/jpeg', 'image/png', 'application/pdf'];

const idValidation = {
    Citizenship: /^[0-9]{7,9}$/,
    Passport: /^[A-Za-z]{2}[0-9]{7}$/,
    'National ID': /^[0-9]{12}$/
};

const idHints = {
    Citizenship: {
        placeholder: 'e.g. 12-34-56-78901',
        hint: 'Numeric only · 7 to 9 digits',
        error: 'Citizenship number must be 7–9 digits (numbers only).',
        example: 'Example: 1234567 or 123456789'
    },
    Passport: {
        placeholder: 'e.g. AB1234567',
        hint: 'Starts with 2 letters + 7 numbers',
        error: 'Passport must start with 2 letters followed by 7 numbers.',
        example: 'Example: AB1234567'
    },
    'National ID': {
        placeholder: 'e.g. 1234-5678-9012',
        hint: 'Numeric only · 12 digits',
        error: 'National ID must be 12 digits (numbers only).',
        example: 'Example: 123456789012'
    }
};

const formSchema = z
    .object({
        fullName: z.string().min(1, 'Full Name is required').refine((v) => !/[0-9]/.test(v), 'No numbers allowed in Full Name'),
        dob: z.string().min(1, 'Date of Birth is required'),
        nationality: z.string().min(1, 'Nationality is required'),
        address: z.string().min(1, 'Current Address is required'),
        idType: z.enum(['Citizenship', 'Passport', 'National ID']),
        idNumber: z.string().min(1, 'ID Number is required')
    })
    .superRefine((data, ctx) => {
        const minAgeDate = new Date();
        minAgeDate.setFullYear(minAgeDate.getFullYear() - 18);
        if (new Date(data.dob) > minAgeDate) {
            ctx.addIssue({ code: 'custom', path: ['dob'], message: 'You must be 18+ years old.' });
        }
        const rawId = (data.idNumber || '').trim();
        const normalized = data.idType === 'Passport' ? rawId : rawId.replace(/-/g, '');
        const pattern = idValidation[data.idType];
        if (pattern && !pattern.test(normalized)) {
            ctx.addIssue({
                code: 'custom',
                path: ['idNumber'],
                message: idHints[data.idType].error
            });
        }
    });

function isProbablyImageUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const u = url.split('?')[0].toLowerCase();
    return /\.(jpe?g|png|gif|webp)$/i.test(u);
}

const KYCForm = () => {
    const navigate = useNavigate();
    const { refreshUser } = useAuth();
    const [statusData, setStatusData] = useState({ status: 'not_submitted', adminNote: '' });
    const [uploadedDocuments, setUploadedDocuments] = useState([]);
    const [loadingStatus, setLoadingStatus] = useState(true);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [files, setFiles] = useState({ frontDoc: null, backDoc: null, selfie: null });

    const normalizedStatus = String(statusData.status || 'not_submitted').toLowerCase();
    const hasKycRecord = normalizedStatus !== 'not_submitted';
    const isPending = normalizedStatus === 'pending';
    const isApproved = normalizedStatus === 'approved' || normalizedStatus === 'verified';
    const isRejected = normalizedStatus === 'rejected';
    const showDocumentPreview = (isPending || isApproved || isRejected) && uploadedDocuments.length > 0;
    const showUploadInputs = isRejected || !hasKycRecord;
    const showSubmitButton = isRejected || !hasKycRecord;
    const isReadOnly = useMemo(
        () => isPending || isApproved,
        [isPending, isApproved]
    );

    const {
        register,
        handleSubmit,
        setValue,
        clearErrors,
        trigger,
        watch,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fullName: '',
            dob: '',
            nationality: 'Nepali',
            address: '',
            idType: 'Citizenship',
            idNumber: ''
        }
    });

    useEffect(() => {
        const loadStatus = async () => {
            try {
                const res = await api.get('/kyc/identity/status');
                setStatusData({
                    status: res.data?.status || 'not_submitted',
                    adminNote: res.data?.adminNote || ''
                });
                const docs = Array.isArray(res.data?.documents) ? res.data.documents : [];
                setUploadedDocuments(docs);
                if (res.data?.data) {
                    const d = res.data.data;
                    setValue('fullName', d.fullName || '');
                    setValue('dob', d.dob ? new Date(d.dob).toISOString().slice(0, 10) : '');
                    setValue('nationality', d.nationality || 'Nepali');
                    setValue('address', d.address || '');
                    setValue('idType', d.idType || 'Citizenship');
                    setValue('idNumber', d.idNumber || '');
                    if (!docs.length) {
                        const fallback = [];
                        if (d.frontDoc) fallback.push({ key: 'frontDoc', label: 'ID document (front)', url: d.frontDoc });
                        if (d.backDoc) fallback.push({ key: 'backDoc', label: 'ID document (back)', url: d.backDoc });
                        if (d.selfie) fallback.push({ key: 'selfie', label: 'Selfie with ID', url: d.selfie });
                        setUploadedDocuments(fallback);
                    }
                }
            } catch {
                toast.error('Unable to load KYC status.');
            } finally {
                setLoadingStatus(false);
            }
        };
        loadStatus();
    }, [setValue]);

    const validateFile = (file) => {
        if (!file) return true;
        if (!allowedFileTypes.includes(file.type)) return 'Invalid file type. Use PDF, JPG or PNG only.';
        if (file.size > MAX_FILE_SIZE) return 'File too large. Max size is 5MB.';
        return true;
    };

    const onFileChange = (e) => {
        const { name, files: selected } = e.target;
        const file = selected?.[0] || null;
        const valid = validateFile(file);
        if (valid !== true) {
            toast.error(valid);
            e.target.value = '';
            return;
        }
        setFiles((prev) => ({ ...prev, [name]: file }));
    };

    const onSubmit = async (values) => {
        if (isReadOnly) {
            toast.info('Your KYC is under review. You cannot resubmit.');
            return;
        }
        if (!files.frontDoc || !files.selfie) {
            toast.error('Front document and selfie are required.');
            return;
        }

        setLoadingSubmit(true);
        try {
            const payload = new FormData();
            payload.append('fullName', values.fullName);
            payload.append('dob', values.dob);
            payload.append('nationality', values.nationality);
            payload.append('address', values.address);
            payload.append('idType', values.idType);
            payload.append('idNumber', values.idNumber);
            payload.append('frontDoc', files.frontDoc);
            if (files.backDoc) payload.append('backDoc', files.backDoc);
            payload.append('selfie', files.selfie);

            await api.post('/kyc/identity/submit', payload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('KYC submitted successfully.');
            setStatusData((prev) => ({ ...prev, status: 'pending' }));
            try {
                const refreshed = await api.get('/kyc/identity/status');
                const docs = Array.isArray(refreshed.data?.documents) ? refreshed.data.documents : [];
                setUploadedDocuments(docs);
                if (!docs.length && refreshed.data?.data) {
                    const d = refreshed.data.data;
                    const fallback = [];
                    if (d.frontDoc) fallback.push({ key: 'frontDoc', label: 'ID document (front)', url: d.frontDoc });
                    if (d.backDoc) fallback.push({ key: 'backDoc', label: 'ID document (back)', url: d.backDoc });
                    if (d.selfie) fallback.push({ key: 'selfie', label: 'Selfie with ID', url: d.selfie });
                    setUploadedDocuments(fallback);
                }
            } catch {
                /* non-fatal */
            }
            if (typeof refreshUser === 'function') {
                refreshUser().catch(() => {});
            }
        } catch (err) {
            if (err.response) {
                switch (err.response.status) {
                    case 400:
                        toast.error('Please fill all required fields correctly.');
                        break;
                    case 409:
                        toast.error('KYC already submitted. Please wait for review.');
                        break;
                    case 401:
                        toast.error('Session expired. Please login again.');
                        navigate('/login');
                        break;
                    case 413:
                        toast.error('File too large. Max size is 5MB.');
                        break;
                    case 415:
                        toast.error('Invalid file type. Use PDF, JPG or PNG only.');
                        break;
                    case 500:
                        toast.error('Server error. Please try again later.');
                        break;
                    default:
                        toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
                }
            } else if (err.request) {
                toast.error('Cannot connect to server. Check your internet.');
            } else {
                toast.error('Something went wrong. Please try again.');
            }
        } finally {
            setLoadingSubmit(false);
        }
    };

    const badge = {
        not_submitted: 'bg-gray-100 text-gray-700',
        pending: 'bg-yellow-100 text-yellow-800',
        verified: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-700'
    }[statusData.status] || 'bg-gray-100 text-gray-700';

    const currentIdType = watch('idType') || 'Citizenship';
    const currentIdNumber = (watch('idNumber') || '').trim();
    const currentIdMeta = idHints[currentIdType] || idHints.Citizenship;
    const hasIdError = Boolean(errors.idNumber);
    const isIdValid =
        !!currentIdNumber &&
        !hasIdError &&
        Boolean(
            idValidation[currentIdType]?.test(
                currentIdType === 'Passport' ? currentIdNumber : currentIdNumber.replace(/-/g, '')
            )
        );

    useEffect(() => {
        clearErrors('idNumber');
        if (currentIdNumber) {
            trigger('idNumber');
        }
    }, [currentIdType, currentIdNumber, clearErrors, trigger]);

    if (loadingStatus) {
        return <div className="p-6 text-sm text-gray-500">Loading KYC form...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
            <ToastContainer position="top-right" autoClose={3000} />

            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">KYC Identity Verification</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${badge}`}>
                    {statusData.status.replace('_', ' ')}
                </span>
            </div>

            {statusData.status === 'rejected' && statusData.adminNote && (
                <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg p-3">
                    Rejection reason: {statusData.adminNote}
                </p>
            )}

            {isPending && (
                <p className="mb-4 text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    Your KYC is under review. You cannot resubmit.
                </p>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold text-[#0a9e8f]">Section 1 - Personal Details</h2>
                    <input {...register('fullName')} disabled={isReadOnly} placeholder="Full Name" className="w-full border rounded-lg p-3" />
                    {errors.fullName && <p className="text-xs text-red-600">{errors.fullName.message}</p>}
                    <input type="date" {...register('dob')} disabled={isReadOnly} className="w-full border rounded-lg p-3" />
                    {errors.dob && <p className="text-xs text-red-600">{errors.dob.message}</p>}
                    <input {...register('nationality')} disabled={isReadOnly} placeholder="Nationality" className="w-full border rounded-lg p-3" />
                    {errors.nationality && <p className="text-xs text-red-600">{errors.nationality.message}</p>}
                    <input {...register('address')} disabled={isReadOnly} placeholder="Current Address (City, district)" className="w-full border rounded-lg p-3" />
                    {errors.address && <p className="text-xs text-red-600">{errors.address.message}</p>}
                </section>

                <section className="space-y-4">
                    <h2 className="text-lg font-semibold text-[#0a9e8f]">Section 2 - ID Information</h2>
                    <select {...register('idType')} disabled={isReadOnly} className="w-full border rounded-lg p-3 bg-white">
                        <option value="Citizenship">Citizenship</option>
                        <option value="Passport">Passport</option>
                        <option value="National ID">National ID</option>
                    </select>
                    {errors.idType && <p className="text-xs text-red-600">{errors.idType.message}</p>}
                    <div className="relative">
                        <input
                            {...register('idNumber')}
                            disabled={isReadOnly}
                            placeholder={currentIdMeta.placeholder}
                            className={`w-full rounded-lg p-3 pr-10 border transition-colors outline-none ${
                                hasIdError
                                    ? 'border-red-500 focus:border-red-500'
                                    : 'border-gray-300 focus:border-[#0a9e8f]'
                            }`}
                        />
                        {isIdValid && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600" aria-hidden>
                                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                                    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm4.59 7.59-5.5 5.5a1 1 0 0 1-1.42 0l-2.26-2.26a1 1 0 1 1 1.42-1.42l1.55 1.55 4.79-4.79a1 1 0 0 1 1.42 1.42Z" />
                                </svg>
                            </span>
                        )}
                    </div>
                    {hasIdError ? (
                        <>
                            <p className="text-xs text-red-600">{currentIdMeta.error}</p>
                            <p className="text-xs text-red-500">{currentIdMeta.example}</p>
                        </>
                    ) : (
                        <p className="text-xs text-gray-500">{currentIdMeta.hint}</p>
                    )}
                </section>

                <section className="space-y-4">
                    <h2 className="text-lg font-semibold text-[#0a9e8f]">Section 3 - Upload Documents</h2>
                    {showDocumentPreview && (
                        <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 space-y-3">
                            <h3 className="text-sm font-bold text-gray-800">Previously uploaded documents</h3>
                            <ul className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
                                {uploadedDocuments.map((doc) => {
                                    const href = resolveAssetUrl(doc.url);
                                    const img = isProbablyImageUrl(href);
                                    return (
                                        <li key={doc.key} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                                            <p className="text-xs font-semibold text-gray-700 mb-2">{doc.label}</p>
                                            {img ? (
                                                <a href={href} target="_blank" rel="noopener noreferrer" className="block">
                                                    <img
                                                        src={href}
                                                        alt={doc.label}
                                                        className="w-full max-h-40 object-contain rounded-md border border-gray-100 bg-gray-50"
                                                    />
                                                </a>
                                            ) : (
                                                <a
                                                    href={href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm font-medium text-[#0a9e8f] hover:underline break-all"
                                                >
                                                    Open file
                                                </a>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                    {showUploadInputs && (
                        <>
                            <input type="file" name="frontDoc" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={onFileChange} disabled={isReadOnly} />
                            <input type="file" name="backDoc" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={onFileChange} disabled={isReadOnly} />
                            <input type="file" name="selfie" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={onFileChange} disabled={isReadOnly} />
                            <p className="text-xs text-gray-500">Allowed: PDF, JPG, PNG up to 5MB.</p>
                        </>
                    )}
                </section>

                <div className="flex gap-3 justify-end">
                    <Link to="/seeker/dashboard" className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium">
                        Cancel
                    </Link>
                    {showSubmitButton && (
                        <button
                            type="submit"
                            disabled={isReadOnly || loadingSubmit}
                            className="px-6 py-2.5 rounded-lg bg-[#0a9e8f] text-white font-semibold disabled:opacity-60"
                        >
                            {loadingSubmit ? 'Submitting...' : 'Submit for Verification'}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default KYCForm;
