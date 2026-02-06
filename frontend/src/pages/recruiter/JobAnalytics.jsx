
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import {
    Users, Eye, TrendingUp, Calendar, ChevronLeft, MapPin, Briefcase
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';

const JobAnalytics = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await api.get(`/recruiter/jobs/${jobId}/analytics`);
                setData(res.data);
            } catch (err) {
                console.error("Analytics fetch error:", err);
                if (err.response?.status === 403) {
                    setError("Unauthorized: You can only view analytics for your own jobs.");
                } else {
                    setError(`Error: ${err.response?.data?.message || err.message || "Failed to load analytics data."}`);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [jobId]);

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-gray-50">
            <div className="w-12 h-12 border-4 border-[#2D9B82] border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50 gap-4">
            <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 font-bold">
                {error}
            </div>
            <button
                onClick={() => navigate('/recruiter/jobs')}
                className="text-[#2D9B82] font-bold hover:underline"
            >
                Back to My Jobs
            </button>
        </div>
    );

    const { jobMeta, totals, pipelineCounts, timeSeries, distributions } = data;

    // Prepare chart data
    const chartData = timeSeries.applications.map((app, index) => {
        const viewData = timeSeries.views.find(v => v.date === app.date);
        return {
            date: app.date,
            Applications: app.count,
            Views: viewData ? viewData.count : 0
        };
    });

    // Pipeline Data for Bar Chart
    const pipelineData = [
        { name: 'In Review', count: pipelineCounts.in_review },
        { name: 'Interview', count: pipelineCounts.interview },
        { name: 'Offered', count: pipelineCounts.offered },
        { name: 'Hired', count: pipelineCounts.hired },
        { name: 'Rejected', count: pipelineCounts.rejected },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <div className="bg-[#111827] text-white pt-8 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <button
                        onClick={() => navigate('/recruiter/jobs')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
                    >
                        <ChevronLeft size={16} /> Back to Jobs
                    </button>
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">{jobMeta.title}</h1>
                            <p className="text-gray-400 text-sm flex items-center gap-4">
                                <span className="flex items-center gap-1.5">
                                    <Calendar size={14} /> Posted {new Date(jobMeta.createdAt).toLocaleDateString()}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${jobMeta.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700 text-gray-400'
                                    }`}>
                                    {jobMeta.status}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                <Eye size={24} />
                            </div>
                            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Views</span>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900">{totals.views}</h3>
                        <p className="text-gray-400 text-xs mt-1">Unique page visits</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                                <Users size={24} />
                            </div>
                            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Applicants</span>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900">{totals.applicants}</h3>
                        <p className="text-gray-400 text-xs mt-1">Total applications received</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                                <TrendingUp size={24} />
                            </div>
                            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Conversion Rate</span>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900">{totals.conversionRate}%</h3>
                        <p className="text-gray-400 text-xs mt-1">Views to application ratio</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Activity Chart */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">Activity Overview (Last 30 Days)</h3>
                        <div className="h-64">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="date" hide />
                                        <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                            labelStyle={{ color: '#6B7280', marginBottom: '4px', fontSize: '12px' }}
                                        />
                                        <Line type="monotone" dataKey="Views" stroke="#60A5FA" strokeWidth={3} dot={false} />
                                        <Line type="monotone" dataKey="Applications" stroke="#10B981" strokeWidth={3} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400 text-sm">No activity data yet</div>
                            )}
                        </div>
                        <div className="flex justify-center gap-6 mt-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                                <span className="text-xs font-bold text-gray-500">Views</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                <span className="text-xs font-bold text-gray-500">Applications</span>
                            </div>
                        </div>
                    </div>

                    {/* Pipeline Funnel */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">Application Pipeline</h3>
                        <div className="space-y-4">
                            {pipelineData.map((stage) => (
                                <div key={stage.name} className="relative group">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium text-gray-700">{stage.name}</span>
                                        <span className="text-sm font-bold text-gray-900">{stage.count}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className="bg-[#2D9B82] h-2.5 rounded-full transition-all duration-1000"
                                            style={{ width: `${totals.applicants > 0 ? (stage.count / totals.applicants) * 100 : 0}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Location Distribution */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Applicant Locations</h3>
                            <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-[10px] font-bold uppercase">Top 5</span>
                        </div>
                        {distributions.locations.length > 0 ? (
                            <div className="space-y-3">
                                {distributions.locations.map((loc, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-400 font-bold text-xs border border-gray-100 shadow-sm">
                                                {idx + 1}
                                            </div>
                                            <span className="text-sm font-bold text-gray-700">{loc.location}</span>
                                        </div>
                                        <span className="text-sm font-bold text-[#2D9B82]">{loc.count}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center text-gray-400 text-sm">No location data available</div>
                        )}
                    </div>

                    {/* Quality / Experience */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 rounded-bl-xl rounded-br-xl">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">Experience & Quality</h3>
                        <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 text-center mb-6">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Avg Match Score</p>
                            <h4 className="text-4xl font-black text-gray-900 mb-1">--</h4>
                            <p className="text-xs text-gray-400">Match scoring coming soon</p>
                        </div>
                        <div className="text-center text-gray-400 text-xs">
                            Experience distribution visualization will appear here once enough data is collected.
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default JobAnalytics;
