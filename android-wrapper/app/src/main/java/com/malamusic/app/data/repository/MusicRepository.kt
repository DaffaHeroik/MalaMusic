package com.malamusic.app.data.repository

import android.content.Context
import com.malamusic.app.data.api.MusicApi
import com.malamusic.app.data.cache.AudioCacheManager
import androidx.media3.common.util.UnstableApi
import android.util.Log
import com.malamusic.app.data.model.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.concurrent.ConcurrentHashMap

@UnstableApi
class MusicRepository(context: Context? = null, val audioCache: AudioCacheManager? = null) {

    companion object {
        // YouTube stream URLs stay valid for hours; a short TTL keeps them fresh
        // while still avoiding repeated /api/ytplay calls (10s+ cold each).
        const val URL_TTL_MS = 3 * 60 * 60 * 1000L
        const val SEARCH_TTL_MS = 5 * 60 * 1000L

        // Same query pool the web home rotates through (public/home.js)
        val QUERY_POOL = listOf(
            "Trend Indonesia", "Lagu Indonesia terbaru", "Top Hits Indonesia",
            "Lagu viral terbaru", "Pop Indonesia populer", "Musik Indonesia 2026",
            "Lagu santai Indonesia", "Hits TikTok Indonesia"
        )
        const val ARTIST_MATCH_QUERY = "XXXTENTACION Lil Peep Juice WRLD Lil Loaded Hindia"

        // Web search recommendations (public/search.js REC_ROWS)
        val SEARCH_REC_ROWS = listOf(
            "baru rilis" to "Rilis Anyar",
            "barat Top" to "Barat Top",
            "Rapp Top" to "Rapp Top"
        )

        fun defaultTopArtists(): List<Artist> = listOf(
            Artist("UCnAcxgRZ065f_eXK1o85c1w", "XXXTENTACION", "https://yt3.googleusercontent.com/No3I8pA9ows2dy6NElEr9mCXLzYxgjVvsQr7h69C03palsH1u8Q8iw-sAAUxav599Wmi64up8lbDGbI=w800-h800-l90-rj"),
            Artist("UCxcyWcW0kZFGRyetDHr3UuA", "Lil Peep", "https://yt3.googleusercontent.com/TbvXoTXJz8a2xfkJxZsI0riSyrUSibnVHBFxhHTeJefWY-2-60x0VhUPkO89uF3CGOPLalsTTM-OlEeI=w800-h800-l90-rj"),
            Artist("UCbn0GRdgsQtl9hlV-IqxFGg", "Juice WRLD", "https://lh3.googleusercontent.com/6YKQ7fDb3ISfzNUjpJnXX1FLw9EQ8eK5qHa07VANJtkaGagUtqtHiAOKz2AJ1AoASNacrCeg8pd35ao=w800-h800-l90-rj"),
            Artist("UCzM0GZjC6wQnvpljr3SbKRw", "Lil Loaded", "https://lh3.googleusercontent.com/jectExZmYnwQhQWHO_gqTHDhDlOpz6HMwR5kd8f6a2fQ7-KVeSGoR_IHuZPIk_PHQEt-0jzQiCCU-io=w800-h800-l90-rj"),
            Artist("UCzhVLh7xVyH3MpqO_KY6SYg", "Hindia", "https://yt3.googleusercontent.com/8ImMAMQSD4FA6-gdqCZWSFaB-drHvkdfiFcFAk7Mcyy56ctfWD-Xxno-CHfGC4L6Ql8aR61XT0vX0F4b=w800-h800-l90-rj")
        )
    }

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val prefs = context?.getSharedPreferences("malamusic_cache", Context.MODE_PRIVATE)
    private val _authUser = MutableStateFlow<AuthUser?>(null)
    val authUser: StateFlow<AuthUser?> = _authUser.asStateFlow()

    private class CachedUrl(val url: String, val expiresAt: Long)
    private class CachedSearch(val results: SearchResults, val at: Long)

    private val urlCache = ConcurrentHashMap<String, CachedUrl>()
    private val urlInFlight = ConcurrentHashMap<String, Deferred<String?>>()
    private val searchCache = ConcurrentHashMap<String, CachedSearch>()

    // Player state
    private val _currentTrack = MutableStateFlow<Track?>(null)
    val currentTrack: StateFlow<Track?> = _currentTrack.asStateFlow()

    private val _isPlaying = MutableStateFlow(false)
    val isPlaying: StateFlow<Boolean> = _isPlaying.asStateFlow()

    private val _isBuffering = MutableStateFlow(false)
    val isBuffering: StateFlow<Boolean> = _isBuffering.asStateFlow()

