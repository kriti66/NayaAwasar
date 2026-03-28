import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const getPostLoginPath = (role, kycStatus) => {
        const raw = location.state?.from;
        const safeFrom =
            typeof raw === 'string' && raw.startsWith('/') && !raw.startsWith('//') ? raw : null;

        if (role === 'admin') return '/admin/dashboard';

        const needsKyc =
            kycStatus === 'not_started' ||
            kycStatus === 'not_submitted' ||
            kycStatus === 'pending' ||
            kycStatus === 'rejected';
        if (needsKyc) return '/kyc';

        if (role === 'recruiter' && safeFrom) return safeFrom;
        if (role === 'recruiter') return '/recruiter/dashboard';
        return '/seeker/dashboard';
    };

    const handleSocialLoginSuccess = (result) => {
        if (result.success) {
            const storedUser = JSON.parse(localStorage.getItem('user'));
            const role = storedUser?.role;
            const kycStatus = storedUser?.kycStatus;
            navigate(getPostLoginPath(role, kycStatus));
        } else {
            setError(result.message || 'Social login failed. Please try again.');
            setLoading(false);
        }
    };

    const googleLoginAction = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setLoading(true);
            setError('');
            const result = await loginWithGoogle(tokenResponse.access_token);
            handleSocialLoginSuccess(result);
        },
        onError: error => {
            console.error('Google Login Error:', error);
            setError('Google login failed.');
        }
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await login(email, password);

        if (result.success) {
            const storedUser = JSON.parse(localStorage.getItem('user'));
            const role = storedUser?.role;
            const kycStatus = storedUser?.kycStatus;
            navigate(getPostLoginPath(role, kycStatus));
        } else {
            setError(result.message || 'Login failed. Please check your credentials.');
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4 py-12"
            style={{ background: 'linear-gradient(135deg, #f0fdf9 0%, #f8fafc 40%, #ecfdf5 100%)' }}
        >
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex items-center justify-center gap-2.5 mb-8">
                    <div className="w-10 h-10 bg-[#29a08e] text-white rounded-xl flex items-center justify-center shadow-md">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <span className="text-xl font-black text-gray-900 tracking-tight">
                        Naya <span className="text-[#29a08e]">Awasar</span>
                    </span>
                </div>

                {/* Heading */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
                    <p className="mt-1 text-sm text-gray-500">Sign in to continue your journey</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/60 border border-gray-100 p-7">
                    {error && (
                        <div className="mb-5 flex items-center gap-2.5 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
                            <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm text-red-700 font-medium">{error}</p>
                        </div>
                    )}

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 text-gray-900 placeholder-gray-400 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#29a08e]/30 focus:border-[#29a08e]"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                                <Link to="/forgot-password" className="text-xs font-medium text-[#29a08e] hover:text-[#228377] transition-colors">
                                    Forgot?
                                </Link>
                            </div>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    className="w-full px-4 py-2.5 pr-11 border border-gray-200 rounded-xl bg-gray-50/50 text-gray-900 placeholder-gray-400 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#29a08e]/30 focus:border-[#29a08e]"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Remember me */}
                        <div className="flex items-center gap-2">
                            <input
                                id="remember-me"
                                type="checkbox"
                                className="w-3.5 h-3.5 text-[#29a08e] border-gray-300 rounded focus:ring-[#29a08e] cursor-pointer"
                            />
                            <label htmlFor="remember-me" className="text-xs text-gray-500 cursor-pointer select-none">Remember me for 30 days</label>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 px-4 bg-[#29a08e] text-white rounded-xl font-semibold text-sm hover:bg-[#228377] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing in...
                                </>
                            ) : 'Sign In'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative flex items-center my-5">
                        <div className="flex-1 h-px bg-gray-100"></div>
                        <span className="px-3 text-xs text-gray-400">or</span>
                        <div className="flex-1 h-px bg-gray-100"></div>
                    </div>

                    {/* Social */}
                    <div className="space-y-3">
                        <button 
                            type="button"
                            onClick={() => googleLoginAction()}
                            className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] transition-all"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continue with Google
                        </button>
                    </div>
                </div>

                {/* Footer link */}
                <p className="mt-6 text-center text-sm text-gray-500">
                    Don't have an account?{' '}
                    <Link to="/register" className="font-semibold text-[#29a08e] hover:text-[#228377] transition-colors">
                        Create one free
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
