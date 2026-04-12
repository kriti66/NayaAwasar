import axios from 'axios';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Job from '../models/Job.js';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import Application from '../models/Application.js';
import { PUBLIC_MODERATION_MATCH, isJobVisibleForPublicListing } from '../utils/jobModeration.js';
import {
    buildFallbackFilterContext,
    extractRequiredSkillsFromJob,
    FALLBACK_CROSS_FILL_THRESHOLD,
    FALLBACK_MIN_INCLUSION_SCORE,
    hasFallbackFilterSignals,
    jobPassesPrimaryFallbackFilter,
    joinFallbackReasons,
    MAX_FALLBACK_JOBS_RETURNED,
    scoreFallbackJob
} from '../utils/recommendationFallback.js';

dotenv.config();

/** FastAPI recommendation-service base URL (no trailing slash). */
const RECOMMENDATION_SERVICE_URL = (process.env.RECOMMENDATION_SERVICE_URL?.trim() || '').replace(
    /\/+$/,
    ''
);
const RECOMMENDATION_TIMEOUT_MS =
    Number(process.env.RECOMMENDATION_SERVICE_TIMEOUT_MS) || 90000;

const MAX_JOBS_SENT_TO_RECOMMENDATION = 250;

if (process.env.NODE_ENV !== 'test') {
    console.info('[recommendations] config:', {
        RECOMMENDATION_SERVICE_URL_set: Boolean(RECOMMENDATION_SERVICE_URL)
    });
    if (!RECOMMENDATION_SERVICE_URL) {
        console.warn(
            '[recommendations] RECOMMENDATION_SERVICE_URL is not set — personalized recommendations will use offline fallback_scored until it is configured (e.g. http://127.0.0.1:8001).'
        );
    }
}

/**
 * Log a failed recommendation-service request for production debugging.
 * @param {string} baseUrl
 * @param {unknown} err
 */
function logRecommendationProviderFailure(baseUrl, err) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    const bodyMsg =
        (typeof data?.error === 'string' && data.error) ||
        (typeof data?.message === 'string' && data.message) ||
        '';
    const code = err?.code || '';
    const msg = bodyMsg || err?.message || String(err);
    const parts = ['[recommendations] recommendation-service request failed'];
    if (baseUrl) parts.push(`url=${baseUrl}`);
    if (status != null) parts.push(`HTTP ${status}`);
    if (code) parts.push(`code=${code}`);
    parts.push(`message=${msg}`);
    console.warn(parts.join(' | '));

    if (process.env.NODE_ENV !== 'production' && !err?.response) {
        console.warn(
            '  → Local dev: npm run dev:recommendation-service (repo root) and set RECOMMENDATION_SERVICE_URL in backend/.env.'
        );
    }
}

function logRecommendationPath(userId, provider, details = {}) {
    if (process.env.NODE_ENV === 'test') return;
    console.log('[recommendations] provider selected:', {
        userId: String(userId),
        provider,
        ...details
    });
}

/**
 * Fire-and-forget: refresh cached embedding in the recommendation service.
 */
export function triggerEmbeddingUpdate(docId, docType) {
    if (!docId || !docType || !RECOMMENDATION_SERVICE_URL) return;
    axios
        .post(
            `${RECOMMENDATION_SERVICE_URL}/recompute-embeddings`,
            { doc_id: String(docId), doc_type: docType },
            { timeout: 60000 }
        )
        .catch(() => {});
}

export async function recordUserInteraction(userId, jobId, action) {
    try {
        await mongoose.connection.db.collection('user_interactions').insertOne({
            user_id: new mongoose.Types.ObjectId(userId),
            job_id: new mongoose.Types.ObjectId(jobId),
            action,
            timestamp: new Date()
        });
    } catch (err) {
        if (process.env.NODE_ENV !== 'test') {
            console.warn('[recommendations] user_interactions insert failed', err?.message);
        }
    }
}

