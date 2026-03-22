import express from 'express';
import {
    getNotifications,
    markAllAsRead,
    markAsRead,
    getUnreadCount,
    deleteNotification
} from '../controllers/notificationController.js';

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get user's notifications
// @access  Private
router.get('/', getNotifications);

// @route   GET /api/notifications/unread-count
// @desc    Get unread count
// @access  Private
router.get('/unread-count', getUnreadCount);

// @route   PUT/PATCH /api/notifications/read-all
router.put('/read-all', markAllAsRead);
router.patch('/read-all', markAllAsRead);

// @route   PUT/PATCH /api/notifications/:id/read
router.put('/:id/read', markAsRead);
router.patch('/:id/read', markAsRead);

// @route   DELETE /api/notifications/:id
// @desc    Delete a notification
// @access  Private
router.delete('/:id', deleteNotification);

export default router;
