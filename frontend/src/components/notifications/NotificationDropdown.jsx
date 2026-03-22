import { useNavigate } from 'react-router-dom';
import { Bell, ChevronRight } from 'lucide-react';
import NotificationItem from './NotificationItem';
import { getNotificationGroup } from '../../utils/formatTimestamp';

export default function NotificationDropdown({
    isOpen,
    onClose,
    notifications = [],
    unreadCount = 0,
    loading = false,
    markRead,
    markAllRead,
    viewAllLink = '/notifications',
    transformLink,
}) {
    const navigate = useNavigate();

    const handleItemClick = (notification) => {
        if (!notification.isRead) markRead(notification._id);
        onClose();
        if (notification.link) {
            const target = transformLink ? transformLink(notification.link) : notification.link;
            navigate(target);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="absolute right-0 mt-2 w-[360px] sm:w-[380px] bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-200"
            role="dialog"
            aria-label="Notifications"
        >
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100 bg-white sticky top-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <p className="text-xs text-slate-500 mt-0.5">
                                {unreadCount} unread
                            </p>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button
                            type="button"
                            onClick={markAllRead}
                            className="text-xs font-medium text-[#29a08e] hover:text-[#238276] hover:underline"
                        >
                            Mark all read
                        </button>
                    )}
                </div>
            </div>

            {/* List */}
            <div className="max-h-[320px] overflow-y-auto">
                {loading ? (
                    <div className="px-4 py-6 space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex gap-3 animate-pulse">
                                <div className="h-9 w-9 rounded-lg bg-slate-200 shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 bg-slate-200 rounded w-3/4" />
                                    <div className="h-2 bg-slate-100 rounded w-full" />
                                    <div className="h-2 bg-slate-100 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="px-4 py-12 text-center">
                        <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                            <Bell size={28} className="text-slate-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-600">No notifications yet</p>
                        <p className="text-xs text-slate-400 mt-1">
                            We&apos;ll notify you when something important happens
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {(() => {
                            const today = notifications.filter((n) => getNotificationGroup(n.createdAt) === 'today');
                            const earlier = notifications.filter((n) => getNotificationGroup(n.createdAt) === 'earlier');
                            return (
                                <>
                                    {today.length > 0 && (
                                        <>
                                            <div className="px-4 py-2 bg-slate-50/80">
                                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today</p>
                                            </div>
                                            {today.map((n) => (
                                                <NotificationItem key={n._id} notification={n} onClick={handleItemClick} />
                                            ))}
                                        </>
                                    )}
                                    {earlier.length > 0 && (
                                        <>
                                            <div className="px-4 py-2 bg-slate-50/80">
                                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Earlier</p>
                                            </div>
                                            {earlier.map((n) => (
                                                <NotificationItem key={n._id} notification={n} onClick={handleItemClick} />
                                            ))}
                                        </>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 bg-slate-50/50">
                <a
                    href={viewAllLink}
                    onClick={(e) => {
                        e.preventDefault();
                        onClose();
                        navigate(viewAllLink);
                    }}
                    className="flex items-center justify-center gap-1.5 py-3 text-sm font-medium text-[#29a08e] hover:bg-slate-100/80 transition-colors"
                >
                    View all notifications
                    <ChevronRight size={16} />
                </a>
            </div>
        </div>
    );
}
