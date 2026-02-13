import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: { // APPLIED_JOB, RECRUITER_VIEW, MESSAGE, STATUS_CHANGE
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    meta: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, { timestamps: true });

// Optimizes fetching latest activities for a user - critical for dashboard performance
activityLogSchema.index({ userId: 1, createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;
