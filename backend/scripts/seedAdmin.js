/**
 * Seed one admin user. Run once: node scripts/seedAdmin.js
 * Set ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME in .env (optional; defaults below).
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import User from '../models/User.js';

const MONGO_URI = process.env.MONGO_URI;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@nayaawasar.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin';

async function seedAdmin() {
    if (!MONGO_URI) {
        console.error('MONGO_URI not set in .env');
        process.exit(1);
    }
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        let user = await User.findOne({ email: ADMIN_EMAIL });
        if (user) {
            user.role = 'admin';
            user.fullName = ADMIN_NAME;
            user.password = await bcrypt.hash(ADMIN_PASSWORD, 10);
            user.kycStatus = 'not_submitted'; // valid enum (not_started is deprecated)
            await user.save();
            console.log('Existing user updated to admin:', ADMIN_EMAIL);
        } else {
            user = new User({
                fullName: ADMIN_NAME,
                email: ADMIN_EMAIL,
                password: await bcrypt.hash(ADMIN_PASSWORD, 10),
                role: 'admin',
                kycStatus: 'not_submitted'
            });
            await user.save();
            console.log('Admin user created:', ADMIN_EMAIL);
        }
        console.log('Admin can log in with the same login API using:', ADMIN_EMAIL);
    } catch (err) {
        console.error('Seed error:', err);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

seedAdmin();
