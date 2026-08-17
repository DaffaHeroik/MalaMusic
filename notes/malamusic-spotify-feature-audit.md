# Audit Fitur MalaMusic versus Spotify-style UX

**Tanggal audit:** 17 Agustus 2026  
**Repository:** `DaffaHeroik/MalaMusic`  
**Domain:** `music.malawalipayment.web.id`

## Cara membaca status

`Ada` berarti fungsi dan entry point ditemukan di frontend/backend. `Parsial` berarti fungsi dasar ada tetapi belum menyamai alur, permission, persistence, atau device coverage Spotify. `Lokal` berarti data tersimpan di perangkat dan belum menjadi koleksi lintas perangkat. `Belum ada` berarti tidak ditemukan implementasi nyata. `Risiko` berarti fungsi mungkin ada tetapi perlu pengujian tambahan karena berhubungan dengan security, race condition, cache, atau resource usage.

## Ringkasan eksekutif

MalaMusic sudah memiliki fondasi pemutar web yang cukup luas: Home discovery, Search, Library, playlist lokal, liked songs, offline audio, queue, lyrics, equalizer, sleep timer, media notification controls, streak, leaderboard, public playlist, avatar, dan Listen Together. Gap terbesar bukan sekadar jumlah menu, melainkan **tingkat sinkronisasi, permission, persistence, dan kelengkapan state**. Spotify memperlakukan Library, queue, playlist, download status, dan social session sebagai fitur produk yang konsisten lintas perangkat; MalaMusic masih mencampurkan data lokal, data server, dan data sementara room.

## Audit satu per satu

