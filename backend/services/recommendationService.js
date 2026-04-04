import axios from 'axios';
import mongoose from 'mongoose';
import Job from '../models/Job.js';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import Application from '../models/Application.js';
import { PUBLIC_MODERATION_MATCH, isJobVisibleForPublicListing } from '../utils/jobModeration.js';
import {
    extractRequiredSkillsFromJob,
    FALLBACK_MIN_INCLUSION_SCORE,
    getAllowedJobCategoriesForSeeker,
    joinFallbackReasons,
    MAX_FALLBACK_JOBS_RETURNED,
    scoreFallbackJob
} from '../utils/recommendationFallback.js';

/** FastAPI / embedding service — env only; no localhost default (avoids silent prod misconfig). */
const PYTHON_URL = (process.env.PYTHON_SERVICE_URL?.trim() || '').replace(/\/+$/, '');
/** Flask TF-IDF service — env only. */
const FLASK_AI_URL = (process.env.FLASK_AI_URL?.trim() || '').replace(/\/+$/, '');
const FLASK_TIMEOUT_MS = Number(process.env.FLASK_AI_TIMEOUT_MS) || 90000;
const PYTHON_TIMEOUT_MS = 90000;

const MAX_JOBS_SENT_TO_FLASK = 250;

if (process.env.NODE_ENV !== 'test') {
    console.info('[recommendations] AI service config:', {
        FLASK_AI_URL_set: Boolean(FLASK_AI_URL),
        PYTHON_SERVICE_URL_set: Boolean(PYTHON_URL)
    });
    if (!FLASK_AI_URL) {
        console.warn(
            '[recommendations] FLASK_AI_URL is not set or empty — Flask TF-IDF recommendations will be skipped. Set FLASK_AI_URL in production (e.g. your Render Flask service URL).'
        );
    }
    if (!PYTHON_URL) {
        console.warn(
            '[recommendations] PYTHON_SERVICE_URL is not set or empty — FastAPI /recommend and similar-jobs will be skipped. Set PYTHON_SERVICE_URL when that service is deployed.'
        );
    }
}

/**
 * Log a failed AI provider request for production debugging.
 * @param {'Flask TF-IDF'|'FastAPI'} serviceName
 * @param {string} baseUrl
 * @param {unknown} err
 */
function logRecommendationProviderFailure(serviceName, baseUrl, err) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    const bodyMsg =
        (typeof data?.error === 'string' && data.error) ||
        (typeof data?.message === 'string' && data.message) ||
        '';
    const code = err?.code || '';
    const msg = bodyMsg || err?.message || String(err);
    const parts = [`[recommendations] ${serviceName} request failed`];
    if (baseUrl) parts.push(`url=${baseUrl}`);
    if (status != null) parts.push(`HTTP ${status}`);
    if (code) parts.push(`code=${code}`);
    parts.push(`message=${msg}`);
    console.warn(parts.join(' | '));

    if (process.env.NODE_ENV !== 'production' && serviceName === 'Flask TF-IDF' && !err?.response) {
        console.warn(
            '  → Local dev: npm run dev:flask (repo root), or npm run dev:all. If port 5000 is busy, set PORT in ai-service and FLASK_AI_URL accordingly.'
        );
    }
}

/**
 * Fire-and-forget: refresh cached embedding in the Python (FastAPI) service.
 */
export function triggerEmbeddingUpdate(docId, docType) {
    if (!docId || !docType || !PYTHON_URL) return;
    axios
        .post(
            `${PYTHON_URL}/recompute-embeddings`,
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
        workExperienceTitles
    };
}

function jobDocumentToFlaskPayload(job) {
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
        .limit(MAX_JOBS_SENT_TO_FLASK)
        .lean();

    return jobDocs.filter((j) => !appliedIds.has(String(j._id)));
}

async function loadActiveJobsForFlask(userId) {
    const jobDocs = await loadActiveJobDocsForRecommendation(userId);
    return jobDocs.map(jobDocumentToFlaskPayload);
}

async function postFlaskRecommend(seeker_profile, jobs, limit) {
    const { data, status } = await axios.post(
        `${FLASK_AI_URL}/recommend`,
        { seeker_profile, jobs, limit },
        { timeout: FLASK_TIMEOUT_MS, validateStatus: () => true }
    );

    if (status >= 400) {
        const err = new Error(data?.error || 'Flask recommendation error');
        err.response = { status, data };
        throw err;
    }

    return data;
}

/**
 * Calls FastAPI /recommend without throwing on 4xx/5xx so we can avoid
 * mislabeling "trending" jobs as AI when Python returns [] or an error body.
 */
