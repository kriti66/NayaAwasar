import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchParams] = useSearchParams();
    const { register } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const roleParam = searchParams.get('role');
        if (roleParam === 'recruiter' || roleParam === 'jobseeker') {
            setFormData(prev => ({ ...prev, role: roleParam }));
        }
    }, [searchParams]);

    const handleNext = () => {
        if (currentStep === 2) {
            if (!formData.name || !formData.email || !formData.password) {
                setError('Please fill in all required fields');
                return;
            }
            if (formData.password.length < 6) {
                setError('Password must be at least 6 characters');
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match');
                return;
            }
        }
        setError('');
        setCurrentStep(prev => prev + 1);
    };

    const handleBack = () => {
        setError('');
        setCurrentStep(prev => prev - 1);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRoleSelect = (role) => {
        setFormData(prev => ({ ...prev, role }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        const result = await register({
            fullName: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role
        });

        if (result.success) {
            if (formData.role === 'recruiter') navigate('/recruiter/dashboard');
            else navigate('/seeker/dashboard');
        } else {
            setError(result.message);
            setLoading(false);
        }
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
                                        <input type="text" name="name" value={formData.name} onChange={handleChange}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-900 text-sm transition-all placeholder-gray-400"
                                            placeholder="John Doe" />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleChange}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-900 text-sm transition-all placeholder-gray-400"
                                            placeholder="you@example.com" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                                        <div className="relative">
                                            <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-4 pr-10 text-gray-900 text-sm transition-all placeholder-gray-400"
                                                placeholder="Min. 6 characters" />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                                        <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-900 text-sm transition-all placeholder-gray-400"
                                            placeholder="••••••••" />
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
