
import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { trackJobView, getJobAnalytics } from '../controllers/analyticsController.js';

const router = express.Router();

// Track View (Public or Auth)
// Middleware to extract user if logged in, but not block if not
// We can reusing requireAuth but make it optional? 
// For now, let's just use a custom middleware or simpler approach.
// jobs.js probably handles public access. The tracking endpoint might be called by public.
// But the prompt said "POST /api/jobs/:jobId/view".
// I'll define these routes here, but they need to be mounted.
// Note: The prompt asked for `GET /api/recruiter/jobs/:jobId/analytics`
// and `POST /api/jobs/:jobId/view`.
// These are different path prefixes potentially.
// I will mount this router at /api/analytics and define sub-routes, 
// OR mount at /api and define full paths?
// Let's mount at /api in server.js to be flexible.

router.post('/jobs/:jobId/view', async (req, res, next) => {
    // Optional auth middleware
    // We can just check header manually or use a specific middleware
    // For simplicity, just call controller, controller checks req.user
    next();
}, trackJobView);

router.get('/recruiter/jobs/:jobId/analytics', requireAuth, getJobAnalytics);

export default router;
