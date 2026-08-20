# Multi-Persona Session 1 — Pengguna Baru

Tanggal: 2026-08-20
Environment: https://music.malawalipayment.web.id/

## Observasi

Halaman utama berhasil dimuat setelah splash screen. Navigasi utama terlihat: Beranda, Cari, Leaderboard, Koleksi, Disukai, Offline, dan Dengarkan bersama. Home menampilkan kategori mood, Listening Streak, Recently Played, Quick Picks, Popular Playlists, dan Top Artists.

Status anonim dijelaskan melalui kartu "Login untuk mulai menjaga streak" dan tombol Login. Empty/anonymous state tidak membuat request statistik menjadi error di UI.

## Temuan awal

1. QUICK-001 / UX-P2: Beberapa judul pada Quick Picks dan Recently Played terpotong secara visual pada viewport desktop karena kartu dan metadata sempit. Perlu diverifikasi pada mobile.
2. QUICK-002 / UX-P2: Label menu "Dengar bersama" dan "Offline" tampil sebagai fitur utama meskipun pengguna anonim belum diberi penjelasan singkat tentang syarat login atau cara kerja fitur.
3. QUICK-003 / UX-P2: Tombol Login pada kartu streak dan tombol Profil sama-sama tersedia; ini berpotensi membingungkan tetapi belum dianggap defect sebelum flow login diuji.

## Baseline checks

Lint, build, playback race, API contract, SaveTube circuit breaker, dan Siputzx contract semuanya PASS.

## Observasi Profil anonim

Profil memiliki dua jalur login yang jelas: Google dan Gmail/password, serta tombol Lupa password. Profil juga menampilkan streak, jam mendengar, playlist publik, koleksi, dan aktivitas terbaru.

4. UX-004 / P2: Profil anonim menampilkan banyak kartu fitur authenticated (jam mendengar, playlist publik, koleksi), tetapi sebagian hanya memberi teks "Login untuk..." tanpa CTA langsung pada kartu. Pengguna harus kembali ke panel login di atas.
5. UX-005 / P2: Dua label "Login atau Daftar" muncul pada area profil, satu di panel auth dan satu di kartu koleksi. Ini masih usable, tetapi terasa repetitif.
6. ACCESS-001 / P2: Alur login tampak menggunakan tombol/card tanpa field fokus terlihat pada state awal; perlu menguji keyboard/fokus setelah memilih Masuk atau Buat akun.

## Form login

Form login menampilkan field email dan password dengan label, placeholder, batas Gmail, tombol submit, dan Lupa password. Layout desktop terlihat rapi pada viewport 899x768 dan tidak ada clipping pada form.

7. QA-001 / P2 / UNVERIFIED: Belum diuji submit kosong, domain non-Gmail, password pendek, double-submit, dan pemulihan error karena memerlukan interaksi form lebih lanjut.

## Validasi login

Submit kosong menghasilkan pesan "Gunakan alamat Gmail yang valid (@gmail.com)." Input sintetis test@example.com dan password short tetap mempertahankan pesan domain Gmail sebelum submit; validasi sisi client terlihat aktif.

8. QA-002 / P2 / UNVERIFIED: Perlu submit input non-Gmail secara eksplisit untuk memastikan server tidak menerima bypass client-side dan pesan password pendek tidak tertutup oleh validasi domain.

## Navigasi Cari

Halaman Cari memuat input pencarian, quick chips artis, dan kelompok Rilis Anyar/Barat Top/Rapp Top. Saat transisi, skeleton loading terlihat; hasil halaman kemudian tersedia pada ekstraksi konten. Perlu menguji pencarian aktual, empty query, dan hasil nol.

## Persona frustrasi/QA: Offline dan Listen Together

Menu Offline sebagai anonim memuat cepat, menampilkan status Online, kapasitas storage, empty state, dan tombol Cari Lagu. Tidak ditemukan loading loop atau pesan error.

Lobby Listen Together sebagai anonim terbuka dan menjelaskan model audio lokal per perangkat. Kontrak UI menampilkan Buat Room dari Lagu Sekarang serta input kode room. Endpoint backend tetap wajib login; pesan login belum terlihat pada lobby sebelum tindakan submit.

