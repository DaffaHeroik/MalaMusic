# MalaMusic Review Gaps and Prevention Checklist

**Date recorded:** 2026-08-18  
**Purpose:** Preserve every verification gap discovered during the production, project-review, multi-persona, and brainstorming loops so future reviews test behavior rather than infer it from static evidence.

> A feature is not considered verified merely because its route renders, its API boundary responds correctly, or its normal-path browser journey succeeds. Each asynchronous, cached, authenticated, device-dependent, scheduled, and cross-user behavior needs a direct acceptance test.

## 1. Missed or Under-specified Checks

| ID | Area that received insufficient attention | Why it was missed | Risk created | Mandatory verification next time |
|---|---|---|---|---|
| GAP-001 | Slow-network playback and resolver latency | Normal playback and rapid track switching were tested, but no explicit throttled-network or delayed-resolver acceptance test was included in the first loop. | Users could remain on `Menyiapkan lagu...` while the external resolver or proxy stalled. | Inject delayed and failed resolver responses; assert bounded completion, no indefinite loading, and a clear retry state. |
| GAP-002 | Difference between URL cache and real audio cache | `localStorage` URL entries were treated conceptually as cache without auditing Cache Storage for `/offline-audio/{videoId}` binaries. | An expired stream URL could be mistaken for offline playback capability. | Inspect localStorage, Cache Storage, Service Worker control, binary presence, cache age, and offline playback independently. |
| GAP-003 | Cached URL expiry and invalidation | Cache-hit behavior was checked, but expired or rejected cached URLs were not forced through a failure test. | A stale URL could fail repeatedly or delay recovery. | Seed a bad cached URL; assert it is deleted, one fresh resolver attempt occurs, and retries stop. |
| GAP-004 | Audio-start watchdog | Resolver completion and route transition were observed, but no test required the native audio element to emit `playing` within a bound. | A valid HTTP response that never starts media could leave the player waiting indefinitely. | Delay `playing` after `src` assignment; assert a generation-safe watchdog exits loading and recovers once. |
| GAP-005 | Recovery-state visual truthfulness | The review checked `Dijeda` and mini-player presence but did not test the UI after resolver failure with `S.ip=false` and `S.ct` still current. | Failed playback could show a pause icon and look paused rather than retryable. | Force failure; assert loading uses a spinner, playing uses equalizer, and stopped/failed uses play/retry. |
| GAP-006 | Queue and next/previous during resolver lag | Rapid direct selection was tested, but notification/media-session next/previous and queued transitions under delayed resolver timing were not covered together. | A late resolver or ended event could reset or replace the queue during navigation. | Delay A, press Next/Previous repeatedly, and assert queue identity, final selection, and exactly-once transition behavior. |
| GAP-007 | Offline playlist download completeness | Offline empty state was checked, but a full playlist download was not executed in an installed PWA. | Partial downloads, quota failures, resume behavior, or corrupt binaries could remain undiscovered. | Install PWA; download multi-track playlist; interrupt/resume; verify every binary, metadata, progress, cancellation, and playback offline. |
| GAP-008 | Service Worker cache activation across old clients | Asset markers and cache names were checked, but activation/update behavior across an already-open v81/v82 client was not exercised. | A user could continue executing old player code after deployment. | Keep an old tab open, deploy a new asset version, call `registration.update()`, reload, and verify active controller/cache namespace. |
| GAP-009 | Real Gmail authentication E2E | The review intentionally avoided personal account input and used synthetic invalid registration data. | Password reset, email verification, Google Sign-In, cookie creation, refresh, logout, and cross-device state remain unproven. | Use a disposable Gmail test account; test register/login/verify/reset/Google/logout/refresh and cleanup. |
| GAP-010 | Two-user Listen Together synchronization | The unauthenticated server boundary was tested, but two isolated authenticated sessions were unavailable. | Join presence, host authority, revision conflict, participant removal, drift recovery, and synchronized play/pause may still fail. | Use two authenticated browsers; create/join, play/pause/seek/next, disconnect/reconnect, TTL expiry, and conflict tests. |
| GAP-011 | Authentication-state consistency across browser storage | A local-first liked mutation and signed-out Profile wall were observed and classified as by-design, but the full transition matrix was not tested. | Local collection counts may conflict with server session state or mislead users across devices. | Test fresh signed-out, signed-in, expired-cookie, logout, second-device, and localStorage-cleared states; assert consistent copy and mutation gates. |
| GAP-012 | Actual Android and installed-PWA behavior | Desktop Chromium viewport checks were used because Android hardware was unavailable. | Touch targets, viewport overflow, media notifications, background playback, battery behavior, and Android cache limits remain unknown. | Test on Android Chrome installed PWA and non-installed browser with touch, rotation, background, notification, call interruption, and offline cases. |
| GAP-013 | Screen-reader and exhaustive keyboard accessibility | A targeted Search keyboard fix was verified, but a complete accessibility pass was not performed. | Focus order, modal traps, live loading/error announcements, and icon-only controls may remain inaccessible. | Run keyboard-only journeys and screen-reader checks for every route, modal, player state, and async error. |
| GAP-014 | Poor-network and offline matrix | Browser sessions ran on normal connectivity; the browser extension did not provide a repeatable throttling matrix. | DNS failure, timeout, partial connectivity, captive portal, and offline transitions may expose inconsistent recovery. | Test online, slow 3G, request timeout, API 500, stream 403/410, offline before start, offline during playback, and reconnect. |
| GAP-015 | Performance and resource pressure | No Core Web Vitals, memory, bandwidth, cache quota, or long-session measurement was captured. | Large queues, playlist downloads, repeated navigation, and low-storage devices may degrade or crash. | Capture LCP/INP/CLS, memory, request counts, audio bandwidth, Cache Storage quota, and 30-minute playback sessions. |
| GAP-016 | Upstream resolver reliability and observability | Runtime errors were reviewed, but historical error groups were not initially correlated to deployment age and no controlled failure-rate baseline existed. | CDN outages can be mistaken for client regressions, and circuit-breaker decisions lack evidence. | Tag errors by deployment, measure timeout/403/410 rates, test fallback ordering, and define alert thresholds. |
| GAP-017 | Scheduled midnight/WITA data rollover | API and leaderboard empty states were checked, but the actual midnight WITA rollover and hourly snapshot behavior were not executed. | Streak, hours-listened, leaderboard, and public-playlist freshness may be off by timezone or job timing. | Run a controlled WITA boundary test; verify idempotency, hourly caching, midnight reset, timezone, and missed-job recovery. |
| GAP-018 | Public/private playlist and cross-user data isolation | Public endpoint validation was checked, but a full matrix of owner, viewer, non-owner, deleted, and malformed playlist access was not executed. | Private collections or profile activity could leak through alternate IDs or cached responses. | Use two accounts; test owner/private/public/deleted/guessable IDs, authorization, cache headers, and mutation boundaries. |
| GAP-019 | Deployment rollback and configuration parity | READY status, smoke checks, and clean worktrees passed; rollback was listed as unavailable and not practiced. | A bad asset version, missing secret, or incompatible dependency could require an untested recovery path. | Deploy a canary, verify env parity, roll back, confirm aliases/cache/service-worker behavior, and restore forward. |
| GAP-020 | Secret rotation and production environment confirmation | Secret-pattern scans passed, but revocation/rotation of the previously exposed Cloudflare Global API Key was left to the operator. | A credential may remain valid despite the repository being clean. | Revoke exposed key; create scoped replacement; verify Cloudflare, Vercel, Firebase Admin, session, and internal-secret configuration without printing values. |
| GAP-021 | Legacy configuration and dependency warnings | `netlify.toml` and a dependency `punycode` deprecation warning were documented as cleanup debt, not actively removed or traced. | Future maintainers may deploy through the wrong platform or inherit avoidable runtime noise. | Confirm one authoritative deployment config; remove or document legacy files; trace deprecation ownership before dependency upgrades. |
| GAP-022 | Browser automation reliability versus product behavior | Several stale interactive-element indexes were encountered and correctly classified as tooling drift, but no independent DOM/coordinate fallback protocol was formalized. | A false pass or false failure can result when automation targets a changed page. | Refresh snapshot before interaction, prefer stable IDs/labels, use coordinate fallback, record the mismatch, and repeat the journey independently. |

