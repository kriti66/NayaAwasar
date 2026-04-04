import mongoose from 'mongoose';
import Interview from '../models/Interview.js';
import Application from '../models/Application.js';
import { combineDateAndTimeNepal, NEPAL_OFFSET_MS } from '../utils/interviewDateTime.js';
import { createNotification } from './notificationController.js';
import {
    MAX_RESCHEDULE_ROUNDS,
    RESCHEDULE_EXPIRY_HOURS,
    RESCHEDULE_FSM
} from '../constants/reschedule.js';

const CLEAN_STATES = new Set([
    RESCHEDULE_FSM.NONE,
    RESCHEDULE_FSM.ACCEPTED,
    RESCHEDULE_FSM.REJECTED,
    RESCHEDULE_FSM.EXPIRED
]);

const ACTIVE_STATES = new Set([RESCHEDULE_FSM.PENDING, RESCHEDULE_FSM.COUNTERED]);

function getExpiryDate() {
    return new Date(Date.now() + RESCHEDULE_EXPIRY_HOURS * 60 * 60 * 1000);
}

function userRoleOnInterview(interview, userId) {
    if (interview.recruiterId.toString() === userId) return 'recruiter';
    if (interview.seekerId.toString() === userId) return 'jobseeker';
    return null;
}

function currentSlotInstant(interview) {
    return combineDateAndTimeNepal(interview.date, interview.time);
}

function applyInstantToInterviewSlot(interview, instant) {
    const ms = instant.getTime() + NEPAL_OFFSET_MS;
    const u = new Date(ms);
    const y = u.getUTCFullYear();
    const mo = u.getUTCMonth();
    const day = u.getUTCDate();
    const h = u.getUTCHours();
    const mi = u.getUTCMinutes();
    interview.date = new Date(Date.UTC(y, mo, day));
    interview.time = `${h}:${String(mi).padStart(2, '0')}`;
}

function parseProposedInstant(req) {
    const body = req.body || {};
    if (body.proposedDateTime) {
        const d = new Date(body.proposedDateTime);
        if (Number.isNaN(d.getTime())) return { error: 'Invalid proposedDateTime' };
        return { instant: d };
    }
    const newDate = body.new_date ?? body.newDate;
    const newTime = body.new_time ?? body.newTime;
    if (!newDate || !newTime) {
        return { error: 'Provide proposedDateTime (ISO) or new_date and new_time' };
    }
    const slot = combineDateAndTimeNepal(new Date(newDate), String(newTime).trim());
    if (!slot) return { error: 'Invalid date or time' };
    return { instant: slot };
}

function assertFutureSlot(instant) {
    if (instant.getTime() <= Date.now()) {
        return { ok: false, message: 'Proposed time must be in the future' };
    }
    return { ok: true };
}

function pushWorkflowHistory(interview, entry) {
    interview.workflowRescheduleHistory = interview.workflowRescheduleHistory || [];
    interview.workflowRescheduleHistory.push(entry);
}

async function syncApplicationFromInterview(interview) {
    if (!interview?.applicationId) return;
    await Application.updateOne(
        { _id: interview.applicationId },
        {
            $set: {
                'interview.date': interview.date,
                'interview.time': interview.time,
                'interview.mode': interview.mode,
                'interview.roomId': interview.roomId,
                'interview.location': interview.location
            }
        }
    );
}

function resetWorkflowFields(interview) {
    interview.workflowRescheduleStatus = RESCHEDULE_FSM.NONE;
    interview.workflowRescheduleRequestedBy = null;
    interview.workflowProposedDateTime = null;
    interview.workflowCounterProposedDateTime = null;
    interview.workflowRescheduleExpiresAt = null;
    interview.workflowRescheduleNote = '';
    interview.workflowRescheduleRoundCount = 0;
}

async function loadInterviewForUser(req, res) {
    const { interviewId } = req.params;
    const userId = req.user.id;
    if (!mongoose.Types.ObjectId.isValid(interviewId)) {
        res.status(400).json({ message: 'Invalid interview id' });
        return null;
    }
    const interview = await Interview.findById(interviewId).populate('jobId', 'title');
    if (!interview) {
        res.status(404).json({ message: 'Interview not found' });
        return null;
    }
    const role = userRoleOnInterview(interview, userId);
    if (!role) {
        res.status(403).json({ message: 'Unauthorized' });
        return null;
    }
    if (['Completed', 'Cancelled', 'Missed'].includes(interview.status)) {
        res.status(400).json({ message: 'Interview cannot be rescheduled in this state' });
        return null;
    }
    return { interview, role, userId };
}

