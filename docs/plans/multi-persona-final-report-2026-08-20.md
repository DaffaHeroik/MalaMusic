# Multi-Persona Product Loop — Final Report

## [ORIENT]

**Project:** MalaMusic (`/home/ubuntu/MalaMusic`)

**Tujuan user:** Memastikan MalaMusic menjadi web player bergaya Spotify yang stabil untuk playback audio-only, autentikasi, streak, library, leaderboard, playlist publik, Offline, dan Listen Together pada Android serta PC.

**Scope:** Home, Recently Played, Quick Picks, Search, Profile anonymous-state, login validation, Offline empty-state, Listen Together lobby dan auth boundary, stats listen validation, library/stats/Listen Together unauthenticated boundaries, resolver regression checks, queue/playback race guards, dan escaping input pencarian.

**Environment:** Ubuntu 24.04 sandbox, Node.js 22, Chromium sandbox browser dengan viewport sekitar 899×768, build lokal pada `http://127.0.0.1:3000/`, serta smoke HTTP non-destruktif terhadap `https://music.malawalipayment.web.id/`.

**Baseline commands:** `npm run lint`, `npm run build`, `npm run test:playback-race`, `npm run test:api-contract`, `npm run test:savetube-breaker`, `npm run test:siputzx-contract` — semuanya PASS. `git diff --check` juga PASS.

**Unavailable checks:** Authenticated cross-account Listen Together host/non-host command test dan playback audio end-to-end pada perangkat Android nyata. Deployment commit terbaru serta visual verification production sudah dilakukan setelah push ke `origin/main`; repository kini sinkron dengan remote.

**Persona:** Pengguna baru, pengguna normal, pengguna frustrasi/adversarial, QA/contract tester, reviewer UX/accessibility, dan security/privacy reviewer.

**Stop condition:** Tiga clean sessions lokal, automated checks relevan, dan deployment parity production tercapai untuk scope yang dapat diuji. Sign-off penuh masih menunggu authenticated flow lintas akun dan playback Android nyata.

## Executive summary

Multi-persona loop menemukan dan memperbaiki satu bug backend P1 pada pencatatan waktu dengar, yaitu payload `seconds` kosong atau nol yang sebelumnya dihitung sebagai satu detik. Regression guard baru memastikan input tersebut ditolak, sementara batas maksimum 120 detik tetap berlaku. Pada frontend, patch incremental memperbaiki ruang judul Quick Picks agar tidak tertekan oleh tombol play dan menu tiga titik, menyatukan copy CTA profil anonim, serta memperjelas tooltip Offline dan Listen Together. Sesi lokal pada Home, Profile, Search, dan input adversarial berhasil tanpa clipping, loading lock, atau eksekusi script yang terlihat. Smoke test produksi untuk endpoint authenticated tanpa cookie mengembalikan HTTP 401 dengan schema yang benar, sedangkan halaman Home dan leaderboard publik mengembalikan HTTP 200. Visual production verification setelah push juga menunjukkan Quick Picks, tooltip Offline, dan tooltip Listen Together sudah tersaji. Hasil akhir adalah **CONDITIONAL PASS**: patch sudah aktif di production dan seluruh pemeriksaan yang dapat dijalankan tanpa akun/device khusus lulus, tetapi authenticated cross-account serta playback audio nyata belum dapat diverifikasi dalam sesi ini.

## Journey and persona coverage

| Sesi | Persona/reviewer | Skenario utama | Temuan baru | Fix diverifikasi | Clean |
|---|---|---|---:|---|---|
| 1 | Pengguna baru | Home → Profil → Login form → Cari → Offline → Listen Together | QUICK-001, QUICK-002, UX-004, UX-005, ACCESS-001, QA-001, QA-002 | Ya, pada build lokal untuk item frontend | Tidak pada baseline; menjadi sumber triage |
| 2 | QA/security | Input auth invalid, endpoint tanpa cookie, invalid room, source boundary | SECURITY-001, BUG-001, UX-006, ACCESS-002 | BUG-001 fixed; boundary tanpa sesi verified-partial | Ya untuk cakupan yang tersedia |
| 3 | User normal lokal | Home → Profile → Search pada build commit terbaru | Tidak ada | CTA dan layout verified | Ya |
| 4 | User frustrasi/adversarial lokal | Query unicode dan `<script>alert(1)</script>` | Tidak ada | URL encoding dan output escaping terlihat benar | Ya |
| 5 | Independent verification | Lint, build, resolver/race/API tests, HTTP smoke production | Tidak ada regression baru | Semua automated checks PASS | Ya untuk automated/public boundary |

