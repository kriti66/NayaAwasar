import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
    Briefcase,
    Eye,
    MessageSquare,
    CheckCircle,
    FileText,
    Clock,
    Activity
} from 'lucide-react';

const RecentActivityWidget = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const response = await api.get('/activity/me');
                setActivities(response.data);
            } catch (error) {
                console.error("Failed to fetch activities:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchActivities();
    }, []);

    const getActivityConfig = (type) => {
        switch (type) {
            case 'APPLIED_JOB':
                return { icon: Briefcase, color: 'text-[#29a08e]', bg: 'bg-[#29a08e]/10', label: 'Job Application' };
            case 'RECRUITER_VIEW':
                return { icon: Eye, color: 'text-orange-500', bg: 'bg-orange-50', label: 'Profile View' };
            case 'MESSAGE':
                return { icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-50', label: 'Message' };
            case 'STATUS_CHANGE':
                return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', label: 'Status Update' };
            case 'KYC_SUBMITTED':
            case 'KYC_RESUBMITTED':
                return { icon: FileText, color: 'text-teal-500', bg: 'bg-teal-50', label: 'KYC Submitted' };
            case 'KYC_APPROVED':
                return { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'KYC Approved' };
            case 'KYC_REJECTED':
                return { icon: Clock, color: 'text-rose-600', bg: 'bg-rose-50', label: 'KYC Rejected' };
            default:
                return { icon: Activity, color: 'text-gray-500', bg: 'bg-gray-50', label: 'System' };
        }
    };

    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    };

    if (loading) {
        return (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse flex gap-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
                <div className="text-center py-8 text-gray-400 text-sm">
                    No recent activity found.
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
                <Link to="/seeker/applications" className="text-xs font-bold text-[#29a08e] hover:underline">View all</Link>
            </div>

            <div className="space-y-6 relative before:absolute before:inset-0 before:left-5 before:top-2 before:w-px before:bg-gray-100 before:h-[calc(100%-20px)]">
                {activities.map((activity) => {
                    const config = getActivityConfig(activity.type);
                    const Icon = config.icon;

                    return (
                        <div key={activity._id} className="relative pl-12">
                            {/* Icon */}
                            <div className={`absolute left-0 top-0 w-10 h-10 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${config.bg} ${config.color} z-10`}>
                                <Icon size={16} />
                            </div>

                            {/* Content */}
                            <div>
                                <p className="text-sm font-semibold text-gray-900 leading-snug">
                                    {activity.message}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${config.color.replace('text-', 'text-opacity-80 text-')}`}>
                                        {config.label}
                                    </span>
                                    <span className="text-[10px] text-gray-400">•</span>
                                    <span className="text-[10px] font-medium text-gray-400">
                                        {timeAgo(activity.createdAt)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RecentActivityWidget;
