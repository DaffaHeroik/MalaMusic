package com.malamusic.app.data.api

import com.malamusic.app.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

/**
 * Direct HTTP calls to MalaMusic API (no Retrofit dependency needed).
 * Uses OkHttp-free approach with java.net for minimal APK size.
 */
object MusicApi {

    private const val BASE_URL = "https://music.malawalipayment.web.id"
    private const val TIMEOUT = 15_000

    suspend fun search(query: String, type: String = "all"): SearchResults = withContext(Dispatchers.IO) {
        try {
            val url = "$BASE_URL/api/search?query=${URLEncoder.encode(query, "UTF-8")}&type=$type"
            val json = httpGet(url)
            if (json.optBoolean("status", false)) {
                val result = json.optJSONObject("result") ?: JSONObject()
                SearchResults(
                    songs = parseTracks(result.optJSONArray("songs")),
                    playlists = parsePlaylists(result.optJSONArray("playlists")),
                    artists = parseArtists(result.optJSONArray("artists")),
                    albums = parseAlbums(result.optJSONArray("albums"))
                )
            } else SearchResults()
        } catch (e: Exception) { SearchResults() }
    }

    suspend fun getSuggestions(query: String): List<Suggestion> = withContext(Dispatchers.IO) {
        try {
            val url = "$BASE_URL/api/suggest?query=${URLEncoder.encode(query, "UTF-8")}"
            val json = httpGetRaw(url)
            val arr = JSONArray(json)
            (0 until arr.length()).map { Suggestion(arr.getString(it)) }
        } catch (e: Exception) { emptyList() }
    }

    suspend fun getArtist(id: String): Pair<Artist, List<Track>> = withContext(Dispatchers.IO) {
        try {
            val url = "$BASE_URL/api/artist?id=${URLEncoder.encode(id, "UTF-8")}"
            val json = httpGet(url)
            if (json.optBoolean("status", false)) {
                val data = json.optJSONObject("result") ?: JSONObject()
                val artist = Artist(
                    id = id,
                    name = data.optString("name", ""),
                    thumbnail = data.optString("thumbnail", ""),
                    subtitle = data.optString("subtitle", "Artist")
                )
                val tracks = parseTracks(data.optJSONArray("songs"))
                Pair(artist, tracks)
            } else Pair(Artist(id = id), emptyList())
        } catch (e: Exception) { Pair(Artist(id = id), emptyList()) }
    }

    suspend fun getAlbum(id: String): Album = withContext(Dispatchers.IO) {
        try {
            val url = "$BASE_URL/api/album?id=${URLEncoder.encode(id, "UTF-8")}"
            val json = httpGet(url)
            if (json.optBoolean("status", false)) {
                val data = json.optJSONObject("result") ?: JSONObject()
                Album(
                    id = id,
                    title = data.optString("title", ""),
                    cover = data.optString("cover", ""),
                    artist = data.optString("artist", ""),
                    year = data.optString("year", ""),
                    songs = parseTracks(data.optJSONArray("songs"))
                )
            } else Album(id = id)
        } catch (e: Exception) { Album(id = id) }
    }

    suspend fun getLyrics(videoId: String, title: String = "", artist: String = ""): LyricsResult = withContext(Dispatchers.IO) {
        try {
            var url = "$BASE_URL/api/lyrics?id=$videoId"
            if (title.isNotEmpty()) url += "&title=${URLEncoder.encode(title, "UTF-8")}"
            if (artist.isNotEmpty()) url += "&artist=${URLEncoder.encode(artist, "UTF-8")}"
            val json = httpGet(url)
            if (json.optBoolean("status", false)) {
                val result = json.optJSONObject("result") ?: JSONObject()
                val lyrics = result.optJSONObject("lyrics") ?: JSONObject()
                val lines = lyrics.optJSONArray("lines") ?: JSONArray()
                LyricsResult(
                    type = lyrics.optString("type", "none"),
                    lines = (0 until lines.length()).map { i ->
                        val line = lines.optJSONObject(i) ?: JSONObject()
                        LyricLine(
                            start = line.optLong("start", 0),
                            end = line.optLong("end", 0),
                            text = line.optString("text", ""),
                            translation = line.optString("translation", "")
                        )
                    }
                )
            } else LyricsResult()
        } catch (e: Exception) { LyricsResult() }
    }

    suspend fun getAudioUrl(ytUrl: String): String? = withContext(Dispatchers.IO) {
        try {
            val body = JSONObject().put("query", ytUrl)
            val json = httpPost("$BASE_URL/api/ytplay", body.toString())
            if (json.optBoolean("status", false)) {
                json.optJSONObject("result")?.optJSONObject("download")?.optString("audio", null)
            } else null
        } catch (e: Exception) { null }
    }