## [REVIEWER: TRIAGE]

| ID | Type | Severity | Confidence | Root cause | Blast radius | Priority | Status |
|---|---|---:|---|---|---|---:|---|
| QUICK-001 | UX | P2 | High | Ruang metadata kartu Quick Picks terlalu tertekan oleh gap dan kontrol kanan | Home desktop/mobile card layout | 3 | FIXED-LOCAL |
| QUICK-002 | UX | P2 | High | Menu Offline/Listen Together tidak menjelaskan konteks dan syarat secara langsung | Anonymous onboarding | 4 | FIXED-LOCAL |
| UX-004 | UX | P2 | High | CTA authenticated pada Profil tersebar dan copy berulang | Profile anonymous-state | 5 | FIXED-LOCAL |
| UX-005 | UX | P2 | High | Label Login/Daftar muncul pada beberapa area dengan wording berbeda | Profile navigation | 6 | FIXED-LOCAL |
| SECURITY-001 | SEC | P2 | Medium | Auth boundary sudah ada, tetapi host/non-host cross-account belum diuji | Listen Together commands | 1 | VERIFIED-PARTIAL |
| BUG-001 | BUG | P1 | High | Clamp `Math.max(1, ...)` dilakukan sebelum validasi durasi | Streak/listening hours integrity | 1 | FIXED + REGRESSION |
| ACCESS-001 | ACCESS | P2 | Medium | Focus behavior belum diuji penuh setelah memilih flow auth | Login keyboard flow | 7 | UNVERIFIED |
| ACCESS-002 | ACCESS | P2 | Medium | Focus ring/Tab order belum diaudit penuh lintas viewport | Social modal accessibility | 8 | UNVERIFIED |
| QA-001 | QA | P2 | Medium | Empty, domain, password, double-submit perlu cakupan formal | Auth form | 2 | PARTIAL; input boundary verified |
| QA-002 | QA | P2 | High | Server-side non-Gmail/password validation perlu dibuktikan | Auth endpoint | 2 | VERIFIED via production smoke |

**Deduplicated items:** QUICK-001 dan gejala judul tertutup oleh tiga titik diperlakukan sebagai satu akar masalah layout metadata. QUICK-002 dan UX-006 digabung sebagai anonymous feature explanation, tetapi status dilacak terpisah karena satu berada di navigasi dan satu di modal.

**New regression risk:** Perubahan Quick Picks diikuti oleh `renderActive()` dan diuji dengan syntax check, diff check, serta visual build lokal dan production. Risiko residual terbesar adalah authenticated social E2E dan playback device parity.

## [DEV: SESSION 1]

**BUG-001 — Invalid listening duration.** Root cause berada pada `api/stats.js`: durasi kosong atau nol diubah menjadi minimal satu detik sebelum validasi, sehingga request invalid dapat mengubah total waktu dengar. Fix menggunakan `requestedSeconds`, menolak nilai non-finite atau `<= 0`, lalu melakukan clamp maksimum 120 detik. Regression guard ditambahkan pada `tests/api-contract-check.js`. Status **FIXED**. Commit: `2d035b4`.

**QUICK-001, QUICK-002, UX-004, UX-005, UX-006.** `public/home.js` diberi layout metadata yang lebih aman; `public/profile.js` diberi copy CTA yang konsisten; `public/app.js` diberi tooltip Offline; `public/listen-together.js` diberi tooltip dan penjelasan bahwa login diperlukan untuk room. Status **FIXED-LOCAL**. Commit: `dc7d49f`.

**Dokumentasi evidence.** Issue ledger dan catatan verifikasi disimpan pada `docs/plans/multi-persona-session-1-findings.md`, dengan commit `c17ef2e` dan `e44a1ca`.

## [VERIFY: SESSION 1]

**Persona used:** Pengguna normal lokal.

**Replayed fixes:** Home Quick Picks dan Profile anonymous CTA. Kartu Quick Picks tampil dengan judul/artis dan tombol menu tanpa judul tertutup. Profile menampilkan “Masuk untuk menyimpan” serta “Mulai dengan akun Gmail”.

**Happy path:** PASS untuk Home → Profile → Search pada build lokal.

**Regression checks:** PASS untuk lint, build, playback race, API contract, SaveTube circuit breaker, Siputzx contract, syntax checks, dan `git diff --check`.

**Independent audit:** Offline dan Listen Together hint baru terdeteksi pada browser; tidak ada proses server lokal tersisa setelah cleanup.

**Clean streak:** 1 untuk sesi lokal setelah fix.

