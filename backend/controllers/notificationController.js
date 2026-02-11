import Notification from '../models/Notification.js';
import User from '../models/User.js';

// Internal Helper to create notification (not an API endpoint usually)
export const createNotification = async ({ recipient, type, title, message, link, sender = null }) => {
    try {
        await Notification.create({
            recipient,
            sender,
            type,
            title,
            message,
            link
        });
        // In future: Socket.io emission here
    } catch (error) {
        console.error("Error creating notification:", error);
    }
};

// Internal Helper to broadcast notification to a role
export const broadcastNotification = async ({ role, type, title, message, link, sender = null }) => {
    try {
        const users = await User.find({ role }).select('_id');
        if (!users.length) return;

        const notifications = users.map(user => ({
            recipient: user._id,
            sender,
            type,
            title,
            message,
            link,
            createdAt: new Date()
        }));

        await Notification.insertMany(notifications);
    } catch (error) {
        console.error("Error broadcasting notification:", error);
    }
};

// API: Get user's notifications
export const getNotifications = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const filter = { recipient: req.user.id };
        if (req.query.filter && req.query.filter !== 'all') {
            if (req.query.filter === 'unread') {
                filter.isRead = false;
            } else {
                filter.type = req.query.filter; // e.g. 'offer', 'job_post'
            }
        }

        const notifications = await Notification.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('sender', 'fullName email');

        const total = await Notification.countDocuments(filter);
        const unreadCount = await Notification.countDocuments({ recipient: req.user.id, isRead: false });

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
        const count = await Notification.countDocuments({ recipient: req.user.id, isRead: false });
        res.json({ count });
    } catch (error) {
        console.error("Unread Count Error:", error);
        res.status(500).json({ message: 'Server error fetching count' });
    }
};

// API: Mark single as read
export const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user.id },
            { isRead: true },
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
        await Notification.updateMany(
            { recipient: req.user.id, isRead: false },
            { isRead: true }
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
        await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user.id });
        res.json({ message: 'Notification deleted' });
    } catch (error) {
        console.error("Delete Notification Error:", error);
        res.status(500).json({ message: 'Server error deleting notification' });
    }
};
