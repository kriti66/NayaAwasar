import ActivityLog from '../models/ActivityLog.js';

/**
 * Log a system activity
 * @param {string} type - Type of activity (registration, kyc_approved, etc.)
 * @param {string} message - Human-readable message
 * @param {string} userId - ID of the user who performed the action
 * @param {object} metadata - Optional additional data
 */
export const logActivity = async (type, message, userId = null, metadata = {}) => {
    try {
        await ActivityLog.create({
            type,
            message,
            performedBy: userId,
            metadata
        });
    } catch (err) {
        console.error('Failed to log activity:', err);
        // We don't throw here to avoid breaking the main request if logging fails
    }
};
