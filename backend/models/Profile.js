import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    profile_picture_url: {
        type: String
    },
    resume_url: {
        type: String
    },
    bio: {
        type: String
    },
    location: {
        type: String
    },
    phone: {
        type: String
    },
    skills: {
        type: String
    }
}, { timestamps: true });

const Profile = mongoose.model('Profile', profileSchema);
export default Profile;
