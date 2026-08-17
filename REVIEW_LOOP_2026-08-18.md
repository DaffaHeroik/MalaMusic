# MalaMusic Review, Multi-Persona Loop, and Brainstorming Report

**Date:** 2026-08-18

**Project:** MalaMusic, GitHub repository `DaffaHeroik/MalaMusic`

**Production:** `https://music.malawalipayment.web.id`

**Review commit:** `26c7670 fix: harden upstream error and TLS handling`

**Deployment:** Vercel production deployment `dpl_64g5ZPZy99EBtN9KJTwKQddb4onT`, state `READY`, alias `music.malawalipayment.web.id`

## Executive Summary

MalaMusic completed a new full review loop across repository orientation, static security and quality scanning, direct API checks, production browser journeys, Vercel deployment verification, and evidence-based brainstorming. The review found no Critical issue. It found two Warning root causes: upstream exception details were still exposed by several API handlers, and selected upstream HTTPS requests disabled certificate validation. Both were fixed with minimal changes, validated locally, committed, pushed, deployed, and replayed in production.

The production build remained healthy after the patch. The three required consecutive clean scans passed, the fresh browser sessions for Home, Search, playback, Profile/auth validation, Offline, and Listen Together passed their tested journeys, Vercel reported no runtime errors in the final 30-minute window, and the browser console had no output during the final session. Status is **CONDITIONAL PASS**, because real Gmail E2E, two-account Listen Together synchronization, installed-PWA offline binary playback, Android hardware, screen-reader, load, and rollback testing were unavailable in this environment.

## [ORIENT]

The project uses a vanilla JavaScript PWA frontend with Firebase compat SDK and Tailwind CDN, an Express backend deployed through Vercel, Firebase Auth and Realtime Database, a Cloudflare statistics worker, and a service worker using the aligned `malamusic-static-v81` cache. The main authentication flow is Firebase Google Sign-In plus Gmail-only email/password registration and login. The legacy `/api/google-auth` route remains mounted but is optional and returns a safe 503 when its separate OAuth environment variables are not configured.

The review covered the repository map, entry points, API handlers, frontend modules, service worker, environment contract, Vercel configuration, legacy Netlify configuration, prior review reports, current deployment, API boundaries, and user journeys. The review used the following personas: beginner user, normal user, adversarial user, UX/accessibility observer, QA/contract tester, security/privacy reviewer, and operator/release reviewer.

## [REVIEWER: STATIC AND SECURITY SCAN]

The initial deterministic scan covered 39 review-relevant files. JavaScript syntax was valid. `npm audit --omit=dev --audit-level=moderate` reported 0 vulnerabilities. The browser Firebase API key was the only key-shaped value found and is expected public client configuration; no private key, Cloudflare Global API Key, or server secret was found in the scanned source. Cache markers were consistent: `public/index.html` contained 17 v81 references, `public/sw.js` contained 16 v81 references, and neither contained v80 references.

The scan also found no unsafe `app._router.handle` usage and no wildcard CORS configuration. Same-origin external API requests were rejected with HTTP 403. Server logs continue to contain diagnostic error output, but client responses were audited separately and hardened to avoid returning those details.

| Finding | Severity | Root cause | Status |
|---|---|---|---|
| `SEC-001` | Warning | Generic email-auth fallback previously returned an unexpected upstream exception message. | Fixed in an earlier release and reverified. |
| `REG-001` | Warning | Service-worker cache namespace lagged behind v81 asset URLs. | Fixed in `319c079` and reverified. |
| `SEC-002` | Warning | `api/google-auth.js`, `api/album.js`, `api/artist.js`, `api/lyrics.js`, `api/suggest.js`, and `api/translate.js` returned dynamic upstream exception text in generic error responses. | Fixed in `26c7670`; static response audit and production validation passed. |
| `SEC-003` | Warning | `rejectUnauthorized: false` disabled standard TLS certificate validation in artist, lyrics, and suggestion upstream requests. | Removed in `26c7670`; residual TLS-disable scan passed. |
| `DOC-001` | Info | `REVIEW_MAP.md` contained a stale Git-state appendix. | Corrected in the final documentation update. |
| `BUG-001` | Info/by-design | Local-first liked state can remain visible while the server-authenticated Profile wall is signed out. | Retained as documented behavior; not a backend auth inconsistency. |

