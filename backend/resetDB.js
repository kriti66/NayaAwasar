import dotenv from 'dotenv';
import mongoose from 'mongoose';

import Job from './models/Job.js';
import Company from './models/Company.js';
import Promotion from './models/Promotion.js';
import PromotionPaymentRequest from './models/PromotionPaymentRequest.js';
import PromotionPayment from './models/PromotionPayment.js';
import Application from './models/Application.js';
import Notification from './models/Notification.js';
import Interview from './models/Interview.js';
import KYC from './models/KYC.js';
import RecruiterKyc from './models/RecruiterKyc.js';
import User from './models/User.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, '.env') });

const { MONGO_URI } = process.env;

if (!MONGO_URI) {
    console.error('[resetDB] Missing MONGO_URI in backend/.env');
    process.exit(1);
}

async function clearCollection(model, label) {
    await model.deleteMany({});
    console.log(`[resetDB] Cleared ${label} collection`);
}

async function main() {
    console.log('[resetDB] Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('[resetDB] Connected');

    try {
        await clearCollection(Job, 'jobs');
        await clearCollection(Company, 'companies');
        await clearCollection(Promotion, 'promotions');
        await clearCollection(PromotionPaymentRequest, 'promotion payment requests');
        await clearCollection(PromotionPayment, 'promotion payments');
        await clearCollection(Application, 'applications');
        await clearCollection(Notification, 'notifications');
        await clearCollection(Interview, 'interviews');
        await clearCollection(KYC, 'kycs');
        await clearCollection(RecruiterKyc, 'recruiter kycs');

        // Delete all non-admin users; keep admin accounts untouched
        const result = await User.deleteMany({ role: { $ne: 'admin' } });
        console.log(`[resetDB] Cleared users collection (deleted ${result.deletedCount || 0} non-admin users)`);
    } finally {
        await mongoose.disconnect();
        console.log('[resetDB] Disconnected');
    }
}

main()
    .then(() => {
        process.exit(0);
    })
    .catch((err) => {
        console.error('[resetDB] Failed:', err);
        process.exit(1);
    });

