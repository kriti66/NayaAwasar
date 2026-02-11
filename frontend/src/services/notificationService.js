import api from './api';

const notificationService = {
    // Get all notifications with pagination and filtering
    getNotifications: async (page = 1, limit = 10, filter = 'all') => {
        try {
            const response = await api.get(`/notifications?page=${page}&limit=${limit}&filter=${filter}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Get unread count
    getUnreadCount: async () => {
        try {
            const response = await api.get('/notifications/unread-count');
            return response.data.count;
        } catch (error) {
            throw error;
        }
    },

    // Mark single notification as read
    markAsRead: async (id) => {
        try {
            const response = await api.put(`/notifications/${id}/read`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Mark all as read
    markAllAsRead: async () => {
        try {
            const response = await api.put('/notifications/read-all');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Delete notification
    deleteNotification: async (id) => {
        try {
            await api.delete(`/notifications/${id}`);
        } catch (error) {
            throw error;
        }
    }
};

export default notificationService;
