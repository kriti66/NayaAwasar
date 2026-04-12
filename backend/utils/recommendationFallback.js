/**
 * Scored fallback when Flask/FastAPI are unavailable.
 * Uses the same canonical categories as JOB_CATEGORIES.
 */
import { JOB_CATEGORIES } from '../constants/jobCategories.js';

/** Minimum total score to include a job in offline fallback results. */
export const FALLBACK_MIN_INCLUSION_SCORE = 55;

/** Hard cap on how many fallback jobs are returned per request. */
export const MAX_FALLBACK_JOBS_RETURNED = 5;

/** @type {{ keywords: string[]; categories: string[] }[]} */
export const TITLE_KEYWORD_RULES = [
    {
        keywords: [
            'engineer',
            'civil',
            'structural',
            'mechanical',
            'electrical',
            'construction',
            'surveyor',
            'developer',
            'software',
            'programmer',
            'devops',
            'full stack',
            'fullstack',
            'frontend',
            'backend',
            'web dev',
            'data scientist',
            'analyst',
            'coding',
            'react',
            'node',
            'java ',
            'python'
        ],
        categories: ['IT', 'Engineering']
    },
    {
        keywords: ['doctor', 'nurse', 'medical', 'health', 'clinical', 'surgeon', 'patient', 'hospital'],
        categories: ['Health']
    },
    {
        keywords: ['teacher', 'instructor', 'tutor', 'education', 'lecturer', 'school', 'principal'],
        categories: ['Education']
    },
    {
        keywords: ['accountant', 'finance', 'banking', 'audit', 'cfo', 'investment'],
        categories: ['Finance']
    },
    {
        keywords: ['designer', 'ux', 'ui', 'graphic', 'creative'],
        categories: ['IT', 'Engineering']
    },
    {
        keywords: ['manager', 'admin', 'operations', 'business', 'hr', 'human resource', 'supervisor'],
        categories: ['Finance', 'Government', 'Engineering', 'IT']
    }
];

/**
 * Title-only keyword inference (headline), no skills — same rules as before.
 * @returns {string[]|null}
 */
function getTitleKeywordAllowedCategories(jobTitleBlob) {
    const t = String(jobTitleBlob || '').toLowerCase();
    if (!t.trim()) return null;
    const allowed = new Set();
    for (const rule of TITLE_KEYWORD_RULES) {
        if (rule.keywords.some((kw) => t.includes(kw))) {
            rule.categories.forEach((c) => allowed.add(c));
        }
    }
    if (allowed.size === 0) return null;
    return [...allowed].filter((c) => JOB_CATEGORIES.includes(c));
}

function keywordsForCategory(cat) {
    const set = new Set();
    for (const rule of TITLE_KEYWORD_RULES) {
        if (rule.categories.includes(cat)) {
            for (const kw of rule.keywords) {
                const k = String(kw).toLowerCase().trim();
                if (k.length >= 2) set.add(k);
            }
        }
    }
    return set;
}

function unionKeywordsForCategories(categorySet) {
    const u = new Set();
    for (const c of categorySet) {
        keywordsForCategory(c).forEach((k) => u.add(k));
    }
    return u;
}

function keywordSetsIntersect(a, b) {
    for (const x of a) {
        if (b.has(x)) return true;
    }
    return false;
}

function anyCategoryKeywordInBlob(keywordSet, blobLower) {
    if (!blobLower || !keywordSet.size) return false;
    for (const k of keywordSet) {
        if (k.length >= 2 && blobLower.includes(k)) return true;
    }
    return false;
}

/**
 * Allowed categories from headline + blocked/adjacent sets for hard gating and fill-in.
 * @returns {{ allowed: string[]|null; blockedCategories: string[]; adjacentCategories: string[] }}
 */
