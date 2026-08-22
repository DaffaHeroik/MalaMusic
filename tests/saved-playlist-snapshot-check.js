const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('public/album.js', 'utf8');
assert.match(source, /A saved external playlist is a user-owned snapshot/);
assert.match(source, /songs: localSavedPlaylist\.songs/);
assert.match(source, /if \(!sim && s\.cover\) sim = safeMediaUrl\(s\.cover, FI\)/);
assert.match(source, /id: s\.videoId \|\| s\.id, videoId: s\.videoId \|\| s\.id/);
console.log('SAVED_PLAYLIST_SNAPSHOT_PASS');
