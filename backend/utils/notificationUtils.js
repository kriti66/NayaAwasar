import Notification from '../models/Notification.js';
import User from '../models/User.js';

/**
 * Create a notification for a specific user
 */
export const createNotification = async (recipientId, type, message, relatedId = null) => {
    try {
        await Notification.create({
            recipient: recipientId,
            type,
            message,
            relatedId
        });
    } catch (error) {
        console.error("Error creating notification:", error);
    }
};

/**
 * Broadcast notification to all users of a specific role
 */
export const broadcastNotification = async (role, type, message, relatedId = null) => {
    try {
        const users = await User.find({ role }).select('_id');
        const notifications = users.map(user => ({
            recipient: user._id,
            type,
            message,
            relatedId
        }));

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }
    } catch (error) {
        console.error("Error broadcasting notification:", error);
    }
};
