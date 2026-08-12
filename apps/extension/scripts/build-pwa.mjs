/**
 * Build My Pings PWA → apps/extension/dist-pwa/
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const extRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distPwa = path.join(extRoot, 'dist-pwa');
const basePath = process.env.VITE_BASE_PATH ?? '/web-extensions/my-pings/';

function run(cmd, args, env = {}) {
  const r = spawnSync(cmd, args, {
    cwd: extRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, VITE_BASE_PATH: basePath, ...env },
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

run('node', ['scripts/write-placeholder-icons.mjs']);
run('npx', ['vite', 'build', '--config', 'vite.config.pwa.ts']);

for (const dir of ['icons']) {
  fs.cpSync(path.join(extRoot, 'public', dir), path.join(distPwa, dir), { recursive: true });
}

for (const file of ['privacy.html', 'manifest.webmanifest', 'sw.js']) {
  const src =
    file === 'manifest.webmanifest' || file === 'sw.js'
      ? path.join(extRoot, 'public-pwa', file)
      : path.join(extRoot, 'public', file);
  fs.copyFileSync(src, path.join(distPwa, file));
}

const indexPwa = path.join(distPwa, 'index-pwa.html');
const indexHtml = path.join(distPwa, 'index.html');
if (fs.existsSync(indexPwa)) {
  if (fs.existsSync(indexHtml)) fs.rmSync(indexHtml);
  fs.renameSync(indexPwa, indexHtml);
}

console.log(`\n[build-pwa] done: apps/extension/dist-pwa/ (base ${basePath})`);
