import { useState, useEffect } from 'react';
import DashboardNavbar from '../../components/dashboard/DashboardNavbar';
import api from '../../services/api';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Briefcase, Building2, MapPin, DollarSign, FileText, List, Edit } from 'lucide-react';

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
            <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <div className="w-12 h-12 border-4 border-[#29a08e]/30 border-t-[#29a08e] rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-bold text-gray-400">Loading job details...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 w-full">
            {/* ─── Hero Header ─────────────────────────────── */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#0d2f2b] to-slate-900 pt-12 pb-28 px-4 sm:px-6 lg:px-8">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-10 w-64 h-64 bg-[#29a08e] rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 right-20 w-80 h-80 bg-teal-400 rounded-full blur-3xl"></div>
                </div>
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

                <div className="relative max-w-4xl mx-auto">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                        <div className="text-white animate-fade-in-up">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-sm font-medium text-gray-200 backdrop-blur-sm mb-4">
                                <Edit size={14} />
                                Edit Listing
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
                                Edit <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#29a08e] to-teal-300">Job</span>
                            </h1>
                            <p className="text-gray-300 text-lg">Update your job posting details</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate('/recruiter/jobs')}
                            className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-2xl font-bold text-sm hover:bg-white/20 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>


            </div>

            <main className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto -mt-16 pb-12 relative z-10">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    {/* Form Header */}
                    <div className="px-8 pt-8 pb-6 border-b border-gray-50">
                        <p className="text-[#29a08e] font-bold text-[10px] uppercase tracking-[0.2em] mb-1">Editing</p>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">{formData.title || 'Job Details'}</h3>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                    <Briefcase size={14} className="text-[#29a08e]" />
                                    Job Title
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                    className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-[#29a08e] focus:ring-[#29a08e] sm:text-sm px-4 py-3.5 border bg-gray-50/50 hover:bg-white transition-colors"
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                    <Building2 size={14} className="text-[#29a08e]" />
                                    Company Name
                                </label>
                                <input
                                    type="text"
                                    name="company_name"
                                    value={formData.company_name}
                                    onChange={handleChange}
                                    required
                                    className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-[#29a08e] focus:ring-[#29a08e] sm:text-sm px-4 py-3.5 border bg-gray-50/50 hover:bg-white transition-colors"
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                    <MapPin size={14} className="text-[#29a08e]" />
                                    Location
                                </label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    required
                                    className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-[#29a08e] focus:ring-[#29a08e] sm:text-sm px-4 py-3.5 border bg-gray-50/50 hover:bg-white transition-colors"
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                    <List size={14} className="text-[#29a08e]" />
                                    Type
                                </label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-[#29a08e] focus:ring-[#29a08e] sm:text-sm px-4 py-3.5 border bg-gray-50/50 hover:bg-white transition-colors"
                                >
                                    <option>Full-time</option>
                                    <option>Part-time</option>
                                    <option>Contract</option>
                                    <option>Internship</option>
                                </select>
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                    <DollarSign size={14} className="text-[#29a08e]" />
                                    Salary Range
                                </label>
                                <input
                                    type="text"
                                    name="salary_range"
                                    value={formData.salary_range}
                                    onChange={handleChange}
                                    className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-[#29a08e] focus:ring-[#29a08e] sm:text-sm px-4 py-3.5 border bg-gray-50/50 hover:bg-white transition-colors"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                    <FileText size={14} className="text-[#29a08e]" />
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                    rows="5"
                                    className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-[#29a08e] focus:ring-[#29a08e] sm:text-sm px-4 py-3.5 border bg-gray-50/50 hover:bg-white transition-colors"
                                ></textarea>
                            </div>
                            <div className="col-span-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                    <List size={14} className="text-[#29a08e]" />
                                    Requirements
                                </label>
                                <textarea
                                    name="requirements"
                                    value={formData.requirements}
                                    onChange={handleChange}
                                    rows="5"
                                    className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-[#29a08e] focus:ring-[#29a08e] sm:text-sm px-4 py-3.5 border bg-gray-50/50 hover:bg-white transition-colors"
                                ></textarea>
                            </div>
                        </div>
                        <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => navigate('/recruiter/jobs')}
                                className="px-6 py-3 border border-gray-200 text-sm font-bold rounded-xl text-gray-600 bg-white hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="inline-flex items-center gap-2 px-8 py-3 bg-[#29a08e] text-white rounded-xl font-bold text-sm hover:bg-[#228377] shadow-lg shadow-[#29a08e]/20 transition-all active:scale-95"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
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
