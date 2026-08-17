# Pemetaan Status Login VPS MalaMusic

**Terakhir divalidasi:** 17 Agustus 2026.

Catatan ini menyimpan status platform saja. **Password, access token, authorization code, dan file credential mentah tidak disimpan.**

## VPS 1 — 43.159.32.194

- OS: Ubuntu 22.04.5 LTS
- User yang dipakai: `ubuntu`
- Firebase CLI: **sudah login** sebagai `daffaheroik2020@gmail.com`
- Firebase project yang berhasil diakses: `heroikzre` — `Malawali Account`
- Cloudflare Wrangler: **sudah login**; akun Cloudflare `Daffaheroik2020@gmail.com's Account`
- GitHub CLI: **belum login**
- Vercel CLI: **belum login**

## VPS 2 — 139.162.178.20

- OS: Ubuntu 24.04.4 LTS
- Hostname: `localhost`
- User yang dipakai: `root`
- GitHub CLI: **sudah login** sebagai `DaffaHeroik`
- Vercel CLI: **sudah login** sebagai `daffaheroik`
- Firebase CLI: **belum selesai login**; CLI sudah dipasang dan sedang menunggu authorization code pada sesi Firebase login
- Cloudflare Wrangler: **belum login**

## Tool yang tersedia

### VPS 1

- Git, Node.js, npm, pnpm, Firebase CLI, Vercel CLI, GitHub CLI, dan Wrangler terpasang.

### VPS 2

- Git `2.43.0`
- Node.js `22.23.1`
- npm `10.9.8`
- pnpm `11.22.0`
- Firebase CLI `15.27.0`
- Vercel CLI `54.18.1`
- GitHub CLI `2.45.0`
- Wrangler `4.113.0`

## Target sinkronisasi aman

Kondisi target kedua VPS adalah Firebase, GitHub, Vercel, dan Cloudflare masing-masing tervalidasi aktif. Sinkronisasi dilakukan melalui login OAuth ulang pada VPS yang belum memiliki akses; **jangan menyalin file credential mentah antar-VPS**.
