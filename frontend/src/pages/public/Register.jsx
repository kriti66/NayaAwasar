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
            name: formData.name,
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
        <div className="min-h-screen bg-white flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Register for Naya Awasar
                    </h2>

                    {/* Stepper */}
                    <div className="mt-8 flex items-center justify-center space-x-4 sm:space-x-8">
                        {[
                            { step: 1, label: 'Select Role' },
                            { step: 2, label: 'Account Details' },
                            { step: 3, label: 'Profile Details' },
                            { step: 4, label: 'Confirm' }
                        ].map((item, index) => (
                            <div key={item.step} className="flex flex-col items-center relative">
                                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 
                                    ${currentStep >= item.step ? 'bg-blue-600 border-blue-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-500'}
                                    font-bold text-sm z-10 transition-colors duration-200`}>
                                    {item.step}
                                </div>
                                <div className={`mt-2 text-xs sm:text-sm font-medium ${currentStep >= item.step ? 'text-blue-600' : 'text-gray-500'}`}>
                                    {item.label}
                                </div>
                                {/* Divider Line */}
                                {index < 3 && (
                                    <div className={`absolute top-5 left-1/2 w-full h-0.5 -mr-4 sm:-mr-8 
                                        ${currentStep > item.step ? 'bg-blue-600' : 'bg-gray-200'}`} style={{ width: '100%', transform: 'translateX(50%)' }}>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="mt-8 bg-white p-8 sm:p-10 shadow-lg rounded-xl border border-gray-100">
                    {/* Step 1: Role Selection */}
                    {currentStep === 1 && (
                        <div className="space-y-8 text-center animate-fade-in">
                            <h3 className="text-2xl font-bold text-gray-900">Choose Your Role</h3>
                            <p className="text-gray-500">Are you looking for a job or hiring talent?</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <button
                                    onClick={() => handleRoleSelect('jobseeker')}
                                    className={`p-6 border-2 rounded-xl flex items-center justify-center transition-all duration-200 space-x-4
                                        ${formData.role === 'jobseeker' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
                                >
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span className="text-lg font-bold">Job Seeker</span>
                                </button>

                                <button
                                    onClick={() => handleRoleSelect('recruiter')}
                                    className={`p-6 border-2 rounded-xl flex items-center justify-center transition-all duration-200 space-x-4
                                        ${formData.role === 'recruiter' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
                                >
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    <span className="text-lg font-bold">Recruiter</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Account Details */}
                    {currentStep === 2 && (
                        <div className="space-y-6 animate-fade-in">
                            <h3 className="text-2xl font-bold text-center text-gray-900">Account Details</h3>

                            {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Password</label>
                                <input type="password" name="password" value={formData.password} onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500" required />
                            </div>
                        </div>
                    )}

                    {/* Step 3: Profile Details (Placeholder/Simple) */}
                    {currentStep === 3 && (
                        <div className="space-y-6 animate-fade-in text-center">
                            <h3 className="text-2xl font-bold text-gray-900">Profile Details</h3>
                            <p className="text-gray-500">Let's get to know you a bit better.</p>

                            <div className="bg-blue-50 p-6 rounded-lg text-blue-800">
                                <p>For now, we'll skip the detailed profile setup. You can complete your profile (upload resume, add skills, etc.) from your <strong>Dashboard</strong> after creating your account!</p>
                            </div>

                            <div className="text-sm text-gray-500 italic mt-4">
                                (This step is intentionally simplified for this version)
                            </div>
                        </div>
                    )}

                    {/* Step 4: Confirm */}
                    {currentStep === 4 && (
                        <div className="space-y-6 animate-fade-in text-center">
                            <h3 className="text-2xl font-bold text-gray-900">Confirm & Join</h3>

                            {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}

                            <div className="bg-gray-50 p-6 rounded-lg text-left space-y-3">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Role</span>
                                    <span className="font-medium text-gray-900 capitalize">{formData.role}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Name</span>
                                    <span className="font-medium text-gray-900">{formData.name}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Email</span>
                                    <span className="font-medium text-gray-900">{formData.email}</span>
                                </div>
                            </div>

                            <p className="text-sm text-gray-500">By clicking "Confirm Registration", you agree to our Terms of Service and Privacy Policy.</p>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="mt-10 flex justify-between">
                        {currentStep > 1 ? (
                            <button
                                onClick={handleBack}
                                className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                            >
                                Back
                            </button>
                        ) : (
                            <Link to="/login" className="px-6 py-2 text-sm font-medium text-blue-600 hover:text-blue-500">
                                Back to Login
                            </Link>
                        )}

                        {currentStep < 4 ? (
                            <button
                                onClick={handleNext}
                                className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Next
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                            >
                                {loading ? 'Creating Account...' : 'Confirm Registration'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
