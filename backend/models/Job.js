import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
    recruiter_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    company_name: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    location: {
        type: String
    },
    salary_range: {
        type: String
    },
    experience_level: {
        type: String,
        enum: ['Entry Level', 'Associate', 'Mid-Senior Level', 'Director', 'Executive'],
        default: 'Entry Level'
    },
    company_logo: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['Active', 'Closed', 'Draft', 'Pending'],
        default: 'Active'
    },
    requirements: {
        type: String
    },
    moderationStatus: {
        type: String,
        enum: ['Approved', 'Flagged', 'Under Review', 'Hidden'],
        default: 'Approved'
    },
    flagReason: {
        type: String,
        default: ''
    },
    reviewDeadline: {
        type: Date
    },
    adminComments: {
        type: String,
        default: ''
    }
}, { timestamps: true });

const Job = mongoose.model('Job', jobSchema);
export default Job;
