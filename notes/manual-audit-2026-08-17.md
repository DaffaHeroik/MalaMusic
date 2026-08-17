
## Confirmed playback bug

The mobile player did not populate the audio source even after five seconds. Network inspection showed repeated `POST /api/ytplay` responses with HTTP 400. The exact request body was `{\"query\":\"https://music.youtube.com/watch?v=5QMsYmJYUlQ\"}`, and the response was `Hanya URL atau ID YouTube yang didukung.` Backend `api/ytplay.js` only accepted `youtube.com/watch` and `youtu.be`, not `music.youtube.com`, although frontend track metadata regularly uses the Music YouTube host. This is a confirmed production bug, separate from browser autoplay policy.

## v65 deployment baseline

Production v65 responded successfully in the main browser at `?manual-mobile=2026-08-17-v65`. After splash, Home rendered populated Quick Picks, Popular Playlists, Top Artists, category chips, sidebar navigation, and Listen Together launcher. Content changed again as expected. The Playwright mobile navigation attempt timed out waiting for `domcontentloaded`, but the main browser loaded the same production URL successfully; this suggests a transient automation/deployment wait rather than a confirmed production outage and should remain noted.

## v65 regression verification

On production v65, Profile avatar computed to 144×144 inside a 144×144 wrapper on desktop; the fallback SVG and camera button were absolute, so the confirmed 64×96 shrink bug is fixed. Home playback then resolved successfully: `#audio-player` reached `readyState: 4`, `paused: false`, `currentTime` advanced to about 20.8 seconds, duration was 237 seconds, and the source was a CDN MP3 URL. Opening the full player exposed previous/next, shuffle, repeat, lyrics, offline, like, and volume controls. Clicking Next changed the URL and title from `Kasih Putih - Glenn Fredly` to `Ya Sudahlah - Fade2Black`, and the new track reached the playing state. This confirms the previous 400 playback failure was fixed by accepting `music.youtube.com` in `api/ytplay.js`.

## Full player and queue check

The Lirik tab loaded complete lyrics for `Ya Sudahlah` and kept playback controls available. The Opsi bottom sheet measured x=416..864 and y=713..1100 in the 1280×1100 browser viewport; its 400px-wide content and `Tutup` control stayed within the viewport. Selecting Queue opened `Daftar Antrian` and showed six songs, confirming that Next did not replace the queue with a new list. No runtime errors were observed during these interactions.

## Audit lanjutan v66

- Home desktop merender Recently Played, Quick Picks, Popular Playlists, dan Top Artists tanpa page overflow; carousel horizontal sesuai desain.
- Profile dan Settings dapat dibuka; avatar v65/v66 terukur kembali persegi 144x144, panel Settings memiliki scroll internal dan kontrol pemutaran, tampilan, offline/data, backup/restore, avatar, serta playlist publik.
- Offline empty state valid. Label v66 membedakan quota origin (`Penyimpanan perangkat`) dari audio offline (`Belum ada audio offline`), sehingga angka quota tidak lagi disalahartikan sebagai audio.
- Koleksi, Lagu Disukai, Leaderboard, Search, Listen Together, Artist, dan Album dapat dibuka; empty/loading states berubah dengan benar.
- Console setelah navigasi v66 tidak menunjukkan error runtime atau warning icon Google yang sebelumnya muncul.
- Ditemukan bug nyata: setelah Artist.open lalu Album.open, `#artist-modal` dan `#album-modal` sama-sama tetap ada di DOM sebagai elemen fixed. Album berada di atas, tetapi overlay Artist stale dapat menyimpan state/request lama dan berisiko mengganggu navigasi, back, dan aksesibilitas. Perbaikan ditambahkan pada `Artist.open` dan `Album.open` untuk menutup modal detail lawan sebelum membuka detail baru; akan dideploy sebagai v67.
- Tidak ditemukan page overflow horizontal pada viewport Android dari audit sebelumnya; bottom navigation dan launcher social tidak saling menutup.

## v67 regression verification

Production v67 memuat Home dengan konten baru, navigasi, Quick Picks, playlist, Top Artists, dan launcher social. Uji lifecycle modal menghasilkan `before: artist=flex, album=none` lalu setelah membuka album `after: artist=none, album=flex`; hanya `album-modal` dan launcher Listen Together yang tersisa sebagai fixed element yang terlihat. Ini mengonfirmasi stale Artist overlay sudah tertutup. Console tidak menunjukkan error runtime baru selama uji.

## v68 playlist-cover verification

Pada production v68, kartu Popular Playlist `Lagu Pop Indonesia Terbaru 2026 - 2025 (Playlist Teman Kerja & Saat Santai)` meneruskan cover playlist secara langsung ke `Album.open()`. Pengukuran DOM setelah detail selesai memuat menunjukkan `cardCover`, cover hero, dan cover square memiliki URL yang sama. Judul detail juga sesuai dengan playlist yang diklik. Perubahan ini mengatasi cover detail yang sebelumnya dapat diganti oleh thumbnail API album atau cover lagu pertama.

## v71 Listen Together launcher verification

Launcher Listen Together tidak lagi dibuat sebagai pill floating di atas konten. Pada desktop, launcher berada di sidebar dalam section `Sosial` sebagai item `Dengar bersama`; pengukuran production menunjukkan `position: static`, ukuran 223x48px, dan tetap membuka modal Listen Together. Pada mobile, label disembunyikan dan tombol menjadi icon-only 44x44px, dengan `position: fixed`, tanpa overflow horizontal. Posisi final berada di `bottom: 150px` agar berada di atas mini-player dan bottom navigation, bukan menutupi kontrol pemutaran. Modal tetap terbuka saat item sosial ditekan.

## v72 Home cover verification

Kartu Quick Picks Home sebelumnya memakai padding `p-2.5` pada seluruh kartu dan thumbnail 48/56px, sehingga cover terlihat memiliki ruang kosong di sekelilingnya. Pada v72, kartu memakai wrapper cover flush di sisi kiri dengan `overflow-hidden`, thumbnail 64x64px pada mobile dan 72x72px pada desktop, `object-fit: cover`, serta padding wrapper 0px. Pengukuran production menunjukkan gambar dan wrapper memiliki ukuran yang sama, tanpa overflow horizontal pada Android.

## v73 Recently Played cover verification

Versi v73 memperbaiki renderer Recently Played dengan menghapus `border border-white/10`, menambahkan `block` pada `<img>`, dan menerapkan `safeMediaUrl()`. Production memuat `home.js?v=73` dan Service Worker `malamusic-static-v73`. Pengukuran aktual pada production menunjukkan kartu Recently Played berukuran 160x204px, wrapper cover 160x160px, gambar 160x160px, padding wrapper 0px, border 0px, display gambar `block`, serta overflow horizontal 0px. Perubahan sudah dipush pada commit `67cd671`.

## v74 mobile visual spacing verification

Screenshot pengguna menggunakan alamat branch alias Vercel (`malamusic-git-main-daffaheroiks-projects.vercel.app`), bukan deployment berbeda yang tidak terhubung. Branch alias dan domain production sama-sama memuat `/home.js?v=74` serta `malamusic-static-v74`. Pada v74, tombol Recently Played diberi `p-0 m-0 border-0 bg-transparent`, wrapper cover diberi `p-0 m-0 border-0 shadow-none bg-transparent`, dan gambar diberi `block p-0 m-0 border-0`, untuk menghilangkan shadow/background yang masih tampak sebagai celah pada screenshot Android. Commit source: `85d0f46`.