/**
 * POST — propose a new time (no active workflow request).
 */
export const requestReschedule = async (req, res) => {
    const loaded = await loadInterviewForUser(req, res);
    if (!loaded) return;
    const { interview, role, userId } = loaded;

    const wf = interview.workflowRescheduleStatus || RESCHEDULE_FSM.NONE;
    if (!CLEAN_STATES.has(wf)) {
        return res.status(409).json({ message: 'A reschedule request is already active' });
    }
    if (interview.workflowRescheduleRoundCount >= MAX_RESCHEDULE_ROUNDS) {
        return res.status(400).json({ message: 'Maximum reschedule rounds reached' });
    }

    const parsed = parseProposedInstant(req);
    if (parsed.error) return res.status(400).json({ message: parsed.error });
    const { instant } = parsed;
    const fut = assertFutureSlot(instant);
    if (!fut.ok) return res.status(400).json({ message: fut.message });

    const note = String(req.body?.note ?? req.body?.reason ?? '').trim();
    const prev = currentSlotInstant(interview);
    const nextRound = (interview.workflowRescheduleRoundCount || 0) + 1;

    interview.workflowRescheduleStatus = RESCHEDULE_FSM.PENDING;
    interview.workflowRescheduleRequestedBy = role;
    interview.workflowProposedDateTime = instant;
    interview.workflowCounterProposedDateTime = null;
    interview.workflowRescheduleExpiresAt = getExpiryDate();
    interview.workflowRescheduleNote = note;
    interview.workflowRescheduleRoundCount = nextRound;

    pushWorkflowHistory(interview, {
        round: nextRound,
        proposedBy: role,
        previousScheduledAt: prev || null,
        newProposedAt: instant,
        note,
        action: 'proposed',
        at: new Date()
    });

    interview.calendarStatus = 'reschedule_requested';
    interview.interviewStatus = 'reschedule_pending';

    const otherId = role === 'recruiter' ? interview.seekerId : interview.recruiterId;
    const jobTitle = interview.jobId?.title || 'Interview';
    await createNotification({
        recipient: otherId,
        type: 'reschedule_requested',
        category: 'interview',
        title: 'Reschedule requested',
        message: `A new interview time was proposed for ${jobTitle}. Please respond in your calendar.`,
        link: role === 'recruiter' ? '/seeker/calendar' : '/recruiter/calendar',
        sender: userId,
        metadata: {
            interviewId: String(interview._id),
            interview_date: interview.date
                ? `${interview.date.getUTCFullYear()}-${String(interview.date.getUTCMonth() + 1).padStart(2, '0')}-${String(interview.date.getUTCDate()).padStart(2, '0')}`
                : undefined
        }
    });

    await interview.save();
    res.json({ success: true, message: 'Reschedule requested', interview });
};

/**
 * POST — accept the current proposal (responder only).
 */
export const acceptReschedule = async (req, res) => {
    const loaded = await loadInterviewForUser(req, res);
    if (!loaded) return;
    const { interview, role, userId } = loaded;

    const wf = interview.workflowRescheduleStatus || RESCHEDULE_FSM.NONE;
    if (!ACTIVE_STATES.has(wf)) {
        return res.status(400).json({ message: 'No pending reschedule to accept' });
    }
    if (interview.workflowRescheduleRequestedBy === role) {
        return res.status(403).json({ message: 'You cannot accept your own reschedule proposal' });
    }
    if (!interview.workflowProposedDateTime) {
        return res.status(400).json({ message: 'Missing proposed time' });
    }

    const prev = currentSlotInstant(interview);
    const proposed = interview.workflowProposedDateTime;
    applyInstantToInterviewSlot(interview, proposed);

    if (interview.mode === 'Online' && !interview.roomId) {
        interview.roomId = `interview_${interview.applicationId}_${Date.now()}`;
    }

    pushWorkflowHistory(interview, {
        round: interview.workflowRescheduleRoundCount || 1,
        proposedBy: interview.workflowRescheduleRequestedBy,
        previousScheduledAt: prev || null,
        newProposedAt: proposed,
        note: interview.workflowRescheduleNote || '',
        action: 'accepted',
        at: new Date()
    });

    resetWorkflowFields(interview);
    interview.calendarStatus = 'scheduled';
    interview.interviewStatus = 'scheduled';
    interview.acceptedBySeeker = true;
    interview.acceptedByRecruiter = true;

    await interview.save();
    await syncApplicationFromInterview(interview);

    const otherId = role === 'recruiter' ? interview.seekerId : interview.recruiterId;
    const jobTitle = interview.jobId?.title || 'Interview';
    await createNotification({
        recipient: otherId,
        type: 'interview_rescheduled',
        category: 'interview',
        title: 'Reschedule confirmed',
        message: `The interview for ${jobTitle} was moved to the agreed time.`,
        link: role === 'recruiter' ? '/seeker/calendar' : '/recruiter/calendar',
        sender: userId,
        metadata: { interviewId: String(interview._id) }
    });

    res.json({ success: true, message: 'Reschedule accepted', interview });
};

