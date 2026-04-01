import mongoose from 'mongoose';

const recruiterWarningSchema = new mongoose.Schema(
    {
        recruiter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Job',
            default: null
        },
        reason: {
            type: String,
            required: true,
            trim: true
        },
        note: {
            type: String,
            default: '',
            trim: true
        },
        warnedAt: {
            type: Date,
            default: Date.now
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        },
        warnedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        resolvedAt: {
            type: Date,
            default: null
        },
        resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        }
    },
    { timestamps: true }
);

recruiterWarningSchema.index({ recruiter: 1, isActive: 1, warnedAt: -1 });

const RecruiterWarning = mongoose.model('RecruiterWarning', recruiterWarningSchema);
export default RecruiterWarning;
