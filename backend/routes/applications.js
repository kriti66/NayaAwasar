import express from 'express';
import Application from '../models/Application.js';
import User from '../models/User.js';
import Job from '../models/Job.js';
import Profile from '../models/Profile.js';
import { requireAuth, requireKycApproved, requireKycVerified, requireRole } from '../middleware/auth.js';
import { logUserActivity } from '../utils/userActivityLogger.js';
import { logActivity } from '../utils/activityLogger.js';


const router = express.Router();

// Get applications for a job (KYC-approved recruiters only)
router.get('/job/:jobId', requireKycApproved, requireRole('recruiter', 'admin'), async (req, res) => {
    const { jobId } = req.params;
    const recruiterId = req.user.id;

    console.log(`[GET /job/:jobId] Fetching applications for jobId: ${jobId}, recruiterId: ${recruiterId}`);

    try {
        // First verify this job belongs to the recruiter
        const job = await Job.findOne({ _id: jobId, recruiter_id: recruiterId });
        console.log(`[GET /job/:jobId] Job found:`, job ? `Yes (${job.title})` : 'No');

        if (!job) {
            console.warn(`[GET /job/:jobId] Job ${jobId} not found or doesn't belong to recruiter ${recruiterId}`);
            return res.status(403).json({ message: 'Unauthorized access to this job' });
        }

        const applications = await Application.find({ job_id: jobId })
            .populate('seeker_id', 'fullName email')
            .sort({ createdAt: -1 })
            .lean();

        console.log(`[GET /job/:jobId] Found ${applications.length} applications for job ${jobId}`);

        // For each application, use the snapshot data
        for (let app of applications) {
            // If it's a generated resume, recruiter will view the snapshot
            // If it's external, recruiter uses the resumeUrl snapshot
            app.is_generated = app.resumeType === 'Generated';
            app.display_resume_url = app.resumeUrl;
        }

        res.json(applications);
    } catch (error) {
        console.error("[GET /job/:jobId] Fetch applications error:", error);
        res.status(500).json({ message: 'Error fetching applications' });
    }
});

