import mongoose from 'mongoose';

const interviewSchema = new mongoose.Schema({
    applicationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application',
        required: true
    },
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    recruiterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    seekerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    roomId: {
        type: String,
        unique: true
    },
    status: {
        type: String,
        enum: ['Scheduled', 'Completed', 'Cancelled', 'Missed'],
        default: 'Scheduled'
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    mode: {
        type: String,
        default: 'OneONoneCall'
    },
    meetingLink: String,
    notes: String,
    startTime: Date,
    endTime: Date
}, { timestamps: true });

// Auto-generate roomId before saving
interviewSchema.pre('save', function (next) {
    if (this.isNew || !this.roomId) {
        this.roomId = `interview_${this._id}`;
    }
    next();
});

const Interview = mongoose.model('Interview', interviewSchema);
export default Interview;
