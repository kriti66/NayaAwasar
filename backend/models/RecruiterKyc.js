import mongoose from 'mongoose';

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

    // Status Tracking
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    submissionDate: { type: Date, default: Date.now },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: { type: Date },
    rejectionReason: { type: String }
}, {
    timestamps: true
});

const RecruiterKyc = mongoose.model('RecruiterKyc', recruiterKycSchema);
export default RecruiterKyc;
