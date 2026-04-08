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
    // Sub-status for dashboard/frontend: scheduled, reschedule_pending, confirmed, pending_acceptance
    interviewStatus: {
        type: String,
        enum: ['scheduled', 'reschedule_pending', 'confirmed', 'pending_acceptance'],
        default: 'scheduled'
    },
    /** Unified calendar lifecycle for API/UI (optional on legacy documents). */
    calendarStatus: {
        type: String,
        enum: ['pending_acceptance', 'scheduled', 'completed', 'cancelled', 'reschedule_requested']
    },
    acceptedBySeeker: {
        type: Boolean,
        default: true
    },
    acceptedByRecruiter: {
        type: Boolean,
        default: true
    },
    rescheduleRequest: {
        proposedBy: { type: String, enum: ['recruiter', 'jobseeker'] },
        newDate: { type: Date },
        newTime: { type: String },
        reason: { type: String },
        requestedAt: { type: Date }
    },
    rescheduleHistory: [
        {
            proposedBy: { type: String, enum: ['recruiter', 'jobseeker'] },
            date: { type: Date },
            time: { type: String },
            reason: { type: String },
            proposedAt: { type: Date, default: Date.now }
        }
    ],
    cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    cancelReason: { type: String, default: '' },
    cancelledAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
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
    /** Scheduled slot length in minutes (UI + lifecycle end); default 30 in code when missing */
    duration: {
        type: Number,
        default: 30,
        min: 5,
        max: 480
    },
    /** Seeker opened/joined the online interview at least once (PATCH mark-interview-joined) */
    joined: {
        type: Boolean,
        default: false
    },
    recruiterJoinedAt: { type: Date, default: null },
    seekerJoinedAt: { type: Date, default: null },
    recruiterLeftAt: { type: Date, default: null },
    seekerLeftAt: { type: Date, default: null },
    callEndedAt: { type: Date, default: null },
    /** Set by recruiter after interview; drives COMPLETED_* lifecycle */
    result: {
        type: String,
        enum: {
            values: ['passed', 'rejected'],
            message: '{VALUE} is not a valid interview result'
        }
    },
    /** Denormalized from application.interview for listing */
    interviewer: {
        type: String,
        trim: true,
        default: ''
    },
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
    rescheduleRejectedReason: { type: String },

    /**
     * Reschedule state machine (v2). Orthogonal to legacy rescheduleStatus (NONE/PENDING/…)
     * and interviewStatus. Stored datetimes are UTC instants where applicable.
     */
    workflowRescheduleStatus: {
        type: String,
        enum: ['none', 'pending', 'countered', 'accepted', 'rejected', 'expired'],
        default: 'none',
        index: true
    },
    workflowRescheduleRequestedBy: {
        type: String,
        default: null
    },
    workflowProposedDateTime: { type: Date, default: null },
    workflowCounterProposedDateTime: { type: Date, default: null },
    workflowRescheduleExpiresAt: { type: Date, default: null, index: true },
    workflowRescheduleRoundCount: {
        type: Number,
        default: 0,
        min: 0,
        max: 3
    },
    workflowRescheduleNote: { type: String, default: '' },
    workflowRescheduleHistory: [
        {
            round: { type: Number, required: true },
            proposedBy: { type: String, enum: ['jobseeker', 'recruiter'], required: true },
            previousScheduledAt: { type: Date, default: null },
            newProposedAt: { type: Date, required: true },
            note: { type: String, default: '' },
            action: {
                type: String,
                enum: ['proposed', 'accepted', 'rejected', 'expired', 'countered', 'cancelled'],
                required: true
            },
            at: { type: Date, default: Date.now }
        }
    ]
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
