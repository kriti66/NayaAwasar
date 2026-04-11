// FILE: backend/__tests__/applicationValidation.test.js
// PURPOSE: Unit tests for job application payload validation
// TYPE: Unit Testing with Jest

import validateJobApplication from '../utils/validateJobApplication.js';

describe('validateJobApplication', () => {
    // Minimal happy path
    it('should return valid when jobId exists', () => {
        const r = validateJobApplication({ jobId: '507f1f77bcf86cd799439011' });
        expect(r.valid).toBe(true);
    });

    // jobId required
    it('should return invalid when jobId is missing', () => {
        const r = validateJobApplication({ resumeUrl: 'https://x/cv.pdf' });
        expect(r.valid).toBe(false);
    });

    // Empty / whitespace jobId
    it('should return invalid when jobId is empty', () => {
        expect(validateJobApplication({ jobId: '' }).valid).toBe(false);
        expect(validateJobApplication({ jobId: '   ' }).valid).toBe(false);
    });

    // When resume is mandatory, missing file fails
    it('should return invalid when CV/resume is required but missing', () => {
        const r = validateJobApplication({ jobId: 'abc' }, { requireResume: true });
        expect(r.valid).toBe(false);
    });

    // Messages are stable for UI / API consumers
    it('should return proper validation message', () => {
        expect(validateJobApplication({}).message).toMatch(/job id/i);
        expect(
            validateJobApplication({ jobId: 'x' }, { requireResume: true }).message
        ).toMatch(/resume|cv/i);
    });
});
