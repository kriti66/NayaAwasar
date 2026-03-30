import Interview from '../models/Interview.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { createRequire } from 'module';
import { getInterviewJoinWindow } from '../utils/interviewDateTime.js';

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
