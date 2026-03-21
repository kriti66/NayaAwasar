import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Star, MapPin, Briefcase, ArrowUpRight, TrendingUp } from 'lucide-react';
import CompanyLogo from '../common/CompanyLogo';

const FeaturedJobs = () => {
    const [promotedJobs, setPromotedJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPromotedJobs = async () => {
            try {
                const res = await api.get('/jobs/promoted');
                setPromotedJobs(res.data);
            } catch (error) {
                console.error('Failed to load featured jobs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPromotedJobs();
    }, []);

    if (loading) {
        return (
            <div className="py-20 bg-white border-y border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 bg-gray-200 rounded-md w-1/4 mx-auto mb-10"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-48 bg-gray-100 rounded-2xl"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (promotedJobs.length === 0) return null; // Don't render section if no promotions active

    const getPromoBadgeDetails = (type) => {
        switch (type) {
            case 'HOMEPAGE_BANNER': return { text: 'Sponsored', styles: 'bg-amber-100 text-amber-700 border-amber-200', icon: TrendingUp };
            case 'TOP_LISTING': return { text: 'Premium Selection', styles: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: Star };
            case 'FEATURED':
            default: return { text: 'Featured Opportunity', styles: 'bg-[#29a08e]/10 text-[#29a08e] border-[#29a08e]/20', icon: Star };
        }
    };

    return (
        <div className="py-20 relative overflow-hidden bg-gradient-to-b from-[#f8fafc] to-white border-b border-gray-100">
            {/* Soft decorative background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 -left-24 w-72 h-72 bg-[#29a08e]/5 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-14">
                    <p className="text-amber-500 font-bold text-sm uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
                        <Star className="w-4 h-4 fill-amber-500" /> Premium Picks
                    </p>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tight">Featured <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-400">Opportunities</span></h2>
                    <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">Discover actively recruiting premium roles handpicked for immediate hiring.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {promotedJobs.slice(0, 6).map((job) => {
                        const badge = getPromoBadgeDetails(job.promotionType);
                        const BadgeIcon = badge.icon;

                        return (
                            <Link
                                key={job._id}
                                to={`/jobs/${job._id}`}
                                className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-1 hover:border-amber-200/50 transition-all duration-300 relative overflow-hidden flex flex-col"
                            >
                                {/* Top color strip for ads */}
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-400 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                
                                <div className="flex justify-between items-start mb-5">
                                    <CompanyLogo job={job} className="w-14 h-14 rounded-xl border border-gray-100 shrink-0 shadow-sm overflow-hidden" imgClassName="w-full h-full object-cover" fallbackClassName="text-xl text-gray-400" />
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${badge.styles}`}>
                                        <BadgeIcon className="w-3 h-3" />
                                        {badge.text}
                                    </span>
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-lg font-black text-gray-900 mb-1 group-hover:text-amber-600 transition-colors line-clamp-1">{job.title}</h3>
                                    <p className="text-sm font-bold text-gray-500 mb-4">{job.company_name}</p>

                                    <div className="flex flex-wrap gap-2 mb-6">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 text-gray-600 text-[11px] font-bold rounded-lg border border-gray-100">
                                            <MapPin className="w-3 h-3 text-gray-400" /> {job.location || 'Remote'}
                                        </span>
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 text-gray-600 text-[11px] font-bold rounded-lg border border-gray-100">
                                            <Briefcase className="w-3 h-3 text-gray-400" /> {job.type}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-auto">
                                    <div className="flex-1">
                                        <span className="text-xs font-bold text-[#29a08e] group-hover:text-amber-600 transition-colors flex items-center gap-1">
                                            Fast-Track Apply
                                        </span>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
                                        <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-amber-600" />
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default FeaturedJobs;
