import express from 'express';
import User from '../models/User.js';
import { notDeletedFilter } from '../utils/userQueryHelpers.js';

const router = express.Router();

// Get all users (Admin only). Excludes soft-deleted unless ?includeDeleted=true
router.get('/', async (req, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    try {
        const includeDeleted = String(req.query.includeDeleted || '').toLowerCase() === 'true';
        const filter = includeDeleted
            ? {}
            : { ...notDeletedFilter(), isActive: { $ne: false } };
        const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        console.error('Fetch users error:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// Restore soft-deleted user (Admin only) — must be registered before DELETE /:id
router.patch('/:id/restore', async (req, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    const { id } = req.params;
    try {
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (!user.isDeleted) {
            return res.status(400).json({ message: 'User is not deleted.' });
        }

        user.isDeleted = false;
        user.deletedAt = null;
        user.deletedBy = null;
        user.isActive = true;
        await user.save();

        const safe = user.toObject();
        delete safe.password;
        res.json({ success: true, message: 'User restored successfully.', user: safe });
    } catch (error) {
        console.error('Restore user error:', error);
        res.status(500).json({ message: 'Error restoring user' });
    }
});

// Soft-delete user (Admin only)
router.delete('/:id', async (req, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    const { id } = req.params;
    if (id === req.user.id) {
        return res.status(400).json({ message: 'You cannot remove your own account.' });
    }

    try {
        const user = await User.findByIdAndUpdate(
            id,
            {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: req.user.id,
                isActive: false
            },
            { new: true }
        );
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({ success: true, message: 'User removed successfully.' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Error removing user' });
    }
});

export default router;
