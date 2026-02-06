import Layout from '../../components/Layout';
import { Link } from 'react-router-dom';

const About = () => {
    return (
        <div className="bg-white">
            {/* Hero Section */}
            <div className="relative bg-white py-20 px-4 sm:px-6 lg:px-8 text-center border-b border-gray-100">
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                    About <span className="text-blue-600">Naya Awasar</span>
                </h1>
                <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-500">
                    We are dedicated to bridging the gap between talent and opportunity in Nepal.
                </p>
            </div>

            {/* Mission Section */}
            <div className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100">
                            <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-6">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
                            <p className="text-gray-600 leading-relaxed">
                                To create a transparent and efficient job market where every professional can find their ideal career and every company can find the right talent to grow.
                            </p>
                        </div>
                        <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100">
                            <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-6">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h2>
                            <p className="text-gray-600 leading-relaxed">
                                To become Nepal's most trusted recruitment platform, recognized for ethical practices and helping millions build successful careers.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Values Section */}
            <div className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900">Our Core <span className="text-blue-600">Values</span></h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { title: "Integrity", desc: "Honesty and transparency in everything we do." },
                            { title: "Innovation", desc: "Using technology to simplify recruitment." },
                            { title: "Excellence", desc: "Striving for the best results for our users." }
                        ].map((v, i) => (
                            <div key={i} className="p-8 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-colors">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{v.title}</h3>
                                <p className="text-gray-500">{v.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Team Section */}
            <div className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900">Meet Our <span className="text-blue-600">Team</span></h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { name: "Aisha Khan", role: "CEO", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&h=256&q=80" },
                            { name: "Rohan Sharma", role: "CTO", img: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=256&h=256&q=80" },
                            { name: "Priya Singh", role: "HR Manager", img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" }
                        ].map((m, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl text-center shadow-sm border border-gray-100">
                                <img className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-blue-50" src={m.img} alt={m.name} />
                                <h3 className="text-lg font-bold text-gray-900">{m.name}</h3>
                                <p className="text-sm text-blue-600 font-medium">{m.role}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="py-20 bg-blue-600">
                <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-white mb-8">
                        Ready to work with us?
                    </h2>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link to="/contact" className="px-8 py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-all">
                            Contact Us
                        </Link>
                        <Link to="/register" className="px-8 py-3 bg-blue-700 text-white rounded-xl font-bold hover:bg-blue-800 transition-all border border-blue-500">
                            Join Now
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;
