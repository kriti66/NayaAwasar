import Interview from '../models/Interview.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { createRequire } from 'module';
import { getInterviewJoinWindow } from '../utils/interviewDateTime.js';

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
    const rawRole = String(jwtRole || '').trim();
    const set = new Set([composite, id]);
    if (rawRole && rawRole !== suffix) {
        set.add(`${id}_${rawRole}`);
    }
    return set;
}

function parseTokenBody(req) {
    const b = req.body && typeof req.body === 'object' ? req.body : {};
    const uid = String(b.userID ?? b.userId ?? b.user_id ?? '').trim();
    const rid = String(b.roomID ?? b.roomId ?? b.room_id ?? '').trim();
    return { uid, rid, raw: b };
}

export const generateZegoToken = async (req, res) => {
    const jwtUserId = String(req.user.id || '').trim();
    const jwtRole = req.user.role;

    const parsedBody = parseTokenBody(req);
    const { uid: userIdRaw, rid: roomIdRaw } = parsedBody;

    if (!userIdRaw || !roomIdRaw) {
        return res.status(400).json({
            code: 'ZEGO_MISSING_FIELDS',
            message: 'userID and roomID are required in the request body.',
            details: {
                hint: 'Send JSON like { "userID": "<id>_<role>", "roomID": "<room>" } or camelCase userId / roomId.',
                receivedKeys: req.body && typeof req.body === 'object' ? Object.keys(req.body) : []
            }
        });
    }

    const allowedIds = expectedZegoUserIds(jwtUserId, jwtRole);
    if (!allowedIds.has(userIdRaw)) {
        console.warn('[Zego] reject: userID mismatch', {
            bodyUserId: userIdRaw,
            jwtUserId,
            jwtRole,
            allowed: [...allowedIds]
        });
        return res.status(400).json({
            code: 'ZEGO_USERID_MISMATCH',
            message: 'userID does not match the signed-in account.',
            details: {
                hint: `Expected one of: ${[...allowedIds].join(', ')} (composite uses role suffix, e.g. recruiter or jobseeker).`,
                jwtUserId,
                jwtRole
            }
        });
    }

    const zegoUserId = userIdRaw;

    try {
        let interview = await Interview.findOne({ roomId: roomIdRaw });

        if (!interview && mongoose.Types.ObjectId.isValid(roomIdRaw)) {
            interview = await Interview.findById(roomIdRaw);
        }

        if (!interview) {
            return res.status(404).json({
                code: 'ZEGO_INTERVIEW_NOT_FOUND',
                message: 'No interview matches this room ID.',
                details: { roomID: roomIdRaw }
            });
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
            console.log('[Zego] reject: not a participant', {
                jwtUserId,
                seekerId: interview.seekerId?.toString(),
                interviewRecruiterId: interview.recruiterId?.toString(),
                jobRecruiterId
            });
            return res.status(403).json({
                code: 'ZEGO_NOT_PARTICIPANT',
                message: 'You are not allowed to join this interview room.'
            });
        }

        if (interview.status !== 'Scheduled') {
            return res.status(403).json({
                code: 'ZEGO_INTERVIEW_NOT_SCHEDULED',
                message: `This interview is ${interview.status} and cannot be joined.`,
                details: { status: interview.status }
            });
        }

        if (String(interview.mode || '').toLowerCase() !== 'online') {
            return res.status(400).json({
                code: 'ZEGO_NOT_ONLINE',
                message: 'Video token is only available for online interviews.',
                details: { mode: interview.mode }
            });
        }

        const win = getInterviewJoinWindow(interview);
        if (!win || !win.scheduledStart || Number.isNaN(win.scheduledStart.getTime())) {
            return res.status(400).json({
                code: 'ZEGO_INVALID_SCHEDULE',
                message: 'Interview date or time is invalid; cannot verify join window.',
                details: {
                    date: interview.date,
                    time: interview.time
                }
            });
        }

        const { scheduledStart: scheduledTime, joinAllowedFrom, joinAllowedUntil } = win;
        const now = new Date();

        if (process.env.NODE_ENV !== 'production') {
            console.log('[Zego] join window debug', {
                interviewId: String(interview._id),
                rawDate: interview.date,
                rawTime: interview.time,
                rawStartTime: interview.startTime,
                parsedStartUtc: scheduledTime.toISOString(),
                joinAllowedFrom: joinAllowedFrom.toISOString(),
                joinAllowedUntil: joinAllowedUntil.toISOString(),
                serverNowUtc: now.toISOString()
            });
        }

        if (now < joinAllowedFrom) {
            if (process.env.NODE_ENV !== 'production') {
                console.log('[Zego] blocked: TOO_EARLY', { interviewId: String(interview._id) });
            }
            const minutesLeft = Math.ceil(
                (joinAllowedFrom.getTime() - now.getTime()) / 60000
            );
            return res.status(400).json({
                success: false,
                code: 'TOO_EARLY',
                message: `You can join in ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}`,
                joinAllowedFrom: joinAllowedFrom.toISOString(),
                scheduledTime: scheduledTime.toISOString()
            });
        }
        if (now > joinAllowedUntil) {
            if (process.env.NODE_ENV !== 'production') {
                console.log('[Zego] blocked: EXPIRED', { interviewId: String(interview._id) });
            }
            return res.status(400).json({
                success: false,
                code: 'EXPIRED',
                message: 'This interview session has expired'
            });
        }

        const user = await User.findById(jwtUserId).select('fullName').lean();
        const userName = user?.fullName || 'User';

        const appId = Number(String(process.env.ZEGO_APP_ID || '').trim());
        const serverSecret = String(process.env.ZEGO_SERVER_SECRET || '').trim();

        if (!Number.isInteger(appId) || appId <= 0) {
            console.error('[Zego] reject: ZEGO_APP_ID missing or invalid');
            return res.status(500).json({
                code: 'ZEGO_CONFIG_APP_ID',
                message: 'Video service is not configured (ZEGO_APP_ID).',
                details: { ZEGO_APP_ID_present: Boolean(process.env.ZEGO_APP_ID) }
            });
        }
        if (!serverSecret) {
            console.error('[Zego] reject: ZEGO_SERVER_SECRET missing');
            return res.status(500).json({
                code: 'ZEGO_CONFIG_SECRET',
                message: 'Video service is not configured (ZEGO_SERVER_SECRET).',
                details: { ZEGO_SERVER_SECRET_present: false }
            });
        }

        if (serverSecret.length !== 32) {
            console.error('[Zego] reject: ZEGO_SERVER_SECRET wrong length', { length: serverSecret.length });
            return res.status(500).json({
                code: 'ZEGO_CONFIG_SECRET_LENGTH',
                message: 'ZEGO_SERVER_SECRET must be exactly 32 characters.',
                details: { length: serverSecret.length }
            });
        }

        const effectiveTimeInSeconds = 3600;
        // Empty payload matches ZEGOCLOUD Call Kit / UIKit web auth docs for server tokens used with
        // generateKitTokenForProduction (room/user are enforced by the kit token + join params).
        const payload = '';

        const token = generateToken04(
            appId,
            zegoUserId,
            serverSecret,
            effectiveTimeInSeconds,
            payload
        );

        res.json({
            success: true,
            appId,
            token,
            roomId: roomIdString,
            userId: zegoUserId,
            userName
        });
    } catch (error) {
        console.error('[Zego Token] Error:', error);
        res.status(500).json({
            code: 'ZEGO_INTERNAL',
            message: error?.errorMessage || 'Failed to generate video token',
            details: process.env.NODE_ENV !== 'production' ? { stack: error?.stack } : undefined
        });
    }
};
