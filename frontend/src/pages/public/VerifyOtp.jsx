import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

const VerifyOtp = () => {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    
    const location = useLocation();
    const navigate = useNavigate();
    
    const email = location.state?.email;
    const initialMessage = location.state?.message;

    useEffect(() => {
        if (!email) {
            navigate('/forgot-password');
        }
        if (initialMessage) {
            setSuccessMessage(initialMessage);
        }
    }, [email, navigate, initialMessage]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const res = await api.post('/auth/verify-otp', { email, otp });
            // Redirect to Reset Password page, passing email and otp via state
            navigate('/reset-password', { state: { email, otp, message: res.data.message } });
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center mb-6">
                    <div className="bg-[#29a08e] text-white p-3 rounded-xl shadow-lg shadow-[#29a08e]/20">
                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                </div>
                <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
                    Verify OTP
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Enter the 6-digit OTP sent to <span className="font-bold">{email}</span>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-gray-100">
                    {successMessage && (
                        <div className="mb-4 bg-[#29a08e]/10 border border-[#29a08e]/20 p-3 rounded-lg flex items-center gap-2">
                             <svg className="h-4 w-4 text-[#29a08e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <p className="text-sm text-[#29a08e]">{successMessage}</p>
                        </div>
                    )}
                    
                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 p-3 rounded-lg flex items-center gap-2">
                            <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                                6-Digit OTP
                            </label>
                            <div className="mt-1">
                                <input
                                    id="otp"
                                    name="otp"
                                    type="text"
                                    required
                                    maxLength="6"
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#29a08e] focus:border-[#29a08e] sm:text-lg text-center tracking-widest"
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || otp.length < 6}
                            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-[#29a08e] hover:bg-[#228377] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#29a08e] disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Verifying...' : 'Verify OTP'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                         <Link to="/forgot-password" className="font-medium text-[#29a08e] hover:text-[#228377]">
                            Did not receive code? Resend
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyOtp;
