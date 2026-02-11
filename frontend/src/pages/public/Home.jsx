import { Link } from 'react-router-dom';


const Home = () => {
    return (
        <>
            {/* Hero Section */}
            <div className="relative bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 flex flex-col lg:flex-row items-center gap-12">
                    <div className="flex-1 text-center lg:text-left">
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
                            Your Journey to a <br />
                            <span className="text-blue-600">Brighter Future</span> Starts Here
                        </h1>
                        <p className="mt-6 text-lg text-gray-500 max-w-2xl mx-auto lg:mx-0">
                            Discover thousands of job opportunities or find the perfect talent for your team. Naya Awasar is Nepal's most trusted recruitment bridge.
                        </p>
                        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Link
                                to="/register?role=jobseeker"
                                className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 text-center"
                            >
                                I'm a Job Seeker
                            </Link>
                            <Link
                                to="/register?role=recruiter"
                                className="px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all text-center"
                            >
                                I'm a Recruiter
                            </Link>
                        </div>
                    </div>
                    <div className="flex-1 relative">
                        <img
                            className="rounded-3xl shadow-2xl w-full object-cover aspect-video lg:aspect-square"
                            src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-1.2.1&auto=format&fit=crop&w=2850&q=80"
                            alt="Team working together"
                        />
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="bg-gray-50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
                        <div className="p-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <p className="text-4xl font-extrabold text-gray-900">10K+</p>
                            <p className="mt-2 text-sm font-bold text-blue-600 uppercase tracking-widest">Jobs Posted</p>
                        </div>
                        <div className="p-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <p className="text-4xl font-extrabold text-gray-900">50K+</p>
                            <p className="mt-2 text-sm font-bold text-blue-600 uppercase tracking-widest">Active Seekers</p>
                        </div>
                        <div className="p-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <p className="text-4xl font-extrabold text-gray-900">500+</p>
                            <p className="mt-2 text-sm font-bold text-blue-600 uppercase tracking-widest">Companies</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Why Choose Us Section */}
            <div className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900">Why Choose <span className="text-blue-600">Naya Awasar?</span></h2>
                        <p className="mt-4 text-lg text-gray-500">We provide a seamless experience for both job seekers and employers.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            {
                                title: 'Easy Process',
                                description: 'Streamlined steps to apply for your dream job with just a few clicks.',
                                icon: (
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                ),
                            },
                            {
                                title: 'Smart Search',
                                description: 'Search and filter tailored to your skills and preferences.',
                                icon: (
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                ),
                            },
                            {
                                title: 'Secure data',
                                description: 'Your data and applications are protected with industry-standard security.',
                                icon: (
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                ),
                            },
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col items-center text-center p-6 rounded-2xl hover:bg-gray-50 transition-colors">
                                <div className="h-14 w-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6 shadow-sm">
                                    {item.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                                <p className="text-gray-500 leading-relaxed">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Testimonials Section */}
            <div className="bg-gray-50 py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">What Our <span className="text-blue-600">Users Say</span></h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                name: 'Jane Doe',
                                role: 'Software Engineer',
                                quote: "Naya Awasar made my job search incredibly easy. I found my dream job within a week!",
                                image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
                            },
                            {
                                name: 'John Smith',
                                role: 'Marketing Manager',
                                quote: "The platform's smart recommendations were spot on. Highly recommended.",
                                image: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
                            },
                            {
                                name: 'Alice Johnson',
                                role: 'HR Specialist',
                                quote: "Finding qualified candidates has never been easier. Naya Awasar is a game-changer.",
                                image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
                            },
                        ].map((t, i) => (
                            <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                                <p className="text-gray-600 italic mb-8">"{t.quote}"</p>
                                <div className="flex items-center gap-4">
                                    <img className="h-12 w-12 rounded-full border-2 border-blue-100" src={t.image} alt={t.name} />
                                    <div>
                                        <p className="font-bold text-gray-900">{t.name}</p>
                                        <p className="text-sm text-blue-600 font-medium">{t.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-blue-600 py-16">
                <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                        Ready to take the next step?
                    </h2>
                    <p className="mt-4 text-xl text-blue-100">
                        Join thousands of professionals finding success on Naya Awasar today.
                    </p>
                    <div className="mt-10">
                        <Link
                            to="/register"
                            className="inline-flex items-center justify-center px-10 py-4 border border-transparent text-lg font-bold rounded-xl text-blue-600 bg-white hover:bg-blue-50 transition-all shadow-xl"
                        >
                            Get Started for Free
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Home;