## [USER: Beginner / SESSION 1]

A fresh production browser session transitioned from the splash screen to Home. Anonymous users saw explicit `Login untuk mulai menjaga streak` copy. Recently Played, Quick Picks, Popular Playlists, Top Artists, category chips, and primary navigation rendered. The cover images filled their card containers and the dark Spotify-style hierarchy remained visually coherent at the available viewport. No startup or route error was observed.

## [USER: Normal / SESSION 2]

The normal user opened Search, submitted `Adele` with Enter, and received suggestions, Musik/Playlist/Artis filters, and a populated result list. Result buttons exposed labels such as `Putar Someone Like You oleh Adele`, and separate `Opsi lagu` controls were present. The first result opened `/play/UQ8cXH7qbVU`; `Menyiapkan lagu...` recovered to `Dijeda`, with the result row and mini-player remaining visible.

A stale browser element index opened Leaderboard during two attempts. Leaderboard rendered normally and the Search control recovered the journey immediately. This was classified as automation index drift, not a product issue.

## [USER: Adversarial / SESSION 3]

Listen Together opened from the playback route. Attempting `Buat Room dari Lagu Sekarang` without an authenticated session produced `Login diperlukan untuk Listen Together.` The modal remained open, the button returned to its normal label, and no room was created. This verified both the server-side boundary and the recovery state.

## [USER: Signed-out Auth and Offline / SESSION 4]

Profile presented Google Sign-In, Masuk, Buat akun, and Lupa password controls, with explicit `@gmail.com` restriction text. The registration screen contained an optional display name, Gmail email field, minimum-eight-character password guidance, and a single submit action. Synthetic invalid input `test@example.com` with `short` was rejected with `Gunakan alamat Gmail yang valid (@gmail.com).` No account or email was created.

Offline Mode displayed Online status, device storage usage, `Belum Ada Lagu Offline`, and clear instructions to use the Download icon in the player. No persistent audio download was initiated because the review browser was not an installed PWA.

## [QA: API AND DEPLOYMENT CONTRACTS]

Safe production requests after deployment returned the expected contracts. `/api/email-auth?action=me` returned unauthenticated JSON. Protected library, profile, Listen Together state, and statistics actions returned HTTP 401 with concise login-required messages. Empty album, artist, suggestions, lyrics, and translation requests returned HTTP 400 validation responses. The legacy Google OAuth route returned HTTP 503 with a safe configuration message because its optional OAuth environment variables are not configured. An external Origin request returned HTTP 403.

The Vercel deployment for `26c7670` reached `READY`. Production HTML still served `firebase.js?v=81` and `sw.js?v=81`; the service worker declared `malamusic-static-v81`. Vercel runtime monitoring reported no errors in the final 30-minute window. The final browser console check returned no console output.

## [DEV: FIX BATCH 2]

The fixes were intentionally small and preserved the existing architecture. The legacy Google OAuth session-refresh path now logs the detailed failure server-side and returns `Sesi Google tidak valid.` The album, artist, lyrics, suggestions, and translation handlers now log diagnostic details server-side and return stable generic 502 messages. Standard TLS certificate validation is enabled for artist, lyrics, and suggestion upstream HTTPS requests. The review changelog records each change.

All modified files passed `node --check`. `npm run lint`, `npm run build`, `git diff --check`, and `npm audit --omit=dev --audit-level=moderate` passed before commit. The changes were pushed to `origin/main`, and Vercel deployed them to production.

## [VERIFY: THREE CLEAN SCANS]

Three consecutive clean scans were executed after deployment. Each scan checked every `server.js`, `api/*.js`, and `public/*.js` file with `node --check`; ran the dependency audit; ran `git diff --check`; rejected dynamic client-facing exception patterns; rejected disabled TLS verification; checked v81/v80 cache counts; and required a clean worktree. All three passed.

| Scan | Result |
|---:|---|
| 1 | `CLEAN_SCAN_1_PASS` |
| 2 | `CLEAN_SCAN_2_PASS` |
| 3 | `CLEAN_SCAN_3_PASS` |
| Stop condition | `THREE_CONSECUTIVE_CLEAN_SCANS_PASS` |

## [QUALITY RATINGS]

