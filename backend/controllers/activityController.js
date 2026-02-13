import ActivityLog from '../models/ActivityLog.js';

export const getMyActivity = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const activities = await ActivityLog.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        res.json(activities);
    } catch (error) {
        console.error("Fetch Activity Error:", error);
        res.status(500).json({ message: 'Error fetching activity' });
    }
};
