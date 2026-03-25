import mongoose from 'mongoose';
import { JOB_CATEGORIES } from '../constants/jobCategories.js';

const jobSchema = new mongoose.Schema({
    recruiter_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recruiter: { // Alias for recruiter_id to match prompt requirement
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    company: { // Alias for company_id to match prompt requirement
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    company_name: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    /** Profession / industry bucket for search and filters */
    category: {
        type: String,
        enum: JOB_CATEGORIES,
        required: true
    },
    /** Normalized lowercase keywords (e.g. nurse, react) for search */
    tags: {
        type: [String],
        default: []
    },
    job_title: { // Added per prompt
        type: String
    },
    type: {
        type: String,
        required: true
    },
    job_type: { // Added per prompt
        type: String,
        enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'],
        default: 'Full-time'
    },
    description: {
        type: String
    },
    job_description: { // Added per prompt
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
    posted_date: { // Added per prompt
        type: Date,
        default: Date.now
    },
    application_deadline: { // Added per prompt
        type: Date
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
    },
    // --- Promotional / Advertisement Fields ---
    isPromoted: {
        type: Boolean,
        default: false
    },
    promotionType: {
        type: String,
        enum: ["NONE", "FEATURED", "HOMEPAGE_BANNER", "TOP_LISTING"],
        default: "NONE"
    },
    promotionStartDate: {
        type: Date,
        default: null
    },
    promotionEndDate: {
        type: Date,
        default: null
    },
    promotionPriority: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Ensure virtuals or middleware sync fields if needed, or handle in controller/seeder.
// For now, we will populate both sets of fields in the seeder.

const Job = mongoose.model('Job', jobSchema);
export default Job;
