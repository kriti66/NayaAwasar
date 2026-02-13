
import Application from '../models/Application.js';
import User from '../models/User.js';
import Job from '../models/Job.js';
import Profile from '../models/Profile.js';
import { createNotification } from './notificationController.js';
import { logUserActivity } from '../utils/userActivityLogger.js';
import { logActivity } from '../utils/activityLogger.js';
import Interview from '../models/Interview.js';

// Get applications for a job (Recruiter view)
export const getJobApplications = async (req, res) => {
    const { jobId } = req.params;
    const recruiterId = req.user.id;

    console.log(`[GET /job/${jobId}] Fetching applications for recruiter: ${recruiterId}`);

    try {
        // Verify job ownership
        const job = await Job.findOne({ _id: jobId, recruiter_id: recruiterId });
        if (!job) {
            return res.status(403).json({ message: 'Unauthorized access to this job' });
        }

        const applications = await Application.find({ job_id: jobId })
            .populate('seeker_id', 'fullName email location phoneNumber profileImage')
            .sort({ createdAt: -1 })
            .lean();

        // Getting all seeker IDs for bulk fetching profiles
        const seekerIds = applications
            .filter(app => app.seeker_id)
            .map(app => app.seeker_id._id);

        const profiles = await Profile.find({ userId: { $in: seekerIds } }).lean();
        const profileMap = profiles.reduce((acc, profile) => {
            acc[profile.userId.toString()] = profile;
            return acc;
        }, {});

        // Enhance application object with resume info for frontend display
        applications.forEach(app => {
            app.is_generated = app.resumeType === 'Generated';
            app.display_resume_url = app.resumeUrl;

            // Ensure personalInfo exists and has address
            if (!app.personalInfo) {
                app.personalInfo = {};
            }

            // Fallback Logic for Location/Address
            // Order: Application Snapshot -> Applicant Location -> User Profile -> Job Seeker Profile (Main) -> Job Seeker Profile (Pref) -> Default
            if (!app.personalInfo.address) {
                if (app.applicantLocation) {
                    app.personalInfo.address = app.applicantLocation;
                } else if (app.seeker_id?.location) {
                    app.personalInfo.address = app.seeker_id.location;
                } else if (app.seeker_id?._id && profileMap[app.seeker_id._id.toString()]?.location) {
                    app.personalInfo.address = profileMap[app.seeker_id._id.toString()].location;
                } else if (app.seeker_id?._id && profileMap[app.seeker_id._id.toString()]?.jobPreferences?.preferredLocation) {
                    app.personalInfo.address = profileMap[app.seeker_id._id.toString()].jobPreferences.preferredLocation;
                } else {
                    app.personalInfo.address = ''; // Ensure it's not undefined
                }
            }

            // Other Fallbacks
            if (!app.personalInfo.fullName && app.seeker_id?.fullName) {
                app.personalInfo.fullName = app.seeker_id.fullName;
            }
            if (!app.personalInfo.email && app.seeker_id?.email) {
                app.personalInfo.email = app.seeker_id.email;
            }
            if (!app.personalInfo.phone && app.seeker_id?.phoneNumber) {
                app.personalInfo.phone = app.seeker_id.phoneNumber;
            }
        });

        res.json(applications);
    } catch (error) {
        console.error("Fetch applications error:", error);
        res.status(500).json({ message: 'Error fetching applications' });
    }
};

// Get my applications (Seeker view)
export const getMyApplications = async (req, res) => {
    const seekerId = req.user.id;

    try {
        const applications = await Application.find({ seeker_id: seekerId })
            .populate('job_id', 'title company_name location')
            .sort({ updatedAt: -1 });
        res.json(applications);
    } catch (error) {
        console.error("Fetch my applications error:", error);
        res.status(500).json({ message: 'Error fetching applications' });
    }
};

