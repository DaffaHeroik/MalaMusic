package com.malamusic.app.audio

import android.app.PendingIntent
import android.content.Intent
import android.net.Uri
import android.os.Binder
import android.os.IBinder
import android.util.Log
import androidx.annotation.OptIn
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService
import com.malamusic.app.MalaMusicApp
import com.malamusic.app.R
import com.malamusic.app.data.model.Track
import com.malamusic.app.data.repository.MusicRepository
import com.malamusic.app.ui.MainActivity
import kotlinx.coroutines.*

class MusicPlayerService : MediaSessionService() {

    companion object {
        private const val TAG = "MusicPlayerService"
        var instance: MusicPlayerService? = null
            private set
    }

    private var exoPlayer: ExoPlayer? = null
    private var mediaSession: MediaSession? = null
    private val binder = PlayerBinder()
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private val repository by lazy { MalaMusicApp.instance.repository }

    inner class PlayerBinder : Binder() {
        fun getService(): MusicPlayerService = this@MusicPlayerService
    }

    override fun onBind(intent: Intent): IBinder {
        super.onBind(intent)
        return binder
    }

    @OptIn(UnstableApi::class)
    override fun onCreate() {
        super.onCreate()
        instance = this

        exoPlayer = ExoPlayer.Builder(this)
            .setHandleAudioBecomingNoisy(true)
            .setWakeMode(C.WAKE_MODE_NETWORK)
            .build().apply {
                addListener(playerListener)
            }

        val sessionIntent = Intent(this, MainActivity::class.java)
        val sessionPendingIntent = PendingIntent.getActivity(
            this, 0, sessionIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        mediaSession = MediaSession.Builder(this, exoPlayer!!)
            .setSessionActivity(sessionPendingIntent)
            .build()

        Log.d(TAG, "Player service created")
    }

    private val playerListener = object : Player.Listener {
        override fun onPlaybackStateChanged(playbackState: Int) {
            when (playbackState) {
                Player.STATE_READY -> {
                    repository.setDuration(exoPlayer?.duration?.toDouble()?.div(1000) ?: 0.0)
                }
                Player.STATE_ENDED -> {
                    repository.setPlaying(false)
                    scope.launch { repository.playNext() }
                }
                Player.STATE_BUFFERING -> { /* loading */ }
                Player.STATE_IDLE -> { /* idle */ }
            }
        }

        override fun onIsPlayingChanged(isPlaying: Boolean) {
            repository.setPlaying(isPlaying)
        }

        override fun onPlayerError(error: PlaybackException) {
            Log.e(TAG, "Playback error: ${error.message}")
            repository.setPlaying(false)
            // Try next track on error
            scope.launch { repository.playNext() }
        }
    }

    suspend fun playTrack(track: Track) {
        val audioUrl = repository.getAudioUrl(track) ?: return
        repository.playTrack(track)

        exoPlayer?.apply {
            val mediaItem = MediaItem.Builder()
                .setMediaId(track.trackId)
                .setUri(audioUrl)
                .setMediaMetadata(
                    MediaMetadata.Builder()
                        .setTitle(track.title)
                        .setArtist(track.artist)
                        .setArtworkUri(Uri.parse(track.coverUrl))
                        .build()
                )
                .build()
            setMediaItem(mediaItem)
            prepare()
            play()
        }
    }

    fun togglePlayPause() {
        exoPlayer?.let { player ->
            if (player.isPlaying) player.pause() else player.play()
        }
    }

    fun seekTo(positionMs: Long) {
        exoPlayer?.seekTo(positionMs)
    }

    fun getCurrentPosition(): Long = exoPlayer?.currentPosition ?: 0
    fun getDuration(): Long = exoPlayer?.duration?.takeIf { it > 0 } ?: 0
    fun isCurrentlyPlaying(): Boolean = exoPlayer?.isPlaying == true

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
        scope.cancel()
        mediaSession?.run {
            player.release()
            release()
        }
        exoPlayer?.release()
        exoPlayer = null
        mediaSession = null
        instance = null
        super.onDestroy()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        super.onStartCommand(intent, flags, startId)
        return START_STICKY
    }
}
