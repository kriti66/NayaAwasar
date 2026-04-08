import Interview from '../models/Interview.js';
import User from '../models/User.js';
import Application from '../models/Application.js';
import mongoose from 'mongoose';
import { createRequire } from 'module';
import { getInterviewJoinWindow, combineDateAndTimeNepal } from '../utils/interviewDateTime.js';
import { createNotification } from './notificationController.js';
import { interviewCalendarMetadata } from '../utils/interviewNotificationMetadata.js';
import { RESCHEDULE_FSM } from '../constants/reschedule.js';
import { normalizeModerationStatusForEdit } from '../utils/jobModeration.js';

/** Hide calendar rows when the job was hidden or soft-removed by admin (even if interview doc was not updated). */
function jobModerationHidesInterview(job) {
    if (!job || typeof job !== 'object') return false;
    const n = normalizeModerationStatusForEdit(job.moderationStatus);
    return n === 'hidden' || n === 'deleted';
}

const require = createRequire(import.meta.url);
const { generateToken04 } = require('../utils/zegoServerAssistant.cjs');

// Get token for interview call (legacy: POST /api/interviews/:id/zego-token)
export const getZegoToken = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    console.log(`[GET /api/interviews/${id}/zego-token] Request by ${userId}`);

    try {
        const requestedRoomId = String(id || '').trim();
        let interview = await Interview.findOne({ roomId: requestedRoomId });
        if (!interview && mongoose.Types.ObjectId.isValid(requestedRoomId)) {
            interview = await Interview.findById(requestedRoomId);
        }

        if (!interview) {
            return res.status(404).json({ message: 'Interview not found', roomID: requestedRoomId });
        }

        if (!interview.roomId) {
            interview.roomId = `interview_${interview.applicationId}_${Date.now()}`;
            await interview.save();
        }

        // Verify authorization
        const isRecruiter = interview.recruiterId.toString() === userId;
        const isSeeker = interview.seekerId.toString() === userId;

        if (!isRecruiter && !isSeeker) {
            return res.status(403).json({ message: 'Unauthorized access to this interview' });
        }

        const awaitingSeekerAccept =
            (interview.calendarStatus === 'pending_acceptance' ||
                interview.interviewStatus === 'pending_acceptance') &&
            interview.acceptedBySeeker === false;
        if (awaitingSeekerAccept) {
            return res.status(403).json({
                message: 'Please accept the interview invitation before joining the call.'
            });
        }

        // Verify status
        if (interview.status !== 'Scheduled') {
            return res.status(403).json({ message: `Interview is ${interview.status}. Cannot verify token.` });
        }

        // Generate Token
        const appId = Number(String(process.env.ZEGO_APP_ID || '').trim());
        const serverSecret = String(process.env.ZEGO_SERVER_SECRET || '').trim();
        const userIdString = String(userId).trim();
        const roomIdString = String(interview.roomId).trim();

        // Debug logging
        console.log(`[Zego Token Gen] AppID: ${appId} (Type: ${typeof appId})`);
        console.log(`[Zego Token Gen] UserID: ${userIdString}`);
        console.log(`[Zego Token Gen] RoomID: ${roomIdString}`);
        console.log(`[Zego Token Gen] Secret Length: ${serverSecret ? serverSecret.length : 'MISSING'}`);

        // Validation for missing config
        if (!Number.isInteger(appId) || !serverSecret) {
            console.error("ZEGO_APP_ID or ZEGO_SERVER_SECRET missing in .env");
            return res.status(500).json({ message: 'Server configuration error' });
        }

        if (serverSecret.length !== 32) {
            return res.status(500).json({
                message: 'Zego server secret must be 32 characters. Check ZEGO_SERVER_SECRET in .env'
            });
        }

        const win = getInterviewJoinWindow(interview);
        if (!win?.scheduledStart) {
            return res.status(400).json({ message: 'Invalid interview schedule' });
        }
        const now = new Date();
        const { scheduledStart: scheduledTime, joinAllowedFrom: startTime, joinAllowedUntil: endTime } = win;

        if (process.env.NODE_ENV !== 'production') {
            console.log('[interviewController zego-token] window', {
                interviewId: String(interview._id),
                parsedStartUtc: scheduledTime.toISOString(),
                joinFrom: startTime.toISOString(),
                joinUntil: endTime.toISOString(),
                now: now.toISOString()
            });
        }

        if (now < startTime) {
            return res.status(400).json({
                message: 'You can join 10 minutes before the interview time.',
                scheduledAt: scheduledTime,
                canJoinAfter: startTime
            });
        }

        if (now > endTime) {
            return res.status(400).json({
                message: 'Interview session has expired.',
                scheduledAt: scheduledTime,
                expiredAt: endTime
            });
        }

        const effectiveTimeInSeconds = 3600;
        const payloadObject = {
            room_id: roomIdString,
            privilege: {
                1: 1, // login room
                2: 1  // publish stream
            },
            stream_id_list: null
        };
        const payload = JSON.stringify(payloadObject);

        const user = await User.findById(userId).select('fullName').lean();
        const userName = user?.fullName || 'User';

        const token = generateToken04(appId, userIdString, serverSecret, effectiveTimeInSeconds, payload);

        if (process.env.NODE_ENV !== 'production') {
            console.log(`[Zego Token] appId: ${appId}, requestedRoomId: ${requestedRoomId}, resolvedRoomId: ${roomIdString}, userId: ${userIdString}, tokenLen: ${token?.length}`);
        }

        res.json({
            appId,
            token,
            roomId: roomIdString,
            userId: userIdString,
            userName
        });
    } catch (error) {
        console.error("Token generation error:", error);
        res.status(500).json({ message: 'Error generating token' });
    }
};