// Apply for a job
export const applyForJob = async (req, res) => {
    const { job_id, coverLetter, resumeType } = req.body;
    const seekerId = req.user.id;
    const role = req.user.role;

    if (role !== 'jobseeker') {
        return res.status(403).json({ message: 'Only jobseekers can apply' });
    }

    if (!job_id) {
        return res.status(400).json({ message: 'Job ID is required' });
    }

    // Validate request body
    if (!coverLetter || coverLetter.trim().length < 50) {
        return res.status(400).json({ message: 'Cover letter is required and must be at least 50 characters.' });
    }

    try {
        // 1. Fetch User & Profile
        const user = await User.findById(seekerId);
        const profile = await Profile.findOne({ userId: seekerId });

        if (!user) return res.status(404).json({ message: 'User not found' });

        // 2. Determine Resume URL
        let finalResumeUrl = '';
        let finalResumeType = resumeType || 'External';

        if (finalResumeType === 'Generated') {
            if (profile?.resume?.source === 'generated' && profile?.resume?.fileUrl) {
                finalResumeUrl = profile.resume.fileUrl;
            } else {
                return res.status(400).json({ message: 'No generated resume found. Please generate one first.' });
            }
        } else { // External or Uploaded
            if (req.file) {
                finalResumeUrl = `/uploads/applications/${req.file.filename}`;
            } else if (user.resume?.fileUrl) {
                finalResumeUrl = user.resume.fileUrl;
            } else if (profile?.resume?.fileUrl) {
                finalResumeUrl = profile.resume.fileUrl;
            } else {
                return res.status(400).json({ message: 'Please upload a resume file.' });
            }
        }

        // 3. Fetch Job
        const job = await Job.findById(job_id);
        if (!job) return res.status(404).json({ message: 'Job not found' });
        if (job.status !== 'Active') {
            return res.status(400).json({ message: 'This job is no longer active.' });
        }

        // 4. Check for Existing Application
        let application = await Application.findOne({ job_id, seeker_id: seekerId });

        if (application) {
            // Scenario: Originally withdrawn -> Re-apply
            if (application.status === 'withdrawn') {
                application.status = 'applied';
                application.appliedAt = new Date();
                application.coverLetter = coverLetter || application.coverLetter;
                application.resumeType = finalResumeType;
                application.resumeUrl = finalResumeUrl;

                // Update Personal Info snapshot
                application.personalInfo = {
                    fullName: user.fullName,
                    email: user.email,
                    phone: user.phoneNumber || profile?.phoneNumber,
                    address: user.location || profile?.location
                };

                // Clear previous rejection/cancellation/reschedule data
                application.cancelReason = null;
                application.reschedule = {
                    requested: false,
                    reason: '',
                    preferredDate: null,
                    preferredTime: null,
                    reviewed: false
                };
                application.interview = undefined; // Clear old interview details
                /* application.interviewHistory = []; // Keep history for audit trail */

                await application.save();

                // Logs & Notification
                if (logUserActivity) {
                    await logUserActivity(seekerId, 'REAPPLIED_JOB', { jobId: job_id, jobTitle: job.title });
                }

                await createNotification({
                    recipient: job.recruiter_id,
                    type: 'application_update',
                    title: 'Application Re-activated',
                    message: `${user.fullName} has re-applied for ${job.title}`,
                    link: `/recruiter/jobs/${job_id}/applications`,
                    sender: seekerId
                });

                return res.status(200).json({
                    success: true,
                    message: 'Application successfully resubmitted',
                    applicationId: application._id,
                    reapplied: true
                });
            }

            // Scenario: Already applied or other status
            return res.status(409).json({
                code: 'DUPLICATE_APPLICATION',
                message: `You have already applied for this job. Current status: ${application.status.replace('_', ' ')}`
            });
        }

        // 5. Create New Application
        application = new Application({
            job_id,
            seeker_id: seekerId,
            status: 'applied',
            personalInfo: {
                fullName: user.fullName,
                email: user.email,
                phone: user.phoneNumber || profile?.phoneNumber,
                address: user.location || profile?.location
            },
            applicantLocation: user.location || profile?.location || '',
            applicantExperienceLevel: profile?.jobPreferences?.seniority || '',
            coverLetter: coverLetter || `I am writing to express my interest in the ${job.title} position at ${job.company_name}.`,
            resumeType: finalResumeType === 'Generated' ? 'Generated' : 'External',
            resumeUrl: finalResumeUrl,
            appliedAt: new Date()
        });

        await application.save();

        // Logging
        await logActivity(
            seekerId,
            'APPLIED_JOB',
            `You applied to ${job.title} at ${job.company_name}`,
            { jobId: job_id, jobTitle: job.title }
        );

        // Notification
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
        if (error.code === 11000) {
            return res.status(409).json({ message: 'You have already applied for this job.' });
        }
        res.status(500).json({ message: 'Server error processing application' });
    }
};

