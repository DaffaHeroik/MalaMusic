const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('public/player.js', 'utf8');

assert.match(source, /endedHandledSequence/);
assert.match(source, /endedTransitionBusy/);
assert.match(source, /if \(endedHandledSequence === endedSequence \|\| endedTransitionBusy\) return/);
assert.match(source, /var offlineQueue = S\.playbackMode === 'offline' \|\| S\.ps === 'offline'/);
assert.match(source, /S\.pi \+ 1 >= S\.pl\.length && S\.autoNext && !offlineQueue/);
assert.match(source, /if \(forceOffline\) \{/);
assert.match(source, /throw new Error\('Offline dan audio belum tersimpan'\)/);
assert.match(source, /if \(S\.playbackMode === 'offline' \|\| S\.ps === 'offline'\) return;/);
assert.match(source, /S\.playbackMode = s === 'offline' \? 'offline' : 'online'/);

console.log('PLAYBACK_SOURCE_POLICY_PASS');
