/**
 * Installs Chrome into backend/.puppeteer-cache (same path as utils/puppeteerCacheDir.js at runtime).
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirname, '..');
const cacheDir = path.join(backendRoot, '.puppeteer-cache');

fs.mkdirSync(cacheDir, { recursive: true });

const env = { ...process.env, PUPPETEER_CACHE_DIR: cacheDir };

const result = spawnSync('npx', ['--yes', 'puppeteer', 'browsers', 'install', 'chrome'], {
    cwd: backendRoot,
    env,
    stdio: 'inherit',
    shell: process.platform === 'win32'
});

if (result.error) {
    console.error(result.error);
    process.exit(1);
}
process.exit(result.status === 0 ? 0 : result.status ?? 1);
