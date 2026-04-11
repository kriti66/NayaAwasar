// FILE: backend/__tests__/roleCheck.test.js
// PURPOSE: Unit tests for user role checking logic
// TYPE: Unit Testing with Jest

import checkUserRole from '../utils/checkUserRole.js';

describe('checkUserRole', () => {
    // Recruiter accessing recruiter-only feature
    it('should allow recruiter role when recruiter access is required', () => {
        expect(checkUserRole('recruiter', 'recruiter')).toBe(true);
    });

    // Jobseeker accessing seeker-only feature
    it('should allow jobseeker role when jobseeker access is required', () => {
        expect(checkUserRole('jobseeker', 'jobseeker')).toBe(true);
        expect(checkUserRole('job_seeker', 'jobseeker')).toBe(true);
    });

    // Unknown role string
    it('should reject invalid role', () => {
        expect(checkUserRole('guest', 'recruiter')).toBe(false);
    });

    // Missing user role
    it('should reject undefined role', () => {
        expect(checkUserRole(undefined, 'recruiter')).toBe(false);
    });

    // Correct role type but wrong required gate
    it('should reject role mismatch', () => {
        expect(checkUserRole('jobseeker', 'recruiter')).toBe(false);
        expect(checkUserRole('recruiter', 'jobseeker')).toBe(false);
    });
});