// Create a new interview (Internal use usually, but if exposed via route)
export const createInterview = async (req, res) => {
    // This might duplicate logic if we move it. For now, we focus on the Token endpoint.
    // The scheduling logic is in NewApplicationController.
    // We update NewApplicationController to create this doc.
    res.status(501).json({ message: 'Use application flow to schedule interviews' });
};

// ─── Interview calendar helpers ───────────────────────────────────────────

function normalizeSeekerRole(role) {
    return role === 'job_seeker' ? 'jobseeker' : role;
}

function clearActiveRescheduleWorkflowScalars(i) {
    i.workflowRescheduleStatus = RESCHEDULE_FSM.NONE;
    i.workflowRescheduleRequestedBy = null;
    i.workflowProposedDateTime = null;
    i.workflowCounterProposedDateTime = null;
    i.workflowRescheduleExpiresAt = null;
    i.workflowRescheduleNote = '';
    i.workflowRescheduleRoundCount = 0;
}

function serializeWorkflowReschedule(i) {
    const status = String(i.workflowRescheduleStatus || RESCHEDULE_FSM.NONE).toLowerCase();
    return {
        status,
        requested_by: i.workflowRescheduleRequestedBy || null,
        proposed_at: i.workflowProposedDateTime || null,
        counter_previous_at: i.workflowCounterProposedDateTime || null,
        expires_at: i.workflowRescheduleExpiresAt || null,
        round_count:
            typeof i.workflowRescheduleRoundCount === 'number' ? i.workflowRescheduleRoundCount : 0,
        note: i.workflowRescheduleNote || '',
        history: (i.workflowRescheduleHistory || []).map((h) => ({
            round: h.round,
            proposed_by: h.proposedBy,
            previous_scheduled_at: h.previousScheduledAt ?? null,
            new_proposed_at: h.newProposedAt,
            note: h.note || '',
            action: h.action,
            at: h.at
        }))
    };
}

function serializeRescheduleRequest(i) {
    const rq = i.rescheduleRequest;
    if (rq && rq.newDate) {
        return {
            proposed_by: rq.proposedBy,
            new_date: rq.newDate,
            new_time: rq.newTime || '',
            reason: rq.reason || '',
            requested_at: rq.requestedAt || null
        };
    }
    const rs = String(i.rescheduleStatus || '').toUpperCase();
    if (rs === 'PENDING' && i.requestedDate && i.rescheduleRequestedBy === 'jobseeker') {
        return {
            proposed_by: 'jobseeker',
            new_date: i.requestedDate,
            new_time: i.requestedTime || '',
            reason: i.rescheduleReason || '',
            requested_at: i.rescheduleRequestedAt || null
        };
    }
    if (['PROPOSED', 'PENDING'].includes(rs) && i.proposedDate && i.rescheduleRequestedBy === 'recruiter') {
        return {
            proposed_by: 'recruiter',
            new_date: i.proposedDate,
            new_time: i.proposedTime || '',
            reason: i.rescheduleReason || '',
            requested_at: i.recruiterDecisionAt || null
        };
    }
    return null;
}

