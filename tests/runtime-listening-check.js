const assert = require('node:assert/strict');
const fs = require('node:fs');

const stats = fs.readFileSync('public/stats.js', 'utf8');
const player = fs.readFileSync('public/player.js', 'utf8');
const api = fs.readFileSync('api/stats.js', 'utf8');
const worker = fs.readFileSync('cloudflare-stats-worker/src/index.js', 'utf8');

assert.match(stats, /active:\s*false/);
assert.match(stats, /start:\s*function \(track, position\)/);
assert.match(stats, /stop:\s*function \(track, position\)/);
assert.match(stats, /if \(!this\.active \|\| this\.seeking \|\| !track/);
assert.match(stats, /markSeeking:\s*function \(track\)/);
assert.match(stats, /rebase:\s*function \(track, position\)/);
assert.match(stats, /window\.addEventListener\('pagehide', stopPlaybackStatsForPageHide/);
assert.match(stats, /Stats\.stop\(S\.ct, AU\.currentTime\)/);
assert.match(stats, /Visibility alone is not a listening signal/);

assert.match(player, /if\(typeof Stats !== 'undefined'\) Stats\.start\(S\.ct,AU\.currentTime\)/);
assert.match(player, /Stats\.stop\(S\.ct,AU\.currentTime\);Stats\.flush\(true\)/);
assert.match(player, /AU\.addEventListener\('waiting'/);
assert.match(player, /AU\.addEventListener\('stalled'/);
assert.match(player, /AU\.addEventListener\('seeking'/);
assert.match(player, /AU\.addEventListener\('seeked'/);
assert.match(player, /Stats\.stop\(activeAudioTrack, AU\.currentTime\)/);
assert.match(player, /Stats\.stop\(failedTrack, AU\.currentTime\)/);

assert.match(api, /const requestedSeconds = Number\(body\(req\)\.seconds\)/);
assert.match(api, /requestedSeconds <= 0/);
assert.match(api, /Math\.floor\(requestedSeconds\)/);
assert.match(api, /seconds < 1/);
assert.match(api, /function legacyStreak\(req, currentUser\)/);
assert.match(api, /function mergeStatsMirror\(result, mirror\)/);
assert.match(api, /bestStreak: Math\.max\(Number\(remote\.bestStreak \|\| 0\), Number\(local\.bestStreak \|\| 0\)\)/);
assert.doesNotMatch(api, /Math\.round\(Number\(body\(req\)\.seconds\)\)/);

assert.match(worker, /const requestedSeconds = Number\(body\.seconds\)/);
assert.match(worker, /!Number\.isFinite\(requestedSeconds\) \|\| requestedSeconds <= 0/);
assert.match(worker, /Math\.floor\(requestedSeconds\)/);
assert.match(worker, /Recompute streak immediately/);
assert.match(worker, /streakFromDates\(values\)/);
assert.match(worker, /const priorBest = Number\(priorRows\[0\]\?\.streak_best \|\| 0\)/);
assert.match(worker, /let best = priorBest, run = 0/);
assert.match(worker, /streak_best = MAX\(user_stats\.streak_best, excluded\.streak_best\)/);
assert.doesNotMatch(worker, /Math\.max\(1, Math\.min\(120, Math\.round\(Number\(body\.seconds/);

const index = fs.readFileSync('public/index.html', 'utf8');
const sw = fs.readFileSync('public/sw.js', 'utf8');
assert.match(index, /MALA_SW_VERSION = 'v155'/);
assert.match(index, /stats\.js\?v=155/);
assert.match(index, /reg\.addEventListener\('updatefound'/);
assert.match(index, /installing\.state === 'installed'/);
assert.match(index, /type: 'SKIP_WAITING'/);
assert.match(sw, /malamusic-static-v155/);
assert.match(sw, /stats\.js\?v=155/);

console.log('RUNTIME_LISTENING_STATIC_GUARD_PASS');
