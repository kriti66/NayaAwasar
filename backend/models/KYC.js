import mongoose from 'mongoose';

/**
 * KYC Schema - One active record per user (userId unique).
 * Supports jobseeker and recruiter; role determines which fields are used.
 */
const kycSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true
        },
        role: {
            type: String,
            enum: ['jobseeker', 'recruiter'],
            required: true
        },
        documentType: {
            type: String,
            trim: true
        },
        documentFront: { type: String },
        documentBack: { type: String },
        fullName: { type: String, trim: true },
        dateOfBirth: { type: Date },
        nationality: { type: String, trim: true },
        address: { type: String, trim: true },
        idType: { type: String, enum: ['citizenship', 'passport', 'national_id'], default: null },
        idNumber: { type: String, trim: true },
        selfieWithId: { type: String },
        jobTitle: { type: String, trim: true },
        officialEmail: { type: String, trim: true, lowercase: true },
        phoneNumber: { type: String, trim: true },
        companyName: { type: String, trim: true },
        registrationNumber: { type: String, trim: true },
        industry: { type: String, trim: true },
        companyAddress: { type: String, trim: true },
        website: { type: String, trim: true },
        registrationDocument: { type: String },
        taxDocument: { type: String },
        companyLogo: { type: String },
        idFront: { type: String },
        idBack: { type: String },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'resubmission_locked'],
            default: 'pending'
        },
        rejectionReason: { type: String, default: null },
        resubmissionCount: { type: Number, default: 0 },
        rejectionHistory: [{
            reason: { type: String, required: true },
            rejectedAt: { type: Date, default: Date.now },
            rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
        }]
    },
    { timestamps: true }
);

const KYC = mongoose.model('KYC', kycSchema);
export default KYC;