function deriveCalendarStatus(i) {
    const top = String(i.status || '');
    if (top === 'Completed') return 'completed';
    if (top === 'Cancelled') return 'cancelled';

    const wf = String(i.workflowRescheduleStatus || RESCHEDULE_FSM.NONE).toLowerCase();
    if (wf === RESCHEDULE_FSM.PENDING || wf === RESCHEDULE_FSM.COUNTERED) {
        return 'reschedule_requested';
    }

    if (i.calendarStatus === 'reschedule_requested') return 'reschedule_requested';
    if (i.calendarStatus === 'pending_acceptance') return 'pending_acceptance';
    if (i.calendarStatus === 'scheduled') return 'scheduled';
    if (i.calendarStatus === 'completed') return 'completed';
    if (i.calendarStatus === 'cancelled') return 'cancelled';

    if (i.interviewStatus === 'pending_acceptance' && i.acceptedBySeeker === false) {
        return 'pending_acceptance';
    }
    if (i.interviewStatus === 'reschedule_pending') return 'reschedule_requested';

    const rs = String(i.rescheduleStatus || '').toUpperCase();
    if (['PENDING', 'PROPOSED'].includes(rs) && serializeRescheduleRequest(i)) {
        return 'reschedule_requested';
    }

    return 'scheduled';
}

function modeToApi(m) {
    const s = String(m || '');
    return s.toLowerCase() === 'onsite' ? 'onsite' : 'online';
}

function toRecruiterCalendarItem(doc) {
    const seeker = doc.seekerId;
    const job = doc.jobId;
    const status = deriveCalendarStatus(doc);
    return {
        id: doc._id,
        application_id: doc.applicationId,
        date: doc.date,
        time: doc.time,
        mode: modeToApi(doc.mode),
        status,
        seeker_name: seeker?.fullName || 'Candidate',
        job_title: job?.title || 'Job',
        company_name: job?.company_name || '',
        location: doc.location || '',
        notes: doc.notes || '',
        duration: doc.duration || 30,
        interviewer: doc.interviewer || '',
        timezone: doc.timezone || '',
        reschedule_request: serializeRescheduleRequest(doc),
        reschedule_fsm: serializeWorkflowReschedule(doc)
    };
}

function toSeekerCalendarItem(doc) {
    const rec = doc.recruiterId;
    const job = doc.jobId;
    const status = deriveCalendarStatus(doc);
    return {
        id: doc._id,
        application_id: doc.applicationId,
        date: doc.date,
        time: doc.time,
        mode: modeToApi(doc.mode),
        status,
        job_title: job?.title || 'Job',
        company_name: job?.company_name || '',
        recruiter_name: rec?.fullName || 'Recruiter',
        reschedule_request: serializeRescheduleRequest(doc),
        reschedule_fsm: serializeWorkflowReschedule(doc)
    };
}

async function syncApplicationInterviewSlot(interview) {
    if (!interview?.applicationId) return;
    const patch = {
        'interview.date': interview.date,
        'interview.time': interview.time,
        'interview.mode': interview.mode,
        'interview.roomId': interview.roomId,
        'interview.location': interview.location
    };
    await Application.updateOne({ _id: interview.applicationId }, { $set: patch });
}

async function autoCompleteInterviewAfterCall(interview, actorUserId) {
    const bothJoined = Boolean(interview.recruiterJoinedAt) && Boolean(interview.seekerJoinedAt);
    const bothLeft = Boolean(interview.recruiterLeftAt) && Boolean(interview.seekerLeftAt);
    if (!bothJoined || !bothLeft) return false;
    if (interview.status === 'Completed' || interview.calendarStatus === 'completed') return false;

    interview.status = 'Completed';
    interview.calendarStatus = 'completed';
    interview.completedAt = interview.callEndedAt || new Date();
    await interview.save();

    const jobTitle = interview.jobId?.title || 'Interview';
    const metadata = interviewCalendarMetadata(interview, { applicationId: interview.applicationId });
    await createNotification({
        recipient: interview.seekerId,
        type: 'interview_completed',
        category: 'interview',
        title: 'Interview completed',
        message: `Your interview for ${jobTitle} has been marked as completed.`,
        link: '/seeker/calendar',
        sender: actorUserId,
        metadata
    });
    await createNotification({
        recipient: interview.recruiterId,
        type: 'interview_completed',
        category: 'interview',
        title: 'Interview completed',
        message: `Your interview for ${jobTitle} has been marked as completed.`,
        link: '/recruiter/calendar',
        sender: actorUserId,
        metadata
    });
    return true;
}

