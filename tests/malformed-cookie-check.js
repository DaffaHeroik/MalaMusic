const assert = require('node:assert/strict');

const handlers = [
  ['profile', require('../api/profile')],
  ['library', require('../api/library')],
  ['blend', require('../api/blend')],
  ['listen-together', require('../api/listen-together')]
];

function response() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
    send(value) { this.body = value; return this; }
  };
}

(async () => {
  for (const [name, handler] of handlers) {
    const res = response();
    await handler({ method: 'GET', query: {}, headers: { cookie: 'mm_session=%E0%A4%A' }, socket: {} }, res);
    assert.equal(res.statusCode, 401, `${name} should reject malformed session cookies as unauthenticated`);
    assert.equal(res.body?.status, false, `${name} should return a normal auth error`);
  }

  const emailRes = response();
  await require('../api/email-auth')({ method: 'GET', query: { action: 'me' }, headers: { cookie: 'mm_session=%E0%A4%A' }, socket: {} }, emailRes);
  assert.equal(emailRes.statusCode, 200);
  assert.equal(emailRes.body?.authenticated, false);
  console.log('MALFORMED_COOKIE_CHECK_PASS');
})().catch(error => { console.error(error); process.exitCode = 1; });
