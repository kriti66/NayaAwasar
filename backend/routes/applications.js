import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth, requireKycApproved, requireKycVerified, requireRole } from '../middleware/auth.js';
import * as applicationController from '../controllers/NewApplicationController.js';

const router = express.Router();

// Multer Config for Application Resumes
const uploadDir = 'uploads/applications';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'app-resume-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, DOC, DOCX allowed.'));
        }
    }
});

// JOBSEEKER ROUTES
router.get('/my', requireAuth, applicationController.getMyApplications);
router.get('/my-interviews', requireAuth, applicationController.getMyInterviews);
router.get('/:id/interview-detail', requireAuth, applicationController.getInterviewApplicationDetail);
router.patch('/:id/mark-interview-joined', requireAuth, applicationController.markInterviewJoined);
router.patch('/:id/cancel-reschedule-request', requireAuth, applicationController.cancelJobseekerRescheduleRequest);
router.patch(
    '/:id/interview-result',
    requireKycApproved,
    requireRole('recruiter', 'admin'),
    applicationController.updateInterviewResult
);
router.post('/apply', requireKycVerified, upload.single('resume'), applicationController.applyForJob);
router.patch('/:id/withdraw', requireAuth, applicationController.withdrawApplication);
router.patch('/:id/accept-offer', requireAuth, applicationController.acceptOffer);
router.post('/:id/request-reschedule', requireAuth, applicationController.requestReschedule);
router.put('/:id/recruiter-reschedule/accept', requireAuth, applicationController.acceptRecruiterReschedule);
router.put('/:id/recruiter-reschedule/reject', requireAuth, applicationController.rejectRecruiterReschedule);

// RECRUITER ROUTES
router.get('/job/:jobId', requireKycApproved, requireRole('recruiter', 'admin'), applicationController.getJobApplications);
router.patch('/:id/advance', requireKycApproved, requireRole('recruiter', 'admin'), applicationController.advanceApplication);
router.patch('/:id/reject', requireKycApproved, requireRole('recruiter', 'admin'), applicationController.rejectApplication);
router.patch('/:id/status', requireKycApproved, requireRole('recruiter', 'admin'), applicationController.updateApplicationStatus);
router.put('/:id/approve-reschedule-request', requireKycApproved, applicationController.approveReschedule);
router.put('/:id/reject-reschedule-request', requireKycApproved, applicationController.rejectReschedule);
router.put('/:id/recruiter-propose-reschedule', requireKycApproved, requireRole('recruiter', 'admin'), applicationController.proposeRecruiterReschedule);

export default router;
