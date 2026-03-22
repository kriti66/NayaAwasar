import mongoose from 'mongoose';
import { PAYMENT_STATUSES } from '../constants/promotionConfig.js';

const promotionPaymentSchema = new mongoose.Schema({
    promotionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Promotion',
        required: true
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        default: 'bank_transfer'
    },
    transactionId: {
        type: String,
        default: ''
    },
    receiptImage: {
        type: String,
        default: ''
    },
    paymentStatus: {
        type: String,
        enum: Object.values(PAYMENT_STATUSES),
        default: PAYMENT_STATUSES.PENDING_VERIFICATION
    },
    submittedAt: { type: Date, default: Date.now },
    verifiedAt: { type: Date, default: null },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String, default: '' }
}, { timestamps: true });

const PromotionPayment = mongoose.model('PromotionPayment', promotionPaymentSchema);
export default PromotionPayment;
