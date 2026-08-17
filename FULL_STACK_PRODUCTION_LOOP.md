# Full-Stack Production Loop Evidence Log

## [ORIENT]

**Project:** MalaMusic, `/home/ubuntu/MalaMusic`, GitHub `DaffaHeroik/MalaMusic`.

**Goal:** Run a complete production loop across the permanent Spotify-style web player, Firebase Gmail-only authentication, profile/library synchronization, Search/playback, Offline Mode, Listen Together, statistics/streak features, backend APIs, security, operations, and deployment.

**Current source:** `319c079 fix: align service worker cache version`; v81 is live on Vercel production. The evidence ledger is intentionally modified until its final sign-off is committed.

**Stack:** Vanilla JavaScript frontend with Tailwind CDN and Firebase compat SDK 12.1.0; Express 5.2.1 backend deployed through Vercel; Firebase Admin 13.6.0; Firebase Realtime Database; Cloudflare statistics worker; service worker cache v81; custom domain `music.malawalipayment.web.id` and Firebase Auth domain `auth.music.malawalipayment.web.id`.

**Baseline commands and results:**

| Check | Evidence | Result |
|---|---|---|
| Repository status | `git status --short --branch` | PASS; `main` clean and aligned with `origin/main` |
| Recent history | `git log -5 --oneline` | PASS; accessibility patch and review reports present |
| Package scripts/config | `package.json` inspection | PASS; `lint`, `dev`, `build`, and `start` are defined |
| Dependency audit | `npm audit --omit=dev --audit-level=moderate` | PASS; 0 vulnerabilities |
| JavaScript syntax | `node --check` over `api/*.js`, `server.js`, `public/*.js` | PASS |
| Production HTML | `curl` custom domain | PASS; `/firebase.js?v=81` and `/sw.js?v=81` served |
| Service worker | `curl https://music.../sw.js?v=81` | PASS; `malamusic-static-v81` and `/search.js?v=81` served |

**Initial journey map:** anonymous Home → Search → result playback → mini-player → queue/context menu; Profile → Login/Daftar → Gmail-only auth and session state; authenticated user → profile/library/liked playlists/stats; Offline Mode → explicit binary audio download/cache → offline playback; Listen Together → create/join room → participant presence → host-controlled playback; operations → API validation, logging, dependency checks, Vercel deploy, cache verification.

**Known limitations entering this loop:** Full authenticated E2E requires a disposable Gmail test account and email interaction; two-session Listen Together requires isolated authenticated browser sessions and cleanup; Android hardware and screen-reader testing are not available in the current environment. These will be marked as limitations rather than inferred as passing.

**Primary production risks:** resolver latency and recovery, auth/session boundaries, social-room authority and persistence, offline binary integrity, public/private data exposure, configuration parity, and service-worker cache correctness.

**Stop condition:** No open P0/P1, security/privacy risk, regression, or in-scope quality defect; three clean verification sessions using distinct personas; relevant automated checks pass; final ratings and residual risks documented.

**Baseline log:** `/tmp/malamusic-fullstack-baseline.txt`.

## [USER: Normal / SESSION 1]

**Goal:** Exercise the anonymous Home experience and identify whether core entry points, personalized/anonymous states, and catalog content render coherently.

**Evidence:** Fresh production URL `https://music.malawalipayment.web.id/?fullstack=normal-home-v80`; browser bootstrap completed in Chromium.

**Observed:** Home presents category chips, a clear anonymous Listening Streak prompt with Login, Recently Played cards, Quick Picks, Popular Playlists, Top Artists, primary navigation, and the social/offline/profile entries. The anonymous state is explicit rather than pretending to have a personalized streak. Catalog sections populated after bootstrap, with song, playlist, and artist cards visible. No new blocker or broken route was observed.

**Session status:** Clean for the tested anonymous Home journey. Search, playback, offline, and social subflows remain to be exercised in this full-stack cycle.

The first navigation attempt used a stale interactive-element index after the Home page changed state and opened Leaderboard instead of Search; this was an automation targeting issue, not a product defect. The visible Leaderboard route loaded and showed its empty-state copy: `Leaderboard belum tersedia` and the midnight WITA refresh explanation. Re-targeting the current visible Search control opened Search successfully. Search then rendered the input, recent-search chips, catalog sections, and navigation without a route error. No application defect was attributed to the stale click.

