# MalaMusic feature-by-feature audit inventory

## Core frontend modules

- app.js: routing, navigation, shared playlist/public playlist routes, auth-aware app shell.
- home.js: Home categories, recently played, quick picks, popular playlists, top artists, streak card.
- search.js: query search, suggestions, recent searches, songs/playlists/artists filters, recommendations.
- library.js: playlists, liked artists, liked songs, offline entry, playlist creation/edit/delete/public publication, playlist detail, queue actions, offline playlist download, collection search/sort/grid-list, playlist detail search/sort.
- player.js: native audio engine, queue, next/previous, shuffle/repeat, media session notification controls, audio cache, offline playback, preloading, playback speed, auto-next, data saver, sleep/equalizer helpers, liked songs/artists, local playlist persistence, stats hooks.
- miniplayer.js/fullplayer.js: mini player, full player, lyrics tabs, queue, speed, timer, equalizer, add-to-playlist, download, share.
- profile.js: Gmail auth UI, profile session, avatar sync endpoint, stats, streak, public playlist controls, settings, local backup/restore, history.
- streak.js/leaderboard.js/stats.js: listening streak, leaderboard, listening statistics, public playlists/stats proxy.
- listen-together.js: room create/join/leave, host commands, queue sync, polling state, room badges.
- sw.js: PWA static caching, offline audio binary caching, update/version management.

## Backend modules

- email-auth.js: Gmail-only register/login/me/logout with signed HttpOnly session.
- profile.js: authenticated avatar/profile storage in Firebase RTDB.
- listen-together.js: authenticated room lifecycle and host-controlled state.
- stats.js: listening stats, leaderboard, public playlist publication/read, rollover proxy.
- search/lyrics/artist/album/ytplay/proxy-audio: catalog, lyrics, audio resolution/proxy.

## Audit labels to apply per feature

Each feature must be classified as: working, partially working, broken, device-local only, cross-device, desktop-only, mobile-only, missing, or security/performance risk.

## Initial high-risk areas

1. Local playlist/liked/offline state is not fully cross-device.
2. Listen Together is polling-based and needs room-aware realtime rules before direct Firebase listeners.
3. Audio source is YouTube-derived, so quality/device handoff differs from Spotify catalog behavior.
4. PWA caching can make Android and desktop appear inconsistent unless every asset version is advanced together.
5. Some Spotify-like settings exist as local toggles, but media quality, notification privacy, social controls, pin/folder playlists, and collaborative playlists need verification.

## Spotify baseline verified

Spotify officially documents a Play Queue with add, reorder, remove, and clear operations; a Jam with invitations, guest controls, shared queue, and host permissions; collaborative playlists where collaborators can add, remove, and reorder tracks; and offline downloads with storage/device limits, offline mode, download status, and removal controls. These are baseline expectations for the feature-by-feature comparison.

References: Spotify Play Queue https://support.spotify.com/us/article/play-queue/ ; Spotify Jam https://support.spotify.com/us/article/jam/ ; Spotify Collaborative Playlists https://support.spotify.com/us/article/collaborative-playlists/ ; Spotify Listen Offline https://support.spotify.com/us/article/listen-offline/.
