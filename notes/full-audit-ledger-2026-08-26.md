# MalaMusic Full Audit Ledger — 2026-08-26

## Scope
Production: https://music.malawalipayment.web.id — browser Chromium desktop viewport 1280x1100, dengan route Home, Play, Leaderboard, Search, dan player persisten.

## Baseline otomatis
- `npm run build`: PASS (no build required)
- `npm run lint`: PASS
- Semua 13 static/contract tests: PASS
- `npm audit --omit=dev --audit-level=high`: 0 vulnerabilities
- `/api/health`: HTTP 404, endpoint belum tersedia
- `/api/home`: HTTP 404, endpoint belum tersedia (kemungkinan bukan kontrak aktif)
- `/api/search?q=Pamungkas`: HTTP 400 karena kontrak aktif memakai parameter `query`, bukan `q`
- `/api/ytplay?...` via GET: HTTP 405 karena kontrak aktif memakai POST

## Temuan browser
- Home dapat dimuat; pada awalnya konten async menampilkan skeleton lalu selesai.
- Playback `Jiwa Yang Bersedih` akhirnya berhasil: audio `paused=false`, `readyState=4`, `duration=278.219`, source proxy SaveTube, tetapi waktu tunggu resolver/proxy sekitar 4.9–9.3 detik; UX masih terasa sebagai "Menyiapkan lagu..." cukup lama.
- Leaderboard awalnya menampilkan skeleton, lalu berubah menjadi empty state yang valid: "Belum ada peringkat" dan tombol "Muat ulang".
- Klik navigasi dapat menampilkan halaman target, tetapi `document.title` tetap `Jiwa Yang Bersedih - ...` saat route Search/Leaderboard; indikasi title route tidak disinkronkan.
- Search route berhasil: input memiliki aria-label, query `Pamungkas` menghasilkan tab Musik/Playlist/Artis/Pengguna dan daftar lagu.
- Home baseline DOM: 37 gambar, 3 gambar tanpa alt terdeteksi; form controls missing label 0; unnamed buttons/links 0.
- Service Worker controller production sudah `sw.js?v=148`.
- Player tetap persisten saat berpindah route.

## Kandidat prioritas
1. P1: Tambahkan/validasi health/readiness endpoint yang benar atau dokumentasikan kontrak endpoint aktif.
2. P1: Investigasi latency resolver 5–10 detik dan loading copy/progress agar tidak tampak macet.
3. P2: Sinkronkan `document.title` dengan route aktif, terutama Search dan Leaderboard.
4. P2: Perbaiki 3 gambar tanpa alt dan audit seluruh route, bukan hanya Home.
5. P1/P2: Audit Library, Offline, Playlist/Album, Profile, Listen Together, Like/Save, Auto-next, download pause/resume/stop, dan error/retry states secara nyata.

Status: audit masih berjalan; jangan klaim production-ready sebelum tiga clean sessions dengan persona berbeda.

## Temuan baru dari audit playlist/download
- Route album/playlist Kesadaran dapat dibuka dan menampilkan 118 lagu serta pembuat `Penyelamat Bumi`.
- Saat download playlist dimulai, panel menampilkan `Mengunduh 8 dari 118 • 1%`, lalu pada interval berikutnya berubah menjadi `Mengunduh 8 dari 118 • 82%` sementara track aktif masih `Sailor Song • mengunduh`. Ini adalah kontradiksi UI serius: persentase overall tampaknya menggunakan byte/progress item aktif, bukan jumlah lagu selesai atau metrik gabungan yang jelas.
- Kontrol `Jeda`, `Stop`, dan `Sembunyikan` terlihat tersedia.
- Detail playlist memperlihatkan beberapa lagu tanpa nomor urut konsisten: lagu kelima `Jiwa Yang Bersedih` tidak memiliki angka `5` pada teks terambil, meskipun posisi visualnya berada setelah nomor 4. Perlu diverifikasi apakah hanya issue markup/visual atau data index.
- Full audit belum selesai; status tetap audit berjalan.

## Validasi kontrol download
- Tombol Jeda berhasil mengubah label menjadi `Lanjutkan`, job menjadi `paused: true`, dan metadata job tetap tersimpan di localStorage. Pada saat diuji, queue berada di `done: 12` dan track aktif `we can't be friends (wait for your love)`.
- Progress modal pada kondisi terakhir menampilkan `Mengunduh 13 dari 118 • 1%` dan count `12/118`; ini tampak sebagai off-by-one pada teks item aktif (`i + 1`) versus count lagu selesai (`done`). Perlu diperbaiki agar pengguna tidak melihat status yang membingungkan.
- Perlu menguji resume dan stop setelah pause, termasuk reload/resume job dan pencegahan job duplikat.

## Resume download
- Resume berhasil mengubah label tombol kembali ke `Jeda` dan mempertahankan track aktif yang sama.
- Setelah resume, panel menampilkan `Mengunduh 13 dari 118 • 6%` dengan count `12/118`; angka 13 berarti indeks lagu aktif, bukan jumlah lagu selesai. Ini membingungkan dan harus diubah menjadi format eksplisit seperti `Selesai 12/118` serta `Sedang diproses: lagu 13 — 6%`.
- Queue masih berjalan setelah resume dan tidak terlihat job kedua.

## Smoke HTTP production read-only
- `/api/search?query=Pamungkas`: 200, sekitar 2.45 detik, payload valid dengan 20 lagu.
- `/api/suggest?query=Pamungkas`: 200, sekitar 2.15 detik, payload array valid.
- `/api/album?id=VLPL...`: 200, sekitar 2.54 detik, payload Kesadaran valid.
- `/api/artist?id=UCQ5kM9a7jYw`: 200, tetapi result kosong (`name`, thumbnails, topSongs, playlists semuanya kosong); perlu dibedakan antara ID uji invalid dan fallback UI.
- `/api/lyrics?id=MUZxZVcZAVA`: 200, sekitar 6.15 detik; lyrics valid tetapi latency tinggi.
- `/api/profile`, `/api/library`, `/api/streak`, `/api/listen-together`: 401 tanpa session, kontrak auth guard konsisten.
- `/api/stats`: 200 dengan leaderboard kosong.
- `/api/health`: 404; tidak ada readiness endpoint publik.
- Beberapa endpoint read-only membutuhkan 1.6–2.5 detik bahkan sebelum operasi resolver; latency UX merupakan kandidat defect P1/P2.

## Mode Offline, Disukai, dan Profil
- Setelah Stop, Mode Offline menunjukkan 14 lagu tersimpan; 13/118 lagu pada playlist Kesadaran siap. Satu track partial memiliki tombol `Download ulang audio offline` dan status 10%.
- Retry `we can't be friends (wait for your love)` berhasil; status berubah menjadi `Audio siap • 100%`, playlist siap meningkat menjadi 13/118.
- Playback offline pascaretry tervalidasi: source `/offline-audio/9Gduk7Zjem4`, `paused=false`, `readyState=4`, `duration=228.639`, `currentTime=8.168`, `error=null`.
- Halaman Disukai menampilkan 5 lagu tersimpan, tombol hapus, opsi lagu, dan Putar Semua.
- Profil terautentikasi menampilkan akun Gmail, streak 5 hari, aktivitas mendengar 7.2 jam, 2 playlist publik, 5 lagu disukai, dan 14 offline.
- Audit DOM yang terlihat pada Profil/route aktif: tidak ada horizontal overflow; 3 gambar tanpa alt masih terdeteksi pada DOM aktif; 5 unnamed buttons berasal dari elemen hidden/komponen daftar lagu yang tidak sedang tampil, sehingga perlu audit visible-only terpisah.
