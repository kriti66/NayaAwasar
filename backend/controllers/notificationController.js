import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { notify, notifyAdmins, notifyUser } from '../services/notificationService.js';

// Backward-compatible: create notification for a single recipient
export const createNotification = async ({ recipient, type, title, message, link, sender = null, category, metadata = {} }) => {
    try {
        await notify({
            recipientId: recipient?.toString?.(),
            type,
            category: category || 'system',
            title,
            message,
            link: link || '',
            metadata,
            senderId: sender?.toString?.()
        });
    } catch (error) {
        console.error("Error creating notification:", error);
    }
};

// Backward-compatible: broadcast to a role
export const broadcastNotification = async ({ role, type, title, message, link, sender = null }) => {
    try {
        await notify({
            recipientRole: role,
            type,
            category: 'job',
            title,
            message,
            link: link || '',
            senderId: sender?.toString?.()
        });
    } catch (error) {
        console.error("Error broadcasting notification:", error);
    }
};

// Re-export for modules that want the new API
export { notify, notifyAdmins, notifyUser } from '../services/notificationService.js';

// API: Get user's notifications
export const getNotifications = async (req, res) => {
    try {
        // Notification model field: `recipient` (ObjectId). Use JWT user id only — never email.
        const recipientId = req.user._id ?? req.user.id;

        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const rawLimit = parseInt(req.query.limit, 10) || 10;
        const limit = Math.min(Math.max(1, rawLimit), 100);
        const skip = (page - 1) * limit;

        const filter = { recipient: recipientId };
        if (req.query.filter && req.query.filter !== 'all') {
            if (req.query.filter === 'unread') {
                filter.isRead = false;
            } else if (['promotion', 'payment', 'job', 'application', 'interview', 'company', 'recruiter', 'contact', 'system'].includes(req.query.filter)) {
                filter.category = req.query.filter;
            } else {
                filter.type = req.query.filter;
            }
        }

        const notifications = await Notification.find(filter)
            .sort({ isRead: 1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('sender', 'fullName email')
            .lean();

        const total = await Notification.countDocuments(filter);
        const unreadCount = await Notification.countDocuments({ recipient: recipientId, isRead: false });

        res.json({
            notifications,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalNotifications: total,
            unreadCount
        });
    } catch (error) {
        console.error("Get Notifications Error:", error);
        res.status(500).json({ message: 'Server error fetching notifications' });
    }
};

// API: Get unread count only (for badge)
export const getUnreadCount = async (req, res) => {
    try {
        const recipientId = req.user._id ?? req.user.id;
        const count = await Notification.countDocuments({ recipient: recipientId, isRead: false });
        res.json({ count });
    } catch (error) {
        console.error("Unread Count Error:", error);
        res.status(500).json({ message: 'Server error fetching count' });
    }
};

// API: Mark single as read
export const markAsRead = async (req, res) => {
    try {
        const recipientId = req.user._id ?? req.user.id;
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: recipientId },
            { isRead: true, readAt: new Date() },
            { new: true }
        );
        if (!notification) return res.status(404).json({ message: 'Notification not found' });
        res.json(notification);
    } catch (error) {
        console.error("Mark Read Error:", error);
        res.status(500).json({ message: 'Server error marking read' });
    }
};

// API: Mark all as read
export const markAllAsRead = async (req, res) => {
    try {
        const recipientId = req.user._id ?? req.user.id;
        await Notification.updateMany(
            { recipient: recipientId, isRead: false },
            { isRead: true, readAt: new Date() }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error("Mark All Read Error:", error);
        res.status(500).json({ message: 'Server error marking all read' });
    }
};

// API: Delete notification
export const deleteNotification = async (req, res) => {
    try {
        const recipientId = req.user._id ?? req.user.id;
        await Notification.findOneAndDelete({ _id: req.params.id, recipient: recipientId });
        res.json({ message: 'Notification deleted' });
    } catch (error) {
        console.error("Delete Notification Error:", error);
        res.status(500).json({ message: 'Server error deleting notification' });
    }
};
