# MalaMusic Production Review Report

**Tanggal:** 18 Agustus 2026

**Iterasi review:** Tiga scan bersih berturut-turut setelah perbaikan, dilanjutkan satu validasi final deployment.

## Ringkasan eksekutif

MalaMusic telah melewati review produksi berulang untuk alur autentikasi Gmail-only, Firebase Admin, proxy audio, sinkronisasi library, Listen Together, statistik, PWA cache, dan dokumentasi deployment. Temuan critical dan warning yang teridentifikasi pada batch pertama telah diperbaiki, diuji secara sintaks, diperiksa terhadap audit dependency, dan dipublikasikan melalui GitHub ke Vercel.

Deployment pertama dari batch tersebut sempat mengalami `FUNCTION_INVOCATION_FAILED` karena `firebase-admin@14.2.0` membawa `jwks-rsa@4`/`jose@6` yang tidak dapat dimuat oleh bundle CommonJS Vercel. Runtime log digunakan untuk menemukan penyebabnya; Firebase Admin kemudian dipin ke `13.6.0`, yang berhasil dimuat, tetap menghasilkan `npm audit` tanpa vulnerability, dan membuat deployment berikutnya sehat.

## Status deployment

| Item | Status |
|---|---|
| Repository | `DaffaHeroik/MalaMusic` pada branch `main` |
| Review batch commit | `f211bad` |
| Runtime compatibility fix | `ca9dd52` |
| Final verification commit | `be20832` |
| Live URL | [`https://music.malawalipayment.web.id`](https://music.malawalipayment.web.id) |
| Firebase Auth domain | [`https://auth.music.malawalipayment.web.id`](https://auth.music.malawalipayment.web.id) |
| Latest Vercel deployment | `dpl_G9fWAH9rRBprnS8rUVteuGKxuTfL` |
| Latest deployment state | `READY`, target `production` |
| Frontend cache version | `v79` |

Browser verification terhadap custom domain berhasil memuat halaman Home dan menampilkan navigasi Beranda, Cari, Leaderboard, Koleksi, Disukai, Offline, Dengar bersama, dan Profil & Akun. Pemeriksaan HTTP juga memastikan HTML dan service worker v79 merespons `200 OK`.

## Temuan yang diperbaiki

| Level | Temuan | Perbaikan |
|---|---|---|
| Critical | Pemeriksaan rate-limit ganda pada auth email. | Branch duplikat dihapus dan alur validasi dipertahankan satu kali. |
| Critical | Redirect proxy audio menggunakan `app._router.handle` secara rekursif. | Diganti dengan follow redirect maksimal satu hop, hanya HTTPS, dan hanya host media yang diizinkan. |
| Critical | Dynamic share metadata memasukkan query string langsung ke HTML. | Judul, deskripsi, URL, dan gambar di-escape; gambar share dibatasi ke URL HTTPS. |
| Warning | API key YouTube Music dan Firebase Web API key memiliki fallback di source. | Endpoint server menggunakan environment variable eksplisit; Firebase browser key tetap berada pada konfigurasi publik Firebase sebagai client configuration. |
| Warning | Firebase Admin dependency memiliki vulnerability transitive. | `firebase-admin@13.6.0` digunakan karena kompatibilitas Vercel CommonJS; `uuid` di-override ke `>=11.1.1`; audit menghasilkan `0 vulnerabilities`. |
| Warning | `rateBuckets.clear()` menghapus seluruh rate limit sekaligus. | Diganti selective eviction untuk bucket kedaluwarsa dan entri paling lama. |
| Warning | Cache URL audio tidak memiliki batas maksimum. | Cache dibersihkan berdasarkan TTL dan dibatasi 500 entri. |
| Warning | Session library dapat memverifikasi dengan secret kosong pada kondisi tertentu. | Verifikasi sekarang fail-closed jika `SESSION_SECRET` tidak tersedia. |
| Warning | Internal statistics worker dapat dipanggil dengan secret kosong. | `MALAMUSIC_INTERNAL_SECRET` wajib tersedia sebelum request worker dikirim. |
| Warning | Error upstream dikirim mentah ke client. | Search, lyrics, dan transcribe mengembalikan pesan generik serta mencatat detail hanya di server. |
| Warning | README dan Vercel proxy route tidak sesuai dengan arsitektur terbaru. | Dokumentasi diperbarui ke Vercel/Firebase; route proxy Firebase lama dihapus. |
| Warning | Cache frontend masih v78. | Semua script, service worker registration, precache asset, dan nama static cache dinaikkan ke v79. |

## Validasi yang berhasil

| Pemeriksaan | Hasil |
|---|---|
| `node --check` untuk JavaScript API/server | Lulus |
| `git diff --check` | Lulus |
| `npm audit --omit=dev --audit-level=moderate` | `found 0 vulnerabilities` |
| Firebase Admin CommonJS load test | Lulus dengan `firebase-admin@13.6.0` |
| Secret/unsafe-pattern scan | Bersih |
| Raw exception response scan | Bersih |
| Stale v78 marker scan | Bersih |
| Scan review #1 | Bersih |
| Scan review #2 | Bersih |
| Scan review #3 | Bersih |
| Browser custom-domain verification | Lulus setelah runtime fix |
| Vercel final deployment | `READY` |

## Konfigurasi operasional yang wajib dipastikan

Kode sudah menolak konfigurasi produksi yang tidak aman, tetapi nilai rahasia tidak dibaca atau dicetak ke dalam laporan. Pastikan variabel berikut tersedia di Vercel Production Environment: `SESSION_SECRET`, Firebase Admin credentials melalui `FIREBASE_SERVICE_ACCOUNT_JSON` atau tiga split variables, `FIREBASE_DATABASE_URL`, `FIREBASE_WEB_API_KEY`, `YOUTUBE_MUSIC_API_KEY`, `MALAMUSIC_INTERNAL_SECRET`, dan `CRON_SECRET`. Endpoint statistik publik juga bergantung pada `MALAMUSIC_STATS_WORKER_URL` yang benar.

Alur login Google, daftar Gmail, reset password, verification email, sinkronisasi database, dan Listen Together tetap memerlukan pengujian dengan akun yang benar-benar login. Pengujian browser yang dilakukan pada review ini memverifikasi pemuatan production shell dan routing utama, bukan memasukkan kredensial pengguna.

## Tindakan keamanan yang harus dilakukan pengguna

Cloudflare Global API Key yang pernah ditempelkan ke percakapan harus segera **direvoke dan diganti** melalui Cloudflare Dashboard. Jangan memasukkan token baru ke repository, catatan audit, atau chat. Jika token Resend, service-account Firebase, atau kredensial OAuth pernah digunakan di luar secret manager atau pernah dibagikan, lakukan rotasi yang sama dan perbarui hanya environment variable Vercel.

> Status akhir: **SIAP secara kode dan deployment, dengan konfigurasi secret production serta end-to-end auth test sebagai prasyarat operasional.**
