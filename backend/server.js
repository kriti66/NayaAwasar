import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// 🛑 Crash Logger
const logCrash = (type, error) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${type}: ${error.stack || error}\n`;
    try {
        fs.appendFileSync('crash_log.txt', logMessage);
        console.error(logMessage);
    } catch (fsErr) {
        console.error("Failed to write to crash log:", fsErr);
    }
};

process.on('uncaughtException', (err) => {
    logCrash('UNCAUGHT_EXCEPTION', err);
    // process.exit(1); // Optional: keep it running if possible for debugging, but usually bad practice
});

process.on('unhandledRejection', (reason, promise) => {
    logCrash('UNHANDLED_REJECTION', reason);
});

// MongoDB: required for JWT-based auth and user management (User, KYC, Job, Application)
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.warn('MONGO_URI not set. Set it in .env for JWT auth and KYC to work.');
} else {
    mongoose.connect(MONGO_URI)
        .then(() => console.log('MongoDB connected'))
        .catch(err => {
            console.error('MongoDB connection error:', err);
            console.warn('Server will still start; auth/KYC will fail until MongoDB is reachable.');
        });
}

const app = express();
const PORT = process.env.PORT || 5001; // Matches the .env PORT prefernece

// Middleware
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:5178',
    'http://localhost:5179',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5178'
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
        }
        return callback(null, true);
    },
    credentials: true
}));
app.use(express.json());

// Serving static files (uploaded CVs, etc.)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check (use this in browser to confirm backend is running: http://localhost:5001/api/health)
app.get('/api/health', (req, res) => {
    res.json({ ok: true, message: 'Backend is running', port: PORT });
});
app.get('/', (req, res) => {
    res.send('Naya Awasar API is running');
});

// Import Routes & Auth
import authRoutes from './routes/auth.js';
import jobRoutes from './routes/jobs.js';
import applicationRoutes from './routes/applications.js';
import dashboardRoutes from './routes/dashboard.js';
import uploadRoutes from './routes/upload.js';
import userRoutes from './routes/users.js';
import userProfileRoutes from './routes/userProfile.js';
import profileRoutes from './routes/profiles.js';
import kycRoutes from './routes/kyc.js';
import adminRoutes from './routes/admin.js';
import locationRoutes from './routes/location.js';
import companyRoutes from './routes/companies.js';
import recruiterRoutes from './routes/recruiter.js';
import { requireAuth } from './middleware/auth.js';
import projectRoutes from './routes/projects.js';
import activityRoutes from './routes/activity.js';
import notificationRoutes from './routes/notifications.js';
import analyticsRoutes from './routes/analytics.js';
import interviewRoutes from './routes/interviewRoutes.js';

app.use('/api', analyticsRoutes); // Mounts /jobs/:jobId/view and /recruiter/jobs/:jobId/analytics


app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', requireAuth, applicationRoutes);
app.use('/api/dashboard', requireAuth, dashboardRoutes);
app.use('/api/upload', requireAuth, uploadRoutes);
app.use('/api/admin/users', requireAuth, userRoutes);
app.use('/api/users', requireAuth, userProfileRoutes); // Mounts /profile and /profile-image
app.use('/api/admin', adminRoutes);
app.use('/api/profile', requireAuth, profileRoutes);
app.use('/api/projects', requireAuth, projectRoutes);
app.use('/api/activity', requireAuth, activityRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/notifications', requireAuth, notificationRoutes);

app.use('/api/kyc', requireAuth, kycRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/recruiter', recruiterRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("🔥 Global Error Handler:", err);
    res.status(500).json({
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`  Backend running at http://localhost:${PORT}`);
    console.log(`  Health check: http://localhost:${PORT}/api/health`);
    console.log(`  Keep this terminal OPEN while using the app.`);
    console.log(`========================================\n`);
});
