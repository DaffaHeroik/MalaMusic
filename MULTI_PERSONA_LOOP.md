# MalaMusic — Multi-Persona Product Loop

## [ORIENT]

**Project:** `/home/ubuntu/MalaMusic`, live at [`https://music.malawalipayment.web.id`](https://music.malawalipayment.web.id).

**User goal:** Maintain a permanent Spotify-styled web player with Gmail-only Firebase authentication, synchronized library/profile/settings, Listen Together, Offline Mode, and reliable Android/PC behavior.

**Scope:** First impression and onboarding; Home, search, player/queue, library/liked/offline, profile/auth, leaderboard/streak, Listen Together, refresh/back/offline recovery, responsive layout, accessibility basics, API validation/error behavior, auth/session/privacy boundaries, and operator documentation.

**Environment:** Ubuntu 24.04 sandbox for repository checks; live Vercel production deployment; Chromium sandbox browser for rendered UI; production custom domain; synthetic or unauthenticated data only unless an explicit safe test account is available.

**Baseline commands and results:**

| Check | Result |
|---|---|
| `git status --short` | Clean at commit `b8924f5`. |
| `node --check` over `server.js`, `api/*.js`, and `public/*.js` | Passed. |
| `npm audit --omit=dev --audit-level=moderate` | `0 vulnerabilities`. |
| Live HTML smoke test | `firebase.js?v=79` and `sw.js?v=79` present. |
| Live service worker request | HTTP 200. |
| Package tests | No dedicated test script exists; only `lint`, `build`, `dev`, and `start` are defined. |

**Known constraints:** Real Gmail registration, password reset email, Google popup authentication, private user data, and multi-user Listen Together cannot be fully exercised without a safe test account/session. No destructive requests, external messages, purchases, or secret changes will be performed.

**Selected personas:** Beginner, normal user, rushed/frustrated user, adversarial user, UX/accessibility reviewer, QA/contract tester, security/privacy reviewer, and operator/owner. All are relevant because MalaMusic handles authentication, personal music activity, social presence, and offline storage.

**Stop condition:** Three clean user/reviewer sessions in a row using at least three distinct personas, with relevant automated checks passing. Any new P0/P1, security/privacy issue, regression, or in-scope quality blocker resets the clean counter.

## Issue Ledger

| ID | Type | Severity | Confidence | Summary | Status |
|---|---|---:|---:|---|---|
| — | — | — | — | No new issue has been confirmed during orientation. | OPEN FOR PERSONA SESSIONS |

## Session Index

| Session | Persona/reviewer | Focus | Result |
|---|---|---|---|
| 1 | Beginner | First impression, onboarding, navigation discoverability | Pending |
| 2 | Normal user | Home, search, playback, queue, library | Pending |
| 3 | Rushed/frustrated user | Double actions, refresh, retry, loading, offline | Pending |
| 4 | Adversarial user | Validation, malformed inputs, boundaries | Pending |
| 5 | UX/accessibility reviewer | Responsive, keyboard, labels, focus, contrast | Pending |
| 6 | QA/contract tester | API schemas, status codes, persistence, regression | Pending |
| 7 | Security/privacy reviewer | Auth, authorization, exposure, abuse cases | Pending |
| 8 | Operator/owner | Install, config, deploy, observability, recovery | Pending |

## [USER: Beginner / SESSION 1]

**Goal:** Understand what to do first, open authentication, and identify whether the product explains its primary value without internal knowledge.

**Scenario:** Opened the live Home page with a fresh query, inspected the visible navigation and content, then clicked the visible `Login` action.

**Environment/evidence:** Chromium sandbox; `https://music.malawalipayment.web.id/?mp_persona=beginner-1`; desktop viewport approximately 894×768; screenshots saved by the browser at `/home/ubuntu/screenshots/music_malawalipaymen_2026-08-17_17-30-32_9939.webp` and `/home/ubuntu/screenshots/music_malawalipaymen_2026-08-17_17-30-39_7017.webp`.

### Successful observations

The Home page exposes a recognizable music-player structure: category chips, Listening Streak, Recently Played, Quick Picks, Popular Playlists, Top Artists, and a persistent navigation grouping for music, collection, social, and profile. The login action moved to a dedicated Profile view rather than presenting an unexplained modal. The authentication card clearly separates Google from Gmail options and explicitly states that only `@gmail.com` addresses are accepted. The profile view also exposes streak, listening hours, public playlist, collection, and settings-related entry points.

### Findings

No confirmed blocker or P1 issue was observed in this session. The initial Home page contains useful content and the onboarding copy is understandable in Indonesian. A follow-up normal-user session must test whether the visible song cards and controls actually work end-to-end rather than only rendering correctly.

### Session summary

- **New issues:** none confirmed.
- **Previously fixed issues verified:** hierarchical Login/Daftar flow is visible; Gmail-only restriction is visible; profile sections are present.
- **Clean session:** yes, provisional pending broader core-journey coverage.
- **Unverified assumptions:** real Gmail registration, Google popup, password reset, and authenticated state require a safe test account.

## Issue Ledger Update

| ID | Type | Severity | Confidence | Summary | Status |
|---|---|---:|---:|---|---|
| — | — | — | — | No new issue confirmed in Session 1. | PROVISIONALLY CLEAN |

## [USER: Normal / SESSION 2 — in progress]

**Goal:** Find a song and move toward playback through the normal search journey.

**Scenario so far:** Opened Home with a fresh query and clicked the top `Cari` control.

**Evidence:** `https://music.malawalipayment.web.id/?mp_persona=normal-2`; browser screenshot `/home/ubuntu/screenshots/music_malawalipaymen_2026-08-17_17-31-07_1186.webp`.

### Successful observations so far

The Search page exposes a clearly labeled input with placeholder `Cari lagu, artis, atau album...`, a visible Cari button, and preloaded sections such as Rilis Anyar, Barat Top, and Rapp Top. Main navigation remains available. No defect is confirmed yet; the next step is to submit a normal query and inspect result/playback behavior.

## [USER: Normal / SESSION 2 — completed]

### Successful observations

Submitting `Tulus` navigated to `/search/Tulus`. The result page eventually populated autocomplete suggestions, filters for Musik/Playlist/Artis, and a long list of song rows with play controls and Opsi lagu buttons. The initial post-submit view was temporarily empty before the later browser view showed results, so the journey has a visible loading interval but did not remain empty.

### Findings

No confirmed blocker. The temporary blank result area is a **candidate UX observation** only: loading feedback should be checked in a slower-network or repeated-submit session before filing as a defect.

### Session summary

- **New issues:** none confirmed.
- **Previously fixed issues verified:** search route works; results and navigation remain available.
- **Clean session:** yes, with loading behavior noted for the rushed-user session.
- **Unverified assumptions:** actual audio playback, queue persistence, next/previous, and options menu still require a click on a result/play control.

### Playback observation

Clicking the first result navigated to `/play/5F28ye50-Kc` and created a mini-player with `Teh Hijau — Tulus`. The result row showed `DIJEDA`, while the mini-player status remained `Menyiapkan lagu...` after an additional browser wait. This is now a candidate P1/P2 playback-loading issue because the normal user cannot tell whether playback will start, fail, or require another action.

#### BUG-001 — Audio preparation remains indefinite after selecting a search result
- **Severity:** P1 provisional
- **Confidence:** medium
- **Location:** Search result click → `/play/5F28ye50-Kc`, mini-player
- **Steps:** 1. Open Search. 2. Search `Tulus`. 3. Click `Teh Hijau`. 4. Wait through a follow-up browser view.
- **Expected:** Audio starts or a clear actionable error/retry state appears within a bounded time.
- **Actual:** The song is selected and the mini-player is visible, but the status remains `Menyiapkan lagu...`; the row is `DIJEDA`.
- **Evidence:** Browser screenshots `/home/ubuntu/screenshots/music_malawalipayment_web_id_5F28ye50-Kc_1786987922520.webp` and prior play screenshot; extracted page text contains `Menyiapkan lagu...`.
- **User impact:** A normal user may conclude that playback is broken or wait indefinitely.
- **Suggested next action:** Reproduce with the audio resolver endpoint, inspect browser console/network errors, and add timeout plus actionable retry/fallback if confirmed.

### Playback verification update

The resolver endpoint returned HTTP 200 with an audio URL in approximately two seconds for the same video ID. Clicking the visible mini-player `Putar/Jeda` button then changed the control to a pause icon, and the `Menyiapkan lagu...` text disappeared. Therefore BUG-001 is **not confirmed as a playback failure**. The actual behavior is likely browser autoplay policy or an interaction-dependent play state. It remains a P2 UX candidate: after selecting a result, the UI briefly shows a spinner-like preparing state and does not make the required play interaction explicit. No code fix is authorized yet; verify with the rushed-user and mobile sessions before triage.

### Issue Ledger Update

| ID | Type | Severity | Confidence | Summary | Status |
|---|---|---:|---:|---|---|
| BUG-001 | UX candidate | P2 | medium | Selected result may remain in `Menyiapkan lagu...` until the user presses the mini-player play control. | UNCONFIRMED / VERIFY IN RUSHED + MOBILE |

## [USER: Rushed / SESSION 3 — in progress]

**Goal:** Exercise fast navigation and repeated actions without damaging state or creating duplicate requests.

**Scenario so far:** Opened Home with a fresh query, clicked Cari, and observed the Search page while its recent-search chips and content skeletons loaded.

**Evidence:** `https://music.malawalipayment.web.id/?mp_persona=rushed-3`; screenshot `/home/ubuntu/screenshots/music_malawalipaymen_2026-08-17_17-33-42_3646.webp`.

### Successful observations so far

The Search page retained navigation and showed recent-search chips (`Tulus`, `NIDJI`) while content skeletons were visible. No duplicate result or crash has been confirmed yet. The next action is to submit rapidly repeated input and then refresh during the result transition.

### Rapid-submit observation

Entering `Adele` and pressing Enter, followed immediately by another Enter, kept a single `/search/Adele` route and did not visibly duplicate the page or crash. The result area briefly showed only the Musik/Playlist/Artis filters with no rows while loading. This is not yet a confirmed bug; a follow-up wait and refresh will determine whether the loading state recovers and whether duplicate requests have a user-visible effect.

### Refresh observation

After Adele results had populated, navigating to `/search/Adele?mp_refresh=1` displayed the application shell/loading state and did not immediately show the Adele query or result rows in the extracted page. The screenshot showed skeleton placeholders and `Menyiapkan musikmu`. This may be normal app bootstrap, but it is a stronger P2 candidate because a user refreshing a valid search route may briefly lose the search context. A follow-up browser wait is required before classifying it as a defect.

### Rushed session conclusion

After the refresh bootstrap completed, `/search/Adele` restored the Adele query and a full result list with primary navigation intact. The rapid double-submit produced one route and no visible duplicate results. The temporary blank/skeleton period is a loading characteristic, not yet a confirmed defect. Session 3 is provisionally clean, with the existing P2 candidate limited to whether loading feedback is sufficiently explicit on slow devices.

## [USER: Rushed / SESSION 3 — completed]

- **New issues:** none confirmed.
- **Previously fixed issues verified:** search route recovery and navigation persistence after refresh.
- **Clean session:** yes, provisional.
- **Unverified assumptions:** offline transition and mobile tap behavior require separate checks.

## [USER: UX/Accessibility Reviewer / SESSION 4 — in progress]

**Goal:** Test keyboard navigation, focus order, semantic labels, and visual contrast.

**Scenario so far:** From the loaded `/search/Adele` page, pressed `Tab` to observe focus progression.

**Evidence:** Browser screenshot `/home/ubuntu/screenshots/music_malawalipaymen_2026-08-17_17-35-38_8321.webp`.

### Findings

Pressing `Tab` from the search input moved focus to the `Cari` button, then jumped directly to the main sidebar navigation (`Beranda`, `Cari`, etc.), completely skipping the `Musik/Playlist/Artis` filter chips and all song result rows. This means a keyboard-only user cannot select or play a song from search results.

#### ACCESS-001 — Search results and filters are unreachable via keyboard navigation
- **Severity:** P2 (accessibility blocker for keyboard users)
- **Confidence:** high
- **Location:** Search results page (`/search/*`)
- **Steps:** 1. Search for a term. 2. Press Tab repeatedly.
- **Expected:** Focus moves sequentially through filter chips and result rows before or after the sidebar.
- **Actual:** Focus skips the main content area entirely and goes to the sidebar.
- **Evidence:** Browser screenshot shows focus indicator on the sidebar `Beranda` button immediately after the search bar.
- **User impact:** Keyboard-only or screen-reader users cannot play searched songs.
- **Suggested next action:** Inspect `tabindex` and semantic button usage in `search.js` result rendering.

## [REVIEWER: QA / Security-Privacy / SESSION 5 — in progress]

Safe non-destructive API probes against production produced the following contract evidence:

| Probe | Result | Assessment |
|---|---|---|
| `GET /api/search?q=` | HTTP 400 with `Parameter query diperlukan` | Good validation and actionable schema. |
| `POST /api/ytplay` with `not-a-youtube-url` | HTTP 400 with `Hanya URL atau ID YouTube yang didukung.` | Good boundary rejection; no stack trace exposed. |
| `GET /api/stats?action=leaderboard` without user/session | HTTP 200 with empty public leaderboard snapshot | Public read behavior appears intentional; requires source review to confirm privacy scope. |
| Register with `notgmail@example.com` and one-character password | HTTP 400 with Gmail-only message | Gmail boundary is enforced before password processing; no account mutation occurred. |

No new P0/P1 security issue is confirmed from these probes. The remaining major confirmed issue is ACCESS-001, which requires a minimal frontend accessibility fix and independent keyboard verification.

## Developer Fix — ACCESS-001

The recommended minimal design was implemented in `public/search.js`. Filter tabs now expose `type="button"`, `aria-pressed`, and visible keyboard focus rings. Each song result retains its existing visual row and mouse/touch behavior but now contains a native primary play button with an escaped accessible label, keyboard activation, and visible `focus-visible` styling. The separate `Opsi lagu` control remains outside the primary button, avoiding nested interactive elements.

The cache-busting version was incremented from v79 to v80 in `public/index.html` and `public/sw.js`; the static service-worker cache is now `malamusic-static-v80`. `node --check public/search.js` and `git diff --check` passed, and all 17 index asset markers plus all 16 service-worker precache markers point to v80.

The next phase is production deployment followed by keyboard and mouse re-testing of Search, filters, result activation, and Opsi lagu.
