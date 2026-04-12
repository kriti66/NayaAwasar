import {
    getMatchStrengthDisplay,
    jobHasRecommendationScore,
    pickFriendlyRecommendationLine
} from '../../utils/recommendationFriendly';

/** Top-right tier badge (AI only) + % when profile/KYC gates pass. */
export function JobMatchScoreCorner({
    job,
    recMeta,
    className = '',
    layout = 'floating',
    matchUi,
    matchStrength
}) {
    const show =
        matchUi !== undefined ? matchUi : jobHasRecommendationScore(job, recMeta);
    if (!show) return null;
    const strength = matchStrength ?? getMatchStrengthDisplay(job, recMeta);
    if (strength.pct == null) return null;
    const positionClass = layout === 'floating' ? 'absolute top-4 right-4 z-20' : '';
    const aria =
        strength.badge && strength.showBadge
            ? `${strength.badge}, ${strength.pct} percent match`
            : `${strength.pct} percent match`;
    return (
        <div
            className={`${positionClass} flex flex-col items-end gap-1.5 ${className}`}
            aria-label={aria}
        >
            {strength.showBadge && strength.badge ? (
                <span
                    className={`text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full ${strength.badgeClass}`}
                >
                    {strength.badge}
                </span>
            ) : null}
            <span className="text-sm font-extrabold text-[#29a08e]">{strength.pct}% match</span>
        </div>
    );
}

export function JobMatchProgressBar({ job, recMeta, className = '', matchUi, matchStrength }) {
    const show =
        matchUi !== undefined ? matchUi : jobHasRecommendationScore(job, recMeta);
    if (!show) return null;
    const strength = matchStrength ?? getMatchStrengthDisplay(job, recMeta);
    if (strength.pct == null) return null;
    return (
        <div className={`h-1 w-full max-w-xs rounded-full bg-gray-100 overflow-hidden ${className}`}>
            <div
                className={`h-full rounded-full transition-all ${strength.barClass}`}
                style={{ width: `${Math.min(100, strength.pct)}%` }}
            />
        </div>
    );
}

/**
 * Single friendly “why” line — never shows raw pipe-separated backend text.
 * Shown when there is a recommendation reason or a scored match.
 */
export function JobMatchWhyBlock({
    job,
    recMeta,
    friendlyOverride,
    className = '',
    matchUi,
    matchStrength
}) {
    const hasOverride = friendlyOverride != null && String(friendlyOverride).trim();
    if (recMeta != null && recMeta.showMatchScores !== true && !hasOverride) {
        return null;
    }
    const show =
        matchUi !== undefined ? matchUi : jobHasRecommendationScore(job, recMeta);
    if (!show && !hasOverride) return null;
    const raw = String(job.matchReason || job.reason || '').trim();
    if (!raw && friendlyOverride == null) return null;
    const friendly =
        friendlyOverride != null && String(friendlyOverride).trim()
            ? String(friendlyOverride).trim()
            : pickFriendlyRecommendationLine(raw, job, {
                  provider: recMeta?.provider,
                  recMeta,
                  matchBadgeOverride: matchStrength?.badge ?? null
              });
    return (
        <div
            className={`text-[13px] leading-snug text-gray-700 bg-[#29a08e]/6 border border-[#29a08e]/10 p-3 rounded-lg ${className}`}
        >
            <span className="text-base mr-1.5" aria-hidden>
                ✨
            </span>
            <span className="font-medium">{friendly}</span>
        </div>
    );
}
