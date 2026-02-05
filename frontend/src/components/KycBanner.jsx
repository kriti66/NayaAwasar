import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Non-blocking KYC info banner. Shown when user is not admin and kycStatus !== 'approved'.
 * Does not block dashboard access; only informs and links to /kyc.
 */
const KycBanner = () => {
    const { user } = useAuth();

    if (!user || user.role === 'admin' || user.kycStatus === 'approved') return null;

    const messages = {
        not_submitted: 'Please complete KYC to unlock job applications and posting.',
        pending: 'Your KYC is under review.',
        rejected: user.kycRejectionReason
            ? `KYC rejected: ${user.kycRejectionReason}`
            : 'KYC rejected. Please resubmit your documents.'
    };
    const message = messages[user.kycStatus] || messages.not_submitted;
    const isRejected = user.kycStatus === 'rejected';
    const isPending = user.kycStatus === 'pending';

    return (
        <div
            className={`mb-6 rounded-lg border px-4 py-3 flex flex-wrap items-center justify-between gap-3 ${isRejected
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : isPending
                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                        : 'bg-blue-50 border-blue-200 text-blue-800'
                }`}
        >
            <p className="text-sm font-medium">{message}</p>
            <Link
                to={user.role === 'recruiter' ? '/kyc/recruiter' : '/kyc/job-seeker'}
                className="text-sm font-semibold underline hover:no-underline whitespace-nowrap"
            >
                {isRejected ? 'Resubmit KYC' : 'Complete KYC'}
            </Link>
        </div>
    );
};

export default KycBanner;
