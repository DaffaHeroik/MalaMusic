const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const listeners = {};
const context = {
  console,
  setTimeout: () => 1,
  clearTimeout: () => {},
  Blob: class Blob { constructor(parts, options) { this.parts = parts; this.options = options; } },
  navigator: { sendBeacon: () => true },
  window: { addEventListener: (name, fn) => { listeners[`window:${name}`] = fn; } },
  document: { visibilityState: 'visible', addEventListener: (name, fn) => { listeners[`document:${name}`] = fn; } },
  fetch: async () => ({ ok: true }),
  Profile: { refreshListeningStats: () => {} }
};
vm.createContext(context);
vm.runInContext(fs.readFileSync('public/stats.js', 'utf8'), context, { filename: 'public/stats.js' });
const stats = context.Stats;
const track = { videoId: 'runtime-test' };

stats.reset(track, 0);
stats.tick(track, 10);
assert.equal(stats.pending, 0, 'position updates before native playing must not count');

stats.start(track, 10);
stats.tick(track, 15);
assert.equal(stats.pending, 5, 'normal forward media progress must count');
stats.stop(track, 15);
stats.tick(track, 25);
assert.equal(stats.pending, 5, 'paused or stopped media must not count');

stats.start(track, 15);
stats.markSeeking(track);
stats.tick(track, 120);
assert.equal(stats.pending, 5, 'seek jumps must not count as listening');
stats.rebase(track, 120);
stats.tick(track, 125);
assert.equal(stats.pending, 10, 'progress after seek must count from the rebased position');
stats.stop(track, 125);

stats.reset(track, 0);
stats.start(track, 0);
const sourceJumpBaseline = stats.pending;
stats.tick(track, 31);
assert.equal(stats.pending, sourceJumpBaseline, 'a source jump larger than the safety window must not count');
stats.tick(track, 33);
assert.equal(stats.pending, sourceJumpBaseline + 2, 'normal progress after a source jump rebase must count');

console.log('RUNTIME_LISTENING_BEHAVIOR_PASS');
