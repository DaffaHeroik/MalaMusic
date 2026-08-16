# Panduan Pencegahan Bug Sinkronisasi MalaMusic

## Ringkasan eksekutif

Scan menyeluruh terhadap frontend, backend, player, penyimpanan lokal, offline cache, dan service worker menemukan bahwa bug sinkronisasi terutama berasal dari tiga pola: object lagu dibuat berulang dengan format berbeda, setiap halaman mengulangi urutan perubahan state player secara manual, dan cache audio/lirik tidak memiliki kontrak versi serta validasi yang cukup kuat. Perbaikan terakhir sudah menutup dua sumber utama: registry menu titik tiga sekarang menggunakan token per-instance, sedangkan playlist publik dan rekomendasi auto-next sudah dinormalisasi. Namun beberapa entrypoint lama di album dan artis masih membuat object track sendiri, sehingga guardrail berikut perlu dipakai pada setiap pembaruan.

## Kontrak data lagu wajib

Setiap lagu yang masuk ke `S.ct`, `S.pl`, `getLikedSongs()`, `getUserPlaylists()`, `getOfflineSongs()`, atau registry menu harus melewati satu normalizer pusat. Format minimal yang harus selalu tersedia adalah:

| Field | Aturan |
|---|---|
| `id` | Sama persis dengan `videoId` dan tidak kosong |
| `videoId` | ID video YouTube kanonik, bukan URL dan bukan judul |
| `title` | String yang sudah dibersihkan dari karakter aneh |
| `artist` | String aman dengan fallback `MalaMusic` |
| `artistId` | String atau kosong |
| `cover` | URL gambar hasil normalisasi, dengan fallback berdasarkan `videoId` |
| `ytUrl` | URL YouTube yang dibentuk dari `videoId` jika API tidak memberi URL |

Jangan membuat object `{ id, videoId, title, artist, cover, ytUrl }` secara manual di halaman baru. Gunakan `normalizeTrack(rawTrack)` dan `trackId(track)`. Jika API eksternal mengubah nama field menjadi `video_id`, `thumbnail`, `image`, atau `url`, perubahan cukup dilakukan di normalizer.

## Satu pintu untuk transisi playback

Saat ini beberapa halaman masih mengatur `S.ct`, `S.pl`, `S.pi`, `S.ps`, `UU()`, `MP.show()`, `S.il`, `UB()`, `resetLyricsUI()`, dan `loadTrack()` secara terpisah. Ini berisiko membuat audio sudah berubah tetapi judul, cover, lirik, URL, atau status loading masih milik lagu sebelumnya.

Pola yang harus dipakai pada pembaruan berikutnya adalah membuat satu fungsi transisi, misalnya `playTrackFromQueue(queue, index, source)`, yang melakukan urutan berikut secara konsisten:

1. Normalisasi dan filter queue berdasarkan `trackId`.
2. Validasi index dan object track.
3. Hentikan request audio lama atau tandai request lama sebagai stale.
4. Set `S.pl`, `S.pi`, `S.ps`, dan `S.ct` dalam satu blok.
5. Perbarui history URL berdasarkan `trackId`.
6. Reset lirik berdasarkan ID baru.
7. Render metadata melalui `UU()` dan tampilkan mini-player.
8. Set loading state dan render `UB()`.
9. Panggil `loadTrack()` hanya dengan object yang sama dengan `S.ct`.
10. Update Media Session metadata setelah track aktif berubah.

Entry point dari Home, Search, Album, Artist, Library, Liked, Offline, playlist publik, share link, context menu, dan notifikasi harus memanggil fungsi ini, bukan mengulang urutan sendiri.

## Identitas track dan active state

Semua perbandingan lagu harus memakai `trackId(a) === trackId(b)`. Jangan menjadikan kombinasi judul dan artis sebagai identitas utama karena dua lagu dapat memiliki judul yang sama atau metadata yang berbeda dari provider. Perbandingan judul/artis hanya boleh menjadi fallback visual ketika ID lama belum tersedia.