## [USER: Normal / SESSION 2]

Search input accepted `Adele` and navigated to `/search/Adele`. After bootstrap, the page displayed suggestions, filter tabs, and a populated song result list. Result buttons exposed accessible labels such as `Putar Someone Like You oleh Adele`, with separate Opsi lagu buttons. The results and suggestions loaded successfully; the short loading interval was recoverable and did not produce a broken route. The earlier accidental Leaderboard navigation was recovered through the visible Search control and is classified as automation index drift, not a product issue.

The first Adele result opened `/play/UQ8cXH7qbVU`, populated the mini-player, and after resolver completion the track appeared as `Dijeda` in the result and mini-player. The transient `Menyiapkan lagu...` state recovered without a user-visible error or route loss. Playback entry and state selection passed this normal-user session.

The track context menu exposed queue, playlist, liked, offline, and share actions. A stale menu index targeted `Download ke Mode Offline` rather than the intended liked action; the application correctly opened `Install Aplikasi Terlebih Dahulu` and explained that Offline Mode requires the PWA to be installed. This is a clear prerequisite gate, not a failure. No download or data mutation occurred. The liked/auth boundary remains to be tested with a freshly inspected menu index.

After closing the Offline Mode install modal, the mini-player Like control was tested. It produced `Ditambahkan ke Lagu Disukai` rather than a login gate, indicating that this persisted browser session is authenticated from prior work even though the fresh Home view showed the anonymous streak prompt. This is an important environment-state observation: anonymous and authenticated claims must be separated, and this full-stack loop will not treat the Like result as a new-user auth test. No destructive data operation was performed beyond adding the current track to the persisted test session’s liked collection.

## [BUG-001] Local-first liked state can coexist with the signed-out Profile wall

**Severity:** INFO; **confidence:** high; **status:** by-design local-first behavior, not a production defect.

**Reproduction:** In the same browser session, the mini-player Like action returned `Ditambahkan ke Lagu Disukai`. Opening Profile immediately afterward showed `Masuk dengan Gmail untuk menyimpan profil kamu`, Login/Daftar controls, `Jam mendengar` saying login is required, and the anonymous streak card, while the same Profile page showed `1 Lagu disukai` and the current track in recent activity. The Profile route therefore presents signed-out authentication copy while exposing persisted authenticated collection state.

**Expected:** Authenticated state, collection counts, activity, profile controls, and session-dependent messaging should agree. If the browser is signed out, the Like mutation should be rejected; if it is authenticated, Profile should show the account state and authenticated controls.

**Actual:** Like mutation succeeds, but Profile renders the signed-out auth wall and anonymous streak/stat copy.

**Evidence:** Production browser session at `/play/UQ8cXH7qbVU` then Profile; visible interactive elements include Login/Daftar alongside `Lagu Disukai 1 lagu` and `Someone Like You` activity.

**Likely blast radius:** Profile, Home streak, library/liked navigation, auth session bootstrap, and any cross-device state that depends on Firebase auth versus the backend `mm_session` cookie.

## [QA: API CONTRACT / SESSION 3]

Safe production requests returned the following contracts: `/api/email-auth?action=me` → HTTP 200 with `authenticated:false`; `/api/library` without a cookie → HTTP 401; invalid public-playlist ID → HTTP 400; Listen Together state/create without a cookie → HTTP 401; empty/control-character Search → HTTP 400; malformed ytplay payload → HTTP 400. Error schemas were JSON, concise, and did not expose stack traces or secrets. This API boundary session produced no new defect.

Evidence is stored at `/tmp/malamusic-api-contracts.txt`.

## [USER: Normal / SESSION 4]

Profile’s Offline navigation opened the Offline route successfully. The page displayed `Online`, device storage usage, `Belum ada audio offline`, and a clear instruction to use the Download icon in the player. No offline audio existed in this browser, and no PWA installation or binary download was attempted because the environment is not an installed PWA and the action would create persistent cache data. The empty state and route behavior passed.

## [USER: Adversarial / SESSION 5]

Listen Together opened from Offline Mode. Attempting `Buat Room dari Lagu Sekarang` with `/api/email-auth?action=me` reporting unauthenticated changed the button to `Membuat room...` briefly, then returned `Login diperlukan untuk Listen Together.` The modal remained open and no room was created. Server-side authentication enforcement and user-facing recovery passed this boundary test.

