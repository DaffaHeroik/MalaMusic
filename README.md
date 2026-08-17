# MalaMusic

MalaMusic is a permanent Spotify-style web music player backed by YouTube Music metadata and audio-resolution services. The frontend is a cache-busted vanilla JavaScript PWA, while the backend is an Express application deployed through Vercel serverless functions.

## Current architecture

| Area | Implementation |
|---|---|
| Frontend | `public/` with vanilla JavaScript, Tailwind CDN, Firebase Web SDK, and PWA service worker |
| Backend | Express 5 entry point in `server.js`, exposed through `api/index.js` on Vercel |
| Authentication | Firebase Auth with Google Sign-In and Gmail-only email/password registration/login |
| Session | Signed, HttpOnly, Secure `mm_session` cookie using `SESSION_SECRET` |
| Database | Firebase Realtime Database through Firebase Admin SDK |
| Social playback | Listen Together rooms with host-authoritative queue and playback state |
| Offline | Service-worker shell cache plus browser-managed offline audio storage |
| Statistics | Cloudflare Worker integration for listening time, streaks, leaderboard, and public playlists |
| Production URL | [`https://music.malawalipayment.web.id`](https://music.malawalipayment.web.id) |
| Firebase Auth domain | [`https://auth.music.malawalipayment.web.id`](https://auth.music.malawalipayment.web.id) |

The custom Firebase Auth domain is configured separately from the Vercel application domain. The browser Firebase configuration in `public/firebase.js` points to the custom domain, so users should not normally be redirected to `heroikzre.firebaseapp.com` during Google Sign-In.

## Repository structure

```text
public/          Browser application, PWA shell, service worker, and UI modules
api/             Express-compatible API handlers
server.js        Local Express server and Vercel request router
vercel.json      Vercel build and catch-all configuration
.env.example     Required production environment variable names
notes/           Deployment and verification notes
```

## Local development

Use Node.js 18 or newer. Install dependencies and run the Express server:

```bash
npm install
npm run dev
```

The local application is available at `http://localhost:3000`. Production-like behavior is served by the same `server.js` entry point used by the Vercel adapter.

Before committing changes, validate all modified JavaScript and whitespace:

```bash
node --check server.js
find api public -name '*.js' -print0 | xargs -0 -n1 node --check
git diff --check
npm audit --omit=dev --audit-level=moderate
```

## Vercel deployment

Connect the private GitHub repository to Vercel, select the project root as the deployment directory, and keep the existing `vercel.json`. The project does not require a frontend build step. Vercel routes all requests through `api/index.js`, which exports the Express application.

Set the variables listed in [`.env.example`](.env.example) in the Vercel project. Production authentication requires `SESSION_SECRET`, Firebase Admin credentials, and `FIREBASE_WEB_API_KEY`. Metadata endpoints for artists and albums additionally require `YOUTUBE_MUSIC_API_KEY`. Do not place service-account JSON, private keys, API tokens, or worker secrets in source files.

The browser Firebase Web API key in `public/firebase.js` is a public client configuration value and is protected by Firebase project restrictions. The backend does not use a source-code fallback; it requires the explicitly configured `FIREBASE_WEB_API_KEY` environment variable for password and verification-email calls.

## Authentication flow

MalaMusic supports two primary sign-in paths:

1. **Google Sign-In:** Firebase issues an ID token in the browser. The backend verifies that token with Firebase Admin, confirms the provider is `google.com`, enforces the `@gmail.com` restriction, and creates the signed session cookie.
2. **Gmail email/password:** The backend validates the Gmail address and password length, creates or signs in the Firebase user, sends verification or reset email messages through Firebase Auth, and creates the same signed session cookie.

Temporary or disposable email domains are not accepted because the backend only accepts addresses matching the Gmail domain rule. Authentication endpoints also enforce origin checks and per-action rate limits.

## API route groups

| Route | Purpose | Authentication |
|---|---|---|
| `/api/search`, `/api/suggest` | Search and suggestions | Public, upstream-limited |
| `/api/album`, `/api/artist`, `/api/lyrics1` | YouTube Music metadata and lyrics | Public, requires configured metadata key where applicable |
| `/api/ytplay` | Resolve an audio stream URL | Public, validated YouTube IDs and rate limited |
| `/api/proxy-audio` | Stream allowed HTTPS media hosts with range support | Public, host allowlist and one-hop redirect limit |
| `/api/email-auth` | Firebase email/password, Google session, verification, reset, logout, and session lookup | Action-dependent |
| `/api/profile` | Profile name and avatar synchronization | Signed session required |
| `/api/library` | Liked songs, artists, and playlist synchronization | Signed session required |
| `/api/streak` | Listening streak record and summary | Signed session required |
| `/api/stats` | Listening time, leaderboard, and public playlists | Action-dependent; writes require signed session or cron secret |
| `/api/listen-together` | Room creation, join, presence, and host commands | Signed session required |

The legacy `/api/google-auth` route remains isolated for historical YouTube OAuth experiments. It is not the primary MalaMusic login path and should only be enabled when its separate Google OAuth variables are intentionally configured.

## PWA, offline mode, and cache busting

The service worker caches the application shell and uses network-first behavior for navigation and JavaScript updates. Offline audio is stored by the browser after the user explicitly downloads a track or playlist. Since browsers enforce storage quotas and may evict data, the offline feature should be treated as device-local storage rather than a permanent cloud backup.

Every production frontend change must increment the asset version in `public/index.html` and `public/sw.js`. This prevents Android and desktop clients from retaining stale JavaScript after deployment. After publishing, verify the new version from an incognito window and from an existing installed PWA.

## Security and operations

Use a unique random `SESSION_SECRET` in every environment, rotate any credential that has ever been pasted into chat or committed to Git, and restrict Firebase and Cloudflare credentials to the smallest practical permissions. The repository ignores `.env` files, but ignored files are not a replacement for secret rotation.

The statistics rollover endpoint must be called by a trusted scheduler with `Authorization: Bearer $CRON_SECRET`. The internal worker secret must be non-empty in production; otherwise the worker integration should be considered unconfigured. Firebase Realtime Database rules must independently enforce the intended access policy because server-side validation is not a substitute for database rules.
