package com.malamusic.app.audio

import android.app.Notification
import android.app.PendingIntent
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.net.Uri
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.RemoteViews
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService
import androidx.media3.ui.PlayerNotificationManager
import com.malamusic.app.MalaMusicApp
import com.malamusic.app.R
import com.malamusic.app.ui.MainActivity
import java.net.URL
import kotlin.concurrent.thread

/**
 * Background media service with MediaSession integration.
 * Provides Android notification controls (play/pause/next/prev) and
 * lock screen controls for the web player's audio.
 */
@UnstableApi
class MalaMediaService : MediaSessionService() {

    companion object {
        private const val TAG = "MalaMediaService"
        private const val NOTIFICATION_ID = 1
        private const val CHANNEL_ID = MalaMusicApp.NOTIFICATION_CHANNEL_ID
        private const val MEDIA_SESSION_TAG = "MalaMusic"

        var instance: MalaMediaService? = null
            private set
    }

    private var mediaSession: MediaSession? = null
    private var bridge: AudioBridge? = null
    private var currentTitle = "Lagu"
    private var currentArtist = "MalaMusic"
    private var currentCoverUrl = ""
    private var currentDuration = 0.0
    private var currentPosition = 0.0
    private var isPlaying = false
    private var coverBitmap: Bitmap? = null

    override fun onCreate() {
        super.onCreate()
        instance = this
        Log.d(TAG, "MediaService created")
        createMediaSession()
    }

    private fun createMediaSession() {
        val player = object : Player {
            override fun getApplicationLooper() = android.os.Looper.getMainLooper()
            override fun addListener(listener: Player.Listener) {}
            override fun removeListener(listener: Player.Listener) {}
            override fun setMediaItems(mediaItems: MutableList<MediaItem>, startIndex: Int, startPositionMs: Long) {}
            override fun setMediaItem(mediaItem: MediaItem, startPositionMs: Long) {}
            override fun setMediaItem(mediaItem: MediaItem) {}
            override fun setShuffleModeEnabled(shuffleModeEnabled: Boolean) {}
            override fun setRepeatMode(repeatMode: Int) {}
            override fun prepare() {}
            override fun play() { bridge?.performPlay() }
            override fun pause() { bridge?.performPause() }
            override fun stop() { bridge?.performPause() }
            override fun seekTo(positionMs: Long) { bridge?.performSeekTo(positionMs / 1000.0) }
            override fun seekToNextMediaItem() { bridge?.performNext() }
            override fun seekToPreviousMediaItem() { bridge?.performPrevious() }
            override fun setPlaybackSpeed(speed: Float) {}
            override fun release() {}

            override fun isPlaying(): Boolean = isPlaying
            override fun getPlayWhenReady(): Boolean = isPlaying
            override fun getPlaybackState(): Int = if (isPlaying) Player.STATE_READY else Player.STATE_ENDED
            override fun getPlaybackSuppressionReason(): Int = Player.PLAYBACK_SUPPRESSION_REASON_NONE
            override fun getRepeatMode(): Int = Player.REPEAT_MODE_OFF
            override fun getShuffleModeEnabled(): Boolean = false
            override fun getCurrentMediaItemIndex(): Int = 0
            override fun getCurrentPosition(): Long = (currentPosition * 1000).toLong()
            override fun getDuration(): Long = (currentDuration * 1000).toLong()
            override fun getBufferedPosition(): Long = (currentDuration * 1000).toLong()
            override fun getTotalBufferedDuration(): Long = 0
            override fun hasNextMediaItem(): Boolean = true
            override fun hasPreviousMediaItem(): Boolean = true
            override fun getNextMediaItemIndex(): Int = 1
            override fun getPreviousMediaItemIndex(): Int = -1
            override fun getCurrentMediaItem(): MediaItem = buildMediaItem()
            override fun getMediaItemCount(): Int = 1
            override fun getMediaItem(index: Int): MediaItem = buildMediaItem()
            override fun getDeviceVolume(): Int = 100
            override fun getMaxDeviceVolume(): Int = 100
            override fun isDeviceMute(): Boolean = false
            override fun setDeviceVolume(deviceVolume: Int) {}
            override fun increaseDeviceVolume() {}
            override fun decreaseDeviceVolume() {}
            override fun setDeviceMute(mute: Boolean) {}
            override fun setAudioAttributes(audioAttributes: androidx.media3.common.AudioAttributes, handleAudioFocus: Boolean) {}
            override fun addMediaItems(index: Int, mediaItems: MutableList<MediaItem>) {}
            override fun addMediaItem(index: Int, mediaItem: MediaItem) {}
            override fun addMediaItem(mediaItem: MediaItem) {}
            override fun addMediaItems(mediaItems: MutableList<MediaItem>) {}
            override fun moveMediaItems(fromIndex: Int, toIndex: Int, newIndex: Int) {}
            override fun removeMediaItem(index: Int) {}
            override fun removeMediaItems(fromIndex: Int, toIndex: Int) {}
            override fun replaceMediaItem(index: Int, mediaItem: MediaItem) {}
            override fun clearMediaItems() {}
            override fun isCommandAvailable(command: Int): Boolean = true
            override fun isAvailable(command: Int): Boolean = true

            private fun buildMediaItem(): MediaItem {
                return MediaItem.Builder()
                    .setMediaId(currentTitle)
                    .setMediaMetadata(
                        MediaMetadata.Builder()
                            .setTitle(currentTitle)
                            .setArtist(currentArtist)
                            .setArtworkUri(if (currentCoverUrl.isNotEmpty()) Uri.parse(currentCoverUrl) else null)
                            .build()
                    )
                    .build()
            }
        }

        mediaSession = MediaSession.Builder(this, player)
            .setSessionActivity(buildPendingIntent())
            .setTag(MEDIA_SESSION_TAG)
            .build()

        // Custom notification
        setupNotification()
    }

