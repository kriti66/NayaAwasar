import mongoose from 'mongoose';

/**
 * ContactMessage Model
 * Stores messages submitted from the public Contact Us page.
 * Admin can view, reply, and manage these messages.
 */
const contactMessageSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        trim: true
    },
    message: {
        type: String,
        required: [true, 'Message is required'],
        trim: true
    },
    status: {
        type: String,
        enum: ['NEW', 'READ', 'REPLIED', 'RESOLVED'],
        default: 'NEW'
    },
    adminReply: {
        type: String,
        default: null
    },
    repliedAt: {
        type: Date,
        default: null
    },
    repliedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true // adds createdAt and updatedAt
});

// Index for efficient queries
contactMessageSchema.index({ status: 1, createdAt: -1 });

const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);

export default ContactMessage;
