# MalaMusic Cache and Resolver Reliability Review

**Date:** 2026-08-18

**Scope:** Investigate why playback can remain unavailable during network lag and whether MalaMusic repeatedly downloads or re-resolves audio instead of using cache.

## Diagnosis

MalaMusic has two different storage paths. The `pwa_audio_cache` localStorage map stores only the resolver-returned audio URL string. It is not an audio-file cache, and a stream URL may expire or become unavailable. Actual offline playback uses the Cache Storage namespace `malamusic-offline-audio-v1` with `/offline-audio/{videoId}` entries. Those entries are created only after `cacheOfflineAudioBinary()` successfully downloads the audio through `/api/proxy-audio`.

A fresh production Offline screen reported `Belum ada audio offline`. Consequently, that browser session had no binary audio available to bypass the network. When a user had not completed a real offline download, playback still depended on `/api/ytplay`, the returned stream URL, and the proxy/upstream CDN. This explains why a user can see `Menyiapkan lagu...` during upstream lag even though a URL string may exist in localStorage.

Before this fix, the resolver reused a cached URL when available and otherwise called `/api/ytplay`, but it did not have a request timeout or an audio-start watchdog. An expired cached URL or a stalled external stream could therefore leave the player waiting for too long. The previous race-condition fix correctly blocked stale track responses, but it did not yet provide bounded recovery for a valid current track whose source never started.

## Implementation

The v83 resolver patch retained the cache-first order while prioritizing real `/offline-audio/` binaries. Resolver requests now use `AbortController` with a 12-second timeout. After a non-offline source is assigned, a generation-safe 12-second startup watchdog waits for the `playing` event. If the source errors or never starts, the player removes the cached URL, performs at most one fresh resolver retry for the same track generation, and then stops with a clear retry message. Offline-binary failures receive a separate instruction to download again while online. The existing active-track and load-sequence guards remain in place.

A production v83 replay confirmed the slow path: Someone Like You initially displayed `Menyiapkan lagu...`, then eventually entered playing state with the same track still selected. Switching to Easy On Me correctly changed the route and mini-player, and the failure path exited loading with `Gagal menyiapkan lagu. Coba lagi.` rather than waiting indefinitely.

That replay exposed a secondary UI problem: when `S.ip` became false while `S.ct` still pointed to the selected track, several renderers treated every current track as paused and displayed `DIJEDA` with a pause icon. The v84 correction removes those paused-current branches across Search, Home, Album, Artist, Library, Liked, and related renderers. Loading now displays a spinner, active playback displays the equalizer, and stopped or failed playback displays a normal play/retry control. Frontend and Service Worker assets were bumped from v83 to v84.

## Regression and production evidence

| Check | Result |
|---|---|
| Static playback-race and cache-resolver regression test | `PLAYBACK_RACE_STATIC_GUARD_PASS` |
| Renderer paused-current branch audit | Zero remaining `else if (isCur) {` branches |
| Syntax, lint, build, and diff checks | Passed |
| Dependency audit | 0 vulnerabilities |
| v84 production asset markers | 17 in `index.html`; 16 in `sw.js` |
| Service Worker namespace | `malamusic-static-v84` |
| Vercel deployment | READY: `dpl_7vFAodrYKLt1oQKmrmih32N6rBc9` |
| Current production commit | `31bb97b` |
| Auth boundary smoke | `auth-me` unauthenticated; library 401 |

The My Browser extension timed out twice during a fresh v84 UI replay after the page navigation. This prevented a second clean visual capture of the v84 icon state, but v84 production markers, deployment state, source syntax, static regression checks, and the earlier v83 production resolver replay were all independently verified. The browser timeout is classified as an environment limitation, not a confirmed production failure.

Vercel’s aggregate runtime report still contains historical SaveTube extractor and lyrics timeout groups whose `lastDeployment` is the older `dpl_49aeEfTjK3rAU4LMpQut6mk3eLEW`, not the current v84 deployment. These upstream failures remain a resolver reliability risk, but they are not evidence that the v84 cache or playback-generation fix is looping.

## Acceptance criteria

| Criterion | Status |
|---|---|
| A real offline binary is preferred when present. | Passed by `/offline-audio/{videoId}` Cache Storage lookup. |
| Resolver requests do not wait forever. | Passed by the 12-second AbortController timeout. |
| A stalled current source has bounded recovery. | Passed by the 12-second startup watchdog and one retry. |
| A failed cached URL is invalidated before retry. | Passed by `delete audioUrlCache[vid]`. |
| Stale tracks cannot trigger recovery for the new selection. | Passed by existing load-sequence and active-source guards. |
| Failed playback no longer looks paused. | Passed by renderer branch audit and v84 UI patch. |
| Assets are invalidated on deployment. | Passed by v84 markers and Service Worker namespace. |

## Final status

The issue is **CONDITIONALLY FIXED**. The player no longer depends on an unbounded resolver wait, does not repeatedly retry indefinitely, invalidates a failed cached URL before one controlled fresh attempt, and presents a truthful stopped/retry state after failure. Real offline playback still requires the user to complete a successful download; storing only a resolver URL in localStorage is not equivalent to downloading a song.

The highest-value next improvement is a visible retry button tied to the current track generation rather than a toast-only retry instruction. A separate operational improvement would be measuring upstream CDN failure rates and adding a more reliable audio source strategy; that should not be mixed into the current client-side cache correctness fix.