    private val _position = MutableStateFlow(0.0)
    val position: StateFlow<Double> = _position.asStateFlow()

    private val _duration = MutableStateFlow(0.0)
    val duration: StateFlow<Double> = _duration.asStateFlow()

    private val _queue = MutableStateFlow<List<Track>>(emptyList())
    val queue: StateFlow<List<Track>> = _queue.asStateFlow()

    private val _currentIndex = MutableStateFlow(0)
    val currentIndex: StateFlow<Int> = _currentIndex.asStateFlow()

    private val _lyrics = MutableStateFlow(LyricsResult())
    val lyrics: StateFlow<LyricsResult> = _lyrics.asStateFlow()

    // Liked songs persist locally and synchronize to the signed-in account.
    private val _likedSongs = MutableStateFlow(readTracks("liked_songs"))
    val likedSongs: StateFlow<List<Track>> = _likedSongs.asStateFlow()

    // Recent tracks
    private val _recentTracks = MutableStateFlow(readTracks("recent_tracks"))
    val recentTracks: StateFlow<List<Track>> = _recentTracks.asStateFlow()

    // Home data
    private val _homeData = MutableStateFlow(SearchResults())
    val homeData: StateFlow<SearchResults> = _homeData.asStateFlow()
    private var homeLoadedAt = 0L
    private var homeQueryIdx = 0
    private var playlistExtraLoaded = false

    // Web parity: fixed Top Artists pool (same list as public/home.js)
    private val _topArtists = MutableStateFlow<List<Artist>>(defaultTopArtists())
    val topArtists: StateFlow<List<Artist>> = _topArtists.asStateFlow()

    // Streak card (same as the web home-streak-card)
    private val _streakState = MutableStateFlow(StreakState())
    val streakState: StateFlow<StreakState> = _streakState.asStateFlow()

    // Home category (same behaviour as the web chip bar)
    private val _homeCategory = MutableStateFlow<String?>(null)
    val homeCategory: StateFlow<String?> = _homeCategory.asStateFlow()
    private val _isCategoryLoading = MutableStateFlow(false)
    val isCategoryLoading: StateFlow<Boolean> = _isCategoryLoading.asStateFlow()
    private var categorySeq = 0

    // Search
    private val _searchResults = MutableStateFlow(SearchResults())
    val searchResults: StateFlow<SearchResults> = _searchResults.asStateFlow()

    // Web-parity search state (submitted query + users + error)
    private val _searchSubmitted = MutableStateFlow(false)
    val searchSubmitted: StateFlow<Boolean> = _searchSubmitted.asStateFlow()
    private val _searchUsers = MutableStateFlow<List<UserEntry>>(emptyList())
    val searchUsers: StateFlow<List<UserEntry>> = _searchUsers.asStateFlow()
    private val _searchError = MutableStateFlow(false)
    val searchError: StateFlow<Boolean> = _searchError.asStateFlow()
    private val _searchRecs = MutableStateFlow(SearchRecs())
    val searchRecs: StateFlow<SearchRecs> = _searchRecs.asStateFlow()
    private val _recentSearches = MutableStateFlow<List<String>>(
        prefs?.getString("mala_recent_searches", "")?.let { s ->
            s.split(",").filter { it.isNotEmpty() }
        } ?: emptyList()
    )
    val recentSearches: StateFlow<List<String>> = _recentSearches.asStateFlow()
    private var searchSeq = 0

    // Suggestions
    private val _suggestions = MutableStateFlow<List<Suggestion>>(emptyList())
    val suggestions: StateFlow<List<Suggestion>> = _suggestions.asStateFlow()

    private val _leaderboard = MutableStateFlow<List<LeaderboardEntry>>(emptyList())
    val leaderboard: StateFlow<List<LeaderboardEntry>> = _leaderboard.asStateFlow()

    // Loading states
    private val _isLoading = MutableStateFlow(false)      // home
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _isSearching = MutableStateFlow(false)
    val isSearching: StateFlow<Boolean> = _isSearching.asStateFlow()

    init {
        context?.let { MusicApi.initialize(it) }
        scope.launch {
            val user = MusicApi.getSession()
            _authUser.value = user
            if (user != null) syncLibraryFromServer()
        }
        prefs?.all?.forEach { (key, value) ->
            if (key.startsWith("u:") && value is String) {
                val sep = value.indexOf('|')
                if (sep > 0) {
                    val expires = value.substring(0, sep).toLongOrNull() ?: 0L
                    val url = value.substring(sep + 1)
                    if (expires > System.currentTimeMillis() && url.isNotEmpty()) {
                        urlCache[key.substring(2)] = CachedUrl(url, expires)
                    } else {
                        prefs.edit().remove(key).apply()
                    }
                }
            }
        }
    }

