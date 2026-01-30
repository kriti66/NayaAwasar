import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
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
                // Fallback or just stop loading
            } finally {
                setLoading(false);
            }
        };

        fetchLocation();
    }, []);

    // Default fallback if API fails or empty
    const displayLoc = location || {
        address: 'Kathmandu, Nepal',
        latitude: 27.7172,
        longitude: 85.3240,
        phone: '+977 1234567890',
        email: 'info@nayaawasar.com'
    };

    // Construct Map Query
    // Prefer coordinates if available and valid
    const hasCoordinates = displayLoc.latitude && displayLoc.longitude &&
        !isNaN(displayLoc.latitude) && !isNaN(displayLoc.longitude);

    const mapQuery = hasCoordinates
        ? `${displayLoc.latitude},${displayLoc.longitude}`
        : encodeURIComponent(displayLoc.address || 'Kathmandu, Nepal');

    const mapSrc = `https://maps.google.com/maps?q=${mapQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

    return (
        <Layout>
            <div className="bg-white min-h-screen py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-12">Contact Naya Awasar</h1>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                        {/* Left Column: Contact Form */}
                        <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a message</h2>
                            <form className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                    <input type="text" placeholder="Enter your full name" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 py-2 px-3 border" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email Address</label>
                                    <input type="email" placeholder="you@example.com" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 py-2 px-3 border" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Reason for Contact</label>
                                    <select className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 py-2 px-3 border">
                                        <option>Select an option</option>
                                        <option>General Inquiry</option>
                                        <option>Support</option>
                                        <option>Feedback</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Subject</label>
                                    <input type="text" placeholder="Regarding your recent application..." className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 py-2 px-3 border" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Your Message</label>
                                    <textarea rows={4} placeholder="Provide more details here..." className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 py-2 px-3 border"></textarea>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Attachments (Optional)</label>
                                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                        <div className="space-y-1 text-center">
                                            <span className="text-gray-500 text-sm">Choose Files</span>
                                        </div>
                                    </div>
                                </div>
                                <button type="button" className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 transition duration-150">
                                    Send Message
                                </button>
                            </form>
                        </div>

                        {/* Right Column: Dynamic Info & Map */}
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Presence</h2>
                                {loading && <p className="text-gray-500">Loading location data...</p>}

                                <div className="space-y-6">
                                    {/* Dynamic Location */}
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0 h-10 w-10 text-blue-600">
                                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-lg font-bold text-gray-900">Head Office</h3>
                                            <p className="mt-1 text-gray-500">{displayLoc.address}</p>
                                        </div>
                                    </div>

                                    {/* Dynamic Email */}
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0 h-10 w-10 text-blue-600">
                                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-lg font-bold text-gray-900">Email Us</h3>
                                            <p className="mt-1 text-gray-500">{displayLoc.email}</p>
                                        </div>
                                    </div>

                                    {/* Dynamic Phone */}
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0 h-10 w-10 text-blue-600">
                                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-lg font-bold text-gray-900">Call Us</h3>
                                            <p className="mt-1 text-gray-500">{displayLoc.phone}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Map */}
                                <div className="mt-8 rounded-lg overflow-hidden border border-gray-200 shadow-sm h-80">
                                    <iframe
                                        title="Office Location"
                                        width="100%"
                                        height="100%"
                                        frameBorder="0"
                                        scrolling="no"
                                        marginHeight="0"
                                        marginWidth="0"
                                        src={mapSrc}
                                    >
                                    </iframe>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Contact;
