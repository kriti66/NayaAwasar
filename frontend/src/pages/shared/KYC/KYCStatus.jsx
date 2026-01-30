import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';

const KYCStatus = () => {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [rejectionReason, setRejectionReason] = useState(user?.rejectionReason || '');

    useEffect(() => {
        refreshUser();
    }, []);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await api.get('/kyc/status');
                if (res.data.rejectionReason) setRejectionReason(res.data.rejectionReason);
            } catch (_) {}
        };
        fetchStatus();
    }, []);

    // If KYC not started, redirect to appropriate form
    if (user?.kycStatus === 'not_started') {
        if (user.role === 'recruiter') {
            navigate('/kyc/recruiter', { replace: true });
        } else {
            navigate('/kyc/job-seeker', { replace: true });
        }
        return null;
    }

    const renderStatus = () => {
        switch (user?.kycStatus) {
            case 'pending':
                return (
                    <div className="text-center p-8 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="text-yellow-600 text-5xl mb-4 text-center">⏳</div>
                        <h2 className="text-2xl font-bold text-yellow-800 mb-2">Verification in Progress</h2>
                        <p className="text-yellow-700">
                            Your KYC documents are currently under review. This usually takes 24-48 hours.
                            We'll notify you once your account is verified.
                        </p>
                        <div className="mt-6">
                            <Link to="/" className="text-yellow-800 font-semibold hover:underline">
                                Go back Home
                            </Link>
                        </div>
                    </div>
                );
            case 'rejected':
                return (
                    <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200">
                        <div className="text-red-600 text-5xl mb-4 text-center">❌</div>
                        <h2 className="text-2xl font-bold text-red-800 mb-2">Verification Rejected</h2>
                        <p className="text-red-700 mb-4">
                            Unfortunately, your KYC verification was rejected for the following reason:
                        </p>
                        <div className="bg-white p-4 rounded border border-red-100 mb-6 italic text-red-600">
                            "{rejectionReason || user?.rejectionReason || 'No specific reason provided.'}"
                        </div>
                        <button
                            onClick={() => navigate(user?.role === 'recruiter' ? '/kyc/recruiter' : '/kyc/job-seeker')}
                            className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition"
                        >
                            Re-upload Documents
                        </button>
                    </div>
                );
            case 'verified':
                return (
                    <div className="text-center p-8 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-green-600 text-5xl mb-4 text-center">✅</div>
                        <h2 className="text-2xl font-bold text-green-800 mb-2">Account Verified</h2>
                        <p className="text-green-700 mb-6">
                            Congratulations! Your account has been verified. You now have full access to the portal.
                        </p>
                        <button
                            onClick={() => navigate(user?.role === 'recruiter' ? '/recruiter/dashboard' : '/seeker/dashboard')}
                            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                <h1 className="text-center text-3xl font-extrabold text-gray-900 mb-8 border-b pb-4">
                    Verification Status
                </h1>
                {renderStatus()}
            </div>
        </div>
    );
};

export default KYCStatus;
