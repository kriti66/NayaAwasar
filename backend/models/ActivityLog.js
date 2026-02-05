import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['registration', 'kyc_approved', 'kyc_rejected', 'job_added', 'location_updated', 'user_updated', 'system']
    },
    message: {
        type: String,
        required: true
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Some actions like registration are performed by the user themselves before being fully authenticated in some contexts, or system actions
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        required: false
    }
}, { timestamps: true });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;
