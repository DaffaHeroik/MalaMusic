'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const library = require('../api/library.js');

const clean = library._test.clean;
const cleanRecent = library._test.cleanRecent;
const now = Date.now();
const remote = clean({
  recentTracks: [
    { videoId: 'older', title: 'Older', playedAt: now - 1000 },
    { videoId: 'same', title: 'Remote title', playedAt: now - 5000 },
    { videoId: 'same', title: 'Newest title', playedAt: now }
  ],
  likedSongs: [], likedArtists: [], playlists: []
});
assert.deepEqual(remote.recentTracks.map(x => x.videoId), ['same', 'older']);
assert.equal(remote.recentTracks[0].title, 'Newest title');
assert.equal(remote.recentTracks.every(x => x.videoId && x.playedAt > 0), true);
const merged = cleanRecent([
  { videoId: 'same', title: 'Stale incoming', playedAt: now - 10000 },
  { videoId: 'same', title: 'Newest incoming', playedAt: now + 1000 },
  { videoId: 'other', title: 'Other', playedAt: now - 2000 }
]);
assert.equal(merged.find(x => x.videoId === 'same').title, 'Newest incoming');
assert.equal(merged.length, 2);
assert.equal(cleanRecent(Array.from({ length: 60 }, (_, i) => ({ videoId: 'track-' + i, playedAt: now - i }))).length, 50);

const legacyPut = clean({ likedSongs: [], likedArtists: [], playlists: [] }, { recentTracks: [{ videoId: 'legacy', title: 'Legacy', playedAt: now }] });
assert.deepEqual(legacyPut.recentTracks.map(x => x.videoId), ['legacy']);

const source = fs.readFileSync('public/player.js', 'utf8');
const streak = fs.readFileSync('public/streak.js', 'utf8');
assert.match(source, /recentTracks:getRecentTracks\(\)/);
assert.match(source, /localStorage\.setItem\('mala_recent_tracks'/);
assert.match(source, /syncLibraryRemote\(\)/);
assert.match(source, /clearRecentTracks/);
assert.match(source, /newest\[key\] = item/);
assert.match(source, /refresh the visible Home\/Profile surface/);
assert.match(streak, /fetch\('\/api\/stats\?action=me'/);
const api = fs.readFileSync('api/library.js', 'utf8');
const profile = fs.readFileSync('public/profile.js', 'utf8');
assert.match(api, /clearRecentTracks=body\.clearRecentTracks===true/);
assert.match(api, /next\.recentTracks=clearRecentTracks\?\[\]:/);
assert.match(profile, /clearHistory: function\(\)/);
assert.match(profile, /Profile\.clearHistory\(\)/);
assert.match(streak, /await Stats\.flush\(true\)/);
assert.doesNotMatch(streak, /fetch\(this\.API \+ '\?action=record'/);

console.log('LIBRARY_HISTORY_SYNC_PASS');
