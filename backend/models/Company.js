import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    company_name: { // Added per prompt
        type: String,
        trim: true
    },
    logo: {
        type: String,
        default: ''
    },
    photos: [{
        type: String
    }],
    industry: {
        type: String,
        required: true
    },
    size: {
        type: String,
        enum: ['1-10 employees', '11-50 employees', '51-200 employees', '201-500 employees', '501-1000 employees', '1000+ employees'],
        required: true
    },
    yearFounded: {
        type: Number
    },
    headquarters: {
        type: String,
        required: true
    },
    website: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['draft', 'pending', 'waiting_for_recruiter_approval', 'approved', 'rejected'],
        default: 'draft'
    },
    verification_status: { // Added per prompt
        type: String,
        enum: ['Verified', 'Not Verified', 'Pending'],
        default: 'Not Verified'
    },
    rating: { // Added per prompt
        type: Number,
        default: 0
    },
    adminFeedback: {
        type: String,
        default: ''
    },
    about: {
        mission: { type: String, default: '' },
        services: { type: String, default: '' },
        goals: { type: String, default: '' },
        culture: { type: String, default: '' }
    },
    contact: {
        email: { type: String, required: true },
        address: { type: String, required: true }
    },
    socialLinks: {
        linkedin: { type: String, default: '' },
        portfolio: { type: String, default: '' },
        github: { type: String, default: '' }
    },
    hiringInfo: {
        jobTypes: [{ type: String }],
        locations: [{ type: String }],
        technologies: [{ type: String }],
        benefits: [{ type: String }]
    },
    recruiters: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    adminFields: {
        verificationDocuments: [{ type: String }],
        complianceFlags: [{ type: String }],
        moderationStatus: {
            type: String,
            enum: ['approved', 'rejected', 'under_review', 'waiting_for_recruiter_approval', 'suspended'],
            default: 'under_review'
        },
        reviewHistory: [{
            date: { type: Date, default: Date.now },
            action: String,
            adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            comment: String
        }]
    },
    profileViews: {
        total: { type: Number, default: 0 },
        viewedBy: [{
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            viewedAt: { type: Date, default: Date.now }
        }]
    }
}, { timestamps: true });

// Virtuals for statistics would be better handled via aggregation in the controller 
// for performance if the data is large, but we can add them here for convenience.

const Company = mongoose.model('Company', companySchema);
export default Company;
