import 'dotenv/config';
import mongoose from 'mongoose';
import Notification from './models/Notification.js';

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Find all notifications with the old link format
        const notifications = await Notification.find({
            link: { $regex: /^\/recruiter\/jobs\/.*\/applications$/ }
        });

        console.log(`🔍 Found ${notifications.length} notifications needing migration.`);

        let count = 0;
        for (const notification of notifications) {
            // Extract the jobId from the link: /recruiter/jobs/:jobId/applications
            const match = notification.link.match(/^\/recruiter\/jobs\/(.*?)\/applications$/);
            if (match && match[1]) {
                const jobId = match[1];
                notification.link = `/recruiter/applications?jobId=${jobId}`;
                await notification.save();
                count++;
            }
        }

        console.log(`🎉 Migration complete. Updated ${count} notifications.`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

migrate();
