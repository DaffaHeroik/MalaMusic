const assert = require('node:assert/strict');
const fs = require('node:fs');

const transcribe = fs.readFileSync('api/transcribe.js', 'utf8');
const search = fs.readFileSync('api/search.js', 'utf8');
const server = fs.readFileSync('server.js', 'utf8');
const stats = fs.readFileSync('api/stats.js', 'utf8');
const lyrics1 = fs.readFileSync('api/lyrics1.js', 'utf8');
const lyrics2 = fs.readFileSync('api/lyrics2.js', 'utf8');

assert.match(transcribe, /process\.env\.ASSEMBLYAI_API_KEY/);
assert.doesNotMatch(transcribe, /ASSEMBLYAI_KEY\s*=\s*['\"][A-Za-z0-9]/);
assert.match(transcribe, /Endpoint internal/);
assert.match(transcribe, /YOUTUBE_ID_RE/);
assert.match(search, /req\.method !== 'GET'/);
assert.match(lyrics1, /Endpoint internal/);
assert.match(lyrics2, /Endpoint internal/);
assert.match(server, /app\.all\('\/api\/proxy-image'/);
assert.match(server, /isAllowedImageUrl/);
assert.match(server, /IMAGE_MAX_BYTES/);
assert.match(server, /Endpoint API tidak ditemukan/);
assert.match(stats, /requestedSeconds/);
assert.match(stats, /requestedSeconds <= 0/);
assert.match(stats, /const seconds = Math.min\(120, requestedSeconds\)/);
assert.doesNotMatch(stats, /Math\.max\(1, Math\.min\(120, Math\.round\(Number\(body\(req\)\.seconds/);

console.log('API_CONTRACT_STATIC_GUARD_PASS');
