import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ActionRequiredBanner = ({ message, type, linkTo, linkText, urgency }) => {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;

    return (
        <div className="bg-[#E7F6F2] border border-[#A5C9CA]/30 rounded-2xl p-4 flex items-center justify-between gap-4 mb-8 group">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#2D9B82] shadow-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 15c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-bold text-gray-900 leading-none">Action Required</span>
                        {urgency && (
                            <span className="px-1.5 py-0.5 rounded-md bg-red-500 text-[10px] font-black text-white uppercase tracking-tighter">
                                {urgency}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-600 font-medium">
                        {message}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <Link
                    to={linkTo}
                    className="px-5 py-2.5 bg-[#2D9B82] text-white text-sm font-bold rounded-xl hover:bg-[#25836d] transition-all flex items-center gap-2 shadow-lg shadow-[#2D9B82]/10"
                >
                    {linkText}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </Link>
                <button
                    onClick={() => setIsVisible(false)}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default ActionRequiredBanner;
