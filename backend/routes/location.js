import express from 'express';
import Location from '../models/Location.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { logActivity } from '../utils/activityLogger.js';

const router = express.Router();

const publicFields = 'address phone email';

// GET /api/location (Public) — address, phone, email only (no coordinates)
router.get('/', async (req, res) => {
    try {
        const location = await Location.findOne({}).select(publicFields).lean();
        if (!location) {
            return res.json({ address: '', phone: '', email: '' });
        }
        res.json(location);
    } catch (err) {
        console.error('Fetch location error:', err);
        res.status(500).json({ message: 'Server error fetching location' });
    }
});

// Admin only: PUT /api/location — same fields; strips legacy latitude/longitude from DB if present
router.put('/', requireAuth, requireAdmin, async (req, res) => {
    const { address, phone, email } = req.body;

    if (!address?.trim() || !phone?.trim() || !email?.trim()) {
        return res.status(400).json({ message: 'Physical address, phone number, and email are required.' });
    }

    try {
        const updatedLocation = await Location.findOneAndUpdate(
            {},
            {
                $set: {
                    address: address.trim(),
                    phone: phone.trim(),
                    email: String(email).toLowerCase().trim()
                },
                $unset: { latitude: '', longitude: '' }
            },
            { upsert: true, new: true, runValidators: true, select: publicFields }
        ).lean();

        await logActivity(
            req.user.id,
            'LOCATION_UPDATED',
            `Office location updated to '${address.trim()}'.`,
            { locationId: updatedLocation._id }
        );

        res.json({ success: true, message: 'Location updated successfully', data: updatedLocation });
    } catch (err) {
        console.error('Update location error:', err);
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map((e) => e.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Internal server error while updating location' });
    }
});

export default router;
