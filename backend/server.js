import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import initDb from './database/init.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serving static files (uploaded CVs, etc.) if needed
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize DB
let db;
initDb().then(database => {
    db = database;
    app.locals.db = db; // Make db accessible in routes
}).catch(err => {
    console.error('Failed to initialize database', err);
});

// Routes Placeholder
app.get('/', (req, res) => {
    res.send('Naya Awasar API is running');
});

// Import Routes
import authRoutes from './routes/auth.js';
import jobRoutes from './routes/jobs.js';
import applicationRoutes from './routes/applications.js';
import dashboardRoutes from './routes/dashboard.js';
import uploadRoutes from './routes/upload.js';
import userRoutes from './routes/users.js';
import profileRoutes from './routes/profiles.js';
import jwt from 'jsonwebtoken';

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey', (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', authenticateToken, applicationRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/upload', authenticateToken, uploadRoutes);
app.use('/api/admin/users', authenticateToken, userRoutes);
app.use('/api/profile', authenticateToken, profileRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
