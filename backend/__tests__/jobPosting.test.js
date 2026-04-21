// FILE: backend/__tests__/jobPosting.test.js
// PURPOSE: Route tests for job posting lifecycle endpoints
// TYPE: Jest + Supertest (router-level)

import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

const mockFindById = jest.fn();
const mockGetPublicJobsWithPromotionSort = jest.fn();

jest.unstable_mockModule('../models/Job.js', () => ({
    default: {
        findById: mockFindById
    }
}));

jest.unstable_mockModule('../models/Application.js', () => ({
    default: {
        countDocuments: jest.fn()
    }
}));

jest.unstable_mockModule('../models/Company.js', () => ({ default: {} }));
jest.unstable_mockModule('../models/User.js', () => ({ default: {} }));

jest.unstable_mockModule('../middleware/auth.js', () => ({
    requireAuth: (req, res, next) => {
        const auth = req.headers.authorization || '';
        if (auth === 'Bearer recruiter-owner') {
            req.user = { id: 'r1', role: 'recruiter' };
            return next();
        }
        if (auth === 'Bearer recruiter-other') {
            req.user = { id: 'r2', role: 'recruiter' };
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
    requireKycApproved: (req, res, next) => next(),
    requireAdmin: (req, res, next) => next(),
    requireCompanyApproved: (req, res, next) => next(),
    requireRecruiterKycApproved: (req, res, next) => next(),
    getJwtSecret: () => 'test-secret'
}));

jest.unstable_mockModule('../controllers/promotedJobController.js', () => ({
    getPromotedJobs: (req, res) => res.json([])
}));

jest.unstable_mockModule('../services/recommendationService.js', () => ({
    getRecommendedJobs: jest.fn(),
    recordUserInteraction: jest.fn(),
    triggerEmbeddingUpdate: jest.fn()
}));

jest.unstable_mockModule('../controllers/recommendationController.js', () => ({
    getSimilarJobsForJob: (req, res) => res.json([])
}));

jest.unstable_mockModule('../services/jobListingService.js', () => ({
    getPublicJobsWithPromotionSort: mockGetPublicJobsWithPromotionSort,
    getJobsForSeekerWithPromotion: jest.fn()
}));

jest.unstable_mockModule('../services/userJobLabelEnrichment.js', () => ({
    applyUserJobLabels: jest.fn(),
    invalidateJobLabelCacheForJob: jest.fn()
}));

jest.unstable_mockModule('../services/jobSearchFilter.js', () => ({
    normalizeTagsInput: (v) => v
}));

jest.unstable_mockModule('../utils/jobLabel.js', () => ({
    normalizeLabelOverride: (v) => v
}));

jest.unstable_mockModule('../constants/jobCategories.js', () => ({
    JOB_CATEGORIES: ['IT', 'Health']
}));

jest.unstable_mockModule('../utils/savedJobsUtils.js', () => ({
    getValidSavedJobIds: jest.fn(),
    cleanUserSavedJobs: jest.fn()
}));

jest.unstable_mockModule('../utils/userQueryHelpers.js', () => ({
    notDeletedFilter: () => ({})
}));

jest.unstable_mockModule('../utils/jobModeration.js', () => ({
    DUPLICATE_MODERATION_STATUSES: [],
    isJobPubliclyVisible: () => true,
    normalizeModerationStatusForEdit: () => 'active',
    isJobVisibleForPublicListing: () => true,
    PUBLIC_MODERATION_MATCH: {},
    RECRUITER_JOB_EXCLUDE_ADMIN_REMOVED: {},
    RECRUITER_MY_JOBS_ADMIN_MODERATION_VALUES: []
}));

jest.unstable_mockModule('../services/recruiterWarningService.js', () => ({
    deactivateWarningsForJob: jest.fn()
}));

jest.unstable_mockModule('../services/interviewJobCleanup.js', () => ({
    cancelInterviewsForJob: jest.fn()
}));

jest.unstable_mockModule('../utils/activityLogger.js', () => ({
    logActivity: jest.fn()
}));

describe('job posting routes', () => {
    let app;

    beforeAll(async () => {
        const { default: jobRoutes } = await import('../routes/jobs.js');
        app = express();
        app.use(express.json());
        app.use('/api/jobs', jobRoutes);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return public jobs on GET /api/jobs', async () => {
        mockGetPublicJobsWithPromotionSort.mockResolvedValue([{ _id: 'j1', status: 'Active' }]);
        const res = await request(app).get('/api/jobs');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(1);
    });

    it('should close own job on PATCH /api/jobs/:id/close', async () => {
        const save = jest.fn().mockResolvedValue(undefined);
        mockFindById.mockResolvedValue({
            _id: 'j1',
            recruiter_id: { toString: () => 'r1' },
            status: 'Active',
            save
        });

        const res = await request(app)
            .patch('/api/jobs/j1/close')
            .set('Authorization', 'Bearer recruiter-owner');

        expect(res.status).toBe(200);
        expect(save).toHaveBeenCalled();
        expect(res.body.status).toBe('Closed');
    });

    it('should reject closing another recruiter job', async () => {
        mockFindById.mockResolvedValue({
            _id: 'j2',
            recruiter_id: { toString: () => 'r1' },
            status: 'Active',
            save: jest.fn()
        });

        const res = await request(app)
            .patch('/api/jobs/j2/close')
            .set('Authorization', 'Bearer recruiter-other');

        expect(res.status).toBe(403);
        expect(res.body.message).toMatch(/unauthorized/i);
    });

    it('should return 404 when closing non-existing job', async () => {
        mockFindById.mockResolvedValue(null);
        const res = await request(app)
            .patch('/api/jobs/missing/close')
            .set('Authorization', 'Bearer recruiter-owner');
        expect(res.status).toBe(404);
    });
});

