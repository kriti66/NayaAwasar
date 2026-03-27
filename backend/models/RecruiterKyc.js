import mongoose from 'mongoose';

const sectionStatusEnum = ['pending', 'approved', 'rejected'];

const recruiterKycSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    // Company Information
    companyName: { type: String, required: true },
    industry: { type: String, required: true },
    registrationNumber: { type: String, required: true },
    companyAddress: { type: String, required: true },
    website: { type: String },

    // Personal/Representative Details
    fullName: { type: String, required: true },
    jobTitle: { type: String, required: true },
    officialEmail: { type: String, required: true },
    phoneNumber: { type: String, required: true },

    // ID Details
    idType: {
        type: String,
        enum: ['citizenship', 'passport', 'national_id'],
        required: true
    },
    idNumber: { type: String, required: true },

    // Document URLs
    companyLogo: { type: String },
    idFrontUrl: { type: String, required: true },
    idBackUrl: { type: String, required: true },
    registrationDocUrl: { type: String, required: true },
    taxDocUrl: { type: String, required: true },

    // Status Tracking (legacy overall status)
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'resubmission_locked'],
        default: 'pending'
    },
    representativeStatus: {
        type: String,
        enum: sectionStatusEnum,
        default: 'pending'
    },
    companyStatus: {
        type: String,
        enum: sectionStatusEnum,
        default: 'pending'
    },
    representativeRejectionReason: { type: String, default: '' },
    companyRejectionReason: { type: String, default: '' },
    representativeReviewedAt: { type: Date },
    companyReviewedAt: { type: Date },
    representativeReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    companyReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    representative: {
        fullName: { type: String },
        jobTitle: { type: String },
        officialEmail: { type: String },
        phoneNumber: { type: String },
        selfieUrl: { type: String },
        idType: { type: String, enum: ['citizenship', 'passport', 'national_id'] },
        idNumber: { type: String },
        idFrontUrl: { type: String },
        idBackUrl: { type: String }
    },
    company: {
        companyName: { type: String },
        registrationNumber: { type: String },
        companyAddress: { type: String },
        industry: { type: String },
        website: { type: String },
        registrationDocUrl: { type: String },
        taxDocUrl: { type: String },
        companyLogo: { type: String }
    },
    submissionDate: { type: Date, default: Date.now },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: { type: Date },
    rejectionReason: { type: String },
    resubmissionCount: { type: Number, default: 0 },
    rejectionHistory: [{
        reason: { type: String, required: true },
        rejectedAt: { type: Date, default: Date.now },
        rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }]
}, {
    timestamps: true
});

const RecruiterKyc = mongoose.model('RecruiterKyc', recruiterKycSchema);
export default RecruiterKyc;
