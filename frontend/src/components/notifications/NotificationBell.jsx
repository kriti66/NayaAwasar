import { Bell } from 'lucide-react';

export default function NotificationBell({
    onClick,
    unreadCount = 0,
    isActive = false,
    className = '',
}) {
    const displayCount = unreadCount > 99 ? '99+' : unreadCount;
    const showBadge = unreadCount > 0;

    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={showBadge ? `${unreadCount} unread notifications` : 'Notifications'}
            className={`relative w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${className} ${
                isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
            <Bell size={20} strokeWidth={2} />
            {showBadge && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[10px] font-bold text-white bg-red-500 ring-2 ring-white">
                    {displayCount}
                </span>
            )}
        </button>
    );
}
