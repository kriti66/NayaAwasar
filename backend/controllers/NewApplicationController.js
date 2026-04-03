
import Application from '../models/Application.js';
import User from '../models/User.js';
import Job from '../models/Job.js';
import Profile from '../models/Profile.js';
import { createNotification } from './notificationController.js';
import { logUserActivity } from '../utils/userActivityLogger.js';
import { logActivity } from '../utils/activityLogger.js';
import Interview from '../models/Interview.js';
import { recordUserInteraction } from '../services/recommendationService.js';
import { getEffectiveInterviewStart } from '../utils/interviewDateTime.js';
import { computeInterviewLifecycle } from '../utils/interviewLifecycle.js';
import { isJobVisibleForPublicListing } from '../utils/jobModeration.js';
import { interviewCalendarMetadata } from '../utils/interviewNotificationMetadata.js';

function getSeekerIdString(application) {
    const s = application?.seeker_id;
    if (s == null) return null;
    if (typeof s === 'object' && s._id != null) return String(s._id);
    return String(s);
}

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
            .populate('interview.interviewId')
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
            .populate({
                path: 'job_id',
                select: 'title company_name location company_logo company_id',
                populate: {
                    path: 'company_id',
                    select: 'name logo'
                }
            })
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
        if (!isJobVisibleForPublicListing(job)) {
            return res.status(400).json({ message: 'This job is not open for applications.' });
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
                    phone: user.phoneNumber || profile?.phoneNumber || null,
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
                    link: `/recruiter/applications?jobId=${job_id}`,
                    sender: seekerId
                });

                recordUserInteraction(seekerId, job_id, 'applied');

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
                phone: user.phoneNumber || profile?.phoneNumber || null,
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
            link: `/recruiter/applications?jobId=${job_id}`,
            sender: seekerId
        });

        recordUserInteraction(seekerId, job_id, 'applied');

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
            const { date, time, mode, location, notes, timezone, duration, interviewer } = req.body;
            if (!date || !time || !mode) {
                return res.status(400).json({ message: 'Date, time, and mode are required for interview.' });
            }

            if (mode === 'Onsite' && !location) {
                return res.status(400).json({ message: 'Location is required for Onsite interviews.' });
            }

            // Generate roomId if Online
            let roomId = null;
            if (mode === 'Online') {
                roomId = `interview_${application._id}_${Date.now()}`;
            }

            const dur = Number(duration);
            const newInterview = await Interview.create({
                applicationId: application._id,
                jobId: application.job_id._id,
                recruiterId: recruiterId,
                seekerId: application.seeker_id,
                date,
                time,
                mode,
                location: mode === 'Onsite' ? location : undefined,
                roomId,
                notes,
                timezone,
                status: 'Scheduled',
                duration: Number.isFinite(dur) && dur > 0 ? dur : 30,
                interviewer: interviewer ? String(interviewer).trim() : '',
                interviewStatus: 'pending_acceptance',
                calendarStatus: 'pending_acceptance',
                acceptedBySeeker: false,
                acceptedByRecruiter: true
            });

            application.interview = {
                date, time, mode, location, roomId, notes, timezone,
                duration: newInterview.duration,
                interviewer: newInterview.interviewer,
                scheduledAt: new Date(),
                interviewId: newInterview._id
            };

            application.interviewHistory.push({
                action: 'Scheduled',
                details: application.interview,
                timestamp: new Date()
            });
        }

        application.status = nextStatus;
        await application.save();

        if (nextStatus === 'interview') {
            const invId = application.interview?.interviewId;
            await createNotification({
                recipient: application.seeker_id,
                type: 'interview_scheduled',
                category: 'interview',
                title: 'Interview Scheduled',
                message: `Your interview for ${application.job_id?.title} has been scheduled (${application.interview.mode}).`,
                link: '/seeker/calendar',
                sender: recruiterId,
                metadata: invId
                    ? interviewCalendarMetadata(
                          { _id: invId, date: application.interview?.date },
                          { applicationId: application._id }
                      )
                    : {}
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
    const { status, interviewDetails, offerDetails, rejectionReason } = req.body;
    const recruiterId = req.user.id;

    const validStatuses = ['applied', 'in-review', 'interview', 'offered', 'hired', 'rejected', 'withdrawn'];

    // Normalize status
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

        // --- Status Specific Logic ---

        // 1. Interview
        if (normalizedStatus === 'interview' && interviewDetails) {
            const { date, time, mode, location, notes, timezone, duration, interviewer } = interviewDetails;

            if (mode === 'Onsite' && !location) {
                return res.status(400).json({ message: 'Location is required for Onsite interviews.' });
            }

            let roomId = null;
            if (mode === 'Online') {
                roomId = `interview_${application._id}_${Date.now()}`;
            }

            const dur = Number(duration);
            const newInterview = await Interview.create({
                applicationId: application._id,
                jobId: application.job_id._id,
                recruiterId: recruiterId,
                seekerId: application.seeker_id,
                date: date,
                time: time,
                mode: mode,
                location: mode === 'Onsite' ? location : undefined,
                roomId: roomId,
                notes: notes,
                timezone: timezone,
                status: 'Scheduled',
                duration: Number.isFinite(dur) && dur > 0 ? dur : 30,
                interviewer: interviewer ? String(interviewer).trim() : '',
                interviewStatus: 'pending_acceptance',
                calendarStatus: 'pending_acceptance',
                acceptedBySeeker: false,
                acceptedByRecruiter: true
            });

            application.interview = {
                ...interviewDetails,
                location: mode === 'Onsite' ? location : undefined,
                roomId: roomId,
                scheduledAt: new Date(),
                interviewId: newInterview._id
            };
            // Clean up legacy
            if (application.interview.meetLink) delete application.interview.meetLink;

            application.interviewHistory.push({
                action: 'Scheduled',
                details: application.interview,
                timestamp: new Date()
            });
        }

        // 2. Offered
        if (normalizedStatus === 'offered') {
            application.offer = {
                salary: offerDetails?.salary || '',
                notes: offerDetails?.notes || '',
                offeredAt: new Date()
            };
        }

        // 3. Rejected
        if (normalizedStatus === 'rejected') {
            application.cancelReason = rejectionReason || 'Application rejected by recruiter';
        }

        // Update Status
        application.status = normalizedStatus;
        await application.save();

        // --- Notifications & Logging ---
        if (normalizedStatus !== previousStatus) {
            let notifMessage = `Your application status for ${application.job_id.title} has been updated to ${normalizedStatus.replace('-', ' ')}.`;
            let notifTitle = 'Application Status Update';
            let notifLink = '/seeker/applications';
            let notifType = normalizedStatus === 'offered' ? 'offer' : 'application_update';
            let notifCategory;
            let notifMetadata = {};

            if (normalizedStatus === 'interview') {
                notifMessage = `You have an interview scheduled for ${application.job_id.title}.`;
                notifLink = '/seeker/calendar';
                notifTitle = 'Interview Scheduled';
                notifType = 'interview_scheduled';
                notifCategory = 'interview';
                const invId = application.interview?.interviewId;
                if (invId) {
                    notifMetadata = interviewCalendarMetadata(
                        { _id: invId, date: application.interview?.date },
                        { applicationId: application._id }
                    );
                }
            } else if (normalizedStatus === 'offered') {
                notifTitle = 'Offer Received';
                notifMessage = `Congratulations! You have received an offer for ${application.job_id.title}.`;
            } else if (normalizedStatus === 'hired') {
                notifTitle = 'You are Hired!';
                notifMessage = `You have been officially hired for ${application.job_id.title}.`;
            } else if (normalizedStatus === 'rejected') {
                notifTitle = 'Application Update';
                notifMessage = `Your application for ${application.job_id.title} was not successful.`;
            }

            await createNotification({
                recipient: application.seeker_id,
                type: notifType,
                category: notifCategory || 'application',
                title: notifTitle,
                message: notifMessage,
                link: notifLink,
                sender: recruiterId,
                metadata: notifMetadata
            });

            await logActivity(
                recruiterId,
                'STATUS_CHANGE',
                `Changed application status to ${normalizedStatus} for ${application.job_id.title}`,
                { applicationId: application._id, status: normalizedStatus }
            );
        }

        res.json({ success: true, message: `Status updated to ${normalizedStatus.replace('-', ' ')}`, application });
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
            link: `/recruiter/applications?jobId=${application.job_id._id}`,
            sender: seekerId
        });

        res.json({ success: true, message: 'Offer accepted!', application });
    } catch (error) {
        console.error("Accept offer error:", error);
        res.status(500).json({ message: 'Error accepting offer' });
    }
};

