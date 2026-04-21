// FILE: backend/__tests__/jobApplication.test.js
// PURPOSE: Route tests for job application endpoints
// TYPE: Jest + Supertest (router-level)

import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

const ctrl = {
    getMyApplications: jest.fn((req, res) => res.json([{ _id: 'a1' }])),
    getMyInterviews: jest.fn((req, res) => res.json([])),
    getRecruiterApplications: jest.fn((req, res) => res.json([])),
    getInterviewApplicationDetail: jest.fn((req, res) => res.json({})),
    markInterviewJoined: jest.fn((req, res) => res.json({ ok: true })),
    cancelJobseekerRescheduleRequest: jest.fn((req, res) => res.json({ ok: true })),
    updateInterviewResult: jest.fn((req, res) => res.json({ ok: true })),
    applyForJob: jest.fn((req, res) => res.status(201).json({ success: true })),
    withdrawApplication: jest.fn((req, res) => res.json({ ok: true })),
    acceptOffer: jest.fn((req, res) => res.json({ ok: true })),
    requestReschedule: jest.fn((req, res) => res.json({ ok: true })),
    acceptRecruiterReschedule: jest.fn((req, res) => res.json({ ok: true })),
    rejectRecruiterReschedule: jest.fn((req, res) => res.json({ ok: true })),
    getJobApplications: jest.fn((req, res) => res.json([])),
    advanceApplication: jest.fn((req, res) => res.json({ ok: true })),
    rejectApplication: jest.fn((req, res) => res.json({ ok: true })),
    updateApplicationStatus: jest.fn((req, res) => res.json({ ok: true })),
    approveReschedule: jest.fn((req, res) => res.json({ ok: true })),
    rejectReschedule: jest.fn((req, res) => res.json({ ok: true })),
    proposeRecruiterReschedule: jest.fn((req, res) => res.json({ ok: true }))
};

jest.unstable_mockModule('../controllers/NewApplicationController.js', () => ctrl);

jest.unstable_mockModule('../middleware/auth.js', () => ({
    requireAuth: (req, res, next) => {
        const auth = req.headers.authorization || '';
        if (auth === 'Bearer seeker-token') {
            req.user = { id: 'u1', role: 'jobseeker' };
            return next();
        }
        if (auth === 'Bearer recruiter-token') {
            req.user = { id: 'r1', role: 'recruiter' };
            return next();
        }
        return res.status(401).json({ message: 'Access token required' });
    },
    requireKycApproved: (req, res, next) => next(),
    requireKycVerified: (req, res, next) => next(),
    requireRole: (...roles) => (req, res, next) => {
        if (!roles.includes(req.user?.role)) {
            return res.status(403).json({ message: 'You are not allowed to perform this action.' });
        }
        return next();
    }
}));

describe('job application routes', () => {
    let app;

    beforeAll(async () => {
        const { default: routes } = await import('../routes/applications.js');
        app = express();
        app.use(express.json());
        app.use('/api/applications', routes);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return logged-in seeker applications', async () => {
        const res = await request(app)
            .get('/api/applications/my')
            .set('Authorization', 'Bearer seeker-token');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(ctrl.getMyApplications).toHaveBeenCalled();
    });

    it('should block unauthenticated application submit', async () => {
        const res = await request(app).post('/api/applications/apply');
        expect(res.status).toBe(401);
    });

    it('should allow recruiter to update application status', async () => {
        const res = await request(app)
            .patch('/api/applications/abc/status')
            .set('Authorization', 'Bearer recruiter-token')
            .send({ status: 'in_review' });
        expect(res.status).toBe(200);
        expect(ctrl.updateApplicationStatus).toHaveBeenCalled();
    });
});

