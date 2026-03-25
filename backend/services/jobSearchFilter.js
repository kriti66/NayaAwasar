/**
 * Keyword → category inference for broad profession searches (case-insensitive).
 * Maps search phrases to canonical JOB_CATEGORIES so "health profession" matches Health jobs.
 */
import { JOB_CATEGORIES } from '../constants/jobCategories.js';

/** categoryName -> related search tokens (lowercase) */
export const KEYWORD_TO_CATEGORY_KEYWORDS = {
    Health: [
        'health', 'medical', 'hospital', 'doctor', 'nurse', 'nursing', 'clinic', 'patient',
        'healthcare', 'health care', 'health profession', 'pharma', 'pharmacy', 'surgeon',
        'dentist', 'therapy', 'therapist', 'paramedic', 'midwife'
    ],
    Education: [
        'education', 'teaching', 'teacher', 'school', 'lecturer', 'tutor', 'tutoring',
        'academic', 'university', 'college', 'principal', 'professor', 'instructor',
        'classroom', 'curriculum', 'pedagogy'
    ],
    IT: [
        'it', 'software', 'developer', 'programming', 'programmer', 'tech', 'technology',
        'computer', 'coding', 'engineer', 'devops', 'frontend', 'backend', 'full stack',
        'fullstack', 'data science', 'cyber', 'network admin', 'sysadmin', 'saas'
    ],
    Finance: [
        'finance', 'financial', 'accounting', 'accountant', 'bank', 'banking', 'audit',
        'investment', 'cfo', 'bookkeeping', 'tax', 'treasury', 'insurance'
    ],
    Engineering: [
        'engineering', 'engineer', 'civil', 'mechanical', 'electrical', 'structural',
        'construction', 'survey', 'cad', 'manufacturing', 'plant', 'maintenance engineer'
    ],
    Government: [
        'government', 'public sector', 'civil service', 'municipal', 'ministry', 'nepal government'
    ]
};

function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Normalize tags from comma-separated string or array → lowercase trimmed strings.
 */
export function normalizeTagsInput(input) {
    if (input == null) return [];
    if (Array.isArray(input)) {
        return input
            .map((t) => String(t).trim().toLowerCase())
            .filter(Boolean);
    }
    if (typeof input === 'string') {
        return input
            .split(',')
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean);
    }
    return [];
}

/**
 * Parse comma-separated query param into non-empty strings.
 */
export function parseCommaParam(value) {
    if (value == null) return [];
    if (Array.isArray(value)) {
        return value.flatMap((v) => parseCommaParam(String(v)));
    }
    if (typeof value !== 'string') return [];
    return value.split(',').map((s) => s.trim()).filter(Boolean);
}

/** Map common aliases → canonical JOB_CATEGORIES label (case-sensitive). */
const CATEGORY_ALIASES = {
    it: 'IT',
    'information technology': 'IT',
    'information-tech': 'IT',
    infotech: 'IT'
};

/**
 * Flatten Express req.query.category into string tokens (string | string[] | nested object from qs parsers).
 */
function categoryQueryToRawParts(raw) {
    if (raw == null) return [];
    if (typeof raw === 'string') return parseCommaParam(raw);
    if (Array.isArray(raw)) {
        return raw.flatMap((v) => categoryQueryToRawParts(v));
    }
    if (typeof raw === 'object') {
        return Object.values(raw).flatMap((v) => categoryQueryToRawParts(v));
    }
    return parseCommaParam(String(raw));
}

/**
 * Normalize category query param(s) to canonical enum values (Express may pass string or repeated keys as array).
 */
export function normalizeCategoryParams(raw) {
    const parts = categoryQueryToRawParts(raw);
    const out = [];
    const seen = new Set();
    for (const p of parts) {
        const key = p.trim().toLowerCase();
        if (!key) continue;
        const alias = CATEGORY_ALIASES[key];
        if (alias && JOB_CATEGORIES.includes(alias)) {
            if (!seen.has(alias)) {
                seen.add(alias);
                out.push(alias);
            }
            continue;
        }
        const canonical = JOB_CATEGORIES.find((c) => c.toLowerCase() === key);
        if (canonical && !seen.has(canonical)) {
            seen.add(canonical);
            out.push(canonical);
        }
    }
    return out;
}

