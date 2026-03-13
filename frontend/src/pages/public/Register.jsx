import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

const Register = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'jobseeker',
        confirmPassword: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [searchParams] = useSearchParams();
    const { register } = useAuth();
    const navigate = useNavigate();

    // Init role from URL if present
    useEffect(() => {
        const roleParam = searchParams.get('role');
        if (roleParam === 'recruiter' || roleParam === 'jobseeker') {
            setFormData(prev => ({ ...prev, role: roleParam }));
        }
    }, [searchParams]);

    const handleNext = () => {
        // Validation logic per step can go here
        if (currentStep === 2) {
            if (!formData.name || !formData.email || !formData.password) {
                setError("Please fill in all fields");
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                setError("Passwords do not match");
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
        // Auto advance after selection? User might want to change their mind, so let them click Next? 
        // The design usually implies selection + Next. But clicking the card typically selects it.
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
            // Redirect based on role
            // We can show a success message first?
            if (formData.role === 'recruiter') navigate('/recruiter/dashboard');
            else navigate('/seeker/dashboard');
        } else {
            setError(result.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl w-full space-y-8">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900">
                        Join Naya Awasar
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">Create your account to get started</p>

                    {/* Stepper */}
                    <div className="mt-8 flex items-center justify-center space-x-4">
                        {[1, 2, 3, 4].map((step) => (
                            <div key={step} className="flex items-center">
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors
                                    ${currentStep >= step ? 'bg-[#29a08e] border-[#29a08e] text-white' : 'bg-white border-gray-300 text-gray-300'}
                                    text-sm font-bold`}>
                                    {step}
                                </div>
                                {step < 4 && (
                                    <div className={`w-8 sm:w-12 h-0.5 mx-2 ${currentStep > step ? 'bg-[#29a08e]' : 'bg-gray-200'}`}></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white p-8 shadow-xl rounded-2xl border border-gray-100">
                    {/* Step 1: Role Selection */}
                    {currentStep === 1 && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-gray-900">What are you looking for?</h3>
                                <p className="text-sm text-gray-500 mt-1">Select your primary goal on the platform</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <button
                                    onClick={() => handleRoleSelect('jobseeker')}
                                    className={`p-8 border-2 rounded-2xl flex flex-col items-center transition-all space-y-4
                                        ${formData.role === 'jobseeker' ? 'border-[#29a08e] bg-[#29a08e]/10 text-[#29a08e] shadow-md' : 'border-gray-100 bg-gray-50 hover:bg-white hover:border-[#29a08e]/30'}`}
                                >
                                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center transition-colors ${formData.role === 'jobseeker' ? 'bg-[#29a08e] text-white' : 'bg-white text-gray-400'}`}>
                                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <span className="font-bold text-lg">I want a Job</span>
                                </button>

                                <button
                                    onClick={() => handleRoleSelect('recruiter')}
                                    className={`p-8 border-2 rounded-2xl flex flex-col items-center transition-all space-y-4
                                        ${formData.role === 'recruiter' ? 'border-[#29a08e] bg-[#29a08e]/10 text-[#29a08e] shadow-md' : 'border-gray-100 bg-gray-50 hover:bg-white hover:border-[#29a08e]/30'}`}
                                >
                                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center transition-colors ${formData.role === 'recruiter' ? 'bg-[#29a08e] text-white' : 'bg-white text-gray-400'}`}>
                                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                    <span className="font-bold text-lg">I'm Hiring</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Account Details */}
                    {currentStep === 2 && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-gray-900">Account Details</h3>
                                <p className="text-sm text-gray-500 mt-1">Provide your basic information</p>
                            </div>

                            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium text-center border border-red-100">{error}</div>}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Full Name</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleChange}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 focus:border-[#29a08e] focus:ring-0 transition-all text-gray-900" placeholder="John Doe" required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Email Address</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 focus:border-[#29a08e] focus:ring-0 transition-all text-gray-900" placeholder="john@example.com" required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Password</label>
                                    <input type="password" name="password" value={formData.password} onChange={handleChange}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 focus:border-[#29a08e] focus:ring-0 transition-all text-gray-900" placeholder="••••••••" required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                                    <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 focus:border-[#29a08e] focus:ring-0 transition-all text-gray-900" placeholder="••••••••" required />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Profile Details */}
                    {currentStep === 3 && (
                        <div className="space-y-6 animate-fade-in text-center">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Setting Up Your Profile</h3>
                                <p className="text-sm text-gray-500 mt-1">Final steps to get started</p>
                            </div>

                            <div className="bg-[#29a08e]/5 p-8 rounded-2xl text-[#228377] border border-[#29a08e]/20">
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm text-[#29a08e]">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <p className="font-semibold">Complete your professional profile on the dashboard after registration to increase your chances by 70%!</p>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Confirm */}
                    {currentStep === 4 && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-gray-900">Confirm Registration</h3>
                                <p className="text-sm text-gray-500 mt-1">Review your information before joining</p>
                            </div>

                            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium text-center border border-red-100">{error}</div>}

                            <div className="bg-gray-50 p-6 rounded-2xl space-y-3 border border-gray-100">
                                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                    <span className="text-sm text-gray-500">I am joining as</span>
                                    <span className="font-bold text-gray-900 capitalize">{formData.role === 'jobseeker' ? 'Job Seeker' : 'Recruiter'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                    <span className="text-sm text-gray-500">Full Name</span>
                                    <span className="font-bold text-gray-900">{formData.name}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-sm text-gray-500">Email Address</span>
                                    <span className="font-bold text-gray-900">{formData.email}</span>
                                </div>
                            </div>

                            <p className="text-xs text-center text-gray-500">By clicking confirm, you agree to our Terms and Privacy Policy.</p>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="mt-10 flex items-center justify-between">
                        {currentStep > 1 ? (
                            <button
                                onClick={handleBack}
                                className="px-6 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Previous
                            </button>
                        ) : (
                            <Link to="/login" className="text-sm font-bold text-[#29a08e] hover:text-[#228377] transition-colors">
                                Sign In Instead
                            </Link>
                        )}

                        {currentStep < 4 ? (
                            <button
                                onClick={handleNext}
                                className="px-8 py-2.5 bg-[#29a08e] text-white rounded-lg text-sm font-bold hover:bg-[#228377] transition-colors shadow-sm"
                            >
                                Continue
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="px-8 py-2.5 bg-[#29a08e] text-white rounded-lg text-sm font-bold hover:bg-[#228377] transition-colors shadow-sm disabled:opacity-50"
                            >
                                {loading ? 'Joining...' : 'Confirm Join'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
