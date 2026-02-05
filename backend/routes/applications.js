import express from 'express';
import Application from '../models/Application.js';
import User from '../models/User.js';
import Job from '../models/Job.js';
import Profile from '../models/Profile.js';
import { requireKycApproved } from '../middleware/auth.js';

const router = express.Router();

// Get applications for a job (KYC-approved recruiters only)
router.get('/job/:jobId', requireKycApproved, async (req, res) => {
    const { jobId } = req.params;
    const recruiterId = req.user.id;

    try {
        // First verify this job belongs to the recruiter
        const job = await Job.findOne({ _id: jobId, recruiter_id: recruiterId });
        if (!job) return res.status(403).json({ message: 'Unauthorized access to this job' });

        const applications = await Application.find({ job_id: jobId })
            .populate('seeker_id', 'fullName email')
            .sort({ createdAt: -1 })
            .lean();

        // For each application, use the snapshot data
        for (let app of applications) {
            // If it's a generated resume, recruiter will view the snapshot
            // If it's external, recruiter uses the resumeUrl snapshot
            app.is_generated = app.resumeType === 'Generated';
            app.display_resume_url = app.resumeUrl;
        }

        res.json(applications);
    } catch (error) {
        console.error("Fetch applications error:", error);
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
        application.rescheduleRequest.status = 'approved';

        application.interviewHistory.push({
            action: 'Rescheduled',
            details: updatedInterview,
            reason: `Approved candidate reschedule request: ${application.rescheduleRequest.reason}`,
            timestamp: new Date()
        });

        await application.save();
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

        application.rescheduleRequest.status = 'rejected';

        application.interviewHistory.push({
            action: 'Reschedule Rejected',
            reason: feedback || 'Recruiter declined the reschedule request',
            timestamp: new Date()
        });

        await application.save();
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
            status: 'Interview Scheduled',
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
// Apply for a job
router.post('/apply', async (req, res) => {
    const { job_id, coverLetter } = req.body;
    const seekerId = req.user?.id;
    const role = req.user?.role;

    if (!seekerId) return res.status(401).json({ message: 'Unauthorized' });
    if (role !== 'jobseeker') return res.status(403).json({ message: 'Only jobseekers can apply' });
    if (!job_id) return res.status(400).json({ message: 'Job ID is required' });

    try {
        // 1. Fetch User details
        const user = await User.findById(seekerId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // 2. Comprehensive Validation with Specific Error Codes/Messages

        // KYC Check
        if (user.kycStatus !== 'approved') {
            return res.status(403).json({
                code: 'KYC_REQUIRED',
                message: 'Your KYC verification is pending or missing. Please verify your identity to apply.'
            });
        }

        // Resume Check
        const hasResume = (user.resume && user.resume.fileUrl) || user.resume_url;
        if (!hasResume) {
            return res.status(400).json({
                code: 'RESUME_REQUIRED',
                message: 'You need to upload a resume to apply.'
            });
        }

        // Skills Check (Backend logic for >5 skills as per request, though some might have different rules, sticking to prompt)
        const skillsCount = user.skills ? (Array.isArray(user.skills) ? user.skills.length : user.skills.split(',').length) : 0;
        if (skillsCount < 5) {
            return res.status(400).json({
                code: 'SKILLS_REQUIRED',
                message: 'Please add at least 5 core skills to your profile to improve matching.'
            });
        }

        // Profile Strength Check
        if (!user.profileStrength || user.profileStrength < 70) {
            return res.status(400).json({
                code: 'PROFILE_WEAK',
                message: 'Your profile strength is too low. Complete at least 70% of your profile to apply.'
            });
        }

        // 3. Prevent Duplicate Applications
        const existing = await Application.findOne({ job_id, seeker_id: seekerId });
        if (existing) {
            return res.status(400).json({
                code: 'DUPLICATE_APPLICATION',
                message: 'You have already applied for this position.'
            });
        }

        // 4. Fetch Job to ensure existence and get details
        const job = await Job.findById(job_id);
        if (!job) return res.status(404).json({ message: 'Job unavailable' });

        // 5. Create Application
        const application = new Application({
            job_id,
            seeker_id: seekerId,
            status: 'Applied',
            personalInfo: {
                fullName: user.fullName,
                email: user.email,
                phone: user.phoneNumber,
            },
            coverLetter: coverLetter || `I am writing to express my interest in the ${job.title} position at ${job.company_name}. Please find my resume attached.`,
            resumeType: 'External',
            resumeUrl: user.resume?.fileUrl || user.resume_url,
            appliedAt: new Date()
        });

        await application.save();

        // Increment applicant count (optional but good practice)
        // await Job.findByIdAndUpdate(job_id, { $inc: { applicants_count: 1 } });

        res.status(201).json({ success: true, message: 'Application submitted successfully' });

    } catch (error) {
        console.error("Application error:", error);
        res.status(500).json({ message: 'Server error processing application' });
    }
});

// Update application status (KYC-approved recruiters only)
router.put('/:id/status', requireKycApproved, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    // Validate against model enum
    const validStatuses = ['Applied', 'Under Review', 'Interview Scheduled', 'Interview Canceled', 'Offer Extended', 'Rejected'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
    }

    try {
        // Ownership verification
        const recruiterId = req.user.id;
        const application = await Application.findById(id).populate('job_id');
        if (!application) return res.status(404).json({ message: 'Application not found' });

        if (!application.job_id || application.job_id.recruiter_id.toString() !== recruiterId) {
            return res.status(403).json({ message: 'Unauthorized: You do not own the job for this application' });
        }

        application.status = status;
        await application.save();
        res.json({ success: true, message: 'Status updated', application });
    } catch (error) {
        console.error("Update status error:", error);
        res.status(500).json({ message: 'Error updating status' });
    }
});

// Schedule Interview
router.put('/:id/schedule-interview', requireKycApproved, async (req, res) => {
    const { id } = req.params;
    const { date, time, mode, location, meetLink, duration, interviewer, notes } = req.body;

    try {
        const recruiterId = req.user.id;
        const application = await Application.findById(id).populate('job_id');
        if (!application) return res.status(404).json({ message: 'Application not found' });

        if (!application.job_id || application.job_id.recruiter_id.toString() !== recruiterId) {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        const interviewData = {
            date, time, mode, location, meetLink, duration, interviewer, notes,
            scheduledAt: new Date()
        };

        application.interview = interviewData;
        application.status = 'Interview Scheduled';
        application.interviewHistory.push({
            action: 'Scheduled',
            details: interviewData,
            timestamp: new Date()
        });

        await application.save();
        res.json({ success: true, message: 'Interview scheduled', application });
    } catch (error) {
        console.error("Schedule interview error:", error);
        res.status(500).json({ message: 'Error scheduling interview' });
    }
});

// Update/Reschedule Interview
router.put('/:id/reschedule-interview', requireKycApproved, async (req, res) => {
    const { id } = req.params;
    const { date, time, mode, location, meetLink, duration, interviewer, notes } = req.body;

    try {
        const recruiterId = req.user.id;
        const application = await Application.findById(id).populate('job_id');
        if (!application) return res.status(404).json({ message: 'Application not found' });

        if (!application.job_id || application.job_id.recruiter_id.toString() !== recruiterId) {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        if (new Date(date) < new Date().setHours(0, 0, 0, 0)) {
            return res.status(400).json({ message: 'Interview cannot be scheduled in the past' });
        }

        const oldInterview = application.interview;
        const updatedInterview = {
            date, time, mode, location, meetLink, duration, interviewer, notes,
            scheduledAt: application.interview?.scheduledAt || new Date()
        };

        application.interview = updatedInterview;
        application.rescheduledAt = new Date();
        application.interviewHistory.push({
            action: 'Rescheduled',
            details: updatedInterview,
            reason: 'Recruiter requested reschedule',
            timestamp: new Date()
        });

        await application.save();
        res.json({ success: true, message: 'Interview rescheduled', application });
    } catch (error) {
        console.error("Reschedule interview error:", error);
        res.status(500).json({ message: 'Error rescheduling interview' });
    }
});

// Cancel Interview
router.delete('/:id/cancel-interview', requireKycApproved, async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body; // Reason should be provided in body

    try {
        const recruiterId = req.user.id;
        const application = await Application.findById(id).populate('job_id');
        if (!application) return res.status(404).json({ message: 'Application not found' });

        if (!application.job_id || application.job_id.recruiter_id.toString() !== recruiterId) {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        const canceledDetails = application.interview;
        application.interview = undefined;
        application.status = 'Interview Canceled';
        application.canceledAt = new Date();
        application.cancelReason = reason || 'No reason provided';

        application.interviewHistory.push({
            action: 'Canceled',
            details: canceledDetails,
            reason: application.cancelReason,
            timestamp: new Date()
        });

        await application.save();
        res.json({ success: true, message: 'Interview canceled', application });
    } catch (error) {
        console.error("Cancel interview error:", error);
        res.status(500).json({ message: 'Error canceling interview' });
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
        const application = await Application.findById(id);
        if (!application) return res.status(404).json({ message: 'Application not found' });

        if (application.seeker_id.toString() !== seekerId) {
            return res.status(403).json({ message: 'Unauthorized access to this application' });
        }

        application.rescheduleRequest = {
            reason,
            preferredDate,
            preferredTime,
            status: 'pending',
            requestedBy: 'jobseeker',
            requestedAt: new Date()
        };

        await application.save();
        res.json({ success: true, message: 'Reschedule request submitted', application });
    } catch (error) {
        console.error("Request reschedule error:", error);
        res.status(500).json({ message: 'Error submitting reschedule request' });
    }
});

export default router;
