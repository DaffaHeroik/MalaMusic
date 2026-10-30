package com.malamusic.app.audio

import android.app.PendingIntent
import android.content.Intent
import android.net.Uri
import android.os.Binder
import android.os.IBinder
import android.util.Log
import androidx.annotation.OptIn
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.DefaultLoadControl
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService
import com.malamusic.app.MalaMusicApp
import com.malamusic.app.data.model.Track
import com.malamusic.app.data.repository.MusicRepository
import com.malamusic.app.ui.MainActivity
import kotlinx.coroutines.*

@UnstableApi
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
    private var loadJob: Job? = null
    private var positionJob: Job? = null
    private val repository by lazy { MalaMusicApp.instance.repository }

    inner class PlayerBinder : Binder() {
        fun getService(): MusicPlayerService = this@MusicPlayerService
    }

    override fun onBind(intent: Intent?): IBinder? {
        return if (intent?.action == "androidx.media3.session.MediaSessionService") {
            super.onBind(intent)
        } else {
            binder
        }
    }

    @OptIn(UnstableApi::class)
    override fun onCreate() {
        super.onCreate()
        instance = this

        // Small buffers so playback starts as soon as the first chunk lands.
        val loadControl = DefaultLoadControl.Builder()
            .setBufferDurationsMs(1000, 30_000, 250, 500)
            .build()

        exoPlayer = ExoPlayer.Builder(this)
            .setLoadControl(loadControl)
            .setHandleAudioBecomingNoisy(true)
            .setWakeMode(C.WAKE_MODE_NETWORK)
            .setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(C.USAGE_MEDIA)
                    .setContentType(C.AUDIO_CONTENT_TYPE_MUSIC)
                    .build(),
                true
            )
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

        startPositionTicker()
        Log.d(TAG, "Player service created")
    }

    private fun startPositionTicker() {
        positionJob?.cancel()
        positionJob = scope.launch {
            while (isActive) {
                exoPlayer?.let { player ->
                    if (player.isPlaying) {
                        repository.setPosition(player.currentPosition / 1000.0)
                        val dur = player.duration
                        if (dur > 0) repository.setDuration(dur / 1000.0)
                    }
                }
                delay(500)
            }
        }
    }

    private val playerListener = object : Player.Listener {
        override fun onPlaybackStateChanged(playbackState: Int) {
            when (playbackState) {
                Player.STATE_READY -> {
                    repository.setBuffering(false)
                    repository.setDuration(exoPlayer?.duration?.toDouble()?.div(1000) ?: 0.0)
                }
                Player.STATE_BUFFERING -> repository.setBuffering(true)
                Player.STATE_ENDED -> {
                    repository.setPlaying(false)
                    val autoplay = getSharedPreferences("malamusic_settings", MODE_PRIVATE).getBoolean("autoplay", true)
                    if (autoplay) playNextFromQueue()
                }
                Player.STATE_IDLE -> repository.setBuffering(false)
            }
        }

        override fun onIsPlayingChanged(isPlaying: Boolean) {
            repository.setPlaying(isPlaying)
        }

        override fun onPlayerError(error: PlaybackException) {
            Log.e(TAG, "Playback error: ${error.message}")
            repository.setPlaying(false)
            playNextFromQueue()
        }
    }

    private fun playNextFromQueue() {
        val next = repository.advance(1)
        if (next != null) loadAndPlay(next)
    }

    /**
     * Starts a track. The repository state flips immediately (optimistic UI) while
     * the stream URL resolves, usually straight from the cache.
     */
    fun playTrack(track: Track, queue: List<Track> = listOf(track), index: Int = 0) {
        repository.playTrack(track, queue, index)
        loadAndPlay(track)
    }

    fun next() {
        val track = repository.advance(1) ?: return
        loadAndPlay(track)
    }

    fun previous() {
        val track = repository.advance(-1) ?: return
        loadAndPlay(track)
    }

    private fun loadAndPlay(track: Track) {
        loadJob?.cancel()
        loadJob = scope.launch {
            repository.setBuffering(true)
            // A fully downloaded track must be playable without network access or URL re-resolution.
            val isOfflineReady = MalaMusicApp.instance.audioCache.isDownloaded(track.trackId)
            val audioUrl = if (isOfflineReady) "https://offline.malamusic.local/${track.trackId}" else repository.getAudioUrl(track)
            if (audioUrl == null) {
                repository.setBuffering(false)
                repository.setPlaying(false)
                Log.e(TAG, "No playable audio URL resolved for ${track.trackId}; check provider health and /api/ytplay response")
                return@launch
            }
            exoPlayer?.apply {
                val item = MediaItem.Builder()
                        .setMediaId(track.trackId)
                        .setCustomCacheKey(track.trackId)
                        .setUri(audioUrl)
                        .setMediaMetadata(
                            MediaMetadata.Builder()
                                .setTitle(track.title)
                                .setArtist(track.artist)
                                .setArtworkUri(Uri.parse(track.coverUrl))
                                .build()
                        )
                        .build()
                setMediaSource(MalaMusicApp.instance.audioCache.mediaSourceFactory(track.trackId).createMediaSource(item))
                prepare()
                play()
            }
            repository.prefetchAudio(repository.peekNext())
        }
    }

    fun togglePlayPause() {
        exoPlayer?.let { player ->
            if (player.isPlaying) player.pause() else player.play()
        }
    }

    fun seekTo(positionMs: Long) {
        exoPlayer?.seekTo(positionMs)
        repository.setPosition(positionMs / 1000.0)
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
        loadJob?.cancel()
        positionJob?.cancel()
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