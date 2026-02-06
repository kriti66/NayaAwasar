
import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
    actorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    actorRole: {
        type: String,
        required: true,
        enum: ['jobseeker', 'recruiter', 'admin', 'system']
    },
    action: {
        type: String,
        required: true
    },
    targetType: {
        type: String,
        required: false // e.g., 'Job', 'Application', 'User'
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    },
    message: {
        type: String,
        required: true
    }
}, { timestamps: true });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;
