import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';

const Home = () => {
    return (
        <Layout>
            {/* Hero Section */}
            <div className="relative bg-white overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
                        <svg
                            className="hidden lg:block absolute right-0 inset-y-0 h-full w-48 text-white transform translate-x-1/2"
                            fill="currentColor"
                            viewBox="0 0 100 100"
                            preserveAspectRatio="none"
                            aria-hidden="true"
                        >
                            <polygon points="50,0 100,0 50,100 0,100" />
                        </svg>

                        <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
                            <div className="sm:text-center lg:text-left">
                                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                                    <span className="block xl:inline">Your Journey to a</span>{' '}
                                    <span className="block text-blue-600 xl:inline">Brighter Future Starts Here</span>
                                </h1>
                                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                                    Discover thousands of job opportunities or find the perfect talent for your team. Naya Awasar is your bridge to success.
                                </p>
                                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                                    <div className="rounded-md shadow">
                                        <Link
                                            to="/register?role=jobseeker"
                                            className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                                        >
                                            I'm a Job Seeker
                                        </Link>
                                    </div>
                                    <div className="mt-3 sm:mt-0 sm:ml-3">
                                        <Link
                                            to="/register?role=recruiter"
                                            className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 md:py-4 md:text-lg md:px-10"
                                        >
                                            I'm a Recruiter
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </main>
                    </div>
                </div>
                <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
                    <img
                        className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full"
                        src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2850&q=80"
                        alt="Diverse team working together"
                    />
                </div>
            </div>

            {/* Stats Section */}
            <div className="bg-blue-800">
                <div className="max-w-7xl mx-auto py-12 px-4 sm:py-16 sm:px-6 lg:px-8 lg:py-20">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                            Trusted by people and companies worldwide
                        </h2>
                    </div>
                    <dl className="mt-10 text-center sm:max-w-3xl sm:mx-auto sm:grid sm:grid-cols-3 sm:gap-8">
                        <div className="flex flex-col">
                            <dt className="order-2 mt-2 text-lg leading-6 font-medium text-blue-200">Jobs Posted</dt>
                            <dd className="order-1 text-5xl font-extrabold text-white">10k+</dd>
                        </div>
                        <div className="flex flex-col mt-10 sm:mt-0">
                            <dt className="order-2 mt-2 text-lg leading-6 font-medium text-blue-200">Active Seekers</dt>
                            <dd className="order-1 text-5xl font-extrabold text-white">50k+</dd>
                        </div>
                        <div className="flex flex-col mt-10 sm:mt-0">
                            <dt className="order-2 mt-2 text-lg leading-6 font-medium text-blue-200">Companies</dt>
                            <dd className="order-1 text-5xl font-extrabold text-white">500+</dd>
                        </div>
                    </dl>
                </div>
            </div>

            {/* Why Choose Us Section */}
            <div className="py-16 bg-gray-50 overflow-hidden lg:py-24">
                <div className="relative max-w-xl mx-auto px-4 sm:px-6 lg:px-8 lg:max-w-7xl">
                    <div className="relative">
                        <h2 className="text-center text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                            Why Choose Naya Awasar?
                        </h2>
                        <p className="mt-4 max-w-3xl mx-auto text-center text-xl text-gray-500">
                            We provide a seamless experience for both job seekers and employers.
                        </p>
                    </div>

                    <div className="relative mt-12 lg:mt-24 lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
                        <div className="relative">
                            <dl className="space-y-10">
                                {[
                                    {
                                        id: 1,
                                        title: 'Easy Application Process',
                                        description: 'Streamlined steps to apply for your dream job with just a few clicks.',
                                        icon: (
                                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        ),
                                    },
                                    {
                                        id: 2,
                                        title: 'Smart Job Recommendations',
                                        description: 'AI-powered suggestions tailored to your skills and preferences.',
                                        icon: (
                                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                        ),
                                    },
                                    {
                                        id: 3,
                                        title: 'Secure and Private',
                                        description: 'Your data and applications are protected with industry-standard security.',
                                        icon: (
                                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        ),
                                    },
                                ].map((item) => (
                                    <div key={item.id} className="relative">
                                        <dt>
                                            <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                                                {item.icon}
                                            </div>
                                            <p className="ml-16 text-lg leading-6 font-medium text-gray-900">{item.title}</p>
                                        </dt>
                                        <dd className="mt-2 ml-16 text-base text-gray-500">{item.description}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>

                        <div className="mt-10 -mx-4 relative lg:mt-0" aria-hidden="true">
                            <img
                                className="relative mx-auto rounded-lg shadow-lg transform lg:rotate-2 hover:rotate-0 transition-transform duration-300"
                                width={490}
                                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&auto=format&fit=crop&w=2850&q=80"
                                alt="People working together"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Companies Section */}
            <div className="bg-white py-16 sm:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                            Join Top Companies Hiring Now
                        </h2>
                        <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
                            Kickstart your career with industry leaders who trust us.
                        </p>
                    </div>
                    <div className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-6 lg:grid-cols-5">
                        {[
                            { name: 'Tech Innovate', color: 'bg-indigo-100 text-indigo-600' },
                            { name: 'Global Solutions', color: 'bg-green-100 text-green-600' },
                            { name: 'Creative Digital', color: 'bg-pink-100 text-pink-600' },
                            { name: 'Finance Forward', color: 'bg-yellow-100 text-yellow-600' },
                            { name: 'Green Earth Corp', color: 'bg-teal-100 text-teal-600' },
                        ].map((company) => (
                            <div key={company.name} className="col-span-1 flex justify-center md:col-span-2 lg:col-span-1">
                                <div className={`flex items-center justify-center h-24 w-full rounded-lg ${company.color} font-bold text-lg shadow-sm hover:shadow-md transition-shadow`}>
                                    {company.name}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Testimonials Section */}
            <div className="bg-blue-50 py-16 lg:py-24">
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative">
                        <h2 className="text-center text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                            What Our Users Say
                        </h2>
                    </div>
                    <div className="mt-12 max-w-lg mx-auto grid gap-5 lg:grid-cols-3 lg:max-w-none">
                        {[
                            {
                                name: 'Jane Doe',
                                role: 'Senior Software Engineer',
                                image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
                                quote: "Naya Awasar made my job search incredibly easy. I found my dream job within a week!",
                            },
                            {
                                name: 'John Smith',
                                role: 'Marketing Manager',
                                image: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
                                quote: "The platform's smart recommendations were spot on. Highly recommended for recruitment.",
                            },
                            {
                                name: 'Alice Johnson',
                                role: 'HR Specialist',
                                image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
                                quote: "Finding qualified candidates has never been easier. Naya Awasar is a game-changer.",
                            },
                        ].map((testimonial) => (
                            <div key={testimonial.name} className="flex flex-col rounded-lg shadow-lg overflow-hidden bg-white hover:shadow-xl transition-shadow duration-300">
                                <div className="flex-1 bg-white p-6 flex flex-col justify-between">
                                    <div className="flex-1">
                                        <p className="text-gray-500 italic">"{testimonial.quote}"</p>
                                    </div>
                                    <div className="mt-6 flex items-center">
                                        <div className="flex-shrink-0">
                                            <img className="h-10 w-10 rounded-full" src={testimonial.image} alt={testimonial.name} />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-gray-900">{testimonial.name}</p>
                                            <p className="text-sm text-gray-500">{testimonial.role}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-blue-700">
                <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                        <span className="block">Ready to take the next step?</span>
                        <span className="block">Join Naya Awasar today.</span>
                    </h2>
                    <p className="mt-4 text-lg leading-6 text-blue-200">
                        Whether you are hiring or looking for a job, we have the right tools for you.
                    </p>
                    <Link
                        to="/register"
                        className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 sm:w-auto"
                    >
                        Sign up for free
                    </Link>
                </div>
            </div>
        </Layout>
    );
};

export default Home;