/**
 * POST — reject proposal; keep original slot.
 */
export const rejectReschedule = async (req, res) => {
    const loaded = await loadInterviewForUser(req, res);
    if (!loaded) return;
    const { interview, role, userId } = loaded;

    const wf = interview.workflowRescheduleStatus || RESCHEDULE_FSM.NONE;
    if (!ACTIVE_STATES.has(wf)) {
        return res.status(400).json({ message: 'No pending reschedule to reject' });
    }
    if (interview.workflowRescheduleRequestedBy === role) {
        return res.status(403).json({ message: 'You cannot reject your own proposal' });
    }

    pushWorkflowHistory(interview, {
        round: interview.workflowRescheduleRoundCount || 1,
        proposedBy: interview.workflowRescheduleRequestedBy,
        previousScheduledAt: currentSlotInstant(interview) || null,
        newProposedAt: interview.workflowProposedDateTime || new Date(),
        note: interview.workflowRescheduleNote || '',
        action: 'rejected',
        at: new Date()
    });

    resetWorkflowFields(interview);
    interview.calendarStatus = 'scheduled';
    interview.interviewStatus = 'scheduled';

    await interview.save();

    const otherId = role === 'recruiter' ? interview.seekerId : interview.recruiterId;
    const jobTitle = interview.jobId?.title || 'Interview';
    await createNotification({
        recipient: otherId,
        type: 'reschedule_rejected',
        category: 'interview',
        title: 'Reschedule declined',
        message: `Your reschedule request for ${jobTitle} was declined. The original time remains.`,
        link: role === 'recruiter' ? '/seeker/calendar' : '/recruiter/calendar',
        sender: userId,
        metadata: { interviewId: String(interview._id) }
    });

    res.json({ success: true, message: 'Reschedule rejected', interview });
};

/**
 * POST — counter with a different time (responder only).
 */
export const counterReschedule = async (req, res) => {
    const loaded = await loadInterviewForUser(req, res);
    if (!loaded) return;
    const { interview, role, userId } = loaded;

    const wf = interview.workflowRescheduleStatus || RESCHEDULE_FSM.NONE;
    if (!ACTIVE_STATES.has(wf)) {
        return res.status(400).json({ message: 'No pending reschedule to counter' });
    }
    if (interview.workflowRescheduleRequestedBy === role) {
        return res.status(403).json({ message: 'You cannot counter your own proposal' });
    }
    if (interview.workflowRescheduleRoundCount >= MAX_RESCHEDULE_ROUNDS) {
        return res.status(400).json({
            message: 'Maximum reschedule rounds reached. Please accept or decline the current proposal.'
        });
    }

    const parsed = parseProposedInstant(req);
    if (parsed.error) return res.status(400).json({ message: parsed.error });
    const { instant } = parsed;
    const fut = assertFutureSlot(instant);
    if (!fut.ok) return res.status(400).json({ message: fut.message });

    const note = String(req.body?.note ?? req.body?.reason ?? '').trim();
    const oldProposed = interview.workflowProposedDateTime;
    const nextRound = (interview.workflowRescheduleRoundCount || 0) + 1;

    interview.workflowCounterProposedDateTime = oldProposed || null;
    interview.workflowProposedDateTime = instant;
    interview.workflowRescheduleStatus = RESCHEDULE_FSM.COUNTERED;
    interview.workflowRescheduleRequestedBy = role;
    interview.workflowRescheduleExpiresAt = getExpiryDate();
    interview.workflowRescheduleNote = note;
    interview.workflowRescheduleRoundCount = nextRound;

    pushWorkflowHistory(interview, {
        round: nextRound,
        proposedBy: role,
        previousScheduledAt: currentSlotInstant(interview) || null,
        newProposedAt: instant,
        note,
        action: 'countered',
        at: new Date()
    });

    const otherId = role === 'recruiter' ? interview.seekerId : interview.recruiterId;
    const jobTitle = interview.jobId?.title || 'Interview';
    await createNotification({
        recipient: otherId,
        type: 'reschedule_requested',
        category: 'interview',
        title: 'Counter proposal',
        message: `A different time was proposed for ${jobTitle}. Please review in your calendar.`,
        link: role === 'recruiter' ? '/seeker/calendar' : '/recruiter/calendar',
        sender: userId,
        metadata: { interviewId: String(interview._id) }
    });

    await interview.save();
    res.json({ success: true, message: 'Counter proposal sent', interview });
};

