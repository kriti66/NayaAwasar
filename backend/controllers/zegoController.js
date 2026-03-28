import Interview from '../models/Interview.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { generateToken04 } = require('../utils/zegoServerAssistant.cjs');

function normalizeZegoRoleSuffix(role) {
    if (!role) return 'user';
    const r = String(role).toLowerCase();
    if (r === 'job_seeker') return 'jobseeker';
    return r.replace(/[^a-z0-9_-]/gi, '') || 'user';
}

function expectedZegoUserIds(jwtUserId, jwtRole) {
    const id = String(jwtUserId || '').trim();
    const suffix = normalizeZegoRoleSuffix(jwtRole);
    const composite = `${id}_${suffix}`;
    return new Set([composite, id]);
}

/**
 * Effective slot for join window: while a recruiter proposal is pending, use proposed date/time.
 */
function getEffectiveInterviewDateTime(interview) {
    const rs = String(interview.rescheduleStatus || '').toUpperCase();
    const reschedulePending =
        interview.interviewStatus === 'reschedule_pending' &&
        interview.proposedDate &&
        interview.proposedTime &&
        ['PROPOSED', 'PENDING'].includes(rs);

    if (reschedulePending) {
        const d = new Date(interview.proposedDate);
        const parts = String(interview.proposedTime).split(':').map((x) => parseInt(x, 10));
        const hours = Number.isFinite(parts[0]) ? parts[0] : 0;
        const minutes = Number.isFinite(parts[1]) ? parts[1] : 0;
        d.setHours(hours, minutes, 0, 0);
        return d;
    }

    const scheduledTime = new Date(interview.date);
    const timeStr = String(interview.time || '0:0');
    const [hours, minutes] = timeStr.split(':').map((x) => parseInt(x, 10));
    scheduledTime.setHours(Number.isFinite(hours) ? hours : 0, Number.isFinite(minutes) ? minutes : 0, 0, 0);
    return scheduledTime;
}

/**
 * POST /api/zego/token
 * Body: { roomID, userID } — userID must match authenticated user (composite `${id}_${role}` or plain id).
 */
export const generateZegoToken = async (req, res) => {
    const jwtUserId = String(req.user.id || '').trim();
    const jwtRole = req.user.role;
    const { roomID, userID: bodyUserId } = req.body || {};

    const roomIdRaw = String(roomID || '').trim();
    const userIdRaw = String(bodyUserId || '').trim();

    if (!userIdRaw || !roomIdRaw) {
        console.log('[Zego] Missing fields:', { userID: bodyUserId, roomID });
        return res.status(400).json({ message: 'userID and roomID are required' });
    }

    const allowedIds = expectedZegoUserIds(jwtUserId, jwtRole);
    if (!allowedIds.has(userIdRaw)) {
        console.warn('[Zego] userID mismatch JWT user:', { bodyUserId: userIdRaw, jwtUserId, jwtRole });
        return res.status(400).json({
            message: 'userID does not match the signed-in account. Please refresh and try again.'
        });
    }

    const zegoUserId = userIdRaw;

    try {
        let interview = await Interview.findOne({ roomId: roomIdRaw });
        if (!interview && mongoose.Types.ObjectId.isValid(roomIdRaw)) {
            interview = await Interview.findById(roomIdRaw);
        }

        if (!interview) {
            return res.status(404).json({ message: 'Interview not found', roomID: roomIdRaw });
        }

        if (!interview.roomId) {
            interview.roomId = `interview_${interview.applicationId}_${Date.now()}`;
            await interview.save();
        }
        const roomIdString = String(interview.roomId).trim();

        const job = await Job.findById(interview.jobId).select('recruiter_id').lean();
        const jobRecruiterId = job?.recruiter_id ? String(job.recruiter_id) : null;

        const isSeeker = interview.seekerId.toString() === jwtUserId;
        const isInterviewRecruiter = interview.recruiterId.toString() === jwtUserId;
        const isJobOwnerRecruiter = jobRecruiterId && jobRecruiterId === jwtUserId;

        const isRecruiter = isInterviewRecruiter || isJobOwnerRecruiter;

        if (!isRecruiter && !isSeeker) {
            return res.status(403).json({
                message: 'You are not allowed to join this interview room.'
            });
        }

        if (interview.status !== 'Scheduled') {
            return res.status(403).json({
                message: `This interview is ${interview.status} and cannot be joined.`
            });
        }

        const scheduledTime = getEffectiveInterviewDateTime(interview);
        const now = new Date();
        const startWindow = new Date(scheduledTime.getTime() - 10 * 60 * 1000);
        const endWindow = new Date(scheduledTime.getTime() + 60 * 60 * 1000);

        if (now < startWindow) {
            return res.status(400).json({
                message: 'You can join from 10 minutes before the scheduled interview time.',
                canJoinAfter: startWindow
            });
        }
        if (now > endWindow) {
            return res.status(400).json({
                message: 'This interview time slot has ended.',
                expiredAt: endWindow
            });
        }

        const user = await User.findById(jwtUserId).select('fullName').lean();
        const userName = user?.fullName || 'User';

        const appId = Number(String(process.env.ZEGO_APP_ID || '').trim());
        const serverSecret = String(process.env.ZEGO_SERVER_SECRET || '').trim();

        if (!Number.isInteger(appId) || appId <= 0) {
            console.error('[Zego] ZEGO_APP_ID missing or invalid in environment');
            return res.status(500).json({ message: 'Video service is not configured (app id).' });
        }
        if (!serverSecret) {
            console.error('[Zego] ZEGO_SERVER_SECRET missing in environment');
            return res.status(500).json({ message: 'Video service is not configured (secret).' });
        }

        if (serverSecret.length !== 32) {
            return res.status(500).json({
                message: 'Zego server secret must be 32 characters. Check ZEGO_SERVER_SECRET.'
            });
        }

        const effectiveTimeInSeconds = 3600;
        const payload = JSON.stringify({
            room_id: roomIdString,
            privilege: { 1: 1, 2: 1 },
            stream_id_list: null
        });

        const token = generateToken04(
            appId,
            zegoUserId,
            serverSecret,
            effectiveTimeInSeconds,
            payload
        );

        console.log('[Zego Token]', {
            requestedRoom: roomIdRaw,
            resolvedRoomId: roomIdString,
            zegoUserId,
            appId,
            tokenLen: token?.length
        });

        res.json({
            appId,
            token,
            roomId: roomIdString,
            userId: zegoUserId,
            userName
        });
    } catch (error) {
        console.error('[Zego Token] Error:', error);
        res.status(500).json({
            message: error?.errorMessage || 'Failed to generate video token'
        });
    }
};
