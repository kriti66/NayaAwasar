import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** @returns {{ isValid: boolean, errors: string[] }} */
function validatePassword(password) {
    const p = password ?? '';
    const errors = [];
    if (p.length < 8) {
        errors.push('Minimum 8 characters');
    }
    if (!/[A-Z]/.test(p)) {
        errors.push('1 uppercase letter required');
    }
    if (!/[0-9]/.test(p)) {
        errors.push('1 number required');
    }
    if (!/[@#!$%^&*]/.test(p)) {
        errors.push('1 special character required');
    }
    return { isValid: errors.length === 0, errors };
}

function validateConfirmPassword(password, confirmPassword) {
    const c = confirmPassword ?? '';
    if (!c) return { isValid: false, state: 'idle', error: '' };
    if (c === password) return { isValid: true, state: 'match', error: '' };
    return { isValid: false, state: 'mismatch', error: 'Passwords do not match.' };
}

function resetFormForRoleChange(formData, role) {
    return {
        ...formData,
        role,
        password: '',
        confirmPassword: '',
    };
}

const steps = [
    { id: 1, label: 'Role', icon: '🎯' },
    { id: 2, label: 'Account', icon: '✏️' },
    { id: 3, label: 'Info', icon: '💡' },
    { id: 4, label: 'Confirm', icon: '✅' },
];

const Register = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'jobseeker',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [touched, setTouched] = useState({});
    const [step2SubmitAttempted, setStep2SubmitAttempted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [otpStage, setOtpStage] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [otpEmail, setOtpEmail] = useState('');
    const [otpCooldown, setOtpCooldown] = useState(0);
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState('');
    const [searchParams] = useSearchParams();
    const { register, verifySignupOtp, resendSignupOtp } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const roleParam = searchParams.get('role');
        if (roleParam === 'recruiter' || roleParam === 'jobseeker') {
            setFormData(prev => ({ ...prev, role: roleParam }));
        }
    }, [searchParams]);

    useEffect(() => {
        const raw = sessionStorage.getItem('pendingSignup');
        if (!raw) return;
        try {
            const parsed = JSON.parse(raw);
            if (!parsed?.email || !parsed?.expiresAt) return;
            if (Date.now() > parsed.expiresAt) {
                sessionStorage.removeItem('pendingSignup');
                return;
            }
            setOtpStage(true);
            setOtpEmail(parsed.email);
            if (typeof parsed.cooldownUntil === 'number') {
                setOtpCooldown(Math.max(0, Math.ceil((parsed.cooldownUntil - Date.now()) / 1000)));
            }
            if (parsed.role) {
                setFormData((prev) => ({ ...prev, role: parsed.role }));
            }
        } catch {
            sessionStorage.removeItem('pendingSignup');
        }
    }, []);

    useEffect(() => {
        if (otpCooldown <= 0) return;
        const timer = setInterval(() => {
            setOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [otpCooldown]);

    const getStep2Validation = (data = formData) => {
        const next = {
            name: '',
            email: '',
            password: [],
            confirmPassword: '',
        };

        if (!data.name.trim()) next.name = 'Full name is required.';
        const trimmedEmail = data.email.trim();
        if (!trimmedEmail) next.email = 'Email is required.';
        else if (!EMAIL_REGEX.test(trimmedEmail)) next.email = 'Please enter a valid email address.';

        if (!data.password) {
            next.password = ['Password is required.'];
        } else {
            const pwdValidation = validatePassword(data.password);
            next.password = pwdValidation.errors;
        }

        if (!data.confirmPassword) {
            next.confirmPassword = 'Please confirm your password.';
        } else {
            const confirmValidation = validateConfirmPassword(data.password, data.confirmPassword);
            if (!confirmValidation.isValid && confirmValidation.error) {
                next.confirmPassword = confirmValidation.error;
            }
        }

        const isValid =
            !next.name &&
            !next.email &&
            next.password.length === 0 &&
            !next.confirmPassword;
        return { isValid, errors: next };
    };

    const handleNext = () => {
        if (currentStep === 2) {
            setStep2SubmitAttempted(true);
            setTouched({
                name: true,
                email: true,
                password: true,
                confirmPassword: true,
            });
            const validation = getStep2Validation();
            if (!validation.isValid) {
                setError('');
                return;
            }
        }
        setError('');
        setCurrentStep((prev) => prev + 1);
    };

    const handleBack = () => {
        setError('');
        setCurrentStep(prev => prev - 1);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError('');
    };

    const markTouched = (field) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
    };

    const handleRoleSelect = (role) => {
        if (formData.role === role) return;
        setFormData((prev) => resetFormForRoleChange(prev, role));
        setTouched({});
        setStep2SubmitAttempted(false);
        setError('');
        if (currentStep > 2) {
            setCurrentStep(2);
        }
    };

    const handleSubmit = async () => {
        const validation = getStep2Validation();
        if (!validation.isValid) {
            setStep2SubmitAttempted(true);
            setTouched({
                name: true,
                email: true,
                password: true,
                confirmPassword: true,
            });
            setCurrentStep(2);
            setError('');
            return;
        }
        setLoading(true);
        setError('');
        setSuccessMessage('');
        const result = await register({
            fullName: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role
        });

        if (result.success) {
            const cooldownSec = result.data?.resendAvailableIn || 60;
            const cooldownUntil = Date.now() + cooldownSec * 1000;
            const expiresAt = Date.now() + 10 * 60 * 1000;
            setOtpStage(true);
            setOtpEmail(formData.email.toLowerCase().trim());
            setOtpCooldown(cooldownSec);
            setOtpCode('');
            sessionStorage.setItem('pendingSignup', JSON.stringify({
                email: formData.email.toLowerCase().trim(),
                role: formData.role,
                cooldownUntil,
                expiresAt
            }));
            setLoading(false);
        } else {
            setError(result.message);
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otpCode.trim()) {
            setError('Please enter the OTP sent to your email.');
            return;
        }
        setLoading(true);
        setError('');
        setSuccessMessage('');
        const result = await verifySignupOtp({ email: otpEmail, otp: otpCode.trim() });
        if (result.success) {
            sessionStorage.removeItem('pendingSignup');
            setSuccessMessage('Account created successfully. Redirecting to login...');
            setLoading(false);
            setTimeout(() => navigate('/login', { replace: true }), 1200);
            return;
        }
        setError(result.message || 'OTP verification failed');
        setLoading(false);
    };

    const handleResendOtp = async () => {
        if (otpCooldown > 0 || !otpEmail) return;
        setLoading(true);
        setError('');
        setSuccessMessage('');
        const result = await resendSignupOtp(otpEmail);
        if (result.success) {
            const cooldownSec = result.data?.resendAvailableIn || 60;
            const cooldownUntil = Date.now() + cooldownSec * 1000;
            setOtpCooldown(cooldownSec);
            const current = sessionStorage.getItem('pendingSignup');
            if (current) {
                try {
                    const parsed = JSON.parse(current);
                    sessionStorage.setItem('pendingSignup', JSON.stringify({
                        ...parsed,
                        cooldownUntil
                    }));
                } catch {
                    // ignore malformed cache
                }
            }
        } else {
            setError(result.message || 'Failed to resend OTP');
            if (result.resendAvailableIn) {
                setOtpCooldown(result.resendAvailableIn);
            }
        }
        setLoading(false);
    };

    const seekerTips = [
        { icon: '📸', tip: 'Add a professional profile photo to get 3x more views.' },
        { icon: '💼', tip: 'Complete your work experience section to stand out.' },
        { icon: '🎓', tip: 'List your skills and certifications to get matched better.' },
        { icon: '📄', tip: 'Upload your latest resume for one-click applications.' },
    ];

    const recruiterTips = [
        { icon: '🏢', tip: 'Complete your company profile to attract top talent.' },
        { icon: '✅', tip: 'Verify your KYC to unlock all posting features.' },
        { icon: '🎯', tip: 'Add detailed job descriptions for higher quality applications.' },
        { icon: '📊', tip: 'Use our screening tools to shortlist faster.' },
    ];

    const currentTips = formData.role === 'jobseeker' ? seekerTips : recruiterTips;

    const validation = getStep2Validation();
    const emailInvalid = !!validation.errors.email;
    const passwordResult = validatePassword(formData.password);
    const confirmValidation = validateConfirmPassword(formData.password, formData.confirmPassword);
    const confirmState = confirmValidation.state;

    const nameBorderClass =
        (touched.name || step2SubmitAttempted) && !!validation.errors.name
            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
            : 'border-gray-200 focus:border-gray-300 focus:ring-0';

    const emailBorderClass =
        (touched.email || step2SubmitAttempted) && emailInvalid
            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
            : 'border-gray-200 focus:border-gray-300 focus:ring-0';

    const passwordBorderClass = (() => {
        const shouldShowPasswordErrors = touched.password || step2SubmitAttempted;
        if (passwordResult.isValid && formData.password) {
            return 'border-emerald-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20';
        }
        if (shouldShowPasswordErrors && !passwordResult.isValid) {
            return 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20';
        }
        if (passwordFocused) {
            return 'border-[#29a08e] focus:border-[#29a08e] focus:ring-2 focus:ring-[#29a08e]/25';
        }
        return 'border-gray-200 focus:border-gray-300 focus:ring-0';
    })();

    const confirmBorderClass =
        confirmState === 'match'
            ? 'border-emerald-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
            : (confirmState === 'mismatch' || (step2SubmitAttempted && !formData.confirmPassword))
              ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
              : 'border-gray-200 focus:border-gray-300 focus:ring-0';

    const defaultPasswordHelper =
        'Use 8+ chars, 1 uppercase, 1 number, 1 special char';

    const nameErrorMsg =
        (touched.name || step2SubmitAttempted) && validation.errors.name ? validation.errors.name : null;

    const emailErrorMsg =
        touched.email || step2SubmitAttempted
            ? validation.errors.email
            : null;

    const confirmFeedback = (() => {
        if (confirmState === 'match') {
            return { tone: 'ok', text: 'Passwords match' };
        }
        if (confirmState === 'mismatch') {
            return { tone: 'err', text: 'Passwords do not match' };
        }
        if (step2SubmitAttempted && !formData.confirmPassword) {
            return { tone: 'err', text: 'Please confirm your password.' };
        }
        return null;
    })();

    return (
        <div className="min-h-screen flex">
            {/* Left Decorative Panel */}
            <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-slate-900 via-[#0d2f2b] to-slate-900 flex-col justify-between p-12 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-[#29a08e] rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-10 w-64 h-64 bg-teal-400 rounded-full blur-3xl"></div>
                </div>
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '28px 28px' }}></div>

                <div className="relative">
                    <Link to="/" className="flex items-center gap-2.5">
                        <div className="w-10 h-10 bg-[#29a08e] text-white rounded-xl flex items-center justify-center shadow-lg shadow-[#29a08e]/30">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <span className="text-xl font-black text-white">Naya <span className="text-[#29a08e]">Awasar</span></span>
                    </Link>
                </div>

                <div className="relative space-y-8">
                    <div>
                        <h2 className="text-4xl font-black text-white leading-tight mb-4">
                            Start Your
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#29a08e] to-teal-300">
                                Career Journey
                            </span>
                        </h2>
                        <p className="text-gray-400 leading-relaxed">
                            Create your free account in minutes and join Nepal's fastest-growing job network.
                        </p>
                    </div>

                    {/* Benefits */}
                    <div className="space-y-4">
                        {[
                            { icon: '🤖', text: 'AI-powered job matching tailored to you' },
                            { icon: '🔒', text: 'Verified, trusted employers only' },
                            { icon: '⚡', text: 'Apply to jobs instantly with one click' },
                            { icon: '📊', text: 'Track all your applications in one place' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <span className="text-xl">{item.icon}</span>
                                <span className="text-gray-300 text-sm font-medium">{item.text}</span>
                            </div>
                        ))}
                    </div>

                    {/* Social proof */}
                    <div className="bg-white/10 border border-white/15 rounded-2xl p-4">
                        <div className="flex -space-x-2 mb-3">
                            {['RT', 'PS', 'AK'].map((initial, i) => (
                                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-[#29a08e] to-teal-700 border-2 border-slate-900 flex items-center justify-center text-white text-xs font-bold">
                                    {initial}
                                </div>
                            ))}
                        </div>
                        <p className="text-gray-200 text-sm font-medium">
                            <span className="text-white font-bold">12,000+</span> professionals hired this month alone
                        </p>
                    </div>
                </div>

                <p className="relative text-gray-600 text-xs">&copy; {new Date().getFullYear()} Naya Awasar</p>
            </div>

            {/* Right Form Panel */}
            <div className="flex-1 flex flex-col justify-center items-center bg-[#f8fafc] px-6 py-12 overflow-y-auto">
                <div className="w-full max-w-xl">
                    {/* Mobile Logo */}
                    <div className="flex items-center gap-2 mb-8 lg:hidden">
                        <div className="w-9 h-9 bg-[#29a08e] text-white rounded-xl flex items-center justify-center">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <span className="text-lg font-black text-gray-900">Naya <span className="text-[#29a08e]">Awasar</span></span>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Create Account</h1>
                        <p className="mt-2 text-gray-500">It's free and takes less than 2 minutes</p>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center mb-8">
                        {steps.map((step, i) => (
                            <div key={step.id} className="flex items-center flex-1 last:flex-none">
                                <div className="flex flex-col items-center">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black transition-all ${
                                        currentStep > step.id ? 'bg-[#29a08e] text-white shadow-md shadow-[#29a08e]/20' :
                                        currentStep === step.id ? 'bg-[#29a08e] text-white shadow-lg shadow-[#29a08e]/30 scale-110' :
                                        'bg-gray-100 text-gray-400'
                                    }`}>
                                        {currentStep > step.id ? (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : step.id}
                                    </div>
                                    <span className={`text-[10px] font-bold mt-1.5 ${currentStep === step.id ? 'text-[#29a08e]' : 'text-gray-400'}`}>
                                        {step.label}
                                    </span>
                                </div>
                                {i < steps.length - 1 && (
                                    <div className={`flex-1 h-0.5 mx-2 transition-all ${currentStep > step.id ? 'bg-[#29a08e]' : 'bg-gray-200'}`}></div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Form Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        {otpStage ? (
                            <div className="space-y-6 animate-fade-in">
                                <div>
                                    <h3 className="text-xl font-black text-gray-900">Verify your email</h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Enter the 6-digit OTP sent to <span className="font-semibold text-gray-700">{otpEmail}</span>
                                    </p>
                                </div>

                                {error && (
                                    <div className="flex items-start gap-3 bg-red-50 border border-red-200 p-4 rounded-xl">
                                        <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </div>
                                        <p className="text-sm text-red-700 font-medium">{error}</p>
                                    </div>
                                )}
                                {successMessage && (
                                    <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                                        <p className="text-sm text-emerald-700 font-medium">{successMessage}</p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">OTP Code</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-900 text-sm tracking-[0.3em] font-bold text-center"
                                        placeholder="000000"
                                    />
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <button
                                        type="button"
                                        onClick={handleResendOtp}
                                        disabled={loading || otpCooldown > 0}
                                        className="font-bold text-[#29a08e] disabled:text-gray-400 disabled:cursor-not-allowed"
                                    >
                                        {otpCooldown > 0 ? `Resend OTP in ${otpCooldown}s` : 'Resend OTP'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            sessionStorage.removeItem('pendingSignup');
                                            setOtpStage(false);
                                            setOtpCode('');
                                            setOtpCooldown(0);
                                            setError('');
                                            setCurrentStep(2);
                                        }}
                                        className="text-gray-500 font-semibold hover:text-gray-700"
                                    >
                                        Edit details
                                    </button>
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="button"
                                        onClick={handleVerifyOtp}
                                        disabled={loading}
                                        className="w-full flex items-center justify-center gap-2 px-8 py-2.5 bg-[#29a08e] text-white rounded-xl text-sm font-bold hover:bg-[#228377] transition-all shadow-md shadow-[#29a08e]/20 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <>
                                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                                </svg>
                                                Verifying...
                                            </>
                                        ) : (
                                            'Verify OTP & Create Account'
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                        <>

                        {/* Step 1: Role Selection */}
                        {currentStep === 1 && (
                            <div className="space-y-6 animate-fade-in">
                                <div>
                                    <h3 className="text-xl font-black text-gray-900">What brings you here?</h3>
                                    <p className="text-sm text-gray-500 mt-1">Choose your primary goal on the platform</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        {
                                            role: 'jobseeker',
                                            label: 'Find a Job',
                                            sublabel: 'Browse 10K+ opportunities',
                                            icon: (
                                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            ),
                                        },
                                        {
                                            role: 'recruiter',
                                            label: 'Hire Talent',
                                            sublabel: 'Post jobs & find candidates',
                                            icon: (
                                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                </svg>
                                            ),
                                        }
                                    ].map(({ role, label, sublabel, icon }) => (
                                        <button
                                            key={role}
                                            onClick={() => handleRoleSelect(role)}
                                            className={`relative p-6 border-2 rounded-2xl flex flex-col items-center text-center gap-3 transition-all duration-200 ${
                                                formData.role === role
                                                    ? 'border-[#29a08e] bg-[#29a08e]/5 shadow-md shadow-[#29a08e]/10'
                                                    : 'border-gray-100 bg-gray-50 hover:border-[#29a08e]/30 hover:bg-white'
                                            }`}
                                        >
                                            {formData.role === role && (
                                                <div className="absolute top-3 right-3 w-5 h-5 bg-[#29a08e] rounded-full flex items-center justify-center">
                                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            )}
                                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${formData.role === role ? 'bg-[#29a08e] text-white' : 'bg-white text-gray-400'}`}>
                                                {icon}
                                            </div>
                                            <div>
                                                <span className={`font-black text-base block ${formData.role === role ? 'text-[#29a08e]' : 'text-gray-700'}`}>{label}</span>
                                                <span className="text-xs text-gray-400 font-medium">{sublabel}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 2: Account Details */}
                        {currentStep === 2 && (
                            <div className="space-y-5 animate-fade-in">
                                <div>
                                    <h3 className="text-xl font-black text-gray-900">Account Details</h3>
                                    <p className="text-sm text-gray-500 mt-1">Fill in your information to get started</p>
                                </div>
                                {error && (
                                    <div className="flex items-start gap-3 bg-red-50 border border-red-200 p-4 rounded-xl">
                                        <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </div>
                                        <p className="text-sm text-red-700 font-medium">{error}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            onBlur={() => markTouched('name')}
                                            className={`w-full bg-gray-50 border rounded-xl py-3 px-4 text-gray-900 text-sm transition-all placeholder-gray-400 ${nameBorderClass}`}
                                            placeholder="John Doe"
                                            aria-invalid={nameErrorMsg ? 'true' : 'false'}
                                        />
                                        {nameErrorMsg && (
                                            <p className="mt-1.5 text-sm text-red-600 font-medium" role="alert">
                                                {nameErrorMsg}
                                            </p>
                                        )}
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            onBlur={() => markTouched('email')}
                                            className={`w-full bg-gray-50 border rounded-xl py-3 px-4 text-gray-900 text-sm transition-all placeholder-gray-400 ${emailBorderClass}`}
                                            placeholder="you@example.com"
                                            aria-invalid={emailErrorMsg ? 'true' : 'false'}
                                        />
                                        {emailErrorMsg && (
                                            <p className="mt-1.5 text-sm text-red-600 font-medium" role="alert">
                                                {emailErrorMsg}
                                            </p>
                                        )}
                                    </div>
                                    <div className="sm:col-span-1">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                onFocus={() => setPasswordFocused(true)}
                                                onBlur={() => {
                                                    markTouched('password');
                                                    setPasswordFocused(false);
                                                }}
                                                className={`w-full bg-gray-50 border rounded-xl py-3 pl-4 pr-11 text-gray-900 text-sm transition-all placeholder-gray-400 ${passwordBorderClass}`}
                                                placeholder="Enter a strong password"
                                                autoComplete="new-password"
                                                aria-invalid={(touched.password || step2SubmitAttempted) && !passwordResult.isValid ? 'true' : 'false'}
                                                aria-describedby="register-password-hint"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((v) => !v)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-0.5 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#29a08e]/40"
                                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        <p
                                            id="register-password-hint"
                                            className={`mt-1.5 min-h-[1.25rem] text-xs sm:text-sm leading-5 ${
                                                !(touched.password || step2SubmitAttempted)
                                                    ? 'text-gray-500'
                                                    : passwordResult.isValid
                                                      ? 'text-emerald-600 font-medium'
                                                      : 'text-red-600 font-medium'
                                            }`}
                                        >
                                            {!(touched.password || step2SubmitAttempted) ? (
                                                defaultPasswordHelper
                                            ) : passwordResult.isValid ? (
                                                '✓ Password looks good'
                                            ) : (
                                                <span className="block space-y-0.5">
                                                    {validation.errors.password.map((pwdError) => (
                                                        <span key={pwdError} className="flex items-center gap-1.5">
                                                            <span className="inline-block h-1 w-1 rounded-full bg-current shrink-0"></span>
                                                            <span>{pwdError}</span>
                                                        </span>
                                                    ))}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="sm:col-span-1">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                onBlur={() => markTouched('confirmPassword')}
                                                className={`w-full bg-gray-50 border rounded-xl py-3 pl-4 pr-11 text-gray-900 text-sm transition-all placeholder-gray-400 ${confirmBorderClass}`}
                                                placeholder="Re-enter your password"
                                                autoComplete="new-password"
                                                aria-invalid={
                                                    confirmState === 'mismatch' ||
                                                    (step2SubmitAttempted && !formData.confirmPassword)
                                                        ? 'true'
                                                        : 'false'
                                                }
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword((v) => !v)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-0.5 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#29a08e]/40"
                                                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                                            >
                                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {confirmFeedback && (
                                            <p
                                                className={`mt-1.5 min-h-[1.25rem] text-xs sm:text-sm font-medium ${
                                                    confirmFeedback.tone === 'ok' ? 'text-emerald-600' : 'text-red-600'
                                                }`}
                                                role="status"
                                            >
                                                {confirmFeedback.text}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Tips */}
                        {currentStep === 3 && (
                            <div className="space-y-6 animate-fade-in">
                                <div>
                                    <h3 className="text-xl font-black text-gray-900">You're Almost There! 🎉</h3>
                                    <p className="text-sm text-gray-500 mt-1">A few tips to maximize your success on Naya Awasar</p>
                                </div>

                                <div className="space-y-3">
                                    {currentTips.map((item, i) => (
                                        <div key={i} className="flex items-start gap-3 bg-[#29a08e]/5 border border-[#29a08e]/15 rounded-xl p-4">
                                            <span className="text-xl shrink-0">{item.icon}</span>
                                            <p className="text-sm text-gray-700 font-medium leading-relaxed">{item.tip}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 4: Confirm */}
                        {currentStep === 4 && (
                            <div className="space-y-6 animate-fade-in">
                                <div>
                                    <h3 className="text-xl font-black text-gray-900">Confirm Registration</h3>
                                    <p className="text-sm text-gray-500 mt-1">Review your details before joining</p>
                                </div>

                                {error && (
                                    <div className="flex items-start gap-3 bg-red-50 border border-red-200 p-4 rounded-xl">
                                        <p className="text-sm text-red-700 font-medium">{error}</p>
                                    </div>
                                )}

                                <div className="bg-[#f8fafc] rounded-xl border border-gray-100 overflow-hidden">
                                    {[
                                        { label: 'Joining as', value: formData.role === 'jobseeker' ? '🔍 Job Seeker' : '🏢 Recruiter' },
                                        { label: 'Full Name', value: formData.name },
                                        { label: 'Email', value: formData.email },
                                    ].map((row, i) => (
                                        <div key={i} className="flex justify-between items-center px-5 py-3.5 border-b border-gray-100 last:border-0">
                                            <span className="text-sm text-gray-500">{row.label}</span>
                                            <span className="text-sm font-bold text-gray-900">{row.value}</span>
                                        </div>
                                    ))}
                                </div>

                                <p className="text-xs text-center text-gray-400 leading-relaxed">
                                    By creating an account, you agree to our{' '}
                                    <Link to="/terms" className="text-[#29a08e] hover:underline font-medium">Terms of Service</Link>{' '}
                                    and{' '}
                                    <Link to="/privacy" className="text-[#29a08e] hover:underline font-medium">Privacy Policy</Link>.
                                </p>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="mt-8 flex items-center justify-between pt-6 border-t border-gray-50">
                            {currentStep > 1 ? (
                                <button
                                    onClick={handleBack}
                                    className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    Back
                                </button>
                            ) : (
                                <Link to="/login" className="text-sm font-bold text-gray-500 hover:text-[#29a08e] transition-colors">
                                    Sign in instead
                                </Link>
                            )}

                            {currentStep < 4 ? (
                                <button
                                    onClick={handleNext}
                                    className="flex items-center gap-2 px-8 py-2.5 bg-[#29a08e] text-white rounded-xl text-sm font-bold hover:bg-[#228377] transition-all shadow-md shadow-[#29a08e]/20"
                                >
                                    Continue
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-8 py-2.5 bg-[#29a08e] text-white rounded-xl text-sm font-bold hover:bg-[#228377] transition-all shadow-md shadow-[#29a08e]/20 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Creating Account...
                                        </>
                                    ) : (
                                        <>
                                            Create Account 🎉
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                        </>
                        )}
                    </div>

                    <p className="mt-6 text-center text-sm text-gray-500">
                        Already have an account?{' '}
                        <Link to="/login" className="font-bold text-[#29a08e] hover:text-[#228377] transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
