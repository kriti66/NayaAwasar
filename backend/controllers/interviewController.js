import Interview from '../models/Interview.js';
import Application from '../models/Application.js';
import User from '../models/User.js';
import { generateToken04 } from '../utils/zegoToken.js';

// Get token for interview call
export const getZegoToken = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    console.log(`[GET /api/interviews/${id}/zego-token] Request by ${userId}`);

    try {
        let interview;
        if (id.startsWith('interview_')) {
            interview = await Interview.findOne({ roomId: id });
        } else {
            interview = await Interview.findById(id);
        }

        if (!interview) {
            return res.status(404).json({ message: 'Interview not found' });
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
        const appId = Number(process.env.ZEGO_APP_ID);
        const serverSecret = process.env.ZEGO_SERVER_SECRET;
        const userIdString = String(userId);
        const roomIdString = String(interview.roomId);

        // Debug logging
        console.log(`[Zego Token Gen] AppID: ${appId} (Type: ${typeof appId})`);
        console.log(`[Zego Token Gen] UserID: ${userIdString}`);
        console.log(`[Zego Token Gen] RoomID: ${roomIdString}`);
        console.log(`[Zego Token Gen] Secret Length: ${serverSecret ? serverSecret.length : 'MISSING'}`);

        // Validation for missing config
        if (!appId || !serverSecret) {
            console.error("ZEGO_APP_ID or ZEGO_SERVER_SECRET missing in .env");
            return res.status(500).json({ message: 'Server configuration error' });
        }

        if (serverSecret.length !== 32) {
            console.warn(`[WARNING] Zego Server Secret length is ${serverSecret.length}, expected 32. Authentication might fail.`);
        }

        // --- Time Window Access Control ---
        // Combine date and time to get the scheduled interview start time
        const scheduledTime = new Date(interview.date);
        const [hours, minutes] = interview.time.split(':').map(Number);

        // Adjust the scheduled time based on the stored time string
        scheduledTime.setHours(hours);
        scheduledTime.setMinutes(minutes);
        scheduledTime.setSeconds(0);
        scheduledTime.setMilliseconds(0);

        const now = new Date();
        const tenMinutesInMs = 10 * 60 * 1000;
        const sixtyMinutesInMs = 60 * 60 * 1000;

        const startTime = new Date(scheduledTime.getTime() - tenMinutesInMs);
        const endTime = new Date(scheduledTime.getTime() + sixtyMinutesInMs);

        // Check 1: Too early
        if (now < startTime) {
            return res.status(400).json({
                message: 'You can join 10 minutes before the interview time.',
                scheduledAt: scheduledTime,
                canJoinAfter: startTime
            });
        }

        // Check 2: Too late (Expired)
        if (now > endTime) {
            return res.status(400).json({
                message: 'Interview session has expired.',
                scheduledAt: scheduledTime,
                expiredAt: endTime
            });
        }
        // ----------------------------------

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

        const token = generateToken04(appId, userIdString, serverSecret, effectiveTimeInSeconds, payload);

        console.log(`[Zego Token Gen] Token generated successfully.`);

        res.json({
            appId,
            token,
            roomId: roomIdString,
            userId: userIdString,
            userName: req.user.fullName || "User"
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