async function loadSeekerProfilePayload(userId) {
    const user = await User.findById(userId).lean();
    if (!user) return null;
    const profile = await Profile.findOne({ userId }).lean();
    const userSkills = Array.isArray(user.skills) ? user.skills : [];
    const profileSkillsList = Array.isArray(profile?.skills) ? profile.skills : [];
    const skills = [
        ...new Set(
            [...userSkills, ...profileSkillsList]
                .map((s) => String(s).trim())
                .filter(Boolean)
        )
    ];
    const jpUser = user.jobPreferences || {};
    const jpProf = profile?.jobPreferences || {};
    const experienceLevel = jpUser.seniority || jpProf.seniority || '';
    const preferredJobType =
        jpUser.jobType ||
        (Array.isArray(jpProf.jobTypes) && jpProf.jobTypes.length ? jpProf.jobTypes[0] : '') ||
        '';
    const workFromUser = (user.workExperience || []).map((w) => w.title).filter(Boolean);
    const workFromProfile = (profile?.experience || []).map((e) => e.role).filter(Boolean);
    const workExperienceTitles = [...new Set([...workFromUser, ...workFromProfile])];
    const jobTitle = [user.professionalHeadline, profile?.headline].find((x) => x && String(x).trim()) || '';
    const profession =
        String(user.profession || user.category || user.jobPreferences?.category || '').trim() ||
        String(profile?.jobPreferences?.category || '').trim();
    return {
        userProfileText: user.userProfileText || '',
        cvText: user.cvText || '',
        professionalHeadline: user.professionalHeadline || '',
        bio: user.bio || '',
        location: user.location || '',
        skills,
        jobPreferences: user.jobPreferences || {},
        workExperience: user.workExperience || [],
        education: user.education || [],
        projects: user.projects || [],
        headline: profile?.headline || '',
        summary: profile?.summary || '',
        profileLocation: profile?.location || '',
        profileSkills: [],
        profileJobPreferences: profile?.jobPreferences || {},
        jobTitle,
        experienceLevel,
        preferredJobType,
        workExperienceTitles,
        profession,
        userCategory: String(user.category || '').trim()
    };
}

function jobDocumentToRecommendationPayload(job) {
    return {
        _id: job._id?.toString?.() ?? String(job._id),
        title: job.title,
        job_title: job.job_title,
        description: job.description,
        job_description: job.job_description,
        requirements: job.requirements,
        company_name: job.company_name,
        location: job.location,
        type: job.type,
        job_type: job.job_type,
        experience_level: job.experience_level,
        category: job.category,
        tags: job.tags,
        requiredSkills: extractRequiredSkillsFromJob(job)
    };
}

async function loadActiveJobDocsForRecommendation(userId) {
    const applications = await Application.find({ seeker_id: userId }).select('job_id').lean();
    const appliedIds = new Set(applications.map((a) => String(a.job_id)));

    const jobDocs = await Job.find({
        status: 'Active',
        $and: [
            PUBLIC_MODERATION_MATCH,
            {
                $or: [
                    { application_deadline: { $exists: false } },
                    { application_deadline: { $gte: new Date() } }
                ]
            }
        ]
    })
        .sort({ createdAt: -1 })
        .limit(MAX_JOBS_SENT_TO_RECOMMENDATION)
        .lean();

    return jobDocs.filter((j) => !appliedIds.has(String(j._id)));
}

async function loadActiveJobsForRecommendation(userId) {
    const jobDocs = await loadActiveJobDocsForRecommendation(userId);
    return jobDocs.map(jobDocumentToRecommendationPayload);
}

/**
 * POST /recommend — does not throw on 4xx/5xx so callers can fall back to scored offline matches.
 */