## 2. Process Failure Behind the Main Miss

The most important missed issue was **GAP-001 through GAP-005**, the slow-playback/cache cluster. The previous loop had a journey called “Search → result playback,” but it did not define the playback state machine as an acceptance contract. The journey therefore proved that a track could eventually render and that stale rapid selections were guarded, but it did not prove what happened when the resolver was slow, the cached URL was expired, the audio source never emitted `playing`, or the current track failed after one retry.

The corrected principle is:

> For every asynchronous feature, test success, delay, cancellation, timeout, stale completion, failure, retry, and recovery UI as separate states.

The second process gap was conflating **static evidence** with **runtime capability**. A URL in localStorage is not an offline song. A Service Worker precache is not an offline audio binary. A Vercel deployment marked READY is not proof of an authenticated two-user social flow. A desktop responsive screenshot is not proof of Android PWA behavior.

## 3. Mandatory Review Lifecycle

### Before implementation

The reviewer must build a feature state matrix. Every feature must list its normal, loading, delayed, cancelled, failed, retried, offline, authenticated, unauthenticated, cross-device, and recovery states. The matrix must identify which states can be tested locally, in a browser, in production, or only with a real device/account.

### Before deployment

The reviewer must run static syntax and dependency checks, inspect all cache namespaces and asset versions, verify environment-variable names without printing secrets, scan client responses for dynamic exception disclosure, and run focused regression tests for every modified async state. Any new timeout, cache, Service Worker, audio, auth, or queue code requires a targeted test rather than only a generic build.

