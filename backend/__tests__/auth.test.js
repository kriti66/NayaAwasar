// FILE: backend/__tests__/auth.test.js
// PURPOSE: Route tests for auth endpoints
// TYPE: Jest + Supertest (router-level)

import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

const mockFindOne = jest.fn();
const mockFindById = jest.fn();
const mockCompare = jest.fn();
const mockSign = jest.fn();

jest.unstable_mockModule('../models/User.js', () => ({
    default: {
        findOne: mockFindOne,
        findById: mockFindById
    }
}));

jest.unstable_mockModule('bcryptjs', () => ({
    default: {
        compare: mockCompare
    }
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
    default: {
        sign: mockSign
    }
}));

jest.unstable_mockModule('../middleware/auth.js', () => ({
    requireAuth: (req, res, next) => {
        const auth = req.headers.authorization || '';
        if (auth === 'Bearer valid-token') {
            req.user = { id: 'u1', role: 'jobseeker' };
            return next();
        }
        return res.status(401).json({ message: 'Access token required' });
    },
    getJwtSecret: () => 'test-secret'
}));

jest.unstable_mockModule('../controllers/authController.js', () => ({
    sendOtp: (req, res) => res.json({ ok: true }),
    verifyOtp: (req, res) => res.json({ ok: true }),
    resetPassword: (req, res) => res.json({ ok: true }),
    googleLogin: (req, res) => res.json({ ok: true }),
    facebookLogin: (req, res) => res.json({ ok: true }),
    sendSignupOTP: (req, res) => res.json({ ok: true }),
    verifySignupOTP: (req, res) => res.json({ ok: true }),
    resendSignupOTP: (req, res) => res.json({ ok: true })
}));

describe('auth routes', () => {
    let app;

    beforeAll(async () => {
        const { default: authRoutes } = await import('../routes/auth.js');
        app = express();
        app.use(express.json());
        app.use('/api/auth', authRoutes);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return 400 when login payload is incomplete', async () => {
        const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com' });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/required/i);
    });

    it('should login successfully with valid credentials', async () => {
        mockFindOne.mockResolvedValue({
            _id: 'u1',
            fullName: 'Kriti',
            email: 'kriti@example.com',
            role: 'jobseeker',
            password: 'hash',
            isDeleted: false,
            isRemoved: false,
            isSuspended: false,
            isActive: true,
            kycStatus: 'approved',
            isKycSubmitted: true,
            isKycVerified: true
        });
        mockCompare.mockResolvedValue(true);
        mockSign.mockReturnValue('valid-token');

        const res = await request(app).post('/api/auth/login').send({
            email: 'kriti@example.com',
            password: 'Abcd1234'
        });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.token).toBe('valid-token');
        expect(res.body.user.email).toBe('kriti@example.com');
    });

    it('should return 401 for invalid credentials', async () => {
        mockFindOne.mockResolvedValue({
            _id: 'u1',
            email: 'kriti@example.com',
            password: 'hash',
            isDeleted: false,
            isRemoved: false,
            isSuspended: false
        });
        mockCompare.mockResolvedValue(false);

        const res = await request(app).post('/api/auth/login').send({
            email: 'kriti@example.com',
            password: 'wrong'
        });

        expect(res.status).toBe(401);
        expect(res.body.message).toMatch(/invalid credentials/i);
    });

    it('should return current user on /me when authenticated', async () => {
        mockFindById.mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue({
                    _id: 'u1',
                    fullName: 'Kriti',
                    email: 'kriti@example.com',
                    role: 'jobseeker',
                    kycStatus: 'approved'
                })
            })
        });

        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(res.body.email).toBe('kriti@example.com');
    });
});

