// FILE: backend/__tests__/kyc.test.js
// PURPOSE: Route tests for KYC submission/status endpoints
// TYPE: Jest + Supertest (router-level)

import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

const submitKYC = jest.fn((req, res) => res.status(201).json({ success: true }));
const getKYCStatus = jest.fn((req, res) => res.json({ status: 'pending' }));
const submitRecruiterKyc = jest.fn((req, res) => res.status(201).json({ success: true }));
const getRecruiterKycStatus = jest.fn((req, res) => res.json({ status: 'approved' }));

jest.unstable_mockModule('../controllers/kycController.js', () => ({
    submitKYC,
    getKYCStatus
}));

jest.unstable_mockModule('../controllers/recruiterKycController.js', () => ({
    submitRecruiterKyc,
    getRecruiterKycStatus
}));

jest.unstable_mockModule('../middleware/auth.js', () => ({
    requireAuth: (req, res, next) => {
        if (req.headers.authorization === 'Bearer valid-token') {
            req.user = { id: 'u1', role: 'jobseeker' };
            return next();
        }
        return res.status(401).json({ message: 'Access token required' });
    }
}));

describe('kyc routes', () => {
    let app;

    beforeAll(async () => {
        const { default: routes } = await import('../routes/kyc.js');
        app = express();
        app.use(express.json());
        app.use('/api/kyc', routes);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should reject unauthenticated KYC submit', async () => {
        const res = await request(app).post('/api/kyc/submit').send({ citizenshipNo: '123' });
        expect(res.status).toBe(401);
    });

    it('should submit seeker KYC on happy path', async () => {
        const res = await request(app)
            .post('/api/kyc/submit')
            .set('Authorization', 'Bearer valid-token')
            .send({ citizenshipNo: '123' });
        expect(res.status).toBe(201);
        expect(submitKYC).toHaveBeenCalled();
    });

    it('should return recruiter KYC status', async () => {
        const res = await request(app)
            .get('/api/kyc/recruiter/status')
            .set('Authorization', 'Bearer valid-token');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('approved');
    });
});

