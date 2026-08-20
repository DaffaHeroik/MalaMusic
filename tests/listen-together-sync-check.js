const assert = require('node:assert/strict');
const fs = require('node:fs');

const api = fs.readFileSync('api/listen-together.js', 'utf8');
const lt = fs.readFileSync('public/listen-together.js', 'utf8');
const player = fs.readFileSync('public/player.js', 'utf8');
const library = fs.readFileSync('public/library.js', 'utf8');
const album = fs.readFileSync('public/album.js', 'utf8');
const app = fs.readFileSync('public/app.js', 'utf8');

assert.match(api, /ref\.transaction\(function \(current\)/);
assert.match(api, /expectedVersion/);
assert.match(api, /conflict \|\| !result\.committed/);
assert.doesNotMatch(api, /await ref\.update\(\{ state: nextState/);

assert.match(lt, /function blockFollowerAction\(\)/);
assert.match(lt, /syncAfterLocalAction/);
assert.match(lt, /blockFollowerAction: blockFollowerAction/);
assert.match(lt, /expectedVersion: Number\(state\.lastVersion \|\| 0\)/);

for (const source of [player, library, album, app]) {
    assert.match(source, /ListenTogether\.blockFollowerAction/);
}
assert.match(player, /ListenTogether\.syncAfterLocalAction/);
assert.match(library, /ListenTogether\.syncAfterLocalAction/);
assert.match(album, /ListenTogether\.syncAfterLocalAction/);
assert.match(app, /ListenTogether\.syncAfterLocalAction/);

console.log('LISTEN_TOGETHER_SYNC_STATIC_GUARD_PASS');
