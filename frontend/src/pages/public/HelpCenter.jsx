import { Link } from 'react-router-dom';

const FAQ_SECTIONS = [
    {
        id: 'job-seekers',
        title: 'Job seekers',
        subtitle: 'Applying, profile, and interviews',
        icon: '👤',
        accent: 'from-blue-500/10 to-indigo-500/5 border-blue-100',
        items: [
            {
                q: 'How do I create an account and apply for jobs?',
                a: 'Register as a job seeker, complete your profile, and verify your identity through KYC when prompted. Browse jobs, open a listing, and use Apply or Fast-Track Apply. You can track applications from your dashboard.'
            },
            {
                q: 'Why is KYC required?',
                a: 'KYC helps employers trust that applicants are who they say they are and reduces fraud. Some actions may stay limited until your KYC is approved.'
            },
            {
                q: 'How do I prepare for a video interview?',
                a: 'Use a quiet space, stable internet, and a working camera and microphone. Join the interview link from your dashboard or email at the scheduled time. Test your device a few minutes early.'
            },
            {
                q: 'Can I edit my profile after signing up?',
                a: 'Yes. Open your job seeker profile from the dashboard to update your details, CV, and preferences at any time.'
            }
        ]
    },
    {
        id: 'recruiters',
        title: 'Recruiters',
        subtitle: 'Posting jobs, company verification, and promotions',
        icon: '🏢',
        accent: 'from-[#29a08e]/10 to-teal-500/5 border-[#29a08e]/20',
        items: [
            {
                q: 'How do I post a job for my company?',
                a: 'Sign up as a recruiter, complete recruiter KYC, and ensure your company is verified. Then use Post Job from your dashboard. Fill in title, description, requirements, and submit for review if required.'
            },
            {
                q: 'What are free job promotions?',
                a: 'Each recruiter can request a limited number of free promotions (shown on your Promotions page). After that, you can submit a paid promotion request with payment proof for admin approval.'
            },
            {
                q: 'Where do I submit a paid promotion payment?',
                a: 'Use the Paid promotion request flow from your recruiter promotions area or the dedicated promotion payment page after you have used your free slots. Include transaction reference and a screenshot of payment.'
            },
            {
                q: 'How do I manage applicants?',
                a: 'Open Applications from your dashboard to view candidates, update statuses, and schedule interviews. Notifications keep you updated on new applications.'
            }
        ]
    },
    {
        id: 'general',
        title: 'General support',
        subtitle: 'Account, security, and getting help',
        icon: '💬',
        accent: 'from-slate-100 to-gray-50 border-gray-200',
        items: [
            {
                q: 'I forgot my password. What should I do?',
                a: 'Use Forgot password on the login page. Enter your email, follow the OTP or reset link steps, and set a new password. If email does not arrive, check spam or contact us.'
            },
            {
                q: 'How do I report a bug or suspicious listing?',
                a: 'Use the contact form on our Contact page with subject “Support” or “Report” and include links or screenshots. Our team will review and respond.'
            },
            {
                q: 'Is my data secure?',
                a: 'We use industry-standard practices for authentication and data handling. Never share your password or OTP with anyone claiming to be support.'
            },
            {
                q: 'Still need help?',
                a: 'Visit our Contact page to send a message, or write to the email shown there. We aim to reply within one business day.'
            }
        ]
    }
];

const HelpCenter = () => {
    return (
        <div className="bg-[#f8fafc] min-h-screen">
            <div className="relative bg-gradient-to-br from-slate-900 via-[#0d2f2b] to-slate-900 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-20 w-72 h-72 bg-[#29a08e] rounded-full blur-3xl" />
                </div>
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
                        backgroundSize: '28px 28px'
                    }}
                />
                <div className="relative max-w-3xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#29a08e]/20 border border-[#29a08e]/30 rounded-full text-sm font-medium text-[#29a08e] mb-4">
                        Help &amp; support
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black text-white mb-3 tracking-tight">
                        Help{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#29a08e] to-teal-300">Center</span>
                    </h1>
                    <p className="text-gray-300 text-base sm:text-lg max-w-xl mx-auto">
                        Quick answers for job seekers, recruiters, and account questions.
                    </p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10 pb-16 sm:pb-20">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 mb-8">
                    <p className="text-sm text-gray-600 leading-relaxed">
                        Can’t find what you need?{' '}
                        <Link to="/contact" className="font-bold text-[#29a08e] hover:text-[#228377]">
                            Contact us
                        </Link>{' '}
                        and we’ll get back to you.
                    </p>
                </div>

                <div className="space-y-10 sm:space-y-12">
                    {FAQ_SECTIONS.map((section) => (
                        <section
                            key={section.id}
                            id={section.id}
                            className="scroll-mt-24"
                            aria-labelledby={`${section.id}-heading`}
                        >
                            <div
                                className={`rounded-2xl border bg-gradient-to-br p-5 sm:p-6 mb-4 ${section.accent}`}
                            >
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl shrink-0" aria-hidden>
                                        {section.icon}
                                    </span>
                                    <div>
                                        <h2
                                            id={`${section.id}-heading`}
                                            className="text-xl sm:text-2xl font-black text-gray-900"
                                        >
                                            {section.title}
                                        </h2>
                                        <p className="text-sm text-gray-600 mt-1">{section.subtitle}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {section.items.map((item, idx) => (
                                    <details
                                        key={idx}
                                        className="group bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden open:shadow-md transition-shadow"
                                    >
                                        <summary className="cursor-pointer list-none flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5 sm:py-4 font-bold text-gray-900 text-sm sm:text-base hover:bg-gray-50/80 transition-colors marker:content-none [&::-webkit-details-marker]:hidden">
                                            <span>{item.q}</span>
                                            <span className="text-[#29a08e] text-lg leading-none shrink-0 group-open:rotate-180 transition-transform">
                                                ▼
                                            </span>
                                        </summary>
                                        <div className="px-4 sm:px-5 pb-4 pt-0 border-t border-gray-50">
                                            <p className="text-sm text-gray-600 leading-relaxed pt-3">{item.a}</p>
                                        </div>
                                    </details>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>

                <div className="mt-10 flex flex-wrap gap-3 justify-center">
                    <Link
                        to="/contact"
                        className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-bold bg-[#29a08e] text-white hover:bg-[#228377] transition-colors shadow-lg shadow-[#29a08e]/15"
                    >
                        Contact support
                    </Link>
                    <Link
                        to="/jobs"
                        className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-bold border border-gray-200 bg-white text-gray-800 hover:border-[#29a08e]/40 hover:bg-[#29a08e]/5 transition-colors"
                    >
                        Browse jobs
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default HelpCenter;
