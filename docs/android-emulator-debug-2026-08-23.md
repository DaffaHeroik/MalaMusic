# Android Emulator Debug Environment — MalaMusic

**Tanggal:** 23 Agustus 2026  
**Status:** SDK dan AVD siap; emulator dapat dijalankan tetapi tanpa akselerasi KVM.

## Komponen terpasang

| Komponen | Hasil |
|---|---|
| Android command-line tools | Terpasang di `/home/ubuntu/android-sdk/cmdline-tools/latest` |
| Android Emulator | 37.1.11 |
| Android Platform Tools / ADB | 37.0.1 |
| Android Platform 35 | Terpasang |
| System image | `system-images;android-35;google_apis;x86_64` |
| AVD | `malamusic-api35` |
| Helper environment | `/home/ubuntu/android-env.sh` |

## Cara menjalankan ulang

```bash
source /home/ubuntu/android-env.sh
emulator -avd malamusic-api35 -no-window -no-audio -gpu swiftshader_indirect -accel off -no-snapshot -no-boot-anim
```

Pada terminal lain:

```bash
source /home/ubuntu/android-env.sh
adb devices
adb -s emulator-5554 shell getprop ro.build.version.release
```

Untuk membuka MalaMusic production:

```bash
adb -s emulator-5554 shell am start -a android.intent.action.VIEW \
  -d 'https://music.malawalipayment.web.id/'
```

Untuk menghubungkan Chrome Android ke CDP:

```bash
adb -s emulator-5554 forward tcp:9222 localabstract:chrome_devtools_remote
curl http://127.0.0.1:9222/json/list
```

## Hasil pengujian

Chrome pada emulator berhasil membuka tab MalaMusic dan CDP berhasil membaca halaman. Service Worker live terdeteksi pada `sw.js?v=127`. Media Session metadata berhasil terbaca dengan judul `Jiwa Yang Bersedih`, artis, dan tiga artwork.

Audio proxy juga berhasil ter-resolve dan memiliki `readyState: 4` serta durasi `278.219229` detik. Namun, pemutaran melalui click sintetis/CDP tidak dihitung sebagai user gesture oleh Chrome sehingga status audio tetap paused. Tap ADB juga belum menghasilkan playback yang dapat dibuktikan karena software-rendered emulator sangat lambat dan screenshot hanya menghasilkan frame hitam.

## Blocker lingkungan

Pemeriksaan `emulator -accel-check` menghasilkan:

```text
/dev/kvm is not found: VT disabled in BIOS or KVM kernel module not loaded
```

Akibatnya emulator berjalan dengan TCG/software emulation, memakai sekitar satu core CPU penuh dan belum cocok untuk sesi debug interaktif yang stabil. Ini adalah keterbatasan sandbox/virtualisasi, bukan error aplikasi MalaMusic.

## Kesimpulan

Semua komponen untuk menjalankan emulator sudah terpasang dan AVD siap dipakai ulang. Validasi Media Session metadata berhasil. Validasi notification shade Android, lock-screen control, dan natural-end auto-next belum dapat dinyatakan lulus karena emulator tidak memiliki KVM dan tidak menyelesaikan sesi interaktif dengan cukup stabil.

Untuk verifikasi penuh, jalankan setup yang sama pada komputer Linux/Windows dengan hardware virtualization aktif, atau gunakan Android Emulator dengan `/dev/kvm` tersedia. Alternatif tanpa perangkat fisik kedua adalah Android Studio Emulator di laptop pengguna, bukan sandbox ini.