Untuk setiap row yang dirender, tombol play, menu titik tiga, like, download, dan highlight aktif harus menggunakan object lagu yang sama. Hindari registry global dengan key video ID tunggal. Jika registry diperlukan, gunakan token instance seperti `videoId_sequence` dan hapus token setelah menu ditutup atau row tidak lagi dipakai.

## Race condition dan request stale

`fetchAudioAndPlay()` sudah melakukan pemeriksaan `S.ct === track`, tetapi pembaruan berikutnya harus memakai token request atau `AbortController`. Setiap pergantian lagu harus membatalkan request resolve audio, lyrics, dan preload milik lagu sebelumnya. Callback lama tidak boleh mengubah `AU.src`, `S.il`, `S.ip`, lirik, atau metadata bila tokennya bukan token aktif.

Queue auto-next juga harus mempertahankan source queue. Hasil rekomendasi API wajib dinormalisasi, dideduplikasi berdasarkan ID, dan ditambahkan ke `S.pl` tanpa mengubah lagu aktif. Jangan memanggil fallback `PK(S.ps, 0)` jika `S.ps` masih menunjuk ke halaman Home setelah queue baru dibuat.

## Penyimpanan lokal dan offline

Gunakan key ID yang sama di semua storage: `videoId` kanonik. Saat membaca data lama, lakukan migrasi satu kali untuk mengisi `videoId` dari `id` atau `video_id`, membersihkan item tanpa ID, dan menormalkan metadata. Jangan menyimpan object mentah API ke localStorage.

`audioUrlCache` saat ini menyimpan URL streaming yang dapat kedaluwarsa. URL tersebut harus dianggap cache sementara, bukan file audio permanen. Untuk Mode Offline yang benar-benar offline, simpan response audio binary ke Cache Storage atau IndexedDB dan simpan metadata terpisah. Sebelum memakai URL lama, lakukan validasi; jika gagal, resolve ulang ketika online.

Service worker saat ini tidak menangani request POST `/api/ytplay` sebagai file audio offline karena handler hanya memproses GET. Oleh karena itu, keberadaan `pwa_audio_cache` tidak boleh dianggap sebagai bukti audio binary sudah tersedia offline. Test offline harus benar-benar memutus jaringan dan memutar satu file yang sudah diunduh.

## Service worker dan versioning

Setiap perubahan file JavaScript, HTML, atau kontrak cache harus menaikkan versi secara atomik:

| Item | Contoh |
|---|---|
| Registrasi service worker | `/sw.js?v=33` |
| Nama static cache | `malamusic-static-v33` |
| Nama data cache | `malamusic-api-v33` |
| Query asset frontend | `?v=48` |
| Daftar `STATIC_ASSETS` | Harus memakai versi asset yang sama |

Jangan menaikkan hanya satu dari empat item tersebut. Setelah deploy, periksa response production untuk memastikan `index.html`, `sw.js`, `player.js`, dan `app.js` memuat versi yang sama. Saat service worker berubah, pastikan cache lama benar-benar dihapus pada event `activate`.

Jangan cache response API yang bersifat user-specific seperti `/api/email-auth?action=me`, leaderboard privat, atau statistik akun tanpa strategi key dan invalidasi yang benar. Cache API yang stale dapat membuat tampilan login, streak, jam mendengar, dan playlist publik terlihat tidak sinkron.

## Kontrak API dan backend

Endpoint backend harus mengembalikan shape yang stabil dan tidak mencampur `thumbnail`/`cover` untuk object yang sama tanpa dokumentasi. Minimal response search lagu harus menyediakan `videoId`, `title`, `artist`, `thumbnail`, dan `url`. Jika shape provider berubah, backend harus menormalkan sebelum response dikirim ke frontend.

Response error harus memiliki status HTTP yang benar dan tidak dianggap sebagai data lagu kosong. Frontend perlu membedakan tiga kondisi: loading, response sukses kosong, dan request gagal. Jangan mengganti queue dengan array kosong hanya karena satu request rekomendasi gagal.

## Checklist wajib sebelum commit

