package com.malamusic.app.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.malamusic.app.R
import com.malamusic.app.data.model.Artist
import com.malamusic.app.data.model.Track
import com.malamusic.app.data.repository.MusicRepository
import com.malamusic.app.ui.components.Artwork
import com.malamusic.app.ui.components.TrackArtwork
import com.malamusic.app.ui.theme.*

/**
 * Library ("Koleksi") screen — 1:1 with web library.js:
 * banner header, 4 tabs (Playlists / Artis / Lagu Disukai / Mode Offline)
 * with icons, collection search + sort (Terbaru/A-Z/Artis) + grid/list
 * layout toggle, and per-tab empty states.
 */
@Composable
fun LibraryScreen(
    repository: MusicRepository,
    onTrackClick: (Track, List<Track>) -> Unit,
    onOpenSearch: () -> Unit = {}
) {
    var activeTab by remember { mutableStateOf("playlists") }
    val ctx = LocalContext.current
    val prefs = remember { ctx.getSharedPreferences("malamusic_lib", android.content.Context.MODE_PRIVATE) }
    var query by remember { mutableStateOf(prefs.getString("library_query", "") ?: "") }
    var sort by remember { mutableStateOf(prefs.getString("library_sort", "recent") ?: "recent") }
    var layout by remember { mutableStateOf(prefs.getString("library_layout", "grid") ?: "grid") }

    val likedSongs by repository.likedSongs.collectAsState()
    val current by repository.currentTrack.collectAsState()
    val playing by repository.isPlaying.collectAsState()
    val buffering by repository.isBuffering.collectAsState()
    val downloadedTracks by (repository.audioCache?.downloads?.collectAsState() ?: remember { mutableStateOf(emptyList<Track>()) })

    var sortMenuOpen by remember { mutableStateOf(false) }

    val q = query.trim().lowercase()
    fun matches(t: Track) = q.isEmpty() || (t.title + " " + t.artist).lowercase().contains(q)
    fun matchedSongs(): List<Track> {
        val base = likedSongs.filter { matches(it) }
        return when (sort) {
            "name" -> base.sortedBy { it.title.lowercase() }
            "artist" -> base.sortedBy { it.artist.lowercase() }
            else -> base
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBackground)
    ) {
        // Banner sticky header (web library header)
        Box(modifier = Modifier.fillMaxWidth()) {
            Box(modifier = Modifier.fillMaxWidth().background(DarkBackground)) {
                Image(
                    painter = painterResource(R.drawable.banner),
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    alpha = 0.45f,
                    modifier = Modifier.fillMaxSize()
                )
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            brush = Brush.verticalGradient(
                                colors = listOf(
                                    DarkBackground.copy(alpha = 0.4f),
                                    DarkBackground.copy(alpha = 0.95f)
                                )
                            )
                        )
                )
            }
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(start = 16.dp, end = 16.dp, top = 44.dp, bottom = 14.dp)
            ) {
                Text(
                    "Koleksi",
                    fontSize = 30.sp,
                    fontWeight = FontWeight.Black,
                    color = TextPrimary,
                    letterSpacing = (-0.5).sp
                )
                Spacer(Modifier.height(12.dp))

                // Tab bar with icons
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(Color.Black.copy(alpha = 0.4f))
                        .border(1.dp, Color.White.copy(alpha = 0.15f), RoundedCornerShape(16.dp))
                        .padding(6.dp)
                ) {
                    LibraryTab(
                        "Playlists", Icons.Filled.QueueMusic, Color(0xFF2563EB),
                        "playlists", activeTab
                    ) { activeTab = it }
                    LibraryTab(
                        "Artis", Icons.Filled.Person, Color(0xFFD97706),
                        "artists", activeTab
                    ) { activeTab = it }
                    LibraryTab(
                        "Lagu Disukai", Icons.Filled.Favorite, Color(0xFFE11D48),
                        "songs", activeTab
                    ) { activeTab = it }
                    LibraryTab(
                        "Mode Offline", Icons.Filled.Download, Color(0xFF67E8F9),
                        "offline", activeTab
                    ) {
                        activeTab = it
                    }
                }

                // Search + sort + layout toggle row
                Spacer(Modifier.height(12.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    val placeholder = when (activeTab) {
                        "playlists" -> "Cari playlist kamu"
                        "artists" -> "Cari artis yang diikuti"
                        else -> "Cari lagu disukai"
                    }
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color.Black.copy(alpha = 0.35f))
                            .border(1.dp, Color.White.copy(alpha = 0.15f), RoundedCornerShape(12.dp))
                            .padding(start = 12.dp, end = 8.dp)
                    ) {
                        Icon(Icons.Filled.Search, null, tint = Color.White.copy(alpha = 0.45f), modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(8.dp))
                        TextField(
                            value = query,
                            onValueChange = {
                                query = it
                                prefs.edit().putString("library_query", it.trim()).apply()
                            },
                            modifier = Modifier.weight(1f),
                            placeholder = { Text(placeholder, color = Color.White.copy(alpha = 0.4f), fontSize = 12.sp) },
                            singleLine = true,
                            colors = TextFieldDefaults.colors(
                                focusedTextColor = TextPrimary,
                                unfocusedTextColor = TextPrimary,
                                focusedContainerColor = Color.Transparent,
                                unfocusedContainerColor = Color.Transparent,
                                cursorColor = TextPrimary,
                                focusedIndicatorColor = Color.Transparent,
                                unfocusedIndicatorColor = Color.Transparent,
                                disabledIndicatorColor = Color.Transparent
                            )
                        )
                    }
                    Spacer(Modifier.width(8.dp))
                    Box {
                        Row(
                            modifier = Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color.Black.copy(alpha = 0.35f))
                                .border(1.dp, Color.White.copy(alpha = 0.15f), RoundedCornerShape(12.dp))
                                .clickable { sortMenuOpen = !sortMenuOpen }
                                .padding(horizontal = 10.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                when (sort) {
                                    "name" -> "A-Z"
                                    "artist" -> "Artis"
                                    else -> "Terbaru"
                                },
                                color = TextPrimary,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium
                            )
                            Spacer(Modifier.width(4.dp))
                            Icon(Icons.Filled.ArrowDropDown, null, tint = TextSecondary, modifier = Modifier.size(14.dp))
                        }
                        if (sortMenuOpen) {
                            Surface(
                                color = Color(0xFF1C1E26),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier
                                    .align(Alignment.BottomEnd)
                                    .offset(y = (-8).dp)
                                    .padding(top = 30.dp)
                            ) {
                                Column(modifier = Modifier.padding(4.dp)) {
                                    listOf("recent" to "Terbaru", "name" to "A-Z", "artist" to "Artis").forEach { pair ->
                                        Text(
                                            pair.second,
                                            color = if (sort == pair.first) TextPrimary else TextSecondary,
                                            fontSize = 13.sp,
                                            fontWeight = if (sort == pair.first) FontWeight.Bold else FontWeight.Medium,
                                            modifier = Modifier
                                                .clickable {
                                                    sort = pair.first
                                                    sortMenuOpen = false
                                                    prefs.edit().putString("library_sort", pair.first).apply()
                                                }
                                                .padding(horizontal = 16.dp, vertical = 10.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }
                    Spacer(Modifier.width(8.dp))
                    Row(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color.Black.copy(alpha = 0.35f))
                            .border(1.dp, Color.White.copy(alpha = 0.15f), RoundedCornerShape(12.dp))
                            .clickable {
                                val next = if (layout == "grid") "list" else "grid"
                                layout = next
                                prefs.edit().putString("library_layout", next).apply()
                            },
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        Icon(
                            if (layout == "grid") Icons.Filled.ViewList else Icons.Filled.GridOn,
                            null,
                            tint = TextPrimary,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
            }
        }

        // Content
        val songs = matchedSongs()
        when (activeTab) {
            "songs" -> {
                if (songs.isEmpty()) {
                    LibraryEmptyState(
                        icon = Icons.Filled.Favorite,
                        iconBg = Color(0xFFF43F5E),
                        title = "Belum Ada Lagu Disukai",
                        subtitle = "Tekan ikon hati saat menemukan lagu yang ingin kamu simpan.",
                        action = "Cari Lagu"
                    ) { onOpenSearch() }
                } else {
                    LazyColumn(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                        contentPadding = PaddingValues(vertical = 14.dp)
                    ) {
                        items(songs, key = { "ls" + it.trackId }) { track ->
                            SearchSongRow(
                                track = track,
                                current = current,
                                isPlaying = playing,
                                isBuffering = buffering,
                                onClick = { onTrackClick(track, songs) }
                            )
                        }
                    }
                }
            }
            "artists" -> {
                if (likedSongs.isEmpty()) {
                    LibraryEmptyState(
                        icon = Icons.Filled.Person,
                        iconBg = Color(0xFFF59E0B),
                        title = "Belum Ada Artist Disukai",
                        subtitle = "Sukai artist favoritmu untuk melihatnya di sini.",
                        action = "Cari Artist"
                    ) { onOpenSearch() }
                } else {
                    val artists = likedSongs
                        .distinctBy { it.artistId.ifBlank { it.artist } }
                        .map {
                            Artist(
                                id = it.artistId,
                                name = it.artist,
                                thumbnail = it.coverUrl,
                                subtitle = "Artist"
                            )
                        }
                        .filter { a -> q.isEmpty() || (a.name + " " + a.subtitle).lowercase().contains(q) }
                    if (artists.isEmpty()) {
                        LibraryEmptyState(
                            icon = Icons.Filled.Person,
                            iconBg = Color(0xFFF59E0B),
                            title = "Belum Ada Artist Disukai",
                            subtitle = "Sukai artist favoritmu untuk melihatnya di sini.",
                            action = "Cari Artist"
                        ) { onOpenSearch() }
                    } else {
                        Column(
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 14.dp)
                        ) {
                            if (layout == "grid") {
                                LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                    items(artists.chunked(2), key = { "laRow" + it.firstOrNull()?.id ?: "" }) { row ->
                                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                            row.forEach { artist ->
                                                ArtistGridCard(artist, Modifier.weight(1f))
                                            }
                                            if (row.size == 1) Box(Modifier.weight(1f))
                                        }
                                    }
                                }
                            } else {
                                LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                    items(artists, key = { "la" + it.id + it.name }) { artist ->
                                        ArtistGridCard(artist)
                                    }
                                }
                            }
                        }
                    }
                }
            }
            "playlists" -> {
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 14.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color.White.copy(alpha = 0.15f))
                            .border(1.dp, Color.White.copy(alpha = 0.2f), RoundedCornerShape(16.dp))
                            .clickable { onOpenSearch() }
                            .padding(vertical = 14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        Icon(Icons.Filled.Add, null, tint = TextPrimary, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(8.dp))
                        Text(
                            "Buat Playlist Baru",
                            color = TextPrimary,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(Modifier.height(16.dp))
                    LibraryEmptyState(
                        icon = Icons.Filled.QueueMusic,
                        iconBg = Color.White.copy(alpha = 0.1f),
                        title = "Belum Ada Playlist",
                        subtitle = "Buat playlist pertamamu dan kumpulkan lagu-lagu favoritmu di satu tempat.",
                        action = null
                    )
                }
            }
            "offline" -> {
                if (downloadedTracks.isEmpty()) {
                    LibraryEmptyState(icon = Icons.Filled.Download, iconBg = Color(0xFF06B6D4).copy(alpha = 0.1f), title = "Belum Ada Lagu Offline", subtitle = "Buka pemutar lagu lalu tekan Download untuk offline.", action = null)
                } else {
                    LazyColumn(modifier = Modifier.weight(1f).fillMaxWidth().padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(8.dp), contentPadding = PaddingValues(vertical = 14.dp)) {
                        items(downloadedTracks, key = { "offline_" + it.trackId }) { track ->
                            Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(DarkCard).padding(horizontal = 10.dp, vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) {
                                TrackArtwork(track, Modifier.size(48.dp), RoundedCornerShape(8.dp))
                                Spacer(Modifier.width(10.dp))
                                Column(Modifier.weight(1f).clickable { onTrackClick(track, downloadedTracks) }) {
                                    Text(track.title, color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                    Text(track.artist, color = TextSecondary, fontSize = 11.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                }
                                IconButton(onClick = { repository.audioCache?.removeDownload(track) }) { Icon(Icons.Filled.DeleteOutline, "Hapus download", tint = TextSecondary) }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun LibraryTab(
    label: String,
    icon: ImageVector,
    iconTint: Color,
    tab: String,
    active: String,
    onClick: (String) -> Unit
) {
    val isActive = tab == active
    Column(
        modifier = Modifier
            .fillMaxWidth(0.25f)
            .clip(RoundedCornerShape(12.dp))
            .background(if (isActive) Color.White else Color.Transparent)
            .clickable { onClick(tab) }
            .padding(vertical = 10.dp, horizontal = 4.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            icon,
            null,
            tint = if (isActive) iconTint else Color.White.copy(alpha = 0.7f),
            modifier = Modifier.size(16.dp)
        )
        Spacer(Modifier.height(4.dp))
        Text(
            label,
            color = if (isActive) Color.Black else Color.White.copy(alpha = 0.7f),
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center,
            maxLines = 1
        )
    }
}

@Composable
fun LibraryEmptyState(
    icon: ImageVector,
    iconBg: Color,
    title: String,
    subtitle: String,
    action: String?,
    onAction: () -> Unit = {}
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 48.dp)
            .clip(RoundedCornerShape(24.dp))
            .background(Color.White.copy(alpha = 0.04f))
            .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(24.dp))
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .clip(CircleShape)
                    .background(iconBg),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, null, tint = Color.White, modifier = Modifier.size(28.dp))
            }
            Spacer(Modifier.height(16.dp))
            Text(title, color = TextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(6.dp))
            Text(subtitle, color = Color.White.copy(alpha = 0.7f), fontSize = 12.sp, textAlign = TextAlign.Center)
            if (action != null) {
                Spacer(Modifier.height(20.dp))
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(50))
                        .background(Color.White.copy(alpha = 0.1f))
                        .border(1.dp, Color.White.copy(alpha = 0.2f), RoundedCornerShape(50))
                        .clickable { onAction() }
                        .padding(horizontal = 24.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Filled.Search, null, tint = TextPrimary, modifier = Modifier.size(14.dp))
                    Spacer(Modifier.width(6.dp))
                    Text(action, color = TextPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