// Withdraw application
export const withdrawApplication = async (req, res) => {
    const { id } = req.params;
    const seekerId = req.user.id;
    const { reason } = req.body;

    if (req.user.role !== 'jobseeker') {
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

        application.status = 'withdrawn';
        application.cancelReason = reason || 'Withdrawn by candidate';

        if (application.reschedule && application.reschedule.requested) {
            application.reschedule.requested = false;
        }

        await application.save();

        res.json({ success: true, message: 'Application withdrawn successfully', application });
    } catch (error) {
        console.error("Withdraw error:", error);
        res.status(500).json({ message: 'Error withdrawing application' });
    }
};

// Advance Application Stage (Recruiter)
export const advanceApplication = async (req, res) => {
    const { id } = req.params;
    const recruiterId = req.user.id;

    try {
        const application = await Application.findById(id).populate('job_id');
        if (!application) return res.status(404).json({ message: 'Application not found' });

        if (application.job_id.recruiter_id.toString() !== recruiterId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        const currentStatus = application.status;
        const pipeline = ['applied', 'in-review', 'interview', 'offered', 'hired'];

        const mappedStatus = currentStatus === 'in_review' ? 'in-review' : currentStatus;
        const currentIndex = pipeline.indexOf(mappedStatus);

        if (currentIndex === -1 || mappedStatus === 'rejected' || mappedStatus === 'withdrawn') {
            return res.status(400).json({ message: `Cannot advance from final state: ${mappedStatus}` });
        }

        if (currentIndex === pipeline.length - 1) {
            return res.status(400).json({ message: 'Application is already at the final stage.' });
        }

        const nextStatus = pipeline[currentIndex + 1];

        if (nextStatus === 'interview') {
            const { date, time, mode, location, meetLink, notes } = req.body;
            if (!date || !time || !mode) {
                return res.status(400).json({ message: 'Date, time, and mode are required for interview.' });
            }

            const newInterview = await Interview.create({
                applicationId: application._id,
                jobId: application.job_id._id,
                recruiterId: recruiterId,
                seekerId: application.seeker_id,
                date,
                time,
                mode,
                meetingLink: meetLink,
                notes,
                status: 'Scheduled'
            });

            application.interview = { date, time, mode, location, meetLink, notes, scheduledAt: new Date(), interviewId: newInterview._id };
            application.interviewHistory.push({
                action: 'Scheduled',
                details: application.interview,
                timestamp: new Date()
            });
        }

        application.status = nextStatus;
        await application.save();

        if (nextStatus === 'interview') {
            await createNotification({
                recipient: application.seeker_id,
                type: 'application_update',
                title: 'Interview Scheduled',
                message: `Your interview for ${application.job_id?.title} has been scheduled`,
                link: '/seeker/interviews?focused=true&from=notifications',
                sender: recruiterId
            });
        }

        await logActivity(
            recruiterId,
            'STATUS_CHANGE',
            `Advanced application to ${nextStatus}`,
            { applicationId: application._id, status: nextStatus }
        );

        res.json({ success: true, message: `Advanced to ${nextStatus}`, application });
    } catch (error) {
        console.error("Advance error:", error);
        res.status(500).json({ message: 'Error advancing application' });
    }
};

// Reject Application
export const rejectApplication = async (req, res) => {
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
            return res.status(400).json({ message: `Cannot reject application in state: ${application.status}` });
        }

        application.status = 'rejected';
        application.cancelReason = reason;
        await application.save();

        res.json({ success: true, message: 'Application rejected', application });
    } catch (error) {
        console.error("Reject error:", error);
        res.status(500).json({ message: 'Error rejecting application' });
    }
};

