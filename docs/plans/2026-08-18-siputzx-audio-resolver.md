# Siputzx audio-only resolver evaluation

## Scope

Provider yang diuji adalah `https://youtubedl.siputzx.my.id` menggunakan URL YouTube Music dan `type=audio`. Probe dijalankan dari sandbox pada 18 Agustus 2026 tanpa menyimpan file audio, tanpa mencetak signed URL, dan tanpa menggunakan premium API key.

## Evidence

| Stage | Result |
|---|---|
| `POST /akumaudownload` | HTTP 200; challenge dan difficulty diterima |
| Proof of Work | Berhasil diselesaikan secara bounded |
| `POST /cekpunyaku` | HTTP 200; session verification diterima |
| `GET /download?url=...&type=audio&apikey=` | Async job sempat `202 downloading 50%`, kemudian `200 completed` |
| Completed output | `fileUrl` tersedia; URL dinormalisasi relatif terhadap provider base URL |
| Audio validation | HTTP 206 untuk Range `bytes=0-65535` |
| MIME | `audio/mpeg` |
| Range length | 65536 bytes |

## Findings

Provider menghasilkan audio-only dan kompatibel secara dasar dengan pola `/api/proxy-audio`. Flow harus memakai cookie session yang konsisten dan menyertakan parameter `apikey=` kosong; tanpa parameter tersebut, probe pertama menerima HTTP 403 `Invalid session for this task`. Provider bersifat asynchronous, sehingga resolver production perlu membatasi polling dan mengembalikan status provider unavailable jika job tidak selesai dalam budget waktu function.

## Decision

Layak diuji sebagai resolver fallback audio-only, bukan langsung menggantikan SaveTube. Adapter perlu memakai native `fetch` dan cookie jar sederhana agar tidak menambah dependency, menghapus query fragment/secret dari log, membatasi URL ke YouTube/YouTube Music, memvalidasi hasil `fileUrl` ke hostname provider, serta mempertahankan `/api/proxy-audio` sebagai jalur browser.

## Residual risk

Tidak ada SLA terverifikasi dari provider pada probe ini. Endpoint dapat berubah, PoW dapat menjadi lebih berat, job dapat timeout, dan URL hasil dapat kedaluwarsa. Karena itu fallback harus dilindungi timeout, circuit breaker terpisah, rate limit, dan observability redacted.
