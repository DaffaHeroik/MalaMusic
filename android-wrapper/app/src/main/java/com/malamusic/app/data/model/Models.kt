package com.malamusic.app.data.model

import java.io.Serializable

data class Track(
    val videoId: String = "",
    val id: String = "",
    val title: String = "Lagu",
    val artist: String = "Unknown",
    val cover: String = "",
    val artistId: String = "",
    val ytUrl: String = "",
    val duration: String = "",
    val albumName: String = ""
) : Serializable {
    val trackId: String get() = videoId.ifEmpty { id }
    val coverUrl: String get() = cover.ifEmpty { "https://i.ytimg.com/vi_webp/$trackId/hqdefault.webp" }
}

data class Playlist(
    val id: String = "",
    val name: String = "",
    val image: String = "",
    val songs: List<Track> = emptyList(),
    val creator: String = "",
    val isPublic: Boolean = false,
    val updatedAt: Long = 0L
) : Serializable

data class Artist(
    val id: String = "",
    val name: String = "",
    val thumbnail: String = "",
    val subtitle: String = "Artist",
    val browseId: String = ""
) : Serializable

data class Album(
    val id: String = "",
    val title: String = "",
    val cover: String = "",
    val artist: String = "",
    val year: String = "",
    val songs: List<Track> = emptyList()
) : Serializable

data class SearchResults(
    val songs: List<Track> = emptyList(),
    val playlists: List<Playlist> = emptyList(),
    val artists: List<Artist> = emptyList(),
    val albums: List<Album> = emptyList()
)

data class Suggestion(
    val text: String = ""
)

/** Web-parity user search (/api/users?query=) */
data class UserEntry(
    val id: String = "",
    val name: String = "",
    val picture: String = ""
)

/** Web-parity search recommendations (S.rec0..2: "baru rilis" / "barat Top" / "Rapp Top"). */
data class SearchRecs(
    val rec0: List<Track> = emptyList(),
    val rec1: List<Track> = emptyList(),
    val rec2: List<Track> = emptyList(),
    val loaded: Boolean = false
)

data class LyricsResult(
    val type: String = "none",
    val lines: List<LyricLine> = emptyList()
)

data class LyricLine(
    val start: Long = 0,
    val end: Long = 0,
    val text: String = "",
    val translation: String = ""
)

data class LeaderboardEntry(
    val rank: Int = 0,
    val name: String = "",
    val hours: Double = 0.0,
    val totalSeconds: Long = 0,
    val activeDays: Int = 0,
    val streak: Int = 0,
    val bestStreak: Int = 0
)

data class StreakStats(
    val current: Int = 0,
    val best: Int = 0,
    val activeDays: Int = 0
)

/** Mirrors the web Streak card: null = stats not loaded / logged out. */
data class StreakState(
    val loaded: Boolean = false,
    val hasAccount: Boolean = false,
    val stats: StreakStats = StreakStats()
)

data class HomeCategoryResults(
    val category: String = "",
    val songs: List<Track> = emptyList(),
    val playlists: List<Playlist> = emptyList(),
    val artists: List<Artist> = emptyList()
)

data class ListenTogetherRoom(
    val id: String = "",
    val host: HostInfo = HostInfo(),
    val state: RoomState = RoomState(),
    val participants: List<Participant> = emptyList(),
    val role: String = "listener"
)

data class HostInfo(
    val name: String = "",
    val email: String = ""
)

data class RoomState(
    val queue: List<Track> = emptyList(),
    val index: Int = 0,
    val track: Track? = null,
    val playing: Boolean = false,
    val position: Double = 0.0
)

data class Participant(
    val uid: String = "",
    val name: String = "",
    val host: Boolean = false,
    val online: Boolean = true
)

data class BlendRoom(
    val id: String = "",
    val name: String = "",
    val inviteUrl: String = "",
    val songs: List<Track> = emptyList()
)


data class AuthUser(
    val uid: String = "",
    val email: String = "",
    val name: String = "",
    val picture: String = "",
    val emailVerified: Boolean = false
)
