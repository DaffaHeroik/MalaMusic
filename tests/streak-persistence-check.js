'use strict';
const assert = require('node:assert/strict');
const streak = require('../api/streak.js')._test;
const stats = require('../api/stats.js')._test;

// Helper: compute the day key for today in Asia/Makassar timezone
function todayKey() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Makassar' }).format(new Date());
}

// Helper: compute the day key for yesterday in Asia/Makassar timezone
function yesterdayKey() {
  const now = new Date();
  // Subtract 24 hours and re-format to handle DST edge cases
  now.setUTCDate(now.getUTCDate() - 1);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Makassar' }).format(now);
}

const calculated = streak.calculate(['2026-08-20', '2026-08-21', '2026-08-22', '2026-08-24']);
assert.equal(calculated.best, 3);
assert.equal(calculated.activeDays, 4);

const merged = stats.mergeStatsMirror({
  status: true,
  stats: { hours: 0, totalSeconds: 12, activeDays: 1, streak: 0, bestStreak: 0 }
}, {
  lastListenDate: null,
  stats: { hours: 8.3, totalSeconds: 29880, activeDays: 6, streak: 6, bestStreak: 6 }
});
assert.equal(merged.stats.totalSeconds, 29880);
assert.equal(merged.stats.activeDays, 6);
assert.equal(merged.stats.bestStreak, 6);
assert.equal(merged.stats.streak, 0);

const legacyWorkerShape = stats.mergeStatsMirror({
  status: true,
  stats: { hours: 8.4, activeDays: 6, streak: 0, bestStreak: 0 }
}, { lastListenDate: null, stats: { totalSeconds: 0, activeDays: 0, streak: 0, bestStreak: 0 } });
assert.equal(legacyWorkerShape.stats.totalSeconds, 30240);
assert.equal(legacyWorkerShape.stats.hours, 8.4);

// Use a dynamic date (yesterday) so the test never goes stale.
// applyLegacyStreak only preserves streak when lastActive is today or yesterday.
const preserved = stats.applyLegacyStreak({
  status: true,
  stats: { hours: 0, totalSeconds: 1, activeDays: 1, streak: 0, bestStreak: 0 }
}, { lastActive: yesterdayKey(), current: 6, best: 6, activeDays: 6 });
assert.equal(preserved.stats.bestStreak, 6);
assert.equal(preserved.stats.streak, 6);
assert.equal(preserved.stats.activeDays, 6);

// Also test that a stale date (2+ days ago) does NOT preserve streak
const staleResult = stats.applyLegacyStreak({
  status: true,
  stats: { hours: 0, totalSeconds: 1, activeDays: 1, streak: 0, bestStreak: 0 }
}, { lastActive: '2020-01-01', current: 6, best: 6, activeDays: 6 });
assert.equal(staleResult.stats.bestStreak, 6);
assert.equal(staleResult.stats.streak, 0);
assert.equal(staleResult.stats.activeDays, 6);

console.log('STREAK_PERSISTENCE_CHECK_PASS');
