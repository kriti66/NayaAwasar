// FILE: backend/__tests__/notificationBuilder.test.js
// PURPOSE: Unit tests for notification copy builder
// TYPE: Unit Testing with Jest

import buildNotificationMessage from '../utils/buildNotificationMessage.js';

describe('buildNotificationMessage', () => {
    it('should build correct notification for KYC submitted', () => {
        expect(buildNotificationMessage('kyc_submitted')).toMatch(/submitted/i);
    });

    it('should build correct notification for KYC approved', () => {
        expect(buildNotificationMessage('kyc_approved')).toMatch(/approved/i);
    });

    it('should build correct notification for KYC rejected', () => {
        expect(buildNotificationMessage('kyc_rejected')).toMatch(/rejected/i);
    });

    it('should build correct notification for interview scheduled', () => {
        expect(buildNotificationMessage('interview_scheduled')).toMatch(/interview/i);
    });

    it('should build correct notification for reschedule request', () => {
        expect(buildNotificationMessage('reschedule_request')).toMatch(/reschedule/i);
    });

    it('should return default safe notification for unknown type', () => {
        const msg = buildNotificationMessage('unknown_event_xyz');
        expect(typeof msg).toBe('string');
        expect(msg.length).toBeGreaterThan(0);
    });
});
