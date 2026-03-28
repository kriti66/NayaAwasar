import mongoose from 'mongoose';

// Office / contact location for public Contact page — address only (map is derived from address, no lat/lng stored).
const locationSchema = new mongoose.Schema({
    address: {
        type: String,
        required: [true, 'Official address is required'],
        trim: true
    },
    phone: {
        type: String,
        required: [true, 'Contact number is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Official email is required'],
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
    }
}, { timestamps: true });

const Location = mongoose.model('Location', locationSchema);
export default Location;