async function fetchRecommendationServiceRecommendations(userId, limit, seekerProfile, jobs) {
    if (!RECOMMENDATION_SERVICE_URL) {
        if (process.env.NODE_ENV !== 'test') {
            console.warn(
                '[recommendations] RECOMMENDATION_SERVICE_URL not set; skipping POST /recommend.'
            );
        }
        return {
            recommendations: [],
            __serviceError: false,
            __networkError: false,
            __skippedNoUrl: true,
            __serviceStatus: null,
            __serviceBody: null,
            __serviceMessage: null,
            __serviceCode: null
        };
    }
    try {
        const body = {
            user_id: String(userId),
            limit,
            seeker_profile: seekerProfile && typeof seekerProfile === 'object' ? seekerProfile : {},
            jobs: Array.isArray(jobs) ? jobs : []
        };
        const { data, status } = await axios.post(
            `${RECOMMENDATION_SERVICE_URL}/recommend`,
            body,
            { timeout: RECOMMENDATION_TIMEOUT_MS, validateStatus: () => true }
        );
        if (status >= 400) {
            return {
                recommendations: [],
                __serviceError: true,
                __serviceStatus: status,
                __serviceBody: data
            };
        }
        return { ...data, __serviceError: false };
    } catch (e) {
        return {
            recommendations: [],
            __serviceError: true,
            __networkError: true,
            __serviceStatus: null,
            __serviceBody: null,
            __serviceMessage: e.message,
            __serviceCode: e.code
        };
    }
}

function formatRecommendationServiceMessage(svcResult) {
    const body = svcResult?.__serviceBody;
    const d = body?.detail;
    if (typeof d === 'string') return d;
    if (Array.isArray(d) && d[0]?.msg) return String(d[0].msg);
    if (typeof body?.message === 'string') return body.message;
    if (svcResult?.__serviceStatus) {
        return `Recommendation service returned HTTP ${svcResult.__serviceStatus}.`;
    }
    return 'Personalized recommendations are temporarily unavailable.';
}

export async function getSimilarJobs(jobId, limit = 5) {
    if (!RECOMMENDATION_SERVICE_URL) {
        if (process.env.NODE_ENV !== 'test') {
            console.warn(
                '[recommendations] getSimilarJobs: RECOMMENDATION_SERVICE_URL not set; returning empty.'
            );
        }
        return { job_id: String(jobId), similar_jobs: [], total: 0 };
    }
    try {
        const { data } = await axios.post(
            `${RECOMMENDATION_SERVICE_URL}/similar-jobs`,
            { job_id: String(jobId), limit },
            { timeout: RECOMMENDATION_TIMEOUT_MS }
        );
        return data;
    } catch {
        return { job_id: String(jobId), similar_jobs: [], total: 0 };
    }
}

async function hydrateRecommendationJobCards(recs) {
    if (!recs?.length) return [];
    const ids = recs.map((r) => r.job_id || r.jobId).filter(Boolean);
    const oids = ids.map((id) => new mongoose.Types.ObjectId(id));
    const jobs = await Job.find({ _id: { $in: oids } })
        .populate('company_id', 'name logo location')
        .lean();
    const byId = new Map(jobs.map((j) => [j._id.toString(), j]));
    return recs
        .map((r) => {
            const rid = r.job_id || r.jobId;
            const j = byId.get(String(rid));
            if (!j || !isJobVisibleForPublicListing(j)) return null;
            const raw = r.similarity_score ?? r.similarityScore ?? 0;
            const numRaw = Number(raw);
            const clamped = Number.isFinite(numRaw) ? Math.min(1, Math.max(0, numRaw)) : 0;
            /** Map cosine similarity to a user-facing 40–100% range (never below 40%). */
            const displayPct = Math.min(100, Math.max(40, Math.round(40 + clamped * 60)));
            const displayAi = displayPct / 100;
            const matchReason = r.matchReason ?? r.reason ?? '';
            return {
                ...j,
                aiScore: displayAi,
                matchScore: displayPct,
                matchReason,
                recommendationType: 'ai_match',
                recommendationConfidence:
                    displayPct >= 75 ? 'high' : displayPct >= 55 ? 'medium' : 'low'
            };
        })
        .filter(Boolean);
}

