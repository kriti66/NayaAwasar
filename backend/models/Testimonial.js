import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        role: {
            type: String,
            trim: true,
            default: ''
        },
        review: {
            type: String,
            required: true,
            trim: true
        },
        photo: {
            type: String,
            default: ''
        },
        rating: {
            type: Number,
            default: 5,
            min: 1,
            max: 5
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

const Testimonial = mongoose.model('Testimonial', testimonialSchema);
export default Testimonial;