function assertSlotNotInPast(dateVal, timeStr) {
    const slot = combineDateAndTimeNepal(dateVal, timeStr);
    if (!slot) return { ok: false, message: 'Invalid date or time' };
    if (slot.getTime() <= Date.now()) {
        return { ok: false, message: 'Interview slot must be in the future' };
    }
    return { ok: true, slot };
}

export const getRecruiterInterviewCalendar = async (req, res) => {
    try {
        const uid = req.user.id;
        const rows = await Interview.find({ recruiterId: uid, status: { $ne: 'Cancelled' } })
            .populate('seekerId', 'fullName')
            .populate('jobId', 'title company_name moderationStatus')
            .sort({ date: 1, time: 1 })
            .lean();

        const visible = rows.filter((doc) => !jobModerationHidesInterview(doc.jobId));
        res.json({ interviews: visible.map(toRecruiterCalendarItem) });
    } catch (e) {
        console.error('getRecruiterInterviewCalendar', e);
        res.status(500).json({ message: 'Failed to load interview calendar' });
    }
};

export const getSeekerInterviewCalendar = async (req, res) => {
    try {
        const uid = req.user.id;
        const rows = await Interview.find({ seekerId: uid, status: { $ne: 'Cancelled' } })
            .populate('recruiterId', 'fullName')
            .populate('jobId', 'title company_name moderationStatus')
            .sort({ date: 1, time: 1 })
            .lean();

        const visible = rows.filter((doc) => !jobModerationHidesInterview(doc.jobId));
        res.json({ interviews: visible.map(toSeekerCalendarItem) });
    } catch (e) {
        console.error('getSeekerInterviewCalendar', e);
        res.status(500).json({ message: 'Failed to load interview calendar' });
    }
};

