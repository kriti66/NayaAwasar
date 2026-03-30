import mongoose from 'mongoose';

const chatbotInteractionSchema = new mongoose.Schema(
    {
        sessionId: { type: String, required: true, index: true },
        turnId: { type: String, required: true, unique: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        userType: { type: String, default: 'unknown' },
        userMessage: { type: String, default: '' },
        detectedIntent: { type: String, default: 'unknown' },
        botResponse: { type: String, default: '' },
        feedback: { type: String, default: null },
        language: { type: String, default: 'en' }
    },
    { timestamps: true }
);

chatbotInteractionSchema.index({ createdAt: -1 });

export default mongoose.model('ChatbotInteraction', chatbotInteractionSchema);
