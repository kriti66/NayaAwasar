import mongoose from 'mongoose';
import { PROMOTION_TYPES } from '../constants/promotionConfig.js';

const REQUEST_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
};

const promotionPaymentRequestSchema = new mongoose.Schema(
    {
        recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
        jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
        recruiterName: { type: String, required: true, trim: true },
        companyName: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true, lowercase: true },
        phone: { type: String, required: true, trim: true },
        jobTitle: { type: String, required: true, trim: true },
        promotionType: {
            type: String,
            enum: Object.values(PROMOTION_TYPES),
            required: true
        },
        durationDays: { type: Number, required: true, enum: [7, 15, 30] },
        amount: { type: Number, required: true, min: 0 },
        paymentMethod: { type: String, required: true, trim: true },
        transactionId: { type: String, required: true, trim: true },
        paymentScreenshot: { type: String, required: true },
        note: { type: String, default: '', trim: true },
        status: {
            type: String,
            enum: Object.values(REQUEST_STATUS),
            default: REQUEST_STATUS.PENDING
        },
        rejectionReason: { type: String, default: '' },
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        approvedAt: { type: Date, default: null },
        promotionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Promotion', default: null }
    },
    { timestamps: true }
);

promotionPaymentRequestSchema.index({ recruiterId: 1, status: 1 });
promotionPaymentRequestSchema.index({ jobId: 1, status: 1 });

const PromotionPaymentRequest = mongoose.model('PromotionPaymentRequest', promotionPaymentRequestSchema);
export default PromotionPaymentRequest;
export { REQUEST_STATUS as PROMOTION_PAYMENT_REQUEST_STATUS };
