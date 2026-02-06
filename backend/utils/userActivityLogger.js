import Activity from '../models/Activity.js';

/**
 * Log a user activity for the dashboard feed
 * @param {string} userId - User ID
 * @param {string} type - APPLIED_JOB | RECRUITER_VIEW | MESSAGE
 * @param {object} meta - { jobId, jobTitle, recruiterId, ... }
 */
export const logUserActivity = async (userId, type, meta = {}) => {
    try {
        await Activity.create({
            userId,
            type,
            meta
        });
    } catch (err) {
        console.error('Failed to log user activity:', err);
    }
};
