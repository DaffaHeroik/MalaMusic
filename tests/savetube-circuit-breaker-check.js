const assert = require('node:assert/strict');
const { CircuitBreaker } = require('../api/savetube-circuit-breaker');

const breaker = new CircuitBreaker({ failureThreshold: 3, cooldownMs: 1000 });
let now = 10_000;

assert.equal(breaker.canRequest(now), true, 'closed circuit should allow requests');
breaker.recordFailure(now);
breaker.recordFailure(now);
assert.equal(breaker.snapshot().state, 'CLOSED', 'circuit stays closed below threshold');
breaker.recordFailure(now);
assert.equal(breaker.snapshot().state, 'OPEN', 'circuit opens at threshold');
assert.equal(breaker.canRequest(now + 500), false, 'open circuit fast-fails during cooldown');
assert.equal(breaker.canRequest(now + 1000), true, 'one half-open probe is allowed after cooldown');
assert.equal(breaker.snapshot().state, 'HALF_OPEN', 'circuit enters half-open for probe');
assert.equal(breaker.canRequest(now + 1000), false, 'duplicate half-open probe is rejected');
breaker.recordSuccess();
assert.deepEqual(breaker.snapshot(), {
  state: 'CLOSED',
  failures: 0,
  openedAt: 0,
  probeInFlight: false
});

const failedProbe = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 1000 });
failedProbe.recordFailure(now);
assert.equal(failedProbe.canRequest(now + 1000), true);
failedProbe.recordFailure(now + 1000);
assert.equal(failedProbe.snapshot().state, 'OPEN', 'failed probe reopens circuit');

console.log('SAVETUBE_CIRCUIT_BREAKER_PASS');
