// FILE: backend/__tests__/dashboardStats.test.js
// PURPOSE: Unit tests for dashboard aggregate counters
// TYPE: Unit Testing with Jest

import calculateDashboardStats from '../utils/calculateDashboardStats.js';

describe('calculateDashboardStats', () => {
    it('should count total saved jobs correctly', () => {
        const stats = calculateDashboardStats({
            savedJobs: [{ id: 1 }, { id: 2 }],
        });
        expect(stats.savedJobsCount).toBe(2);
    });

    it('should count total applications correctly', () => {
        const stats = calculateDashboardStats({
            applications: [1, 2, 3],
        });
        expect(stats.applicationsCount).toBe(3);
    });

    it('should count unread notifications correctly', () => {
        const stats = calculateDashboardStats({
            notifications: [
                { read: false },
                { isRead: true },
                { read: false },
            ],
        });
        expect(stats.unreadNotificationsCount).toBe(2);
    });

    it('should count upcoming interviews correctly', () => {
        const stats = calculateDashboardStats({
            interviews: [
                { upcoming: true, status: 'Scheduled' },
                { cancelled: true },
            ],
        });
        expect(stats.upcomingInterviewsCount).toBe(1);
    });

    it('should return zero for empty input arrays', () => {
        const stats = calculateDashboardStats({});
        expect(stats.savedJobsCount).toBe(0);
        expect(stats.applicationsCount).toBe(0);
        expect(stats.unreadNotificationsCount).toBe(0);
        expect(stats.upcomingInterviewsCount).toBe(0);
    });

    it('should not crash on missing fields', () => {
        expect(() => calculateDashboardStats(null)).not.toThrow();
        const stats = calculateDashboardStats({ savedJobs: null });
        expect(stats.savedJobsCount).toBe(0);
    });
});