// Get upcoming interviews (Interview model as single source of truth)
export const getMyInterviews = async (req, res) => {
    const seekerId = req.user.id;

    try {
        const interviewDocs = await Interview.find({
            seekerId,
            status: { $in: ['Scheduled', 'Completed', 'Missed'] },
            $or: [
                {
                    interviewStatus: {
                        $in: ['scheduled', 'reschedule_pending', 'confirmed', 'pending_acceptance']
                    }
                },
                { interviewStatus: { $exists: false } },
                { interviewStatus: null }
            ]
        })
            .populate('applicationId')
            .populate('jobId', 'title company_name location')
            .lean();

        const rows = interviewDocs
            .filter((inv) => inv.applicationId && inv.applicationId.status === 'interview')
            .map((inv) => {
                const app = inv.applicationId;
                const appObj = app?.toObject ? app.toObject() : app;
                const life = computeInterviewLifecycle(inv);
                const effectiveStart = getEffectiveInterviewStart(inv);
                return {
                    ...appObj,
                    _id: app._id,
                    job_id: inv.jobId,
                    lifecycleStatus: life.status,
                    effectiveStartMs: effectiveStart ? effectiveStart.getTime() : null,
                    interview: {
                        date: inv.date,
                        time: inv.time,
                        mode: inv.mode,
                        location: inv.location,
                        roomId: inv.roomId,
                        notes: inv.notes,
                        timezone: inv.timezone,
                        duration: inv.duration ?? app?.interview?.duration ?? 30,
                        interviewer: inv.interviewer || app?.interview?.interviewer,
                        interviewId: {
                            _id: inv._id,
                            interviewStatus: inv.interviewStatus || 'scheduled',
                            rescheduleStatus: inv.rescheduleStatus || 'NONE',
                            proposedDate: inv.proposedDate,
                            proposedTime: inv.proposedTime,
                            rescheduleReason: inv.rescheduleReason,
                            rescheduleRequestedBy: inv.rescheduleRequestedBy,
                            rescheduleRequestedAt: inv.rescheduleRequestedAt,
                            requestedDate: inv.requestedDate,
                            requestedTime: inv.requestedTime,
                            recruiterDecisionAt: inv.recruiterDecisionAt,
                            rescheduleRejectedReason: inv.rescheduleRejectedReason,
                            joined: inv.joined === true,
                            result: inv.result,
                            mongoStatus: inv.status,
                            startTime: inv.startTime,
                            endTime: inv.endTime
                        }
                    }
                };
            });

        rows.sort((a, b) => {
            const ta = a.effectiveStartMs != null ? a.effectiveStartMs : Number.MAX_SAFE_INTEGER;
            const tb = b.effectiveStartMs != null ? b.effectiveStartMs : Number.MAX_SAFE_INTEGER;
            return ta - tb;
        });

        res.json(rows);
    } catch (error) {
        console.error("Fetch interviews error:", error);
        res.status(500).json({ message: 'Error fetching interviews' });
    }
};

