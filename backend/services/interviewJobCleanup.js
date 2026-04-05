import mongoose from 'mongoose';
import Interview from '../models/Interview.js';
import Application from '../models/Application.js';

const DEFAULT_CANCEL_REASON = 'Job was removed by admin';

/**
 * Mark interviews as cancelled when their job is hidden/removed.
 * Matches by Interview.jobId and by Application.job_id (covers legacy / mismatched jobId).
 * Skips already Completed / Cancelled.
 */
export async function cancelInterviewsForJob(
    jobId,
    { reason, cancelledByUserId = null, sendNotifications = true } = {}
) {
    if (!jobId) return { modifiedCount: 0 };
    const text = String(reason || DEFAULT_CANCEL_REASON).trim() || DEFAULT_CANCEL_REASON;
    const oid = jobId instanceof mongoose.Types.ObjectId ? jobId : new mongoose.Types.ObjectId(String(jobId));
    const now = new Date();
    const cancelledBy =
        cancelledByUserId && mongoose.Types.ObjectId.isValid(String(cancelledByUserId))
            ? new mongoose.Types.ObjectId(String(cancelledByUserId))
            : null;

    const applications = await Application.find({ job_id: oid }).select('_id').lean();
    const applicationIds = applications.map((a) => a._id).filter(Boolean);

    const jobIdOr = [{ jobId: oid }];
    const idStr = String(oid);
    jobIdOr.push({ jobId: idStr });

    const orConditions = [...jobIdOr];
    if (applicationIds.length) {
        orConditions.push({ applicationId: { $in: applicationIds } });
    }

    const rows = await Interview.find({
        status: { $nin: ['Cancelled', 'Completed'] },
        $or: orConditions
    })
        .select('seekerId recruiterId')
        .populate('jobId', 'title')
        .lean();

    if (!rows.length) {
        return { modifiedCount: 0 };
    }

    const ids = rows.map((r) => r._id);
    const $set = {
        status: 'Cancelled',
        calendarStatus: 'cancelled',
        cancelReason: text,
        cancelledAt: now
    };
    if (cancelledBy) $set.cancelledBy = cancelledBy;

    const res = await Interview.updateMany({ _id: { $in: ids } }, { $set });
    const modifiedCount = res.modifiedCount ?? 0;

    if (sendNotifications && modifiedCount > 0) {
        const { createNotification } = await import('../controllers/notificationController.js');
        const jobTitle = rows.find((r) => r.jobId?.title)?.jobId?.title || rows[0]?.jobId?.title || 'the job';
        const seekerNotified = new Set();
        for (const row of rows) {
            const sk = row.seekerId?.toString?.();
            if (!sk || seekerNotified.has(sk)) continue;
            seekerNotified.add(sk);
            await createNotification({
                recipient: sk,
                type: 'interview_cancelled',
                category: 'interview',
                title: 'Interview cancelled',
                message: `Your interview for "${jobTitle}" was cancelled. ${text}`,
                link: '/seeker/calendar',
                sender: cancelledBy,
                metadata: { jobId: String(oid) }
            });
        }
        const recruiterNotified = new Set();
        for (const row of rows) {
            const rk = row.recruiterId?.toString?.();
            if (!rk || recruiterNotified.has(rk)) continue;
            recruiterNotified.add(rk);
            await createNotification({
                recipient: rk,
                type: 'interview_cancelled',
                category: 'interview',
                title: 'Interview cancelled',
                message:
                    rows.length > 1
                        ? `${rows.length} interviews for "${jobTitle}" were cancelled. ${text}`
                        : `An interview for "${jobTitle}" was cancelled. ${text}`,
                link: '/recruiter/calendar',
                sender: cancelledBy,
                metadata: { jobId: String(oid) }
            });
        }
    }

    return { modifiedCount };
}
