import { useState, useEffect } from 'react';

import api from '../../services/api';

const Contact = () => {
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLocation = async () => {
            try {
                const res = await api.get('/location');
                setLocation(res.data);
            } catch (error) {
                console.error("Error fetching location:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLocation();
    }, []);

    const displayLoc = location || {
        address: 'Kathmandu, Nepal',
        latitude: 27.7172,
        longitude: 85.3240,
        phone: '+977 1234567890',
        email: 'info@nayaawasar.com'
    };

    const hasCoordinates = displayLoc.latitude && displayLoc.longitude &&
        !isNaN(displayLoc.latitude) && !isNaN(displayLoc.longitude);

    const mapQuery = hasCoordinates
        ? `${displayLoc.latitude},${displayLoc.longitude}`
        : encodeURIComponent(displayLoc.address || 'Kathmandu, Nepal');

    const mapSrc = `https://maps.google.com/maps?q=${mapQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

    return (
        <div className="bg-gray-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-3xl font-extrabold text-gray-900 sm:text-5xl">
                        Get in <span className="text-[#29a08e]">Touch</span>
                    </h1>
                    <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
                        Have questions or need assistance? Our team is here to help you.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    {/* Left Column: Contact Form */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Send us a Message</h2>
                        <form className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Full Name</label>
                                    <input type="text" placeholder="John Doe" className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 focus:ring-[#29a08e] focus:border-[#29a08e] transition-all text-gray-900" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Email Address</label>
                                    <input type="email" placeholder="john@example.com" className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 focus:ring-[#29a08e] focus:border-[#29a08e] transition-all text-gray-900" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Subject</label>
                                <input type="text" placeholder="How can we help?" className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 focus:ring-[#29a08e] focus:border-[#29a08e] transition-all text-gray-900" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Message</label>
                                <textarea rows={4} placeholder="Your message here..." className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 focus:ring-[#29a08e] focus:border-[#29a08e] transition-all text-gray-900 resize-none"></textarea>
                            </div>
                            <button type="button" className="w-full bg-[#29a08e] text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-sm mt-2">
                                Send Message
                            </button>
                        </form>
                    </div>

                    {/* Right Column: Info & Map */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-4">
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center">
                                <div className="h-12 w-12 bg-[#29a08e]/20 text-[#29a08e] rounded-xl flex items-center justify-center">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Office</h3>
                                    <p className="text-gray-900 font-semibold">{displayLoc.address}</p>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center">
                                <div className="h-12 w-12 bg-[#29a08e]/20 text-[#29a08e] rounded-xl flex items-center justify-center">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Email</h3>
                                    <p className="text-gray-900 font-semibold">{displayLoc.email}</p>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center">
                                <div className="h-12 w-12 bg-[#29a08e]/20 text-[#29a08e] rounded-xl flex items-center justify-center">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Phone</h3>
                                    <p className="text-gray-900 font-semibold">{displayLoc.phone}</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl overflow-hidden border-4 border-white shadow-lg h-[300px]">
                            <iframe
                                title="Office Location"
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                src={mapSrc}
                                className="transition-all"
                            ></iframe>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
