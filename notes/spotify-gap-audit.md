# MalaMusic vs Spotify-style UX audit

## Current strengths

MalaMusic already has Home categories, Recently Played, Quick Picks, Popular Playlists, Top Artists, search tabs for music/playlists/artists, local playlists, liked songs, offline audio, queue actions, full player lyrics, playback speed, sleep timer, equalizer, public playlists, streaks, leaderboard, and Listen Together.

## Highest-impact gaps

| Area | MalaMusic now | Spotify-style expectation | Priority |
|---|---|---|---|
| Home | Static greeting and discovery sections | Personalized greeting, clearer recently played, consistent section spacing and loading/error states | P1 |
| Search | Query search, suggestions, three result tabs | Search history management, result filters, collection search, clear empty/error states | P1 |
| Your Library | Playlists, artists, liked songs, offline tabs | Collection search, sort/filter, grid/list toggle, pinned/custom order, playlist folders | P1 |
| Playlist detail | Local playlist actions and play | Search within playlist, sort, queue actions, collaboration/share controls | P1 |
| Player | Play, queue, lyrics, speed, sleep, equalizer, offline | Consistent now-playing surface, queue drawer, repeat/shuffle state clarity, device handoff equivalent | P1 |
| Settings | Local playback/data/avatar controls | Media quality/data saver, notifications/privacy/social, account, accessibility, cache/storage visibility | P1 |
| Avatar | Local avatar or fallback initials/logo | Account avatar synced across devices | P1 |
| Social | Listen Together uses polling; public playlist link exists | Real-time collaborative listening/playlist sharing with presence and permissions | P2 |
| Offline | Binary audio cache and offline view | Download quality/storage management and explicit downloaded-only filters | P2 |
| Navigation | Desktop sidebar; mobile bottom bar; Leaderboard as top-level item | Mobile bottom nav prioritizes Home, Search, Library, Profile; secondary features are not primary nav | P1 |

## Reference basis

Spotify's official support documentation describes Your Library as a cross-device collection for saved songs, albums, playlists, artists, podcasts, and shows. It supports collection search, filters, sorting by recents/recently added/alphabetical/creator, pinning, and grid/list view. Spotify also exposes playlist privacy/publication controls, audio quality choices, equalizer, and data-aware playback controls.

## Recommended implementation order

First add Library search, sort/filter, and grid/list state because it is the most visible structural gap. Next refine mobile navigation and Home personalization. Then expand Settings with media quality/data saver, notification/privacy placeholders that are clearly labeled as local or unavailable, and storage usage. Finally, move avatar data to Firebase Storage for cross-device synchronization and replace polling in Listen Together with realtime listeners.

## Local UI verification after P1 patch

The preview showed the Koleksi view with the four collection tabs, a collection search input, sort selector (`Terbaru`, `A-Z`, `Artis`), and grid/list toggle. The desktop layout rendered without horizontal overflow. The existing floating Listen Together launcher remains visually close to the lower-right content area and should be moved to a safe inset above the player/bottom navigation in a later layout pass.

## v53 layout verification

The v53 preview loaded Home normally. The Listen Together launcher rendered at a higher safe position above the lower content region instead of sitting on top of the artist/card grid. Desktop navigation remained intact. The Library route can be opened through the sidebar and now exposes collection search, sorting, and layout controls.