/**
 * Infer canonical categories from free-text search (substring match on normalized haystack).
 */
export function inferCategoriesFromSearch(searchText) {
    const normalized = (searchText || '').toLowerCase().trim();
    if (!normalized) return [];

    const inferred = new Set();
    for (const cat of JOB_CATEGORIES) {
        const catLower = cat.toLowerCase();
        if (normalized.includes(catLower)) {
            inferred.add(cat);
            continue;
        }
        const keywords = KEYWORD_TO_CATEGORY_KEYWORDS[cat] || [];
        for (const kw of keywords) {
            if (normalized.includes(kw)) {
                inferred.add(cat);
                break;
            }
        }
    }
    return [...inferred];
}

/**
 * Build MongoDB filter fragments from query string params.
 * Merged with base visible-job filter via $and.
 *
 * Supported query params:
 * - q, search — keyword (title, company, description, tags, category inference)
 * - category — comma-separated JOB_CATEGORIES
 * - location — substring match (case-insensitive)
 * - jobType — comma-separated job.type values
 * - experienceLevel — comma-separated job.experience_level values
 * - tags — comma-separated; job must match each tag (regex on tags array)
 */
export function buildJobListMongoFilter(query = {}) {
    const q = (query.q || query.search || '').trim();
    const categories = normalizeCategoryParams(query.category);
    const locations = (query.location || '').trim();
    const jobTypes = parseCommaParam(query.jobType);
    const experienceLevels = parseCommaParam(query.experienceLevel);
    const tagFilters = parseCommaParam(query.tags);

    const andParts = [];

    if (categories.length) {
        // Primary filter: canonical category field on new jobs.
        const baseCategoryMatch = { category: { $in: categories } };

        // Temporary fallback for old jobs missing category:
        // infer category from title keyword only when category is absent/empty.
        const legacyKeywordSet = new Set();
        for (const cat of categories) {
            legacyKeywordSet.add(cat.toLowerCase());
            const words = KEYWORD_TO_CATEGORY_KEYWORDS[cat] || [];
            for (const w of words) legacyKeywordSet.add(w.toLowerCase());
        }
        const legacyPattern = Array.from(legacyKeywordSet).map(escapeRegex).join('|');
        const legacyFallbackMatch = legacyPattern
            ? {
                $and: [
                    {
                        $or: [
                            { category: { $exists: false } },
                            { category: null },
                            { category: '' }
                        ]
                    },
                    { title: { $regex: legacyPattern, $options: 'i' } }
                ]
            }
            : null;

        andParts.push(
            legacyFallbackMatch
                ? { $or: [baseCategoryMatch, legacyFallbackMatch] }
                : baseCategoryMatch
        );
    }

    if (locations) {
        andParts.push({
            location: { $regex: escapeRegex(locations), $options: 'i' }
        });
    }

    if (jobTypes.length) {
        andParts.push({ type: { $in: jobTypes } });
    }

    if (experienceLevels.length) {
        andParts.push({ experience_level: { $in: experienceLevels } });
    }

    for (const tag of tagFilters) {
        if (!tag) continue;
        andParts.push({
            tags: { $regex: escapeRegex(tag), $options: 'i' }
        });
    }

    if (q) {
        // Explicit sidebar categories must not be broadened by keyword→category inference
        const inferredCats = categories.length ? [] : inferCategoriesFromSearch(q);
        const regex = new RegExp(escapeRegex(q), 'i');
        const orConds = [
            { title: regex },
            { company_name: regex },
            { description: regex },
            { job_description: regex },
            { tags: regex }
        ];
        if (inferredCats.length) {
            orConds.push({ category: { $in: inferredCats } });
        }
        andParts.push({ $or: orConds });
    }

    return andParts;
}

/**
 * Combine base filter (e.g. approved active jobs) with search fragments.
 */
export function mergeWithBaseFilter(baseFilter, query) {
    const extra = buildJobListMongoFilter(query);
    if (extra.length === 0) return baseFilter;
    return { $and: [baseFilter, ...extra] };
}
