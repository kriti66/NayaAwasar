import User from '../models/User.js';

/**
 * Admin-only middleware. Use after requireAuth (auth.js).
 * Re-export for backward compatibility; primary implementation in auth.js.
 */
export const requireAdmin = async (req, res, next) => {
    try {
        if (req.user?.role === 'admin') return next();

        if (req.user?.id) {
            const dbUser = await User.findById(req.user.id).select('role').lean();
            if (dbUser?.role === 'admin') {
                req.user.role = 'admin';
                return next();
            }
        }

        return res.status(403).json({ message: 'Forbidden: Admin access required' });
    } catch (error) {
        console.error('requireAdmin middleware error:', error);
        return res.status(500).json({ message: 'Admin authorization check failed' });
    }
};