export const acceptInterviewBySeeker = async (req, res) => {
    const { id } = req.params;
    const seekerId = req.user.id;
    const role = normalizeSeekerRole(req.user.role);
    if (role !== 'jobseeker') {
        return res.status(403).json({ message: 'Only job seekers can accept this invitation' });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid interview id' });
    }

    try {
        const interview = await Interview.findById(id).populate('jobId', 'title recruiter_id');
        if (!interview) return res.status(404).json({ message: 'Interview not found' });
        if (interview.seekerId.toString() !== seekerId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const cal = deriveCalendarStatus(interview);
        if (cal !== 'pending_acceptance') {
            return res.status(400).json({ message: 'This interview is not awaiting your acceptance' });
        }
        if (interview.status !== 'Scheduled') {
            return res.status(400).json({ message: `Interview is ${interview.status}` });
        }

        interview.acceptedBySeeker = true;
        interview.calendarStatus = 'scheduled';
        interview.interviewStatus = 'scheduled';
        await interview.save();
        await syncApplicationInterviewSlot(interview);

        const jobTitle = interview.jobId?.title || 'a position';
        await createNotification({
            recipient: interview.recruiterId,
            type: 'interview_accepted',
            category: 'interview',
            title: 'Interview accepted',
            message: `The candidate accepted the interview for ${jobTitle}.`,
            link: '/recruiter/calendar',
            sender: seekerId,
            metadata: interviewCalendarMetadata(interview, { applicationId: interview.applicationId })
        });

        const fresh = await Interview.findById(interview._id)
            .populate('recruiterId', 'fullName')
            .populate('jobId', 'title company_name')
            .lean();

        res.json({
            success: true,
            message: 'Interview accepted',
            interview: toSeekerCalendarItem(fresh)
        });
    } catch (e) {
        console.error('acceptInterviewBySeeker', e);
        res.status(500).json({ message: 'Failed to accept interview' });
    }
};

export const requestInterviewReschedule = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const role = normalizeSeekerRole(req.user.role);
    const newDateRaw = req.body.new_date ?? req.body.newDate;
    const newTimeRaw = req.body.new_time ?? req.body.newTime;
    const reason = String(req.body.reason ?? '').trim();

    if (!newDateRaw || !newTimeRaw) {
        return res.status(400).json({ message: 'new_date and new_time are required' });
    }
    if (!reason) {
        return res.status(400).json({ message: 'reason is required' });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid interview id' });
    }

    const newDate = new Date(newDateRaw);
    if (Number.isNaN(newDate.getTime())) {
        return res.status(400).json({ message: 'Invalid new_date' });
    }
    const newTime = String(newTimeRaw).trim();
    const pastCheck = assertSlotNotInPast(newDate, newTime);
    if (!pastCheck.ok) return res.status(400).json({ message: pastCheck.message });

    try {
        const interview = await Interview.findById(id).populate('jobId', 'title');
        if (!interview) return res.status(404).json({ message: 'Interview not found' });

        const isRec = interview.recruiterId.toString() === userId;
        const isSeek = interview.seekerId.toString() === userId;
        if (!isRec && !isSeek) return res.status(403).json({ message: 'Unauthorized' });
        if (role === 'recruiter' && !isRec) return res.status(403).json({ message: 'Unauthorized' });
        if (role === 'jobseeker' && !isSeek) return res.status(403).json({ message: 'Unauthorized' });

        const cal = deriveCalendarStatus(interview);
        if (cal === 'completed' || cal === 'cancelled') {
            return res.status(400).json({ message: 'Cannot reschedule a completed or cancelled interview' });
        }
        const wf = String(interview.workflowRescheduleStatus || RESCHEDULE_FSM.NONE).toLowerCase();
        if (wf === RESCHEDULE_FSM.PENDING || wf === RESCHEDULE_FSM.COUNTERED) {
            return res.status(409).json({
                message: 'A reschedule request is already active. Use the calendar to respond or cancel it.'
            });
        }
        if (cal === 'reschedule_requested') {
            return res.status(409).json({ message: 'A reschedule request is already pending' });
        }

        interview.rescheduleHistory = interview.rescheduleHistory || [];
        interview.rescheduleHistory.push({
            proposedBy: isRec ? 'recruiter' : 'jobseeker',
            date: interview.date,
            time: interview.time,
            reason,
            proposedAt: new Date()
        });

        interview.rescheduleRequest = {
            proposedBy: isRec ? 'recruiter' : 'jobseeker',
            newDate,
            newTime,
            reason,
            requestedAt: new Date()
        };
        interview.calendarStatus = 'reschedule_requested';
        interview.interviewStatus = 'reschedule_pending';

        if (isRec) {
            interview.rescheduleRequestedBy = 'recruiter';
            interview.proposedDate = newDate;
            interview.proposedTime = newTime;
            interview.rescheduleReason = reason;
            interview.rescheduleStatus = 'PROPOSED';
        } else {
            interview.rescheduleRequestedBy = 'jobseeker';
            interview.rescheduleRequestedAt = new Date();
            interview.requestedDate = newDate;
            interview.requestedTime = newTime;
            interview.rescheduleReason = reason;
            interview.rescheduleStatus = 'PENDING';
        }

        await interview.save();

        const jobTitle = interview.jobId?.title || 'Interview';
        const otherId = isRec ? interview.seekerId : interview.recruiterId;
        await createNotification({
            recipient: otherId,
            type: 'reschedule_requested',
            category: 'interview',
            title: 'Reschedule requested',
            message: `${isRec ? 'The recruiter' : 'The candidate'} requested a new time for ${jobTitle}.`,
            link: isRec ? '/seeker/calendar' : '/recruiter/calendar',
            sender: userId,
            metadata: interviewCalendarMetadata(interview, {
                applicationId: interview.applicationId,
                interviewDate: newDate,
                scheduledAt: combineDateAndTimeNepal(newDate, newTime)
            })
        });

        res.json({ success: true, message: 'Reschedule request sent' });
    } catch (e) {
        console.error('requestInterviewReschedule', e);
        res.status(500).json({ message: 'Failed to request reschedule' });
    }
};

