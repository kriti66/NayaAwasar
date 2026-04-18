import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import KYC from '../models/KYC.js';
import RecruiterKyc from '../models/RecruiterKyc.js';
import IdentityKyc from '../models/kycModel.js';
import Application from '../models/Application.js';
import Interview from '../models/Interview.js';
import Job from '../models/Job.js';
import JobView from '../models/JobView.js';
import Profile from '../models/Profile.js';
import UserJobLabelCache from '../models/UserJobLabelCache.js';
import Activity from '../models/Activity.js';
import ActivityLog from '../models/ActivityLog.js';
import ChatbotInteraction from '../models/ChatbotInteraction.js';
import Project from '../models/Project.js';
import Promotion from '../models/Promotion.js';
import PromotionPayment from '../models/PromotionPayment.js';
import PromotionPaymentRequest from '../models/PromotionPaymentRequest.js';
import RecruiterWarning from '../models/RecruiterWarning.js';
import Company from '../models/Company.js';
import User from '../models/User.js';

/**
 * Field names (from models):
 * - Notification: recipient, sender (ref User)
 * - KYC: userId | RecruiterKyc: userId | IdentityKyc: user
 * - Application: seeker_id, recruiter_id, job_id
 * - Interview: seekerId, recruiterId, jobId
 * - Job: recruiter_id, recruiter (alias; both may exist)
 * - Profile: userId (no separate JobseekerProfile / RecruiterProfile models)
 * - Activity / ActivityLog: userId
 * - Saved jobs: embedded array User.savedJobs (ObjectId refs to Job) — cleared when User is removed; also $pull job ids from other users when those jobs are deleted
 */

async function logDeleteMany(label, run) {
    console.log(`[cleanupDeletedUser] BEFORE ${label}`);
    const result = await run();
    const n = result?.deletedCount ?? result?.n ?? 0;
    console.log(`[cleanupDeletedUser] AFTER ${label} deletedCount=${n}`);
    return result;
}

async function logUpdateMany(label, run) {
    console.log(`[cleanupDeletedUser] BEFORE ${label}`);
    const result = await run();
    const n = result?.modifiedCount ?? result?.nModified ?? 0;
    console.log(`[cleanupDeletedUser] AFTER ${label} modifiedCount=${n}`);
    return result;
}

/**
 * Permanently removes a soft-removed user's documents and all data keyed by their user id
 * so a new account can be created with the same email without inheriting old state.
 */
