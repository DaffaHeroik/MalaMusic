const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('public/player.js', 'utf8');

function count(pattern) {
  return (source.match(pattern) || []).length;
}

assert.match(source, /var activeAudioTrack = null;/);
assert.match(source, /var activeAudioSequence = 0;/);
assert.match(source, /function isCurrentAudioSource\(\)/);
assert.match(source, /AU\.removeAttribute\('src'\);\s*AU\.load\(\);/);
assert.match(source, /activeAudioTrack = track;\s*activeAudioSequence = loadSequence;/);
assert.match(source, /if\(!AU\.src \|\| !isCurrentAudioSource\(\)\)/);
assert.equal(count(/isCurrentAudioSource\(\)\) return;/g), 7, 'all native audio event handlers must reject stale sources');
assert.match(source, /async function fetchAutoNextRecommendations\(track, expectedLoadSequence\)/);
assert.match(source, /if \(expectedLoadSequence !== audioLoadSequence \|\| S\.ct !== track\) return false;/);
assert.match(source, /var expectedLoadSequence = audioLoadSequence;\s*var startingTrack = S\.ct;/);
assert.match(source, /var fetched = await fetchAutoNextRecommendations\(S\.ct, expectedLoadSequence\);/);
assert.match(source, /if \(expectedLoadSequence !== audioLoadSequence \|\| S\.ct !== startingTrack\) return;/);

console.log('PLAYBACK_RACE_STATIC_GUARD_PASS');
