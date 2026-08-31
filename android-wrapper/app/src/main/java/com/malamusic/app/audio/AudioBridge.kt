package com.malamusic.app.audio

import android.app.Activity
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Handler
import android.os.Looper
import android.util.Base64
import android.util.Log
import android.webkit.JavascriptInterface
import java.net.URL
import kotlin.concurrent.thread

/**
 * JavaScript bridge that receives audio events from the web player
 * and forwards them to the Android MediaSession for notification controls.
 */
class AudioBridge(private val activity: Activity) {

    companion object {
        private const val TAG = "AudioBridge"
    }

    private val handler = Handler(Looper.getMainLooper())
    private var mediaService: MalaMediaService? = null

    fun setMediaService(service: MalaMediaService) {
        this.mediaService = service
    }

    @JavascriptInterface
    fun onPlay() {
        Log.d(TAG, "onPlay")
        handler.post { getMediaService()?.onPlay() }
    }

    @JavascriptInterface
    fun onPause() {
        Log.d(TAG, "onPause")
        handler.post { getMediaService()?.onPause() }
    }

    @JavascriptInterface
    fun onEnded() {
        Log.d(TAG, "onEnded")
        handler.post { getMediaService()?.onEnded() }
    }

    @JavascriptInterface
    fun onProgress(position: Double, duration: Double, paused: Boolean) {
        handler.post {
            getMediaService()?.updateProgress(position, duration, paused)
        }
    }

    @JavascriptInterface
    fun onTrackChanged(title: String, artist: String, coverUrl: String) {
        Log.d(TAG, "Track: $title - $artist")
        handler.post {
            getMediaService()?.updateTrack(title, artist, coverUrl)
        }
    }

    /**
     * Called by the MediaSession notification to control the web player.
     */
    fun performPlay() {
        activity.runOnUiThread {
            (activity as? MainActivity)?.webView
                ?.evaluateJavascript("window._malaNativePlay && window._malaNativePlay()", null)
        }
    }

    fun performPause() {
        activity.runOnUiThread {
            (activity as? MainActivity)?.webView
                ?.evaluateJavascript("window._malaNativePause && window._malaNativePause()", null)
        }
    }

    fun performNext() {
        activity.runOnUiThread {
            (activity as? MainActivity)?.webView
                ?.evaluateJavascript("window._malaNativeNext && window._malaNativeNext()", null)
        }
    }

    fun performPrevious() {
        activity.runOnUiThread {
            (activity as? MainActivity)?.webView
                ?.evaluateJavascript("window._malaNativePrev && window._malaNativePrev()", null)
        }
    }

    fun performSeekTo(position: Double) {
        activity.runOnUiThread {
            (activity as? MainActivity)?.webView
                ?.evaluateJavascript("window._malaNativeSeek && window._malaNativeSeek($position)", null)
        }
    }

    fun fetchCurrentTrack(callback: (TrackInfo?) -> Unit) {
        activity.runOnUiThread {
            (activity as? MainActivity)?.webView?.evaluateJavascript(
                "window._malaGetTrackInfo ? window._malaGetTrackInfo() : '{}'"
            ) { json ->
                try {
                    val cleaned = json?.removeSurrounding("\"")?.replace("\\\"", "\"") ?: "{}"
                    callback(parseTrackInfo(cleaned))
                } catch (e: Exception) {
                    callback(null)
                }
            }
        }
    }

    private fun parseTrackInfo(json: String): TrackInfo? {
        // Simple JSON parsing without external library
        return try {
            val title = extractJsonString(json, "title")
            val artist = extractJsonString(json, "artist")
            val cover = extractJsonString(json, "cover")
            val videoId = extractJsonString(json, "videoId")
            val duration = extractJsonDouble(json, "duration")
            val position = extractJsonDouble(json, "position")
            val playing = json.contains("\"playing\":true")

            TrackInfo(title, artist, cover, videoId, duration, position, playing)
        } catch (e: Exception) {
            null
        }
    }

    private fun extractJsonString(json: String, key: String): String {
        val pattern = "\"$key\"\\s*:\\s*\"([^\"]*?)\""
        val match = Regex(pattern).find(json)
        return match?.groupValues?.get(1) ?: ""
    }

    private fun extractJsonDouble(json: String, key: String): Double {
        val pattern = "\"$key\"\\s*:\\s*([\\d.]+)"
        val match = Regex(pattern).find(json)
        return match?.groupValues?.get(1)?.toDoubleOrNull() ?: 0.0
    }

    private fun getMediaService(): MalaMediaService? {
        return mediaService ?: MalaMediaService.instance
    }

    data class TrackInfo(
        val title: String,
        val artist: String,
        val coverUrl: String,
        val videoId: String,
        val duration: Double,
        val position: Double,
        val playing: Boolean
    )
}