| No. | Area/f fitur | MalaMusic saat ini | Status | Gap terhadap pola Spotify | Prioritas |
|---:|---|---|---|---|---|
| 1 | Gmail registration | Firebase Admin create user melalui endpoint server; hanya `@gmail.com`; password divalidasi | Ada | Belum ada email verification, password reset, CAPTCHA/rate limit yang kuat, dan abuse telemetry | P0 |
| 2 | Gmail login/session | Signed HttpOnly session, endpoint `me`, logout | Ada | Session belum memiliki device/session management dan refresh/revoke UI | P1 |
| 3 | Home discovery | Quick Picks, recently played, popular playlists, top artists, category chips, streak card | Parsial | Personalisasi masih berbasis query umum dan local history; belum ada feed personal yang stabil, hidden/refreshable recommendation controls, dan skeleton/error state yang seragam | P1 |
| 4 | Home greeting | Branding MalaMusic dan header tetap | Parsial | Belum ada greeting berbasis waktu/nama dan shortcut personal seperti Recently Played/Your Rotation | P2 |
| 5 | Search songs | Search endpoint dan result cards | Ada | Belum ada advanced filters, debounce/search cancellation yang menyeluruh, result ranking, typo tolerance, dan filter downloaded/liked | P1 |
| 6 | Search artists | Tab artis dan Artist view | Parsial | Follow/unfollow artist belum menjadi koleksi server-side lintas perangkat; belum ada artist updates/related artists yang konsisten | P1 |
| 7 | Search playlists | Tab playlist dan public playlist route | Parsial | Search koleksi sendiri dan search public catalog belum dipisahkan dengan jelas; belum ada ownership/privacy filter | P1 |
| 8 | Search history | Recent searches di localStorage | Lokal | Tidak sinkron lintas perangkat; belum ada hapus semua/individual yang jelas pada UI utama | P2 |
| 9 | Your Library navigation | Tab Playlists, Artis, Lagu Disukai, Mode Offline; collection search/sort/grid-list sudah ditambahkan | Parsial | Belum ada pin, folder, custom order drag/drop, server-synced collection, podcast/audiobook sections | P1 |
| 10 | Playlist creation | Create playlist dengan nama dan optional image | Lokal | Playlist dasar belum tersimpan lintas perangkat; belum ada collaborative permission dan revision/conflict handling | P0 |
| 11 | Playlist edit/delete | Rename, image edit, delete, song add/remove | Lokal | Belum ada undo, versioning, collaborator management, public/private ACL lengkap, dan cross-device persistence | P1 |
| 12 | Playlist detail | Cover, play, shuffle, download, share, song menu, in-playlist search/sort | Parsial | Belum ada drag reorder, playlist description, owner/collaborator identity, add-to-other-playlist, smart recommendations, dan downloaded-only filter | P1 |
| 13 | Public playlist | Publish via `/api/stats`, public link route | Parsial | Public/private state dan link ada, tetapi access expiry, collaborator permissions, unpublish consistency, and profile publication controls perlu diuji lebih dalam | P1 |
| 14 | Liked songs | Local liked songs list and play | Lokal | Belum menjadi account-synced Liked Songs; belum ada filter/sort/Make this a playlist | P0 |
| 15 | Liked artists | Local liked artist cards | Lokal | Belum ada server persistence, follow state consistency, artist feed, atau sync lintas device | P1 |
| 16 | Queue | Add to queue, queue modal, manual queue persistence fix, next/previous | Parsial | Belum ada drag-and-drop reorder, swipe/right-click actions, queue history, queue clear confirmation, and room-aware collaborative queue | P1 |
| 17 | Shuffle/repeat | Player state supports shuffle/repeat | Ada | UX state clarity and persistence need device-by-device verification; smart shuffle/recommendations absent | P2 |
| 18 | Now Playing / mini player | Mini-player and full player | Ada | Device handoff, current-device picker, cross-device playback, and hardware target selection absent | P1 |
| 19 | Media Session | Play/pause/next/previous/seek handlers and lockscreen metadata | Ada | Browser/OS support varies; needs Android notification regression matrix and fallback behavior documentation | P1 |
| 20 | Lyrics | Lyrics tabs, scrolling, sync controls, translation-related endpoints | Parsial | Lyrics availability, timed lyrics reliability, copyright/source policy, and lyrics search fallback are not equivalent to Spotify | P1 |
| 21 | Equalizer | Presets and bass/mid/treble controls | Ada | Browser Web Audio support differs by device; no saved server profile or per-device output profile | P2 |
| 22 | Playback speed | Speed picker and local preference | Ada | More relevant to podcasts than music; no per-content profile or server sync | P2 |
| 23 | Sleep timer | Timer and end-of-track behavior | Ada | No visible notification when timer is active across all player surfaces; local only | P2 |
| 24 | Audio quality | Audio resolved through YouTube-derived endpoint/proxy | Parsial | No Low/Normal/High/Very High selection, bitrate guarantee, download quality, or reliable codec policy | P0 |
| 25 | Data Saver | Toggle disables adjacent-track preloading | Parsial | Does not yet control stream quality, cover image quality, lyrics fetch, or cellular download policy | P1 |
| 26 | Offline downloads | Binary audio caching, playlist download, offline view | Parsial | No storage quota/usage panel, downloaded-only filter in every list, download quality, stale-download policy, multi-device limit, or explicit download state model | P0 |
| 27 | PWA install/update | Service worker versioning and cache busting | Ada with risk | Cache invalidation is sensitive; needs Android upgrade test, cache migration, quota handling, and stale asset recovery | P1 |
| 28 | Listen Together room | Authenticated create/join/leave, host command state, shared queue, polling | Parsial | No realtime listener, QR invite, participant list/remove, guest permissions, collaborative add/reorder, host transfer, or connection presence | P0 |
| 29 | Social playlist collaboration | Public link only | Belum ada | Spotify supports collaborator add/remove/reorder with invite/access control | P0 |
| 30 | Social sharing | Share card/link actions | Parsial | No in-app inbox/messages, activity feed, friend graph, or expiry-controlled private share links | P2 |
| 31 | Profile | Gmail identity, stats, streak, public playlist controls, avatar | Parsial | Avatar now syncs through server profile endpoint; collections and listening history remain partly local; no public profile feed/followers | P1 |
| 32 | Avatar | Compressed data image stored under authenticated RTDB profile | Ada with risk | Base64 in RTDB is functional but less scalable than object storage; needs quota, image dimension/content validation, and migration path | P1 |
| 33 | Listening stats | Hours, active days, streak through stats worker | Parsial | Needs event deduplication, timezone policy, cross-device reconciliation, user data export/delete, and transparent calculation rules | P1 |
| 34 | Streak | Home/profile card, animation, leaderboard linkage | Ada with risk | Midnight rollover, timezone, offline playback reconciliation, abuse prevention, and duplicate event handling need explicit tests | P1 |
| 35 | Leaderboard | Dedicated leaderboard view | Parsial | Ranking period/filter, privacy opt-out, pagination, anti-cheat, and tie handling need verification | P1 |
| 36 | Settings | Playback, appearance, offline/data, profile/privacy sections | Parsial | Missing account security, notification controls, media quality, download policy, storage usage, privacy export/delete, social controls, and accessibility options | P0 |
| 37 | Notifications | Browser media notification and some toast feedback | Parsial | No notification preference center, web push subscription, room invitations, download completion, or privacy controls | P1 |
| 38 | Device handoff | No equivalent found | Belum ada | Spotify Connect-like device list, remote control, and handoff are absent | P2 |
| 39 | Collaborative recommendations | No equivalent found | Belum ada | Spotify Jam recommendations and Blend-like shared discovery are absent | P2 |
| 40 | Podcasts/audiobooks | No dedicated content model found | Belum ada | These are separate product surfaces in Spotify; only implement if MalaMusic product scope expands beyond music | P3 |
| 41 | Local files | No dedicated import/local-file player flow found | Belum ada | Spotify documents local files as a separate feature; not essential for MalaMusic v1 | P3 |
| 42 | Account recovery | No password reset/email verification UI found | Belum ada | Required for production account lifecycle and support reduction | P0 |
| 43 | Abuse prevention | Frontend validation and backend length/domain validation | Risiko | Registration/login rate limiting, IP/device throttling, CAPTCHA, audit counters, and injection-focused tests need implementation | P0 |
| 44 | Accessibility | Semantic buttons and labels exist in many areas | Parsial | Need keyboard focus audit, contrast checks, reduced-motion coverage, screen-reader labels, and modal focus trapping | P1 |
| 45 | Android/PC parity | Responsive sidebar/bottom nav and cache versioning | Parsial | Needs matrix testing for 360px Android, 412px Android, tablet, 1280px desktop, and 1440px desktop; floating room controls and player offsets remain sensitive | P0 |

