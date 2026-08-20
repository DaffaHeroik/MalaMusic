# Listen Together — Synchronization Fix Session

**Tanggal:** 20 Agustus 2026  
**Project:** MalaMusic  
**Commit deployment:** `209c633`  
**Production:** `https://music.malawalipayment.web.id/`  
**Status:** **CONDITIONAL PASS**

## Scope dan acceptance criteria

Sesi ini berfokus pada masalah dua perangkat/browser yang tidak mengikuti state room yang sama, peserta dapat memutar lagu sendiri, host action dari Library/Album/playlist publik tidak tersiar, command cepat saling menimpa, serta cache lama yang membuat browser menjalankan implementasi berbeda. Acceptance criteria yang dipakai adalah: host menjadi satu-satunya sumber command playback; follower tidak dapat mengubah track, queue, play/pause, next, previous, atau seek lewat seluruh permukaan UI; command host memakai version check atomik; perubahan jalur direct playback ikut dipublish; dan seluruh browser production mengambil asset versi baru.

## Root cause yang ditemukan

Akar masalah utama bukan satu bug audio resolver, tetapi **bypass authority pada beberapa jalur pemutaran**. Wrapper Listen Together sebelumnya hanya membungkus `PK`, `TP`, `NX`, `PV`, dan `SK`. Pemutaran dari context menu, Lagu Disukai, Library playlist, Album, shuffle album, dan playlist publik mengubah `S.ct` lalu memanggil `loadTrack()` langsung. Jalur tersebut dapat melewati guard follower dan, ketika dilakukan host, tidak selalu memanggil publish state.

Akar masalah kedua berada di backend command room. Pemeriksaan `expectedVersion` dilakukan setelah snapshot dibaca tetapi sebelum `ref.update()`. Dua request cepat dapat membaca version sama lalu sama-sama melakukan update, sehingga optimistic locking tidak benar-benar atomik.

Akar masalah ketiga adalah risiko cache parity. Index dan Service Worker masih menggunakan asset v97/v96, sehingga dua perangkat dapat memuat implementasi berbeda meskipun deployment sudah berubah.

## Perubahan yang diterapkan

| Area | Perubahan | File |
|---|---|---|
| Authority follower | Menambahkan `ListenTogether.blockFollowerAction()` dan menerapkannya pada seluruh direct playback path | `public/listen-together.js`, `public/player.js`, `public/library.js`, `public/album.js`, `public/app.js` |
| Host publishing | Menambahkan `syncAfterLocalAction()` setelah host memutar dari context menu, Library, Album, playlist publik, dan shared track | `public/player.js`, `public/library.js`, `public/album.js`, `public/app.js` |
| Backend concurrency | Mengganti command `ref.update()` dengan `ref.transaction()` dan optimistic `expectedVersion` check atomik; konflik dikembalikan sebagai HTTP 409 | `api/listen-together.js` |
| Cache parity | Menaikkan asset dan Service Worker ke v98; precache script juga v98 | `public/index.html`, `public/sw.js` |
| Regression guard | Menambahkan static contract test untuk transaction, authority guard, dan direct playback coverage | `tests/listen-together-sync-check.js`, `package.json` |

## Evidence yang dijalankan

| Pemeriksaan | Hasil | Evidence |
|---|---:|---|
| Syntax check backend dan seluruh file frontend terkait | PASS | `node --check` untuk `api/listen-together.js`, `listen-together.js`, `player.js`, `library.js`, `album.js`, `app.js`, `sw.js` |
| Lint | PASS | `npm run lint` |
| Playback race regression | PASS | `npm run test:playback-race` |
| API contract regression | PASS | `npm run test:api-contract` |
| SaveTube breaker regression | PASS | `npm run test:savetube-breaker` |
| Siputzx contract regression | PASS | `npm run test:siputzx-contract` |
| Listen Together sync regression | PASS | `npm run test:listen-together-sync` menghasilkan `LISTEN_TOGETHER_SYNC_STATIC_GUARD_PASS` |
| Diff whitespace check | PASS | `git diff --check` |
| Production asset parity | PASS | `listen-together.js?v=98` terdeteksi dari halaman production; `sw.js` mengembalikan `malamusic-static-v98` |
| Production Listen Together auth boundary | PASS | Request tanpa cookie mengembalikan HTTP 401 dengan pesan login yang benar |
| Production public endpoint | PASS | `/api/stats?action=leaderboard` mengembalikan HTTP 200 |
| Production browser launcher/modal | PASS | Launcher dan modal room v98 terlihat, input kode room dan tombol create/join tersedia |
| Production console setelah membuka modal | PASS | Tidak ada console output/error pada browser sandbox |

## Deployment

Commit `209c633` sudah dipush ke `origin/main`. Pipeline production menyajikan asset v98 pada domain custom. Worktree tetap bersih untuk file terkait perubahan; lima dokumen riset resolver lama tetap untracked dan sengaja tidak disentuh karena berada di luar scope sesi.

## Batas validasi lintas browser

Validasi authenticated dua-browser penuh belum dapat dinyatakan PASS dalam sesi ini. Browser sandbox yang tersedia tidak memiliki dua akun authenticated independen yang siap digunakan, sedangkan sesi otomasi browser terisolasi kedua tidak berhasil dibuka dalam batas waktu. Karena itu, saya **tidak mengklaim** bahwa host/non-host command Listen Together sudah terbukti secara manual pada dua browser nyata.

Yang sudah ditutup secara deterministik adalah semua jalur direct playback yang sebelumnya dapat bypass, race backend melalui transaction, dan cache divergence v97/v96. Untuk mengubah status menjadi PASS penuh, diperlukan dua sesi authenticated independen: browser A sebagai host dan browser B sebagai listener. Host harus diuji pada play, pause, seek, next, previous, context menu, Library, Album, playlist publik, dan shuffle; browser B harus tetap mengikuti setiap perubahan serta menolak kontrol lokal. Satu browser kemudian perlu diputuskan jaringan atau direfresh untuk menguji recovery dan rejoin.

## Residual risk

Residual risk saat ini adalah device/browser E2E authenticated dan autoplay policy pada perangkat Android nyata. Follower browser dapat memerlukan satu gesture pengguna agar audio mulai berjalan, tetapi state room tetap seharusnya tersinkron setelah gesture karena `enforceRemotePlayback()` melakukan koreksi posisi dan playing state. Risiko ini perlu dibuktikan di device nyata, bukan diasumsikan dari static test.

## Final sign-off

**CONDITIONAL PASS.** Patch sudah diimplementasikan, diuji melalui regression suite, dipush, tersaji dengan cache v98, dan production public/auth boundary lulus. Sign-off penuh sengaja ditahan hanya untuk authenticated cross-browser E2E dan playback Android nyata; tidak ada fitur baru yang perlu dibangun sebelum dua gate residual tersebut diuji.
