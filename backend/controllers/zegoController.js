import Interview from '../models/Interview.js';
import User from '../models/User.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { generateToken04 } = require('../utils/zegoServerAssistant.cjs');

/**
 * POST /api/zego/token
 * Generate Zego token for video call. Validates user has access to the room via Interview.
 * Body: { roomID } - or roomID can come from interview lookup
 * Returns: { appId, token, roomId, userId, userName }
 */
export const generateZegoToken = async (req, res) => {
    const userId = req.user.id;
    const { roomID } = req.body;

    try {
        if (!roomID) {
            return res.status(400).json({ message: 'roomID is required' });
        }

        // Look up interview by roomId (supports both "interview_xxx" format and MongoDB _id)
        let interview;
        if (roomID.startsWith('interview_')) {
            interview = await Interview.findOne({ roomId: roomID });
        } else {
            interview = await Interview.findById(roomID);
        }

        if (!interview) {
            return res.status(404).json({ message: 'Interview not found' });
        }

        const roomIdString = String(interview.roomId);

        // Verify authorization
        const isRecruiter = interview.recruiterId.toString() === userId;
        const isSeeker = interview.seekerId.toString() === userId;

        if (!isRecruiter && !isSeeker) {
            return res.status(403).json({ message: 'Unauthorized access to this interview' });
        }

        if (interview.status !== 'Scheduled') {
            return res.status(403).json({
                message: `Interview is ${interview.status}. Cannot join.`
            });
        }

        // Time window: 10 min before to 60 min after scheduled time
        const scheduledTime = new Date(interview.date);
        const [hours, minutes] = interview.time.split(':').map(Number);
        scheduledTime.setHours(hours, minutes, 0, 0);

        const now = new Date();
        const startWindow = new Date(scheduledTime.getTime() - 10 * 60 * 1000);
        const endWindow = new Date(scheduledTime.getTime() + 60 * 60 * 1000);

        if (now < startWindow) {
            return res.status(400).json({
                message: 'You can join 10 minutes before the interview time.',
                canJoinAfter: startWindow
            });
        }
        if (now > endWindow) {
            return res.status(400).json({
                message: 'Interview session has expired.',
                expiredAt: endWindow
            });
        }

        // Get user for fullName
        const user = await User.findById(userId).select('fullName').lean();
        const userName = user?.fullName || 'User';

        // Zego config
        const appId = Number(process.env.ZEGO_APP_ID);
        const serverSecret = process.env.ZEGO_SERVER_SECRET;
        const userIdString = String(userId);

        if (!appId || !serverSecret) {
            console.error('[Zego] ZEGO_APP_ID or ZEGO_SERVER_SECRET missing in .env');
            return res.status(500).json({ message: 'Server configuration error' });
        }

        if (serverSecret.length !== 32) {
            return res.status(500).json({
                message: 'Zego server secret must be 32 characters. Check your ZEGO_SERVER_SECRET.'
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
            userIdString,
            serverSecret,
            effectiveTimeInSeconds,
            payload
        );

        if (process.env.NODE_ENV !== 'production') {
            console.log('[Zego Token] appId:', appId, 'roomId:', roomIdString, 'userId:', userIdString);
        }

        res.json({
            appId,
            token,
            roomId: roomIdString,
            userId: userIdString,
            userName
        });
    } catch (error) {
        console.error('[Zego Token] Error:', error);
        res.status(500).json({
            message: error?.errorMessage || 'Failed to generate token'
        });
    }
};
