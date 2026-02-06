import Activity from '../models/Activity.js';

export const getMyActivity = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const activities = await Activity.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(limit);
        res.json(activities);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching activity' });
    }
};
