import mongoose from 'mongoose';

const identityKycSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true
        },
        fullName: {
            type: String,
            required: true,
            trim: true
        },
        dob: {
            type: Date,
            required: true
        },
        nationality: {
            type: String,
            required: true,
            trim: true,
            default: 'Nepali'
        },
        address: {
            type: String,
            required: true,
            trim: true
        },
        idType: {
            type: String,
            enum: ['Citizenship', 'Passport', 'Driving License', 'Voter ID', 'PAN Card'],
            required: true
        },
        idNumber: {
            type: String,
            required: true,
            trim: true
        },
        frontDoc: {
            type: String,
            required: true
        },
        backDoc: {
            type: String,
            default: null
        },
        selfie: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'verified', 'rejected'],
            default: 'pending'
        },
        adminNote: {
            type: String,
            default: null,
            trim: true
        },
        submittedAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

const IdentityKyc = mongoose.models.IdentityKyc || mongoose.model('IdentityKyc', identityKycSchema);

export default IdentityKyc;