## Fitur Spotify yang hilang tetapi tidak semuanya wajib ditiru

Spotify memiliki fitur yang bergantung pada ekosistem katalog dan perangkatnya: device handoff/Connect, podcasts, audiobooks, local files, Blend, Jam dengan QR/presence/device permissions, smart shuffle, collaborative playlist permissions, and catalog-specific recommendation systems. MalaMusic dapat meniru **pola pengalaman** dan permission model-nya, tetapi tidak dapat menjamin katalog, bitrate, lisensi, atau device integration yang sama karena sumber audio MalaMusic berbeda.

## Backlog perbaikan berdasarkan prioritas

### P0 — harus diperbaiki sebelum menyebut pengalaman siap produksi

Pertama, implementasikan rate limit registration/login dan abuse protection server-side. Validasi client tidak cukup untuk mencegah spam. Kedua, berikan account recovery melalui password reset dan email verification. Ketiga, ubah liked songs, playlists, dan public/private metadata menjadi data account-synced dengan conflict-safe writes. Keempat, perluas Offline Mode dengan storage usage, downloaded-only filtering, download state, dan data saver yang benar-benar memengaruhi kualitas/preload. Kelima, perbaiki Listen Together menjadi event-driven realtime dengan participant permissions, host state, and presence. Keenam, selesaikan Android/PC layout matrix karena overlap adalah regresi visual yang mengganggu seluruh fitur.

### P1 — peningkatan inti pengalaman musik

Tambahkan pin/folder/custom order pada Library, drag reorder pada playlist dan queue, search/sort pada playlist detail, artist follow lintas perangkat, notification/privacy controls, stats reconciliation, leaderboard privacy, accessibility, dan profile feed publik. Avatar sebaiknya dipindahkan dari base64 RTDB ke object storage apabila ukuran dan jumlah user meningkat.

### P2 — fitur pembeda sosial dan personalisasi

Tambahkan device handoff, participant invite QR, guest controls, shared recommendations, Blend-like playlist, richer recommendation feedback, and synchronized search/history preferences. Fitur ini sebaiknya dibangun setelah model akun dan Library sudah benar-benar server-synced.

### P3 — fitur scope expansion

Podcasts, audiobooks, local files, and catalog-wide content types sebaiknya dipisahkan sebagai keputusan produk baru karena memerlukan model data, UI, playback semantics, and content policy berbeda.

## Urutan eksekusi yang disarankan

Urutan paling aman adalah: **abuse protection dan account recovery**, kemudian **account-synced collections**, kemudian **offline/storage model**, lalu **realtime Listen Together**, setelah itu **Library/playlist collaboration**, dan terakhir **Connect-like device handoff serta recommendation/social expansion**. Urutan ini mencegah membangun UI Spotify-style di atas data yang masih lokal dan permission yang belum jelas.

## Referensi

[1]: https://support.spotify.com/us/article/your-library/ "Spotify — Your Library"
[2]: https://support.spotify.com/us/article/sort-and-filter/ "Spotify — Sort and filter"
[3]: https://support.spotify.com/us/article/play-queue/ "Spotify — Play Queue"
[4]: https://support.spotify.com/us/article/playlist-privacy-and-access/ "Spotify — Playlist privacy and access"
[5]: https://support.spotify.com/us/article/collaborative-playlists/ "Spotify — Collaborative playlists"
[6]: https://support.spotify.com/us/article/jam/ "Spotify — Start or join a Jam"
[7]: https://support.spotify.com/us/article/listen-offline/ "Spotify — Listen offline"
[8]: https://support.spotify.com/us/article/audio-quality/ "Spotify — Audio quality"
