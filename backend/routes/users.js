import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAdmin);

/** Treat ?showRemoved=true|1|yes (case-insensitive) as show all; anything else hides removed users. */
function parseShowRemoved(val) {
    if (val === true || val === 1) return true;
    const s = String(val ?? '')
        .trim()
        .toLowerCase();
    return s === 'true' || s === '1' || s === 'yes';
}

/** When false: only users not soft-removed (isRemoved and legacy isDeleted). When true: no removal filter. */
function removalVisibilityFilter(showAllRemoved) {
    if (showAllRemoved) return {};
    return {
        $and: [{ isRemoved: { $ne: true } }, { isDeleted: { $ne: true } }]
    };
}

function roleQueryFilter(roleParam) {
    const r = String(roleParam || 'all').toLowerCase();
    if (r === 'all') return {};
    if (r === 'jobseeker') return { role: { $in: ['jobseeker', 'job_seeker'] } };
    if (r === 'recruiter' || r === 'admin') return { role: r };
    return {};
}

function mapAdminUser(u) {
    const mergedRemoved = Boolean(u.isRemoved || u.isDeleted);
    const kycStatus =
        u.role === 'recruiter'
            ? u.recruiterKycStatus || 'not_submitted'
            : u.kycStatus || 'not_submitted';
    return {
        _id: u._id,
        name: u.fullName,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        isRemoved: mergedRemoved,
        removedAt: u.removedAt || u.deletedAt || null,
        isSuspended: Boolean(u.isSuspended) && !mergedRemoved,
        suspendedAt: mergedRemoved ? null : u.suspendedAt || null,
        suspendReason: mergedRemoved ? '' : u.suspendReason || '',
        kycStatus,
        profileImage: u.profileImage || ''
    };
}

// GET — ?showRemoved=true → all users; otherwise only isRemoved !== true (and not legacy isDeleted)
router.get('/', async (req, res) => {
    try {
        const showAllRemoved = parseShowRemoved(req.query.showRemoved);
        const roleQ = String(req.query.role || 'all').toLowerCase();
        const filter = {
            ...removalVisibilityFilter(showAllRemoved),
            ...roleQueryFilter(roleQ)
        };
        const users = await User.find(filter).select('-password').sort({ createdAt: -1 }).lean();
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.json(users.map(mapAdminUser));
    } catch (error) {
        console.error('Fetch users error:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// Soft-remove: update document only — never delete from DB
router.put('/:id/remove', async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid user id' });
    }
    if (id === req.user.id) {
        return res.status(400).json({ message: 'You cannot remove your own account.' });
    }
    try {
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.isRemoved = true;
        user.removedAt = new Date();
        await user.save();

        res.json({
            success: true,
            message: 'User removed successfully.',
            user: mapAdminUser(user.toObject())
        });
    } catch (error) {
        console.error('Remove user error:', error);
        res.status(500).json({ message: 'Error removing user' });
    }
});

router.put('/:id/restore', async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid user id' });
    }
    try {
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (!user.isRemoved && !user.isDeleted) {
            return res.status(400).json({ message: 'User is not removed.' });
        }

        user.isRemoved = false;
        user.removedAt = null;
        // Legacy soft-delete flag (older admin flow) — clear so the user can sign in again
        user.isDeleted = false;
        user.deletedAt = null;
        user.deletedBy = null;
        user.isActive = true;
        user.isSuspended = false;
        user.suspendedAt = null;
        user.suspendReason = '';
        await user.save();

        res.json({
            success: true,
            message: 'User restored successfully.',
            user: mapAdminUser(user.toObject())
        });
    } catch (error) {
        console.error('Restore user error:', error);
        res.status(500).json({ message: 'Error restoring user' });
    }
});

router.put('/:id/suspend', async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid user id' });
    }
    if (id === req.user.id) {
        return res.status(400).json({ message: 'You cannot suspend your own account.' });
    }
    try {
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.isRemoved || user.isDeleted) {
            return res.status(400).json({ message: 'Cannot suspend a removed user.' });
        }

        const reason = String(req.body?.reason ?? '').trim();
        user.isSuspended = true;
        user.suspendedAt = new Date();
        user.suspendReason = reason;
        user.isActive = false;
        await user.save();

        res.json({ success: true, message: 'User suspended successfully.' });
    } catch (error) {
        console.error('Suspend user error:', error);
        res.status(500).json({ message: 'Error suspending user' });
    }
});

router.put('/:id/activate', async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid user id' });
    }
    try {
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.isRemoved || user.isDeleted) {
            return res.status(400).json({ message: 'Restore the user before activating.' });
        }

        user.isSuspended = false;
        user.suspendedAt = null;
        user.suspendReason = '';
        user.isActive = true;
        await user.save();

        res.json({ success: true, message: 'User activated successfully.' });
    } catch (error) {
        console.error('Activate user error:', error);
        res.status(500).json({ message: 'Error activating user' });
    }
});

export default router;
