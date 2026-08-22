# Uji Google OAuth Production — 22 Agustus 2026

Production `https://music.malawalipayment.web.id` memakai `authDomain=auth.music.malawalipayment.web.id` dan tombol `EmailAuth.googleLogin()` aktif.

Uji langsung dari browser sandbox berhasil memicu Google OAuth. Google mengenali sesi `daffaheroik2020@gmail.com`, tetapi menghentikan alur dengan:

`Error 400: redirect_uri_mismatch`

Redirect URI yang ditolak secara eksplisit adalah:

`https://auth.music.malawalipayment.web.id/__/auth/handler`

OAuth client yang dipakai teridentifikasi sebagai client Identity Platform untuk project `heroikzre` (ID publik tercantum di URL error, secret tidak dicatat). Google Cloud Console kemudian terbuka dengan sesi akun `daffaheroik2020@gmail.com`, tetapi daftar Credentials masih loading dan belum ada perubahan konfigurasi.

Kesimpulan: implementasi frontend dan custom domain berjalan sampai tahap Google authorization; blocker tersisa adalah mendaftarkan URI tersebut pada OAuth 2.0 Client ID di Google Cloud Console. Ini tidak dapat diselesaikan hanya melalui Firebase CLI/API.

## Percobaan setelah perubahan

Google Cloud Console menampilkan notifikasi `OAuth client saved` setelah URI custom ditambahkan. Uji ulang dari production tetap mengembalikan `Error 400: redirect_uri_mismatch` dengan URI custom yang sama. Console memberi catatan bahwa perubahan dapat memerlukan beberapa menit hingga beberapa jam untuk berlaku. Sesi Google yang dipakai tetap `daffaheroik2020@gmail.com`.
