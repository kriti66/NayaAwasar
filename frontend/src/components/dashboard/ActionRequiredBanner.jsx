import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const variantStyles = {
    default: {
        wrap: 'bg-[#E7F6F2] border-[#A5C9CA]/30',
        iconWrap: 'bg-white text-[#29a08e]',
        iconPath:
            'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 15c-.77 1.333.192 3 1.732 3z'
    },
    info: {
        wrap: 'bg-amber-50 border-amber-200/80',
        iconWrap: 'bg-white text-amber-600',
        iconPath: 'M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z'
    },
    danger: {
        wrap: 'bg-rose-50 border-rose-200/80',
        iconWrap: 'bg-white text-rose-600',
        iconPath:
            'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 15c-.77 1.333.192 3 1.732 3z'
    }
};

/**
 * @param {object} props
 * @param {'default'|'info'|'danger'} [props.variant]
 * @param {string} [props.title] — defaults to "Action Required" for default variant; use a short label for info/danger
 */
const ActionRequiredBanner = ({
    message,
    linkTo,
    linkText,
    urgency,
    variant = 'default',
    title
}) => {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;

    const vs = variantStyles[variant] || variantStyles.default;
    const heading =
        title ||
        (variant === 'default' ? 'Action Required' : variant === 'info' ? 'KYC status' : 'Action needed');

    return (
        <div className={`border rounded-2xl p-4 flex items-center justify-between gap-4 mb-8 group ${vs.wrap}`}>
            <div className="flex items-center gap-4 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${vs.iconWrap}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={vs.iconPath} />
                    </svg>
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-sm font-bold text-gray-900 leading-none">{heading}</span>
                        {urgency && variant === 'default' && (
                            <span className="px-1.5 py-0.5 rounded-md bg-red-500 text-[10px] font-black text-white uppercase tracking-tighter">
                                {urgency}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-600 font-medium">{message}</p>
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                {linkTo && linkText && (
                    <Link
                        to={linkTo}
                        className="px-5 py-2.5 bg-[#29a08e] text-white text-sm font-bold rounded-xl hover:bg-[#228377] transition-all flex items-center gap-2 shadow-lg shadow-[#29a08e]/10 whitespace-nowrap"
                    >
                        {linkText}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </Link>
                )}
                <button
                    type="button"
                    onClick={() => setIsVisible(false)}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white/60 rounded-lg transition-all"
                    aria-label="Dismiss banner"
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
