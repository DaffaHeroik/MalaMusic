package com.malamusic.app.data.cache

import android.content.Context
import android.net.Uri
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DataSpec
import androidx.media3.datasource.DefaultDataSource
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.datasource.cache.Cache
import androidx.media3.datasource.cache.CacheDataSource
import androidx.media3.datasource.cache.CacheWriter
import androidx.media3.datasource.cache.LeastRecentlyUsedCacheEvictor
import androidx.media3.datasource.cache.NoOpCacheEvictor
import androidx.media3.datasource.cache.SimpleCache
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import com.malamusic.app.data.model.Track
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

/** Bounded stream cache plus explicit offline downloads that are not LRU-evicted. */
@UnstableApi
class AudioCacheManager(context: Context) {
    private val app = context.applicationContext
    private val prefs = app.getSharedPreferences("malamusic_audio_downloads", Context.MODE_PRIVATE)
    private val httpFactory = DefaultHttpDataSource.Factory().setConnectTimeoutMs(15_000).setReadTimeoutMs(30_000).setAllowCrossProtocolRedirects(true)
    private val upstreamFactory = DefaultDataSource.Factory(app, httpFactory)
    val streamingCache: Cache = SimpleCache(File(app.cacheDir, "malamusic-stream-cache"), LeastRecentlyUsedCacheEvictor(256L * 1024 * 1024))
    val offlineCache: Cache = SimpleCache(File(app.filesDir, "malamusic-offline-audio"), NoOpCacheEvictor())
    private val streamFactory = CacheDataSource.Factory().setCache(streamingCache).setUpstreamDataSourceFactory(upstreamFactory).setFlags(CacheDataSource.FLAG_IGNORE_CACHE_ON_ERROR)
    private val offlineFactory = CacheDataSource.Factory().setCache(offlineCache).setUpstreamDataSourceFactory(upstreamFactory).setFlags(CacheDataSource.FLAG_IGNORE_CACHE_ON_ERROR)
    private val _downloads = MutableStateFlow(readDownloads())
    val downloads: StateFlow<List<Track>> = _downloads.asStateFlow()
    private val _downloadingIds = MutableStateFlow<Set<String>>(emptySet())
    val downloadingIds: StateFlow<Set<String>> = _downloadingIds.asStateFlow()

    fun isDownloaded(trackId: String): Boolean = _downloads.value.any { it.trackId == trackId }
    fun clearStreamingCache(): Int {
        val keys = streamingCache.keys.toList()
        keys.forEach { key -> runCatching { streamingCache.removeResource(key) } }
        return keys.size
    }

    fun streamingCacheBytes(): Long = streamingCache.cacheSpace
    fun offlineCacheBytes(): Long = offlineCache.cacheSpace
    fun mediaSourceFactory(trackId: String): DefaultMediaSourceFactory = DefaultMediaSourceFactory(if (isDownloaded(trackId)) offlineFactory else streamFactory)

    suspend fun download(track: Track, resolvedUrl: String, progress: (Long, Long) -> Unit = { _, _ -> }) = withContext(Dispatchers.IO) {
        val id = track.trackId
        require(id.isNotBlank()) { "ID lagu tidak valid." }
        require(resolvedUrl.startsWith("https://")) { "URL audio tidak aman." }
        if (isDownloaded(id) || id in _downloadingIds.value) return@withContext
        if (offlineCache.cacheSpace >= 2L * 1024 * 1024 * 1024) throw IllegalStateException("Penyimpanan offline mencapai 2 GB. Hapus beberapa lagu sebelum mengunduh lagi.")
        _downloadingIds.value = _downloadingIds.value + id
        try {
            val spec = DataSpec.Builder().setUri(Uri.parse(resolvedUrl)).setKey(id).build()
            CacheWriter(offlineFactory.createDataSource(), spec, null) { requestLength, bytesCached, _ -> progress(bytesCached, requestLength) }.cache()
            val latest = _downloads.value.filterNot { it.trackId == id } + track
            _downloads.value = latest
            persistDownloads(latest)
        } finally { _downloadingIds.value = _downloadingIds.value - id }
    }

    fun removeDownload(track: Track) {
        runCatching { offlineCache.removeResource(track.trackId) }
        val latest = _downloads.value.filterNot { it.trackId == track.trackId }
        _downloads.value = latest
        persistDownloads(latest)
    }

    private fun persistDownloads(tracks: List<Track>) {
        val array = JSONArray()
        tracks.forEach { t -> array.put(JSONObject().put("videoId", t.videoId).put("id", t.id).put("title", t.title).put("artist", t.artist).put("cover", t.cover).put("artistId", t.artistId).put("ytUrl", t.ytUrl).put("duration", t.duration).put("albumName", t.albumName)) }
        prefs.edit().putString("tracks", array.toString()).apply()
    }

    private fun readDownloads(): List<Track> = runCatching {
        val array = JSONArray(prefs.getString("tracks", "[]"))
        (0 until array.length()).mapNotNull { i ->
            val o = array.optJSONObject(i) ?: return@mapNotNull null
            Track(videoId = o.optString("videoId"), id = o.optString("id"), title = o.optString("title", "Lagu"), artist = o.optString("artist", "Unknown"), cover = o.optString("cover"), artistId = o.optString("artistId"), ytUrl = o.optString("ytUrl"), duration = o.optString("duration"), albumName = o.optString("albumName"))
        }.filter { offlineCache.isCached(it.trackId, 0, 1) }
    }.getOrDefault(emptyList())
}
