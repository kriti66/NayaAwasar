import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

const dbPath = path.resolve('./database/nayaawasar.sqlite');

const fixDb = async () => {
    console.log('Opening database...');
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    console.log('Checking columns...');

    try {
        await db.exec("ALTER TABLE users ADD COLUMN reset_password_token TEXT");
        console.log('Added reset_password_token column.');
    } catch (error) {
        console.log('reset_password_token column likely exists or error:', error.message);
    }

    try {
        await db.exec("ALTER TABLE users ADD COLUMN reset_password_expires DATETIME");
        console.log('Added reset_password_expires column.');
    } catch (error) {
        console.log('reset_password_expires column likely exists or error:', error.message);
    }

    console.log('Database fix complete.');
};

fixDb().catch(err => console.error(err));
