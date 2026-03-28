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
    const rawRole = String(jwtRole || '').trim();
    const set = new Set([composite, id]);
    if (rawRole && rawRole !== suffix) {
        set.add(`${id}_${rawRole}`);
    }
    return set;
}

/**
 * Combine stored calendar date + wall-clock time into one instant.
 * Default: UTC calendar day from `date` + time (typical for ISO date strings / Mongo UTC midnight).
 * Set ZEGO_SCHEDULE_USE_LOCAL_DATE=1 to use server-local calendar components instead.
 */
function buildSlotFromDateAndTime(dateValue, timeStr) {
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return null;

    const parts = String(timeStr || '0:0').split(':');
    const hh = parseInt(parts[0], 10);
    const mm = parseInt(parts[1], 10);
    const ss = parseInt(parts[2], 10);
    const h = Number.isFinite(hh) ? hh : 0;
    const m = Number.isFinite(mm) ? mm : 0;
    const s = Number.isFinite(ss) ? ss : 0;

    const useLocal = String(process.env.ZEGO_SCHEDULE_USE_LOCAL_DATE || '').trim() === '1';
    if (useLocal) {
        return new Date(
            d.getFullYear(),
            d.getMonth(),
            d.getDate(),
            h,
            m,
            s,
            0
        );
    }
    return new Date(
        Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), h, m, s, 0)
    );
}

/**
 * Effective slot: recruiter proposal with proposed date/time, else interview.startTime, else date+time.
 */
function getEffectiveInterviewDateTime(interview) {
    if (interview.startTime) {
        const st = new Date(interview.startTime);
        if (!Number.isNaN(st.getTime())) return st;
    }

    const rs = String(interview.rescheduleStatus || '').toUpperCase();
    const reschedulePending =
        interview.interviewStatus === 'reschedule_pending' &&
        interview.proposedDate &&
        interview.proposedTime &&
        ['PROPOSED', 'PENDING'].includes(rs);

    if (reschedulePending) {
        const slot = buildSlotFromDateAndTime(interview.proposedDate, interview.proposedTime);
        if (slot) return slot;
    }

    return buildSlotFromDateAndTime(interview.date, interview.time);
}

function parseTokenBody(req) {
    const b = req.body && typeof req.body === 'object' ? req.body : {};
    const uid = String(b.userID ?? b.userId ?? b.user_id ?? '').trim();
    const rid = String(b.roomID ?? b.roomId ?? b.room_id ?? '').trim();
    return { uid, rid, raw: b };
}

function logZegoEnv() {
    const rawApp = process.env.ZEGO_APP_ID;
    const rawSecret = process.env.ZEGO_SERVER_SECRET;
    const appPresent = rawApp != null && String(rawApp).trim() !== '';
    const secretPresent = rawSecret != null && String(rawSecret).trim() !== '';
    const appParsed = Number(String(rawApp || '').trim());
    console.log('[Zego] env:', {
        ZEGO_APP_ID_present: appPresent,
        ZEGO_APP_ID_numeric: Number.isInteger(appParsed) && appParsed > 0,
        ZEGO_SERVER_SECRET_present: secretPresent,
        ZEGO_SERVER_SECRET_length: secretPresent ? String(rawSecret).trim().length : 0
    });
}

