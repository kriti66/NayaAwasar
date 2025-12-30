import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-1">
                        <span className="text-2xl font-bold text-white">Naya<span className="text-blue-500">Awasar</span></span>
                        <p className="mt-4 text-gray-400 text-sm">
                            Connecting talent with opportunity. The best place to find your next career move in Nepal.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">For Candidates</h3>
                        <ul className="mt-4 space-y-4">
                            <li><Link to="/jobs" className="text-base text-gray-300 hover:text-white">Browse Jobs</Link></li>
                            <li><Link to="/register" className="text-base text-gray-300 hover:text-white">Create Resume</Link></li>
                            <li><Link to="/seeker/dashboard" className="text-base text-gray-300 hover:text-white">Job Alerts</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">For Recruiters</h3>
                        <ul className="mt-4 space-y-4">
                            <li><Link to="/register?role=recruiter" className="text-base text-gray-300 hover:text-white">Post a Job</Link></li>
                            <li><Link to="/pricing" className="text-base text-gray-300 hover:text-white">Pricing</Link></li>
                            <li><Link to="/recruiter/dashboard" className="text-base text-gray-300 hover:text-white">Recruitment Solutions</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Support</h3>
                        <ul className="mt-4 space-y-4">
                            <li><Link to="/about" className="text-base text-gray-300 hover:text-white">About Us</Link></li>
                            <li><Link to="/contact" className="text-base text-gray-300 hover:text-white">Contact</Link></li>
                            <li><Link to="/privacy" className="text-base text-gray-300 hover:text-white">Privacy Policy</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-8 border-t border-gray-700 pt-8 flexjustify-between items-center">
                    <p className="text-base text-gray-400">&copy; {new Date().getFullYear()} Naya Awasar. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