/** GET /applications/:id/interview-detail — seeker or recruiter for that application */
export const getInterviewApplicationDetail = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    try {
        const application = await Application.findById(id).populate('job_id').populate('interview.interviewId');
        if (!application) return res.status(404).json({ message: 'Application not found' });

        const isSeeker = application.seeker_id.toString() === userId;
        const isRecruiter =
            application.job_id?.recruiter_id?.toString() === userId || req.user.role === 'admin';
        if (!isSeeker && !isRecruiter) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const inv = application.interview?.interviewId;
        if (!inv) return res.status(404).json({ message: 'No interview on this application' });

        const invPlain = inv.toObject ? inv.toObject() : inv;
        const life = computeInterviewLifecycle(invPlain);
        res.json({
            application,
            interview: invPlain,
            lifecycleStatus: life.status,
            effectiveStart: life.effectiveStart ? life.effectiveStart.toISOString() : null,
            effectiveEnd: life.effectiveEnd ? life.effectiveEnd.toISOString() : null
        });
    } catch (e) {
        console.error('getInterviewApplicationDetail', e);
        res.status(500).json({ message: 'Error loading interview' });
    }
};

/** PATCH seeker: mark joined when lifecycle is LIVE */
export const markInterviewJoined = async (req, res) => {
    const { id } = req.params;
    const seekerId = req.user.id;
    try {
        const application = await Application.findById(id).populate('interview.interviewId');
        if (!application) return res.status(404).json({ message: 'Application not found' });
        if (application.seeker_id.toString() !== seekerId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const interviewDoc = application.interview?.interviewId;
        if (!interviewDoc) return res.status(404).json({ message: 'Interview not found' });

        const plain = interviewDoc.toObject ? interviewDoc.toObject() : interviewDoc;
        const life = computeInterviewLifecycle(plain);
        if (life.status !== 'LIVE') {
            return res.status(400).json({
                message: 'You can only mark joined during the live interview window.',
                lifecycleStatus: life.status
            });
        }

        interviewDoc.joined = true;
        await interviewDoc.save();
        res.json({ success: true, joined: true });
    } catch (e) {
        console.error('markInterviewJoined', e);
        res.status(500).json({ message: 'Error updating interview' });
    }
};

/** PATCH seeker: cancel own pending reschedule (PENDING + jobseeker) */
export const cancelJobseekerRescheduleRequest = async (req, res) => {
    const { id } = req.params;
    const seekerId = req.user.id;
    try {
        const application = await Application.findById(id).populate('job_id').populate('interview.interviewId');
        if (!application) return res.status(404).json({ message: 'Application not found' });
        if (application.seeker_id.toString() !== seekerId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const interviewDoc = application.interview?.interviewId;
        if (!interviewDoc) return res.status(404).json({ message: 'Interview not found' });

        const rs = String(interviewDoc.rescheduleStatus || '').toUpperCase();
        if (
            interviewDoc.rescheduleRequestedBy !== 'jobseeker' ||
            rs !== 'PENDING' ||
            interviewDoc.interviewStatus !== 'reschedule_pending'
        ) {
            return res.status(400).json({ message: 'No active jobseeker reschedule request to cancel' });
        }

        interviewDoc.rescheduleStatus = 'NONE';
        interviewDoc.interviewStatus = 'scheduled';
        interviewDoc.rescheduleRequestedAt = undefined;
        interviewDoc.requestedDate = undefined;
        interviewDoc.requestedTime = undefined;
        interviewDoc.rescheduleReason = undefined;
        await interviewDoc.save();

        application.reschedule = application.reschedule || {};
        application.reschedule.requested = false;
        application.reschedule.reviewed = false;
        application.reschedule.reason = undefined;
        await application.save();

        res.json({ success: true, message: 'Reschedule request cancelled' });
    } catch (e) {
        console.error('cancelJobseekerRescheduleRequest', e);
        res.status(500).json({ message: 'Error cancelling reschedule' });
    }
};

/** PATCH recruiter: interview outcome (does not advance application stage — use existing flows for offer/reject) */
export const updateInterviewResult = async (req, res) => {
    const { id } = req.params;
    const { result } = req.body;
    const recruiterId = req.user.id;

    if (!['passed', 'rejected'].includes(result)) {
        return res.status(400).json({ message: 'result must be passed or rejected' });
    }

    try {
        const application = await Application.findById(id).populate('job_id').populate('interview.interviewId');
        if (!application) return res.status(404).json({ message: 'Application not found' });
        if (application.job_id.recruiter_id.toString() !== recruiterId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const interviewDoc = application.interview?.interviewId;
        if (!interviewDoc) return res.status(404).json({ message: 'Interview not found' });

        interviewDoc.result = result;
        interviewDoc.status = 'Completed';
        await interviewDoc.save();

        res.json({ success: true, interview: interviewDoc });
    } catch (e) {
        console.error('updateInterviewResult', e);
        res.status(500).json({ message: 'Error saving interview result' });
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

        // Sync to Interview (single source of truth)
        let interviewDocAfter = null;
        const interviewId = application.interview?.interviewId;
        if (interviewId) {
            const interviewDoc = await Interview.findById(interviewId);
            if (interviewDoc) {
                interviewDoc.rescheduleRequestedBy = 'jobseeker';
                interviewDoc.rescheduleRequestedAt = new Date();
                interviewDoc.requestedDate = preferredDate ? new Date(preferredDate) : undefined;
                interviewDoc.requestedTime = preferredTime || undefined;
                interviewDoc.rescheduleReason = reason;
                interviewDoc.rescheduleStatus = 'PENDING';
                interviewDoc.interviewStatus = 'reschedule_pending';
                interviewDoc.rescheduleRejectedReason = undefined;
                interviewDoc.recruiterDecisionAt = undefined;
                await interviewDoc.save();
                interviewDocAfter = interviewDoc;
            }
        }

        await createNotification({
            recipient: application.job_id.recruiter_id,
            type: 'reschedule_requested',
            category: 'interview',
            title: 'Reschedule Requested',
            message: `Reschedule requested for ${application.job_id.title}`,
            link: '/recruiter/calendar',
            sender: seekerId,
            metadata: interviewDocAfter
                ? interviewCalendarMetadata(interviewDocAfter, { applicationId: application._id })
                : interviewCalendarMetadata(
                      { _id: interviewId, date: application.interview?.date },
                      { applicationId: application._id }
                  )
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
    const { date, time, mode, location, duration, interviewer, notes, timezone } = req.body;
    const recruiterId = req.user.id;

    try {
        const application = await Application.findById(id).populate('job_id');
        if (!application) return res.status(404).json({ message: 'Application not found' });

        if (application.job_id.recruiter_id.toString() !== recruiterId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Update or create interview doc
        let interviewDoc;
        let roomId = null;

        if (mode === 'Online') {
            roomId = `interview_${application._id}_${Date.now()}`;
        }

        if (application.interview && application.interview.interviewId) {
            interviewDoc = await Interview.findById(application.interview.interviewId);
        }

        const durApprove = Number(duration);
        if (interviewDoc) {
            interviewDoc.date = date;
            interviewDoc.time = time;
            interviewDoc.mode = mode;
            interviewDoc.location = mode === 'Onsite' ? location : undefined;
            if (mode === 'Online') interviewDoc.roomId = roomId;
            interviewDoc.notes = notes;
            interviewDoc.timezone = timezone;
            interviewDoc.status = 'Scheduled';
            interviewDoc.interviewStatus = 'scheduled';
            interviewDoc.calendarStatus = 'scheduled';
            interviewDoc.acceptedBySeeker = true;
            interviewDoc.acceptedByRecruiter = true;
            interviewDoc.set('rescheduleRequest', undefined);
            interviewDoc.rescheduleStatus = 'NONE';
            if (Number.isFinite(durApprove) && durApprove > 0) interviewDoc.duration = durApprove;
            if (interviewer != null) interviewDoc.interviewer = String(interviewer).trim();
            await interviewDoc.save();
        } else {
            interviewDoc = await Interview.create({
                applicationId: application._id,
                jobId: application.job_id._id,
                recruiterId: recruiterId,
                seekerId: application.seeker_id,
                date, time, mode,
                location: mode === 'Onsite' ? location : undefined,
                roomId,
                notes,
                timezone,
                status: 'Scheduled',
                duration: Number.isFinite(durApprove) && durApprove > 0 ? durApprove : 30,
                interviewer: interviewer ? String(interviewer).trim() : '',
                interviewStatus: 'scheduled',
                calendarStatus: 'scheduled',
                acceptedBySeeker: true,
                acceptedByRecruiter: true
            });
        }

        application.interview = {
            date, time, mode, location, roomId, duration, interviewer, notes, timezone,
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
            type: 'interview_rescheduled',
            category: 'interview',
            title: 'Reschedule Approved',
            message: `Your interview for ${application.job_id.title} has been rescheduled to ${date} at ${time}.`,
            link: '/seeker/calendar',
            sender: recruiterId,
            metadata: interviewCalendarMetadata(interviewDoc, { applicationId: application._id })
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
    const { reason, feedback } = req.body;
    const recruiterId = req.user.id;

    try {
        const application = await Application.findById(id).populate('job_id');
        if (!application) return res.status(404).json({ message: 'Application not found' });

        if (application.job_id.recruiter_id.toString() !== recruiterId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const rejectionReason = reason || feedback || 'Your reschedule request was declined.';

        application.reschedule.requested = false;
        application.reschedule.reviewed = true;
        application.reschedule.rejectionReason = rejectionReason;

        application.interviewHistory.push({
            action: 'Reschedule Rejected',
            reason: rejectionReason,
            timestamp: new Date()
        });

        await application.save();

        // Store rejection in Interview (single source of truth) - keep original schedule active
        const interviewId = application.interview?.interviewId;
        if (interviewId) {
            const interviewDoc = await Interview.findById(interviewId);
            if (interviewDoc) {
                interviewDoc.rescheduleStatus = 'REJECTED';
                interviewDoc.rescheduleRejectedReason = rejectionReason;
                interviewDoc.recruiterDecisionAt = new Date();
                interviewDoc.interviewStatus = 'scheduled';
                // Keep original date/time - do not modify
                await interviewDoc.save();
            }
        }

        // Notify Seeker (still create notification for alert)
        const interviewDocForReject = interviewId ? await Interview.findById(interviewId).lean() : null;
        await createNotification({
            recipient: application.seeker_id,
            type: 'reschedule_rejected',
            category: 'interview',
            title: 'Reschedule Declined',
            message: `Your reschedule request for ${application.job_id.title} was declined. Reason: ${rejectionReason}`,
            link: '/seeker/calendar',
            sender: recruiterId,
            metadata: interviewDocForReject
                ? interviewCalendarMetadata(interviewDocForReject, { applicationId: application._id })
                : interviewCalendarMetadata(
                      { _id: interviewId, date: application.interview?.date },
                      { applicationId: application._id }
                  )
        });

        res.json({ success: true, message: 'Reschedule request rejected', application });
    } catch (error) {
        console.error("Reject reschedule error:", error);
        res.status(500).json({ message: 'Error rejecting reschedule request' });
    }
};

// Recruiter proposes a reschedule to the jobseeker (jobseeker decides)
export const proposeRecruiterReschedule = async (req, res) => {
    const { id } = req.params;
    const { proposedDate, proposedTime, reason } = req.body;
    const requesterId = req.user.id;

    if (!proposedDate) return res.status(400).json({ message: 'proposedDate is required' });
    if (!proposedTime) return res.status(400).json({ message: 'proposedTime is required' });
    if (!reason || !reason.trim()) return res.status(400).json({ message: 'Reason is required' });

    const proposedDateObj = new Date(proposedDate);
    if (Number.isNaN(proposedDateObj.getTime())) {
        return res.status(400).json({ message: 'Invalid proposedDate' });
    }

    try {
        const application = await Application.findById(id)
            .populate('job_id', 'title recruiter_id')
            .populate('seeker_id', 'fullName email');

        if (!application) return res.status(404).json({ message: 'Application not found' });
        if (application.status !== 'interview') return res.status(400).json({ message: 'Cannot reschedule: application is not in interview stage' });

        // Recruiter owns the job / interview
        if (req.user.role !== 'admin' && application.job_id.recruiter_id.toString() !== requesterId) {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        // If jobseeker has a pending reschedule request (existing flow), block recruiter proposals
        if (application.reschedule?.requested && !application.reschedule?.reviewed) {
            return res.status(400).json({ message: 'A reschedule request is already pending review for this interview' });
        }

        const interviewId = application.interview?.interviewId;
        if (!interviewId) return res.status(404).json({ message: 'Interview not found' });

        const interviewDoc = await Interview.findById(interviewId);
        if (!interviewDoc) return res.status(404).json({ message: 'Interview not found' });

        if (req.user.role !== 'admin' && interviewDoc.recruiterId.toString() !== requesterId) {
            return res.status(403).json({ message: 'Unauthorized access to this interview' });
        }

        if (['Completed', 'Cancelled', 'Missed'].includes(interviewDoc.status)) {
            return res.status(400).json({ message: `Cannot reschedule interview in state: ${interviewDoc.status}` });
        }

        const currentStatus = interviewDoc.rescheduleStatus || 'NONE';
        if (['PENDING', 'PROPOSED'].includes(currentStatus)) {
            return res.status(400).json({ message: 'A recruiter reschedule request is already pending' });
        }

        // Keep original date/time unchanged; store proposed separately
        interviewDoc.rescheduleRequestedBy = 'recruiter';
        interviewDoc.proposedDate = proposedDateObj;
        interviewDoc.proposedTime = proposedTime;
        interviewDoc.rescheduleReason = reason;
        interviewDoc.rescheduleStatus = 'PROPOSED';
        interviewDoc.interviewStatus = 'reschedule_pending';
        await interviewDoc.save();

        // Optional audit trail
        application.interviewHistory = Array.isArray(application.interviewHistory) ? application.interviewHistory : [];
        application.interviewHistory.push({
            action: 'Recruiter Reschedule Proposed',
            reason,
            details: {
                proposedDate: proposedDateObj,
                proposedTime,
                mode: interviewDoc.mode
            },
            timestamp: new Date()
        });
        await application.save();

        await createNotification({
            recipient: application.seeker_id._id,
            type: 'reschedule_requested',
            category: 'interview',
            title: 'Reschedule Proposed',
            message: `Recruiter wants to reschedule your interview for ${application.job_id.title} to ${proposedDateObj.toLocaleDateString()} at ${proposedTime}.`,
            link: '/seeker/calendar',
            sender: requesterId,
            metadata: interviewCalendarMetadata(interviewDoc, { applicationId: application._id })
        });

        res.json({ success: true, message: 'Reschedule request sent' });
    } catch (error) {
        console.error('Propose recruiter reschedule error:', error);
        res.status(500).json({ message: 'Error sending reschedule request' });
    }
};

// Jobseeker accepts recruiter-proposed reschedule
export const acceptRecruiterReschedule = async (req, res) => {
    const { id } = req.params;
    const seekerId = String(req.user.id);

    try {
        const application = await Application.findById(id)
            .populate('job_id', 'title recruiter_id')
            .populate('seeker_id', 'fullName email')
            .populate('interview.interviewId');

        if (!application) return res.status(404).json({ message: 'Application not found' });

        const role = req.user.role;
        if (role !== 'jobseeker' && role !== 'job_seeker') {
            return res.status(403).json({
                message: 'Only jobseeker can accept recruiter reschedule'
            });
        }

        const applicationSeekerId = getSeekerIdString(application);
        if (!applicationSeekerId || applicationSeekerId !== seekerId) {
            return res.status(403).json({
                message: 'You can only accept your own interview reschedule'
            });
        }
        if (application.status !== 'interview') return res.status(400).json({ message: 'Cannot accept: application is not in interview stage' });

        const interviewDoc = application.interview?.interviewId;
        if (!interviewDoc) return res.status(404).json({ message: 'Interview not found' });

        if (['Completed', 'Cancelled', 'Missed'].includes(interviewDoc.status)) {
            return res.status(400).json({ message: `Cannot reschedule interview in state: ${interviewDoc.status}` });
        }

        if (interviewDoc.rescheduleRequestedBy !== 'recruiter') {
            return res.status(400).json({ message: 'No recruiter reschedule proposal pending' });
        }

        const currentStatus = interviewDoc.rescheduleStatus || 'NONE';
        if (!['PENDING', 'PROPOSED'].includes(currentStatus)) {
            return res.status(400).json({ message: 'No pending recruiter reschedule request' });
        }

        if (!interviewDoc.proposedDate || !interviewDoc.proposedTime) {
            return res.status(400).json({ message: 'Proposed date/time missing' });
        }

        const recruiterReasonSnapshot = interviewDoc.rescheduleReason;

        // Apply proposal
        const newDate = new Date(interviewDoc.proposedDate);
        const newTime = interviewDoc.proposedTime;

        interviewDoc.date = newDate;
        interviewDoc.time = newTime;
        interviewDoc.status = 'Scheduled';
        interviewDoc.interviewStatus = 'confirmed';
        interviewDoc.rescheduleStatus = 'APPROVED';
        interviewDoc.proposedDate = undefined;
        interviewDoc.proposedTime = undefined;
        interviewDoc.rescheduleReason = undefined;

        // If online, regenerate roomId so the join link remains valid.
        let roomId = interviewDoc.roomId;
        if (interviewDoc.mode === 'Online') {
            roomId = `interview_${application._id}_${Date.now()}`;
            interviewDoc.roomId = roomId;
        }

        await interviewDoc.save();

        application.interview = application.interview || {};
        application.interview.date = newDate;
        application.interview.time = newTime;
        if (interviewDoc.mode === 'Online') {
            application.interview.roomId = roomId;
        }
        application.interview.scheduledAt = new Date();

        application.interviewHistory = Array.isArray(application.interviewHistory) ? application.interviewHistory : [];
        application.interviewHistory.push({
            action: 'Recruiter Reschedule Approved',
            reason: recruiterReasonSnapshot,
            timestamp: new Date()
        });
        await application.save();

        await createNotification({
            recipient: application.job_id.recruiter_id,
            type: 'interview_rescheduled',
            category: 'interview',
            title: 'Reschedule Approved',
            message: `${application.seeker_id.fullName} accepted the reschedule for ${application.job_id.title}.`,
            link: '/recruiter/calendar',
            sender: seekerId,
            metadata: interviewCalendarMetadata(interviewDoc, { applicationId: application._id })
        });

        res.json({ success: true, message: 'Reschedule approved', application });
    } catch (error) {
        console.error('Accept recruiter reschedule error:', error);
        res.status(500).json({ message: 'Error approving reschedule' });
    }
};

// Jobseeker rejects recruiter-proposed reschedule (keeps old date/time)
export const rejectRecruiterReschedule = async (req, res) => {
    const { id } = req.params;
    const seekerId = String(req.user.id);
    const { reason } = req.body || {};

    try {
        const application = await Application.findById(id)
            .populate('job_id', 'title recruiter_id')
            .populate('seeker_id', 'fullName email')
            .populate('interview.interviewId');

        if (!application) return res.status(404).json({ message: 'Application not found' });

        const role = req.user.role;
        if (role !== 'jobseeker' && role !== 'job_seeker') {
            return res.status(403).json({
                message: 'Only jobseeker can reject recruiter reschedule'
            });
        }

        const applicationSeekerId = getSeekerIdString(application);
        if (!applicationSeekerId || applicationSeekerId !== seekerId) {
            return res.status(403).json({
                message: 'You can only respond to your own interview reschedule'
            });
        }
        if (application.status !== 'interview') return res.status(400).json({ message: 'Cannot reject: application is not in interview stage' });

        const interviewDoc = application.interview?.interviewId;
        if (!interviewDoc) return res.status(404).json({ message: 'Interview not found' });

        if (['Completed', 'Cancelled', 'Missed'].includes(interviewDoc.status)) {
            return res.status(400).json({ message: `Cannot reschedule interview in state: ${interviewDoc.status}` });
        }

        if (interviewDoc.rescheduleRequestedBy !== 'recruiter') {
            return res.status(400).json({ message: 'No recruiter reschedule proposal pending' });
        }

        const currentStatus = interviewDoc.rescheduleStatus || 'NONE';
        if (!['PENDING', 'PROPOSED'].includes(currentStatus)) {
            return res.status(400).json({ message: 'No pending recruiter reschedule request' });
        }

        // Reject proposal: keep original interview.date/time unchanged; original schedule remains active.
        interviewDoc.rescheduleStatus = 'REJECTED';
        interviewDoc.interviewStatus = 'scheduled';
        interviewDoc.proposedDate = undefined;
        interviewDoc.proposedTime = undefined;
        interviewDoc.rescheduleReason = undefined;
        await interviewDoc.save();

        application.interviewHistory = Array.isArray(application.interviewHistory) ? application.interviewHistory : [];
        application.interviewHistory.push({
            action: 'Recruiter Reschedule Rejected',
            reason: reason || interviewDoc.rescheduleReason,
            timestamp: new Date()
        });
        await application.save();

        await createNotification({
            recipient: application.job_id.recruiter_id,
            type: 'reschedule_rejected',
            category: 'interview',
            title: 'Reschedule Rejected',
            message: `${application.seeker_id.fullName} rejected the reschedule for ${application.job_id.title}.`,
            link: '/recruiter/calendar',
            sender: seekerId,
            metadata: interviewCalendarMetadata(interviewDoc, { applicationId: application._id })
        });

        res.json({ success: true, message: 'Reschedule rejected', application });
    } catch (error) {
        console.error('Reject recruiter reschedule error:', error);
        res.status(500).json({ message: 'Error rejecting reschedule request' });
    }
};
