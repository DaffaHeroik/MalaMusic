# Multi-Persona Product Loop — Final Report

## [FINAL SIGN-OFF]

**Project:** MalaMusic (`/home/ubuntu/MalaMusic`), live at [music.malawalipayment.web.id](https://music.malawalipayment.web.id)

**Date:** 18 August 2026, UTC+8

**Environment:** Production Vercel deployment, Chromium browser in the sandbox, live Firebase-backed application, GitHub repository `DaffaHeroik/MalaMusic`, frontend asset version v80.

**Scope tested:** First impression and Gmail-only onboarding entry point, Search, result playback, loading/recovery, double-submit and refresh behavior, keyboard focus and activation, song context menu, Listen Together entry and invalid input, public API boundary behavior from the previous baseline, dependency/security regression checks, and production cache/deployment synchronization.

**Sessions:** Three initial user journeys, one developer diagnosis/fix session, three post-fix clean sessions, and one independent security/privacy review.

**Clean-session streak:** 3 consecutive clean sessions after the accessibility fix, using distinct reviewer/user perspectives.

### Executive summary

The multi-persona loop found one reproducible in-scope accessibility defect: Search result rows were visually clickable but did not expose a native keyboard-focusable primary playback control, and the filter state did not expose an explicit ARIA state. The minimal fix changed the primary playback area into a native button with an escaped accessible label, added visible keyboard focus styling, and added `aria-pressed` state to filters while preserving the separate song-options control. The patch was deployed as commit `e71cd54` with asset version v80 and verified in production. A controlled keyboard-equivalent activation opened a play route, selected the track, updated the active state, and rendered the mini-player. Mouse playback and the separate Opsi lagu menu remained functional.

The product then passed three consecutive clean post-fix sessions: accessibility re-test, social/frustrated invalid-input and context-menu re-test, and independent security/privacy regression review. The latest documentation commit `5b5b175` also reached Vercel `READY`. The result is a **CONDITIONAL PASS**, not an assertion that every feature is defect-free: full authenticated registration/login/logout, cross-device Listen Together synchronization, and real Android hardware behavior were not re-executed in this loop because they require credentials, multiple persistent sessions, or hardware unavailable in the current environment.

## [ORIENT]

The product goal is to provide a permanent Spotify-style web music player with Gmail-only Firebase authentication, synchronized collections and profile state, Listen Together social playback, offline mode, and responsive desktop/mobile interaction. The selected personas were a beginner, normal user, rushed/frustrated user, UX/accessibility reviewer, QA tester, social user, and security/privacy reviewer. The operational stop condition was three clean sessions after the last in-scope fix plus relevant automated checks.

The baseline repository and production checks were already available from the preceding production-review loop. The relevant automated baseline included JavaScript syntax validation, `git diff --check`, dependency auditing, production HTTP smoke tests, and cache marker verification. The project rules require an asset-version bump for frontend changes and browser verification after deployment; both were followed for the v80 accessibility patch.

## Journey and persona coverage

| Session | Persona/reviewer | Main scenario | New findings | Fixes verified | Clean |
|---|---|---|---:|---|---|
| 1 | Beginner | Open Home, choose Login, inspect Gmail-only entry flow | None | Existing hierarchical Login/Daftar flow observed | Yes |
| 2 | Normal user | Search `Tulus`, open a result, begin playback | None confirmed | Existing playback route and recovery behavior observed | Yes, with observation |
| 3 | Rushed/frustrated user | Double-submit `Adele`, refresh search, inspect recovery | None confirmed | URL and search context recovered after bootstrap | Yes, with observation |
| 4 | UX/accessibility reviewer | Keyboard focus order on Search | `ACCESS-001` | Diagnosed and fixed in `public/search.js` | No, issue found |
| 5 | Developer | Implement minimal native-button and ARIA fix, deploy v80 | None | `ACCESS-001` fixed; commit `e71cd54` | N/A |
| 6 | Accessibility/QA verifier | Fresh v80 Search, mouse playback, keyboard-equivalent result activation | None | `ACCESS-001` verified in production | Yes |
| 7 | Social/frustrated user | Open Listen Together, empty-code join, open Opsi lagu menu | None | Context menu and invalid-input boundary verified | Yes |
| 8 | Security/privacy reviewer | npm audit, syntax, server secret-pattern and unsafe-code scan | None | No new security or dependency issue | Yes |

## Issue ledger

| ID | Type | Severity | Summary | Status | Verification |
|---|---|---:|---|---|---|
| ACCESS-001 | ACCESS | P2 | Search result primary playback controls were not reliably keyboard-focusable or semantically exposed as native buttons; filter state lacked explicit ARIA state. | **FIXED** | Production v80 Search, fresh browser session, mouse click, and controlled keyboard-equivalent activation |

No P0/P1 blocker, security/privacy risk, production regression, or additional in-scope UX defect remained open after verification. The initial `Menyiapkan lagu...` state was observed during resolver startup, but the tested flow recovered to a stable selected/paused state and was not classified as a defect without a reproducible failure.

## [DEV: SESSION 1]

### ACCESS-001 — Make Search result playback keyboard accessible

**Root cause:** Search results used a clickable visual row with a non-semantic container and did not expose the primary playback action as a native focusable button. Filter state also relied on visual classes without a corresponding ARIA pressed state.

**Files changed:** `public/search.js`, `public/index.html`, `public/sw.js`, `MULTI_PERSONA_LOOP.md`, and the accessibility design note at `docs/plans/2026-08-18-search-keyboard-accessibility-design.md`.

**Minimal fix:** The primary playback area is now a native `button` with an escaped `aria-label`, `focus-visible` ring, and the existing playback handler. The Opsi lagu button remains a sibling rather than becoming a nested interactive element. Filters expose `aria-pressed` and a visible focus style. Asset and service-worker versions were bumped from v79 to v80.

**Validation:** `node --check public/search.js`, all-project JavaScript syntax checks, `git diff --check`, cache-marker assertions, production browser verification, and Vercel deployment status all passed.

**Status:** FIXED.

**Residual risk:** A full screen-reader audit and Android hardware test were not available in the current environment. The implementation uses native controls and accessible labels, but assistive-technology announcements should be included in a future device lab pass.

## [VERIFY: SESSIONS 1–3]

The accessibility verifier loaded the fresh v80 Search page and observed native buttons with labels such as `Putar Someone Like You oleh Adele`. Clicking `Easy On Me` still opened the play route and rendered the mini-player. A controlled result activation focused the first result and invoked the existing playback path; the browser reached `/play/UQ8cXH7qbVU`, selected `Someone Like You`, displayed `Dijeda`, changed the row to its active state, and rendered the mini-player. The separate Opsi lagu control opened its menu without navigating away or triggering a different track.

The social/frustrated session opened Listen Together, confirmed the modal’s create/join choices, and submitted an empty room code. The application returned the actionable message `Masukkan kode room.`, kept the modal open, and did not create a room. This test avoided persistent production side effects.

The security/privacy review returned `npm audit --omit=dev --audit-level=moderate` with zero vulnerabilities. All API, server, and public JavaScript files passed `node --check`. The allowlisted server scan found no internal Express router recursion, no server-side embedded Google API key, and no new secret fallback. The remaining matches were documented development-only or fail-closed guards and public Firebase client configuration.

## Production and automated checks

| Check | Command or method | Result | Limitation |
|---|---|---|---|
| Dependency audit | `npm audit --omit=dev --audit-level=moderate` | PASS — 0 vulnerabilities | Does not prove runtime behavior of every upstream service |
| JavaScript syntax | `node --check` over `api/*.js`, `server.js`, and `public/*.js` | PASS | No full browser test suite exists |
| Whitespace | `git diff --check` | PASS | None identified |
| Security pattern scan | Allowlisted server scan for internal-router recursion, server API keys, and unsafe secret fallbacks | PASS | Public Firebase configuration is intentionally client-visible |
| Production deployment | Vercel deployment `dpl_EzxxvMjJkHmDQchRNA3ot9XUtfd1`, commit `5b5b175` | READY | Deployment metadata does not replace browser testing |
| Production v80 smoke | HTTP fetch of HTML, `sw.js?v=80`, and `firebase.js?v=80` | PASS | API playback was tested interactively, not exhaustively |
| Browser Search re-test | Fresh production Chromium sessions | PASS | Full Android hardware and screen-reader testing unavailable |

## Residual risks and deferred work

The full Firebase authentication journey from Login/Daftar through registration, verification/reset, authenticated state, and logout was not repeated in this loop because it requires a test Gmail account and email interaction. The earlier production-review loop had already validated the authentication architecture and Gmail-only restriction, but this report does not claim a fresh end-to-end auth sign-off.

Cross-device Listen Together synchronization was not exercised with two simultaneously authenticated browser sessions. The empty-code validation and modal entry point passed, while room creation/join would create persistent state and should be tested next with two disposable test accounts and an explicit cleanup procedure.

The browser viewport was a desktop Chromium viewport. Responsive layout and Android behavior were not fully measured on physical hardware in this loop. A future device pass should test narrow widths, keyboard/virtual-keyboard resize, safe-area insets, media controls, and service-worker offline playback.

The initial loading state for audio resolution can remain visible while the upstream resolver works. It recovered during the tested flow, but resolver latency should be monitored with a product-level timeout metric and user-facing retry telemetry rather than treated as a proven defect from one session.

## [BRAINSTORM]

These are evidence-backed backlog ideas only; none were implemented as part of this loop.

| Priority | Idea | User value | Evidence | Effort | Risk/dependency | Success metric | Smallest experiment |
|---:|---|---|---|---|---|---|---|
| 1 | Add a visible resolver progress timeout with a Retry action | Reduces uncertainty when playback takes too long | Multiple sessions displayed `Menyiapkan lagu...` before interaction/recovery | S | Depends on resolver timing and audio state machine | Fewer abandoned playback attempts; measurable retry success | Instrument resolver duration and show Retry after a bounded threshold |
| 2 | Add an automated browser regression test for Search keyboard navigation | Prevents ACCESS-001-style regressions | Accessibility issue was found by manual tab audit | M | Requires browser test runner and stable fixtures | CI verifies filter → result → Opsi lagu focus order | Add one deterministic Search fixture and assert native button labels |
| 3 | Add disposable two-session Listen Together QA harness | Makes cross-device sync testable without production rooms | Full room synchronization was not safe to create manually in this loop | M | Requires test Firebase namespace or cleanup API | Host/listener state converges within the target drift threshold | Run two isolated browser contexts against a test room and delete it afterward |
| 4 | Add a compact mobile accessibility/device matrix | Protects the Android-focused requirement | Current loop used Chromium desktop only | M | Requires device/emulator availability | Critical flows pass at defined narrow widths and touch targets | Start with 360×800 emulation and Search/mini-player/Listen Together |
| 5 | Add authenticated test fixtures for Gmail-only flows | Enables repeatable registration/reset/logout verification | Auth E2E was deferred for credential and email reasons | M | Requires disposable Gmail/test mailbox and secret-safe setup | Auth journey passes in CI without real user data | Create a test-only Firebase tenant or emulator fixture |

## Decision

**Status: CONDITIONAL PASS.**

**Reason:** The only reproducible in-scope defect found by the loop was fixed and independently verified in production. Three distinct post-fix sessions were clean, automated dependency/syntax/security checks passed, and the final Vercel deployment is READY. The qualification is required because full authenticated E2E, two-session Listen Together synchronization, Android hardware behavior, and screen-reader testing were not available in this environment. No further code change is recommended until those deferred tests are run with disposable test fixtures.

## References

[1]: https://music.malawalipayment.web.id/ "MalaMusic production site"
[2]: https://github.com/DaffaHeroik/MalaMusic/commit/e71cd543bc7afca510ef429c79fb01e41162b5c0 "MalaMusic accessibility patch commit"
[3]: https://github.com/DaffaHeroik/MalaMusic/commit/5b5b175880b4c37b037d6746d3a5b28355ac9c0e "MalaMusic multi-persona evidence commit"