async function fetchPythonRecommendations(userId, limit) {
    if (!PYTHON_URL) {
        if (process.env.NODE_ENV !== 'test') {
            console.warn('[recommendations] FastAPI: PYTHON_SERVICE_URL not set; skipping POST /recommend.');
        }
        return {
            recommendations: [],
            __pythonError: false,
            __networkError: false,
            __skippedNoUrl: true,
            __pythonStatus: null,
            __pythonBody: null,
            __pythonMessage: null,
            __pythonCode: null
        };
    }
    try {
        const { data, status } = await axios.post(
            `${PYTHON_URL}/recommend`,
            { user_id: String(userId), limit },
            { timeout: PYTHON_TIMEOUT_MS, validateStatus: () => true }
        );
        if (status >= 400) {
            return {
                recommendations: [],
                __pythonError: true,
                __pythonStatus: status,
                __pythonBody: data
            };
        }
        return { ...data, __pythonError: false };
    } catch (e) {
        return {
            recommendations: [],
            __pythonError: true,
            __networkError: true,
            __pythonStatus: null,
            __pythonBody: null,
            __pythonMessage: e.message,
            __pythonCode: e.code
        };
    }
}

function formatPythonServiceMessage(pyResult) {
    const body = pyResult?.__pythonBody;
    const d = body?.detail;
    if (typeof d === 'string') return d;
    if (Array.isArray(d) && d[0]?.msg) return String(d[0].msg);
    if (typeof body?.message === 'string') return body.message;
    if (pyResult?.__pythonStatus) {
        return `Recommendation service returned HTTP ${pyResult.__pythonStatus}.`;
    }
    return 'Personalized recommendations are temporarily unavailable.';
}

export async function getSimilarJobs(jobId, limit = 5) {
    if (!PYTHON_URL) {
        if (process.env.NODE_ENV !== 'test') {
            console.warn('[recommendations] getSimilarJobs: PYTHON_SERVICE_URL not set; returning empty.');
        }
        return { job_id: String(jobId), similar_jobs: [], total: 0 };
    }
    try {
        const { data } = await axios.post(
            `${PYTHON_URL}/similar-jobs`,
            { job_id: String(jobId), limit },
            { timeout: PYTHON_TIMEOUT_MS }
        );
        return data;
    } catch {
        return { job_id: String(jobId), similar_jobs: [], total: 0 };
    }
}

async function hydratePythonJobCards(recs) {
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
 * Profile-based ranking when Flask and FastAPI are unreachable (no generic "trending" list).
 */
async function getScoredFallbackJobs(userId, limit = MAX_FALLBACK_JOBS_RETURNED) {
    const profilePayload = await loadSeekerProfilePayload(userId);
    if (!profilePayload) {
        return {
            jobs: [],
            isComplete: false,
            message: 'User not found.',
            source: 'error'
        };
    }

    const jobDocs = await loadActiveJobDocsForRecommendation(userId);
    const titleBlob = [
        profilePayload.jobTitle,
        profilePayload.professionalHeadline,
        profilePayload.headline
    ]
        .filter((x) => x && String(x).trim())
        .join(' ');

    const allowed = getAllowedJobCategoriesForSeeker(titleBlob);
    let candidates = jobDocs;
    if (allowed !== null) {
        if (allowed.length === 0) {
            candidates = [];
        } else {
            candidates = jobDocs.filter((j) => allowed.includes(j.category));
        }
    }

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

    const categoryFilterApplied = allowed !== null && allowed.length > 0;

    let scored = candidates
        .map((job) => {
            const { score, reasons } = scoreFallbackJob(job, seeker, { categoryFilterApplied });
            return { job, score, reasons };
        })
        .filter((x) => x.score >= FALLBACK_MIN_INCLUSION_SCORE);

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, Math.min(limit, MAX_FALLBACK_JOBS_RETURNED));

    if (top.length === 0) {
        return {
            jobs: [],
            isComplete: false,
            message:
                allowed === null
                    ? 'Add a clear job title, skills, and preferences so we can match you when AI is offline.'
                    : 'No open jobs in your field right now. Check back soon or adjust your headline.',
            source: 'fallback_empty',
            recommendationNotice:
                'AI matching is offline. Complete your profile headline and skills for better offline matches.'
        };
    }

    const oids = top.map((t) => t.job._id);
    const populated = await Job.find({ _id: { $in: oids } })
        .populate('company_id', 'name logo location')
        .lean();
    const byId = new Map(populated.map((j) => [j._id.toString(), j]));

    const jobs = top
        .map(({ job: j0, score, reasons }) => {
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
                recommendationConfidence: score >= 75 ? 'high' : score >= 55 ? 'medium' : 'low'
            };
        })
        .filter(Boolean);

    return {
        jobs,
        isComplete: jobs.length > 0,
        source: 'fallback_scored',
        recommendationNotice:
            'AI matching is offline. These picks use your skills, job area, and preferences instead of the AI engine.'
    };
}

/**
 * TF-IDF recommendations from Flask when FLASK_AI_URL is set; then FastAPI when PYTHON_SERVICE_URL is set;
 * then scored offline fallback. No silent localhost defaults — missing env skips that provider cleanly.
 */
