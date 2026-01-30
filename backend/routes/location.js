import express from 'express';
// import { authenticateToken } from '../middleware/auth.js'; // Assuming middleware is separated or need to import from server (which is circular), so I'll trust the server.js to pass auth if needed, but for now let's implement the logic.
// In this project structure, auth middleware seems to be defined in server.js. I should probably move it to a separate file or duplicate the verify logic if I can't easily import it. 
// For simplicity and stability in this "one-shot" agent context, I will re-implement a simple check or assume the route definition in server.js handles the middleware attachment.
// Actually, looking at server.js: `app.use('/api/admin/users', authenticateToken, userRoutes);`
// So I can export a router and let server.js apply the middleware for the secure routes.

const router = express.Router();

// GET /api/location
router.get('/', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const location = await db.get('SELECT * FROM locations LIMIT 1');
        if (!location) {
            return res.status(404).json({ message: 'Location not set' });
        }
        res.json(location);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// PRESUMPTION: This route will be protected by authenticateToken in server.js
// PUT /api/location
router.put('/', async (req, res) => {
    // Basic Admin Check (req.user is set by authenticateToken)
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    const { address, latitude, longitude, phone, email } = req.body;
    const db = req.app.locals.db;

    try {
        // Update the single row (ID 1)
        await db.run(
            `UPDATE locations SET address = ?, latitude = ?, longitude = ?, phone = ?, email = ? WHERE id = 1`,
            [address, latitude, longitude, phone, email]
        );

        // Return updated data
        const updatedLocation = await db.get('SELECT * FROM locations WHERE id = 1');
        res.json(updatedLocation);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
