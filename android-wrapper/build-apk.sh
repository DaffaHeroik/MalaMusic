#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
SDK="/home/ubuntu/android-sdk"
BT="/usr/lib/android-sdk/build-tools/debian"
ANDROID_JAR="/usr/lib/android-sdk/platforms/android-23/android.jar"
R8="/home/ubuntu/android-build-tools/r8.jar"
BUILD="$ROOT/build"
rm -rf "$BUILD/classes" "$BUILD/dex" "$BUILD/generated" "$BUILD/res" "$BUILD/base.apk" "$BUILD/aligned.apk" "$BUILD/MalaMusic-debug.apk"
mkdir -p "$BUILD/classes" "$BUILD/dex" "$BUILD/generated" "$BUILD/res"
"$BT/aapt2" compile --dir "$ROOT/res" -o "$BUILD/res/resources.zip"
"$BT/aapt2" link -o "$BUILD/base.apk" \
  --manifest "$ROOT/AndroidManifest.xml" \
  -I "$ANDROID_JAR" \
  --java "$BUILD/generated" \
  --min-sdk-version 24 \
  --target-sdk-version 35 \
  --version-code 1 \
  --version-name 1.0-debug \
  "$BUILD/res/resources.zip"
find "$ROOT/src" "$BUILD/generated" -name '*.java' -print0 | xargs -0 javac -source 8 -target 8 -cp "$ANDROID_JAR" -d "$BUILD/classes"
jar cf "$BUILD/classes.jar" -C "$BUILD/classes" .
java -cp "$R8" com.android.tools.r8.D8 --min-api 23 --lib "$ANDROID_JAR" --output "$BUILD/dex" "$BUILD/classes.jar"
mkdir -p "$BUILD/apkroot"
unzip -q -o "$BUILD/base.apk" -d "$BUILD/apkroot"
cp "$BUILD/dex/classes.dex" "$BUILD/apkroot/classes.dex"
(cd "$BUILD/apkroot" && zip -q -r -0 "$BUILD/unsigned.apk" .)
"$BT/zipalign" -f 4 "$BUILD/unsigned.apk" "$BUILD/aligned.apk"
KEYSTORE="$ROOT/debug.keystore"
if [ ! -f "$KEYSTORE" ]; then keytool -genkeypair -v -keystore "$KEYSTORE" -storepass android -alias androiddebugkey -keypass android -dname 'CN=Android Debug,O=MalaMusic,C=ID' -keyalg RSA -keysize 2048 -validity 10000 >/dev/null 2>&1; fi
"$BT/apksigner" sign --ks "$KEYSTORE" --ks-pass pass:android --key-pass pass:android --out "$BUILD/MalaMusic-debug.apk" "$BUILD/aligned.apk"
"$BT/apksigner" verify --verbose "$BUILD/MalaMusic-debug.apk" | tail -8
ls -lh "$BUILD/MalaMusic-debug.apk"