export async function getRecommendedJobs(userId, options = {}) {
    const limit = Math.min(Number(options.limit) || 50, 100);
    const flaskLimit = Math.min(Math.max(limit, 1), 10);
    const profilePayload = await loadSeekerProfilePayload(userId);
    if (!profilePayload) {
        return {
            jobs: [],
            isComplete: false,
            message: 'User not found.',
            source: 'error'
        };
    }

    const jobs = await loadActiveJobsForFlask(userId);

    if (FLASK_AI_URL) {
        try {
            const data = await postFlaskRecommend(profilePayload, jobs, flaskLimit);
            const recs = data?.recommendations || [];
            const hydrated = await hydratePythonJobCards(recs);
            const flaskQuality = hydrated.filter((j) => j.matchScore >= 50);
            if (flaskQuality.length > 0) {
                return {
                    jobs: flaskQuality,
                    isComplete: true,
                    source: 'flask_tfidf'
                };
            }
            if (recs.length > 0 && hydrated.length === 0) {
                return {
                    jobs: [],
                    isComplete: false,
                    message:
                        'The AI ranked jobs, but none can be shown (removed, hidden, or not visible on the public board).',
                    source: 'flask_filtered'
                };
            }
            if (recs.length === 0) {
                return {
                    jobs: [],
                    isComplete: false,
                    message:
                        jobs.length === 0
                            ? 'No open jobs to match against yet.'
                            : 'No strong TF-IDF match for your profile text yet. Add skills, headline, bio, or summary.',
                    source: 'flask_empty'
                };
            }
        } catch (err) {
            const status = err.response?.status;
            const msg = err.response?.data?.error || err.message;

            if (status === 400 && typeof msg === 'string') {
                if (process.env.NODE_ENV !== 'test') {
                    console.warn('[recommendations] Flask TF-IDF validation (HTTP 400):', msg);
                }
                return {
                    jobs: [],
                    isComplete: false,
                    message: msg,
                    source: 'flask_validation'
                };
            }

            if (process.env.NODE_ENV !== 'test') {
                logRecommendationProviderFailure('Flask TF-IDF', FLASK_AI_URL, err);
                if (PYTHON_URL) {
                    console.warn('[recommendations] Attempting FastAPI fallback after Flask failure.');
                }
            }
        }
    } else if (process.env.NODE_ENV !== 'test') {
        console.warn('[recommendations] Skipping Flask TF-IDF: FLASK_AI_URL is not configured.');
    }

    const pyResult = await fetchPythonRecommendations(userId, flaskLimit);
    const recs = pyResult.recommendations || [];
    const hydrated = await hydratePythonJobCards(recs);
    const pyQuality = hydrated.filter((j) => j.matchScore >= 50);

    if (pyQuality.length > 0) {
        return {
            jobs: pyQuality,
            isComplete: true,
            source: 'python'
        };
    }

    if (recs.length > 0 && hydrated.length === 0) {
        return {
            jobs: [],
            isComplete: false,
            message:
                'FastAPI returned matches, but none are visible on the job board (moderation or removed).',
            source: 'python_filtered'
        };
    }

    if (recs.length > 0 && hydrated.length > 0 && pyQuality.length === 0) {
        return getScoredFallbackJobs(userId, Math.min(limit, 5));
    }

    if (pyResult.__skippedNoUrl || pyResult.__networkError) {
        if (pyResult.__networkError && process.env.NODE_ENV !== 'test') {
            const syntheticErr = {
                message: pyResult.__pythonMessage || 'network error',
                code: pyResult.__pythonCode || ''
            };
            logRecommendationProviderFailure('FastAPI', PYTHON_URL, syntheticErr);
        }
        return getScoredFallbackJobs(userId, Math.min(limit, 5));
    }

    if (pyResult.__pythonError) {
        if (process.env.NODE_ENV !== 'test') {
            const syntheticErr = {
                response: {
                    status: pyResult.__pythonStatus,
                    data: pyResult.__pythonBody
                },
                message: formatPythonServiceMessage(pyResult)
            };
            logRecommendationProviderFailure('FastAPI', PYTHON_URL, syntheticErr);
        }
        return {
            jobs: [],
            isComplete: false,
            message: formatPythonServiceMessage(pyResult),
            source: 'python_error'
        };
    }

    return {
        jobs: [],
        isComplete: false,
        message:
            'No personalized matches from the embedding service yet. Complete your profile or try again later.',
        source: 'python_empty'
    };
}

export async function hydrateSimilarJobsResponse(pythonPayload) {
    const recs = pythonPayload?.similar_jobs || [];
    const hydrated = await hydratePythonJobCards(recs);
    return {
        job_id: pythonPayload?.job_id,
        similar_jobs: hydrated,
        total: hydrated.length
    };
}
