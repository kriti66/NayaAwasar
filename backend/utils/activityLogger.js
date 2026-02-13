// Reusable helper to log activities
import ActivityLog from '../models/ActivityLog.js';

/**
 * Log a user activity for the dashboard feed
 * @param {string} userId - User ID (Jobseeker/Recruiter) associated with the event
 * @param {string} type - Event Type (APPLIED_JOB, RECRUITER_VIEW, MESSAGE, STATUS_CHANGE)
 * @param {string} message - Human readable message for the UI
 * @param {object} meta - Optional metadata (jobId, companyName, etc.)
 */
export const logActivity = async (userId, type, message, meta = {}) => {
    try {
        await ActivityLog.create({
            userId,
            type,
            message,
            meta
        });
    } catch (error) {
        console.error('Failed to log activity:', error);
        // Don't throw error to avoid disrupting the main flow
    }
};
