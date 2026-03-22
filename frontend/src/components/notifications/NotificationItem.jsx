import { getNotificationConfig } from './notificationConfig';
import { formatNotificationTime } from '../../utils/formatTimestamp';

export default function NotificationItem({
    notification,
    onClick,
}) {
    const { _id, title, message, type, category, isRead, createdAt, link } = notification;
    const config = getNotificationConfig(type, category);
    const Icon = config.icon;

    return (
        <button
            type="button"
            onClick={() => onClick(notification)}
            className={`w-full text-left px-4 py-3 flex gap-3 items-start hover:bg-slate-50/80 transition-colors border-l-2 ${
                isRead
                    ? 'bg-white border-l-transparent'
                    : 'bg-teal-50/60 border-l-teal-500'
            }`}
        >
            {/* Icon */}
            <div
                className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${config.bg} ${config.color}`}
            >
                <Icon size={18} strokeWidth={2} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <p
                        className={`text-sm leading-snug ${
                            isRead ? 'font-medium text-slate-800' : 'font-semibold text-slate-900'
                        }`}
                    >
                        {title || 'Notification'}
                    </p>
                    <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">
                        {formatNotificationTime(createdAt)}
                    </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{message}</p>
                {!isRead && (
                    <span className="inline-block mt-1.5 text-[10px] font-semibold text-teal-600 uppercase tracking-wide">
                        New
                    </span>
                )}
            </div>

            {/* Unread dot */}
            {!isRead && (
                <span className="mt-2.5 h-2 w-2 rounded-full bg-teal-500 shrink-0" aria-hidden />
            )}
        </button>
    );
}
