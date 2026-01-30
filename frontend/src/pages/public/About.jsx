import Layout from '../../components/Layout';
import { Link } from 'react-router-dom';

const About = () => {
    return (
        <Layout>
            <div className="bg-white">
                {/* Hero Section */}
                <div className="relative bg-white overflow-hidden text-center py-20 px-4 sm:px-6 lg:px-8">
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                        About <span className="text-blue-600">Naya Awasar</span>
                    </h1>
                    <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
                        Empowering careers, connecting talent with opportunity. Discover our story.
                    </p>
                </div>

                {/* Mission & Vision Section */}
                <div className="bg-gray-50 py-16 lg:py-24">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {/* Mission */}
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
                                <p className="text-lg text-gray-600 leading-relaxed">
                                    Naya Awasar is committed to revolutionizing the job market by creating a seamless and transparent platform where every individual can find their ideal career path and every employer can discover exceptional talent. We believe in fostering growth, innovation, and equal opportunities for all.
                                </p>
                            </div>
                            {/* Vision */}
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Vision</h2>
                                <p className="text-lg text-gray-600 leading-relaxed">
                                    To be the leading global job portal, recognized for our innovative technology, ethical practices, and profound impact on career development and organizational success. We envision a future where geographical boundaries and traditional barriers no longer limit professional aspirations.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Core Values Section */}
                <div className="py-16 lg:py-24">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-extrabold text-gray-900">Our Core Values</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[
                                {
                                    title: "Integrity",
                                    desc: "We uphold the highest standards of honesty and transparency in all our interactions, building trust with job seekers and employers."
                                },
                                {
                                    title: "Innovation",
                                    desc: "We continuously seek new ways to improve our platform, leveraging cutting-edge technology to simplify the job search and hiring process."
                                },
                                {
                                    title: "Empowerment",
                                    desc: "We empower individuals to take control of their careers and help businesses find the talent they need to thrive."
                                },
                                {
                                    title: "Community",
                                    desc: "We foster a supportive community where knowledge sharing and mutual growth are celebrated."
                                },
                                {
                                    title: "Excellence",
                                    desc: "We are dedicated to delivering exceptional service and results, always striving for perfection in everything we do."
                                },
                                {
                                    title: "Inclusivity",
                                    desc: "We are committed to creating an inclusive environment, ensuring equal opportunities for everyone, regardless of background."
                                }
                            ].map((value, index) => (
                                <div key={index} className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">{value.title}</h3>
                                    <p className="text-gray-600">{value.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Team Section */}
                <div className="bg-gray-50 py-16 lg:py-24">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-extrabold text-gray-900">Meet Our Dedicated Team</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
                            {[
                                { name: "Aisha Khan", role: "Founder & CEO", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" },
                                { name: "Rohan Sharma", role: "Chief Technology Officer", img: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" },
                                { name: "Priya Singh", role: "Head of Talent Acquisition", img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" },
                                { name: "David Lee", role: "Lead Product Designer", img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" },
                                { name: "Emily Chen", role: "Marketing Director", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" },
                                { name: "Omar Hassan", role: "Head of Customer Success", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" }
                            ].map((member, index) => (
                                <div key={index} className="bg-white p-6 rounded-lg text-center shadow-sm hover:shadow-lg transition-all duration-300">
                                    <img className="w-32 h-32 rounded-full mx-auto mb-4 object-cover ring-4 ring-blue-50" src={member.img} alt={member.name} />
                                    <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
                                    <p className="text-blue-600 font-medium">{member.role}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="py-16">
                    <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-6">
                            Ready to Connect? Get in Touch or Partner With Us!
                        </h2>
                        <p className="text-xl text-gray-500 mb-8">
                            Whether you're a job seeker looking for your next big opportunity, or an employer aiming to find top-tier talent, Naya Awasar is here for you.
                        </p>
                        <div className="flex justify-center gap-4">
                            <Link to="/contact" className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:text-lg">
                                Contact Our Team
                            </Link>
                            <Link to="/register?role=recruiter" className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 md:text-lg">
                                Register as an Employer
                            </Link>
                        </div>
                    </div>
                </div>

            </div>
        </Layout>
    );
};

export default About;
