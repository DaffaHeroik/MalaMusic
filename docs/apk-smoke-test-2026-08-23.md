# MalaMusic APK Build dan Smoke Test

**Tanggal:** 23 Agustus 2026  
**Project:** MalaMusic  
**APK:** `android-wrapper/build/MalaMusic-debug.apk`  
**Package:** `com.malamusic.app`  
**Target SDK:** 35  
**Minimum SDK:** 24

## Build

| Tahap | Hasil |
|---|---|
| Android wrapper WebView | Berhasil dibuat |
| Java compile | Berhasil dengan JDK 21 |
| D8/R8 dexing | Berhasil menggunakan R8 8.2.42 |
| aapt2 resource packaging | Berhasil |
| zipalign | Berhasil |
| APK signing | Berhasil; v2 dan v3 verified |
| APK install parse | Berhasil setelah target SDK dan resources.arsc diperbaiki |

## Wrapper behavior

Wrapper native memuat `https://music.malawalipayment.web.id/?apk-debug=smoke`, mengaktifkan JavaScript, DOM storage, cookies, WebView remote debugging, media playback, dan konfigurasi lifecycle/rotasi dasar. Activity `com.malamusic.app/.MainActivity` berhasil didaftarkan dan APK berhasil diterima oleh Package Manager pada satu percobaan instalasi.

## Smoke test emulator

| Skenario | Status | Bukti |
|---|---|---|
| AVD Android 15 API 35 boot | PASS/PARTIAL | ADB `device` dan `sys.boot_completed=1` terdeteksi |
| APK signing dan parsing | PASS | `apksigner verify`: v2=true, v3=true |
| Instal APK | PASS | `adb install --no-incremental -r`: Success |
| Package path | PASS | `/data/app/.../com.malamusic.app.../base.apk` terdeteksi |
| Launch activity | PASS/PARTIAL | Monkey menjalankan package dan activity native menjadi resumed |
| WebView first draw | BLOCKED | Emulator menampilkan Android splash/blank karena SystemUI/WebView software-rendering tidak stabil |
| Production WebView navigation | BLOCKED | Network emulator `Network is unreachable`; DNS/network tidak tersedia pada sesi APK |
| Playback/auto-next dari APK | BLOCKED | WebView APK tidak memperoleh halaman/network stabil untuk menjalankan flow |
| Notification/MediaSession Android | BLOCKED | SystemUI ANR dan tidak ada sesi media sistem yang dapat dibaca |
| APK smoke dari Chrome Android | PASS | Pengujian sebelumnya pada Chrome Android membuktikan playback, auto-next, dan background playback |

## Root cause blocker

Emulator tidak memiliki `/dev/kvm` dan berjalan dengan software emulation. Selain lambat, sesi terakhir mencatat `Application Not Responding: com.android.systemui` serta `Network is unreachable` dari guest Android. Karena itu kegagalan full smoke APK tidak boleh disimpulkan sebagai bug wrapper atau backend MalaMusic tanpa emulator yang memiliki hardware virtualization dan jaringan guest yang normal.

## Cara menjalankan ulang

```bash
source /home/ubuntu/android-env.sh
cd /home/ubuntu/MalaMusic/android-wrapper
./build-apk.sh
adb install -r build/MalaMusic-debug.apk
adb shell monkey -p com.malamusic.app 1
```

## Kesimpulan

**APK debug berhasil dibangun, ditandatangani, dan dipasang.** Native activity berhasil dibuat serta diluncurkan. Full smoke test fitur belum dapat dinyatakan lulus karena emulator sandbox mengalami blocker jaringan guest, SystemUI ANR, dan software rendering tanpa KVM. Validasi fitur web production tetap PASS dari Chrome Android pada sesi sebelumnya, tetapi itu bukan pengganti full smoke APK native.
