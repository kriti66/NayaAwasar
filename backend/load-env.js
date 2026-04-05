/**
 * Loaded first from server.js so process.env is populated before any other local imports.
 * Uses backend/.env regardless of process.cwd (e.g. monorepo root).
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env');
const result = dotenv.config({ path: envPath });
if (result.error && result.error.code !== 'ENOENT') {
    console.warn('[load-env] dotenv:', result.error.message);
}
console.log('GOOGLE_CLIENT_ID loaded:', process.env.GOOGLE_CLIENT_ID ? 'YES' : 'NO');