export function getAllowedJobCategoriesForSeeker(jobTitleBlob, skills = []) {
    const titleAllowed = getTitleKeywordAllowedCategories(jobTitleBlob);
    const hints = inferSeekerCategoryHints(jobTitleBlob, skills);
    const seekerCore = new Set(hints);
    if (titleAllowed !== null) {
        for (const c of titleAllowed) seekerCore.add(c);
    }

    if (seekerCore.size === 0) {
        return {
            allowed: titleAllowed,
            blockedCategories: [],
            adjacentCategories: []
        };
    }

    const blobLower = [
        String(jobTitleBlob || ''),
        ...(Array.isArray(skills) ? skills : []).map((s) => String(s))
    ]
        .join(' ')
        .toLowerCase();

    const ks = unionKeywordsForCategories(seekerCore);
    const adjacent = new Set(seekerCore);
    for (const c of JOB_CATEGORIES) {
        if (adjacent.has(c)) continue;
        const kc = keywordsForCategory(c);
        if (keywordSetsIntersect(kc, ks)) adjacent.add(c);
        else if (anyCategoryKeywordInBlob(kc, blobLower)) adjacent.add(c);
    }

    const adjacentCategories = [...adjacent];
    const blockedCategories = JOB_CATEGORIES.filter((c) => !adjacent.has(c));

    return {
        allowed: titleAllowed,
        blockedCategories,
        adjacentCategories
    };
}

/**
 * Category signals from seeker title + skills (same keyword rules as title).
 * @returns {Set<string>}
 */
export function inferSeekerCategoryHints(jobTitleBlob, skills) {
    const blob = [String(jobTitleBlob || ''), ...(Array.isArray(skills) ? skills : []).map((s) => String(s))].join(' ').toLowerCase();
    if (!blob.trim()) return new Set();
    const hints = new Set();
    for (const rule of TITLE_KEYWORD_RULES) {
        if (rule.keywords.some((kw) => blob.includes(kw))) {
            rule.categories.forEach((c) => hints.add(c));
        }
    }
    return hints;
}

/**
 * True if job category is in a different "career cluster" than seeker hints and
 * the match is not strong enough to keep (score must exceed this threshold).
 */
function isCrossClusterMismatch(seekerHints, jobCategory, score, strongScoreThreshold = 70) {
    if (!jobCategory || !JOB_CATEGORIES.includes(jobCategory)) return false;
    if (!seekerHints || seekerHints.size === 0) return false;
    if (score > strongScoreThreshold) return false;

    const hasStem = seekerHints.has('IT') || seekerHints.has('Engineering');
    const hasHealth = seekerHints.has('Health');
    const hasEdu = seekerHints.has('Education');
    const hasFinance = seekerHints.has('Finance');
    const hasGov = seekerHints.has('Government');

    if (hasStem && (jobCategory === 'Health' || jobCategory === 'Education')) return true;
    if (hasHealth && (jobCategory === 'IT' || jobCategory === 'Engineering' || jobCategory === 'Education')) return true;
    if (hasEdu && (jobCategory === 'IT' || jobCategory === 'Engineering' || jobCategory === 'Health')) return true;

    if (hasFinance && (jobCategory === 'Health' || jobCategory === 'Education')) return true;
    if (hasHealth && jobCategory === 'Finance') return true;
    if (hasEdu && jobCategory === 'Finance') return true;

    if (hasGov && (jobCategory === 'Health' || jobCategory === 'Education')) return true;
    if ((hasHealth || hasEdu) && jobCategory === 'Government') return true;

    if (hasFinance && (jobCategory === 'IT' || jobCategory === 'Engineering')) return true;
    if (hasStem && jobCategory === 'Finance') return true;

    return false;
}

export function extractRequiredSkillsFromJob(job) {
    const fromTags = Array.isArray(job.tags) ? job.tags.map((x) => String(x).trim()).filter(Boolean) : [];
    const req = String(job.requirements || '');
    const split = req
        .split(/[,;·\n|]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 1 && s.length < 80);
    return [...new Set([...fromTags, ...split])].slice(0, 50);
}