/**
 * Profile-based ranking when recommendation-service is unreachable (safety net).
 */
async function getScoredFallbackJobs(
    userId,
    limit = MAX_FALLBACK_JOBS_RETURNED,
    options = { aiOffline: true }
) {
    const aiOffline = options.aiOffline !== false;
    const profilePayload = await loadSeekerProfilePayload(userId);
    if (!profilePayload) {
        return {
            jobs: [],
            isComplete: false,
            message: 'User not found.',
            source: 'error'
        };
    }

    let jobDocs = await loadActiveJobDocsForRecommendation(userId);
    const filterCtx = buildFallbackFilterContext(profilePayload);
    const titleBlob = filterCtx.titleBlob;

    const blockedSet = new Set(filterCtx.blockedCategories || []);
    const adjacentSet = new Set(filterCtx.adjacentCategories || []);
    const categoryGateOn = blockedSet.size > 0;
    if (categoryGateOn) {
        jobDocs = jobDocs.filter((j) => {
            const c = String(j.category || '').trim();
            return c && !blockedSet.has(c);
        });
    }

    const allowed = filterCtx.allowed;
    const hasSignals = hasFallbackFilterSignals(filterCtx);

    const experienceLevel =
        profilePayload.experienceLevel ||
        profilePayload.jobPreferences?.seniority ||
        profilePayload.profileJobPreferences?.seniority ||
        '';
    const preferredJobType =
        profilePayload.preferredJobType ||
        profilePayload.jobPreferences?.jobType ||
        (Array.isArray(profilePayload.profileJobPreferences?.jobTypes) &&
        profilePayload.profileJobPreferences.jobTypes.length
            ? profilePayload.profileJobPreferences.jobTypes[0]
            : '') ||
        '';
    const location =
        profilePayload.location ||
        profilePayload.profileLocation ||
        profilePayload.jobPreferences?.location ||
        profilePayload.profileJobPreferences?.preferredLocation ||
        '';

    const seeker = {
        jobTitle: titleBlob,
        experienceLevel,
        preferredJobType,
        location,
        skills: profilePayload.skills || []
    };

    const target = Math.min(limit, MAX_FALLBACK_JOBS_RETURNED);

    /**
     * @param {typeof jobDocs} pool
     * @param {boolean} categoryFilterApplied
     * @param {'primary'|'cross_category'} scope
     */
    function scorePool(pool, categoryFilterApplied, scope) {
        return pool
            .map((job) => {
                const { score, reasons } = scoreFallbackJob(job, seeker, { categoryFilterApplied });
                return { job, score, reasons, scope };
            })
            .filter((x) => x.score >= FALLBACK_MIN_INCLUSION_SCORE);
    }

    let combined = [];

    if (hasSignals) {
        const primaryPool = jobDocs.filter((j) => jobPassesPrimaryFallbackFilter(j, filterCtx));
        const categoryFilterAppliedPrimary = primaryPool.length < jobDocs.length;
        let primaryScored = scorePool(
            primaryPool.length > 0 ? primaryPool : [],
            categoryFilterAppliedPrimary || primaryPool.length > 0,
            'primary'
        );
        primaryScored.sort((a, b) => b.score - a.score);
        combined = primaryScored.slice(0, target);

        if (combined.length < FALLBACK_CROSS_FILL_THRESHOLD && primaryPool.length > 0) {
            const taken = new Set(combined.map((x) => x.job._id.toString()));
            const crossPool = jobDocs.filter((j) => {
                if (taken.has(j._id.toString())) return false;
                if (categoryGateOn && adjacentSet.size > 0) {
                    const c = String(j.category || '').trim();
                    if (!c || !adjacentSet.has(c)) return false;
                }
                return true;
            });
            let crossScored = scorePool(crossPool, false, 'cross_category');
            crossScored.sort((a, b) => b.score - a.score);
            for (const row of crossScored) {
                if (combined.length >= target) break;
                combined.push(row);
            }
        }

        if (combined.length === 0 && primaryPool.length === 0) {
            const categoryFilterApplied = allowed !== null && allowed.length > 0;
            let pool = jobDocs;
            if (allowed !== null) {
                if (allowed.length === 0) pool = [];
                else pool = jobDocs.filter((j) => allowed.includes(j.category));
            }
            let scored = scorePool(pool, categoryFilterApplied, 'primary');
            scored.sort((a, b) => b.score - a.score);
            combined = scored.slice(0, target);
        }
    } else {
        let candidates = jobDocs;
        if (allowed !== null) {
            if (allowed.length === 0) {
                candidates = [];
            } else {
                candidates = jobDocs.filter((j) => allowed.includes(j.category));
            }
        }
        const categoryFilterApplied = allowed !== null && allowed.length > 0;
        let scored = scorePool(candidates, categoryFilterApplied, 'primary');
        scored.sort((a, b) => b.score - a.score);
        combined = scored.slice(0, target);
    }

    if (combined.length === 0) {
        const genericProfileHint =
            'Add a clear job title, skills, and preferences so we can improve your matching results.';
        const offlineProfileHint =
            'Add a clear job title, skills, and preferences so we can match you when the recommendation service is offline.';
        return {
            jobs: [],
            isComplete: false,
            message:
                allowed === null
                    ? aiOffline
                        ? offlineProfileHint
                        : genericProfileHint
                    : 'No open jobs in your field right now. Check back soon or adjust your headline.',
            source: 'fallback_empty',
            ...(aiOffline
                ? {
                    recommendationNotice:
                        'The recommendation service is offline. Complete your profile headline and skills for better offline matches.'
                }
                : {})
        };
    }

    const oids = combined.map((t) => t.job._id);
    const populated = await Job.find({ _id: { $in: oids } })
        .populate('company_id', 'name logo location')
        .lean();
    const byId = new Map(populated.map((j) => [j._id.toString(), j]));

    const jobs = combined
        .map(({ job: j0, score, reasons, scope }) => {
            const j = byId.get(j0._id.toString());
            if (!j || !isJobVisibleForPublicListing(j)) return null;
            const matchReason = joinFallbackReasons(reasons);
            const aiScore = Math.min(1, Math.max(0, score / 100));
            return {
                ...j,
                aiScore,
                matchScore: Math.min(100, score),
                matchReason,
                recommendationType: 'fallback_scored',
                recommendationMatchScope: scope,
                recommendationConfidence: score >= 75 ? 'high' : score >= 55 ? 'medium' : 'low'
            };
        })
        .filter(Boolean);

    return {
        jobs,
        isComplete: jobs.length > 0,
        source: 'fallback_scored',
        ...(aiOffline
            ? {
                recommendationNotice:
                    'The recommendation service is offline. These picks use your skills, job area, and preferences instead of the AI engine.'
            }
            : {})
    };
}

