import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const KycGuard = ({ children, customMessage = null }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);

    // If approved, verify strictly
    const isApproved = user?.kycStatus === 'approved';

    if (isApproved) {
        return children;
    }

    const handleIntercept = (e) => {
        // Stop event from bubbling to parent or triggering default action
        e.preventDefault();
        e.stopPropagation();
        setShowModal(true);
    };

    const getMessage = () => {
        if (customMessage) return customMessage;
        if (user?.kycStatus === 'pending') return "Your KYC verification is currently under review. This action is restricted until approval.";
        if (user?.kycStatus === 'rejected') return "Your KYC verification was rejected. Please resubmit to access this feature.";
        return "You must complete your KYC verification to access this feature.";
    };

    const getButtonText = () => {
        if (user?.kycStatus === 'pending') return "Check Status";
        if (user?.kycStatus === 'rejected') return "Resubmit KYC";
        return "Complete KYC";
    };

    const getTargetLink = () => {
        return user?.role === 'recruiter' ? '/kyc/recruiter' : '/kyc/job-seeker';
    };

    return (
        <>
            {/* Wrapper that capturing clicks */}
            <div
                onClick={handleIntercept}
                className="inline-block relative cursor-not-allowed"
                title="KYC Verification Required"
            >
                {/* 
                   Disable pointer events on children so the click falls through to this wrapper.
                   Add opacity to visually indicate disabled state.
                */}
                <div className="pointer-events-none opacity-60 grayscale-[0.5]">
                    {children}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in"
                    onClick={(e) => {
                        // Close if clicking outside
                        if (e.target === e.currentTarget) setShowModal(false);
                    }}
                >
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center transform transition-all scale-100 border border-gray-100">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-sm
                            ${user?.kycStatus === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                            {user?.kycStatus === 'rejected' ? '❌' : '⚠️'}
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h3>
                        <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                            {getMessage()}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => navigate(getTargetLink())}
                                className="px-5 py-2.5 bg-[#29a08e] text-white font-bold rounded-xl hover:bg-[#228377] transition-colors shadow-lg shadow-[#29a08e]/20 text-sm"
                            >
                                {getButtonText()}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default KycGuard;
