class CircuitBreaker {
  constructor({ failureThreshold = 3, cooldownMs = 60_000 } = {}) {
    this.failureThreshold = failureThreshold;
    this.cooldownMs = cooldownMs;
    this.state = 'CLOSED';
    this.failures = 0;
    this.openedAt = 0;
    this.probeInFlight = false;
  }

  canRequest(now = Date.now()) {
    if (this.state === 'CLOSED') return true;
    if (this.state === 'HALF_OPEN') return false;
    if (now - this.openedAt < this.cooldownMs || this.probeInFlight) return false;

    this.state = 'HALF_OPEN';
    this.probeInFlight = true;
    return true;
  }

  recordSuccess() {
    this.state = 'CLOSED';
    this.failures = 0;
    this.openedAt = 0;
    this.probeInFlight = false;
  }

  recordFailure(now = Date.now()) {
    this.probeInFlight = false;
    this.failures += 1;

    if (this.state === 'HALF_OPEN' || this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      this.openedAt = now;
    }
  }

  snapshot() {
    return {
      state: this.state,
      failures: this.failures,
      openedAt: this.openedAt,
      probeInFlight: this.probeInFlight
    };
  }
}

module.exports = { CircuitBreaker };
