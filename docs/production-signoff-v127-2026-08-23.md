# MalaMusic — Production Sign-off v127

**Tanggal pemeriksaan:** 23 Agustus 2026 (UTC+8)  
**Project:** MalaMusic  
**Production:** [music.malawalipayment.web.id](https://music.malawalipayment.web.id/)  
**Branch/commit:** `main` / `a3055cd` (`fix: trigger prefetch for recent track cards`)  
**Status:** **Selesai pada ruang lingkup yang dapat diverifikasi — CONDITIONAL PASS**

## [ORIENT]

Tujuan pemeriksaan ini adalah memastikan optimasi first-play v127 benar-benar aktif di production, tidak tertahan oleh Service Worker lama, serta tetap lulus pemeriksaan playback, resolver, playlist, offline, listen-together, dan kontrak API yang tersedia di repository. Fokus browser mencakup desktop Chromium sandbox; validasi perangkat Android fisik tidak tersedia dalam sesi ini.

Repository yang digunakan adalah sumber kebenaran. Perubahan dilakukan inkremental. Perubahan kerja pengguna yang sudah ada di `notes/` dan `docs/plans/` tidak dihapus atau ditimpa.

## [USER: User Normal / SESSION 1]

Production berhasil dimuat pada domain custom dengan halaman home, Recently Played, Listening Streak, navigasi Koleksi/Disukai/Offline, dan tombol Dengarkan bersama. Pada pemeriksaan awal, controller Service Worker masih menunjuk ke `sw.js?v=126`, sedangkan asset aplikasi sudah v127. Ini adalah risiko cache propagation yang nyata karena worker lama dapat menahan cache statis sebelumnya.

Pemeriksaan source menemukan dua masalah pada jalur intent-prefetch. Nama cache statis Service Worker masih `malamusic-static-v125`, dan selector event prefetch belum mencakup kartu home yang memakai `App.autoPlayTrack(...)`.

## [REVIEWER: TRIAGE]

| ID | Severity | Temuan | Root cause | Status |
|---|---:|---|---|---|
| PERF-127 | P1 | Cache statis tidak ikut berotasi ke v127 | `public/sw.js` masih mendeklarasikan `malamusic-static-v125` | **FIXED** |
| PERF-128 | P1 | Recently Played tidak memperoleh prefetch saat pointerover/touchstart | Selector `prefetchFromIntent()` hanya mencari `PK(...)` dan `Album.playSong(...)` | **FIXED** |
| QA-127 | P2 | Pengukuran full-duration auto-next pada perangkat fisik tidak dapat dilakukan di sandbox | Keterbatasan environment browser, bukan error yang teramati | **UNVERIFIED / LIMITATION** |
| QA-128 | P2 | Uji dua perangkat Listen Together dan Android fisik belum dapat diselesaikan | Hanya satu browser sandbox tersedia pada sesi ini | **UNVERIFIED / LIMITATION** |

## [DEV: SESSION 1]

Pada `public/sw.js`, nama cache statis dinaikkan dari `malamusic-static-v125` menjadi `malamusic-static-v127`. Registrasi worker pada `public/index.html` telah menggunakan query `sw.js?v=127`, sehingga keduanya sekarang konsisten.

Pada `public/player.js`, `trackFromIntentElement()` ditambahkan dukungan parsing `App.autoPlayTrack('videoId')`, memakai snapshot Recently Played jika tersedia dan fallback track minimal berbasis `videoId`. Selector `prefetchFromIntent()` juga diperluas untuk menemukan elemen `App.autoPlayTrack`.

Dua commit production yang relevan adalah `22e6a60` untuk rotasi cache dan `a3055cd` untuk selector prefetch. Commit terakhir `a3055cd291130723232309dbca687431d208cabe` terdeteksi oleh deployment Vercel sebagai target `production` dengan state `READY`.

## [VERIFY: SESSION 2]

### Automated checks

| Pemeriksaan | Hasil |
|---|---|
| `node --check public/player.js` | PASS |
| `node --check server.js` | PASS |
| `git diff --check` | PASS |
| Album playlist contract | PASS |
| API contract static guard | PASS |
| Listen Together sync static guard | PASS |
| Playback race static guard | PASS |
| Playback source policy | PASS |
| Saved playlist snapshot | PASS |
| SaveTube circuit breaker | PASS |
| Siputzx audio contract | PASS |

### Production browser checks

Production memuat `player.js?v=127`, `miniplayer.js?v=127`, `fullplayer.js?v=127`, dan `app.js?v=127`. Setelah deployment terakhir, `navigator.serviceWorker.controller.scriptURL` terverifikasi sebagai `https://music.malawalipayment.web.id/sw.js?v=127`.

Uji pointerover pada kartu Recently Played kedua dilakukan setelah cache URL track dibersihkan. Hasil aktual: `cached: true`, `prefetched: true`, `inFlight: false`. Ini membuktikan resolver audio dipanggil sebelum tap dan elemen audio prefetch berhasil dibuat.

Uji playback nyata pada `Jiwa Yang Bersedih` menghasilkan audio proxy aktif dengan `readyState: 4`, `paused: false`, `currentTime: 18.60`, `duration: 278.22`, dan `failed: false` setelah menunggu resolver. URL audio berasal dari `/api/proxy-audio`, bukan video player.

Cover Recently Played dan metadata artist/album tampil di production. Listening Streak juga terlihat sebagai `2 hari berturut-turut` pada sesi akun browser yang tersedia.

## [FINAL SIGN-OFF]

| Dimensi | Rating | Evidence dan batasan |
|---|---:|---|
| Functional correctness | 8.5/10 | Playback production berhasil; regression contracts lulus. Full auto-next natural-end belum diuji sampai lagu selesai. |
| UX and accessibility | 8.0/10 | Home, navigasi, cover, dan player terlihat; audit Android fisik belum tersedia. |
| Reliability | 8.5/10 | Resolver retry/watchdog, cache URL, offline validator, playlist hydration, dan worker rotation tersedia serta test terkait lulus. |
| Security and privacy | 8.0/10 | Tidak ada secret baru pada patch; audit autentikasi penuh bukan ruang lingkup perubahan ini. |
| Performance | 9.0/10 | Prefetch intent production terukur aktif; cache hit dan prefetch berhasil sebelum tap. |
| Maintainability | 8.5/10 | Patch kecil, terlokalisasi, syntax dan seluruh test tersedia lulus. |
| Operations and deployment | 8.5/10 | Commit terdorong ke `main` dan deployment Vercel terbaru berstatus READY. |

**Clean streak terverifikasi:** satu sesi baseline/fix dan satu sesi verifikasi independen pada browser production, ditambah automated regression suite lulus. Gate tiga clean sessions lintas tiga persona belum dapat diklaim karena keterbatasan satu browser sandbox dan tidak adanya perangkat Android fisik pada sesi ini.

### Kesimpulan

Perbaikan first-play v127 sekarang lebih lengkap: bukan hanya Quick Picks/playlist, tetapi juga kartu Recently Played yang paling sering menjadi titik masuk pengguna. Akar masalah cache worker lama juga sudah diperbaiki. Playback audio live telah terbukti berjalan pada production dan resolver tidak berhenti di state `Menyiapkan` pada uji yang dilakukan.

### Sisa risiko dan langkah berikutnya

Validasi yang masih **UNVERIFIED**, bukan dinyatakan gagal, adalah auto-next setelah durasi penuh, kontrol notifikasi Android di perangkat fisik, dan sinkronisasi Listen Together antara dua browser/device nyata. Pengujian ini memerlukan dua sesi browser atau perangkat yang dapat dipertahankan selama playback berlangsung; tidak ada perubahan kode tambahan yang diperlukan berdasarkan bukti sesi ini.

Repository memiliki perubahan kerja pengguna yang tidak terkait pada `notes/` dan `docs/plans/`; perubahan tersebut sengaja dibiarkan dan tidak dimasukkan ke commit patch ini.

## References

[1]: https://music.malawalipayment.web.id/ "MalaMusic production"
[2]: https://github.com/DaffaHeroik/MalaMusic/commit/a3055cd291130723232309dbca687431d208cabe "MalaMusic commit a3055cd"
[3]: https://vercel.com/daffaheroiks-projects/malamusic "MalaMusic Vercel project"
