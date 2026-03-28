import api from './api';

export const promotionService = {
    getPricing: () => api.get('/promotions/pricing'),
    requestPromotion: (data) => api.post('/promotions/request', data),
    getMyPromotions: () => api.get('/promotions/company/my-promotions'),
    getSummary: () => api.get('/promotions/company/summary'),
    submitPayment: (promotionId, formData) =>
        api.post(`/promotions/${promotionId}/submit-payment`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),
    // Admin
    adminGetAll: (params) => api.get('/promotions/admin/all', { params }),
    adminApprove: (promotionId) => api.patch(`/promotions/admin/${promotionId}/approve`),
    adminReject: (promotionId, reason) => api.patch(`/promotions/admin/${promotionId}/reject`, { reason }),
    adminExpire: (promotionId) => api.patch(`/promotions/admin/${promotionId}/expire`),
    adminGetPayments: (params) => api.get('/promotions/admin/payments', { params }),
    adminApprovePayment: (paymentId) => api.patch(`/promotions/admin/payments/${paymentId}/approve`),
    adminRejectPayment: (paymentId, reason) => api.patch(`/promotions/admin/payments/${paymentId}/reject`, { reason }),

    /** Manual paid promotion requests (bank / wallet proof) */
    submitPromotionPaymentRequest: (formData) => api.post('/promotion-payment-requests/', formData),
    getMyPromotionPaymentRequests: () => api.get('/promotion-payment-requests/my'),
    adminListPendingManualPromotionRequests: () => api.get('/promotion-payment-requests/admin/pending'),
    adminApproveManualPromotionRequest: (requestId) =>
        api.patch(`/promotion-payment-requests/admin/${requestId}/approve`),
    adminRejectManualPromotionRequest: (requestId, reason) =>
        api.patch(`/promotion-payment-requests/admin/${requestId}/reject`, { reason })
};

export const PROMOTION_TYPES = {
    FEATURED: 'FEATURED',
    SPONSORED: 'SPONSORED',
    HOMEPAGE_HIGHLIGHT: 'HOMEPAGE_HIGHLIGHT'
};

export const PROMOTION_TYPE_LABELS = {
    FEATURED: 'Featured Job',
    SPONSORED: 'Sponsored Job',
    HOMEPAGE_HIGHLIGHT: 'Homepage Highlight'
};

export const STATUS_COLORS = {
    pending: 'bg-amber-100 text-amber-800 border-amber-300',
    payment_required: 'bg-orange-100 text-orange-800 border-orange-300',
    payment_submitted: 'bg-blue-100 text-blue-800 border-blue-300',
    approved: 'bg-green-100 text-green-800 border-green-300',
    rejected: 'bg-red-100 text-red-800 border-red-300',
    active: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    expired: 'bg-slate-100 text-slate-700 border-slate-300',
    cancelled: 'bg-slate-100 text-slate-600 border-slate-300'
};

export const PROMOTION_TYPE_COLORS = {
    FEATURED: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    SPONSORED: 'bg-violet-100 text-violet-800 border-violet-300',
    HOMEPAGE_HIGHLIGHT: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300'
};

export const MANUAL_PAYMENT_REQUEST_STATUS_COLORS = {
    pending: 'bg-amber-100 text-amber-800 border-amber-300',
    approved: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    rejected: 'bg-red-100 text-red-800 border-red-300'
};

export const PAYMENT_STATUS_COLORS = {
    unpaid: 'bg-slate-100 text-slate-700 border-slate-300',
    pending_verification: 'bg-blue-100 text-blue-800 border-blue-300',
    paid: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    rejected: 'bg-red-100 text-red-800 border-red-300'
};