    fun setPlaying(playing: Boolean) { _isPlaying.value = playing }
    fun setBuffering(buffering: Boolean) { _isBuffering.value = buffering }
    fun setPosition(pos: Double) { _position.value = pos }
    fun setDuration(dur: Double) { _duration.value = dur }

    fun playTrack(track: Track, queue: List<Track> = listOf(track), index: Int = 0) {
        _currentTrack.value = track
        _queue.value = queue
        _currentIndex.value = queue.indexOfFirst { it.trackId == track.trackId }.takeIf { it >= 0 } ?: index
        _isPlaying.value = true
        _position.value = 0.0
        addToRecent(track)
    }

    fun peekNext(): Track? {
        val q = _queue.value
        val idx = _currentIndex.value
        return q.getOrNull(idx + 1)
    }

    /** Moves the queue pointer without touching the player. Returns the new track. */
    fun advance(delta: Int): Track? {
        val q = _queue.value
        val next = _currentIndex.value + delta
        if (q.isEmpty() || next !in q.indices) return null
        val track = q[next]
        _currentIndex.value = next
        _currentTrack.value = track
        _isPlaying.value = true
        _position.value = 0.0
        _duration.value = 0.0
        _lyrics.value = LyricsResult()
        addToRecent(track)
        return track
    }

    suspend fun searchMusic(query: String, submit: Boolean = false) {
        if (query.isBlank()) {
            _searchResults.value = SearchResults()
            _searchUsers.value = emptyList()
            _searchSubmitted.value = false
            _searchError.value = false
            _isSearching.value = false
            return
        }
        // Debounced (as-you-type) path: serve from cache when fresh, like the web.
        if (!submit) {
            searchCache[query]?.let { cached ->
                if (System.currentTimeMillis() - cached.at < SEARCH_TTL_MS) {
                    _searchResults.value = cached.results
                    _searchUsers.value = emptyList()
                    return
                }
            }
        }
        val seq = ++searchSeq
        if (submit) {
            _searchSubmitted.value = true
            _searchError.value = false
            _isSearching.value = true
            persistRecentSearch(query)
        }
        val results = try {
            if (submit) MusicApi.searchThrows(query) else MusicApi.search(query)
        } catch (e: Exception) {
            if (submit && seq == searchSeq) {
                _searchResults.value = SearchResults()
                _searchUsers.value = emptyList()
                _searchError.value = true
                _isSearching.value = false
            }
            return
        }
        val users = if (submit) try { MusicApi.searchUsers(query) } catch (e: Exception) { emptyList() } else emptyList()
        if (seq != searchSeq) return
        _searchResults.value = results
        _searchUsers.value = users
        searchCache[query] = CachedSearch(results, System.currentTimeMillis())
        if (submit) _isSearching.value = false
    }

    /** Web parity: "Pencarian Terakhir" — persist submitted queries (max 8, newest first). */
    fun persistRecentSearch(query: String) {
        val trimmed = query.trim()
        if (trimmed.isEmpty()) return
        val current = _recentSearches.value.filter { it != trimmed }.toMutableList()
        current.add(0, trimmed)
        _recentSearches.value = current.take(8)
        prefs?.edit()?.putString("mala_recent_searches", _recentSearches.value.joinToString(","))?.apply()
    }

    fun clearSearch() {
        searchSeq++
        _searchResults.value = SearchResults()
        _searchUsers.value = emptyList()
        _searchSubmitted.value = false
        _searchError.value = false
        _isSearching.value = false
    }

    /** Web parity: recommendation rows shown when no query is active (Rilis Anyar / Barat Top / Rapp Top). */
    suspend fun loadSearchRecs() {
        if (_searchRecs.value.loaded) return
        val d0 = scope.async { MusicApi.search("baru rilis", type = "songs") }
        val d1 = scope.async { MusicApi.search("barat Top", type = "songs") }
        val d2 = scope.async { MusicApi.search("Rapp Top", type = "songs") }
        _searchRecs.value = SearchRecs(
            rec0 = d0.await().songs,
            rec1 = d1.await().songs,
            rec2 = d2.await().songs,
            loaded = true
        )
    }

    suspend fun loadUserProfile(uid: String): Pair<UserEntry, List<Playlist>> = MusicApi.getUserProfile(uid)

    suspend fun loadSuggestions(query: String) {
        _suggestions.value = MusicApi.getSuggestions(query)
    }