## [VERIFY: SESSION 2]

**Persona used:** User frustrasi/adversarial lokal.

**Replayed fixes:** Search diberi query unicode dan string payload-like `<script>alert(1)</script>`.

**Happy path:** PASS. URL memakai encoding, hasil tetap muncul, dan layout daftar stabil.

**Independent audit:** Judul metadata ditampilkan sebagai teks; tidak terlihat alert atau eksekusi script.

**Clean streak:** 2 untuk sesi lokal.

## [VERIFY: SESSION 3]

**Persona used:** QA/security reviewer.

**Replayed fixes:** Endpoint tanpa cookie, auth input invalid, invalid room recovery, dan regression suite.

**Happy path:** PASS untuk public Home dan leaderboard production, masing-masing HTTP 200. Endpoint authenticated `Listen Together create`, `stats listen`, dan `library PUT` tanpa cookie masing-masing HTTP 401 dengan schema error yang sesuai.

**Independent audit:** Auth login dengan non-Gmail dan password pendek menghasilkan HTTP 400 dengan pesan validasi yang tepat. Join room sintetis kembali dari state pending ke tombol normal. Tidak ada data sintetis yang tersimpan.

**Clean streak:** 3 untuk cakupan lokal/public boundary.

## Automated and manual checks

| Check | Command/method | Result | Limitation |
|---|---|---|---|
| Lint | `npm run lint` | PASS | Hanya memeriksa `public/app.js`; file lain diperiksa dengan `node --check` |
| Build | `npm run build` | PASS | Script build hanya placeholder karena vanilla JS |
| Playback race | `npm run test:playback-race` | PASS | Static guard, bukan audio device E2E |
| API contract | `npm run test:api-contract` | PASS | Static guards, bukan full integration suite |
| SaveTube breaker | `npm run test:savetube-breaker` | PASS | Tidak membuktikan availability provider jangka panjang |
| Siputzx contract | `npm run test:siputzx-contract` | PASS | Tidak membuktikan semua track dapat di-resolve |
| Production public smoke | `curl` Home/leaderboard | PASS, HTTP 200 | Tidak menguji authenticated state |
| Production auth boundary | `curl` tanpa cookie | PASS, HTTP 401/400 | Tidak menguji akun nyata atau cross-account room |
| Local visual Home/Profile/Search | Chromium, viewport 899×768 | PASS | Tidak mencakup Android device nyata |
| Adversarial search | Unicode + script-like input | PASS | Renderer lain perlu audit berkala |

## Residual risks and deferred work

Pertama, authenticated E2E dengan dua akun berbeda untuk memastikan hanya host yang dapat mengontrol room belum dapat dijalankan. Kedua, playback audio-only belum diverifikasi ulang di perangkat Android nyata setelah commit terbaru. Ketiga, keyboard focus penuh, responsive breakpoint tambahan, dan screen-reader semantics masih berstatus partial/unverified. Keempat, dokumen riset resolver lama masih untracked dan sengaja tidak dimasukkan ke commit audit karena tidak terkait langsung dengan patch sesi ini.

## [FINAL SIGN-OFF]

**Status: CONDITIONAL PASS.**

Reason: Automated checks, three clean local/public-boundary verification sessions, input boundary, source-level fixes, production Home/leaderboard HTTP checks, production auth boundary, repository synchronization, dan visual production parity semuanya pass. Patch sudah tersaji pada domain production. Sisa gate yang belum terbukti adalah authenticated cross-account Listen Together dan playback audio-only pada Android nyata.

Untuk mengubah CONDITIONAL PASS menjadi PASS penuh, jalankan authenticated smoke test dengan dua akun uji yang dapat dihapus, verifikasi host/non-host command Listen Together, lalu replay playback audio-only dan Listen Together pada PC serta Android. Tidak perlu membangun fitur baru sebelum residual verification ini selesai.

## [BRAINSTORM]

Brainstorming fitur baru sengaja **ditunda**. Bukti saat ini menunjukkan prioritas masih pada deployment parity, authenticated social E2E, dan audio verification; menambah fitur baru sebelum tiga area tersebut ditutup berisiko menyamarkan defect yang belum terverifikasi.

## Referensi internal

[1]: [Issue ledger dan bukti sesi](multi-persona-session-1-findings.md)

[2]: Commit UI/anonymous UX `dc7d49f`; reproduksi dengan `git show dc7d49f` di repository lokal.

[3]: Commit validasi stats `2d035b4`; reproduksi dengan `git show 2d035b4` di repository lokal.
