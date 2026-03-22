import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email;
    const otp = location.state?.otp;
    const hasRequiredState = Boolean(email && otp);

    useEffect(() => {
        if (!email || !otp) {
            navigate('/forgot-password', { replace: true });
        }
    }, [email, otp, navigate]);

    if (!hasRequiredState) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[#29a08e] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Redirecting...</p>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            const res = await api.post('/auth/reset-password-otp', { email, otp, newPassword: password });
            setSuccessMessage(res.data.message);
            setTimeout(() => navigate('/login', { replace: true }), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password.');
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
                    <div className="w-20 h-20 bg-[#29a08e]/20 border border-[#29a08e]/30 rounded-2xl flex items-center justify-center text-5xl mb-8">🔑</div>
                    <h2 className="text-4xl font-black text-white mb-4 leading-tight">
                        Create a New<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#29a08e] to-teal-300">Password</span>
                    </h2>
                    <p className="text-gray-400 leading-relaxed max-w-xs">
                        Choose a strong password that you haven't used before. Your account security matters.
                    </p>
                    <div className="mt-8 space-y-3">
                        {[
                            { icon: '✓', text: 'At least 6 characters long' },
                            { icon: '✓', text: 'Mix of letters and numbers recommended' },
                            { icon: '✓', text: 'Avoid using personal information' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <span className="w-5 h-5 bg-[#29a08e]/30 rounded-full flex items-center justify-center text-xs text-[#29a08e] font-bold">{item.icon}</span>
                                <span className="text-gray-300 text-sm font-medium">{item.text}</span>
                            </div>
                        ))}
                    </div>
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
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Set New Password</h1>
                    <p className="text-gray-500 mb-8">Create a strong, unique password for your account.</p>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        {successMessage && (
                            <div className="mb-6 flex items-start gap-3 bg-[#29a08e]/10 border border-[#29a08e]/20 p-4 rounded-xl">
                                <div className="w-5 h-5 bg-[#29a08e] rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <div>
                                    <p className="text-sm text-[#29a08e] font-medium">{successMessage}</p>
                                    <p className="text-xs text-[#29a08e] mt-1">Redirecting to login...</p>
                                </div>
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
                                <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-4 pr-10 text-gray-900 text-sm placeholder-gray-400"
                                        placeholder="Min. 6 characters"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-900 text-sm placeholder-gray-400"
                                    placeholder="••••••••"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading || !!successMessage}
                                className="w-full py-3.5 bg-[#29a08e] text-white rounded-xl font-bold text-sm hover:bg-[#228377] transition-all shadow-lg shadow-[#29a08e]/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Resetting...</>
                                ) : 'Reset Password'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
