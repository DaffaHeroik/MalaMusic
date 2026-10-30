package com.malamusic.app.data.api

import com.malamusic.app.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import android.content.Context
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
    @Volatile private var appContext: Context? = null
    @Volatile private var sessionCookie: String = ""
    @Volatile private var cachedPlaylists = JSONArray()
    @Volatile private var cachedLikedArtists = JSONArray()

    fun initialize(context: Context) {
        appContext = context.applicationContext
        sessionCookie = appContext?.getSharedPreferences("malamusic_auth", Context.MODE_PRIVATE)?.getString("session_cookie", "") ?: ""
    }

    private fun persistSessionCookie(value: String) {
        sessionCookie = value
        appContext?.getSharedPreferences("malamusic_auth", Context.MODE_PRIVATE)?.edit()?.putString("session_cookie", value)?.apply()
    }

    suspend fun getSession(): AuthUser? = withContext(Dispatchers.IO) {
        try {
            val json = httpGet("$BASE_URL/api/email-auth?action=me")
            val user = json.optJSONObject("user")
            if (json.optBoolean("authenticated") && user != null) AuthUser(user.optString("uid"), user.optString("email"), user.optString("name"), user.optString("picture"), user.optBoolean("emailVerified")) else null
        } catch (_: Exception) { null }
    }

    suspend fun login(email: String, password: String): AuthUser = authAction("login", JSONObject().put("email", email).put("password", password))
    suspend fun register(name: String, email: String, password: String): AuthUser = authAction("register", JSONObject().put("name", name).put("email", email).put("password", password))
    suspend fun exchangeMobileGoogleCode(code: String): AuthUser = withContext(Dispatchers.IO) {
        val json = httpPost("$BASE_URL/api/email-auth?action=mobile-google-exchange", JSONObject().put("code", code).toString())
        if (!json.optBoolean("status") || !json.optBoolean("authenticated")) throw IllegalStateException(json.optString("message", "Google Login gagal."))
        val token = json.optString("sessionToken")
        if (token.isBlank()) throw IllegalStateException("Sesi Google tidak diterima.")
        persistSessionCookie(token)
        val u = json.optJSONObject("user") ?: throw IllegalStateException("Data akun tidak lengkap.")
        AuthUser(u.optString("uid"), u.optString("email"), u.optString("name"), u.optString("picture"), u.optBoolean("emailVerified"))
    }

    suspend fun resetPassword(email: String): String = withContext(Dispatchers.IO) {
        val json = httpPost("$BASE_URL/api/email-auth?action=password-reset", JSONObject().put("email", email.trim()).toString())
        if (json.optBoolean("status")) json.optString("message", "Jika akun terdaftar, link reset password dikirim.") else throw IllegalStateException(json.optString("message", "Reset password gagal."))
    }

    private suspend fun authAction(action: String, body: JSONObject): AuthUser = withContext(Dispatchers.IO) {
        val json = httpPost("$BASE_URL/api/email-auth?action=$action", body.toString())
        if (!json.optBoolean("status") || !json.optBoolean("authenticated")) throw IllegalStateException(json.optString("message", "Autentikasi gagal."))
        val u = json.optJSONObject("user") ?: throw IllegalStateException("Respons akun tidak lengkap.")
        AuthUser(u.optString("uid"), u.optString("email"), u.optString("name"), u.optString("picture"), u.optBoolean("emailVerified"))
    }

    suspend fun logout() = withContext(Dispatchers.IO) {
        try { httpGet("$BASE_URL/api/email-auth?action=logout") } finally { persistSessionCookie("") }
    }

    suspend fun getProfile(): JSONObject = withContext(Dispatchers.IO) { httpGet("$BASE_URL/api/profile") }

    suspend fun getLibrary(): Pair<List<Track>, List<Track>> = withContext(Dispatchers.IO) {
        val json = httpGet("$BASE_URL/api/library")
        val library = json.optJSONObject("library") ?: JSONObject()
        cachedPlaylists = library.optJSONArray("playlists") ?: JSONArray()
        cachedLikedArtists = library.optJSONArray("likedArtists") ?: JSONArray()
        Pair(parseTracks(library.optJSONArray("likedSongs")), parseTracks(library.optJSONArray("recentTracks")))
    }

    suspend fun putLibrary(likedSongs: List<Track>, recentTracks: List<Track>) = withContext(Dispatchers.IO) {
        val liked = JSONArray(); likedSongs.forEach { liked.put(trackJson(it)) }
        val recent = JSONArray(); recentTracks.forEach { recent.put(trackJson(it)) }
        httpPut("$BASE_URL/api/library", JSONObject().put("likedSongs", liked).put("recentTracks", recent).put("playlists", cachedPlaylists).put("likedArtists", cachedLikedArtists).toString())
    }

    private fun trackJson(t: Track) = JSONObject().put("videoId", t.videoId).put("id", t.id).put("title", t.title).put("artist", t.artist).put("cover", t.cover).put("artistId", t.artistId).put("ytUrl", t.ytUrl).put("duration", t.duration).put("albumName", t.albumName)

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

    /** Same as [search] but propagates network errors so callers can show the web's "Pencarian gagal" state. */
    suspend fun searchThrows(query: String, type: String = "all"): SearchResults = withContext(Dispatchers.IO) {
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

    /** Web parity: account-scoped stats for the home streak card. */
    suspend fun getMyStats(): StreakStats? = withContext(Dispatchers.IO) {
        try {
            val json = httpGet("$BASE_URL/api/stats?action=me")
            if (json.optBoolean("status", false)) {
                val s = json.optJSONObject("stats") ?: JSONObject()
                StreakStats(
                    current = s.optInt("streak", 0),
                    best = s.optInt("bestStreak", 0),
                    activeDays = s.optInt("activeDays", 0)
                )
            } else null
        } catch (e: Exception) { null }
    }

    /** Web parity: user search (/api/users?query=) for the "Pengguna" filter tab. */
    suspend fun searchUsers(query: String): List<UserEntry> = withContext(Dispatchers.IO) {
        try {
            val json = httpGet("$BASE_URL/api/users?query=${URLEncoder.encode(query, "UTF-8")}")
            if (json.optBoolean("status", false)) {
                val arr = json.optJSONArray("users") ?: JSONArray()
                (0 until arr.length()).mapNotNull { i ->
                    val o = arr.optJSONObject(i) ?: return@mapNotNull null
                    UserEntry(
                        id = o.optString("id", ""),
                        name = o.optString("name", ""),
                        picture = o.optString("picture", "")
                    )
                }
            } else emptyList()
        } catch (e: Exception) { emptyList() }
    }

    /** Web parity: public user profile modal (/api/users?uid=). */
    suspend fun getUserProfile(uid: String): Pair<UserEntry, List<Playlist>> = withContext(Dispatchers.IO) {
        try {
            val json = httpGet("$BASE_URL/api/users?uid=${URLEncoder.encode(uid, "UTF-8")}")
            if (json.optBoolean("status", false)) {
                val profile = json.optJSONObject("profile") ?: JSONObject()
                val user = UserEntry(
                    id = profile.optString("id", uid),
                    name = profile.optString("name", ""),
                    picture = profile.optString("picture", "")
                )
                val playlists = parseUserPlaylists(json.optJSONArray("playlists"))
                Pair(user, playlists)
            } else Pair(UserEntry(id = uid), emptyList())
        } catch (e: Exception) { Pair(UserEntry(id = uid), emptyList()) }
    }

    private fun parseUserPlaylists(arr: JSONArray?): List<Playlist> {
        if (arr == null) return emptyList()
        return (0 until arr.length()).mapNotNull { i ->
            val o = arr.optJSONObject(i) ?: return@mapNotNull null
            Playlist(
                id = o.optString("id", ""),
                name = o.optString("name", o.optString("title", "")),
                image = o.optString("image", o.optString("cover", "")),
                songs = parseTracks(o.optJSONArray("songs")),
                creator = o.optString("creator", o.optString("author", ""))
            )
        }
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
            sessionCookie.takeIf { it.isNotBlank() }?.let { setRequestProperty("Cookie", "mm_session=$it") }
        }
        return try {
            val body = (if (conn.responseCode in 200..299) conn.inputStream else conn.errorStream)?.bufferedReader()?.readText().orEmpty()
            JSONObject(body).also { captureSessionCookie(conn) }.also { if (conn.responseCode !in 200..299) throw IllegalStateException(it.optString("message", "Permintaan gagal (${conn.responseCode}).")) }
        } finally { conn.disconnect() }
    }

    private fun captureSessionCookie(conn: HttpURLConnection) {
        val raw = conn.getHeaderField("Set-Cookie") ?: return
        val value = raw.split(';').firstOrNull()?.takeIf { it.startsWith("mm_session=") }?.substringAfter('=') ?: return
        persistSessionCookie(value)
    }

    private fun httpPut(urlStr: String, jsonBody: String): JSONObject {
        val conn = (URL(urlStr).openConnection() as HttpURLConnection).apply {
            requestMethod = "PUT"; connectTimeout = TIMEOUT; readTimeout = TIMEOUT; doOutput = true
            setRequestProperty("Content-Type", "application/json"); setRequestProperty("Accept", "application/json")
            sessionCookie.takeIf { it.isNotBlank() }?.let { setRequestProperty("Cookie", "mm_session=$it") }
            outputStream.use { it.write(jsonBody.toByteArray(Charsets.UTF_8)) }
        }
        return try {
            val body = (if (conn.responseCode in 200..299) conn.inputStream else conn.errorStream)?.bufferedReader()?.readText().orEmpty()
            JSONObject(body).also { captureSessionCookie(conn) }.also { if (conn.responseCode !in 200..299) throw IllegalStateException(it.optString("message", "Permintaan gagal (${conn.responseCode}).")) }
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
            setRequestProperty("Accept", "application/json")
            sessionCookie.takeIf { it.isNotBlank() }?.let { setRequestProperty("Cookie", "mm_session=$it") }
            outputStream.write(jsonBody.toByteArray())
        }
        return try {
            val body = (if (conn.responseCode in 200..299) conn.inputStream else conn.errorStream)?.bufferedReader()?.readText().orEmpty()
            JSONObject(body).also { captureSessionCookie(conn) }.also { if (conn.responseCode !in 200..299) throw IllegalStateException(it.optString("message", "Permintaan gagal (${conn.responseCode}).")) }
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
