// FILE: backend/__tests__/profile.test.js
// PURPOSE: Route tests for profile endpoints
// TYPE: Jest + Supertest (router-level)

import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

const profileCtrl = {
    getMyProfile: jest.fn((req, res) => res.json({ id: 'u1', fullName: 'Kriti' })),
    updateProfile: jest.fn((req, res) => res.json({ success: true })),
    updateVisibility: jest.fn((req, res) => res.json({ success: true })),
    updateSkills: jest.fn((req, res) => res.json({ success: true })),
    addExperience: jest.fn((req, res) => res.status(201).json({ success: true })),
    updateExperience: jest.fn((req, res) => res.json({ success: true })),
    deleteExperience: jest.fn((req, res) => res.json({ success: true })),
    addEducation: jest.fn((req, res) => res.status(201).json({ success: true })),
    updateEducation: jest.fn((req, res) => res.json({ success: true })),
    deleteEducation: jest.fn((req, res) => res.json({ success: true })),
    uploadResume: jest.fn((req, res) => res.status(201).json({ success: true })),
    getResume: jest.fn((req, res) => res.json({ resume: null })),
    deleteResume: jest.fn((req, res) => res.json({ success: true })),
    getPublicProfile: jest.fn((req, res) => res.json({ id: req.params.userId }))
};

const cvCtrl = {
    generateCV: jest.fn((req, res) => res.json({ ok: true })),
    downloadCV: jest.fn((req, res) => res.json({ ok: true })),
    viewCV: jest.fn((req, res) => res.json({ ok: true }))
};

jest.unstable_mockModule('../controllers/profileController.js', () => profileCtrl);
jest.unstable_mockModule('../controllers/cvController.js', () => cvCtrl);

jest.unstable_mockModule('../middleware/auth.js', () => ({
    requireAuth: (req, res, next) => {
        const auth = req.headers.authorization || '';
        if (auth === 'Bearer recruiter-token') {
            req.user = { id: 'r1', role: 'recruiter' };
            return next();
        }
        if (auth === 'Bearer seeker-token') {
            req.user = { id: 'u1', role: 'jobseeker' };
            return next();
        }
        return res.status(401).json({ message: 'Access token required' });
    },
    requireRole: (...roles) => (req, res, next) => {
        const auth = req.headers.authorization || '';
        if (auth === 'Bearer recruiter-token') req.user = { id: 'r1', role: 'recruiter' };
        if (auth === 'Bearer admin-token') req.user = { id: 'a1', role: 'admin' };
        if (!roles.includes(req.user?.role)) {
            return res.status(403).json({ message: 'You are not allowed to perform this action.' });
        }
        return next();
    }
}));

describe('profile routes', () => {
    let app;

    beforeAll(async () => {
        const { default: routes } = await import('../routes/profiles.js');
        app = express();
        app.use(express.json());
        app.use('/api/profile', routes);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return own profile', async () => {
        const res = await request(app).get('/api/profile/me');
        expect(res.status).toBe(200);
        expect(res.body.fullName).toBe('Kriti');
    });

    it('should reject public profile access for non-recruiter', async () => {
        const res = await request(app)
            .get('/api/profile/u2/public')
            .set('Authorization', 'Bearer seeker-token');
        expect(res.status).toBe(403);
    });

    it('should allow recruiter to access public profile', async () => {
        const res = await request(app)
            .get('/api/profile/u2/public')
            .set('Authorization', 'Bearer recruiter-token');
        expect(res.status).toBe(200);
        expect(profileCtrl.getPublicProfile).toHaveBeenCalled();
    });
});

