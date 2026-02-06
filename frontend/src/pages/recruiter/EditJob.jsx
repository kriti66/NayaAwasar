import { useState, useEffect } from 'react';
import DashboardNavbar from '../../components/dashboard/DashboardNavbar';
import api from '../../services/api';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const EditJob = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
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
        const fetchJob = async () => {
            try {
                const res = await api.get(`/jobs/${id}`);
                const job = res.data;
                // Ideally check ownership here or in backend
                setFormData({
                    title: job.title || '',
                    company_name: job.company_name || '',
                    type: job.type || 'Full-time',
                    location: job.location || '',
                    description: job.description || '',
                    salary_range: job.salary_range || '',
                    requirements: job.requirements || ''
                });
            } catch (error) {
                console.error("Error fetching job", error);
                alert("Failed to load job details");
            } finally {
                setLoading(false);
            }
        };
        fetchJob();
    }, [id]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/jobs/${id}`, formData);
            alert('Job updated successfully!');
            navigate('/recruiter/jobs');
        } catch (error) {
            console.error('Error updating job', error);
            alert('Failed to update job');
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-emerald-100 border-t-[#2D9B82] rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Loading...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 w-full">
            <main className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                <div className="md:flex md:items-center md:justify-between mb-8">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                            Edit Job
                        </h2>
                    </div>
                    <div className="mt-4 flex md:mt-0 md:ml-4">
                        <button
                            type="button"
                            onClick={() => navigate('/recruiter/jobs')}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2D9B82]"
                        >
                            Cancel
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Job Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#2D9B82] focus:ring-[#2D9B82] sm:text-sm px-4 py-3 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Company Name</label>
                                <input
                                    type="text"
                                    name="company_name"
                                    value={formData.company_name}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#2D9B82] focus:ring-[#2D9B82] sm:text-sm px-4 py-3 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Location</label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#2D9B82] focus:ring-[#2D9B82] sm:text-sm px-4 py-3 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Type</label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#2D9B82] focus:ring-[#2D9B82] sm:text-sm px-4 py-3 border"
                                >
                                    <option>Full-time</option>
                                    <option>Part-time</option>
                                    <option>Contract</option>
                                    <option>Internship</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Salary Range</label>
                                <input
                                    type="text"
                                    name="salary_range"
                                    value={formData.salary_range}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#2D9B82] focus:ring-[#2D9B82] sm:text-sm px-4 py-3 border"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                    rows="5"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#2D9B82] focus:ring-[#2D9B82] sm:text-sm px-4 py-3 border"
                                ></textarea>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Requirements</label>
                                <textarea
                                    name="requirements"
                                    value={formData.requirements}
                                    onChange={handleChange}
                                    rows="5"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#2D9B82] focus:ring-[#2D9B82] sm:text-sm px-4 py-3 border"
                                ></textarea>
                            </div>
                        </div>
                        <div className="pt-6 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => navigate('/recruiter/jobs')}
                                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2D9B82]"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#2D9B82] hover:bg-[#25836d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2D9B82]"
                            >
                                Update Job
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default EditJob;