    suspend fun loadHome(force: Boolean = false) {
        val hasData = _homeData.value.songs.isNotEmpty()
        if (!force && hasData && System.currentTimeMillis() - homeLoadedAt < SEARCH_TTL_MS) return
        if (_isLoading.value) return
        _isLoading.value = true
        // Web home rotates the query pool (excluding the previous pick) and
        // shuffles the resulting songs before display.
        val pool = QUERY_POOL
        val idx = homeQueryIdx
        val query = pool[(idx + 1) % pool.size]
        homeQueryIdx = (idx + 1) % pool.size
        var trending = MusicApi.search(query, type = "songs")
        val songs = trending.songs.distinctBy { it.trackId }.shuffled()
        // If there are too few playlists, the web issues a second playlist fetch.
        var playlists = trending.playlists
        if (playlists.size < 4 && !playlistExtraLoaded) {
            val extra = MusicApi.search("Lagu Indonesia Populer", type = "playlists")
            val extraAlbumsAsPlaylists = extra.albums.map { album ->
                Playlist(
                    id = album.id,
                    name = album.title,
                    image = album.cover,
                    songs = album.songs,
                    creator = album.artist
                )
            }
            playlists = playlists + extra.playlists + extraAlbumsAsPlaylists
            if (playlists.isNotEmpty()) playlists = playlists.sortedBy { Math.random() }
            playlistExtraLoaded = true
        }
        trending = trending.copy(songs = songs, playlists = playlists)
        if (trending.songs.isNotEmpty() || !hasData) {
            _homeData.value = trending
            homeLoadedAt = System.currentTimeMillis()
        }
        refreshTopArtists()
        _isLoading.value = false
        // Warm the stream URL cache so the first tap starts almost instantly.
        trending.songs.take(2).forEach { prefetchAudio(it) }
    }

    /** Web parity: keep the fixed Top Artists list but upgrade covers/ids from a live artist search. */
    private fun refreshTopArtists() {
        scope.launch {
            val results = MusicApi.search(ARTIST_MATCH_QUERY, type = "artists")
            if (results.artists.isEmpty()) return@launch
            val current = _topArtists.value
            _topArtists.value = current.map { fixed ->
                val match = results.artists.firstOrNull {
                    it.name.equals(fixed.name, true) || it.name.contains(fixed.name, true)
                }
                if (match != null) fixed.copy(thumbnail = match.thumbnail.ifBlank { fixed.thumbnail }, id = match.id.ifBlank { fixed.id }) else fixed
            }
        }
    }

    suspend fun loadStreak() {
        val stats = MusicApi.getMyStats()
        _streakState.value = if (stats == null) StreakState(loaded = true) else StreakState(
            loaded = true,
            hasAccount = true,
            stats = stats
        )
    }

    /** Web-parity home category selection: null/empty resets, otherwise fetches that mood. */
    suspend fun selectHomeCategory(category: String?, query: String?) {
        val seq = ++categorySeq
        if (category.isNullOrBlank() || query.isNullOrBlank()) {
            _homeCategory.value = null
            _isCategoryLoading.value = false
            _searchResults.value = SearchResults()
            return
        }
        _homeCategory.value = category
        _isCategoryLoading.value = true
        val results = MusicApi.search(query)
        if (seq != categorySeq) return
        _searchResults.value = results
        _isCategoryLoading.value = false
    }

    fun resetHomeCategory() {
        categorySeq++
        _homeCategory.value = null
        _isCategoryLoading.value = false
        _searchResults.value = SearchResults()
    }

    suspend fun loadLeaderboard() {
        _leaderboard.value = MusicApi.getLeaderboard()
    }

    suspend fun loadLyrics(track: Track) {
        _lyrics.value = MusicApi.getLyrics(track.trackId, track.title, track.artist)
    }

    // ---- Audio URL cache -------------------------------------------------

    private fun audioKey(track: Track): String =
        track.ytUrl.ifBlank { "https://youtube.com/watch?v=${track.trackId}" }

    private fun cacheGet(key: String): String? {
        urlCache[key]?.let {
            if (it.expiresAt > System.currentTimeMillis()) return it.url
            urlCache.remove(key)
            prefs?.edit()?.remove("u:$key")?.apply()
        }
        return null
    }

    private fun cachePut(key: String, url: String) {
        val expiresAt = System.currentTimeMillis() + URL_TTL_MS
        urlCache[key] = CachedUrl(url, expiresAt)
        prefs?.edit()?.putString("u:$key", "$expiresAt|$url")?.apply()
    }

