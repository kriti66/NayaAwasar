/**
 * Promotion configuration - easily configurable for demo/production
 */

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

export const PROMOTION_STATUSES = {
    PENDING: 'pending',
    PAYMENT_REQUIRED: 'payment_required',
    PAYMENT_SUBMITTED: 'payment_submitted',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    ACTIVE: 'active',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled'
};

export const PAYMENT_STATUSES = {
    UNPAID: 'unpaid',
    PENDING_VERIFICATION: 'pending_verification',
    PAID: 'paid',
    REJECTED: 'rejected'
};

/** Rs per promotion type and duration (days) */
export const PRICING = {
    [PROMOTION_TYPES.FEATURED]: {
        7: 500,
        15: 900,
        30: 1500
    },
    [PROMOTION_TYPES.SPONSORED]: {
        7: 700,
        15: 1200,
        30: 2000
    },
    [PROMOTION_TYPES.HOMEPAGE_HIGHLIGHT]: {
        7: 1000,
        15: 1800,
        30: 3000
    }
};

export const FREE_PROMOTION_QUOTA = 3;

/** Maps Promotion promotionType to Job promotionType for display */
export const PROMOTION_TO_JOB_TYPE = {
    FEATURED: 'FEATURED',
    SPONSORED: 'TOP_LISTING',
    HOMEPAGE_HIGHLIGHT: 'HOMEPAGE_BANNER'
};
