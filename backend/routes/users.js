import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Get all users (Admin only)
router.get('/', async (req, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    try {
        const users = await User.find({ isActive: { $ne: false } }).select('-password');
        res.json(users);
    } catch (error) {
        console.error("Fetch users error:", error);
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// Delete user (Admin only)
router.delete('/:id', async (req, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    const { id } = req.params;
    try {
        const user = await User.findByIdAndUpdate(id, { isActive: false }, { new: true });
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({ success: true, message: 'User deactivated successfully' });
    } catch (error) {
        console.error("Delete user error:", error);
        res.status(500).json({ message: 'Error deleting user' });
    }
});

export default router;
