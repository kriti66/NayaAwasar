import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

/**
 * Hook for notification state and actions
 * @param {boolean} enabled - Whether to fetch (e.g. when user is logged in)
 * @param {boolean} fetchOnOpen - Fetch when dropdown opens (or use polling)
 * @param {number} options.limit - Page size (admins use a higher default via caller)
 */
export function useNotifications(enabled = true, { fetchOnOpen = false, limit = 20 } = {}) {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = useCallback(async () => {
        if (!enabled) return;
        setLoading(true);
        try {
            const res = await api.get(`/notifications?page=1&limit=${limit}`);
            setNotifications(res.data.notifications || []);
            setUnreadCount(res.data.unreadCount ?? 0);
        } catch (e) {
            console.error('Failed to fetch notifications:', e);
        } finally {
            setLoading(false);
        }
    }, [enabled, limit]);

    useEffect(() => {
        if (!enabled) return;
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 45000); // poll every 45s
        return () => clearInterval(interval);
    }, [enabled, fetchNotifications]);

    const markRead = useCallback(async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications((prev) =>
                prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
            );
            setUnreadCount((c) => Math.max(0, c - 1));
        } catch (e) {
            console.error('Failed to mark read:', e);
        }
    }, []);

    const markAllRead = useCallback(async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (e) {
            console.error('Failed to mark all read:', e);
        }
    }, []);

    const refetch = useCallback(() => {
        if (enabled) fetchNotifications();
    }, [enabled, fetchNotifications]);

    return {
        notifications,
        unreadCount,
        loading,
        fetchNotifications: refetch,
        markRead,
        markAllRead,
    };
}
