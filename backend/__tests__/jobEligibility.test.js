// FILE: backend/__tests__/jobEligibility.test.js
// PURPOSE: Unit tests for job apply / post eligibility rules
// TYPE: Unit Testing with Jest

import { canApplyForJob, canPostJob } from '../utils/jobEligibilityHelper.js';

describe('jobEligibilityHelper', () => {
    // Verified seeker may apply
    it('should allow verified jobseeker to apply', () => {
        expect(
            canApplyForJob({ role: 'jobseeker', kycStatus: 'approved' })
        ).toBe(true);
        expect(canApplyForJob({ role: 'jobseeker', isKycVerified: true })).toBe(true);
    });

    // KYC not approved → cannot apply
    it('should reject unverified jobseeker from applying', () => {
        expect(canApplyForJob({ role: 'jobseeker', kycStatus: 'pending' })).toBe(false);
    });

    // Recruiters use a different flow
    it('should reject recruiter from applying', () => {
        expect(canApplyForJob({ role: 'recruiter', kycStatus: 'approved' })).toBe(false);
    });

    // Verified recruiter may post
    it('should allow verified recruiter to post jobs', () => {
        expect(canPostJob({ role: 'recruiter', kycStatus: 'approved' })).toBe(true);
    });

    // Unverified recruiter blocked
    it('should reject unverified recruiter from posting jobs', () => {
        expect(canPostJob({ role: 'recruiter', kycStatus: 'pending' })).toBe(false);
    });

    // Malformed / missing user object
    it('should reject missing user data', () => {
        expect(canApplyForJob(null)).toBe(false);
        expect(canPostJob(undefined)).toBe(false);
    });
});