| Dimension | Rating | Evidence-based limitation |
|---|---:|---|
| Functional correctness | 8.7/10 | Real Gmail authentication, two-account social synchronization, and installed-PWA audio playback were unavailable. |
| UX and accessibility | 8.1/10 | Search result labels, auth copy, error recovery, responsive browser rendering, and visual hierarchy passed; Android hardware, screen-reader, and exhaustive keyboard testing were unavailable. |
| Reliability | 8.3/10 | Resolver recovery, protected social recovery, local startup, deployment, and runtime monitoring passed; controlled upstream timeout/retry measurement remains open. |
| Security and privacy | 8.8/10 | Auth boundaries, same-origin CORS, rate limits, safe error responses, TLS verification, and dependency audit passed; previously exposed credential rotation remains an operational responsibility. |
| Performance | 8.0/10 | Cache alignment and bounded request behavior passed; no Core Web Vitals, load, memory, or poor-network measurements were available. |
| Maintainability | 8.6/10 | Minimal patches, changelog, environment contract, compatibility pinning, and review map are maintained; legacy Netlify config remains cleanup debt. |
| Operability and deployment | 8.7/10 | Vercel READY deployment, custom-domain smoke, runtime monitoring, local build, and clean-worktree gate passed; rollback drill was not executed. |

**Average:** 8.46/10. **Overall status:** `CONDITIONAL PASS`.

## [BRAINSTORM]

The strongest evidence-backed next improvement is playback resolver recovery. The current normal-user flow recovers successfully, but it exposes an uncertain `Menyiapkan lagu...` state while depending on an external resolver. Three approaches are reasonable.

| Approach | Benefit | Cost and risk | Recommendation |
|---|---|---|---|
| A. Client-only timeout plus `Coba lagi` | Smallest change; preserves current backend and queue model. | Requires careful cancellation to avoid duplicate resolver requests. | Recommended first experiment. |
| B. Server resolver retry and circuit breaker | Better upstream resilience and centralized observability. | More server state, tuning, and risk of increased upstream load. | Consider after measuring real timeout patterns. |
| C. Pre-resolve adjacent queue items | Reduces perceived wait on Next/Previous. | Uses more bandwidth and may prefetch unnecessary or restricted media. | Strategic option after privacy, quota, and storage measurement. |

The smallest recommended experiment is Approach A: add a bounded client timeout, preserve the selected track and queue, show `Gagal menyiapkan lagu` with `Coba lagi`, cancel obsolete requests when the user changes tracks, and ensure retry does not duplicate queue entries or listening events. Success should be measured by zero indefinite loading states in a controlled timeout test, no duplicate resolver calls, and no queue reset regression. This is a **near-term backlog item**, not part of this implementation.

Additional deferred items include real Gmail/password-reset/verification E2E with a disposable test account, two-browser authenticated Listen Together synchronization, installed-PWA offline download/playback, Android and screen-reader review, removal of unused `netlify.toml`, and a rollback drill. No new feature should be implemented until the user approves the selected experiment and a new baseline is recorded.

## [FINAL SIGN-OFF]

The review loop is complete with no open Critical or Warning findings from this pass, three consecutive clean scans, successful post-deployment browser verification, and no recent Vercel runtime errors. The release is **CONDITIONALLY PASSABLE for continued production use within the tested scope**.

Residual operational risks remain. The Cloudflare Global API Key previously exposed in the conversation must be revoked and replaced; its value is intentionally not repeated. `SESSION_SECRET`, `YOUTUBE_MUSIC_API_KEY`, Firebase Admin credentials, `MALAMUSIC_INTERNAL_SECRET`, and `CRON_SECRET` must remain configured through Vercel environment variables. The browser Firebase API key is public client configuration and should continue to be protected with Firebase project restrictions. Real Gmail authentication, Android/PWA offline behavior, two-account social synchronization, load testing, and rollback remain unavailable checks rather than inferred passes.

## Evidence Files

The detailed browser evidence is stored under `/tmp/malamusic-*2026-08-18.txt`, the three-scan output is `/tmp/malamusic-three-clean-scans.txt`, the API response audit is `/tmp/malamusic-response-lines-2.txt`, and the repository changelog is [`CHANGELOG_REVIEW.md`](CHANGELOG_REVIEW.md). The production application is available at [`music.malawalipayment.web.id`](https://music.malawalipayment.web.id).
