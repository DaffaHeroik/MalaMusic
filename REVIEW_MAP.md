
## Stack
- Frontend: vanilla JavaScript, HTML, Tailwind CDN, Firebase compat SDK
- Backend: Node.js Express on Vercel
- Database/Auth: Firebase Realtime Database, Firebase Auth, Firebase Admin
- Deployment: Vercel with custom domain

## Entry points and configuration
./.gitignore
./AGENTS.md
./README.md
./package.json
./server.js
./vercel.json

## Frontend and service worker
./public/album.js
./public/app.js
./public/artist.js
./public/banner.png
./public/firebase.js
./public/fullplayer.js
./public/home.js
./public/index.html
./public/leaderboard.js
./public/library.js
./public/liked.js
./public/listen-together.js
./public/logo-mark.png
./public/logo.png
./public/manifest.json
./public/miniplayer.js
./public/player.js
./public/profile.js
./public/search.js
./public/stats.js
./public/streak.js
./public/sw.js

## API
./api/album.js
./api/artist.js
./api/email-auth.js
./api/firebase-admin.js
./api/google-auth.js
./api/index.js
./api/library.js
./api/listen-together.js
./api/lyrics.js
./api/lyrics1.js
./api/lyrics2.js
./api/profile.js
./api/search.js
./api/stats.js
./api/streak.js
./api/suggest.js
./api/transcribe.js
./api/translate.js
./api/ytplay.js

## Review notes
./notes/all-fixes-audit.txt
./notes/auth-flow-v75-verification.md
./notes/auth-recovery-verification.md
./notes/auth-ui-verification.md
./notes/bug-risk-scan.txt
./notes/call-audio-audit.txt
./notes/feature-audit-inventory.md
./notes/firebase-auth-config-reference.md
./notes/firebase-custom-auth-domain-research.md
./notes/full-sync-inventory.txt
./notes/full-sync-playback-scan.txt
./notes/google-login-verification.md
./notes/google-provider-cli-audit.md
./notes/listen-together-audit.txt
./notes/listen-together-v77-audit.md
./notes/malamusic-spotify-feature-audit.md
./notes/manual-audit-2026-08-17.md
./notes/production-review-browser-verification.md
./notes/production-sync-check.md
./notes/production-verification-v63-media-safety.md
./notes/production-verification-v64-hardening.md
./notes/profile-settings-verification.md
./notes/queue-reset-audit.txt
./notes/register-error-audit.txt
./notes/remaining-bug-risks.md
./notes/spotify-gap-audit.md
./notes/sync-bug-prevention-guide.md
./notes/visual-regression-2026-08-17.md
./notes/vps-platform-login-map.md

## Git state

At the start of this review loop, `main` was clean and aligned with `origin/main` at `b65a1c4`. The review fixes were committed as `26c7670` and pushed to `origin/main`; the final scan state is recorded in `REVIEW_LOOP_2026-08-18.md`.