    private fun buildPendingIntent(): PendingIntent {
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        return PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    private fun setupNotification() {
        val session = mediaSession ?: return

        val notificationManager = PlayerNotificationManager.Builder(
            this, NOTIFICATION_ID, CHANNEL_ID
        )
            .setMediaDescriptionAdapter(object : PlayerNotificationManager.MediaDescriptionAdapter {
                override fun getCurrentContentTitle(player: Player): CharSequence = currentTitle
                override fun getCurrentContentText(player: Player): CharSequence = currentArtist
                override fun getCurrentSubText(player: Player): CharSequence = "MalaMusic"
                override fun getContentIntent(player: Player): PendingIntent = buildPendingIntent()
                override fun getCurrentLargeIcon(
                    player: Player,
                    callback: PlayerNotificationManager.BitmapCallback
                ): Bitmap? {
                    coverBitmap?.let { callback.onBitmap(it) }
                    loadCoverBitmap(currentCoverUrl) { bitmap ->
                        coverBitmap = bitmap
                        callback.onBitmap(bitmap)
                    }
                    return coverBitmap
                }
            })
            .setActionIncrementsOf(PlayerNotificationManager.ACTION_SEEK_TO_FORWARD, 10_000)
            .setActionIncrementsOf(PlayerNotificationManager.ACTION_SEEK_TO_BACK, 10_000)
            .build()

        notificationManager.setPlayer(session.player)
        notificationManager.setMediaSessionToken(session.sessionCompatToken)
        notificationManager.setUseFastForwardActionInCompactView(true)
        notificationManager.setUseRewindActionInCompactView(true)
    }

    private fun loadCoverBitmap(url: String, callback: (Bitmap) -> Unit) {
        if (url.isEmpty()) return
        thread {
            try {
                val connection = URL(url).openConnection()
                connection.connectTimeout = 5000
                connection.readTimeout = 5000
                val stream = connection.getInputStream()
                val bitmap = BitmapFactory.decodeStream(stream)
                stream.close()
                if (bitmap != null) {
                    callback(bitmap)
                }
            } catch (e: Exception) {
                Log.w(TAG, "Failed to load cover: ${e.message}")
            }
        }
    }

    fun onPlay() {
        isPlaying = true
        mediaSession?.player?.let {
            it.prepare()
            it.play()
        }
        updateNotification()
    }

    fun onPause() {
        isPlaying = false
        mediaSession?.player?.pause()
        updateNotification()
    }

    fun onEnded() {
        isPlaying = false
        updateNotification()
    }

    fun updateProgress(position: Double, duration: Double, paused: Boolean) {
        currentPosition = position
        currentDuration = duration
        isPlaying = !paused
    }

    fun updateTrack(title: String, artist: String, coverUrl: String) {
        currentTitle = title
        currentArtist = artist
        currentCoverUrl = coverUrl

        // Update MediaSession metadata
        mediaSession?.setMetadata(
            androidx.media3.common.MediaMetadata.Builder()
                .setTitle(title)
                .setArtist(artist)
                .setArtworkUri(if (coverUrl.isNotEmpty()) Uri.parse(coverUrl) else null)
                .build()
        )

        updateNotification()
    }

    private fun updateNotification() {
        // Force notification update by rebuilding
        setupNotification()
    }

    override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? {
        return mediaSession
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        val player = mediaSession?.player
        if (player == null || !player.playWhenReady || player.mediaItemCount == 0) {
            stopSelf()
        }
    }

    override fun onDestroy() {
        mediaSession?.run {
            player.release()
            release()
        }
        mediaSession = null
        instance = null
        super.onDestroy()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        super.onStartCommand(intent, flags, startId)
        return START_STICKY
    }
}
