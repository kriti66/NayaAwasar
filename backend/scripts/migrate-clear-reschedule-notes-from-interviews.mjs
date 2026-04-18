/**
 * One-time migration: remove legacy text accidentally stored in Interview.notes
 * when recruiters accepted candidate reschedule requests (see RecruiterApplicants).
 *
 * Run from backend directory (requires MONGO_URI in .env):
 *   node scripts/migrate-clear-reschedule-notes-from-interviews.mjs
 *   npm run migrate:clear-reschedule-interview-notes
 */
import '../load-env.js';
import mongoose from 'mongoose';
import Interview from '../models/Interview.js';

const uri = process.env.MONGO_URI;
if (!uri) {
    console.error('[migrate-clear-reschedule-notes] MONGO_URI is not set. Aborting.');
    process.exit(1);
}

await mongoose.connect(uri);
try {
    const result = await Interview.updateMany(
        { notes: /Candidate reschedule request/i },
        { $set: { notes: '' } }
    );
    console.log(
        `[migrate-clear-reschedule-notes] matched=${result.matchedCount} modified=${result.modifiedCount}`
    );
} finally {
    await mongoose.disconnect();
}
