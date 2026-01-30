import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Register
router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    const db = req.app.locals.db;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.run(
            `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
            [name, email, hashedPassword, role || 'jobseeker']
        );

        const token = jwt.sign({ id: result.lastID, role: role || 'jobseeker' }, JWT_SECRET, { expiresIn: '1d' });

        res.status(201).json({
            success: true,
            token,
            user: { id: result.lastID, name, email, role: role || 'jobseeker' }
        });
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const db = req.app.locals.db;

    try {
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

        res.json({
            success: true,
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    const db = req.app.locals.db;

    try {
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) {
            // Security: Don't reveal if email exists or not
            return res.json({ message: 'If that email exists, a reset link has been sent.' });
        }

        // Generate Token
        const token = crypto.randomBytes(20).toString('hex');
        const expires = Date.now() + 3600000; // 1 hour

        await db.run(
            `UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?`,
            [token, expires, user.id]
        );

        // Send Email using Utility
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetUrl = `${frontendUrl}/reset-password/${token}`;

        const message = `
            <h1>Password Reset Request</h1>
            <p>You have requested a password reset. Please click the link below to verify your email and set a new password:</p>
            <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
            <p>If you didn't request this, please ignore this email.</p>
        `;

        try {
            await sendEmail({
                to: user.email,
                subject: 'Password Reset - Naya Awasar',
                text: message
            });
            res.json({ message: 'Email sent!' });
        } catch (error) {
            console.error("Email send error:", error);
            // reset token if email fails
            await db.run(
                `UPDATE users SET reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?`,
                [user.id]
            );
            return res.status(500).json({ message: 'Email could not be sent' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reset Password
router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
    const db = req.app.locals.db;

    try {
        const user = await db.get(
            `SELECT * FROM users WHERE reset_password_token = ?`,
            [token]
        );

        if (!user) {
            return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
        }

        if (Date.now() > user.reset_password_expires) {
            return res.status(400).json({ message: 'Password reset token has expired.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.run(
            `UPDATE users SET password = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?`,
            [hashedPassword, user.id]
        );

        res.json({ message: 'Password has been updated.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