## [QA: API DATA BOUNDARIES / SESSION 6]

Profile GET/PATCH, library PUT, streak, and stats `me` without a session all returned HTTP 401 with concise login-required messages. Non-Gmail registration returned HTTP 400 with Gmail-only validation. Public leaderboard returned HTTP 200 with an empty snapshot (`updatedAt:null`, `leaderboard:[]`) rather than leaking private data. Invalid stats action without a session returned 401 before action dispatch, which is an acceptable protected-route boundary.

## [OPERATOR / SESSION 7]

`npm run lint`, `npm run build`, all-project syntax checks, dependency audit, and local server startup smoke passed. The local server served the root route on port 3199 and exited cleanly after the bounded smoke window. Node emitted a `punycode` deprecation warning from a dependency; this is not a production failure or a new application error, but it should remain in the dependency-maintenance backlog if the upstream package chain changes.

Evidence: `/tmp/malamusic-api-contracts-2.txt` and `/tmp/malamusic-operator-audit.txt`.

## [SEC-001] Unexpected email-auth errors could expose upstream exception text

**Severity:** P1 candidate; **status:** fixed locally, pending deployment.

The security scan found `api/email-auth.js` returning `error.message` in its generic HTTP 502 fallback. Known Firebase auth codes were already mapped to safe messages, but unexpected Firebase/configuration exceptions could expose implementation or upstream details. The fallback now logs the detailed exception server-side and returns only `Server autentikasi belum siap.`

Validation passed: `node --check api/email-auth.js`, `git diff --check`, `npm audit --omit=dev --audit-level=moderate`, and the raw-error scan.

## [REG-001] Service-worker cache name lagged behind v81 asset URLs

The first v81 production smoke test found that `sw.js?v=81` contained v81 precache URLs but still declared `CACHE_STATIC_NAME = 'malamusic-static-v80'`. This could leave the new release sharing the old static cache namespace and weaken the intended cache-bust behavior. The cache name was corrected to `malamusic-static-v81`; the release must be revalidated and redeployed. This finding resets the clean streak.

## [DEV: SESSION 8]

SEC-001 was fixed in `api/email-auth.js` by replacing the generic 502 response’s raw exception text with a safe message. The first v81 deployment was READY, but its smoke test exposed REG-001: `sw.js` still named the static cache v80. `public/sw.js` was corrected to `malamusic-static-v81`, validated, committed as `319c079`, and redeployed.

The follow-up deployment `dpl_FAKWCc5xjJG49eMBVe8qEsS2tVKb` for `319c079` reached Vercel `READY` in production. Corrected smoke verification passed: live HTML contains v81 markers with no v80 leftovers, `sw.js?v=81` declares `malamusic-static-v81` and has 16 v81 precache URLs, Firebase uses `auth.music.malawalipayment.web.id`, and `/api/email-auth?action=me` returns the expected unauthenticated JSON contract.

## [VERIFY: SESSION 1 / Anonymous User]

Fresh browser verification on `/?fullstack=verify-anonymous-v81` completed after v81 deployment. Splash transitioned to Home; anonymous Listening Streak copy showed Login; Recently Played, Quick Picks, Popular Playlists, Top Artists, category chips, and primary navigation all rendered. The catalog changed from the prior session, confirming the home refresh path still works. No browser console error or startup failure was observed in the visible session.

**Clean streak:** 1.

The second verification session began by attempting to open Search from Home. The browser automation index was stale and opened Leaderboard; the Leaderboard route rendered normally and was not a product failure. Re-targeting the currently visible Search control opened Search and displayed the search input, recent-search chips, and loading skeletons. The session remains in progress for query/result/playback verification.

The second verification session’s Adele query completed normally. Results included Music/Playlist/Artist filters and accessible primary result buttons such as `Putar Someone Like You oleh Adele`, with separate Opsi lagu controls. Search output and result labeling remained intact after the v81 release.

The first Adele result opened the play route, populated the mini-player, and settled to `Dijeda` after the resolver state. The result button and mini-player remained visible and no playback route error appeared.

**Clean streak:** 2.

## [VERIFY: SESSION 3 / Adversarial User]

