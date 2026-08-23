# Laporan Debug Langsung MalaMusic di Android Emulator

**Tanggal:** 23 Agustus 2026  
**AVD:** `malamusic-api35`  
**Android:** API 35 / Android 15  
**Mode:** Chrome Android melalui CDP dan input emulator  
**Production URL:** https://music.malawalipayment.web.id/

## Hasil terverifikasi

| Skenario | Hasil | Bukti |
|---|---|---|
| AVD boot dan ADB | PASS | `emulator-5554 device`, Android 15 terdeteksi |
| Chrome membuka MalaMusic | PASS | Tab MalaMusic tersedia melalui Chrome remote debugging |
| Service Worker | PASS | `sw.js?v=127` terdeteksi |
| Resolver audio | PASS | Audio proxy `readyState: 4`, durasi `278.219229` detik |
| Media Session web | PASS | Metadata judul, artis, dan 3 artwork terbaca |
| Playback melalui CDP | PASS | `audio.play()` menghasilkan `paused: false` |
| Auto-next smoke test | PASS | Event natural-end dipicu setelah posisi audio mendekati akhir; judul berubah ke track berikutnya, audio baru `readyState: 4`, `paused: false`, Media Session `playing` |
| Background playback | PASS | Sebelum lock `currentTime: 28.728778`; setelah layar dikunci 8 detik `currentTime: 45.22136`, audio tetap `paused: false`, Media Session `playing` |
| Android system MediaSession | BLOCKED | `dumpsys media_session` masih menunjukkan `Sessions Stack - have 0 sessions` |
| Screenshot/UI emulator | BLOCKED | Frame capture hitam karena software rendering |

## Diagnosis

Playback, auto-next, dan background playback berhasil dibuktikan pada tab Chrome Android melalui CDP. Auto-next tidak berhenti pada perubahan judul saja; audio track berikutnya benar-benar memiliki source proxy baru, `readyState: 4`, dan kembali berjalan.

Media Session API pada halaman juga berfungsi. Metadata web dapat dibaca dan state berubah menjadi `playing`. Akan tetapi, Android framework tidak mendaftarkan sesi Chrome pada `dumpsys media_session`. Penyebab lingkungan yang paling mungkin dan terukur adalah emulator berjalan tanpa KVM/hardware virtualization serta menggunakan software emulation, bukan kegagalan resolver atau player MalaMusic.

Pemeriksaan akselerasi menghasilkan:

```text
/dev/kvm is not found: VT disabled in BIOS or KVM kernel module not loaded
```

Emulator memakai sekitar satu core CPU penuh dan rendering/UI screenshot tidak stabil. Karena itu, notification shade, lock-screen control, dan tombol media sistem Android belum bisa diklaim teruji penuh dari sandbox ini.

## Artefak dan cara mengulang

SDK berada di `/home/ubuntu/android-sdk`, AVD berada di `/home/ubuntu/.android/avd/malamusic-api35.avd`, dan environment helper berada di `/home/ubuntu/android-env.sh`.

```bash
source /home/ubuntu/android-env.sh
emulator -avd malamusic-api35 -gpu swiftshader_indirect -accel off -no-snapshot -no-boot-anim
```

CDP Chrome:

```bash
adb -s emulator-5554 forward tcp:9222 localabstract:chrome_devtools_remote
curl http://127.0.0.1:9222/json/list
```

## Kesimpulan

Sesi debug langsung berhasil memverifikasi **auto-next dan background playback** di Chrome Android Emulator. Kontrol media melalui Media Session web juga berjalan pada level halaman. Validasi notifikasi Android pada level SystemUI tetap **terblokir oleh keterbatasan KVM/software rendering**, bukan oleh bug aplikasi yang terbukti.
