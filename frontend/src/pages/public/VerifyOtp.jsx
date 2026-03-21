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
        if (!email) navigate('/forgot-password');
        if (initialMessage) setSuccessMessage(initialMessage);
    }, [email, navigate, initialMessage]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            const res = await api.post('/auth/verify-otp', { email, otp });
            navigate('/reset-password', { state: { email, otp, message: res.data.message } });
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-[#0d2f2b] to-slate-900 flex-col justify-center p-16 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-[#29a08e] rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-10 w-64 h-64 bg-teal-400 rounded-full blur-3xl"></div>
                </div>
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '28px 28px' }}></div>
                <div className="relative">
                    <Link to="/" className="flex items-center gap-2.5 mb-16">
                        <div className="w-10 h-10 bg-[#29a08e] text-white rounded-xl flex items-center justify-center shadow-lg shadow-[#29a08e]/30">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </div>
                        <span className="text-xl font-black text-white">Naya <span className="text-[#29a08e]">Awasar</span></span>
                    </Link>
                    <div className="w-20 h-20 bg-[#29a08e]/20 border border-[#29a08e]/30 rounded-2xl flex items-center justify-center text-5xl mb-8">📱</div>
                    <h2 className="text-4xl font-black text-white mb-4 leading-tight">
                        Check Your<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#29a08e] to-teal-300">Email Inbox</span>
                    </h2>
                    <p className="text-gray-400 leading-relaxed max-w-xs">
                        We've sent a 6-digit verification code to your email. Enter it below to continue.
                    </p>
                </div>
            </div>

            {/* Right Panel */}
            <div className="flex-1 flex flex-col justify-center items-center bg-[#f8fafc] px-6 py-12">
                <div className="w-full max-w-md">
                    <div className="flex items-center gap-2 mb-6 lg:hidden">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="w-9 h-9 bg-[#29a08e] text-white rounded-xl flex items-center justify-center">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            </div>
                            <span className="text-lg font-black text-gray-900">Naya <span className="text-[#29a08e]">Awasar</span></span>
                        </Link>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Verify OTP</h1>
                    <p className="text-gray-500 mb-8">Enter the 6-digit code sent to <span className="font-bold text-gray-700">{email}</span></p>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        {successMessage && (
                            <div className="mb-6 flex items-start gap-3 bg-[#29a08e]/10 border border-[#29a08e]/20 p-4 rounded-xl">
                                <div className="w-5 h-5 bg-[#29a08e] rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <p className="text-sm text-[#29a08e] font-medium">{successMessage}</p>
                            </div>
                        )}
                        {error && (
                            <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 p-4 rounded-xl">
                                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                </div>
                                <p className="text-sm text-red-700 font-medium">{error}</p>
                            </div>
                        )}

                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">6-Digit OTP</label>
                                <input
                                    type="text"
                                    maxLength="6"
                                    required
                                    className="w-full text-center text-2xl tracking-[0.5em] font-black bg-gray-50 border border-gray-200 rounded-xl py-4 px-4 text-gray-900 placeholder-gray-300"
                                    placeholder="••••••"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading || otp.length < 6}
                                className="w-full py-3.5 bg-[#29a08e] text-white rounded-xl font-bold text-sm hover:bg-[#228377] transition-all shadow-lg shadow-[#29a08e]/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Verifying...</>
                                ) : 'Verify OTP'}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <Link to="/forgot-password" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-[#29a08e] transition-colors">
                                Didn't receive code? Resend
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyOtp;
