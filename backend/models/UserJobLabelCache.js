import mongoose from 'mongoose';

const userJobLabelCacheSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        jobId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Job',
            required: true,
            index: true
        },
        label: { type: String, default: null },
        aiScore: { type: Number, default: null },
        reason: { type: String, default: '' },
        matchedSkills: { type: [String], default: [] },
        missingSkills: { type: [String], default: [] },
        computedAt: { type: Date, default: Date.now },
        modelVersion: { type: String, default: 'v1' },
        /** TTL — MongoDB deletes document once expiresAt is reached */
        expiresAt: { type: Date, required: true }
    },
    { timestamps: false }
);

userJobLabelCacheSchema.index({ userId: 1, jobId: 1 }, { unique: true });
userJobLabelCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const UserJobLabelCache = mongoose.model('UserJobLabelCache', userJobLabelCacheSchema);
export default UserJobLabelCache;
