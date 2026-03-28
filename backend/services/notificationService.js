import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { notDeletedFilter } from '../utils/userQueryHelpers.js';
import { NOTIFICATION_CATEGORIES } from '../constants/notificationTypes.js';

/**
 * Core notification creator - used by all modules
 * @param {Object} opts
 * @param {string} opts.recipientId - Single recipient user ID
 * @param {string[]} opts.recipientIds - Multiple recipient IDs
 * @param {string} opts.recipientRole - Notify all users with this role (e.g. 'admin')
 * @param {string} opts.type - Notification type
 * @param {string} opts.category - Category for grouping (promotion, job, application, etc.)
 * @param {string} opts.title - Title
 * @param {string} opts.message - Message body
 * @param {string} [opts.link] - Route or URL to navigate
 * @param {Object} [opts.metadata] - jobId, applicationId, promotionId, etc.
 * @param {string} [opts.senderId] - Sender user ID
 */
export async function notify(opts) {
    const { type, category, title, message, link = '', metadata = {}, senderId = null } = opts;
    let recipientIds = [];

    if (opts.recipientId) {
        recipientIds = [opts.recipientId];
    } else if (opts.recipientIds && opts.recipientIds.length) {
        recipientIds = [...opts.recipientIds];
    } else if (opts.recipientRole) {
        const users = await User.find({ role: opts.recipientRole, ...notDeletedFilter() }).select('_id').lean();
        recipientIds = users.map((u) => u._id.toString());
    }

    if (!recipientIds.length) return;

    const docs = recipientIds.map((rid) => ({
        recipient: rid,
        sender: senderId,
        type,
        category: category || NOTIFICATION_CATEGORIES.SYSTEM,
        title,
        message,
        link,
        metadata,
        isRead: false
    }));

    try {
        await Notification.insertMany(docs);
    } catch (err) {
        console.error('[notificationService] Error creating notifications:', err.message);
    }
}

/** Notify all admins */
export async function notifyAdmins({ type, category, title, message, link = '', metadata = {}, senderId = null }) {
    return notify({
        recipientRole: 'admin',
        type,
        category: category || NOTIFICATION_CATEGORIES.SYSTEM,
        title,
        message,
        link,
        metadata,
        senderId
    });
}

/** Notify a single user by ID */
export async function notifyUser(recipientId, { type, category, title, message, link = '', metadata = {}, senderId = null }) {
    return notify({
        recipientId: recipientId?.toString?.(),
        type,
        category,
        title,
        message,
        link,
        metadata,
        senderId
    });
}