function normExp(s) {
    return String(s || '')
        .toLowerCase()
        .replace(/[-_]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function experienceMatches(seekerExp, jobLevel) {
    const a = normExp(seekerExp);
    const b = normExp(jobLevel);
    if (!a || !b) return false;
    const buckets = [
        ['entry', 'junior', 'intern', 'graduate'],
        ['mid', 'middle', 'intermediate'],
        ['senior', 'lead', 'principal'],
        ['executive', 'director', 'head', 'chief']
    ];
    for (const bucket of buckets) {
        const sa = bucket.some((k) => a.includes(k));
        const sb = bucket.some((k) => b.includes(k));
        if (sa && sb) return true;
    }
    return a.includes(b) || b.includes(a);
}

function typeMatches(pref, jobType) {
    const a = normExp(pref);
    const b = normExp(jobType);
    if (!a || !b) return false;
    return a.includes(b) || b.includes(a);
}

function locationMatches(seekerLoc, jobLoc) {
    const j = normExp(jobLoc);
    const s = normExp(seekerLoc);
    if (!j || !s || s.length < 2) return false;
    if (j.includes(s) || s.includes(j)) return true;
    return s.split(/[\s,]+/).some((tok) => tok.length > 2 && j.includes(tok));
}

/** Sort order for matchReason segments (best first). */
const REASON_ORDER = { skills: 0, category: 1, experience: 2, location: 3, jobType: 4 };

/**
 * Skill overlap bonus: stronger weight than category-only baseline so close skill matches rank higher.
 */
function skillOverlapBonus(matchCount) {
    if (matchCount <= 0) return 0;
    if (matchCount === 1) return 28;
    if (matchCount <= 3) return 34;
    return 40;
}

/**
 * @param {object} job — Mongo job lean doc
 * @param {object} seeker — { jobTitle, experienceLevel, preferredJobType, location, skills: string[] }
 * @param {{ categoryFilterApplied?: boolean }} options — true when seeker passed hard category filter
 */
export function scoreFallbackJob(job, seeker, options = {}) {
    const { categoryFilterApplied = false } = options;
    const reasons = [];

    const seekerSkills = Array.isArray(seeker.skills) ? seeker.skills.map((s) => String(s).trim()).filter(Boolean) : [];
    const jobSkillTokens = extractRequiredSkillsFromJob(job).map((s) => s.toLowerCase());
    const titleLower = String(job.title || '').toLowerCase();

    const matchedSkillNames = [];
    for (const sk of seekerSkills) {
        const sl = sk.toLowerCase();
        if (sl.length < 2) continue;
        if (jobSkillTokens.some((js) => js.includes(sl) || sl.includes(js))) {
            matchedSkillNames.push(sk);
            continue;
        }
        if (titleLower.includes(sl)) matchedSkillNames.push(sk);
    }
    const uniqueSkills = [...new Set(matchedSkillNames)];

    let bonus = 0;
    if (uniqueSkills.length > 0) {
        bonus += skillOverlapBonus(uniqueSkills.length);
        reasons.push({
            type: 'skills',
            label: `Matches your skills: ${uniqueSkills.slice(0, 5).join(', ')}`
        });
    }

    if (categoryFilterApplied && job.category) {
        reasons.push({
            type: 'category',
            label: `Same career field (${job.category})`
        });
    }

    if (experienceMatches(seeker.experienceLevel, job.experience_level)) {
        bonus += 15;
        reasons.push({
            type: 'experience',
            label: `Matches your experience level: ${job.experience_level || seeker.experienceLevel}`
        });
    }

    const jt = job.job_type || job.type || '';
    if (typeMatches(seeker.preferredJobType, jt)) {
        bonus += 15;
        reasons.push({
            type: 'jobType',
            label: `Aligns with your preferred job type (${jt})`
        });
    }

    if (locationMatches(seeker.location, job.location)) {
        bonus += 10;
        reasons.push({
            type: 'location',
            label: `Near your location: ${job.location || seeker.location}`
        });
    }

    let score;
    if (categoryFilterApplied) {
        score = 40 + bonus;
    } else {
        score = bonus;
    }
    score = Math.min(100, score);

    const seekerHints = inferSeekerCategoryHints(seeker.jobTitle || '', seeker.skills || []);
    if (isCrossClusterMismatch(seekerHints, job.category, score)) {
        return { score: 0, reasons: [] };
    }

    return { score, reasons };
}

export function joinFallbackReasons(reasons) {
    if (!reasons?.length) return '';
    const sorted = [...reasons].sort(
        (a, b) => (REASON_ORDER[a.type] ?? 99) - (REASON_ORDER[b.type] ?? 99)
    );
    return sorted.map((r) => r.label).join(' | ');
}

/** When primary (field-matched) pool yields fewer than this, add cross-category fill rows. */
export const FALLBACK_CROSS_FILL_THRESHOLD = 5;

/**
 * Build seeker signals for pre-filtering fallback jobs (before scoreFallbackJob).
 * @param {object} profilePayload — from loadSeekerProfilePayload
 */
export function buildFallbackFilterContext(profilePayload) {
    if (!profilePayload || typeof profilePayload !== 'object') {
        return {
            titleBlob: '',
            skills: [],
            workTitles: [],
            professionStrings: [],
            allowed: null,
            blockedCategories: [],
            adjacentCategories: [],
            matchAllowedCategories: [],
            categoryHints: new Set()
        };
    }

    const titleBlob = [
        profilePayload.jobTitle,
        profilePayload.professionalHeadline,
        profilePayload.headline
    ]
        .filter((x) => x && String(x).trim())
        .join(' ')
        .trim();

    const skills = Array.isArray(profilePayload.skills) ? profilePayload.skills : [];
    const workTitles = [
        ...(Array.isArray(profilePayload.workExperienceTitles) ? profilePayload.workExperienceTitles : []),
        ...(Array.isArray(profilePayload.workExperience)
            ? profilePayload.workExperience.map((w) => w?.title).filter(Boolean)
            : [])
    ];

    const professionStrings = [
        profilePayload.profession,
        profilePayload.userCategory,
        profilePayload.jobPreferences?.category,
        profilePayload.profileJobPreferences?.category
    ]
        .map((x) => String(x || '').trim())
        .filter(Boolean);

    const gateSkillsBlob = [...skills, ...professionStrings, ...workTitles];
    const gate = getAllowedJobCategoriesForSeeker(titleBlob, gateSkillsBlob);
    const categoryHints = inferSeekerCategoryHints(titleBlob, skills);

    const hintsForCore = inferSeekerCategoryHints(titleBlob, gateSkillsBlob);
    const seekerCoreSet = new Set(hintsForCore);
    if (gate.allowed !== null) {
        gate.allowed.forEach((c) => seekerCoreSet.add(c));
    }
    const matchAllowedCategories = [...seekerCoreSet].filter((c) => JOB_CATEGORIES.includes(c));

    return {
        titleBlob,
        skills,
        workTitles,
        professionStrings,
        allowed: gate.allowed,
        blockedCategories: gate.blockedCategories,
        adjacentCategories: gate.adjacentCategories,
        matchAllowedCategories,
        categoryHints
    };
}

export function hasFallbackFilterSignals(ctx) {
    if (!ctx) return false;
    if ((ctx.skills || []).length > 0) return true;
    if (String(ctx.titleBlob || '').trim()) return true;
    if ((ctx.professionStrings || []).length > 0) return true;
    if (ctx.allowed != null && ctx.allowed.length > 0) return true;
    if (ctx.categoryHints && ctx.categoryHints.size > 0) return true;
    return false;
}

/**
 * Job matches seeker field (category/profession, inferred categories, skill/tag/title, work titles).
 */
export function jobPassesPrimaryFallbackFilter(job, ctx) {
    if (!job || !ctx) return false;

    const jcat = String(job.category || '').trim();
    if (
        Array.isArray(ctx.blockedCategories) &&
        ctx.blockedCategories.length > 0 &&
        jcat &&
        ctx.blockedCategories.includes(jcat)
    ) {
        return false;
    }
    const jcatLower = jcat.toLowerCase();
    const titleLower = String(job.title || '').toLowerCase();
    const tags = Array.isArray(job.tags) ? job.tags.map((t) => String(t).toLowerCase()) : [];

    for (const p of ctx.professionStrings || []) {
        const pl = p.toLowerCase();
        if (!pl) continue;
        if (jcatLower === pl) return true;
        for (const jc of JOB_CATEGORIES) {
            if (jc.toLowerCase() === pl && jcat === jc) return true;
        }
    }

    if (ctx.allowed != null && ctx.allowed.length > 0 && jcat && ctx.allowed.includes(jcat)) {
        return true;
    }

    if (ctx.categoryHints && ctx.categoryHints.size > 0 && jcat && ctx.categoryHints.has(jcat)) {
        return true;
    }

    for (const sk of ctx.skills || []) {
        const sl = String(sk).toLowerCase().trim();
        if (sl.length < 2) continue;
        if (tags.some((t) => t.includes(sl) || sl.includes(t))) return true;
        if (titleLower.includes(sl)) return true;
    }

    for (const wt of ctx.workTitles || []) {
        const w = String(wt).toLowerCase().trim();
        if (w.length < 3) continue;
        if (titleLower.includes(w)) return true;
    }

    return false;
}
