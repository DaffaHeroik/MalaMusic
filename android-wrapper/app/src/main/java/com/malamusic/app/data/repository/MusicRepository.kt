package com.malamusic.app.data.repository

import com.malamusic.app.data.api.MusicApi
import com.malamusic.app.data.model.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class MusicRepository {

    // Player state
    private val _currentTrack = MutableStateFlow<Track?>(null)
    val currentTrack: StateFlow<Track?> = _currentTrack.asStateFlow()

    private val _isPlaying = MutableStateFlow(false)
    val isPlaying: StateFlow<Boolean> = _isPlaying.asStateFlow()

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

    // Liked songs (local storage)
    private val _likedSongs = MutableStateFlow<List<Track>>(emptyList())
    val likedSongs: StateFlow<List<Track>> = _likedSongs.asStateFlow()

    // Recent tracks
    private val _recentTracks = MutableStateFlow<List<Track>>(emptyList())
    val recentTracks: StateFlow<List<Track>> = _recentTracks.asStateFlow()

    // Home data
    private val _homeData = MutableStateFlow(SearchResults())
    val homeData: StateFlow<SearchResults> = _homeData.asStateFlow()

    // Search
    private val _searchResults = MutableStateFlow(SearchResults())
    val searchResults: StateFlow<SearchResults> = _searchResults.asStateFlow()

    private val _suggestions = MutableStateFlow<List<Suggestion>>(emptyList())
    val suggestions: StateFlow<List<Suggestion>> = _suggestions.asStateFlow()

    private val _leaderboard = MutableStateFlow<List<LeaderboardEntry>>(emptyList())
    val leaderboard: StateFlow<List<LeaderboardEntry>> = _leaderboard.asStateFlow()

    // Loading states
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    fun setPlaying(playing: Boolean) { _isPlaying.value = playing }
    fun setPosition(pos: Double) { _position.value = pos }
    fun setDuration(dur: Double) { _duration.value = dur }

    suspend fun playTrack(track: Track, queue: List<Track> = listOf(track), index: Int = 0) {
        _currentTrack.value = track
        _queue.value = queue
        _currentIndex.value = index
        _isPlaying.value = true
        addToRecent(track)
    }

    suspend fun playNext() {
        val q = _queue.value
        val idx = _currentIndex.value
        if (idx + 1 < q.size) {
            playTrack(q[idx + 1], q, idx + 1)
        }
    }

    suspend fun playPrevious() {
        val q = _queue.value
        val idx = _currentIndex.value
        if (idx - 1 >= 0) {
            playTrack(q[idx - 1], q, idx - 1)
        }
    }

    suspend fun searchMusic(query: String) {
        _isLoading.value = true
        _searchResults.value = MusicApi.search(query)
        _isLoading.value = false
    }

    suspend fun loadSuggestions(query: String) {
        _suggestions.value = MusicApi.getSuggestions(query)
    }

    suspend fun loadHome() {
        _isLoading.value = true
        val trending = MusicApi.search("trending 2024")
        _homeData.value = trending
        _isLoading.value = false
    }

    suspend fun loadLeaderboard() {
        _leaderboard.value = MusicApi.getLeaderboard()
    }

    suspend fun loadLyrics(track: Track) {
        _lyrics.value = MusicApi.getLyrics(track.trackId, track.title, track.artist)
    }

    suspend fun getAudioUrl(track: Track): String? {
        val url = track.ytUrl.ifEmpty { "https://youtube.com/watch?v=${track.trackId}" }
        return MusicApi.getAudioUrl(url)
    }

    // Local liked songs
    fun toggleLike(track: Track) {
        val current = _likedSongs.value.toMutableList()
        val idx = current.indexOfFirst { it.trackId == track.trackId }
        if (idx >= 0) current.removeAt(idx) else current.add(0, track)
        _likedSongs.value = current
    }

    fun isLiked(track: Track): Boolean {
        return _likedSongs.value.any { it.trackId == track.trackId }
    }

    // Local recent
    private fun addToRecent(track: Track) {
        val current = _recentTracks.value.toMutableList()
        current.removeAll { it.trackId == track.trackId }
        current.add(0, track)
        if (current.size > 50) current.removeLast()
        _recentTracks.value = current
    }
}
