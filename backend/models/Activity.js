import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ["APPLIED_JOB", "RECRUITER_VIEW", "MESSAGE"],
        required: true
    },
    meta: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, { timestamps: true });

activitySchema.index({ userId: 1, createdAt: -1 });

const Activity = mongoose.model('Activity', activitySchema);
export default Activity;
