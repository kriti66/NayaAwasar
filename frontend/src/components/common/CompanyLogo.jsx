import { useState } from 'react';
import { getImageUrl, getJobLogo } from '../../utils/imageUtils';

/**
 * Renders company/job logo with fallback to first letter when missing or on error.
 * Prevents broken image icons and supports both full URLs and relative paths.
 */
const CompanyLogo = ({ job, companyName, className = '', imgClassName = '', fallbackClassName = '' }) => {
    const [imageError, setImageError] = useState(false);
    const displayName = companyName || job?.company_name || job?.company_id?.name || 'Company';
    const logoPath = job ? getJobLogo(job) : null;
    const fullUrl = getImageUrl(logoPath);
    const showFallback = !fullUrl || imageError;

    const handleError = () => {
        setImageError(true);
        if (import.meta.env?.DEV && logoPath) {
            console.warn('[CompanyLogo] Failed to load:', logoPath, '→ using fallback');
        }
    };

    return (
        <div className={`flex items-center justify-center shrink-0 overflow-hidden bg-gray-50 border border-gray-100 ${className}`}>
            {showFallback ? (
                <span className={`font-bold text-[#29a08e] ${fallbackClassName}`}>
                    {displayName?.charAt(0)?.toUpperCase() || 'C'}
                </span>
            ) : (
                <img
                    src={fullUrl}
                    alt={displayName}
                    className={`object-contain ${imgClassName}`}
                    onError={handleError}
                />
            )}
        </div>
    );
};

export default CompanyLogo;
