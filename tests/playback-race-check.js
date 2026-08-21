const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();

const source = fs.readFileSync('public/player.js', 'utf8');
const rendererSources = fs.readdirSync('public').filter((name) => name.endsWith('.js')).map((name) => fs.readFileSync(`public/${name}`, 'utf8')).join('\n');

function count(pattern) {
  return (source.match(pattern) || []).length;
}

assert.doesNotMatch(rendererSources, /else if \(isCur\) \{/g, 'paused current tracks must use the normal play/retry renderer');
assert.match(source, /var activeAudioTrack = null;/);
assert.match(source, /var activeAudioSequence = 0;/);
assert.match(source, /function isCurrentAudioSource\(\)/);
assert.match(source, /function clearAudioStartTimer\(\)/);
assert.match(source, /function armAudioStartTimer\(track, sequence\)/);
assert.match(source, /handleAudioSourceError\(\);\s*\}, 12000\);/);
assert.match(source, /AU\.removeAttribute\('src'\);\s*AU\.load\(\);/);
assert.match(source, /activeAudioTrack = track;\s*activeAudioSequence = loadSequence;/);
assert.match(source, /activeAudioIsOffline = isOfflineBinary;/);
assert.match(source, /armAudioStartTimer\(track, loadSequence\);/);
assert.match(source, /if\(!AU\.src \|\| !isCurrentAudioSource\(\)\)/);
assert.equal(count(/isCurrentAudioSource\(\)\) return;/g), 8, 'native audio events and startup watchdog must reject stale sources');
assert.match(source, /AbortController/);
assert.match(source, /var AUDIO_RESOLVE_TIMEOUT_MS = 25000;/);
assert.match(source, /setTimeout\(function\(\)\{ if\(controller\) controller\.abort\(\); \}, AUDIO_RESOLVE_TIMEOUT_MS\)/);
assert.match(source, /function requestResolver\(attempt\)/);
assert.match(source, /function queueAutoNextAfterEnd\(reason\)/);
assert.match(source, /AU\.currentTime >= Math\.max\(0\.25, AU\.duration - 0\.35\)/);
assert.match(source, /queueAutoNextAfterEnd\('duration-watchdog'\)/);
assert.match(source, /if \(!r\.ok\)/);
assert.match(source, /var AUDIO_RESOLVE_MAX_RETRIES = 4;/);
assert.match(source, /attempt < AUDIO_RESOLVE_MAX_RETRIES/);
assert.match(source, /retryDelay = Math\.min\(700 \* Math\.pow\(2, attempt\), 4000\)/);
assert.match(source, /var nextSrc = isOfflineBinary \? audioUrl : \('\/api\/proxy-audio\?url=' \+ encodeURIComponent\(audioUrl\)\)/);
assert.match(source, /var source = '\/api\/proxy-audio\?url=' \+ encodeURIComponent\(rawUrl\)/);
const sw = fs.readFileSync(path.join(root, 'public', 'sw.js'), 'utf8');
assert.match(sw, /url\.pathname === '\/api\/proxy-audio'/);
assert.match(sw, /event\.respondWith\(fetch\(request\)\);/);
assert.match(source, /audioRecoveryAttempts >= 2/);
assert.match(source, /delete audioUrlCache\[vid\]/);
assert.match(source, /loadTrack\(failedTrack, undefined, true\)/);
assert.match(source, /async function fetchAutoNextRecommendations\(track, expectedLoadSequence\)/);
assert.match(source, /if \(expectedLoadSequence !== audioLoadSequence \|\| S\.ct !== track\) return false;/);
assert.match(source, /var expectedLoadSequence = audioLoadSequence;\s*var startingTrack = S\.ct;/);
assert.match(source, /var fetched = await fetchAutoNextRecommendations\(S\.ct, expectedLoadSequence\);/);
assert.match(source, /if \(expectedLoadSequence !== audioLoadSequence \|\| S\.ct !== startingTrack\) return;/);

console.log('PLAYBACK_RACE_STATIC_GUARD_PASS');
