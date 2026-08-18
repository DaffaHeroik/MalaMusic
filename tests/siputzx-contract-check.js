const fs = require('fs');
const source = fs.readFileSync(require.resolve('../api/siputzx-audio.js'), 'utf8');
const server = fs.readFileSync(require.resolve('../server.js'), 'utf8');
const forbidden = /console\.(log|info|warn|error)\([^\n]*(?:fileUrl|audioUrl|signed|cookie|token)/i;
const required = [
  /youtubedl\.siputzx\.my\.id/,
  /type:\s*['"]audio['"]|type=audio/,
  /apikey=/,
  /getSetCookie/,
  /validateAudioUrl/,
  /new CircuitBreaker/
];
if (!required.every(pattern => pattern.test(source))) throw new Error('Siputzx audio contract invariant missing');
if (!/youtubedl\.siputzx\.my\.id/.test(server)) throw new Error('Siputzx proxy allowlist invariant missing');
if (forbidden.test(source)) throw new Error('Siputzx source logs sensitive media/session value');
console.log('SIPUTZX_AUDIO_CONTRACT_PASS');
