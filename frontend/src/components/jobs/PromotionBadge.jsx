import { Star, TrendingUp, Sparkles } from 'lucide-react';

/**
 * Maps promotionType from API to display config.
 * Used on both public and jobseeker Find Jobs pages.
 */
export function getPromotionBadgeConfig(promotionType, premiumLabel) {
    const type = promotionType || 'NONE';
    const label = premiumLabel || getDefaultLabel(type);
    switch (type) {
        case 'HOMEPAGE_BANNER':
            return { text: label, styles: 'bg-amber-100 text-amber-700 border-amber-200', icon: Sparkles };
        case 'TOP_LISTING':
            return { text: label, styles: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: TrendingUp };
        case 'FEATURED':
        default:
            return { text: label, styles: 'bg-[#29a08e]/10 text-[#29a08e] border-[#29a08e]/20', icon: Star };
    }
}

function getDefaultLabel(type) {
    switch (type) {
        case 'HOMEPAGE_BANNER': return 'Premium Pick';
        case 'TOP_LISTING': return 'Sponsored';
        case 'FEATURED': return 'Featured Opportunity';
        default: return 'Promoted';
    }
}

/**
 * Compact badge for job cards. Renders nothing if job is not actively promoted.
 */
const PromotionBadge = ({ job, className = '' }) => {
    if (!job?.activePromotion && !(job?.isPromoted && job?.promotionType && job.promotionType !== 'NONE')) {
        return null;
    }
    const badge = getPromotionBadgeConfig(job.promotionType, job.premiumLabel);
    const Icon = badge.icon;
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badge.styles} ${className}`}
        >
            <Icon className="w-3 h-3" />
            {badge.text}
        </span>
    );
};

export default PromotionBadge;
