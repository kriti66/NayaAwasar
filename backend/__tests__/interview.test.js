// FILE: backend/__tests__/interview.test.js
// PURPOSE: Route tests for interview endpoints
// TYPE: Jest + Supertest (router-level)

import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

const ctrl = {
    getZegoToken: jest.fn((req, res) => res.json({ token: 'zego' })),
    getRecruiterInterviewCalendar: jest.fn((req, res) => res.json([])),
    getSeekerInterviewCalendar: jest.fn((req, res) => res.json([])),
    acceptInterviewBySeeker: jest.fn((req, res) => res.json({ ok: true })),
    requestInterviewReschedule: jest.fn((req, res) => res.json({ ok: true })),
    acceptInterviewReschedule: jest.fn((req, res) => res.json({ ok: true })),
    patchInterviewRescheduleAccept: jest.fn((req, res) => res.json({ ok: true })),
    patchInterviewRescheduleReject: jest.fn((req, res) => res.json({ ok: true })),
    completeInterview: jest.fn((req, res) => res.json({ ok: true })),
    cancelInterview: jest.fn((req, res) => res.json({ ok: true })),
    recordInterviewCallEvent: jest.fn((req, res) => res.status(201).json({ ok: true }))
};

jest.unstable_mockModule('../controllers/interviewController.js', () => ctrl);

jest.unstable_mockModule('../middleware/auth.js', () => ({
    requireAuth: (req, res, next) => {
        const auth = req.headers.authorization || '';
        if (auth === 'Bearer recruiter-token') {
            req.user = { id: 'r1', role: 'recruiter' };
            return next();
        }
        if (auth === 'Bearer seeker-token') {
            req.user = { id: 's1', role: 'jobseeker' };
            return next();
        }
        return res.status(401).json({ message: 'Access token required' });
    },
    requireRole: (...roles) => (req, res, next) => {
        if (!roles.includes(req.user?.role)) {
            return res.status(403).json({ message: 'You are not allowed to perform this action.' });
        }
        return next();
    },
    requireRecruiter: (req, res, next) => {
        if (req.user?.role !== 'recruiter') {
            return res.status(403).json({ message: 'You are not allowed to perform this action.' });
        }
        return next();
    }
}));

describe('interview routes', () => {
    let app;

    beforeAll(async () => {
        const { default: routes } = await import('../routes/interviewRoutes.js');
        app = express();
        app.use(express.json());
        app.use('/api/interviews', routes);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return recruiter interview calendar for recruiter', async () => {
        const res = await request(app)
            .get('/api/interviews/calendar/recruiter')
            .set('Authorization', 'Bearer recruiter-token');
        expect(res.status).toBe(200);
        expect(ctrl.getRecruiterInterviewCalendar).toHaveBeenCalled();
    });

    it('should reject seeker-only accept endpoint for recruiter', async () => {
        const res = await request(app)
            .patch('/api/interviews/iv1/accept')
            .set('Authorization', 'Bearer recruiter-token');
        expect(res.status).toBe(403);
    });

    it('should allow seeker to accept interview', async () => {
        const res = await request(app)
            .patch('/api/interviews/iv1/accept')
            .set('Authorization', 'Bearer seeker-token');
        expect(res.status).toBe(200);
        expect(ctrl.acceptInterviewBySeeker).toHaveBeenCalled();
    });
});