On the v81 playback route, Listen Together opened with a current track. Attempting `Buat Room dari Lagu Sekarang` produced the clear toast/message `Login diperlukan untuk Listen Together.` The modal remained open, the button recovered to its normal label, and no room was created. This independently re-verified the social auth boundary after deployment.

**Clean streak:** 3.

## [VERIFY: SESSION 9 / Final Gate Diagnosis]

The first final-gate command exited non-zero because the evidence ledger had been appended after the previous release commit, leaving `FULL_STACK_PRODUCTION_LOOP.md` modified. Independent assertions then passed: all JavaScript syntax checks, `git diff --check`, npm audit with 0 vulnerabilities, unsafe-pattern scan, raw-error scan, cache-name check, v81 counts, and no v80 leftovers. The only remaining action is to commit this final evidence update, then rerun the gate against a clean worktree.

## [VERIFY: QUALITY RATINGS]

Ratings below apply to the v81 production state and are based on the automated checks, direct production requests, browser sessions, and operator checks recorded in this ledger. They are not a claim of absolute safety or complete device coverage.

| Dimension | Rating | Evidence | Remaining weakness |
|---|---:|---|---|
| Functional correctness | 8.5/10 | Home, Search, result playback, mini-player, Offline empty state, Leaderboard empty state, Listen Together auth boundary, and protected API contracts were exercised successfully. | A real Gmail registration/login/reset/verification flow was not completed in this environment; two-account room synchronization was not run end-to-end. |
| UX and accessibility | 8.0/10 | Anonymous and authenticated copy was observed, result rows expose accessible labels, Search controls and separate options buttons are available, error recovery remained actionable, and the responsive browser layout rendered on the verification viewport. | Android hardware, screen-reader behavior, and broader keyboard/focus coverage were not available in this cycle. Resolver waiting remains the clearest user-facing friction point. |
| Reliability | 8.0/10 | Resolver loading recovered to a stable paused state, Listen Together auth failure recovered without a stuck button or room creation, service-worker cache mismatch was fixed, API failures returned bounded contracts, and Vercel reported no runtime errors in the last 30 minutes. | Resolver timeout/retry behavior under a real upstream timeout and two-session presence/host handoff remain unverified. |
| Security and privacy | 8.5/10 | Gmail-only validation, server-side session enforcement, protected route checks, safe generic auth errors, rate-limit hardening, bounded proxy behavior, production log hardening, and `npm audit` with 0 vulnerabilities passed. | Credential rotation is still required for the previously exposed Cloudflare Global API Key. A public YouTube Music client key fallback remains in source and should be moved to deployment configuration. |
| Performance | 8.0/10 | Static assets use aligned v81 cache-busting, service-worker precache is consistent, catalog/playback requests completed in production smoke sessions, and proxy/rate controls are bounded. | No quantitative load, Core Web Vitals, mobile-network, or long-session memory measurement was available. |
| Maintainability | 8.5/10 | Existing architecture was preserved, shared media/escaping/normalization helpers are present, dependency versions are pinned for Vercel compatibility, validation rules are documented, and the production evidence ledger is maintained. | `netlify.toml` is legacy and unused; the hardcoded YouTube key fallback and dependency deprecation warning remain maintenance debt. |
| Operability and deployment | 8.5/10 | Vercel production deployment reached READY, custom domains and Firebase Auth domain were verified, local startup/build/lint/syntax checks passed, API contracts were replayed, runtime errors were absent, and cache markers were verified. | Real Gmail E2E, Android hardware validation, and a production rollback drill were not available in this environment. |

**Average rating:** 8.0/10. **Next best action:** improve playback resolver timeout/retry UX, then validate it with a controlled upstream-failure test and a fresh production browser session.

## [BRAINSTORM]

The highest-value deferred improvement is a **playback resolver recovery affordance**. In the normal-user session, `Menyiapkan lagu...` recovered successfully, so this is not a confirmed defect in v81. It is nevertheless the most credible friction point because playback depends on an external resolver and the current state can leave the user uncertain during a slow or failed response.

