# Production sync check

Tanggal pemeriksaan: 2026-08-17.

Production `https://music.malawalipayment.web.id/?sync-check=1` berhasil memuat halaman utama setelah splash. Daftar Quick Picks, Popular Playlists, Top Artists, navigasi, dan tombol opsi lagu tampil. Quick Picks yang terlihat: Jangan Paksa Rindu (Beda), Aku Dah Lupa, Gadis Manis Kalimantan, Kasih Tau Mama (Malam Minggu), Masa ini, Nanti, dan Masa Indah Lainnya, serta Kicau Mania.

Temuan teknis dari source: `fetchAutoNextRecommendations()` memasukkan hasil API mentah langsung ke `S.pl`, sehingga item rekomendasi berikutnya bisa memiliki `thumbnail`/field berbeda dari item yang sedang ditampilkan. Jalur playlist publik juga sebelumnya langsung memakai object backend tanpa normalisasi dan tidak menjalankan reset/loading/lirik/URL seperti jalur playback lain. Registry menu titik tiga sebelumnya hanya memakai satu key berupa video ID dan dapat tertimpa oleh render halaman lain untuk lagu yang sama.

Patch yang sudah diterapkan di workspace: fungsi `normalizeTrack()` dan `trackId()`, normalisasi rekomendasi auto-next, token per-instance untuk `trackContextRegistry`, serta normalisasi dan reset state lengkap pada `playPublicPlaylist()`. Belum dideploy sampai semua pengujian selesai.