// Approve Reschedule Request (Recruiter only)
router.put('/:id/approve-reschedule-request', requireKycApproved, async (req, res) => {
    const { id } = req.params;
    const { date, time, mode, location, meetLink, duration, interviewer, notes } = req.body;
    const recruiterId = req.user.id;

    try {
        const application = await Application.findById(id).populate('job_id');
        if (!application) return res.status(404).json({ message: 'Application not found' });

        if (!application.job_id || application.job_id.recruiter_id.toString() !== recruiterId) {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        const updatedInterview = {
            date, time, mode, location, meetLink, duration, interviewer, notes,
            scheduledAt: application.interview?.scheduledAt || new Date()
        };

        application.interview = updatedInterview;
        application.rescheduledAt = new Date();

        // Update reschedule status
        application.reschedule.requested = false;
        application.reschedule.reviewed = true;

        application.status = 'interview'; // Ensure status is set to interview

        application.interviewHistory.push({
            action: 'Rescheduled',
            details: updatedInterview,
            reason: `Approved candidate reschedule request: ${application.reschedule.reason}`,
            timestamp: new Date()
        });

        await application.save();

        // Notifications & Logging
        const { createNotification } = await import('../controllers/notificationController.js');
        await createNotification({
            recipient: application.seeker_id,
            type: 'application_update',
            title: 'Reschedule Approved',
            message: `Your interview reschedule request for ${application.job_id.title} has been APPROVED. New time: ${date} at ${time}.`,
            link: '/seeker/interviews',
            sender: recruiterId
        });

        await logActivity(
            recruiterId,
            'recruiter',
            'RESCHEDULE_APPROVED',
            `Approved reschedule request for ${application.job_id.title}`,
            'Application',
            application._id
        );

        res.json({ success: true, message: 'Reschedule request approved and interview updated', application });
    } catch (error) {
        console.error("Approve reschedule error:", error);
        res.status(500).json({ message: 'Error approving reschedule request' });
    }
});

// Reject Reschedule Request (Recruiter only)
router.put('/:id/reject-reschedule-request', requireKycApproved, async (req, res) => {
    const { id } = req.params;
    const { feedback } = req.body;
    const recruiterId = req.user.id;

    try {
        const application = await Application.findById(id).populate('job_id');
        if (!application) return res.status(404).json({ message: 'Application not found' });

        if (!application.job_id || application.job_id.recruiter_id.toString() !== recruiterId) {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        // Update reschedule status
        application.reschedule.requested = false;
        application.reschedule.reviewed = true;

        application.interviewHistory.push({
            action: 'Reschedule Rejected',
            reason: feedback || 'Recruiter declined the reschedule request',
            timestamp: new Date()
        });

        await application.save();

        // Notifications & Logging
        const { createNotification } = await import('../controllers/notificationController.js');
        await createNotification({
            recipient: application.seeker_id,
            type: 'application_update',
            title: 'Reschedule Rejected',
            message: `Your interview reschedule request for ${application.job_id.title} was declined. The original schedule stands unless communicated otherwise.`,
            link: '/seeker/interviews',
            sender: recruiterId
        });

        await logActivity(
            recruiterId,
            'recruiter',
            'RESCHEDULE_REJECTED',
            `Rejected reschedule request for ${application.job_id.title}`,
            'Application',
            application._id
        );

        res.json({ success: true, message: 'Reschedule request rejected', application });
    } catch (error) {
        console.error("Reject reschedule error:", error);
        res.status(500).json({ message: 'Error rejecting reschedule request' });
    }
});

// Get upcoming interviews for the logged-in jobseeker
router.get('/my-interviews', async (req, res) => {
    const seekerId = req.user?.id;
    const role = req.user?.role;

    if (role !== 'jobseeker') {
        return res.status(403).json({ message: 'Only jobseekers can access their interviews' });
    }

    try {
        const interviews = await Application.find({
            seeker_id: seekerId,
            status: 'interview',
            'interview.date': { $gte: new Date().setHours(0, 0, 0, 0) }
        }).populate('job_id', 'title company_name location');

        res.json(interviews);
    } catch (error) {
        console.error("Fetch my interviews error:", error);
        res.status(500).json({ message: 'Error fetching interviews' });
    }
});

// Get my applications (Seeker view)
router.get('/my', async (req, res) => {
    const seekerId = req.user?.id;

    if (!seekerId) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const applications = await Application.find({ seeker_id: seekerId })
            .populate('job_id', 'title company_name location');
        res.json(applications);
    } catch (error) {
        console.error("Fetch my applications error:", error);
        res.status(500).json({ message: 'Error fetching applications' });
    }
});

// Apply for a job (KYC-approved seekers only; backend blocks if not approved)
import multer from 'multer';
import path from 'path';
import fs from 'fs';

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

// Apply for a job (KYC-approved seekers only)
router.post('/apply', requireKycVerified, upload.single('resume'), async (req, res) => {
    const { job_id, coverLetter, resumeType } = req.body;
    const seekerId = req.user?.id;
    const role = req.user?.role;

    if (!seekerId) return res.status(401).json({ message: 'Unauthorized' });
    if (role !== 'jobseeker') return res.status(403).json({ message: 'Only jobseekers can apply' });
    if (!job_id) return res.status(400).json({ message: 'Job ID is required' });
    if (!coverLetter || coverLetter.trim().length < 50) {
        return res.status(400).json({ message: 'Cover letter is required and must be at least 50 characters.' });
    }

    try {
        // 1. Fetch User and Profile details
        const user = await User.findById(seekerId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const profile = await Profile.findOne({ userId: seekerId });

        // 2. Determine Resume URL based on resumeType
        let finalResumeUrl = '';
        let finalResumeType = resumeType || 'External'; // Default to External if not specified

        if (finalResumeType === 'Generated') {
            // Check if profile has a generated resume
            if (profile?.resume?.source === 'generated' && profile?.resume?.fileUrl) {
                finalResumeUrl = profile.resume.fileUrl;
            } else {
                return res.status(400).json({
                    message: 'No generated resume found on your profile. Please generate one first.'
                });
            }
        } else if (finalResumeType === 'Uploaded' || finalResumeType === 'External') {
            // Check for uploaded file in this request
            if (req.file) {
                finalResumeUrl = `/uploads/applications/${req.file.filename}`;
            } else if (user.resume?.fileUrl) {
                // Fallback to existing profile resume if no new file uploaded
                finalResumeUrl = user.resume.fileUrl;
            } else if (profile?.resume?.fileUrl) {
                finalResumeUrl = profile.resume.fileUrl;
            } else {
                return res.status(400).json({
                    message: 'Please upload a resume file.'
                });
            }
        } else {
            return res.status(400).json({ message: 'Invalid resume type selected.' });
        }

        // 3. Fetch Job to ensure existence and status
        const job = await Job.findById(job_id);
        if (!job) return res.status(404).json({ message: 'Job unavailable' });

        if (job.status !== 'Active') {
            return res.status(400).json({ message: 'This job is no longer active and cannot be applied to.' });
        }

        // 4. Check for Existing Application & Handle Re-application
        let application = await Application.findOne({ job_id, seeker_id: seekerId });

        if (application) {
            if (application.status === 'withdrawn') {
                // ALLOW RE-APPLICATION
                application.status = 'applied';
                application.appliedAt = new Date();
                application.coverLetter = coverLetter || application.coverLetter;
                application.resumeType = finalResumeType;
                application.resumeUrl = finalResumeUrl;
                application.personalInfo = {
                    fullName: user.fullName,
                    email: user.email,
                    phone: user.phoneNumber || profile?.phoneNumber,
                    address: user.location || profile?.location
                };
                // Reset rejection/cancellation reasons and interview data
                application.cancelReason = null;
                // RE-READING SCHEMA:
                // rescheduleRequest: {
                //     status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
                // }

                // If I set `application.rescheduleRequest = undefined`, Mongoose might re-initialize with defaults.
                // The cleanest way is to set status to 'rejected' or 'approved' (but that implies action).
                // Or maybe the frontend should check `if (status === 'interview' && rescheduleRequest.status === 'pending')`.

                // For now, let's force it to 'rejected' (as in "previous request invalid") so it hides.
                // OR we can perform a $unset operation? No, we are in a save() flow.

                // Reset reschedule object to default state (requested: false)
                application.reschedule = {
                    requested: false,
                    reason: '',
                    preferredDate: null,
                    preferredTime: null,
                    reviewed: false
                };

                application.interview = {
                    date: null,
                    time: null,
                    mode: null,
                    location: null,
                    meetLink: null,
                    duration: null,
                    interviewer: null,
                    notes: null,
                    scheduledAt: null
                };

                await application.save();

                // Log Activity
                if (logUserActivity) {
                    await logUserActivity(seekerId, 'REAPPLIED_JOB', {
                        jobId: job_id,
                        jobTitle: job.title
                    });
                }

                // Construct success response for re-application
                return res.status(200).json({
                    success: true,
                    message: 'Application successfully resubmitted',
                    applicationId: application._id,
                    reapplied: true
                });

            } else if (application.status === 'rejected') {
                // BLOCK RE-APPLICATION
                return res.status(403).json({
                    code: 'APPLICATION_REJECTED',
                    message: 'Your previous application for this position was not selected. You cannot re-apply at this time.'
                });
            } else {
                // BLOCK DUPLICATE
                return res.status(409).json({
                    code: 'DUPLICATE_APPLICATION',
                    message: `You have already applied for this job. Current status: ${application.status.replace('_', ' ')}`
                });
            }
        }

        // 5. Create New Application
        application = new Application({
            job_id,
            seeker_id: seekerId,
            status: 'applied',
            personalInfo: {
                fullName: user.fullName,
                email: user.email,
                phone: user.phoneNumber || profile?.phoneNumber, // Autofill
                address: user.location || profile?.location
            },
            coverLetter: coverLetter || `I am writing to express my interest in the ${job.title} position at ${job.company_name}.`,
            resumeType: finalResumeType === 'Generated' ? 'Generated' : 'External',
            resumeUrl: finalResumeUrl,
            appliedAt: new Date()
        });

        await application.save();

        // LOG ACTIVITY
        if (logUserActivity) {
            await logUserActivity(seekerId, 'APPLIED_JOB', {
                jobId: job_id,
                jobTitle: job.title
            });
        }

        // Log system activity
        await logActivity(seekerId, role, 'JOB_APPLICATION', `Applied for job '${job.title}' at ${job.company_name}.`, 'Application', application._id);

        // Create notification for recruiter
        const { createNotification } = await import('../controllers/notificationController.js');
        await createNotification({
            recipient: job.recruiter_id,
            type: 'application_update',
            title: 'New Application',
            message: `New application received for ${job.title} from ${user.fullName}`,
            link: `/recruiter/jobs/${job_id}/applications`,
            sender: seekerId
        });

        res.status(201).json({ success: true, message: 'Application submitted successfully', applicationId: application._id });

    } catch (error) {
        console.error("Application error:", error);
        res.status(500).json({ message: 'Server error processing application' });
    }
});


// ========================
// CENTRALIZED ATS PIPELINE
// ========================

/**
 * 1) Advance Application (Recruiter only)
 * Moves application to the next step in the pipeline.
 * applied → in_review → interview → offered → hired
 */
router.patch('/:id/advance', requireKycApproved, requireRole('recruiter', 'admin'), async (req, res) => {
    const { id } = req.params;
    const recruiterId = req.user.id;

    try {
        const application = await Application.findById(id).populate('job_id');
        if (!application) return res.status(404).json({ message: 'Application not found' });

        // Authorization: Recruiter must own the job
        if (application.job_id.recruiter_id.toString() !== recruiterId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        const currentStatus = application.status;
        const pipeline = ['applied', 'in_review', 'interview', 'offered', 'hired'];
        const currentIndex = pipeline.indexOf(currentStatus);

        if (currentIndex === -1 || currentStatus === 'rejected' || currentStatus === 'withdrawn') {
            return res.status(400).json({ message: `Cannot advance from final state: ${currentStatus}` });
        }

        if (currentIndex === pipeline.length - 1) {
            return res.status(400).json({ message: 'Application is already at the final stage (hired).' });
        }

        const nextStatus = pipeline[currentIndex + 1];

        // Specific requirements for 'interview' stage
        if (nextStatus === 'interview') {
            const { date, time, mode, location, meetLink, notes } = req.body;
            if (!date || !time || !mode) {
                return res.status(400).json({
                    message: 'Date, time, and mode are required to advance to interview stage.'
                });
            }

            application.interview = { date, time, mode, location, meetLink, notes, scheduledAt: new Date() };
            application.interviewHistory.push({
                action: 'Scheduled',
                details: application.interview,
                timestamp: new Date()
            });
        }

        application.status = nextStatus;
        await application.save();

        console.log(`[ADVANCE] Application ${id} advanced from ${currentStatus} to ${nextStatus}`);
        console.log(`[ADVANCE] Interview details:`, application.interview);

        // Create notification for jobseeker
        if (nextStatus === 'interview') {
            const { createNotification } = await import('../controllers/notificationController.js');
            await createNotification({
                recipient: application.seeker_id,
                type: 'application_update',
                title: 'Interview Scheduled',
                message: `Your interview for ${application.job_id?.title || 'the position'} has been scheduled`,
                link: '/seeker/interviews',
                sender: recruiterId
            });
            console.log(`[ADVANCE] Notification sent to jobseeker ${application.seeker_id}`);
        }

        // Log activity
        await logActivity(recruiterId, 'recruiter', 'APPLICATION_ADVANCED', `Advanced application to ${nextStatus}`, 'Application', application._id);

        res.json({
            success: true,
            message: `Advanced to ${nextStatus}`,
            application
        });
    } catch (error) {
        console.error("[ADVANCE] Advance error:", error);
        res.status(500).json({ message: 'Error advancing application' });
    }
});

/**
 * 2) Reject Application (Recruiter only)
 * Marks application as rejected from any non-final stage.
 */
router.patch('/:id/reject', requireKycApproved, requireRole('recruiter', 'admin'), async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const recruiterId = req.user.id;

    try {
        const application = await Application.findById(id).populate('job_id');
        if (!application) return res.status(404).json({ message: 'Application not found' });

        if (application.job_id.recruiter_id.toString() !== recruiterId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        const finalStates = ['rejected', 'withdrawn', 'hired'];
        if (finalStates.includes(application.status)) {
            return res.status(400).json({ message: `Cannot reject an application that is already ${application.status}.` });
        }

        application.status = 'rejected';
        application.cancelReason = reason; // Store reason if provided
        await application.save();

        res.json({ success: true, message: 'Application rejected', application });
    } catch (error) {
        console.error("Reject error:", error);
        res.status(500).json({ message: 'Error rejecting application' });
    }
});

/**
 * 3) Withdraw Application (Jobseeker only)
 * Jobseekers can withdraw their own application before it reaches a final stage.
 */
router.patch('/:id/withdraw', async (req, res) => {
    const { id } = req.params;
    const seekerId = req.user?.id;
    const { reason } = req.body;

    if (req.user?.role !== 'jobseeker') {
        return res.status(403).json({ message: 'Only jobseekers can withdraw applications' });
    }

    try {
        const application = await Application.findById(id);
        if (!application) return res.status(404).json({ message: 'Application not found' });

        if (application.seeker_id.toString() !== seekerId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const finalStates = ['rejected', 'withdrawn', 'hired'];
        if (finalStates.includes(application.status)) {
            return res.status(400).json({ message: `Cannot withdraw an application that is already ${application.status}.` });
        }

        // Optional: Block withdrawal after interview/offer
        if (['interview', 'offered'].includes(application.status)) {
            // We can allow it but maybe log/notify
        }

        application.status = 'withdrawn';
        application.cancelReason = reason || 'Withdrawn by candidate';

        // Cancel any pending reschedule request to hide banner
        if (application.reschedule && application.reschedule.requested) {
            application.reschedule.requested = false;
        }

        await application.save();

        res.json({ success: true, message: 'Application withdrawn successfully', application });
    } catch (error) {
        console.error("Withdraw error:", error);
        res.status(500).json({ message: 'Error withdrawing application' });
    }
});

/**
 * 4) Accept Offer (Jobseeker only)
 * Jobseeker accepts the job offer, moving status from 'offered' to 'hired'.
 */
router.patch('/:id/accept-offer', requireAuth, async (req, res) => {
    const { id } = req.params;
    const seekerId = req.user?.id;

    if (req.user?.role !== 'jobseeker') {
        return res.status(403).json({ message: 'Only jobseekers can accept offers' });
    }

    try {
        const application = await Application.findById(id).populate('job_id');
        if (!application) return res.status(404).json({ message: 'Application not found' });

        if (application.seeker_id.toString() !== seekerId) {
            return res.status(403).json({ message: 'Unauthorized access to this application' });
        }

        if (application.status !== 'offered') {
            return res.status(400).json({ message: 'Can only accept applications in "offered" status' });
        }

        application.status = 'hired';
        await application.save();

        // Log activity
        await logActivity(seekerId, 'jobseeker', 'OFFER_ACCEPTED', `Accepted job offer for '${application.job_id?.title || 'position'}'.`, 'Application', application._id);

        // Create notification for recruiter
        const { createNotification } = await import('../controllers/notificationController.js');
        await createNotification({
            recipient: application.job_id.recruiter_id,
            type: 'offer',
            title: 'Offer Accepted',
            message: `${req.user.fullName || 'A candidate'} accepted the offer for ${application.job_id?.title || 'your job posting'}`,
            link: `/recruiter/jobs/${application.job_id._id}/applications`,
            sender: seekerId
        });

        res.json({ success: true, message: 'Offer accepted successfully! Welcome aboard.', application });
    } catch (error) {
        console.error("Accept offer error:", error);
        res.status(500).json({ message: 'Error accepting offer' });
    }
});

// Update Application Status (Flexible - Recruiter only)
router.patch('/:id/status', requireKycApproved, requireRole('recruiter', 'admin'), async (req, res) => {
    const { id } = req.params;
    const { status, interviewDetails, notes } = req.body;
    const recruiterId = req.user.id;

    const validStatuses = ['applied', 'in_review', 'interview', 'offered', 'hired', 'rejected', 'withdrawn'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
    }

    try {
        const application = await Application.findById(id).populate('job_id');
        if (!application) return res.status(404).json({ message: 'Application not found' });

        // Authorization check
        if (application.job_id.recruiter_id.toString() !== recruiterId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized access to this application' });
        }

        const previousStatus = application.status;

        // Specific logic for 'interview' status
        if (status === 'interview') {
            if (!interviewDetails) {
                // If moving to interview but no details provided, check if existing details exist, otherwise error?
                // For flexibility, we might allow it, but better to enforce details if coming from UI modal.
                // However, user might just be correcting status. Let's validate if details are passed.
            }

            if (interviewDetails) {
                const { date, time, mode, location, meetLink, notes: interviewNotes } = interviewDetails;
                application.interview = {
                    date, time, mode, location, meetLink,
                    notes: interviewNotes,
                    scheduledAt: new Date()
                };

                // Add to history
                application.interviewHistory.push({
                    action: 'Scheduled',
                    details: application.interview,
                    timestamp: new Date()
                });
            }
        }

        // Update status
        application.status = status;

        // Handle rejection reason if provided
        if (status === 'rejected' && notes) {
            application.cancelReason = notes;
        }

        await application.save();

        // Notifications & Logging
        if (status !== previousStatus) {
            const { createNotification } = await import('../controllers/notificationController.js');

            let notifMessage = `Your application status for ${application.job_id.title} has been updated to ${status.replace('_', ' ')}.`;
            let notifTitle = 'Application Status Update';
            let notifLink = '/seeker/applications';

            if (status === 'interview') {
                notifMessage = `GREAT NEWS! You have an interview scheduled for ${application.job_id.title}. Check details in dashboard.`;
                notifTitle = 'Interview Scheduled';
                notifLink = '/seeker/interviews';
            }
            if (status === 'offered') {
                notifMessage = `CONGRATULATIONS! You have received an offer for ${application.job_id.title}.`;
                notifTitle = 'Job Offer Received';
            }

            await createNotification({
                recipient: application.seeker_id,
                type: status === 'offered' ? 'offer' : 'application_update',
                title: notifTitle,
                message: notifMessage,
                link: notifLink,
                sender: recruiterId
            });

            await logActivity(
                recruiterId,
                'recruiter',
                'STATUS_CHANGE',
                `Changed application status to ${status}`,
                'Application',
                application._id
            );
        }

        res.json({ success: true, message: `Status updated to ${status}`, application });

    } catch (error) {
        console.error("Status update error:", error);
        res.status(500).json({ message: 'Error updating application status' });
    }
});

// Request Reschedule (Jobseeker only)
router.post('/:id/request-reschedule', async (req, res) => {
    const { id } = req.params;
    const { reason, preferredDate, preferredTime } = req.body;
    const seekerId = req.user?.id;
    const role = req.user?.role;

    if (role !== 'jobseeker') {
        return res.status(403).json({ message: 'Only jobseekers can request a reschedule' });
    }

    if (!reason) {
        return res.status(400).json({ message: 'Reason for reschedule is required' });
    }

    try {
        const application = await Application.findById(id).populate('job_id');
        if (!application) return res.status(404).json({ message: 'Application not found' });

        if (application.seeker_id.toString() !== seekerId) {
            return res.status(403).json({ message: 'Unauthorized access to this application' });
        }

        // Update reschedule object
        application.reschedule = {
            requested: true,
            reason: reason,
            preferredDate: preferredDate,
            preferredTime: preferredTime,
            reviewed: false
        };

        await application.save();

        // Notifications & Logging
        const { createNotification } = await import('../controllers/notificationController.js');
        await createNotification({
            recipient: application.job_id.recruiter_id,
            type: 'application_update',
            title: 'Reschedule Requested',
            message: `Candidate ${req.user.fullName || 'Jobseeker'} requested a reschedule for the interview.`,
            link: `/recruiter/jobs/${application.job_id._id}/applications`,
            sender: seekerId
        });

        await logActivity(
            seekerId,
            'jobseeker',
            'RESCHEDULE_REQUESTED',
            `Requested reschedule for interview at ${application.job_id.title}`,
            'Application',
            application._id
        );

        res.json({ success: true, message: 'Reschedule request submitted', application });
    } catch (error) {
        console.error("Request reschedule error:", error);
        res.status(500).json({ message: 'Error submitting reschedule request' });
    }
});

export default router;