export async function cleanupDeletedUser(userId) {
    const id =
        typeof userId === 'string'
            ? new mongoose.Types.ObjectId(userId)
            : userId instanceof mongoose.Types.ObjectId
              ? userId
              : new mongoose.Types.ObjectId(String(userId));

    console.log(`[cleanupDeletedUser] START userId=${id.toString()}`);

    const recruiterJobFilter = { $or: [{ recruiter_id: id }, { recruiter: id }] };
    const recruiterJobDocs = await Job.find(recruiterJobFilter).select('_id').lean();
    const recruiterJobIds = recruiterJobDocs.map((j) => j._id);

    // 1) Notifications (owner as recipient or sender)
    await logDeleteMany('Notification (recipient|sender)', () =>
        Notification.deleteMany({ $or: [{ recipient: id }, { sender: id }] })
    );

    // 2) KYC documents (all variants)
    await logDeleteMany('KYC (userId)', () => KYC.deleteMany({ userId: id }));
    await logDeleteMany('RecruiterKyc (userId)', () => RecruiterKyc.deleteMany({ userId: id }));
    await logDeleteMany('IdentityKyc (user)', () => IdentityKyc.deleteMany({ user: id }));

    // 3) Interviews (seekerId / recruiterId / jobs posted by recruiter)
    await logDeleteMany('Interview (seekerId|recruiterId|jobId)', () =>
        Interview.deleteMany({
            $or: [{ seekerId: id }, { recruiterId: id }, { jobId: { $in: recruiterJobIds } }]
        })
    );

    // 4) Applications (seeker, recruiter, or applications to recruiter’s jobs)
    await logDeleteMany('Application (seeker_id|recruiter_id|job_id)', () =>
        Application.deleteMany({
            $or: [{ seeker_id: id }, { recruiter_id: id }, { job_id: { $in: recruiterJobIds } }]
        })
    );

    // 5) Promotions + payments (scoped to recruiter or their jobs)
    const promotions = await Promotion.find({
        $or: [{ recruiterId: id }, { jobId: { $in: recruiterJobIds } }]
    })
        .select('_id')
        .lean();
    const promotionIds = promotions.map((p) => p._id);

    if (promotionIds.length) {
        await logDeleteMany('PromotionPayment (promotionId)', () =>
            PromotionPayment.deleteMany({ promotionId: { $in: promotionIds } })
        );
    }
    await logDeleteMany('Promotion (recruiterId|jobId)', () =>
        Promotion.deleteMany({
            $or: [{ recruiterId: id }, { jobId: { $in: recruiterJobIds } }]
        })
    );
    await logDeleteMany('PromotionPaymentRequest (recruiterId|jobId)', () =>
        PromotionPaymentRequest.deleteMany({
            $or: [{ recruiterId: id }, { jobId: { $in: recruiterJobIds } }]
        })
    );

    // 6) Saved job references on other users (embedded savedJobs on User) for jobs we are removing
    if (recruiterJobIds.length) {
        await logDeleteMany('JobView (job_id in recruiter jobs)', () =>
            JobView.deleteMany({ job_id: { $in: recruiterJobIds } })
        );
        await logUpdateMany('User.savedJobs $pull job ids (other users)', () =>
            User.updateMany({ savedJobs: { $in: recruiterJobIds } }, { $pull: { savedJobs: { $in: recruiterJobIds } } })
        );
    }

    // 7) Jobs posted by this user (recruiter_id and legacy recruiter alias)
    await logDeleteMany('Job (recruiter_id|recruiter)', () => Job.deleteMany(recruiterJobFilter));

    await logDeleteMany('RecruiterWarning (recruiter)', () => RecruiterWarning.deleteMany({ recruiter: id }));

    const companiesWithUser = await Company.find({ recruiters: id }).select('_id').lean();
    for (const row of companiesWithUser) {
        console.log(`[cleanupDeletedUser] BEFORE Company.update recruiters pull _id=${row._id}`);
        await Company.findByIdAndUpdate(row._id, { $pull: { recruiters: id } });
        const c = await Company.findById(row._id).select('recruiters').lean();
        if (!c?.recruiters?.length) {
            console.log(`[cleanupDeletedUser] BEFORE Company.deleteOne (no recruiters left) _id=${row._id}`);
            const del = await Company.deleteOne({ _id: row._id });
            console.log(`[cleanupDeletedUser] AFTER Company.deleteOne deletedCount=${del.deletedCount}`);
        }
    }

    await logDeleteMany('Profile (userId)', () => Profile.deleteMany({ userId: id }));
    await logDeleteMany('UserJobLabelCache (userId)', () => UserJobLabelCache.deleteMany({ userId: id }));
    await logDeleteMany('Activity (userId)', () => Activity.deleteMany({ userId: id }));
    await logDeleteMany('ActivityLog (userId)', () => ActivityLog.deleteMany({ userId: id }));
    await logDeleteMany('ChatbotInteraction (userId)', () => ChatbotInteraction.deleteMany({ userId: id }));
    await logDeleteMany('Project (userId)', () => Project.deleteMany({ userId: id }));
    await logDeleteMany('JobView (viewer_id)', () => JobView.deleteMany({ viewer_id: id }));

    await logDeleteMany('User (hard delete)', () => User.deleteOne({ _id: id }));

    console.log(`[cleanupDeletedUser] DONE userId=${id.toString()}`);
}
