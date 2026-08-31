#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "🎵 MalaMusic Android Build"
echo "=========================="

# Check for Java
if ! command -v java &>/dev/null; then
    echo "❌ Java not found. Install JDK 17:"
    echo "   sudo apt install openjdk-17-jdk"
    exit 1
fi

echo "☕ Java: $(java -version 2>&1 | head -1)"

# Use Gradle wrapper if available, otherwise system Gradle
if [ -f "./gradlew" ]; then
    chmod +x ./gradlew
    GRADLE="./gradlew"
elif command -v gradle &>/dev/null; then
    GRADLE="gradle"
else
    echo "❌ Gradle not found. Options:"
    echo "   1. Install: sudo snap install gradle --classic"
    echo "   2. Download wrapper: gradle wrapper --gradle-version 8.11.1"
    exit 1
fi

echo "🔨 Building with: $GRADLE"
echo ""

# Clean and build debug APK
$GRADLE clean assembleDebug --no-daemon --stacktrace

APK_PATH="app/build/outputs/apk/debug/app-debug.apk"

if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(ls -lh "$APK_PATH" | awk '{print $5}')
    echo ""
    echo "✅ Build successful!"
    echo "📱 APK: $ROOT/$APK_PATH"
    echo "📦 Size: $APK_SIZE"
    echo ""
    echo "Install on device:"
    echo "   adb install -r $APK_PATH"
else
    echo ""
    echo "❌ Build failed. Check output above."
    exit 1
fi