### After deployment

The reviewer must run production HTTP smoke tests, one fresh-cache browser session, one stale-client/update session where relevant, and persona journeys that include both success and failure recovery. Browser evidence must record the route, visible state, request/retry count where observable, final state, and console/runtime status.

### Before sign-off

Three consecutive clean scans are necessary but not sufficient. Each clean scan must include the feature-specific regression test, cache/version consistency, dependency audit, syntax, diff whitespace, deployment marker, runtime error correlation by deployment, and a clean worktree. The sign-off must list unavailable checks explicitly and must not describe them as passed.

## 4. Reusable Async Playback Acceptance Matrix

| State | Required assertion |
|---|---|
| Cache hit with valid offline binary | Starts without resolver request. |
| Cache hit with expired stream URL | Deletes URL, performs one fresh resolver request, then stops or plays. |
| Cache miss | Performs one resolver request and stores only a validated result. |
| Resolver delayed | Shows loading and exits by timeout; never waits indefinitely. |
| Resolver cancelled by new track | Old response cannot set source, metadata, queue, or playback state. |
| Source assigned but no `playing` event | Startup watchdog performs one generation-safe recovery. |
| Stream error/403/410 | Shows actionable retry state; no infinite retry. |
| Current track paused | Shows play control, not pause control. |
| Current track playing | Shows pause/equalizer control. |
| Next/Previous during lag | Preserves queue and transitions exactly once. |
| Offline during playback | Keeps current binary if available; otherwise shows explicit offline limitation. |

## 5. Sign-off Rule for Future Loops

A future production loop must not claim `PASS` for playback, Offline Mode, authentication, Listen Together, or scheduled data merely because the normal route works. It must use the state matrix, provide evidence for each tested state, and label every unavailable environment-dependent state as **UNVERIFIED**. If a user reports a symptom that maps to an untested state, the prior sign-off must be amended with a missed-finding entry before the new fix is accepted.

## 6. Current Status

The cache/resolver gap was discovered after the earlier v81/v84 review and is now documented as a process miss. The implementation was corrected in v83/v84 with cache-first offline-binary selection, bounded resolver and startup timeouts, one controlled fresh retry, stale-generation protection, and truthful recovery controls. The repository’s detailed technical report is [`CACHE_RESOLVER_REVIEW_2026-08-18.md`](CACHE_RESOLVER_REVIEW_2026-08-18.md).