    suspend fun getLeaderboard(): List<LeaderboardEntry> = withContext(Dispatchers.IO) {
        try {
            val json = httpGet("$BASE_URL/api/stats?action=leaderboard")
            if (json.optBoolean("status", false)) {
                val arr = json.optJSONArray("leaderboard") ?: JSONArray()
                (0 until arr.length()).map { i ->
                    val entry = arr.optJSONObject(i) ?: JSONObject()
                    LeaderboardEntry(
                        rank = entry.optInt("rank", i + 1),
                        name = entry.optString("name", ""),
                        hours = entry.optDouble("hours", 0.0),
                        totalSeconds = entry.optLong("totalSeconds", 0),
                        activeDays = entry.optInt("activeDays", 0),
                        streak = entry.optInt("streak", 0),
                        bestStreak = entry.optInt("bestStreak", 0)
                    )
                }
            } else emptyList()
        } catch (e: Exception) { emptyList() }
    }

    // HTTP helpers
    private fun httpGet(urlStr: String): JSONObject {
        val conn = (URL(urlStr).openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            connectTimeout = TIMEOUT
            readTimeout = TIMEOUT
            setRequestProperty("Accept", "application/json")
        }
        return try {
            val body = conn.inputStream.bufferedReader().readText()
            JSONObject(body)
        } finally { conn.disconnect() }
    }

    private fun httpGetRaw(urlStr: String): String {
        val conn = (URL(urlStr).openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            connectTimeout = TIMEOUT
            readTimeout = TIMEOUT
        }
        return try { conn.inputStream.bufferedReader().readText() }
        finally { conn.disconnect() }
    }

    private fun httpPost(urlStr: String, jsonBody: String): JSONObject {
        val conn = (URL(urlStr).openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            connectTimeout = TIMEOUT
            readTimeout = TIMEOUT
            doOutput = true
            setRequestProperty("Content-Type", "application/json")
            outputStream.write(jsonBody.toByteArray())
        }
        return try {
            val body = conn.inputStream.bufferedReader().readText()
            JSONObject(body)
        } finally { conn.disconnect() }
    }

    // Parsing helpers
    private fun parseTracks(arr: JSONArray?): List<Track> {
        if (arr == null) return emptyList()
        return (0 until arr.length()).mapNotNull { i ->
            val o = arr.optJSONObject(i) ?: return@mapNotNull null
            Track(
                videoId = o.optString("videoId", o.optString("id", "")),
                id = o.optString("id", ""),
                title = o.optString("title", ""),
                artist = o.optString("artist", ""),
                cover = o.optString("thumbnail", o.optString("cover", "")),
                artistId = o.optString("artistId", ""),
                ytUrl = o.optString("url", o.optString("ytUrl", "")),
                duration = o.optString("duration", ""),
                albumName = o.optString("albumName", "")
            )
        }
    }

    private fun parsePlaylists(arr: JSONArray?): List<Playlist> {
        if (arr == null) return emptyList()
        return (0 until arr.length()).mapNotNull { i ->
            val o = arr.optJSONObject(i) ?: return@mapNotNull null
            Playlist(
                id = o.optString("id", ""),
                name = o.optString("title", o.optString("name", "")),
                image = o.optString("cover", o.optString("image", "")),
                songs = parseTracks(o.optJSONArray("songs")),
                creator = o.optString("author", "")
            )
        }
    }

    private fun parseArtists(arr: JSONArray?): List<Artist> {
        if (arr == null) return emptyList()
        return (0 until arr.length()).mapNotNull { i ->
            val o = arr.optJSONObject(i) ?: return@mapNotNull null
            Artist(
                id = o.optString("browseId", o.optString("id", "")),
                name = o.optString("name", ""),
                thumbnail = o.optString("thumbnail", ""),
                subtitle = o.optString("subtitle", "Artist")
            )
        }
    }

    private fun parseAlbums(arr: JSONArray?): List<Album> {
        if (arr == null) return emptyList()
        return (0 until arr.length()).mapNotNull { i ->
            val o = arr.optJSONObject(i) ?: return@mapNotNull null
            Album(
                id = o.optString("browseId", o.optString("id", "")),
                title = o.optString("title", ""),
                cover = o.optString("cover", ""),
                artist = o.optString("artist", ""),
                year = o.optString("year", "")
            )
        }
    }
}
