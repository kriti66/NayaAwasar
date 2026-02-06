import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    techStack: [{
        type: String,
        trim: true
    }],
    githubUrl: {
        type: String,
        trim: true
    },
    liveDemoUrl: {
        type: String,
        trim: true
    }
}, { timestamps: true });

projectSchema.index({ userId: 1 });

const Project = mongoose.model('Project', projectSchema);
export default Project;
