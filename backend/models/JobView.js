
import mongoose from 'mongoose';

const jobViewSchema = new mongoose.Schema({
    job_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true,
        index: true
    },
    viewer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // optional, for logged in users
        default: null
    },
    ip: {
        type: String, // optional, for anonymous throttling
    },
    dayKey: {
        type: String, // format YYYY-MM-DD
        required: true
    }
}, { timestamps: true });

// Compound index to prevent duplicate counts per user/ip per day
jobViewSchema.index({ job_id: 1, viewer_id: 1, dayKey: 1 });
jobViewSchema.index({ job_id: 1, ip: 1, dayKey: 1 });

const JobView = mongoose.model('JobView', jobViewSchema);
export default JobView;
