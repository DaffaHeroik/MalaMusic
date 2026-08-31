# 🎵 MalaMusic Android

Full native Android app untuk MalaMusic — built with Kotlin, Media3, and Material Design 3.

## Fitur

### ✅ Yang Udah Ada
- **Native Splash Screen** — Animated logo dengan rings + progress bar (kayak Spotify)
- **WebView + JS Bridge** — Load web app dengan bridge ke Android native
- **MediaSession + Notification** — Kontrol play/pause/next/prev dari notification & lock screen
- **Background Audio Service** — Audio tetap jalan walau app di-minimize
- **Deep Link Support** — Buka `/play/ID`, `/album/ID`, `/artist/ID` langsung dari URL
- **PWA Detection Fix** — WebView terdeteksi sebagai app, bukan browser
- **Dark Theme** — Material3 dark theme matching MalaMusic brand (#08090D)
- **Immersive Fullscreen** — Status bar + nav bar transparan
- **ProGuard** — Minified release build

### 🚧 Yang Belum (butuh effort native)
- Equalizer visualizer
- Cast/chromecast
- Widget Android
- Wear OS
- Android Auto

## Arsitektur

```
com.malamusic.app/
├── MalaMusicApp.kt          # Application + notification channel
├── ui/
│   ├── SplashActivity.kt    # Native splash screen
│   └── MainActivity.kt      # WebView + JS bridge
└── audio/
    ├── AudioBridge.kt        # JS → Android bridge
    └── MalaMediaService.kt   # MediaSession + notifications
```

## Build

### Prasyarat
- JDK 17+
- Android SDK (compileSdk 35, minSdk 26)
- Gradle 8.11+ (atau gunakan wrapper)

### Cara Build

```bash
cd android-wrapper

# Download Gradle wrapper (jika belum ada)
gradle wrapper --gradle-version 8.11.1

# Build debug APK
./gradlew assembleDebug

# APK ada di:
# app/build/outputs/apk/debug/app-debug.apk
```

### Install ke Device

```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## Cara Kerja

1. **Splash Screen** — App buka → SplashActivity → animated logo → pindah ke MainActivity
2. **WebView Load** — MainActivity load `music.malawalipayment.web.id` dengan JS bridge
3. **JS Bridge** — Web player kirim event (play/pause/trackChanged) ke Android via `MalaNativeBridge`
4. **MediaSession** — Android terima event → update notification + lock screen controls
5. **Notification Controls** — User tap play/pause/next di notification → Android kirim balik ke web player

## Perbedaan vs WebView Wrapper Lama

| Aspek | Wrapper Lama | App Baru |
|---|---|---|
| Splash Screen | ❌ Ga ada | ✅ Native animated |
| Media Controls | ❌ Ga ada | ✅ Notification + lock screen |
| Background Audio | ⚠️ Basic | ✅ Full MediaSession |
| PWA Detection | ❌ Ga detect | ✅ Inject sebagai installed |
| Deep Links | ❌ Ga support | ✅ Full support |
| Theme | ⚠️ Basic | ✅ Material3 Dark |
| ProGuard | ❌ No | ✅ Yes |

## Deployment

App ini load URL production dari `music.malawalipayment.web.id`. Jadi:
- Update web app → APK otomatis dapet versi baru
- Ga perlu rebuild APK tiap kali ada perubahan web
- Cuma rebuild kalau ada perubahan Android native code