    /** Fire-and-forget URL resolution so playback can start without waiting. */
    fun prefetchAudio(track: Track?) {
        if (track == null) return
        val key = audioKey(track)
        if (cacheGet(key) != null || urlInFlight.containsKey(key)) return
        scope.launch { getAudioUrlFor(key) }
    }

    suspend fun getAudioUrl(track: Track): String? = getAudioUrlFor(audioKey(track))

    private suspend fun getAudioUrlFor(key: String): String? {
        cacheGet(key)?.let { return it }
        val deferred = urlInFlight.computeIfAbsent(key) {
            scope.async {
                val result = try {
                    MusicApi.getAudioUrl(key)
                } catch (e: Exception) {
                    null
                } finally {
                    urlInFlight.remove(key)
                }
                if (result != null) cachePut(key, result)
                result
            }
        }
        return try {
            deferred.await()
        } catch (e: Exception) {
            null
        }
    }

    // Local liked songs
    fun toggleLike(track: Track) {
        val current = _likedSongs.value.toMutableList()
        val idx = current.indexOfFirst { it.trackId == track.trackId }
        if (idx >= 0) current.removeAt(idx) else current.add(0, track)
        _likedSongs.value = current
        persistTracks("liked_songs", current)
        syncLibrarySoon()
    }

    suspend fun authenticate(email: String, password: String, name: String = "", register: Boolean = false) {
        val user = if (register) MusicApi.register(name.trim(), email.trim(), password) else MusicApi.login(email.trim(), password)
        _authUser.value = user
        if (syncLibraryFromServer()) syncLibrarySoon()
    }

    suspend fun authenticateWithGoogleCode(code: String) {
        val user = MusicApi.exchangeMobileGoogleCode(code)
        _authUser.value = user
        if (syncLibraryFromServer()) syncLibrarySoon()
    }

    suspend fun logout() {
        runCatching { MusicApi.logout() }
        _authUser.value = null
    }

    suspend fun syncLibraryFromServer(): Boolean {
        if (_authUser.value == null) return false
        return try {
            val (liked, recent) = MusicApi.getLibrary()
            _likedSongs.value = liked
            _recentTracks.value = recent
            persistTracks("liked_songs", liked)
            persistTracks("recent_tracks", recent)
            true
        } catch (e: Exception) {
            Log.w("MalaMusic", "Library sync failed", e)
            false
        }
    }

    private fun syncLibrarySoon() {
        if (_authUser.value == null) return
        scope.launch { runCatching { MusicApi.putLibrary(_likedSongs.value, _recentTracks.value) }.onFailure { Log.w("MalaMusic", "Library sync failed", it) } }
    }

    private fun addToRecent(track: Track) {
        val current = _recentTracks.value.toMutableList()
        current.removeAll { it.trackId == track.trackId }
        current.add(0, track)
        if (current.size > 50) current.removeAt(current.lastIndex)
        _recentTracks.value = current
        persistTracks("recent_tracks", current)
        syncLibrarySoon()
    }

    private fun persistTracks(key: String, tracks: List<Track>) {
        val arr = org.json.JSONArray()
        tracks.forEach { t -> arr.put(org.json.JSONObject().put("videoId", t.videoId).put("id", t.id).put("title", t.title).put("artist", t.artist).put("cover", t.cover).put("artistId", t.artistId).put("ytUrl", t.ytUrl).put("duration", t.duration).put("albumName", t.albumName)) }
        prefs?.edit()?.putString(key, arr.toString())?.apply()
    }

    private fun readTracks(key: String): List<Track> = runCatching {
        val arr = org.json.JSONArray(prefs?.getString(key, "[]") ?: "[]")
        (0 until arr.length()).mapNotNull { i ->
            val o = arr.optJSONObject(i) ?: return@mapNotNull null
            Track(videoId = o.optString("videoId"), id = o.optString("id"), title = o.optString("title", "Lagu"), artist = o.optString("artist", "Unknown"), cover = o.optString("cover"), artistId = o.optString("artistId"), ytUrl = o.optString("ytUrl"), duration = o.optString("duration"), albumName = o.optString("albumName"))
        }
    }.getOrDefault(emptyList())

    suspend fun downloadTrack(track: Track, progress: (Long, Long) -> Unit = { _, _ -> }) {
        val cache = audioCache ?: throw IllegalStateException("Cache audio tidak tersedia.")
        val url = getAudioUrl(track) ?: throw IllegalStateException("Stream audio tidak tersedia. Coba lagi.")
        cache.download(track, url, progress)
    }

    fun isLiked(track: Track): Boolean {
        return _likedSongs.value.any { it.trackId == track.trackId }
    }

}