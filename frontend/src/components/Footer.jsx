import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-gray-900 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-gray-800">
                    <div className="space-y-6">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold text-white tracking-tight">Naya <span className="text-blue-500">Awasar</span></span>
                        </Link>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Connecting talent with opportunities across Nepal. Your partner in professional growth and career success.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">For Seekers</h3>
                        <ul className="space-y-3">
                            <li><Link to="/jobs" className="text-sm text-gray-400 hover:text-white transition-colors">Browse Jobs</Link></li>
                            <li><Link to="/register" className="text-sm text-gray-400 hover:text-white transition-colors">Create Profile</Link></li>
                            <li><Link to="/seeker/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">Job Alerts</Link></li>
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">For Recruiters</h3>
                        <ul className="space-y-3">
                            <li><Link to="/register?role=recruiter" className="text-sm text-gray-400 hover:text-white transition-colors">Post a Job</Link></li>
                            <li><Link to="/pricing" className="text-sm text-gray-400 hover:text-white transition-colors">Pricing</Link></li>
                            <li><Link to="/recruiter/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">Dashboard</Link></li>
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Company</h3>
                        <ul className="space-y-3">
                            <li><Link to="/about" className="text-sm text-gray-400 hover:text-white transition-colors">About Us</Link></li>
                            <li><Link to="/contact" className="text-sm text-gray-400 hover:text-white transition-colors">Contact</Link></li>
                            <li><Link to="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-gray-500">
                        &copy; {new Date().getFullYear()} Naya Awasar. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <span className="text-sm text-gray-500 hover:text-white cursor-pointer">Terms</span>
                        <span className="text-sm text-gray-500 hover:text-white cursor-pointer">Security</span>
                        <span className="text-sm text-gray-500 hover:text-white cursor-pointer">Cookies</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
