# MalaMusic ProGuard Rules

# Keep WebView JavaScript interface
-keepclassmembers class com.malamusic.app.audio.AudioBridge {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep Media3
-keep class androidx.media3.** { *; }
-dontwarn androidx.media3.**

# Keep Kotlin coroutines
-keep class kotlinx.coroutines.** { *; }

# Keep JavaScript interface methods
-keepattributes JavascriptInterface
-keepattributes *Annotation*

# Don't warn about missing classes
-dontwarn javax.annotation.**
-dontwarn org.jetbrains.annotations.**
