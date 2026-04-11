// FILE: backend/__tests__/reschedule.test.js
// PURPOSE: Unit tests for interview reschedule state transitions
// TYPE: Unit Testing with Jest

import {
    handleRescheduleRequest,
    acceptReschedule,
    declineReschedule,
} from '../utils/rescheduleHelper.js';

describe('rescheduleHelper', () => {
    const base = { status: 'scheduled', rescheduleRoundCount: 0 };

    // New request enters pending workflow
    it('should set rescheduleStatus to pending when request is made', () => {
        const next = handleRescheduleRequest(base, 'recruiter');
        expect(next.rescheduleStatus).toBe('pending');
    });

    // Track proposer
    it('should set rescheduleRequestedBy correctly', () => {
        const next = handleRescheduleRequest(base, 'jobseeker');
        expect(next.rescheduleRequestedBy).toBe('jobseeker');
    });

    // Each new request bumps the counter
    it('should increment rescheduleRoundCount on each request', () => {
        const first = handleRescheduleRequest(base, 'recruiter');
        const second = handleRescheduleRequest(first, 'recruiter');
        expect(first.rescheduleRoundCount).toBe(1);
        expect(second.rescheduleRoundCount).toBe(2);
    });

    // Accept path
    it('should set status to rescheduled when accepted', () => {
        const pending = handleRescheduleRequest(base, 'recruiter');
        const next = acceptReschedule(pending);
        expect(next.status).toBe('rescheduled');
    });

    // Decline path
    it('should set status to declined when rejected', () => {
        const pending = handleRescheduleRequest(base, 'recruiter');
        const next = declineReschedule(pending);
        expect(next.status).toBe('declined');
    });

    // Audit trail
    it('should add entry to rescheduleHistory', () => {
        const next = handleRescheduleRequest({ ...base, rescheduleHistory: [] }, 'recruiter');
        expect(next.rescheduleHistory.length).toBe(1);
        expect(next.rescheduleHistory[0].action).toBe('request');
    });

    // Missing history array should not throw
    it('should not break if history is initially empty', () => {
        expect(() => handleRescheduleRequest(base, 'recruiter')).not.toThrow();
        const next = handleRescheduleRequest(base, 'recruiter');
        expect(Array.isArray(next.rescheduleHistory)).toBe(true);
    });
});
