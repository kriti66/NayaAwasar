import { useState, useEffect } from 'react';
import RecruiterLayout from '../../components/layouts/RecruiterLayout';
import api from '../../services/api';
import companyService from '../../services/companyService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Building2, AlertTriangle } from 'lucide-react';

const PostJob = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loadingCompany, setLoadingCompany] = useState(true);
    const [company, setCompany] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        company_name: '',
        type: 'Full-time',
        location: '',
        description: '',
        salary_range: '',
        requirements: ''
    });

    useEffect(() => {
        const fetchRecruiterCompany = async () => {
            try {
                const myCompany = await companyService.getMyCompany();
                setCompany(myCompany);
                if (myCompany) {
                    setFormData(prev => ({
                        ...prev,
                        company_name: myCompany.name,
                        location: myCompany.headquarters
                    }));
                }
            } catch (error) {
                console.error("Failed to load company profile", error);
            } finally {
                setLoadingCompany(false);
            }
        };
        fetchRecruiterCompany();
    }, []);

    if (loadingCompany) {
        return (
            <RecruiterLayout>
                <div className="flex h-screen items-center justify-center">
                    <div className="w-12 h-12 border-4 border-[#2D9B82]/30 border-t-[#2D9B82] rounded-full animate-spin"></div>
                </div>
            </RecruiterLayout>
        );
    }

    if (!company || company.status !== 'approved') {
        return (
            <RecruiterLayout>
                <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-lg shadow-sm">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <AlertTriangle className="h-6 w-6 text-yellow-500" />
                            </div>
                            <div className="ml-4">
                                <h3 className="text-xl font-bold text-yellow-800">Company Profile Incomplete</h3>
                                <div className="mt-2 text-sm text-yellow-700">
                                    <p className="mb-4">
                                        You need an <strong>Approved Company Profile</strong> before you can post jobs.
                                        {company ? " Your current company status is " + company.status.toUpperCase() + "." : " You haven't created a company profile yet."}
                                    </p>
                                    <button
                                        onClick={() => navigate('/recruiter/company')}
                                        className="font-bold underline text-yellow-800 hover:text-yellow-600"
                                    >
                                        Go to Company Profile &rarr;
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </RecruiterLayout>
        );
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/jobs', { ...formData, recruiter_id: user.id });
            alert('Job posted successfully!');
            navigate('/recruiter/dashboard');
        } catch (error) {
            console.error('Error posting job', error);
            alert('Failed to post job');
        }
    };

    return (
        <RecruiterLayout>
            <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
                <div className="md:flex md:items-center md:justify-between mb-8">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                            Post a Job
                        </h2>
                    </div>
                    <div className="mt-4 flex md:mt-0 md:ml-4">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2D9B82]"
                        >
                            Cancel
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1">Job Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g. Senior Software Engineer"
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#2D9B82] focus:ring-[#2D9B82] sm:text-sm px-4 py-3 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Company Name</label>
                                <input
                                    type="text"
                                    name="company_name"
                                    value={formData.company_name}
                                    readOnly
                                    className="block w-full rounded-lg border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed shadow-sm focus:ring-0 sm:text-sm px-4 py-3 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Location</label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    readOnly
                                    className="block w-full rounded-lg border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed shadow-sm focus:ring-0 sm:text-sm px-4 py-3 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Job Type</label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#2D9B82] focus:ring-[#2D9B82] sm:text-sm px-4 py-3 border"
                                >
                                    <option>Full-time</option>
                                    <option>Part-time</option>
                                    <option>Contract</option>
                                    <option>Internship</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Salary Range</label>
                                <input
                                    type="text"
                                    name="salary_range"
                                    value={formData.salary_range}
                                    onChange={handleChange}
                                    placeholder="e.g. NRs. 50,000 - 80,000"
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#2D9B82] focus:ring-[#2D9B82] sm:text-sm px-4 py-3 border"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1">Job Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                    rows="5"
                                    placeholder="Describe the role and responsibilities..."
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#2D9B82] focus:ring-[#2D9B82] sm:text-sm px-4 py-3 border"
                                ></textarea>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1">Requirements</label>
                                <textarea
                                    name="requirements"
                                    value={formData.requirements}
                                    onChange={handleChange}
                                    rows="5"
                                    placeholder="List the required skills and qualifications..."
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#2D9B82] focus:ring-[#2D9B82] sm:text-sm px-4 py-3 border"
                                ></textarea>
                            </div>
                        </div>
                        <div className="pt-6 border-t border-gray-200 flex justify-end">
                            <button
                                type="submit"
                                className="ml-3 inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-bold rounded-lg text-white bg-[#2D9B82] hover:bg-[#25836d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2D9B82]"
                            >
                                Post Job
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </RecruiterLayout>
    );
};

export default PostJob;