The smallest experiment is to add a bounded client timeout around the resolver request, preserve the current track and queue, replace the indefinite loading label with `Gagal menyiapkan lagu`, and expose a `Coba lagi` action that retries once with backoff. Acceptance criteria are that success still reaches the existing playing/paused state, timeout produces an actionable message within the defined limit, retry does not duplicate queue entries or playback events, and navigating to another track cancels the obsolete request. The success metric is a reduction in unresolved loading states during a controlled timeout test, with no increase in duplicate resolver requests or queue regressions.

This is classified as **near-term**, not part of the current sign-off. It should start a new baseline and verification loop after explicit implementation approval. No new production code is included in this documentation-only completion.

## [FINAL SIGN-OFF]

**Project and release:** MalaMusic, `DaffaHeroik/MalaMusic`, commit `319c079` with v81 live at `https://music.malawalipayment.web.id`. This sign-off covers the production code at that commit plus the final documentation update that follows. The service worker is `malamusic-static-v81`; no asset-version bump is needed for this documentation-only commit.

**Journey and persona coverage:** Eight primary product sessions are documented across the full loop: anonymous Home/Search, normal-user playback and queue/context actions, API contract QA, Offline empty-state behavior, adversarial Listen Together auth boundary, protected profile/library/stats data boundaries, and operator build/startup/deployment checks. The post-deployment v81 verification then added three consecutive clean sessions using distinct modes: Anonymous User, Normal User, and Adversarial User. The final-gate diagnosis is evidence-only and is not counted as a product session.

| Area | Final result |
|---|---|
| Core browsing and playback | PASS in direct v81 browser smoke; Search results, play route, mini-player, and resolver recovery observed. |
| Authentication and authorization | PASS for Gmail-only validation and unauthenticated protected-route boundaries; real Gmail E2E remains a limitation. |
| Social Listen Together boundary | PASS for unauthenticated room-creation rejection and recovery; two authenticated browser synchronization remains unverified. |
| Offline and library surfaces | PASS for route/empty-state behavior and local-first collection behavior; installed-PWA binary download/offline playback was not executed. |
| API and data contracts | PASS for the tested validation, status, auth, and public snapshot boundaries. |
| Security and dependencies | PASS for the performed scans and safe error handling, with documented credential/configuration residuals. |
| Deployment and operations | PASS for READY production deployment, custom-domain smoke, cache alignment, local startup/build/lint/syntax, audit, and zero recent Vercel runtime errors. |

**Issue ledger summary:** `SEC-001` is **FIXED** in `api/email-auth.js`; generic unexpected auth failures now return a safe static message. `REG-001` is **FIXED** in `public/sw.js`; the cache namespace now matches v81 precache URLs. `BUG-001` is **INFO / by-design**: liked songs are intentionally local-first, so a persisted local liked count can remain visible while the server-authenticated Profile wall is signed out; it is not evidence that the backend session is authenticated. The final three v81 sessions produced no new blocker, P0/P1 issue, security risk, regression, or in-scope quality defect.

**Automated and operational checks:** all modified JavaScript files passed `node --check`; `git diff --check` passed; `npm audit --omit=dev --audit-level=moderate` reported 0 vulnerabilities; lint, build, local startup, API contract checks, production smoke, cache-version checks, unsafe-pattern scans, and recent Vercel runtime-error checks passed. The final clean-worktree gate will be rerun after this documentation commit.

**Residual risks and limitations:** the Cloudflare Global API Key previously exposed in the conversation must be revoked and replaced; its value is intentionally not repeated here. The `YOUTUBE_MUSIC_API_KEY` fallback remains hardcoded in `api/album.js`, `api/artist.js`, and `api/lyrics1.js` and should be migrated to Vercel environment configuration. `netlify.toml` remains as harmless legacy configuration. A disposable real Gmail account was not used for full registration/login/password-reset/email-verification E2E; Android hardware, screen-reader, two-account Listen Together synchronization, installed-PWA download/playback, load testing, and rollback drills were also unavailable. These limitations prevent an unconditional PASS but do not invalidate the tested v81 release.

**Status: CONDITIONAL PASS.** The three-clean-session stop condition and relevant automated gates are satisfied, and the remaining risks are documented, bounded, and either operational follow-up or unavailable-environment validation. Before the next code deployment, rotate the exposed Cloudflare credential, confirm `SESSION_SECRET` and `YOUTUBE_MUSIC_API_KEY` are configured in Vercel, and obtain approval for the resolver timeout/retry improvement.
