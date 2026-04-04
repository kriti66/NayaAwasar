import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
    requestReschedule,
    acceptReschedule,
    rejectReschedule,
    counterReschedule,
    cancelRescheduleRequest
} from '../controllers/interviewRescheduleController.js';

const router = express.Router();

router.post('/:interviewId/request', requireAuth, requestReschedule);
router.post('/:interviewId/accept', requireAuth, acceptReschedule);
router.post('/:interviewId/reject', requireAuth, rejectReschedule);
router.post('/:interviewId/counter', requireAuth, counterReschedule);
router.post('/:interviewId/cancel-request', requireAuth, cancelRescheduleRequest);

export default router;
