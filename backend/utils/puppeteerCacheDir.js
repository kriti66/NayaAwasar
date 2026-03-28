/**
 * Render / PaaS: Chromium installed under ~/.cache during build is often absent at runtime.
 * Force Puppeteer's cache inside the backend folder so postinstall + runtime share the same path.
 */
import path from 'path';
import { fileURLToPath } from 'url';

if (!process.env.PUPPETEER_EXECUTABLE_PATH) {
    const backendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
    process.env.PUPPETEER_CACHE_DIR = path.join(backendRoot, '.puppeteer-cache');
}
