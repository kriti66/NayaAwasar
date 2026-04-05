import mongoose from 'mongoose';
import RecruiterWarning from '../models/RecruiterWarning.js';
import { normalizeModerationStatusForEdit } from '../utils/jobModeration.js';

/**
 * Create an account-level warning when an admin warns a recruiter about a job.
 */
export async function createRecruiterWarningFromJobWarn({
    recruiterId,
    jobId,
    reason,
    note = '',
    warnedByUserId
}) {
    if (!recruiterId || !reason?.trim()) return null;
    const doc = await RecruiterWarning.create({
        recruiter: new mongoose.Types.ObjectId(String(recruiterId)),
        job: jobId ? new mongoose.Types.ObjectId(String(jobId)) : null,
        reason: String(reason).trim(),
        note: note != null ? String(note).trim() : '',
        warnedBy: warnedByUserId ? new mongoose.Types.ObjectId(String(warnedByUserId)) : null,
        isActive: true
    });
    return doc;
}

export async function deactivateWarningsForJob(jobId, resolvedByUserId) {
    if (!jobId) return { modifiedCount: 0 };
    const now = new Date();
    const resolvedBy = resolvedByUserId
        ? new mongoose.Types.ObjectId(String(resolvedByUserId))
        : null;
    const res = await RecruiterWarning.updateMany(
        { job: jobId, isActive: true },
        {
            $set: {
                isActive: false,
                resolvedAt: now,
                resolvedBy
            }
        }
    );
    return { modifiedCount: res.modifiedCount ?? 0 };
}

export async function getActiveWarningsForRecruiter(recruiterId) {
    const rows = await RecruiterWarning.find({
        recruiter: recruiterId,
        isActive: true
    })
        .sort({ warnedAt: -1 })
        .populate('job', 'title moderationStatus')
        .lean();

    return rows.filter((w) => {
        if (!w.job) return false;
        return normalizeModerationStatusForEdit(w.job.moderationStatus) === 'warned';
    });
}

export async function resolveRecruiterWarningById(warningId, resolvedByUserId) {
    const w = await RecruiterWarning.findById(warningId);
    if (!w) return null;
    if (!w.isActive) return w;
    w.isActive = false;
    w.resolvedAt = new Date();
    w.resolvedBy = resolvedByUserId ? new mongoose.Types.ObjectId(String(resolvedByUserId)) : null;
    await w.save();
    return w;
}
