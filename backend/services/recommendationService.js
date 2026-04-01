import axios from 'axios';
import mongoose from 'mongoose';
import Job from '../models/Job.js';
import { PUBLIC_MODERATION_MATCH, isJobVisibleForPublicListing } from '../utils/jobModeration.js';

const PYTHON_URL = (process.env.PYTHON_SERVICE_URL || 'http://localhost:8000').replace(
    /\/+$/,
    ''
);
const PYTHON_TIMEOUT_MS = 90000;

/**
 * Fire-and-forget: refresh cached embedding in the Python service.
 */
export function triggerEmbeddingUpdate(docId, docType) {
    if (!docId || !docType) return;
    axios
        .post(
            `${PYTHON_URL}/recompute-embeddings`,
            { doc_id: String(docId), doc_type: docType },
            { timeout: 8000 }
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

async function fetchPythonRecommendations(userId, limit) {
    const { data } = await axios.post(
        `${PYTHON_URL}/recommend`,
        { user_id: String(userId), limit },
        { timeout: PYTHON_TIMEOUT_MS }
    );
    return data;
}

export async function getSimilarJobs(jobId, limit = 5) {
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
    const ids = recs.map((r) => r.job_id).filter(Boolean);
    const oids = ids.map((id) => new mongoose.Types.ObjectId(id));
    const jobs = await Job.find({ _id: { $in: oids } })
        .populate('company_id', 'name logo location')
        .lean();
    const byId = new Map(jobs.map((j) => [j._id.toString(), j]));
    return recs
        .map((r) => {
            const j = byId.get(r.job_id);
            if (!j || !isJobVisibleForPublicListing(j)) return null;
            const raw = r.similarity_score ?? 0;
            const numRaw = Number(raw);
            const clamped = Number.isFinite(numRaw) ? Math.min(1, Math.max(0, numRaw)) : 0;
            const pct = Math.round(clamped * 100);
            return {
                ...j,
                aiScore: clamped,
                matchScore: pct,
                matchReason: r.reason,
                recommendationType: 'ai_match',
                recommendationConfidence:
                    clamped >= 0.6 ? 'high' : clamped >= 0.35 ? 'medium' : 'low'
            };
        })
        .filter(Boolean);
}

async function fallbackLatestJobs(limit = 10) {
    const jobs = await Job.find({
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
        .limit(limit)
        .populate('company_id', 'name logo location')
        .lean();
    return {
        jobs: jobs.map((j) => ({
            ...j,
            aiScore: null,
            matchScore: null,
            matchReason: 'Trending new listings on the platform.',
            recommendationType: 'fallback',
            recommendationConfidence: 'low'
        })),
        isComplete: true,
        source: 'fallback'
    };
}

/**
 * Primary entry: hybrid recommendations from the Python sentence-transformers service.
 * On failure, returns the latest active jobs (up to 10).
 */
export async function getRecommendedJobs(userId, options = {}) {
    const limit = Math.min(Number(options.limit) || 50, 100);
    try {
        const data = await fetchPythonRecommendations(userId, limit);
        const recs = data?.recommendations || [];
        const hydrated = await hydratePythonJobCards(recs);
        return {
            jobs: hydrated,
            isComplete: hydrated.length > 0,
            message:
                hydrated.length === 0
                    ? 'Complete your profile to get recommendations.'
                    : undefined,
            source: 'python'
        };
    } catch (err) {
        if (process.env.NODE_ENV !== 'test') {
            console.warn(
                '[recommendations] Python service unavailable, using fallback.',
                err?.message
            );
        }
        return fallbackLatestJobs(Math.min(limit, 10));
    }
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
