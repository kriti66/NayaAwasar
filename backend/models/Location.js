import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
    address: {
        type: String,
        required: [true, 'Official address is required'],
        trim: true
    },
    latitude: {
        type: Number,
        required: [true, 'Latitude is required'],
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
    },
    longitude: {
        type: Number,
        required: [true, 'Longitude is required'],
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
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
