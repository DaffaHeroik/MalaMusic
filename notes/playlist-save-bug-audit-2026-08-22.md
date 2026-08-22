# Audit Bug Save Playlist — 22 Agustus 2026

## Reproduksi production

Pada `https://music.malawalipayment.web.id/`, sebuah playlist sintetis dengan format external saved (`id=saved_PL_TEST123`, `source=youtube`, `name=Playlist Uji Simpan`) dimasukkan ke localStorage untuk mengisolasi rendering dari backend. Data tetap ada setelah membuka Koleksi: `getUserPlaylists()` mengembalikan satu item dan `Library.matches` juga mengembalikan satu item.

Namun DOM `#view-library` hanya berisi wrapper kartu kosong. Penyebab langsung ada di `public/library.js` baris renderer playlist. Baris pembuka kartu diakhiri string literal tanpa operator `+`, sehingga JavaScript melakukan automatic semicolon insertion; string inner card berikutnya dieksekusi sebagai expression yang hasilnya dibuang. Akibatnya cover, nama playlist, creator, bookmark, dan tombol putar tidak pernah muncul di tab Koleksi walaupun data sudah tersimpan.

## Fix

Menambahkan operator `+` pada akhir string pembuka kartu playlist di `public/library.js`. `node --check public/library.js` dan `git diff --check` lulus.

## Dampak

Bug terutama terlihat pada `My Saved Playlist`/tab Playlists. Home dapat tetap menampilkan sebagian playlist karena renderer Home memiliki concatenation berbeda. Persistence localStorage bukan akar masalah untuk gejala tampilan ini. Sinkronisasi backend tetap perlu divalidasi pada akun login setelah deployment.
