import React from 'react';
import { Link } from 'react-router-dom';

const GlobalFooter = () => {
    return (
        <footer className="bg-white border-t border-gray-200 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                    <p className="text-sm font-semibold text-gray-900">
                        © {new Date().getFullYear()} Naya Awasar
                    </p>

                    <div className="flex items-center gap-6 text-xs font-medium text-gray-500">
                        <Link to="/terms" className="hover:text-blue-600 transition-colors">Terms of Service</Link>
                        <Link to="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link>
                        <Link to="/cookies" className="hover:text-blue-600 transition-colors">Cookie Settings</Link>
                    </div>

                    <div className="pt-2">
                        <p className="text-xs text-gray-400">
                            support@nayaawasar.com • Kathmandu, Nepal
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default GlobalFooter;