/**
 * POST — requester withdraws pending/countered workflow.
 */
export const cancelRescheduleRequest = async (req, res) => {
    const loaded = await loadInterviewForUser(req, res);
    if (!loaded) return;
    const { interview, role, userId } = loaded;

    const wf = interview.workflowRescheduleStatus || RESCHEDULE_FSM.NONE;
    if (!ACTIVE_STATES.has(wf)) {
        return res.status(400).json({ message: 'No active reschedule request to cancel' });
    }
    if (interview.workflowRescheduleRequestedBy !== role) {
        return res.status(403).json({ message: 'Only the requester can cancel this reschedule request' });
    }

    pushWorkflowHistory(interview, {
        round: interview.workflowRescheduleRoundCount || 1,
        proposedBy: role,
        previousScheduledAt: currentSlotInstant(interview) || null,
        newProposedAt: interview.workflowProposedDateTime || new Date(),
        note: interview.workflowRescheduleNote || '',
        action: 'cancelled',
        at: new Date()
    });

    resetWorkflowFields(interview);
    interview.calendarStatus = 'scheduled';
    interview.interviewStatus = 'scheduled';

    await interview.save();

    const otherId = role === 'recruiter' ? interview.seekerId : interview.recruiterId;
    const jobTitle = interview.jobId?.title || 'Interview';
    await createNotification({
        recipient: otherId,
        type: 'interview_update',
        category: 'interview',
        title: 'Reschedule request withdrawn',
        message: `The reschedule request for ${jobTitle} was withdrawn. The original time remains.`,
        link: role === 'recruiter' ? '/seeker/calendar' : '/recruiter/calendar',
        sender: userId,
        metadata: { interviewId: String(interview._id) }
    });

    res.json({ success: true, message: 'Reschedule request cancelled', interview });
};

/**
 * Called from cron: expire stale workflow rows.
 */
export async function expireStaleRescheduleWorkflows() {
    const now = new Date();
    const filter = {
        workflowRescheduleStatus: { $in: [RESCHEDULE_FSM.PENDING, RESCHEDULE_FSM.COUNTERED] },
        workflowRescheduleExpiresAt: { $lt: now }
    };

    const stale = await Interview.find(filter).populate('jobId', 'title');
    for (const interview of stale) {
        pushWorkflowHistory(interview, {
            round: interview.workflowRescheduleRoundCount || 1,
            proposedBy: interview.workflowRescheduleRequestedBy || 'recruiter',
            previousScheduledAt: currentSlotInstant(interview) || null,
            newProposedAt: interview.workflowProposedDateTime || new Date(),
            note: interview.workflowRescheduleNote || '',
            action: 'expired',
            at: new Date()
        });

        resetWorkflowFields(interview);
        interview.calendarStatus = 'scheduled';
        interview.interviewStatus = 'scheduled';

        const jobTitle = interview.jobId?.title || 'Interview';
        const meta = { interviewId: String(interview._id) };

        await createNotification({
            recipient: interview.recruiterId,
            type: 'interview_update',
            category: 'interview',
            title: 'Reschedule request expired',
            message: `The reschedule request for ${jobTitle} expired. The original interview time remains.`,
            link: '/recruiter/calendar',
            metadata: meta
        });
        await createNotification({
            recipient: interview.seekerId,
            type: 'interview_update',
            category: 'interview',
            title: 'Reschedule request expired',
            message: `The reschedule request for ${jobTitle} expired. The original interview time remains.`,
            link: '/seeker/calendar',
            metadata: meta
        });

        await interview.save();
    }

    return stale.length;
}
