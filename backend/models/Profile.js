import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    headline: {
        type: String,
        trim: true,
        default: ''
    },
    summary: {
        type: String,
        trim: true,
        default: ''
    },
    location: {
        type: String,
        trim: true,
        default: ''
    },
    visibleToRecruiters: {
        type: Boolean,
        default: true
    },
    skills: {
        type: [String],
        default: []
    },
    experience: [{
        company: { type: String, required: true },
        role: { type: String, required: true },
        startDate: { type: Date },
        endDate: { type: Date }, // null = Present
        current: { type: Boolean, default: false },
        description: { type: String }
    }],
    education: [{
        institute: { type: String, required: true },
        degree: { type: String, required: true },
        startYear: { type: String },
        endYear: { type: String },
        current: { type: Boolean, default: false }
    }],
    jobPreferences: {
        jobTypes: [{ type: String }], // 'Full-time', 'Contract', etc.
        seniority: { type: String, default: 'Mid Level' },
        preferredLocation: { type: String, default: '' }
    },
    // Resume/CV
    resume: {
        fileUrl: { type: String, default: '' }, // Path to file
        fileName: { type: String, default: '' },
        uploadedAt: { type: Date },
        source: { type: String, enum: ['uploaded', 'generated'], default: 'uploaded' },
        lastGeneratedAt: { type: Date }
    },
    profileStrength: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    }
}, { timestamps: true });

// Index for recruiter search
profileSchema.index({ visibleToRecruiters: 1 });


const Profile = mongoose.model('Profile', profileSchema);
export default Profile;
