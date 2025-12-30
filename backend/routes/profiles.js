import express from 'express';

const router = express.Router();

// Get My Profile
router.get('/', async (req, res) => {
    const { user } = req;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const db = req.app.locals.db;
    try {
        const profile = await db.get(
            `SELECT u.name, u.email, p.* 
             FROM users u 
             LEFT JOIN profiles p ON u.id = p.user_id 
             WHERE u.id = ?`,
            [user.id]
        );
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile' });
    }
});

// Update Profile
router.put('/', async (req, res) => {
    const { user } = req;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const { name, email, bio, location, skills } = req.body;
    const db = req.app.locals.db;

    try {
        // Update user basics
        if (name || email) {
            await db.run('UPDATE users SET name = ?, email = ? WHERE id = ?', [name || user.name, email || user.email, user.id]);
        }

        // Upsert profile details
        const existingProfile = await db.get('SELECT user_id FROM profiles WHERE user_id = ?', [user.id]);
        if (existingProfile) {
            await db.run(
                'UPDATE profiles SET bio = ?, location = ?, skills = ? WHERE user_id = ?',
                [bio, location, skills, user.id]
            );
        } else {
            await db.run(
                'INSERT INTO profiles (user_id, bio, location, skills) VALUES (?, ?, ?, ?)',
                [user.id, bio, location, skills]
            );
        }

        res.json({ success: true, message: 'Profile updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating profile' });
    }
});

export default router;
