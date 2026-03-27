import mongoose from 'mongoose';

const pendingSignupSchema = new mongoose.Schema(
    {
        fullName: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        passwordHash: { type: String, required: true },
        role: { type: String, enum: ['jobseeker', 'recruiter', 'admin'], default: 'jobseeker' },
        otpHash: { type: String, required: true },
        otpExpiresAt: { type: Date, required: true },
        attempts: { type: Number, default: 0 },
        resendAvailableAt: { type: Date, required: true },
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
            index: { expires: 0 }
        }
    },
    { timestamps: true }
);

const PendingSignup = mongoose.model('PendingSignup', pendingSignupSchema);
export default PendingSignup;