/**
 * recommendation-service (FastAPI) when RECOMMENDATION_SERVICE_URL is set;
 * otherwise scored offline fallback (no silent remote defaults).
 */
export async function getRecommendedJobs(userId, options = {}) {
    const limit = Math.min(Number(options.limit) || 50, 100);
    const serviceLimit = Math.min(Math.max(limit, 1), 10);
    const profilePayload = await loadSeekerProfilePayload(userId);
    if (!profilePayload) {
        return {
            jobs: [],
            isComplete: false,
            message: 'User not found.',
            source: 'error'
        };
    }

    const jobs = await loadActiveJobsForRecommendation(userId);

    const seekerRecFilterCtx = buildFallbackFilterContext(profilePayload);
    const blockedRecCategories = new Set(seekerRecFilterCtx.blockedCategories || []);
    const stripHardBlockedRecommendations = (list) => {
        if (!Array.isArray(list) || blockedRecCategories.size === 0) return list;
        return list.filter((j) => {
            const c = String(j?.category || '').trim();
            return c && !blockedRecCategories.has(c);
        });
    };

    if (!RECOMMENDATION_SERVICE_URL) {
        logRecommendationPath(userId, 'fallback_scored', {
            reason: 'recommendation_service_url_missing'
        });
        return getScoredFallbackJobs(userId, Math.min(limit, 5), { aiOffline: true });
    }

    const svcResult = await fetchRecommendationServiceRecommendations(
        userId,
        serviceLimit,
        profilePayload,
        jobs
    );
    const recs = svcResult.recommendations || [];
    const hydrated = await hydrateRecommendationJobCards(recs);
    const aiQuality = stripHardBlockedRecommendations(hydrated.filter((j) => j.matchScore >= 50));

    if (aiQuality.length > 0) {
        logRecommendationPath(userId, 'recommendation_service', {
            resultCount: aiQuality.length
        });
        return {
            jobs: aiQuality,
            isComplete: true,
            source: 'recommendation_service'
        };
    }

    if (recs.length > 0 && hydrated.length === 0) {
        logRecommendationPath(userId, 'fallback_scored', {
            reason: 'recommendation_filtered'
        });
        return getScoredFallbackJobs(userId, Math.min(limit, 5), { aiOffline: true });
    }

    if (recs.length > 0 && hydrated.length > 0 && aiQuality.length === 0) {
        logRecommendationPath(userId, 'fallback_scored', {
            reason: 'recommendation_low_quality_scores'
        });
        return getScoredFallbackJobs(userId, Math.min(limit, 5), { aiOffline: false });
    }

    if (svcResult.__skippedNoUrl || svcResult.__networkError) {
        if (svcResult.__networkError && process.env.NODE_ENV !== 'test') {
            const syntheticErr = {
                message: svcResult.__serviceMessage || 'network error',
                code: svcResult.__serviceCode || ''
            };
            logRecommendationProviderFailure(RECOMMENDATION_SERVICE_URL, syntheticErr);
        }
        logRecommendationPath(userId, 'fallback_scored', {
            reason: svcResult.__networkError ? 'recommendation_network_error' : 'recommendation_url_missing'
        });
        return getScoredFallbackJobs(userId, Math.min(limit, 5), { aiOffline: true });
    }

    if (svcResult.__serviceError) {
        if (process.env.NODE_ENV !== 'test') {
            const syntheticErr = {
                response: {
                    status: svcResult.__serviceStatus,
                    data: svcResult.__serviceBody
                },
                message: formatRecommendationServiceMessage(svcResult)
            };
            logRecommendationProviderFailure(RECOMMENDATION_SERVICE_URL, syntheticErr);
        }
        logRecommendationPath(userId, 'fallback_scored', {
            reason: 'recommendation_service_error'
        });
        return getScoredFallbackJobs(userId, Math.min(limit, 5), { aiOffline: true });
    }

    logRecommendationPath(userId, 'fallback_scored', {
        reason: 'recommendation_empty'
    });
    return getScoredFallbackJobs(userId, Math.min(limit, 5), { aiOffline: true });
}

/** UI + label gating: recommendation_service counts as "AI"; fallback_scored is honest fallback. */
export function getRecommendationProviderFromSource(source) {
    if (
        source === 'recommendation_service' ||
        source === 'python' ||
        source === 'flask_tfidf'
    ) {
        return 'ai';
    }
    return 'fallback';
}

export async function hydrateSimilarJobsResponse(pythonPayload) {
    const recs = pythonPayload?.similar_jobs || [];
    const hydrated = await hydrateRecommendationJobCards(recs);
    return {
        job_id: pythonPayload?.job_id,
        similar_jobs: hydrated,
        total: hydrated.length
    };
}
