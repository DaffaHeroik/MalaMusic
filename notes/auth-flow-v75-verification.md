# Auth Flow v75 Verification

Production `music.malawalipayment.web.id/?auth-flow=v75` memuat asset `profile.js?v=75` melalui deployment v75. Pada Profil & Akun, layar pilihan baru menampilkan hierarchy yang lebih jelas: `Lanjutkan dengan Google`, divider `atau dengan Gmail`, dua kartu `Masuk` dan `Buat akun`, lalu `Lupa password?` sebagai aksi sekunder. Keterangan Gmail-only tampil di bagian bawah.

Klik `Masuk` membuka form khusus `Login dengan Gmail` yang hanya berisi tombol kembali, label Email Gmail, input email, label Password, tombol `Masuk ke MalaMusic`, dan `Lupa password?`. Tombol Google tidak diulang di dalam form. Form Daftar memakai jalur yang sama dengan field nama opsional dan tombol `Buat akun MalaMusic`. Tidak ada runtime error yang tampak selama navigasi.

Commit source: `979bd9b`. Cache: `malamusic-static-v75`.

Klik `Buat akun` kembali ke state pilihan lalu membuka form `Daftar dengan Gmail` dengan field terurut: Nama tampilan opsional, Email Gmail, Password, dan tombol `Buat akun MalaMusic`. Jalur registrasi tidak menampilkan ulang tombol Google, sehingga pilihan metode tidak bercampur dengan form.