// Update Status (Generic)
export const updateApplicationStatus = async (req, res) => {
    const { id } = req.params;
    const { status, interviewDetails, notes } = req.body;
    const recruiterId = req.user.id;

    const validStatuses = ['applied', 'in-review', 'interview', 'offered', 'hired', 'rejected', 'withdrawn'];

    let normalizedStatus = status;
    if (status === 'in_review') normalizedStatus = 'in-review';

    if (!validStatuses.includes(normalizedStatus)) {
        return res.status(400).json({ message: 'Invalid status value' });
    }

    try {
        const application = await Application.findById(id).populate('job_id');
        if (!application) return res.status(404).json({ message: 'Application not found' });

        if (application.job_id.recruiter_id.toString() !== recruiterId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        const previousStatus = application.status;

        if (normalizedStatus === 'interview' && interviewDetails) {
            const newInterview = await Interview.create({
                applicationId: application._id,
                jobId: application.job_id._id,
                recruiterId: recruiterId,
                seekerId: application.seeker_id,
                date: interviewDetails.date,
                time: interviewDetails.time,
                mode: interviewDetails.mode,
                meetingLink: interviewDetails.meetLink,
                notes: interviewDetails.notes,
                status: 'Scheduled'
            });

            application.interview = {
                ...interviewDetails,
                scheduledAt: new Date(),
                interviewId: newInterview._id
            };
            application.interviewHistory.push({
                action: 'Scheduled',
                details: application.interview,
                timestamp: new Date()
            });
        }

        application.status = normalizedStatus;
        if (normalizedStatus === 'rejected' && notes) application.cancelReason = notes;

        await application.save();

        if (normalizedStatus !== previousStatus) {
            let notifMessage = `Your application status for ${application.job_id.title} has been updated to ${normalizedStatus}.`;
            let notifTitle = 'Application Status Update';
            let notifLink = '/seeker/applications';

            if (normalizedStatus === 'interview') {
                notifMessage = `You have an interview scheduled for ${application.job_id.title}.`;
                notifLink = '/seeker/interviews?focused=true&from=notifications';
            } else if (normalizedStatus === 'offered') {
                notifMessage = `You have received an offer for ${application.job_id.title}.`;
            }

            await createNotification({
                recipient: application.seeker_id,
                type: normalizedStatus === 'offered' ? 'offer' : 'application_update',
                title: notifTitle,
                message: notifMessage,
                link: notifLink,
                sender: recruiterId
            });
        }

        res.json({ success: true, message: `Status updated to ${normalizedStatus}`, application });
    } catch (error) {
        console.error("Status update error:", error);
        res.status(500).json({ message: 'Error updating status' });
    }
};

// Accept Offer
export const acceptOffer = async (req, res) => {
    const { id } = req.params;
    const seekerId = req.user.id;

    if (req.user.role !== 'jobseeker') {
        return res.status(403).json({ message: 'Only jobseekers can accept offers' });
    }

    try {
        const application = await Application.findById(id).populate('job_id');
        if (!application) return res.status(404).json({ message: 'Application not found' });

        if (application.seeker_id.toString() !== seekerId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        if (application.status !== 'offered') {
            return res.status(400).json({ message: 'Application must be in "offered" state' });
        }

        application.status = 'hired';
        await application.save();

        await logActivity(
            seekerId,
            'STATUS_CHANGE',
            `Accepted offer for ${application.job_id.title}`,
            { applicationId: application._id, status: 'hired' }
        );

        await createNotification({
            recipient: application.job_id.recruiter_id,
            type: 'offer',
            title: 'Offer Accepted',
            message: `${req.user.fullName} accepted the offer for ${application.job_id.title}`,
            link: `/recruiter/jobs/${application.job_id._id}/applications`,
            sender: seekerId
        });

        res.json({ success: true, message: 'Offer accepted!', application });
    } catch (error) {
        console.error("Accept offer error:", error);
        res.status(500).json({ message: 'Error accepting offer' });
    }
};

// Get upcoming interviews
export const getMyInterviews = async (req, res) => {
    const seekerId = req.user.id;

    try {
        const interviews = await Application.find({
            seeker_id: seekerId,
            status: 'interview',
            'interview.date': { $gte: new Date().setHours(0, 0, 0, 0) }
        }).populate('job_id', 'title company_name location');

        res.json(interviews);
    } catch (error) {
        console.error("Fetch interviews error:", error);
        res.status(500).json({ message: 'Error fetching interviews' });
    }
};

// Request Reschedule
export const requestReschedule = async (req, res) => {
    const { id } = req.params;
    const { reason, preferredDate, preferredTime } = req.body;
    const seekerId = req.user.id;

    if (!reason) {
        return res.status(400).json({ message: 'Reason is required' });
    }

    try {
        const application = await Application.findById(id).populate('job_id');
        if (!application) return res.status(404).json({ message: 'Application not found' });

        if (application.seeker_id.toString() !== seekerId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        application.reschedule = {
            requested: true,
            reason: reason,
            preferredDate: preferredDate,
            preferredTime: preferredTime,
            reviewed: false
        };

        await application.save();

        await createNotification({
            recipient: application.job_id.recruiter_id,
            type: 'application_update',
            title: 'Reschedule Requested',
            message: `Reschedule requested for ${application.job_id.title}`,
            link: `/recruiter/jobs/${application.job_id._id}/applications`,
            sender: seekerId
        });

        res.json({ success: true, message: 'Reschedule requested' });
    } catch (error) {
        console.error("Reschedule request error:", error);
        res.status(500).json({ message: 'Error requesting reschedule' });
    }
};

// Approve Reschedule
export const approveReschedule = async (req, res) => {
    const { id } = req.params;
    const { date, time, mode, location, meetLink, duration, interviewer, notes } = req.body;
    const recruiterId = req.user.id;

    try {
        const application = await Application.findById(id).populate('job_id');
        if (!application) return res.status(404).json({ message: 'Application not found' });

        if (application.job_id.recruiter_id.toString() !== recruiterId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Update or create interview doc
        let interviewDoc;
        if (application.interview && application.interview.interviewId) {
            interviewDoc = await Interview.findById(application.interview.interviewId);
        }

        if (interviewDoc) {
            interviewDoc.date = date;
            interviewDoc.time = time;
            interviewDoc.mode = mode;
            interviewDoc.meetingLink = meetLink;
            interviewDoc.notes = notes;
            interviewDoc.status = 'Scheduled';
            await interviewDoc.save();
        } else {
            interviewDoc = await Interview.create({
                applicationId: application._id,
                jobId: application.job_id._id,
                recruiterId: recruiterId,
                seekerId: application.seeker_id,
                date, time, mode, meetingLink: meetLink, notes,
                status: 'Scheduled'
            });
        }

        application.interview = {
            date, time, mode, location, meetLink, duration, interviewer, notes,
            scheduledAt: new Date(),
            interviewId: interviewDoc._id
        };

        application.rescheduledAt = new Date();
        application.reschedule.requested = false;
        application.reschedule.reviewed = true;
        application.status = 'interview';

        application.interviewHistory.push({
            action: 'Rescheduled',
            details: application.interview,
            reason: `Approved: ${application.reschedule.reason}`,
            timestamp: new Date()
        });

        await application.save();

        await logActivity(
            recruiterId,
            'STATUS_CHANGE',
            `Approved reschedule for ${application.job_id.title}`,
            { applicationId: application._id }
        );

        await createNotification({
            recipient: application.seeker_id,
            type: 'application_update',
            title: 'Reschedule Approved',
            message: `Your interview for ${application.job_id.title} has been rescheduled to ${date} at ${time}.`,
            link: '/seeker/interviews?focused=true&from=notifications',
            sender: recruiterId
        });

        res.json({ success: true, message: 'Reschedule approved', application });
    } catch (error) {
        console.error("Approve reschedule error:", error);
        res.status(500).json({ message: 'Error approving reschedule' });
    }
};

// Reject Reschedule
export const rejectReschedule = async (req, res) => {
    const { id } = req.params;
    const { feedback } = req.body;
    const recruiterId = req.user.id;

    try {
        const application = await Application.findById(id).populate('job_id');
        if (!application) return res.status(404).json({ message: 'Application not found' });

        if (application.job_id.recruiter_id.toString() !== recruiterId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        application.reschedule.requested = false;
        application.reschedule.reviewed = true;

        application.interviewHistory.push({
            action: 'Reschedule Rejected',
            reason: feedback || 'Declined reschedule request',
            timestamp: new Date()
        });

        await application.save();

        await createNotification({
            recipient: application.seeker_id,
            type: 'application_update',
            title: 'Reschedule Rejected',
            message: `Your reschedule request for ${application.job_id.title} was declined. Original time stands.`,
            link: '/seeker/interviews?focused=true&from=notifications',
            sender: recruiterId
        });

        res.json({ success: true, message: 'Reschedule rejected', application });
    } catch (error) {
        console.error("Reject reschedule error:", error);
        res.status(500).json({ message: 'Error rejecting reschedule' });
    }
};
