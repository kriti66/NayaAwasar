/**
 * Always runs Python from the repo root .venv if it exists (fixes npm/concurrently
 * on Windows not inheriting an activated virtualenv).
 *
 * Usage: node scripts/run-python.js <cwd-relative-to-repo-root> <...python args>
 * Example: node scripts/run-python.js ai-service app.py
 * Example: node scripts/run-python.js recommendation-service -m uvicorn main:app --reload --port 8000
 */
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');
const isWin = process.platform === 'win32';
const venvPython = isWin
    ? path.join(root, '.venv', 'Scripts', 'python.exe')
    : path.join(root, '.venv', 'bin', 'python');
const python = fs.existsSync(venvPython) ? venvPython : isWin ? 'python' : 'python3';

const argv = process.argv.slice(2);
if (argv.length < 2) {
    console.error('Usage: node scripts/run-python.js <cwd> <...args passed to python>');
    process.exit(1);
}

const cwdRel = argv[0];
const pyArgs = argv.slice(1);
const cwd = path.resolve(root, cwdRel);

if (!fs.existsSync(venvPython)) {
    console.warn(
        '[run-python] No .venv found at repo root. Using system Python. Create venv: python -m venv .venv'
    );
    console.warn('[run-python] Then run: npm run setup:ai');
}

const result = spawnSync(python, pyArgs, { cwd, stdio: 'inherit', env: process.env });
process.exit(result.status === null ? 1 : result.status);
