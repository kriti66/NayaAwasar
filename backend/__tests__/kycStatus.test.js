// FILE: backend/__tests__/kycStatus.test.js
// PURPOSE: Unit tests for KYC status helper logic
// TYPE: Unit Testing with Jest

import {
    isPendingKYC,
    isApprovedKYC,
    isRejectedKYC,
    canPerformVerifiedAction,
} from '../utils/kycStatusHelper.js';

describe('kycStatusHelper', () => {
    // Pending submissions
    it('should identify pending KYC correctly', () => {
        expect(isPendingKYC('pending')).toBe(true);
        expect(isPendingKYC('PENDING')).toBe(true);
    });

    // Approved / verified state
    it('should identify approved KYC correctly', () => {
        expect(isApprovedKYC('approved')).toBe(true);
        expect(isApprovedKYC('Approved')).toBe(true);
    });

    // Rejected submissions
    it('should identify rejected KYC correctly', () => {
        expect(isRejectedKYC('rejected')).toBe(true);
    });

    // Status values outside known buckets
    it('should return false for unknown status', () => {
        expect(isPendingKYC('not_submitted')).toBe(false);
        expect(isApprovedKYC('pending')).toBe(false);
        expect(isRejectedKYC('approved')).toBe(false);
    });

    // Gate for privileged actions mirrors approved-only policy
    it('should determine whether user can perform restricted actions based on KYC status', () => {
        expect(canPerformVerifiedAction('approved')).toBe(true);
        expect(canPerformVerifiedAction('pending')).toBe(false);
        expect(canPerformVerifiedAction('rejected')).toBe(false);
    });
});
