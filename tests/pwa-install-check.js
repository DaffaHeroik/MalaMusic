'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');

const app = fs.readFileSync('public/app.js', 'utf8');
const profile = fs.readFileSync('public/profile.js', 'utf8');
const index = fs.readFileSync('public/index.html', 'utf8');
const manifest = JSON.parse(fs.readFileSync('public/manifest.json', 'utf8'));
const sw = fs.readFileSync('public/sw.js', 'utf8');

assert.match(app, /beforeinstallprompt/);
assert.match(app, /appinstalled/);
assert.match(app, /function refreshPwaInstallButton\(\)/);
assert.match(app, /function installPWA\(\)/);
assert.match(app, /MalaMusic berhasil diinstall/);
assert.match(profile, /id="pwa-install-action"/);
assert.match(profile, /renderPwaInstallAction: function\(\)/);
assert.match(profile, /id="pwa-install-btn"/);
assert.match(profile, /onclick="installPWA\(\)"/);
assert.equal(manifest.display, 'standalone');
assert.equal(manifest.scope, '/');
assert.match(index, /<link rel="manifest" href="\/manifest\.json">/);
assert.match(index, /app\.js\?v=157/);
assert.match(index, /profile\.js\?v=157/);
assert.match(sw, /malamusic-static-v157/);
assert.match(sw, /app\.js\?v=157/);
assert.match(sw, /profile\.js\?v=157/);

console.log('PWA_INSTALL_CHECK_PASS');
