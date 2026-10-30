# MalaMusic Android production features

## Release
- Package: `com.malamusic.app`
- Version: `2.1.4` (`versionCode=7`)
- AAB: `MalaMusic-2.1.4.aab`
- Play track: Internal testing

## Authentication
- Native email/password login and Gmail-only registration use the existing `/api/email-auth?action=login|register` endpoints.
- The app persists the signed `mm_session` cookie in app-private preferences and attaches it to API requests.
- Session restoration uses `/api/email-auth?action=me`; logout clears the server cookie and local session value.
- Password reset calls `/api/email-auth?action=password-reset`.
- Liked songs and recent tracks persist locally and sync through `/api/library` when authenticated. The Android client preserves the existing server-side playlists and liked-artists arrays when writing library changes.

## Audio caching and offline downloads
- Online playback uses Media3 `CacheDataSource` and a 256 MiB LRU disk cache. Replayed chunks are read from disk while cached, avoiding repeated network transfers; the LRU cache can evict old stream data when space is needed.
- Explicit downloads use a separate persistent cache in app-private files, and are listed under Library > Mode Offline. Offline cache size is capped at 2 GiB; users can remove downloads from the offline list.
- Downloaded tracks are played from the offline cache without resolving a new network stream URL.
- Downloaded audio is stored only on the device. Clearing app data/uninstalling removes it.

## Verification on 2026-10-29
- Gradle `compileDebugKotlin`, `testDebugUnitTest`, and `bundleRelease`: succeeded. There are no configured Android unit tests (`NO-SOURCE`).
- `bundletool validate`, AAB ZIP integrity, and upload certificate fingerprint checks: passed.
- Backend smoke checks: `/api/email-auth?action=me` returns unauthenticated state as expected; `/api/search` returned results; `/api/library` rejects unauthenticated access with 401; `/api/ytplay` returned an HTTPS audio URL.
- Existing Node guards passed: API contract, playback race, offline playlist, library history sync, playback source policy, album/playlist contract, runtime listening, and runtime listening behavior.
- No Android device/emulator was attached to the VPS during this run. Actual signup/login/reset, stream cache hit behavior, and offline playback still require hands-on QA on a tester device before calling the app fully production-verified.


## Android 2.1.3 work in progress / verification
- Profile > Pengaturan now opens a real settings dialog with persistent autoplay control, streaming-cache size, offline-cache size, and a streaming-cache clear action. Offline downloads are preserved.
- Playback auto-advance respects the saved autoplay setting.
- Adaptive launcher icon resources added for Android 8+; the branded animated splash remains enabled.
- Local `/api/ytplay` source now probes the resolved provider URL and rejects HTTP 200 HTML landing pages masquerading as audio before returning a stream URL. This backend change has NOT been deployed to Vercel production.
- Live smoke test on 2026-10-30 found the SaveTube URL redirected to `ytshortdown.com` and returned `text/html`; Siputzx fallback also returned no audio for the sampled track. This is an upstream provider outage/invalid response, not a Compose or ExoPlayer parsing issue. The API now fails closed instead of handing HTML to the player.
- Google OAuth native Android sign-in is NOT implemented yet: Firebase Android app registration and a valid Android/Web OAuth client configuration are still missing. The existing desktop OAuth client is not a valid substitute and must not be embedded in the APK.
- Live audio playback is NOT yet fixed end-to-end. The sampled SaveTube URL redirected to an HTML page and the Siputzx fallback returned no audio; the local API guard prevents returning the invalid URL, but a working provider/fallback and production deployment are still required.
- Build artifacts were generated successfully (`MalaMusic-2.1.3.aab`, `MalaMusic-2.1.3.apk`), but do not upload this build as a completed feature release until Google sign-in and a real audio stream are verified on-device.


## Android 2.1.4 changes
- Google Login action added to the native auth screen. It opens a same-origin Firebase redirect flow in the browser, then returns to the app through the `malamusic://auth` deep link.
- The browser flow verifies the Firebase Google ID token on the server, issues a 120-second one-time code stored by SHA-256 key in Firebase RTDB, and the Android app exchanges it once for the signed `mm_session` token.
- Firebase web auth now uses the project's default `heroikzre.firebaseapp.com` handler domain to avoid the pending custom-domain DNS/callback mismatch. The Google provider must remain enabled in Firebase Authentication.
- Build: `MalaMusic-2.1.4.aab` and `MalaMusic-2.1.4.apk`; versionCode 7; upload signing certificate unchanged.
- Backend/API and mobile auth bridge source are prepared locally; production deployment and an interactive Google account sign-in/device callback test are still pending.
- Music playback is not yet verified/fixed end-to-end. Production `/api/ytplay` returned an HTTP 200 URL that redirected to an HTML landing page (`ytshortdown.com`), not audio. The local API now validates audio content and fails closed instead of returning that bad URL. A reliable, authorized audio source remains the outstanding blocker.
