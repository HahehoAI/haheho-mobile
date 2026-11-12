// Runs before every `npx cap copy` / `npx cap sync` (package.json → "capacitor:copy:before").
// Writes the app's start URL (server.url + server.appStartPath from capacitor.config.ts)
// into www/offline.html, so its "Try again" button returns to the right site (dev/stage)
// without hard-coding it.
// Inlined on purpose: while server.url is set, Capacitor sends the page's other
// requests to the remote server, so a separate local .js file would not load.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const config = JSON.parse(process.env.CAPACITOR_CONFIG || '{}');
const webDir = process.env.CAPACITOR_WEB_DIR || 'www';
const server = config.server || {};
// Where "Try again" goes: the app's start page (server.url + server.appStartPath).
const serverUrl = server.url
  ? server.url.replace(/\/+$/, '') + (server.appStartPath || '/')
  : '';
const file = join(webDir, 'offline.html');

const marker = /window\.HAHEHO_SERVER_URL = .*?; \/\* set by scripts\/set-offline-server-url\.mjs \*\//;
const html = readFileSync(file, 'utf8');
if (!marker.test(html)) throw new Error(`${file}: HAHEHO_SERVER_URL marker not found`);
const next = html.replace(marker, `window.HAHEHO_SERVER_URL = ${JSON.stringify(serverUrl)}; /* set by scripts/set-offline-server-url.mjs */`);
if (next !== html) writeFileSync(file, next);
console.log(`[haheho] offline.html → ${serverUrl || '(no server.url)'}`);
