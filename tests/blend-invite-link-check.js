const assert = require('node:assert/strict');
const fs = require('node:fs');

const frontend = fs.readFileSync('public/blend.js', 'utf8');
const profile = fs.readFileSync('public/profile.js', 'utf8');
const app = fs.readFileSync('public/app.js', 'utf8');
const backend = fs.readFileSync('api/blend.js', 'utf8');
const index = fs.readFileSync('public/index.html', 'utf8');

assert.match(frontend, /sessionStorage\.setItem\(PENDING_KEY/);
assert.match(frontend, /resumePendingInvite/);
assert.match(frontend, /navigator\.share/);
assert.match(frontend, /location\.origin \+ invitePath/);
assert.match(frontend, /renderLoginRequired/);
assert.match(frontend, /renderInvitation/);
assert.match(frontend, /onclick="Blend\.join/);
assert.match(profile, /Blend\.resumePendingInvite\(\)/);
assert.match(app, /path\.startsWith\('\/blend\/'\)/);
assert.match(backend, /room\.invitedUid !== user\.uid/);
assert.match(backend, /update\.invitedUid = inviteUid/);
assert.match(backend, /room\.invitedUid !== user\.uid.*Undangan Blend ini bukan untuk akunmu/);
assert.match(index, /blend\.js\?v=145/);
assert.doesNotMatch(frontend, /idToken|mm_session|firebase.*token/i);

console.log('BLEND_INVITE_LINK_CHECK_PASS');
