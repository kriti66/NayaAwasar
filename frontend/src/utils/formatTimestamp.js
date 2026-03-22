/**
 * Format notification timestamp for display
 * @param {string|Date} dateStr
 * @returns {string}
 */
export function formatNotificationTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay === 1) return 'yesterday';
    if (diffDay < 7) return `${diffDay}d ago`;

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Returns 'today' or 'earlier' for grouping */
export function getNotificationGroup(dateStr) {
    if (!dateStr) return 'earlier';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'earlier';
    const now = new Date();
    const isToday = date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();
    return isToday ? 'today' : 'earlier';
}
