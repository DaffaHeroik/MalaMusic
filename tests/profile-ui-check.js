'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');

const profile = fs.readFileSync('public/profile.js', 'utf8');

assert.match(profile, /max-w-6xl mx-auto/);
assert.match(profile, /Pusat koleksi/);
assert.match(profile, /Ringkasan mendengar/);
assert.match(profile, /Playlist publik/);
assert.match(profile, /Terakhir diputar/);
assert.match(profile, /aria-label="Navigasi profil"/);
assert.match(profile, /id="profile-activity-zone"/);
assert.match(profile, /id="profile-collection-zone"/);
assert.match(profile, /id="profile-recent-zone"/);
assert.match(profile, /id="profile-public-zone"/);
assert.match(profile, /aria-live="polite"/);
assert.match(profile, /id="profile-listening-card"/);
assert.match(profile, /id="profile-streak-card"/);
assert.match(profile, /id="profile-public-playlists"/);
assert.match(profile, /id="pwa-install-action"/);
assert.match(profile, /Profile\.showSettings\(\)/);
assert.match(profile, /App\.autoPlayTrack/);

console.log('PROFILE_UI_CHECK_PASS');
