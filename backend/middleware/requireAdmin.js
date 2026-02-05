/**
 * Admin-only middleware. Use after requireAuth (auth.js).
 * Re-export for backward compatibility; primary implementation in auth.js.
 */
export const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }
    next();
};