9. UX-006 / P2: Lobby anonim menampilkan action room sebelum menjelaskan syarat autentikasi; jika pengguna menekan Buat Room, feedback login perlu dipastikan actionable.
10. SECURITY-001 / P1 / UNVERIFIED: Boundary backend Listen Together terlihat memeriksa mm_session dan host authorization dari source, tetapi perlu smoke test HTTP tanpa cookie dan command dari non-host sebelum ditutup.

## Perbaikan sesi

- public/home.js: mengurangi gap kartu Quick Picks, memberi min-width pada judul, mempertahankan overflow-hidden pada renderActive, dan menghapus margin ekstra pada tombol play agar menu tiga titik tidak menekan judul.
- public/profile.js: menyatukan copy CTA anonymous menjadi "Masuk untuk menyimpan" dan "Mulai dengan akun Gmail".
- public/app.js: menambahkan tooltip/aria-label penjelasan Mode Offline.
- public/listen-together.js: menambahkan tooltip/aria-label penjelasan buat atau gabung room.

## Verifikasi lokal

node --check public/home.js, profile.js, listen-together.js; npm run lint; test:playback-race; test:api-contract; test:savetube-breaker; test:siputzx-contract; dan git diff --check semuanya PASS.

## Accessibility spot-check

Lobby Listen Together memiliki tombol close, tombol create, input kode room, dan tombol join yang semuanya terdeteksi sebagai elemen interaktif. Fokus keyboard dapat dipindahkan, tetapi browser annotation tidak menampilkan indikator fokus secara eksplisit; ini dicatat sebagai observasi, bukan defect terverifikasi.

11. ACCESS-002 / P2 / UNVERIFIED: Perlu audit keyboard penuh dengan urutan Tab dan pemeriksaan kontras/focus ring pada perangkat Android/PC sebelum sign-off.

## Invalid room recovery

Kode sintetis BADROOM diterima inputnya dan tombol berubah menjadi "Menghubungkan...". Respons akhir belum diamati pada saat pencatatan ini; issue recovery tetap UNVERIFIED sampai state kembali dari pending dan pesan error terlihat.

## Hasil lanjutan QA/security

Smoke test produksi tanpa cookie terhadap POST /api/listen-together?action=create, POST /api/stats?action=listen, dan PUT /api/library semuanya mengembalikan HTTP 401 dengan schema JSON yang sesuai. Tidak ada data sintetis yang tersimpan.

Join BADROOM pada browser kembali dari "Menghubungkan..." ke tombol normal, sehingga tidak ada pending lock yang teramati. Pesan toast error bersifat transient dan tidak tertangkap oleh ekstraksi halaman; kualitas copy error masih perlu verifikasi visual khusus.

SECURITY-001 diturunkan dari P1/UNVERIFIED menjadi P2/VERIFIED-PARTIAL untuk boundary tanpa sesi; otorisasi host command masih belum diuji dengan dua akun authenticated berbeda.

## Temuan backend dari QA

12. BUG-001 / P1 / confidence tinggi / FIXED: api/stats.js sebelumnya menghitung payload seconds kosong atau nol sebagai 1 detik karena Math.max(1, ...), sehingga endpoint listen dapat menerima input invalid dan menambah total waktu. Root cause berada pada urutan clamp sebelum validasi. Fix mengganti menjadi requestedSeconds yang diverifikasi finite dan >0, lalu clamp maksimum 120 detik. Regression guard ditambahkan ke tests/api-contract-check.js.

Evidence fix: node --check api/stats.js; node --check tests/api-contract-check.js; test:api-contract; test:playback-race; test:savetube-breaker; test:siputzx-contract; dan git diff --check semuanya PASS. Commit: 2d035b4.

## Auth input boundary production

POST /api/email-auth?action=login dengan test@example.com dan not-an-email mengembalikan HTTP 400 serta pesan Gmail valid. synthetic.invalid@gmail.com dengan password short mengembalikan HTTP 400 serta pesan password minimal 8 karakter. Tidak ada akun atau data yang dibuat.
