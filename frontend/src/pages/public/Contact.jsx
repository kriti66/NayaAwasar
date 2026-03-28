import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const Contact = () => {
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formSubmitted, setFormSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

    useEffect(() => {
        const fetchLocation = async () => {
            try {
                const res = await api.get('/location');
                setLocation(res.data);
            } catch (error) {
                console.error('Error fetching location:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchLocation();
    }, []);

    const displayLoc = location || {
        address: 'Kathmandu, Nepal',
        phone: '+977 1234567890',
        email: 'info@nayaawasar.com'
    };

    // Google Maps embed: geocodes from the saved physical address only (no stored lat/lng).
    const mapAddress = (displayLoc.address || '').trim() || 'Kathmandu, Nepal';
    const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(mapAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setSubmitError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setSubmitError('');

        try {
            await api.post('/contact', {
                fullName: formData.name,
                email: formData.email,
                subject: formData.subject,
                message: formData.message
            }, { timeout: 20000 });
            setFormSubmitted(true);
        } catch (error) {
            const msg = error.response?.data?.message ||
                (error.request ? 'Network/CORS error. Please check deployment configuration.' : 'Failed to send message. Please try again.');
            setSubmitError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const contactInfo = [
        {
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            label: 'Our Office',
            value: displayLoc.address,
            color: 'bg-violet-50 text-violet-600 border-violet-100'
        },
        {
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            ),
            label: 'Email Us',
            value: displayLoc.email,
            color: 'bg-[#29a08e]/10 text-[#29a08e] border-[#29a08e]/20'
        },
        {
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
            ),
            label: 'Call Us',
            value: displayLoc.phone,
            color: 'bg-amber-50 text-amber-600 border-amber-100'
        },
    ];

    return (
        <div className="bg-[#f8fafc] min-h-screen">
            {/* Hero — slightly tighter so main content sits higher above the fold */}
            <div className="relative bg-gradient-to-br from-slate-900 via-[#0d2f2b] to-slate-900 py-12 sm:py-14 px-4 sm:px-6 lg:px-8 overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-20 w-72 h-72 bg-[#29a08e] rounded-full blur-3xl"></div>
                </div>
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '28px 28px' }}></div>
                <div className="relative max-w-3xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#29a08e]/20 border border-[#29a08e]/30 rounded-full text-sm font-medium text-[#29a08e] mb-4 sm:mb-5">
                        💬 We'd Love to Hear From You
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black text-white mb-3 tracking-tight">
                        Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#29a08e] to-teal-300">Touch</span>
                    </h1>
                    <p className="text-gray-300 text-base sm:text-lg">Have questions? Our friendly team is always ready to help.</p>
                </div>
            </div>

            {/* Two columns (lg+): form + sidebar left | map + contact details right. Mobile: stacked, form first. */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-10 pb-16 lg:pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                    {/* Left: contact form, then hours, help, promotion CTA */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-7">
                            <div className="mb-5">
                                <h2 className="text-xl sm:text-2xl font-black text-gray-900 truncate">Send us a Message</h2>
                                <p className="text-gray-500 text-sm mt-1">We'll get back to you within 24 hours.</p>
                            </div>

                            {formSubmitted ? (
                                <div className="text-center py-10 sm:py-12">
                                    <div className="w-20 h-20 bg-[#29a08e]/10 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">✅</div>
                                    <h3 className="text-xl font-black text-gray-900 mb-2">Message Sent!</h3>
                                    <p className="text-gray-500 text-sm max-w-md mx-auto">Thank you for contacting us. We have received your message and will get back to you within 24 hours.</p>
                                    <button
                                        type="button"
                                        onClick={() => { setFormSubmitted(false); setFormData({ name: '', email: '', subject: '', message: '' }); setSubmitError(''); }}
                                        className="mt-6 px-6 py-2.5 text-sm font-bold text-[#29a08e] border border-[#29a08e]/30 rounded-xl hover:bg-[#29a08e]/5 transition-colors"
                                    >
                                        Send Another
                                    </button>
                                </div>
                            ) : (
                                <form className="space-y-4" onSubmit={handleSubmit}>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {[
                                            { label: 'Full Name', name: 'name', type: 'text', placeholder: 'John Doe' },
                                            { label: 'Email Address', name: 'email', type: 'email', placeholder: 'john@example.com' },
                                        ].map((field) => (
                                            <div key={field.name} className="space-y-1.5">
                                                <label className="text-sm font-semibold text-gray-700">{field.label}</label>
                                                <input
                                                    type={field.type}
                                                    name={field.name}
                                                    value={formData[field.name]}
                                                    onChange={handleChange}
                                                    placeholder={field.placeholder}
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 sm:py-3 px-4 text-gray-900 text-sm transition-all placeholder-gray-400"
                                                    required
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Subject</label>
                                        <input
                                            type="text"
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            placeholder="How can we help you?"
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 sm:py-3 px-4 text-gray-900 text-sm transition-all placeholder-gray-400"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Message</label>
                                        <textarea
                                            rows={4}
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            placeholder="Tell us more about your question or feedback..."
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 sm:py-3 px-4 text-gray-900 text-sm transition-all resize-y min-h-[100px] placeholder-gray-400"
                                            required
                                        />
                                    </div>

                                    {submitError && (
                                        <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm font-semibold border border-red-200">
                                            {submitError}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full py-3.5 px-6 bg-[#29a08e] text-white text-sm font-bold rounded-xl hover:bg-[#228377] transition-all shadow-lg shadow-[#29a08e]/20 hover:shadow-[#29a08e]/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                </svg>
                                                Send Message
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <span>🕐</span> Office Hours
                                </h3>
                                <div className="space-y-2">
                                    {[
                                        { day: 'Sunday – Friday', hours: '9:00 AM – 6:00 PM' },
                                        { day: 'Saturday', hours: '10:00 AM – 3:00 PM' },
                                        { day: 'Public Holidays', hours: 'Closed' },
                                    ].map((h, i) => (
                                        <div key={i} className="flex justify-between items-center gap-2 py-2 border-b border-gray-50 last:border-0">
                                            <span className="text-sm text-gray-600 font-medium">{h.day}</span>
                                            <span className={`text-sm font-bold shrink-0 ${h.hours === 'Closed' ? 'text-red-500' : 'text-[#29a08e]'}`}>{h.hours}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-[#29a08e]/5 to-[#29a08e]/10 border border-[#29a08e]/20 rounded-2xl p-5 sm:p-6 flex flex-col">
                                <h3 className="font-bold text-gray-900 mb-2">Need Help Right Now?</h3>
                                <p className="text-sm text-gray-600 mb-4 flex-1">Browse our FAQ or explore our platform directly.</p>
                                <Link to="/help-center" className="inline-flex items-center gap-2 text-sm font-bold text-[#29a08e] hover:text-[#228377] transition-colors mt-auto">
                                    View Help Center →
                                </Link>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
                            <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                <span aria-hidden>📣</span> Recruiters: paid job promotion
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                                If you have already used your <strong>3 free</strong> job promotions, you can submit a
                                manual paid promotion request with payment proof. Sign in as a recruiter to complete the
                                form — use the message form here for general inquiries.
                            </p>
                            <Link
                                to="/promotion-payment"
                                className="inline-flex items-center justify-center w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-bold bg-[#29a08e] text-white hover:bg-[#228377] transition-colors"
                            >
                                Paid promotion request →
                            </Link>
                        </div>
                    </div>

                    {/* Right: map + contact chips */}
                    <aside className="lg:col-span-5 space-y-4">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-gray-50">
                                <h3 className="font-bold text-gray-900 text-base sm:text-lg flex items-center gap-2">
                                    <span aria-hidden>📍</span> Find us
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-snug">{mapAddress}</p>
                            </div>
                            <div className="h-[250px] sm:h-[280px] bg-gray-100">
                                <iframe
                                    title="Office location map"
                                    width="100%"
                                    height="100%"
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    src={mapSrc}
                                    className="w-full h-full border-0"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            {contactInfo.map((info, i) => (
                                <div
                                    key={i}
                                    className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center gap-3"
                                >
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${info.color} shrink-0`}>
                                        {info.icon}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">{info.label}</p>
                                        <p className="text-gray-900 font-semibold text-sm break-words">{info.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default Contact;
