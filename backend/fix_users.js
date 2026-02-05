import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const users = await User.find({ fullName: { $exists: false } });
        console.log(`🔍 Found ${users.length} users needing migration.`);

        for (const user of users) {
            // Use existing 'name' field if available, otherwise fallback
            const nameToUse = user._doc.name || 'User';
            user.fullName = nameToUse;
            // Also update any other potentially missing required fields
            await user.save();
            console.log(`✅ Migrated user: ${user.email}`);
        }

        console.log('🎉 Migration complete');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

migrate();
