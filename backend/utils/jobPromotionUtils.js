/**
 * Active promotion window + sponsored vs featured interpretation (single source).
 */

export function isJobActivelyPromoted(job, now = new Date()) {
    if (!job?.isPromoted || !job.promotionType || job.promotionType === 'NONE') return false;
    const start = job.promotionStartDate ? new Date(job.promotionStartDate) : null;
    const end = job.promotionEndDate ? new Date(job.promotionEndDate) : null;
    if (!start || !end) return false;
    return now >= start && now < end;
}

/**
 * SPONSORED = paid/placement (top listing, homepage). FEATURED = employer highlight tier.
 */
export function deriveSponsoredFeaturedFlags(job, now = new Date()) {
    const active = isJobActivelyPromoted(job, now);
    if (!active) return { isSponsored: false, isFeatured: false };
    const t = job.promotionType;
    if (t === 'FEATURED') return { isSponsored: false, isFeatured: true };
    if (t === 'TOP_LISTING' || t === 'HOMEPAGE_BANNER') return { isSponsored: true, isFeatured: false };
    return { isSponsored: true, isFeatured: false };
}
