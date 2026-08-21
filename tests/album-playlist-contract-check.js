const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('api/album.js', 'utf8');
assert.doesNotMatch(source, /if \(!API_KEY\) \{ return res\.status\(503\)/);
assert.match(source, /browse\?prettyPrint=false/);
assert.match(source, /API_KEY \? '&key=' \+ encodeURIComponent\(API_KEY\) : ''/);
assert.match(source, /if \(!browseId\.startsWith\('VL'\) && browseId\.startsWith\('PL'\)\)/);
assert.match(source, /const isPlaylist = browseId\.startsWith\('VL'\)/);
assert.match(source, /status: songs\.length > 0 \|\| isPlaylist/);
console.log('ALBUM_PLAYLIST_CONTRACT_PASS');
