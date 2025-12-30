import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
    try {
        const db = await open({
            filename: path.join(__dirname, 'database.sqlite'),
            driver: sqlite3.Database
        });

        const users = await db.all('SELECT id, name, email, role FROM users');
        console.log('Users in database:');
        console.table(users);
    } catch (error) {
        console.error('Error reading database:', error);
    }
})();
