// FILE: backend/__tests__/notification.test.js
// PURPOSE: Route tests for notification endpoints
// TYPE: Jest + Supertest (router-level)

import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

const ctrl = {
    getNotifications: jest.fn((req, res) => res.json([{ _id: 'n1' }])),
    markAllAsRead: jest.fn((req, res) => res.json({ success: true })),
    markAsRead: jest.fn((req, res) => res.json({ success: true, id: req.params.id })),
    getUnreadCount: jest.fn((req, res) => res.json({ unread: 2 })),
    deleteNotification: jest.fn((req, res) => res.json({ success: true }))
};

jest.unstable_mockModule('../controllers/notificationController.js', () => ctrl);

describe('notification routes', () => {
    let app;

    beforeAll(async () => {
        const { default: routes } = await import('../routes/notifications.js');
        app = express();
        app.use(express.json());
        app.use('/api/notifications', routes);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should list notifications', async () => {
        const res = await request(app).get('/api/notifications');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('should mark one notification as read', async () => {
        const res = await request(app).patch('/api/notifications/n1/read');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(ctrl.markAsRead).toHaveBeenCalled();
    });

    it('should delete notification', async () => {
        const res = await request(app).delete('/api/notifications/n1');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

