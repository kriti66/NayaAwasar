import mongoose from 'mongoose';
import ChatbotInteraction from '../models/ChatbotInteraction.js';

/**
 * POST /api/chatbot/interaction
 * Public — stores one assistant turn for analytics.
 */
export const logInteraction = async (req, res) => {
    try {
        const {
            sessionId,
            turnId,
            userId,
            userType,
            userMessage,
            detectedIntent,
            botResponse,
            language
        } = req.body || {};

        if (!sessionId || !turnId) {
            return res.status(400).json({ message: 'sessionId and turnId are required' });
        }

        const doc = await ChatbotInteraction.create({
            sessionId: String(sessionId).slice(0, 128),
            turnId: String(turnId).slice(0, 64),
            userId:
                userId && mongoose.Types.ObjectId.isValid(String(userId))
                    ? new mongoose.Types.ObjectId(String(userId))
                    : undefined,
            userType: String(userType || 'unknown').slice(0, 32),
            userMessage: String(userMessage || '').slice(0, 2000),
            detectedIntent: String(detectedIntent || 'unknown').slice(0, 64),
            botResponse: String(botResponse || '').slice(0, 4000),
            language: String(language || 'en').slice(0, 8)
        });

        res.status(201).json({ id: doc._id, turnId: doc.turnId });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(200).json({ ok: true, duplicate: true });
        }
        console.error('[chatbot] logInteraction:', error);
        res.status(500).json({ message: 'Failed to log interaction' });
    }
};

export const updateFeedback = async (req, res) => {
    try {
        const { turnId } = req.params;
        const { feedback } = req.body || {};

        if (!['up', 'down'].includes(feedback)) {
            return res.status(400).json({ message: 'feedback must be "up" or "down"' });
        }

        const doc = await ChatbotInteraction.findOneAndUpdate(
            { turnId: String(turnId) },
            { feedback },
            { new: true }
        );

        if (!doc) return res.status(404).json({ message: 'Turn not found' });
        res.json({ ok: true });
    } catch (error) {
        console.error('[chatbot] updateFeedback:', error);
        res.status(500).json({ message: 'Failed to update feedback' });
    }
};
