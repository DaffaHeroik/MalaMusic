# SaveTube circuit breaker deployment review

Tanggal: 2026-08-18
Commit: `c9e2db3`

## Perubahan

- Menambahkan `api/savetube-circuit-breaker.js` dengan state `CLOSED`, `OPEN`, dan `HALF_OPEN`.
- Memasang breaker per CDN SaveTube pada `api/ytplay.js`.
- Threshold: 3 kegagalan; cooldown: 60 detik.
- Menambahkan response code `UPSTREAM_UNAVAILABLE` atau `UPSTREAM_CIRCUIT_OPEN` tanpa mengubah response sukses.
- Menambahkan `tests/savetube-circuit-breaker-check.js` dan npm script.

## Automated checks

- `node --check api/ytplay.js`: PASS
- `node --check api/savetube-circuit-breaker.js`: PASS
- `npm run test:savetube-breaker`: PASS
- `npm run test:api-contract`: PASS
- `npm run test:playback-race`: PASS
- `npm run build`: PASS (project tidak memerlukan build)
- `git diff --check`: PASS

## Production smoke

Request POST production ke `/api/ytplay` untuk `UQ8cXH7qbVU` setelah deploy menghasilkan HTTP 503 dan response code `UPSTREAM_UNAVAILABLE` pada request awal. Pada pengujian berulang, request keempat menghasilkan `UPSTREAM_CIRCUIT_OPEN`, membuktikan state breaker aktif pada instance yang menangani request tersebut.

Empat request tercatat sekitar 11,12 s; 11,29 s; 14,50 s; dan 11,12 s. Durasi production tidak dapat dipakai sebagai bukti fast-fail murni karena Vercel dapat merutekan request ke instance berbeda, cold start, dan memiliki latency edge. Unit test membuktikan transisi state dan penolakan probe ganda secara deterministik.

## Residual risk

State breaker masih in-memory per instance Vercel. Ia tidak global dan dapat reset saat cold start. SaveTube upstream masih down pada waktu pengujian, sehingga circuit breaker mengurangi retry dan memberi error yang lebih jelas tetapi tidak mengembalikan playback sampai upstream pulih atau resolver fallback ditambahkan.
