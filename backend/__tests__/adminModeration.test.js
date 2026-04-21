// FILE: backend/__tests__/adminModeration.test.js
// PURPOSE: Route tests for admin job moderation endpoints
// TYPE: Jest + Supertest (router-level)

import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

const mockResolveWarning = jest.fn();

jest.unstable_mockModule('../middleware/auth.js', () => ({
    requireAuth: (req, res, next) => {
        const auth = req.headers.authorization || '';
        if (auth === 'Bearer admin-token') {
            req.user = { id: 'a1', role: 'admin' };
            return next();
        }
        return res.status(401).json({ message: 'Access token required' });
    },
    requireAdmin: (req, res, next) => {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Admin access required' });
        }
        return next();
    }
}));

jest.unstable_mockModule('../models/Job.js', () => ({
    default: {
        findById: jest.fn(),
        find: jest.fn(),
        countDocuments: jest.fn()
    }
}));

jest.unstable_mockModule('../services/recruiterWarningService.js', () => ({
    createRecruiterWarningFromJobWarn: jest.fn(),
    deactivateWarningsForJob: jest.fn(),
    resolveRecruiterWarningById: mockResolveWarning
}));

jest.unstable_mockModule('../services/interviewJobCleanup.js', () => ({
    cancelInterviewsForJob: jest.fn()
}));

describe('admin moderation routes', () => {
    let app;

    beforeAll(async () => {
        const { default: routes } = await import('../routes/moderationRoutes.js');
        app = express();
        app.use(express.json());
        app.use('/api/admin/moderation', routes);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should block unauthenticated admin moderation access', async () => {
        const res = await request(app).get('/api/admin/moderation/jobs');
        expect(res.status).toBe(401);
    });

    it('should return 400 when warning message is missing', async () => {
        const res = await request(app)
            .patch('/api/admin/moderation/jobs/j1/warn')
            .set('Authorization', 'Bearer admin-token')
            .send({ message: '' });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/required/i);
    });

    it('should resolve recruiter warning in happy path', async () => {
        mockResolveWarning.mockResolvedValue({ _id: 'w1', isActive: false });
        const res = await request(app)
            .patch('/api/admin/moderation/recruiter-warnings/w1/resolve')
            .set('Authorization', 'Bearer admin-token');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should return 404 when warning id does not exist', async () => {
        mockResolveWarning.mockResolvedValue(null);
        const res = await request(app)
            .patch('/api/admin/moderation/recruiter-warnings/none/resolve')
            .set('Authorization', 'Bearer admin-token');
        expect(res.status).toBe(404);
    });
});

