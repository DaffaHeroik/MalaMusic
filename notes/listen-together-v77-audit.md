# Listen Together v77 Audit

## Problems found

1. Join and create requests had no timeout or pending-state feedback, so a slow API could appear stuck indefinitely.
2. The public room response exposed only a numeric member count, not a participant list. Presence timestamps were never pruned, so stale members could remain visible.
3. The client only prevented non-host state publication; local participant controls could still call `TP`, `PK`, `NX`, `PV`, and `SK` and change their own audio.
4. `loadTrack()` attempts playback automatically. A listener joining a paused room could therefore start audio locally even when the host was paused.
5. Remote position used the last raw position without accounting for elapsed time since the host command.
6. Participant presence changes can happen without a playback revision change; the old client returned early and did not refresh the room badge.

## Fixes in v77

- Added AbortController request timeout (15 seconds) and visible `Menghubungkan...` / `Membuat room...` pending states.
- Added a 30-second presence TTL, participant list, online count, host marker, and stale participant pruning on join/state requests.
- Kept command authority server-side: only the room host can call `action=command`.
- Added client-side follower guards for playback functions and native audio events. Non-host play, pause, next, previous, and seek are reverted to the host state.
- Added remote playback enforcement every second, elapsed-position correction using `changedAt`, and gesture retry when mobile autoplay is blocked.
- Added an 8-second remote-apply guard so events caused by remote state application are not mistaken for local commands.
- Refreshed participant count even when playback version is unchanged.
- Bumped asset and Service Worker cache from v76 to v77.

## Validation and deployment

- `node --check public/listen-together.js` passed.
- `node --check api/listen-together.js` passed.
- `git diff --check` passed.
- Commit: `32ed72c fix: stabilize listen together room sync`.
- Production deployment: `malamusic-rko4cmgym-daffaheroiks-projects.vercel.app`, aliased to `malamusic.vercel.app` and the custom domain.
- Production checks: `music.malawalipayment.web.id`, `malamusic.vercel.app`, and the deployment URL all served `/listen-together.js?v=77` and `malamusic-static-v77`.
- Unauthenticated Listen Together API correctly returned HTTP 401.

## Remaining verification

A complete two-account test still requires two active Gmail sessions: host create, listener join, participant display, host play/pause/seek/next/previous, mobile autoplay gesture, reconnect, and leave cleanup. No end-to-end success should be claimed until that test is performed.
