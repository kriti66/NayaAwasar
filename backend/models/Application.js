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
    status: {
        type: String,
        enum: ['Applied', 'Under Review', 'Interview Scheduled', 'Interview Canceled', 'Offer Extended', 'Rejected'],
        default: 'Applied'
    },
    // Snapshot of personal info at time of application
    personalInfo: {
        fullName: String,
        email: String,
        phone: String
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
        meetLink: String,
        duration: String,
        interviewer: String,
        notes: String,
        scheduledAt: Date
    },
    rescheduleRequest: {
        reason: String,
        preferredDate: Date,
        preferredTime: String,
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        requestedBy: { type: String, default: 'jobseeker' },
        requestedAt: { type: Date, default: Date.now }
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

const Application = mongoose.model('Application', applicationSchema);
export default Application;
