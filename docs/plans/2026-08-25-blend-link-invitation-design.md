# Desain Undangan Blend Berbasis Link

## Tujuan

Pengguna yang sedang membuat Blend dapat membagikan link undangan kepada pengguna lain. Penerima tidak harus sudah login saat membuka link. MalaMusic menyimpan konteks undangan secara lokal, mengarahkan penerima ke login/daftar, lalu mengembalikan penerima ke link yang sama setelah session server terbentuk.

## Alur pengguna

1. Pengundang membuat Blend seperti alur saat ini dan mendapatkan URL `https://music.malawalipayment.web.id/blend/<kode>`.
2. Pengundang menekan **Bagikan link undangan**. Tombol menyalin URL dan menyediakan Web Share API bila tersedia.
3. Penerima membuka URL. Jika belum login, halaman menampilkan penjelasan bahwa login diperlukan, menyimpan path undangan di `sessionStorage`, dan membuka panel login Google/Gmail.
4. Setelah Google popup/redirect atau login Gmail berhasil, aplikasi memanggil `Blend.resumePendingInvite()`. Penerima kembali ke `/blend/<kode>` dan melihat detail invitation.
5. Penerima memilih **Gabung Blend** atau **Nanti**. Hanya akun yang ditetapkan oleh pengundang yang dapat bergabung. Jika link telah kedaluwarsa, room tidak ditemukan, atau akun tidak sesuai, aplikasi menampilkan pesan yang dapat ditindaklanjuti.
6. Setelah join, room Blend aktif ditampilkan dan link dapat dibagikan lagi oleh anggota yang berwenang.

## Keputusan keamanan

Link membawa kode room yang tidak memuat identitas, email, atau token session. Cookie session tetap HttpOnly dan tidak pernah ditaruh di URL. Backend tetap menjadi sumber kebenaran untuk pemeriksaan `invitedUid`, keanggotaan aktif, TTL room, dan status room. Karena requirement meminta link dikirim kepada orang tertentu, link tidak mengubah aturan backend menjadi join publik.

## Perubahan komponen

`api/blend.js` tetap mempertahankan action `state`, `join`, `invite`, dan `create`, tetapi response `state` perlu membedakan kebutuhan login secara konsisten. `public/blend.js` menambah pembuatan URL share, Web Share fallback, state invitation, dan resume setelah login. `public/app.js` menambahkan guard route `/blend/` sebelum pemanggilan state, serta hook resume setelah `EmailAuth.finishGoogleLogin()` dan login Gmail selesai. `public/profile.js` memicu resume setelah session backend sukses. `public/index.html` menaikkan marker asset agar browser dan service worker menerima perubahan baru.

## Acceptance criteria

| Kriteria | Hasil yang diharapkan |
| --- | --- |
| Link dapat dibagikan | URL berformat `/blend/<kode>` disalin atau dibagikan tanpa error |
| Penerima belum login | Melihat invitation/login prompt; kode tidak hilang |
| Login Google popup | Setelah sukses, kembali ke link dan invitation muncul |
| Login Google redirect/mobile | Setelah sukses, kembali ke link dan invitation muncul |
| Login Gmail/password | Setelah sukses, kembali ke link dan invitation muncul |
| Join | Hanya penerima yang diundang dapat menjadi member aktif |
| Penolakan/nanti | Modal tertutup tanpa membuat perubahan room |
| Link salah/kedaluwarsa | Error jelas dengan tombol kembali atau coba lagi |
| Regression | Blend existing create/join/add, User Search, playback, dan automated checks tetap lulus |
| Privacy | Tidak ada email/token Firebase/session di URL atau teks share |

## Hasil validasi awal

Pada browser lokal tanpa session, route `/blend/TESTV132` menampilkan modal **Login untuk melihat invitation**. `sessionStorage` berisi `{"room":"TESTV132","path":"/blend/TESTV132",...}`. Menekan **Login / Daftar** membuka panel autentikasi Google/Gmail dan modal invitation tetap terlihat; konteks room tidak hilang. Login nyata belum dijalankan pada fixture lokal karena belum ada akun penerima khusus untuk operasi tersebut.

## Hasil validasi production

Custom domain `music.malawalipayment.web.id` menyajikan `MALA_SW_VERSION = 'v132'`, `blend.js?v=132`, dan `sw.js?v=132`. Pada sesi production yang sudah login, route room sintetis `/blend/TESTV132` menampilkan modal **Link Blend tidak ditemukan** dengan tombol **Tutup**, bukan blank state atau loading tanpa akhir. Ini mengonfirmasi deployment v132 dan error handling route.

## Hasil fixture invitation UI

Route lokal `/blend/MOCK132` menampilkan modal **Login untuk melihat invitation** pada browser anonim. Ini digunakan sebagai fixture aman karena room tidak dibuat di Firebase. Hasil visual menunjukkan CTA **Login / Daftar**, tombol **Nanti**, dan pesan bahwa link akan dipulihkan setelah autentikasi.

## Hasil fixture authenticated invitation

Dengan response state sintetis yang hanya disuntikkan di browser, modal menampilkan label **Kamu mendapat undangan**, judul **Blend Daffa + Nisa**, chip anggota/pengundang, jumlah lagu awal, serta CTA **Tolak** dan **Gabung Blend**. Tidak ada request write ke server pada tahap membuka invitation.

## Hasil fixture join

Dengan response join sintetis, klik **Gabung Blend** menghasilkan toast **Kamu sudah bergabung ke Blend** dan modal berubah menjadi **Blend Kolaboratif** dengan dua anggota, satu lagu, tombol **Bagikan link undangan**, refresh, serta daftar lagu. Tidak ada operasi write ke Firebase selama fixture ini.
