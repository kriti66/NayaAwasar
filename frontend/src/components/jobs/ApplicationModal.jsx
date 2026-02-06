import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { X, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const ApplicationModal = ({ job, onClose, onSuccess }) => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [coverLetter, setCoverLetter] = useState(`I am writing to express my interest in the ${job.title} position at ${job.company_name}.`);
    const [resumeType, setResumeType] = useState('Generated'); // 'Generated' or 'Uploaded'
    const [resumeFile, setResumeFile] = useState(null);
    const [profileResume, setProfileResume] = useState(null);

    // Fetch user profile to check for existing generated resume
    useEffect(() => {
        const fetchProfileResume = async () => {
            try {
                const res = await api.get('/profile/me');
                if (res.data?.resume) {
                    setProfileResume(res.data.resume);
                    // Default to Uploaded if source is uploaded, Generated if generated
                    if (res.data.resume.source === 'generated') {
                        setResumeType('Generated');
                    } else {
                        // Even if they have an uploaded profile resume, we allow them to select new upload or use it. 
                        // But for simplicity in this modal, 'Generated' implies internal system resume.
                        // Let's refine: 
                        // If they have a system-generated resume, we offer 'Generated'.
                        // We also offer 'Uploaded' (Custom).
                    }
                }
            } catch (error) {
                console.error("Error fetching profile resume:", error);
            }
        };
        fetchProfileResume();
    }, []);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setResumeFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('job_id', job._id || job.id);
            formData.append('coverLetter', coverLetter);
            formData.append('resumeType', resumeType);

            if (resumeType === 'Uploaded' && resumeFile) {
                formData.append('resume', resumeFile);
            }

            // Note: Axios detects FormData and sets 'Content-Type': 'multipart/form-data' automatically
            await api.post('/applications/apply', formData);

            onSuccess();
        } catch (error) {
            console.error("Application submission error:", error);
            const errorData = error.response?.data || {};
            const code = errorData.code;
            const msg = errorData.message || "Failed to apply.";

            if (code === 'KYC_REQUIRED') {
                toast.error(msg);
                onClose(); // Hide modal
                navigate('/kyc/status');
            } else if (code === 'RESUME_REQUIRED' || code === 'SKILLS_REQUIRED' || code === 'PROFILE_WEAK') {
                toast.error(msg);
                onClose();
                navigate('/seeker/profile');
            } else {
                toast.error(msg);
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} aria-hidden="true"></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">

                    {/* Header */}
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-100">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                Apply for {job.title}
                            </h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                            {job.company_name} • {job.location}
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        <div className="px-4 py-5 sm:p-6 space-y-6">

                            {/* Resume Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">Resume</label>
                                <div className="space-y-3">

                                    {/* Option 1: Generated CV */}
                                    <div className={`relative flex items-start p-4 border rounded-lg cursor-pointer ${resumeType === 'Generated' ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}`}
                                        onClick={() => setResumeType('Generated')}>
                                        <div className="flex items-center h-5">
                                            <input
                                                type="radio"
                                                name="resumeType"
                                                checked={resumeType === 'Generated'}
                                                onChange={() => setResumeType('Generated')}
                                                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                                            />
                                        </div>
                                        <div className="ml-3 text-sm">
                                            <label className="font-medium text-gray-900 cursor-pointer">
                                                Use my Naya Awasar CV
                                            </label>
                                            <p className="text-gray-500">
                                                {profileResume?.source === 'generated' ?
                                                    `Last updated: ${new Date(profileResume.lastGeneratedAt || profileResume.uploadedAt).toLocaleDateString()}` :
                                                    'No generated CV found. You might need to generate one in your profile first.'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Option 2: Upload New */}
                                    <div className={`relative flex items-start p-4 border rounded-lg cursor-pointer ${resumeType === 'Uploaded' ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}`}
                                        onClick={() => setResumeType('Uploaded')}>
                                        <div className="flex items-center h-5">
                                            <input
                                                type="radio"
                                                name="resumeType"
                                                checked={resumeType === 'Uploaded'}
                                                onChange={() => setResumeType('Uploaded')}
                                                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                                            />
                                        </div>
                                        <div className="ml-3 text-sm w-full">
                                            <label className="font-medium text-gray-900 cursor-pointer">
                                                Upload a custom resume
                                            </label>
                                            <p className="text-gray-500 mb-2">Upload a specific resume for this job (PDF, DOCX)</p>

                                            {resumeType === 'Uploaded' && (
                                                <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="file"
                                                        accept=".pdf,.doc,.docx"
                                                        onChange={handleFileChange}
                                                        className="block w-full text-sm text-gray-500
                                                            file:mr-4 file:py-2 file:px-4
                                                            file:rounded-full file:border-0
                                                            file:text-sm file:font-semibold
                                                            file:bg-blue-50 file:text-blue-700
                                                            hover:file:bg-blue-100"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Cover Letter */}
                            <div>
                                <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700 mb-2">
                                    Cover Letter
                                </label>
                                <textarea
                                    id="coverLetter"
                                    rows={5}
                                    className="shadow-sm block w-full focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md p-3"
                                    value={coverLetter}
                                    onChange={(e) => setCoverLetter(e.target.value)}
                                    placeholder="Explain why you are the best fit for this role..."
                                />
                            </div>

                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-100">
                            <button
                                type="submit"
                                disabled={submitting}
                                className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {submitting ? 'Submitting...' : 'Submit Application'}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={submitting}
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ApplicationModal;
