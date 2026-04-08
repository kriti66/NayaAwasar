import express from 'express';
import {
    getZegoToken,
    getRecruiterInterviewCalendar,
    getSeekerInterviewCalendar,
    acceptInterviewBySeeker,
    requestInterviewReschedule,
    acceptInterviewReschedule,
    completeInterview,
    cancelInterview,
    recordInterviewCallEvent
} from '../controllers/interviewController.js';
import { requireAuth, requireRole, requireRecruiter } from '../middleware/auth.js';

const router = express.Router();

const seekerOnly = requireRole('jobseeker', 'job_seeker');

router.get('/calendar/recruiter', requireAuth, requireRecruiter, getRecruiterInterviewCalendar);
router.get('/calendar/seeker', requireAuth, seekerOnly, getSeekerInterviewCalendar);

router.patch('/:id/accept', requireAuth, seekerOnly, acceptInterviewBySeeker);
router.patch('/:id/request-reschedule', requireAuth, requestInterviewReschedule);
router.patch('/:id/accept-reschedule', requireAuth, acceptInterviewReschedule);
router.patch('/:id/complete', requireAuth, requireRecruiter, completeInterview);
router.patch('/:id/cancel', requireAuth, cancelInterview);
router.post('/:id/call-event', requireAuth, recordInterviewCallEvent);

router.post('/:id/zego-token', requireAuth, getZegoToken);

export default router;
