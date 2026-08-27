const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
const library = fs.readFileSync(path.join(root, 'public', 'library.js'), 'utf8');
const album = fs.readFileSync(path.join(root, 'public', 'album.js'), 'utf8');
const player = fs.readFileSync(path.join(root, 'public', 'player.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'public', 'sw.js'), 'utf8');

assert.match(app, /function downloadPlaylistOffline\(playlistId\)/);
assert.match(app, /function downloadExternalPlaylistOffline\(playlistId\)/);
assert.match(app, /function downloadOfflinePlaylistItems\(playlist\)/);
assert.match(app, /function downloadPublicPlaylistOffline\(playlistId\)/);
assert.match(app, /__publicPlaylistInfo/);
assert.match(app, /return \(async function\(\)/);
assert.match(app, /OFFLINE_DOWNLOAD_JOB_KEY/);
assert.match(app, /status: 'running', cancelled: false/);
assert.match(app, /pointer-events-none/);
assert.match(app, /offline-playlist-minimize/);
assert.match(app, /offline-playlist-pause/);
assert.match(app, /Lanjutkan/);
assert.match(app, /offlineTrackActiveIds/);
assert.match(app, /AbortController/);
assert.match(app, /Download lagu ini sedang berjalan/);
assert.match(app, /persistOfflineDownloadJob/);
assert.match(app, /job\.done = done/);
assert.match(app, /renderOfflineDownloadStatus\(job\)/);
assert.match(app, /currentPercent/);
assert.match(app, /Selesai.*progress|progress.*Selesai/);
assert.match(app, /saveTrackForOffline\(track, \{ keepExisting: true/);
assert.match(app, /hasOfflineAudioBinary\(vid\)/);
assert.match(app, /downloadProgress/);
assert.match(app, /getReader\(\)/);
assert.match(app, /Audio siap.*100%/);
assert.match(app, /upsertOfflinePlaylist\(playlist/);
assert.match(app, /OFFLINE_PLAYLISTS_KEY/);
assert.match(app, /pwa_offline_playlists/);
assert.match(app, /Penyimpanan perangkat/);
assert.match(app, /if \(name !== OFFLINE_AUDIO_CACHE\) caches\.delete\(name\)/);

assert.match(library, /onclick="downloadPlaylistOffline\('\$\{id\}'\)"/);
assert.match(library, /aria-label="Download seluruh playlist ke Mode Offline"/);
assert.match(album, /downloadExternalPlaylistOffline\('\$\{esJs\(id\)\}'\)/);
assert.match(album, /aria-label="Download playlist ke Mode Offline"/);
assert.match(player, /var forceOffline = S\.playbackMode === 'offline' \|\| S\.ps === 'offline'/);
assert.match(player, /if \(offlinePath\) return offlinePath/);
assert.match(player, /if \(forceOffline\) \{/);
assert.match(player, /throw new Error\('Offline dan audio belum tersimpan'\)/);
assert.match(player, /saveTrackForOffline\(track, \{ keepExisting: true, silent: true \}\)/);
assert.match(sw, /url\.pathname === '\/api\/proxy-audio'/);
assert.match(sw, /event\.respondWith\(respondWithOfflineAudio\(request\)\)/);
assert.match(sw, /Content-Range/);
assert.match(sw, /status: 206/);
assert.match(sw, /fetch\(url, \{ cache: 'no-store' \}\)/);
assert.match(sw, /fetch\(new Request\(request, \{ cache: 'no-store' \}\)\)/);
assert.match(sw, /const CACHE_AUDIO_NAME = 'malamusic-offline-audio-v1'/);
assert.match(sw, /key !== CACHE_STATIC_NAME && key !== CACHE_DATA_NAME && key !== CACHE_AUDIO_NAME/);

const scriptUrls = [...index.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
for (const required of ['/app.js?v=153', '/player.js?v=153', '/library.js?v=153', '/album.js?v=153']) {
  assert.ok(scriptUrls.includes(required), `asset marker missing: ${required}`);
}
assert.match(index, /sw\.js\?v=153/);

console.log('offline-playlist-check: PASS');
