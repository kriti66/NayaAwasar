import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['JOB_ALERT', 'Application', 'System', 'Profile', 'INTERVIEW_SCHEDULED', 'RESCHEDULE_APPROVED', 'RESCHEDULE_REJECTED', 'RESCHEDULE_REQUESTED', 'OFFER_ACCEPTED', 'STATUS_UPDATE', 'OFFER_EXTENDED'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Notification', notificationSchema);
