import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart } from 'lucide-react';

const GlobalFooter = () => {
    const { pathname } = useLocation();

    return (
        <footer className="bg-white border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-[#29a08e] text-white rounded-lg flex items-center justify-center shadow-sm shadow-[#29a08e]/20">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <p className="text-sm font-bold text-gray-700">
                            &copy; {new Date().getFullYear()} <span className="text-[#29a08e]">Naya Awasar</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        {[
                            { label: 'Terms', path: '/user/terms' },
                            { label: 'Privacy', path: '/user/privacy' },
                            { label: 'Cookies', path: '/user/cookies' },
                            { label: 'Help', path: '/user/help' },
                        ].map((l) => (
                            <Link
                                key={l.path}
                                to={l.path}
                                className={`text-xs transition-colors ${pathname === l.path
                                        ? 'text-teal-500 font-semibold'
                                        : 'text-gray-500 hover:text-teal-500'
                                    }`}
                            >
                                {l.label}
                            </Link>
                        ))}
                    </div>

                    <p className="text-xs text-gray-400 hidden sm:flex items-center gap-1">
                        Made with <Heart size={10} className="text-rose-400 fill-rose-400" /> in Nepal
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default GlobalFooter;
