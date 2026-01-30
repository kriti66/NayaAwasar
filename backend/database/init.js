import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

const dbPath = path.resolve('./database/nayaawasar.sqlite');

const initDb = async () => {
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'jobseeker',
            kyc_status TEXT DEFAULT 'pending', -- pending, verified, rejected (mostly for recruiters)
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            reset_password_token TEXT,
            reset_password_expires DATETIME
        );
    `);

    // Migration: Add columns if they don't exist (Handling existing DBs)
    try {
        await db.exec("ALTER TABLE users ADD COLUMN reset_password_token TEXT");
    } catch (error) {
        // Ignore error if columns already exist
    }

    try {
        await db.exec("ALTER TABLE users ADD COLUMN reset_password_expires DATETIME");
    } catch (error) {
        // Ignore error if columns already exist
    }

    await db.exec(`
        CREATE TABLE IF NOT EXISTS profiles (
            user_id INTEGER PRIMARY KEY,
            resume_url TEXT,
            bio TEXT,
            location TEXT,
            skills TEXT, -- JSON or comma-separated
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS companies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recruiter_id INTEGER,
            name TEXT NOT NULL,
            description TEXT,
            website TEXT,
            logo_url TEXT,
            FOREIGN KEY(recruiter_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recruiter_id INTEGER,
            company_name TEXT NOT NULL,
            title TEXT NOT NULL,
            type TEXT NOT NULL, -- Full-time, Part-time, etc.
            description TEXT,
            location TEXT,
            salary_range TEXT,
            requirements TEXT,
            posted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(recruiter_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id INTEGER,
            seeker_id INTEGER,
            status TEXT DEFAULT 'pending', -- pending, shortlisted, rejected, hired
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(job_id) REFERENCES jobs(id),
            FOREIGN KEY(seeker_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            address TEXT,
            latitude REAL,
            longitude REAL,
            phone TEXT,
            email TEXT
        );

    `);

    // Insert default location if not exists
    try {
        const locationCount = await db.get('SELECT COUNT(*) as count FROM locations');
        if (locationCount && locationCount.count === 0) {
            await db.run(`INSERT INTO locations (address, latitude, longitude, phone, email) 
                          VALUES ('Kathmandu, Nepal', 27.7172, 85.3240, '+977 1234567890', 'contact@nayaawasar.com')`);
        }
    } catch (err) {
        console.warn("Could not seed default location:", err);
    }

    console.log('Database initialized');
    return db;
};

export default initDb;
