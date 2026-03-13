
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
            <div className="w-12 h-12 border-4 border-[#29a08e] border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50 gap-4">
            <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 font-bold">
                {error}
            </div>
            <button
                onClick={() => navigate('/recruiter/jobs')}
                className="text-[#29a08e] font-bold hover:underline"
            >
                Back to My Jobs
            </button>
        </div>
    );

    const { jobMeta, totals, pipelineCounts, timeSeries, distributions } = data;

    // Prepare chart data
    const chartData = timeSeries.applications.map((app) => {
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
        <div className="min-h-screen bg-gray-50 pb-12 font-sans">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 pt-8 pb-10 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <button
                        onClick={() => navigate('/recruiter/jobs')}
                        className="flex items-center gap-2 text-gray-500 hover:text-[#29a08e] mb-6 transition-colors text-sm font-medium"
                    >
                        <ChevronLeft size={16} /> Back to Jobs
                    </button>
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold text-gray-900">{jobMeta.title}</h1>
                                <span className={`px-2.5 py-1 rounded text-xs font-semibold border ${jobMeta.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'
                                    }`}>
                                    {jobMeta.status}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-gray-500 text-sm">
                                <span className="flex items-center gap-1.5">
                                    <Calendar size={14} /> Posted {new Date(jobMeta.createdAt).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Briefcase size={14} /> Job ID: {jobId.slice(-6).toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                    {/* Views Card */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-500 text-sm font-medium">Total Views</span>
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <Eye size={20} />
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900">{totals.views}</h3>
                        <p className="text-gray-400 text-sm mt-1">Unique page visits</p>
                    </div>

                    {/* Applicants Card */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-500 text-sm font-medium">Applicants</span>
                            <div className="p-2 bg-emerald-50 text-[#29a08e] rounded-lg">
                                <Users size={20} />
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900">{totals.applicants}</h3>
                        <p className="text-gray-400 text-sm mt-1">Applications received</p>
                    </div>

                    {/* Conversion Rate Card */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-500 text-sm font-medium">Conversion Rate</span>
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                <TrendingUp size={20} />
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900">{totals.conversionRate}%</h3>
                        <p className="text-gray-400 text-sm mt-1">Views vs Applications</p>
                    </div>
                </div>

                {/* Main Data Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Activity Chart */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Activity Overview</h3>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                                    <span className="text-sm text-gray-600">Views</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-[#29a08e]"></div>
                                    <span className="text-sm text-gray-600">Applications</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="h-[300px] w-full mt-4">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis 
                                            dataKey="date" 
                                            tickLine={false} 
                                            axisLine={false} 
                                            tick={{ fill: '#6B7280', fontSize: 12 }}
                                            dy={10}
                                        />
                                        <YAxis 
                                            stroke="#6B7280" 
                                            fontSize={12} 
                                            tickLine={false} 
                                            axisLine={false} 
                                            dx={-10}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                            labelStyle={{ color: '#374151', fontWeight: 'bold', marginBottom: '4px' }}
                                        />
                                        <Line type="monotone" dataKey="Views" stroke="#60A5FA" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                        <Line type="monotone" dataKey="Applications" stroke="#29a08e" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-lg">
                                    <p>No activity data yet</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pipeline Funnel */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">Application Pipeline</h3>
                        <div className="space-y-6">
                            {pipelineData.map((stage) => {
                                // Simple colors based on stage
                                let barColor = "bg-[#29a08e]";
                                if (stage.name === 'In Review') barColor = "bg-amber-400";
                                if (stage.name === 'Interview') barColor = "bg-purple-500";
                                if (stage.name === 'Offered') barColor = "bg-blue-500";
                                if (stage.name === 'Rejected') barColor = "bg-red-400";

                                const percentage = totals.applicants > 0 ? (stage.count / totals.applicants) * 100 : 0;
                                
                                return (
                                    <div key={stage.name}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-gray-700">{stage.name}</span>
                                            <span className="text-sm font-bold text-gray-900">{stage.count}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div
                                                className={`${barColor} h-2 rounded-full`}
                                                style={{ width: `${Math.max(percentage, 1)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Bottom Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Location Distribution */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Applicant Locations</h3>
                            <MapPin size={18} className="text-gray-400"/>
                        </div>
                        
                        {distributions.locations.length > 0 ? (
                            <div className="space-y-4">
                                {distributions.locations.map((loc, idx) => (
                                    <div key={idx} className="flex items-center justify-between pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                                        <div className="flex items-center gap-3">
                                            <span className="text-gray-500 font-medium w-4">{idx + 1}.</span>
                                            <span className="text-gray-800 font-medium">{loc.location}</span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">{loc.count}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-32 flex flex-col items-center justify-center text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-lg">
                                <span>No location data captured</span>
                            </div>
                        )}
                    </div>

                    {/* Quality Insights Placeholder */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center items-center text-center">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Applicant Matching</h3>
                        <div className="p-4 bg-gray-50 rounded-full mb-4 mt-2 border border-gray-100">
                            <TrendingUp size={32} className="text-gray-400" />
                        </div>
                        <h4 className="text-2xl font-bold text-gray-400 mb-2">Coming Soon</h4>
                        <p className="text-sm text-gray-500 max-w-sm">
                            AI-powered match scoring and experience distribution analytics will be activated once candidate profiling is enabled.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default JobAnalytics;
