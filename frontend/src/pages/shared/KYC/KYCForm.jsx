import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../../../services/api';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const allowedFileTypes = ['image/jpeg', 'image/png', 'application/pdf'];

const idValidation = {
    Citizenship: /^[0-9]{7,9}$/,
    Passport: /^(?:[A-Za-z]{1,2}[0-9]{6,7}|[0-9]{8,9})$/,
    'Driving License': /^[A-Za-z0-9-]+$/,
    'Voter ID': /^[0-9]{10,11}$/,
    'PAN Card': /^[0-9]{9}$/
};

const idTypeMeta = {
    Citizenship: {
        placeholder: 'e.g. 12-34-56-78901',
        hint: 'Numeric only · 7 to 9 digits',
        error: 'Citizenship number must be 7–9 digits (numbers only).',
        example: 'Example: 1234567 or 123456789'
    },
    Passport: {
        placeholder: 'e.g. AB1234567',
        hint: 'Starts with 2 letters + 7 numbers',
        error: 'Passport must start with letters followed by numbers (8–9 chars).',
        example: 'Example: AB1234567'
    },
    'Driving License': {
        placeholder: 'e.g. DL-123-456789',
        hint: 'Alphanumeric · issued by DOTM Nepal',
        error: 'Invalid Driving License format.',
        example: 'Example: DL-123-456789'
    },
    'Voter ID': {
        placeholder: 'e.g. 12345678901',
        hint: 'Numeric only · 10 to 11 digits',
        error: 'Voter ID must be 10–11 digits (numbers only).',
        example: 'Example: 12345678901'
    },
    'PAN Card': {
        placeholder: 'e.g. 123456789',
        hint: 'Numeric only · exactly 9 digits',
        error: 'PAN Card must be exactly 9 digits.',
        example: 'Example: 123456789'
    }
};

const formSchema = z
    .object({
        fullName: z.string().min(1, 'Full Name is required').refine((v) => !/[0-9]/.test(v), 'No numbers allowed in Full Name'),
        dob: z.string().min(1, 'Date of Birth is required'),
        nationality: z.string().min(1, 'Nationality is required'),
        address: z.string().min(1, 'Current Address is required'),
        idType: z.enum(['Citizenship', 'Passport', 'Driving License', 'Voter ID', 'PAN Card']),
        idNumber: z.string().min(1, 'ID Number is required')
    })
    .superRefine((data, ctx) => {
        const minAgeDate = new Date();
        minAgeDate.setFullYear(minAgeDate.getFullYear() - 18);
        if (new Date(data.dob) > minAgeDate) {
            ctx.addIssue({ code: 'custom', path: ['dob'], message: 'You must be 18+ years old.' });
        }
        const pattern = idValidation[data.idType];
        if (pattern && !pattern.test(data.idNumber.trim())) {
            ctx.addIssue({ code: 'custom', path: ['idNumber'], message: `Invalid ${data.idType} format.` });
        }
    });

const KYCForm = () => {
    const navigate = useNavigate();
    const [statusData, setStatusData] = useState({ status: 'not_submitted', adminNote: '' });
    const [loadingStatus, setLoadingStatus] = useState(true);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [files, setFiles] = useState({ frontDoc: null, backDoc: null, selfie: null });

    const isReadOnly = useMemo(
        () => statusData.status === 'pending' || statusData.status === 'verified',
        [statusData.status]
    );

    const {
        register,
        handleSubmit,
        setValue,
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
                if (res.data?.data) {
                    const d = res.data.data;
                    setValue('fullName', d.fullName || '');
                    setValue('dob', d.dob ? new Date(d.dob).toISOString().slice(0, 10) : '');
                    setValue('nationality', d.nationality || 'Nepali');
                    setValue('address', d.address || '');
                    setValue('idType', d.idType || 'Citizenship');
                    setValue('idNumber', d.idNumber || '');
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
    const currentIdMeta = idTypeMeta[currentIdType] || idTypeMeta.Citizenship;
    const hasIdError = Boolean(errors.idNumber);
    const isIdValid =
        !!currentIdNumber &&
        !hasIdError &&
        Boolean(idValidation[currentIdType]?.test(currentIdNumber));

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

            {isReadOnly && (
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
                        <option value="Driving License">Driving License</option>
                        <option value="Voter ID">Voter ID</option>
                        <option value="PAN Card">PAN Card</option>
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
                    <input type="file" name="frontDoc" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={onFileChange} disabled={isReadOnly} />
                    <input type="file" name="backDoc" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={onFileChange} disabled={isReadOnly} />
                    <input type="file" name="selfie" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={onFileChange} disabled={isReadOnly} />
                    <p className="text-xs text-gray-500">Allowed: PDF, JPG, PNG up to 5MB.</p>
                </section>

                <div className="flex gap-3 justify-end">
                    <Link to="/seeker/dashboard" className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium">
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={isReadOnly || loadingSubmit}
                        className="px-6 py-2.5 rounded-lg bg-[#0a9e8f] text-white font-semibold disabled:opacity-60"
                    >
                        {loadingSubmit ? 'Submitting...' : 'Submit for Verification'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default KYCForm;
