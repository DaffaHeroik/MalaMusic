# MalaMusic Review Changelog

## Review batch 1 — 2026-08-18

This batch addresses the first classified critical and warning findings from the production-readiness review.

| Area | Change | Validation |
|---|---|---|
| Email authentication | Removed the duplicate rate-limit branch and removed the server-side Firebase Web API key fallback. | `node --check api/email-auth.js` |
| Audio proxy | Replaced `app._router.handle` redirect recursion with a validated HTTPS media-host allowlist and one-hop redirect limit. Error responses no longer echo upstream exception text. | `node --check server.js` |
| YouTube metadata | Moved the YouTube Music client key in album, artist, and lyrics endpoints to `YOUTUBE_MUSIC_API_KEY`. | `node --check api/album.js api/artist.js api/lyrics1.js` |
| Firebase Admin dependencies | Upgraded `firebase-admin` to `14.2.0` and added a `uuid >= 11.1.1` npm override. | `npm audit --omit=dev --audit-level=moderate` reports 0 vulnerabilities. |
| Runtime memory | Added selective rate-bucket eviction and bounded audio URL cache pruning in `ytplay.js`. | `node --check api/ytplay.js` |
| Session security | Made library session verification fail closed when `SESSION_SECRET` is missing. | `node --check api/library.js` |
| Statistics worker | Required a non-empty `MALAMUSIC_INTERNAL_SECRET` and validated public playlist IDs and read methods. | `node --check api/stats.js` |
| Error handling | Replaced raw exception messages in lyrics, search, and transcription responses with generic client messages and server-side logs. | `node --check` checks passed. |
| Reflected metadata | Escaped dynamic share-page metadata and restricted injected share images to HTTPS URLs. | `node --check server.js` |
| Deployment/cache | Removed obsolete Firebase proxy routes, documented environment variables, updated README, and bumped frontend/service-worker assets from v78 to v79. | `git diff --check` passed. |

## Pending verification

Production deployment and browser verification remain necessary after commit. The `YOUTUBE_MUSIC_API_KEY`, `FIREBASE_WEB_API_KEY`, `SESSION_SECRET`, Firebase Admin credentials, `MALAMUSIC_INTERNAL_SECRET`, and `CRON_SECRET` values must be present in the Vercel environment before publishing v79.