- [ ] Semua object lagu baru melewati `normalizeTrack()`.
- [ ] Semua identitas lagu menggunakan `trackId()`.
- [ ] Tidak ada entrypoint baru yang mengatur `S.ct` dan `loadTrack()` dengan urutan berbeda.
- [ ] Queue tidak berisi item tanpa `videoId`.
- [ ] Queue auto-next dideduplikasi dan tidak menimpa lagu aktif.
- [ ] Context menu menggunakan object row yang benar, bukan registry key global tunggal.
- [ ] Like, playlist, offline, share, lirik, dan Media Session mengacu pada ID yang sama.
- [ ] Error API tidak menghapus data lama atau menampilkan data lagu palsu.
- [ ] Request lama tidak boleh mengubah state setelah lagu berganti.
- [ ] `node --check` dijalankan pada seluruh file JS.
- [ ] `git diff --check` berhasil.
- [ ] Versi service worker dan asset dinaikkan bersama.

## Checklist smoke test browser

Uji minimal dilakukan di desktop dan Android, baik online maupun offline:

| Skenario | Hasil yang harus diverifikasi |
|---|---|
| Putar dari Home | Judul, artis, cover, audio, lirik, URL, mini-player, dan full-player merujuk lagu yang sama |
| Putar dari Search | Row aktif berpindah ke lagu yang dipilih dan menu titik tiga memakai lagu tersebut |
| Next dan Previous | Queue tetap sama, cover dan judul berubah bersamaan, tidak kembali ke Home secara tidak sengaja |
| Kontrol notifikasi | Next/previous tidak error dan tidak memakai metadata lagu sebelumnya |
| Album dan Artist | Queue berisi lagu yang tampil di halaman dan tidak kehilangan ID |
| Playlist publik | Lagu yang dipilih sama dengan lagu yang diputar; URL dan lirik ikut berubah |
| Like dan Playlist | Lagu yang disimpan sama dengan lagu yang diklik, bukan item lain dengan ID serupa |
| Download offline | Metadata dan file yang diputar berasal dari ID yang sama |
| Offline penuh | Setelah jaringan dimatikan, lagu yang memang diunduh dapat diputar tanpa request baru |
| Refresh Android | Asset terbaru muncul dan service worker lama tidak mengambil script lama |

## Perintah validasi yang disarankan

```bash
cd /home/ubuntu/MalaMusic

# Sintaks seluruh JavaScript
for f in public/*.js api/*.js server.js; do node --check "$f" || exit 1; done

# Spasi/patch rusak
git diff --check

# Cari object track manual dan referensi ID yang perlu ditinjau
grep -RIn --exclude-dir=node_modules -E 'id:.*videoId|video_id|S\.ct\s*=|S\.pl\s*=|loadTrack\(' public api

# Pastikan versi cache konsisten
grep -RIn -E 'sw\.js\?v=|CACHE_(STATIC|DATA)_NAME|\?v=[0-9]+' public/index.html public/sw.js

# Marker production setelah deploy
curl -fsSL 'https://music.malawalipayment.web.id/' | grep -Eo '/player\.js\?v=[0-9]+|/app\.js\?v=[0-9]+|/sw\.js\?v=[0-9]+' | sort -u
```

## Prioritas teknis berikutnya

Prioritas tertinggi adalah memusatkan seluruh entrypoint playback album dan artis pada satu fungsi transisi, lalu menambahkan `AbortController` atau request token pada resolver audio dan lirik. Prioritas kedua adalah migrasi cache offline dari URL streaming di localStorage ke binary audio di Cache Storage atau IndexedDB. Prioritas ketiga adalah membuat test browser otomatis untuk lima alur utama: Home, Search, Album, playlist publik, dan kontrol notifikasi.

## Status scan

Scan statis seluruh file `public/`, `api/`, `server.js`, `package.json`, `vercel.json`, dan service worker telah selesai. Seluruh JavaScript lolos `node --check` dan patch terakhir lolos `git diff --check`. Temuan utama dan risiko tersisa dicatat di laporan ini; scan ini tidak mengubah source code aplikasi selain membuat catatan laporan.
