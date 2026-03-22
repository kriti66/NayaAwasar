import mongoose from 'mongoose';
import { PROMOTION_STATUSES, PAYMENT_STATUSES, PROMOTION_TYPES } from '../constants/promotionConfig.js';

const promotionSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    recruiterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    promotionType: {
        type: String,
        enum: Object.values(PROMOTION_TYPES),
        required: true
    },
    durationDays: {
        type: Number,
        required: true
    },
    amount: {
        type: Number,
        default: 0
    },
    isFreePromotion: {
        type: Boolean,
        default: false
    },
    freePromotionSequenceNumber: {
        type: Number,
        default: null
    },
    status: {
        type: String,
        enum: Object.values(PROMOTION_STATUSES),
        default: PROMOTION_STATUSES.PENDING
    },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    requestedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date, default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: { type: Date, default: null },
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String, default: '' },
    paymentRequired: {
        type: Boolean,
        default: false
    },
    paymentStatus: {
        type: String,
        enum: Object.values(PAYMENT_STATUSES),
        default: PAYMENT_STATUSES.UNPAID
    },
    isActive: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

promotionSchema.index({ companyId: 1, status: 1 });
promotionSchema.index({ jobId: 1 });
promotionSchema.index({ status: 1, startDate: 1, endDate: 1 });

const Promotion = mongoose.model('Promotion', promotionSchema);
export default Promotion;
