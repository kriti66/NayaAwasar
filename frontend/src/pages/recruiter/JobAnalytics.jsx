
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import {
    Users, Eye, TrendingUp, Calendar, ChevronLeft, MapPin, Briefcase, BarChart3
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
        <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50 gap-4">
            <div className="w-12 h-12 border-4 border-[#29a08e]/30 border-t-[#29a08e] rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-gray-400">Loading analytics...</p>
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-6">
            <div className="p-5 bg-rose-50 text-rose-600 rounded-2xl border border-rose-200 font-bold text-sm max-w-md text-center">
                {error}
            </div>
            <button
                onClick={() => navigate('/recruiter/jobs')}
                className="inline-flex items-center gap-2 text-[#29a08e] font-bold hover:text-[#228377] transition-colors"
            >
                <ChevronLeft size={16} /> Back to My Jobs
            </button>
        </div>
    );

    const { jobMeta, totals, pipelineCounts, timeSeries, distributions } = data;

    const chartData = timeSeries.applications.map((app) => {
        const viewData = timeSeries.views.find(v => v.date === app.date);
        return {
            date: app.date,
            Applications: app.count,
            Views: viewData ? viewData.count : 0
        };
    });

    const pipelineData = [
        { name: 'In Review', count: pipelineCounts.in_review, color: '#F59E0B' },
        { name: 'Interview', count: pipelineCounts.interview, color: '#8B5CF6' },
        { name: 'Offered', count: pipelineCounts.offered, color: '#3B82F6' },
        { name: 'Hired', count: pipelineCounts.hired, color: '#29a08e' },
        { name: 'Rejected', count: pipelineCounts.rejected, color: '#EF4444' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* ─── Hero Header ─────────────────────────────── */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#0d2f2b] to-slate-900 pt-8 pb-28 px-4 sm:px-6 lg:px-8">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-10 w-64 h-64 bg-[#29a08e] rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 right-20 w-80 h-80 bg-teal-400 rounded-full blur-3xl"></div>
                </div>
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

                <div className="relative max-w-7xl mx-auto">
                    <button
                        onClick={() => navigate('/recruiter/jobs')}
                        className="flex items-center gap-2 text-gray-300 hover:text-white mb-8 transition-colors text-sm font-bold group"
                    >
                        <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                        Back to Jobs
                    </button>

                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
                        <div className="animate-fade-in-up">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-sm font-medium text-gray-200 backdrop-blur-sm mb-4">
                                <BarChart3 size={14} />
                                Job Analytics
                            </div>
                            <div className="flex items-center gap-3 mb-3">
                                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">{jobMeta.title}</h1>
                                <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${jobMeta.status === 'Active'
                                    ? 'bg-[#29a08e]/20 text-[#29a08e] border-[#29a08e]/30'
                                    : 'bg-white/10 text-gray-300 border-white/20'
                                }`}>
                                    {jobMeta.status}
                                </span>
                            </div>
                            <div className="flex items-center gap-5 text-gray-300 text-sm">
                                <span className="flex items-center gap-1.5">
                                    <Calendar size={14} className="text-[#29a08e]" />
                                    Posted {new Date(jobMeta.createdAt).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Briefcase size={14} className="text-[#29a08e]" />
                                    ID: {jobId.slice(-6).toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>


            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 pb-16 relative z-10">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    {[
                        { label: 'Total Views', value: totals.views, desc: 'Unique page visits', icon: <Eye size={22} />, gradient: 'from-blue-50 to-indigo-50', iconBg: 'bg-blue-50 text-blue-500' },
                        { label: 'Applicants', value: totals.applicants, desc: 'Applications received', icon: <Users size={22} />, gradient: 'from-[#29a08e]/5 to-teal-50', iconBg: 'bg-[#29a08e]/10 text-[#29a08e]' },
                        { label: 'Conversion Rate', value: `${totals.conversionRate}%`, desc: 'Views vs Applications', icon: <TrendingUp size={22} />, gradient: 'from-purple-50 to-violet-50', iconBg: 'bg-purple-50 text-purple-500' },
                    ].map((stat, i) => (
                        <div key={i} className={`bg-gradient-to-br ${stat.gradient} p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-[#29a08e]/20 transition-all duration-300 hover:-translate-y-0.5`}>
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</span>
                                <div className={`p-2.5 ${stat.iconBg} rounded-xl`}>
                                    {stat.icon}
                                </div>
                            </div>
                            <h3 className="text-3xl font-black text-gray-900 mb-1">{stat.value}</h3>
                            <p className="text-xs text-gray-400 font-medium">{stat.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Main Data Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Activity Chart */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <p className="text-[#29a08e] font-bold text-[10px] uppercase tracking-[0.2em] mb-1">Performance</p>
                                <h3 className="text-lg font-black text-gray-900 tracking-tight">Activity Overview</h3>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                                    <span className="text-xs text-gray-500 font-medium">Views</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-[#29a08e]"></div>
                                    <span className="text-xs text-gray-500 font-medium">Applications</span>
                                </div>
                            </div>
                        </div>

                        <div className="h-[300px] w-full mt-4">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                        <XAxis
                                            dataKey="date"
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 600 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            stroke="#94A3B8"
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                            dx={-10}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', padding: '12px 16px' }}
                                            labelStyle={{ color: '#0F172A', fontWeight: 800, marginBottom: '6px', fontSize: 12 }}
                                        />
                                        <Line type="monotone" dataKey="Views" stroke="#60A5FA" strokeWidth={2.5} dot={{ r: 3, fill: '#60A5FA' }} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} />
                                        <Line type="monotone" dataKey="Applications" stroke="#29a08e" strokeWidth={2.5} dot={{ r: 3, fill: '#29a08e' }} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                                    <BarChart3 size={32} className="mb-3 text-gray-300" />
                                    <p className="font-bold text-sm">No activity data yet</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pipeline Funnel */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="mb-6">
                            <p className="text-[#29a08e] font-bold text-[10px] uppercase tracking-[0.2em] mb-1">Pipeline</p>
                            <h3 className="text-lg font-black text-gray-900 tracking-tight">Application Funnel</h3>
                        </div>
                        <div className="space-y-5">
                            {pipelineData.map((stage) => {
                                const percentage = totals.applicants > 0 ? (stage.count / totals.applicants) * 100 : 0;
                                return (
                                    <div key={stage.name}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-bold text-gray-700">{stage.name}</span>
                                            <span className="text-sm font-black text-gray-900 bg-gray-50 px-2 py-0.5 rounded-md">{stage.count}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className="h-2.5 rounded-full transition-all duration-700"
                                                style={{ width: `${Math.max(percentage, 2)}%`, backgroundColor: stage.color }}
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
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <p className="text-[#29a08e] font-bold text-[10px] uppercase tracking-[0.2em] mb-1">Geography</p>
                                <h3 className="text-lg font-black text-gray-900 tracking-tight">Applicant Locations</h3>
                            </div>
                            <div className="p-2.5 bg-[#29a08e]/10 text-[#29a08e] rounded-xl">
                                <MapPin size={18} />
                            </div>
                        </div>

                        {distributions.locations.length > 0 ? (
                            <div className="space-y-3">
                                {distributions.locations.map((loc, idx) => (
                                    <div key={idx} className="flex items-center justify-between py-3 px-4 bg-gray-50/50 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-gray-400 uppercase w-5">{idx + 1}.</span>
                                            <span className="text-sm font-bold text-gray-800">{loc.location}</span>
                                        </div>
                                        <span className="text-sm font-black text-gray-900 bg-white px-3 py-1 rounded-lg border border-gray-200 shadow-sm">{loc.count}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-36 flex flex-col items-center justify-center text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                                <MapPin size={24} className="mb-2 text-gray-300" />
                                <span className="text-sm font-bold">No location data captured</span>
                            </div>
                        )}
                    </div>

                    {/* Quality Insights Placeholder */}
                    <div className="bg-gradient-to-br from-slate-900 via-[#0d2f2b] to-slate-900 p-8 rounded-2xl border border-gray-800 shadow-sm flex flex-col justify-center items-center text-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-[#29a08e] rounded-full blur-3xl"></div>
                        </div>
                        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                        <div className="relative z-10">
                            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl mb-5 border border-white/10 inline-block">
                                <TrendingUp size={32} className="text-[#29a08e]" />
                            </div>
                            <h3 className="text-xl font-black text-white mb-2 tracking-tight">Applicant Matching</h3>
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#29a08e]/20 border border-[#29a08e]/30 rounded-full text-[10px] font-black text-[#29a08e] uppercase tracking-widest mb-4">
                                Coming Soon
                            </div>
                            <p className="text-sm text-gray-300 max-w-sm leading-relaxed">
                                AI-powered match scoring and experience distribution analytics will be activated once candidate profiling is enabled.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default JobAnalytics;
