import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['jobseeker', 'recruiter', 'admin'],
        default: 'jobseeker'
    },
    kycStatus: {
        type: String,
        enum: ['not_submitted', 'pending', 'approved', 'rejected'],
        default: 'not_submitted'
    },
    isKycSubmitted: { type: Boolean, default: false },
    isKycVerified: { type: Boolean, default: false },
    kycRejectionReason: {
        type: String,
        default: null
    },
    kycCompletedAt: {
        type: Date
    },
    kycVerifiedAt: {
        type: Date
    },
    phoneNumber: {
        type: String,
        trim: true,
        default: ''
    },
    location: {
        type: String,
        trim: true,
        default: ''
    },
    bio: {
        type: String,
        maxLength: 500,
        default: ''
    },
    profileImage: {
        type: String,
        default: ''
    },
    profileStatus: {
        type: String,
        enum: ['Pending', 'Verified', 'Rejected'],
        default: 'Pending'
    },
    profileCompletion: {
        type: Number,
        default: 0
    },
    professionalHeadline: {
        type: String,
        default: ''
    },
    linkedinUrl: {
        type: String,
        default: ''
    },
    portfolioUrl: {
        type: String,
        default: ''
    },
    workExperience: [
        { title: String, company: String, duration: String, description: String }
    ],
    education: [
        { degree: String, institution: String, year: String }
    ],
    isPublic: { type: Boolean, default: true },
    skills: [String],

    // Resume object (prompt requested object, existing is string)
    resume: {
        fileUrl: { type: String, default: '' },
        uploadedAt: { type: Date }
    },

    // Job Preferences
    jobPreferences: {
        jobType: { type: String, default: 'Full-time' }, // Full-time, Internship, etc.
        workMode: { type: String, default: 'On-site' }, // Remote, Hybrid, On-site
        location: { type: String, default: '' },
        seniority: { type: String, default: 'Entry Level' }
    },

    // Saved Jobs
    savedJobs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job'
    }],

    // Projects
    projects: [{
        title: String,
        description: String,
        techStack: [String],
        githubUrl: String,
        liveUrl: String
    }],

    // Profile Strength
    profileStrength: { type: Number, default: 0 },

    // Visibility
    profileVisibility: { type: Boolean, default: true },
    resetOtp: { type: String, default: null },
    resetOtpExpiry: { type: Date, default: null },
    reset_password_token: { type: String, default: null },
    reset_password_expires: { type: Date, default: null },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
