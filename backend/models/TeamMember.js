import mongoose from 'mongoose';

const teamMemberSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        role: {
            type: String,
            required: true,
            trim: true
        },
        bio: {
            type: String,
            trim: true,
            default: ''
        },
        photo: {
            type: String,
            default: ''
        },
        order: {
            type: Number,
            default: 0
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

teamMemberSchema.index({ order: 1, createdAt: 1 });

const TeamMember = mongoose.model('TeamMember', teamMemberSchema);
export default TeamMember;
