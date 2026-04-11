// FILE: backend/__tests__/kycQueueFilter.test.js
// PURPOSE: Unit tests for KYC queue filtering (in-memory arrays only)
// TYPE: Unit Testing with Jest

import filterPendingKYC from '../utils/filterPendingKYC.js';

describe('filterPendingKYC', () => {
    // Only pending rows remain
    it('should return only pending KYC entries', () => {
        const rows = [
            { id: 1, kycStatus: 'pending' },
            { id: 2, kycStatus: 'approved' },
        ];
        expect(filterPendingKYC(rows)).toEqual([{ id: 1, kycStatus: 'pending' }]);
    });

    // Approved are dropped from admin queue
    it('should exclude approved KYC entries', () => {
        const rows = [{ id: 1, kycStatus: 'approved' }];
        expect(filterPendingKYC(rows)).toEqual([]);
    });

    // Rejected are not “in queue” for pending review
    it('should exclude rejected KYC entries', () => {
        const rows = [{ id: 1, kycStatus: 'rejected' }];
        expect(filterPendingKYC(rows)).toEqual([]);
    });

    // No pending rows → empty list
    it('should return empty array when no pending KYC exists', () => {
        expect(filterPendingKYC([])).toEqual([]);
    });

    // Simulates resubmission after rejection (status flipped back to pending)
    it('should return pending KYC again after rejected item is changed back to pending', () => {
        const rows = [{ id: 1, kycStatus: 'rejected' }];
        rows[0].kycStatus = 'pending';
        expect(filterPendingKYC(rows)).toEqual([{ id: 1, kycStatus: 'pending' }]);
    });
});
