import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle, Trash2 } from 'lucide-react';
import { getNotificationConfig } from '../../components/notifications/notificationConfig';
import { formatNotificationTime } from '../../utils/formatTimestamp';
import notificationService from '../../services/notificationService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const Notifications = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const data = await notificationService.getNotifications(page, 15, filter);
            setNotifications(data.notifications);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error("Error fetching notifications:", error);
            toast.error("Failed to load notifications");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [page, filter]);

    const handleMarkRead = async (id) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            toast.success("All marked as read");
        } catch (error) {
            toast.error("Failed to mark all read");
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        try {
            await notificationService.deleteNotification(id);
            setNotifications(prev => prev.filter(n => n._id !== id));
            toast.success("Notification deleted");
        } catch (error) {
            toast.error("Failed to delete");
        }
    };

    const cardClick = (notif) => {
        if (!notif.isRead) handleMarkRead(notif._id);
        if (notif.link) {
            let targetLink = notif.link;
            if (targetLink.startsWith('/jobs/') && (user?.role === 'jobseeker' || user?.role === 'job_seeker')) {
                targetLink = `/jobseeker${targetLink}`;
            }
            navigate(targetLink);
        }
    };

    const categories = [
        { id: 'all', label: 'All' },
        { id: 'unread', label: 'Unread' },
        { id: 'promotion', label: 'Promotion' },
        { id: 'job', label: 'Jobs' },
        { id: 'application', label: 'Applications' },
        { id: 'company', label: 'Company' },
        { id: 'contact', label: 'Contact' },
        { id: 'system', label: 'System' }
    ];


    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="p-8 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-[#29a08e]/10 p-3 rounded-2xl">
                                <Bell className="w-6 h-6 text-[#29a08e]" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                                <p className="text-sm text-gray-500 font-medium">Manage your alerts and updates</p>
                            </div>
                        </div>
                        <button
                            onClick={handleMarkAllRead}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-bold transition-all border border-gray-200"
                        >
                            <CheckCircle className="w-4 h-4" />
                            Mark all read
                        </button>
                    </div>

                    {/* Filter Tabs */}
                    <div className="px-8 pt-6 flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => { setFilter(cat.id); setPage(1); }}
                                className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-all ${filter === cat.id
                                    ? 'bg-[#29a08e] text-white shadow-lg shadow-[#29a08e]/20'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* List */}
                    <div className="p-6">
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="animate-pulse flex gap-4 p-4 border border-gray-100 rounded-2xl">
                                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-24">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Bell className="w-8 h-8 text-gray-300" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">All caught up!</h3>
                                <p className="text-gray-500 max-w-sm mx-auto mt-2 text-sm">No new notifications at the moment.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {notifications.map(notif => {
                                    const config = getNotificationConfig(notif.type, notif.category);
                                    const Icon = config.icon;

                                    return (
                                        <div
                                            key={notif._id}
                                            onClick={() => cardClick(notif)}
                                            className={`group relative p-5 rounded-2xl border transition-all hover:shadow-md cursor-pointer flex gap-4 items-start ${notif.isRead
                                                    ? 'bg-white border-transparent hover:border-gray-100'
                                                    : 'bg-[#29a08e]/10/40 border-[#29a08e]/20'
                                                }`}
                                        >
                                            {/* Icon */}
                                            <div className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${config.bg} ${config.color}`}>
                                                <Icon size={18} strokeWidth={2.5} />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className={`text-sm ${notif.isRead ? 'font-bold text-gray-800' : 'font-black text-gray-900'}`}>
                                                        {notif.title}
                                                    </h4>
                                                    <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap pl-2">
                                                        {formatNotificationTime(notif.createdAt)}
                                                    </span>
                                                </div>
                                                <p className={`text-sm leading-relaxed line-clamp-2 ${notif.isRead ? 'text-gray-500' : 'text-gray-700 font-medium'}`}>
                                                    {notif.message}
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-col items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => handleDelete(notif._id, e)}
                                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                {!notif.isRead && (
                                                    <div className="w-2 h-2 rounded-full bg-[#29a08e]/100"></div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-10 flex justify-center gap-3">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm font-bold text-gray-600 transition-colors"
                                >
                                    Previous
                                </button>
                                <span className="px-4 py-2 text-sm font-medium text-gray-500 flex items-center">
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm font-bold text-gray-600 transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Notifications;
