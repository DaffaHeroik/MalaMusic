# Area MalaMusic yang Masih Rawan Bug

Tanggal scan: 2026-08-17.

## Prioritas risiko

| Prioritas | Area | Dampak | Kemungkinan | Rekomendasi |
|---|---|---|---|---|
| P0 | Offline audio | Lagu dianggap tersimpan, tetapi URL stream dapat kedaluwarsa atau tidak tersedia tanpa jaringan | Tinggi | Simpan binary audio di Cache Storage/IndexedDB dan uji dengan jaringan benar-benar mati |
| P0 | HTML dinamis dari API | Judul, artis, cover, atau URL yang masuk ke `innerHTML` dapat menyebabkan tampilan rusak atau XSS jika tidak di-escape di setiap jalur | Sedang–tinggi | Gunakan DOM/textContent atau satu helper escape untuk semua field sebelum interpolasi |
| P1 | Playback entrypoint terduplikasi | Album, Artist, share link, dan direct play masih membuat object track serta mengatur state player sendiri | Tinggi | Buat satu fungsi `playTrackFromQueue()` dan gunakan normalizer di semua entrypoint |
| P1 | Race condition fetch | Home, Artist, Album, Search, lirik, dan audio dapat menyelesaikan request lama setelah pengguna berpindah halaman/lagu | Tinggi pada jaringan lambat | Tambahkan `AbortController` atau request sequence di setiap modul async |
| P1 | Listen Together | Polling satu detik dapat menerima state stale; host adalah satu-satunya pengendali dan belum ada konflik multi-host atau presence heartbeat | Sedang | Tambahkan server timestamp/clock offset, command sequence, heartbeat, dan reconnect backoff |
| P1 | Service worker API cache | Cache network-first dapat menyimpan response endpoint yang bersifat user-specific seperti sesi, statistik, atau state room | Sedang | Jangan cache endpoint auth, room, statistik pribadi, dan response yang memiliki cookie |
| P1 | Streaming provider | Endpoint YouTube eksternal dapat timeout, berubah format, terkena rate limit, atau mengembalikan URL audio yang cepat kedaluwarsa | Sedang–tinggi | Validasi response backend, retry terbatas, timeout terukur, rate limit, dan fallback yang jelas |
| P2 | localStorage | JSON rusak, quota penuh, atau data lama tanpa `videoId` dapat membuat playlist/liked/offline gagal render | Sedang | Tambahkan schema version, migrasi, validasi array, deduplikasi, dan penanganan `QuotaExceededError` |
| P2 | Statistik dan streak | Flush berkala dapat gagal saat tab ditutup atau jaringan mati; pengiriman ulang dapat menduplikasi hitungan | Sedang | Gunakan idempotency key per interval dan `navigator.sendBeacon` saat pagehide |
| P2 | Session/auth | Cookie custom perlu rotasi secret dan pemeriksaan TTL; login UI masih bergantung pada environment Firebase Admin | Sedang | Pastikan secret production tersedia, rotasi terencana, dan gunakan Firebase session cookie resmi bila siap |
| P2 | Service worker update | Pengguna yang lama offline dapat terus memakai cache lama sebelum online kembali | Sedang | Tampilkan update prompt, gunakan `skipWaiting` terkontrol, dan tampilkan versi runtime di debug panel |
| P3 | UI responsive | Banyak modal/fixed element menggunakan z-index dan posisi bottom yang berpotensi menutupi kontrol Android | Sedang | Uji viewport Android kecil, safe-area, keyboard, dan landscape |
| P3 | Media Session | Dukungan handler berbeda antar-browser; `setPositionState` dapat melempar error pada duration/position yang tidak valid | Rendah–sedang | Clamp nilai dan lakukan capability test per handler |
| P3 | Room cleanup | Room Firebase hanya dibersihkan ketika dibaca setelah TTL; room yang tidak pernah dibaca dapat menumpuk | Rendah saat traffic kecil | Tambahkan scheduled cleanup atau TTL index melalui backend |

## Temuan teknis penting

### Offline belum sama dengan file audio permanen
`pwa_audio_cache` menyimpan URL hasil resolver audio di localStorage. URL tersebut bukan binary audio dan dapat kadaluarsa. Service worker juga hanya menangani request GET, sementara resolver audio menggunakan POST ke `/api/ytplay`. Karena itu, keberhasilan metadata tersimpan tidak menjamin audio dapat dimainkan tanpa jaringan.

### Beberapa jalur masih membuat track manual
Queue Album dan Artist sudah diperbaiki pada patch terakhir, tetapi `app.js` masih membuat track manual pada `autoPlayTrack()` dan `renderPopup()`, sementara Album import dan beberapa jalur share juga melakukan serialisasi sendiri. Setiap jalur tersebut dapat kembali memunculkan perbedaan `thumbnail`/`cover`, `url`/`ytUrl`, atau ID.

### Race condition masih mungkin terjadi di halaman data
Fetch Home, Artist, Album, Search, public playlist, lirik, dan rekomendasi tidak semuanya mempunyai token request. Jika pengguna cepat berpindah halaman atau memilih beberapa lagu, callback lama dapat mengisi UI atau metadata dari konteks sebelumnya. Player audio sudah memiliki `audioLoadSequence`, tetapi perlindungan itu belum menjadi pola umum semua modul.

### Risiko interpolasi HTML
Aplikasi banyak menggunakan `innerHTML` dengan data API. Sebagian jalur memakai `es()`, tetapi tidak semua atribut URL, cover, title, dan artist melalui satu sanitization layer. `renderPopup()` dan beberapa row renderer perlu diaudit khusus. Perbaikan paling aman adalah membuat elemen dengan `textContent`, `setAttribute` yang tervalidasi, serta hanya mengizinkan protocol `https:` untuk gambar/URL eksternal.

### Cache API perlu dipisahkan dari cache asset
Service worker menggunakan network-first untuk seluruh `/api/` dan menyimpan response sukses ke cache data. Ini baik untuk API publik yang memang boleh stale, tetapi berisiko untuk endpoint yang bergantung pada cookie atau room. Endpoint `/api/email-auth`, `/api/stats`, `/api/streak`, dan `/api/listen-together` sebaiknya dikecualikan dari cache.

## Urutan perbaikan yang disarankan

Pertama, perbaiki cache offline binary audio dan kecualikan endpoint user-specific dari service worker cache. Kedua, pusatkan semua pembuatan track dan playback ke normalizer serta satu fungsi transisi. Ketiga, tambahkan request token pada Home, Album, Artist, Search, dan lirik. Keempat, audit semua interpolasi `innerHTML` dan URL. Kelima, tingkatkan Listen Together dengan sequence/heartbeat dan pengiriman timestamp yang lebih presisi. Setelah itu, baru kerjakan schema migration localStorage dan optimasi statistik.

## Status verifikasi

Semua JavaScript yang discan lolos `node --check`, dan patch repository terakhir lolos `git diff --check`. Laporan ini adalah pemetaan risiko, bukan perubahan source code aplikasi. Area P0 dan P1 sebaiknya diperlakukan sebagai backlog wajib sebelum penambahan fitur besar berikutnya.