export const generateZegoToken = async (req, res) => {
    const jwtUserId = String(req.user.id || '').trim();
    const jwtRole = req.user.role;

    const parsedBody = parseTokenBody(req);
    console.log('[Zego] POST /token body:', {
        keys: Object.keys(parsedBody.raw || {}),
        parsedUserID: parsedBody.uid || null,
        parsedRoomID: parsedBody.rid || null
    });

    logZegoEnv();

    const { uid: userIdRaw, rid: roomIdRaw } = parsedBody;

    if (!userIdRaw || !roomIdRaw) {
        console.log('[Zego] reject: missing userID or roomID', {
            parsedUserId: userIdRaw || null,
            parsedRoomId: roomIdRaw || null
        });
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
        let lookupPath = interview ? 'roomId' : null;

        if (!interview && mongoose.Types.ObjectId.isValid(roomIdRaw)) {
            interview = await Interview.findById(roomIdRaw);
            lookupPath = interview ? 'interviewId' : null;
        }

        if (!interview) {
            console.log('[Zego] reject: interview not found for room lookup', { roomIdRaw });
            return res.status(404).json({
                code: 'ZEGO_INTERVIEW_NOT_FOUND',
                message: 'No interview matches this room ID.',
                details: { roomID: roomIdRaw }
            });
        }

        console.log('[Zego] interview resolved', {
            lookupPath,
            interviewId: String(interview._id),
            storedRoomId: interview.roomId || null,
            status: interview.status,
            interviewStatus: interview.interviewStatus,
            mode: interview.mode
        });

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
            console.log('[Zego] reject: interview status', { status: interview.status });
            return res.status(403).json({
                code: 'ZEGO_INTERVIEW_NOT_SCHEDULED',
                message: `This interview is ${interview.status} and cannot be joined.`,
                details: { status: interview.status }
            });
        }

        if (String(interview.mode || '').toLowerCase() !== 'online') {
            console.log('[Zego] reject: not online interview', { mode: interview.mode });
            return res.status(400).json({
                code: 'ZEGO_NOT_ONLINE',
                message: 'Video token is only available for online interviews.',
                details: { mode: interview.mode }
            });
        }

        const scheduledTime = getEffectiveInterviewDateTime(interview);
        if (!scheduledTime || Number.isNaN(scheduledTime.getTime())) {
            console.log('[Zego] reject: could not parse schedule', {
                date: interview.date,
                time: interview.time,
                proposedDate: interview.proposedDate,
                proposedTime: interview.proposedTime,
                startTime: interview.startTime
            });
            return res.status(400).json({
                code: 'ZEGO_INVALID_SCHEDULE',
                message: 'Interview date or time is invalid; cannot verify join window.',
                details: {
                    date: interview.date,
                    time: interview.time
                }
            });
        }

        const now = new Date();
        const earlyMin = parseInt(process.env.ZEGO_EARLY_JOIN_MINUTES || '10', 10);
        const lateMin = parseInt(process.env.ZEGO_LATE_JOIN_MINUTES || '60', 10);
        const earlyMs = (Number.isFinite(earlyMin) ? earlyMin : 10) * 60 * 1000;
        const lateMs = (Number.isFinite(lateMin) ? lateMin : 60) * 60 * 1000;

        const startWindow = new Date(scheduledTime.getTime() - earlyMs);
        const endWindow = new Date(scheduledTime.getTime() + lateMs);

        const windowMeta = {
            now: now.toISOString(),
            scheduledTime: scheduledTime.toISOString(),
            startWindow: startWindow.toISOString(),
            endWindow: endWindow.toISOString(),
            earlyJoinMinutes: earlyMs / 60000,
            lateJoinMinutes: lateMs / 60000,
            scheduleUsesLocalCalendar: String(process.env.ZEGO_SCHEDULE_USE_LOCAL_DATE || '').trim() === '1',
            interviewTimezone: interview.timezone || null
        };

        if (now < startWindow) {
            console.log('[Zego] reject: join too early', windowMeta);
            return res.status(400).json({
                code: 'ZEGO_JOIN_TOO_EARLY',
                message: `You can join up to ${earlyMs / 60000} minutes before the scheduled interview time.`,
                details: {
                    ...windowMeta,
                    canJoinAfter: startWindow.toISOString()
                }
            });
        }
        if (now > endWindow) {
            console.log('[Zego] reject: join too late', windowMeta);
            return res.status(400).json({
                code: 'ZEGO_JOIN_TOO_LATE',
                message: 'This interview time slot has ended for video join.',
                details: {
                    ...windowMeta,
                    expiredAt: endWindow.toISOString()
                }
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

        console.log('[Zego] token OK', {
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
            code: 'ZEGO_INTERNAL',
            message: error?.errorMessage || 'Failed to generate video token',
            details: process.env.NODE_ENV !== 'production' ? { stack: error?.stack } : undefined
        });
    }
};
