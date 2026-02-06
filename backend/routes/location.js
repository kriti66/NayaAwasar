import express from 'express';
import Location from '../models/Location.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { logActivity } from '../utils/activityLogger.js';

const router = express.Router();

// GET /api/location (Public)
router.get('/', async (req, res) => {
    try {
        const location = await Location.findOne({});
        if (!location) {
            return res.json({ address: '', latitude: 27.7172, longitude: 85.3240, phone: '', email: '' });
        }
        res.json(location);
    } catch (err) {
        console.error("Fetch location error:", err);
        res.status(500).json({ message: 'Server error fetching location' });
    }
});

// Admin only: PUT /api/location
router.put('/', requireAuth, requireAdmin, async (req, res) => {
    const { address, latitude, longitude, phone, email } = req.body;

    try {
        const updatedLocation = await Location.findOneAndUpdate(
            {}, // Single document
            { address, latitude, longitude, phone, email },
            { upsert: true, new: true, runValidators: true }
        );

        // Log location update activity
        await logActivity(req.user.id, req.user.role, 'LOCATION_UPDATED', `Office location updated to '${address}'.`, 'Location', updatedLocation._id);

        res.json({ success: true, message: 'Location updated successfully', data: updatedLocation });
    } catch (err) {
        console.error("Update location error:", err);
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Internal server error while updating location' });
    }
});

export default router;