export const acceptInterviewReschedule = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const role = normalizeSeekerRole(req.user.role);
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid interview id' });
    }

    try {
        const interview = await Interview.findById(id).populate('jobId', 'title');
        if (!interview) return res.status(404).json({ message: 'Interview not found' });

        const isRec = interview.recruiterId.toString() === userId;
        const isSeek = interview.seekerId.toString() === userId;
        if (!isRec && !isSeek) return res.status(403).json({ message: 'Unauthorized' });

        const wf = String(interview.workflowRescheduleStatus || RESCHEDULE_FSM.NONE).toLowerCase();
        if (wf === RESCHEDULE_FSM.PENDING || wf === RESCHEDULE_FSM.COUNTERED) {
            return res.status(400).json({
                message: 'Use Accept / Decline / Counter in the calendar for this reschedule request.'
            });
        }

        const rq = interview.rescheduleRequest;
        if (!rq || !rq.newDate) {
            return res.status(400).json({ message: 'No pending reschedule request on this interview' });
        }

        const proposer = rq.proposedBy;
        if (proposer === 'recruiter' && !isSeek) {
            return res.status(403).json({ message: 'Only the candidate can accept this reschedule request' });
        }
        if (proposer === 'jobseeker' && !isRec) {
            return res.status(403).json({ message: 'Only the recruiter can accept this reschedule request' });
        }
        if ((proposer === 'recruiter' && role !== 'jobseeker') || (proposer === 'jobseeker' && role !== 'recruiter')) {
            return res.status(403).json({ message: 'You cannot accept your own reschedule request' });
        }

        const pastCheck = assertSlotNotInPast(rq.newDate, rq.newTime);
        if (!pastCheck.ok) return res.status(400).json({ message: pastCheck.message });

        interview.date = rq.newDate;
        interview.time = rq.newTime;
        interview.calendarStatus = 'scheduled';
        interview.interviewStatus = 'scheduled';
        interview.acceptedBySeeker = true;
        interview.acceptedByRecruiter = true;
        interview.status = 'Scheduled';
        interview.set('rescheduleRequest', undefined);
        interview.rescheduleStatus = 'NONE';
        interview.proposedDate = undefined;
        interview.proposedTime = undefined;
        interview.requestedDate = undefined;
        interview.requestedTime = undefined;

        if (interview.mode === 'Online' && !interview.roomId) {
            interview.roomId = `interview_${interview.applicationId}_${Date.now()}`;
        }

        await interview.save();
        await syncApplicationInterviewSlot(interview);

        const jobTitle = interview.jobId?.title || 'Interview';
        const metaAfter = interviewCalendarMetadata(interview, {
            applicationId: interview.applicationId,
            scheduledAt: combineDateAndTimeNepal(interview.date, interview.time)
        });
        await createNotification({
            recipient: interview.recruiterId,
            type: 'interview_rescheduled',
            category: 'interview',
            title: 'Reschedule accepted',
            message: `The new interview time for ${jobTitle} is confirmed.`,
            link: '/recruiter/calendar',
            sender: userId,
            metadata: metaAfter
        });
        await createNotification({
            recipient: interview.seekerId,
            type: 'interview_rescheduled',
            category: 'interview',
            title: 'Reschedule accepted',
            message: `The new interview time for ${jobTitle} is confirmed.`,
            link: '/seeker/calendar',
            sender: userId,
            metadata: metaAfter
        });

        res.json({ success: true, message: 'Reschedule accepted' });
    } catch (e) {
        console.error('acceptInterviewReschedule', e);
        res.status(500).json({ message: 'Failed to accept reschedule' });
    }
};

export const completeInterview = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    if (req.user.role !== 'recruiter') {
        return res.status(403).json({ message: 'Only recruiters can mark interviews complete' });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid interview id' });
    }

    try {
        const interview = await Interview.findById(id).populate('jobId', 'title');
        if (!interview) return res.status(404).json({ message: 'Interview not found' });
        if (interview.recruiterId.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const cal = deriveCalendarStatus(interview);
        if (cal !== 'scheduled' || interview.status !== 'Scheduled') {
            return res.status(400).json({ message: 'Only scheduled interviews can be marked complete' });
        }

        interview.status = 'Completed';
        interview.calendarStatus = 'completed';
        interview.completedAt = new Date();
        await interview.save();

        const jobTitle = interview.jobId?.title || 'Interview';
        await createNotification({
            recipient: interview.seekerId,
            type: 'interview_completed',
            category: 'interview',
            title: 'Interview completed',
            message: `Your interview for ${jobTitle} has been marked as completed.`,
            link: '/seeker/calendar',
            sender: userId,
            metadata: interviewCalendarMetadata(interview, { applicationId: interview.applicationId })
        });

        res.json({ success: true, message: 'Interview marked complete' });
    } catch (e) {
        console.error('completeInterview', e);
        res.status(500).json({ message: 'Failed to complete interview' });
    }
};

