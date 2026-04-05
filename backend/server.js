import './load-env.js';
import './utils/puppeteerCacheDir.js';
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

// Middleware — CORS (local dev, FRONTEND_URL(S), Vercel previews, optional regex)
const parseCsv = (value) =>
    String(value || '')
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    ...parseCsv(process.env.FRONTEND_URL),
    ...parseCsv(process.env.FRONTEND_URLS),
].filter(Boolean);

const allowedOriginsSet = new Set(allowedOrigins);

const allowedOriginRegex = parseCsv(process.env.CORS_ORIGIN_REGEX)
    .map((pattern) => {
        try {
            return new RegExp(pattern);
        } catch {
            console.warn(`Invalid CORS_ORIGIN_REGEX pattern ignored: ${pattern}`);
            return null;
        }
    })
    .filter(Boolean);

/** HTTPS deployments on Vercel (*.vercel.app) */
function isVercelAppOrigin(origin) {
    if (typeof origin !== 'string' || !origin.startsWith('https://')) return false;
    try {
        const { hostname } = new URL(origin);
        return hostname === 'vercel.app' || hostname.endsWith('.vercel.app');
    } catch {
        return false;
    }
}

/** Dev tunnels: allow https://*.devtunnels.ms */
function isDevTunnelOrigin(origin) {
    if (typeof origin !== 'string' || !origin.startsWith('https://')) return false;
    try {
        const { hostname } = new URL(origin);
        return hostname === 'devtunnels.ms' || hostname.endsWith('.devtunnels.ms');
    } catch {
        return false;
    }
}

const corsOptions = {
    origin(origin, callback) {
        // No Origin: same-origin, Postman, curl, many mobile clients
        if (origin == null || origin === '') {
            return callback(null, true);
        }

        if (allowedOriginsSet.has(origin)) {
            return callback(null, true);
        }

        if (isVercelAppOrigin(origin)) {
            return callback(null, true);
        }

        if (isDevTunnelOrigin(origin)) {
            return callback(null, true);
        }

        if (allowedOriginRegex.some((re) => re.test(origin))) {
            return callback(null, true);
        }

        console.warn(`CORS not allowed for origin: ${origin}`);
        return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
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
import moderationRoutes from './routes/moderationRoutes.js';
import locationRoutes from './routes/location.js';
import companyRoutes from './routes/companies.js';
import recruiterRoutes from './routes/recruiter.js';
import { requireAuth } from './middleware/auth.js';
import projectRoutes from './routes/projects.js';
import activityRoutes from './routes/activity.js';
import notificationRoutes from './routes/notifications.js';
import analyticsRoutes from './routes/analytics.js';
import interviewRoutes from './routes/interviewRoutes.js';
import interviewRescheduleRoutes from './routes/interviewRescheduleRoutes.js';
import { startRescheduleExpiryCron } from './jobs/rescheduleExpiryCron.js';
import zegoRoutes from './routes/zegoRoutes.js';
import recommendationRoutes from './routes/recommendations.js';
import contactRoutes from './routes/contact.js';
import chatbotRoutes from './routes/chatbotRoutes.js';
import testimonialRoutes from './routes/testimonialRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import promotionRoutes from './routes/promotions.js';
import promotionPaymentRequestRoutes from './routes/promotionPaymentRequests.js';
import identityKycRoutes from './routes/kycRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

import aiRoutes from './routes/ai.js';

app.use('/api', analyticsRoutes); // Mounts /jobs/:jobId/view and /recruiter/jobs/:jobId/analytics
app.use('/api/ai', aiRoutes);
app.use('/api/recommendations', recommendationRoutes);



app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', requireAuth, applicationRoutes);
app.use('/api/dashboard', requireAuth, dashboardRoutes);
app.use('/api/upload', requireAuth, uploadRoutes);
app.use('/api/admin/users', requireAuth, userRoutes);
app.use('/api/users', requireAuth, userProfileRoutes); // Mounts /profile and /profile-image
app.use('/api/admin', adminRoutes);
app.use('/api/admin/moderation', moderationRoutes);
app.use('/api/profile', requireAuth, profileRoutes);
app.use('/api/projects', requireAuth, projectRoutes);
app.use('/api/activity', requireAuth, activityRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/interviews/reschedule', interviewRescheduleRoutes);
app.use('/api/zego', zegoRoutes);
app.use('/api/notifications', requireAuth, notificationRoutes);

app.use('/api/kyc', requireAuth, kycRoutes);
app.use('/api/kyc/identity', requireAuth, identityKycRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/promotion-payment-requests', promotionPaymentRequestRoutes);

// Global Error Handler (always last)
app.use(errorHandler);

app.listen(PORT, () => {
    startRescheduleExpiryCron();
    console.log(`\n========================================`);
    console.log(`  Backend running at http://localhost:${PORT}`);
    console.log(`  Health check: http://localhost:${PORT}/api/health`);
    console.log(`  Keep this terminal OPEN while using the app.`);
    console.log(`========================================\n`);
});
