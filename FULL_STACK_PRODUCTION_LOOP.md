# Full-Stack Production Loop Evidence Log

## [ORIENT]

**Project:** MalaMusic, `/home/ubuntu/MalaMusic`, GitHub `DaffaHeroik/MalaMusic`.

**Goal:** Run a complete production loop across the permanent Spotify-style web player, Firebase Gmail-only authentication, profile/library synchronization, Search/playback, Offline Mode, Listen Together, statistics/streak features, backend APIs, security, operations, and deployment.

**Current source:** `a54ea99 docs: finalize multi-persona product review`; worktree clean and synchronized with `origin/main` at baseline.

**Stack:** Vanilla JavaScript frontend with Tailwind CDN and Firebase compat SDK 12.1.0; Express 5.2.1 backend deployed through Vercel; Firebase Admin 13.6.0; Firebase Realtime Database; Cloudflare statistics worker; service worker cache v80; custom domain `music.malawalipayment.web.id` and Firebase Auth domain `auth.music.malawalipayment.web.id`.

**Baseline commands and results:**

| Check | Evidence | Result |
|---|---|---|
| Repository status | `git status --short --branch` | PASS; `main` clean and aligned with `origin/main` |
| Recent history | `git log -5 --oneline` | PASS; accessibility patch and review reports present |
| Package scripts/config | `package.json` inspection | PASS; `lint`, `dev`, `build`, and `start` are defined |
| Dependency audit | `npm audit --omit=dev --audit-level=moderate` | PASS; 0 vulnerabilities |
| JavaScript syntax | `node --check` over `api/*.js`, `server.js`, `public/*.js` | PASS |
| Production HTML | `curl` custom domain | PASS; `/firebase.js?v=80` and `/sw.js?v=80` served |
| Service worker | `curl https://music.../sw.js?v=80` | PASS; `malamusic-static-v80` and `/search.js?v=80` served |

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

## [BUG-001] Auth state and Profile collection state are inconsistent

**Severity:** P1 candidate; **confidence:** high.

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
