# MalaMusic Playback Race-Condition Review

**Date:** 2026-08-18

**Scope:** Wrong or previous song starts when a user selects another track during resolver lag.

**Baseline:** Production v81, commit `e5410ae`.

## [ORIENT]

The reported symptom is a timing/state bug in the browser audio engine, not an authentication or backend authorization defect. The relevant path is `public/player.js`: `loadTrack()` increments `audioLoadSequence`, resolves `/api/ytplay`, assigns the native `<audio>` source, and starts playback. Native audio events update global `S.ip`, `S.il`, progress, statistics, and queue auto-next behavior. Adjacent tracks are also pre-resolved in the background.

The prior implementation guarded resolver completion with `loadSequence === audioLoadSequence && S.ct === track`, but native audio events had no equivalent source-generation guard. A stale `ended`, `waiting`, `pause`, or `error` event could therefore mutate global player state or invoke `NX()` after a newer selection. Delayed `loadedmetadata` callbacks and auto-next recommendation responses also lacked complete stale-state protection.

## [USER: Normal / BASELINE SESSION]

On production, a single switch from Someone Like You to Easy On Me changed the route, result state, and mini-player correctly. The exact symptom did not reproduce with one switch, so a controlled timing harness was used to test the higher-risk multi-click and delayed-resolver path rather than declaring the issue unverified.

## [REVIEWER: TRIAGE]

| ID | Severity | Confidence | Finding | Status |
|---|---|---:|---|---|
| `BUG-002` | P1 | High | Obsolete native audio events could mutate global state or trigger auto-next after a newer track selection. | Fixed |
| `BUG-003` | P2 | High | Delayed metadata and auto-next recommendation callbacks could continue after the active track changed. | Fixed |
| `PERF-002` | P2 | Medium | Background adjacent-track prefetch has no cancellation, although it does not assign the main audio element. | Retained; bounded by generation checks and not part of the wrong-track root cause. |

## [DEV: FIX]

The smallest compatible fix was applied in `public/player.js`. On every `loadTrack()` call, the previous source is paused, removed, and unloaded immediately; `activeAudioTrack` and `activeAudioSequence` are reset until the current resolver result passes the existing load guard. Once the current source is accepted, the active track and sequence are marked before assigning `AU.src`.

All native audio listeners now call `isCurrentAudioSource()` before mutating player state. The same generation check protects the loaded-metadata resume callback and the auto-next recommendation fetch. `TP()` also reloads the current track if the audio element has a source that does not belong to the current active generation. Frontend and service-worker assets were bumped from v81 to v82, with 17 v82 markers in `index.html`, 16 v82 precache URLs in `sw.js`, and cache namespace `malamusic-static-v82`.

A repeatable static regression check was added at `tests/playback-race-check.js` and exposed as `npm run test:playback-race`. It verifies the source-generation invariants and all native event guards.

## [VERIFY: LOCAL TIMING SESSION]

The patched local v82 frontend was started on port 3198 and opened in Chromium. The browser intercepted only `/api/ytplay` and returned synthetic audio URLs with controlled delays. Five actual result buttons were clicked in rapid sequence: Someone Like You, Easy On Me, Love In The Dark, All I Ask, and Easy On Me, at 30 ms intervals. A stale `ended` event was fired at 155 ms while the final resolver was pending, followed by a current-track `ended` event at 1000 ms.

The final mini-player remained `Easy On Me Adele`, the active source was `H9NJenpBV2I` with load sequence 5, the stale event left `NX` at zero, and the current event incremented `NX` exactly once. No stale source was assigned while the final resolver was pending. This is direct evidence that the wrong-track/previous-track race is blocked in the patched browser code.

The static regression check passed as `PLAYBACK_RACE_STATIC_GUARD_PASS`. The targeted syntax and diff gate passed as `RACE_REGRESSION_GATE_2_PASS`.

## [VERIFY: ACCEPTANCE CRITERIA]

| Acceptance criterion | Result |
|---|---|
| Selecting a new track invalidates the previous audio generation immediately. | Passed. |
| Old resolver responses cannot assign `AU.src`. | Passed by existing sequence guard plus active-source reset. |
| Old native audio events cannot change loading/playing state. | Passed by seven event-handler guards. |
| Old native `ended` cannot trigger `NX()`. | Passed by the local delayed-event harness. |
| Current-track `ended` still triggers normal auto-next behavior. | Passed; exactly one current event advanced the instrumented `NX`. |
| Queue and selected track remain the final user choice during rapid switching. | Passed; final mini-player remained Easy On Me. |
| Frontend cache is invalidated on deployment. | Passed; assets bumped v81→v82 and service-worker namespace aligned. |

## [BRAINSTORM]

The fix addresses the reported bug without adding a new dependency or changing the queue model. A future improvement may add a visible timeout state after a bounded resolver duration, with a `Coba lagi` action that retries only the selected generation. That is a UX improvement on top of this correctness fix and should be reviewed separately.

The adjacent prefetch path could later use `AbortController` per track if network/memory measurements show meaningful waste. It should not be changed speculatively because prefetch does not currently assign the main audio source and cancellation could reduce Next/Previous responsiveness.

## [FINAL SIGN-OFF]

The implementation is ready for deployment verification. The local race-condition acceptance criteria passed, the patch is incremental, and no data migration or auth change is involved. Required remaining steps are commit/push, Vercel READY verification, production fresh-cache browser replay with rapid track switching, three independent clean scans, and final documentation. Real Android hardware and a throttled physical-network test remain unavailable in this environment.
