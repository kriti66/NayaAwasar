import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
    job_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    seeker_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recruiter_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
        // required: true // Made optional for backward compatibility or migration
    },
    matchScore: { type: Number, default: null },
    applicantLocation: { type: String, default: '' },
    applicantExperienceLevel: { type: String, default: '' },
    status: {
        type: String,
        enum: ['applied', 'in-review', 'interview', 'offered', 'hired', 'rejected', 'withdrawn'],
        default: 'applied'
    },
    // Snapshot of personal info at time of application
    personalInfo: {
        fullName: String,
        email: String,
        phone: String,
        address: String
    },
    coverLetter: {
        type: String,
        required: true
    },
    // Interview details
    interview: {
        date: Date,
        time: String,
        mode: { type: String, enum: ['Online', 'Onsite'] },
        location: String,
        roomId: String, // Replaced meetLink with roomId
        duration: String,
        interviewer: String,
        notes: String,
        timezone: String,
        scheduledAt: Date,
        interviewId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Interview'
        }
    },
    reschedule: {
        requested: { type: Boolean, default: false },
        reason: { type: String, default: '' },
        preferredDate: Date,
        preferredTime: String,
        reviewed: { type: Boolean, default: false },
        rejectionReason: { type: String, default: '' }
    },
    // Offer details
    offer: {
        salary: String,
        notes: String,
        offeredAt: Date
    },
    // Audit fields for ATS logic
    rescheduledAt: Date,
    canceledAt: Date,
    cancelReason: String,
    interviewHistory: [{
        action: String, // 'Scheduled', 'Rescheduled', 'Canceled'
        details: Object,
        reason: String,
        timestamp: { type: Date, default: Date.now }
    }],
    // Selection details
    resumeType: {
        type: String,
        enum: ['Generated', 'External'],
        required: true
    },
    // URL snapshot (usually for external resumes)
    resumeUrl: {
        type: String
    },
    // Full profile snapshot for 'Generated' resume type
    resumeSnapshot: {
        type: Object
    }
}, { timestamps: true });

applicationSchema.index({ job_id: 1, seeker_id: 1 }, { unique: true });

const Application = mongoose.model('Application', applicationSchema);
export default Application;
