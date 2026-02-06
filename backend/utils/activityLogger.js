
import ActivityLog from '../models/ActivityLog.js';

export const logActivity = async (actorId, actorRole, action, message, targetType = null, targetId = null) => {
    try {
        await ActivityLog.create({
            actorId,
            actorRole,
            action,
            message,
            targetType,
            targetId
        });
    } catch (error) {
        console.error('Failed to log activity:', error);
        // Don't throw error to avoid disrupting the main flow
    }
};
