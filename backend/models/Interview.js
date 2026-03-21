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
        unique: true,
        sparse: true // Allows null/undefined if Onsite
    },
    status: {
        type: String,
        enum: ['Scheduled', 'Completed', 'Cancelled', 'Missed'],
        default: 'Scheduled'
    },
    // Sub-status for dashboard/frontend: scheduled, reschedule_pending, confirmed
    interviewStatus: {
        type: String,
        enum: ['scheduled', 'reschedule_pending', 'confirmed'],
        default: 'scheduled'
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
        enum: ['Online', 'Onsite'],
        required: true
    },
    location: {
        type: String
    },
    notes: String,
    timezone: String, // Added timezone as requested
    startTime: Date,
    endTime: Date,
    // Rescheduling (recruiter-initiated proposals + jobseeker decisions)
    rescheduleRequestedBy: {
        type: String,
        enum: ['jobseeker', 'recruiter'],
        default: 'jobseeker'
    },
    proposedDate: Date,
    proposedTime: String,
    rescheduleReason: String,
    rescheduleStatus: {
        type: String,
        enum: ['NONE', 'PENDING', 'PROPOSED', 'APPROVED', 'REJECTED'],
        default: 'NONE'
    },
    // Jobseeker-initiated reschedule (single source of truth)
    rescheduleRequestedAt: { type: Date },
    requestedDate: { type: Date },
    requestedTime: { type: String },
    recruiterDecisionAt: { type: Date },
    rescheduleRejectedReason: { type: String }
}, { timestamps: true });

// Auto-generate roomId before saving if Online
interviewSchema.pre('save', async function () {
    if (this.mode === 'Online') {
        if (!this.roomId) {
            this.roomId = `interview_${this.applicationId}_${Date.now()}`;
        }
    } else if (this.mode === 'Onsite') {
        this.roomId = undefined; // Ensure sparse index ignores this
        if (!this.location || this.location.trim() === '') {
            throw new Error('Location is required for Onsite interviews.');
        }
    }
});

const Interview = mongoose.model('Interview', interviewSchema);
export default Interview;