export const cancelInterview = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const cancelReason = String(req.body.cancel_reason ?? req.body.cancelReason ?? '').trim();

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid interview id' });
    }

    try {
        const interview = await Interview.findById(id).populate('jobId', 'title');
        if (!interview) return res.status(404).json({ message: 'Interview not found' });

        const isRec = interview.recruiterId.toString() === userId;
        const isSeek = interview.seekerId.toString() === userId;
        if (!isRec && !isSeek) return res.status(403).json({ message: 'Unauthorized' });

        const cal = deriveCalendarStatus(interview);
        if (cal === 'completed' || interview.status === 'Completed') {
            return res.status(400).json({ message: 'Cannot cancel a completed interview' });
        }
        if (cal === 'cancelled' || interview.status === 'Cancelled') {
            return res.status(400).json({ message: 'Interview is already cancelled' });
        }

        interview.status = 'Cancelled';
        interview.calendarStatus = 'cancelled';
        interview.cancelledBy = userId;
        interview.cancelReason = cancelReason;
        interview.cancelledAt = new Date();
        interview.set('rescheduleRequest', undefined);
        interview.rescheduleStatus = 'NONE';
        clearActiveRescheduleWorkflowScalars(interview);

        await interview.save();

        const otherId = isRec ? interview.seekerId : interview.recruiterId;
        const jobTitle = interview.jobId?.title || 'Interview';
        await createNotification({
            recipient: otherId,
            type: 'interview_cancelled',
            category: 'interview',
            title: 'Interview cancelled',
            message: `${isRec ? 'The recruiter' : 'The candidate'} cancelled the interview for ${jobTitle}.`,
            link: isRec ? '/seeker/calendar' : '/recruiter/calendar',
            sender: userId,
            metadata: interviewCalendarMetadata(interview, { applicationId: interview.applicationId })
        });

        res.json({ success: true, message: 'Interview cancelled' });
    } catch (e) {
        console.error('cancelInterview', e);
        res.status(500).json({ message: 'Failed to cancel interview' });
    }
};

export const recordInterviewCallEvent = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const event = String(req.body?.event || '').trim().toLowerCase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid interview id' });
    }
    if (event !== 'joined' && event !== 'left') {
        return res.status(400).json({ message: 'event must be "joined" or "left"' });
    }

    try {
        const interview = await Interview.findById(id).populate('jobId', 'title');
        if (!interview) return res.status(404).json({ message: 'Interview not found' });

        const isRecruiter = interview.recruiterId.toString() === userId;
        const isSeeker = interview.seekerId.toString() === userId;
        if (!isRecruiter && !isSeeker) return res.status(403).json({ message: 'Unauthorized' });

        if (String(interview.mode || '').toLowerCase() !== 'online') {
            return res.json({ success: true, skipped: true, reason: 'not_online_mode' });
        }
        if (interview.status !== 'Scheduled') {
            return res.json({ success: true, skipped: true, reason: 'not_scheduled' });
        }

        const now = new Date();
        if (event === 'joined') {
            if (isRecruiter) interview.recruiterJoinedAt = interview.recruiterJoinedAt || now;
            if (isSeeker) {
                interview.seekerJoinedAt = interview.seekerJoinedAt || now;
                interview.joined = true;
            }
        } else {
            if (isRecruiter) interview.recruiterLeftAt = now;
            if (isSeeker) interview.seekerLeftAt = now;
            interview.callEndedAt = now;
        }

        await interview.save();
        const completed = await autoCompleteInterviewAfterCall(interview, userId);
        return res.json({ success: true, completed });
    } catch (e) {
        console.error('recordInterviewCallEvent', e);
        return res.status(500).json({ message: 'Failed to record call event' });
    }
};
