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
        required: function() { return this.provider === 'local'; }
    },
    provider: {
        type: String,
        enum: ['local', 'google', 'facebook'],
        default: 'local'
    },
    providerId: {
        type: String,
        default: null
    },
    role: {
        type: String,
        enum: ['jobseeker', 'recruiter', 'admin'],
        default: 'jobseeker'
    },
    kycStatus: {
        type: String,
        enum: ['not_submitted', 'pending', 'approved', 'rejected', 'resubmission_locked'],
        default: 'not_submitted'
    },
    recruiterKycStatus: {
        type: String,
        enum: ['not_submitted', 'pending', 'approved', 'rejected', 'resubmission_locked'],
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
    isActive: { type: Boolean, default: true },

    /** Soft delete — record kept; excluded from normal queries and login. */
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    /** Free job promotions used (admin-approved free slots); max 3 before paid manual request flow */
    freePromotionUsed: { type: Number, default: 0, min: 0 },

    // AI Recommendation Fields
    cvText: { type: String, default: '' }, // Extracted text from PDF
    userProfileText: { type: String, default: '' } // Combined text for AI analysis
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
