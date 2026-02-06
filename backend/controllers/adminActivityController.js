
import ActivityLog from '../models/ActivityLog.js';

/**
 * GET /api/admin/activities
 * Fetch latest platforms activities for admin dashboard.
 */
export const getAdminActivities = async (req, res) => {
    try {
        const activities = await ActivityLog.find({})
            .sort({ createdAt: -1 })
            .limit(20)
            .populate('actorId', 'fullName email role') // Populate actor details
            .lean();

        res.json(activities);
    } catch (error) {
        console.error("Fetch admin activities error:", error);
        res.status(500).json({ message: 'Error fetching activities' });
    }
};
