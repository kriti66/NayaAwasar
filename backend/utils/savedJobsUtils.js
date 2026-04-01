import mongoose from 'mongoose';
import Job from '../models/Job.js';
import User from '../models/User.js';
import { PUBLIC_MODERATION_MATCH } from './jobModeration.js';

/**
 * Get valid saved job IDs for a user.
 * Filters to jobs that exist, are Active, and Approved. Deduplicates.
 * @param {string} userId - User ID
 * @returns {Promise<string[]>} Array of job ID strings
 */
export const getValidSavedJobIds = async (userId) => {
    const user = await User.findById(userId).select('savedJobs').lean();
    const rawIds = user?.savedJobs || [];
    if (rawIds.length === 0) return [];

    const ids = [...new Set(rawIds.map(id => id?.toString()).filter(Boolean))];
    const validJobs = await Job.find({
        _id: { $in: ids },
        status: 'Active',
        $and: [
            PUBLIC_MODERATION_MATCH,
            {
                $or: [
                    { application_deadline: { $exists: false } },
                    { application_deadline: { $gte: new Date() } }
                ]
            }
        ]
    }).select('_id').lean();

    return validJobs.map(j => j._id.toString());
};

/**
 * Clean and deduplicate user's savedJobs array in the database.
 * Removes duplicates and references to non-existent or inactive jobs.
 * @param {string} userId - User ID
 * @returns {Promise<number>} Number of records removed
 */
export const cleanUserSavedJobs = async (userId) => {
    const user = await User.findById(userId);
    if (!user || !user.savedJobs?.length) return 0;

    const beforeCount = user.savedJobs.length;
    const validIds = await getValidSavedJobIds(userId);
    const uniqueValid = [...new Set(validIds)];
    const removed = beforeCount - uniqueValid.length;

    if (removed <= 0) return 0; // No duplicates or stale records

    user.savedJobs = uniqueValid.map(id => new mongoose.Types.ObjectId(id));
    await user.save();
    if (removed > 0 && process.env.NODE_ENV !== 'test') {
        console.log(`[savedJobs] Cleaned ${removed} duplicate/stale records for user ${userId}`);
    }
    return removed;
};
