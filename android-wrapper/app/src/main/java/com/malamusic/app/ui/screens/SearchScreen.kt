package com.malamusic.app.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
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
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.malamusic.app.R
import com.malamusic.app.data.model.*
import com.malamusic.app.data.repository.MusicRepository
import com.malamusic.app.ui.components.Artwork
import com.malamusic.app.ui.components.TrackArtwork
import com.malamusic.app.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * Search screen — 1:1 with the web search view (public/search.js):
 * banner header with "Cari" title + input + submit button, suggestions,
 * 4 filter tabs (Musik/Playlist/Artis/Pengguna), "Pencarian Terakhir"
 * chips, recommendation rows (Rilis Anyar / Barat Top / Rapp Top),
 * song rows with play buttons + Diputar/Dijeda badges, users grid with
 * public profile modal, artists grid, playlists+albums grid,
 * and error / empty states.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SearchScreen(
    repository: MusicRepository,
    onTrackClick: (Track, List<Track>) -> Unit,
    initialQuery: String = ""
) {
    var query by remember { mutableStateOf(initialQuery) }
    var activeFilter by remember { mutableStateOf("songs") }
    var submitted by remember { mutableStateOf(false) }
    var showSuggestions by remember { mutableStateOf(false) }
    var selectedUser by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    val searchResults by repository.searchResults.collectAsState()
    val suggestions by repository.suggestions.collectAsState()
    val isSearching by repository.isSearching.collectAsState()
    val searchSubmitted by repository.searchSubmitted.collectAsState()
    val searchUsers by repository.searchUsers.collectAsState()
    val searchError by repository.searchError.collectAsState()
    val recs by repository.searchRecs.collectAsState()
    val recentSearches by repository.recentSearches.collectAsState()
    val currentTrack by repository.currentTrack.collectAsState()
    val isPlaying by repository.isPlaying.collectAsState()
    val isBuffering by repository.isBuffering.collectAsState()

    // Web parity: load recommendation rows on show
    LaunchedEffect(Unit) {
        if (initialQuery.isNotEmpty()) {
            query = initialQuery
            submitted = true
            repository.searchMusic(initialQuery, submit = true)
        } else {
            repository.loadSearchRecs()
        }
    }

    // Debounced as-you-type search (serves from cache, no UI flag changes)
    LaunchedEffect(query) {
        if (query.isBlank()) {
            showSuggestions = false
            return@LaunchedEffect
        }
        showSuggestions = true
        delay(350)
        repository.searchMusic(query)
    }

    fun submitSearch(q: String) {
        if (q.isBlank()) return
        submitted = true
        scope.launch {
            query = q
            showSuggestions = false
            activeFilter = "songs"
            repository.searchMusic(q, submit = true)
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBackground)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(DarkBackground)
        ) {
            // Banner sticky header — mirrors the web search header (banner + blur + gradient)
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
                        "Cari",
                        fontSize = 30.sp,
                        fontWeight = FontWeight.Black,
                        color = TextPrimary,
                        letterSpacing = (-0.5).sp
                    )
                    Spacer(Modifier.height(12.dp))
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color.Black.copy(alpha = 0.4f))
                            .border(1.dp, Color.White.copy(alpha = 0.2f), RoundedCornerShape(16.dp))
                            .padding(start = 16.dp, end = 6.dp, top = 4.dp, bottom = 4.dp)
                    ) {
                        Icon(Icons.Filled.Search, null, tint = TextSecondary, modifier = Modifier.size(20.dp))
                        Spacer(Modifier.width(10.dp))
                        TextField(
                            value = query,
                            onValueChange = { query = it },
                            modifier = Modifier.weight(1f),
                            placeholder = { Text("Cari lagu, artis, playlist, atau pengguna...", color = TextMuted) },
                            singleLine = true,
                            colors = TextFieldDefaults.colors(
                                focusedTextColor = TextPrimary,
                                unfocusedTextColor = TextPrimary,
                                focusedContainerColor = Color.Transparent,
                                unfocusedContainerColor = Color.Transparent,
                                cursorColor = TextPrimary,
                                focusedIndicatorColor = Color.Transparent,
                                unfocusedIndicatorColor = Color.Transparent,
                                disabledIndicatorColor = Color.Transparent,
                                disabledTextColor = TextMuted
                            )
                        )
                        Button(
                            onClick = { submitSearch(query.trim()) },
                            modifier = Modifier.height(40.dp),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Color.White,
                                contentColor = Color.Black,
                                disabledContainerColor = Color.White.copy(alpha = 0.4f),
                                disabledContentColor = Color.Black
                            ),
                            contentPadding = PaddingValues(horizontal = 16.dp),
                            enabled = query.trim().isNotEmpty()
                        ) {
                            Text("Cari", fontWeight = FontWeight.ExtraBold, fontSize = 13.sp)
                        }
                    }
                    if (showSuggestions && suggestions.isNotEmpty() && !submitted) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 8.dp)
                                .clip(RoundedCornerShape(16.dp))
                                .background(Color(0xFF14151B))
                                .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(16.dp))
                        ) {
                            LazyColumn(
                                modifier = Modifier.heightIn(max = 280.dp),
                                contentPadding = PaddingValues(vertical = 6.dp)
                            ) {
                                items(suggestions.take(10)) { suggestion ->
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clickable { submitSearch(suggestion.text) }
                                            .padding(horizontal = 16.dp, vertical = 10.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(
                                            Icons.Filled.Search, null,
                                            tint = TextSecondary,
                                            modifier = Modifier.size(14.dp)
                                        )
                                        Spacer(Modifier.width(12.dp))
                                        Text(suggestion.text, color = TextPrimary, fontSize = 14.sp)
                                    }
                                }
                            }
                        }
                    }
                }
            }

            val hasQuery = searchSubmitted && submitted && query.trim().isNotEmpty()

            if (hasQuery) {
                Surface(
                    color = Color(0x1AFFFFFF),
                    shape = RoundedCornerShape(50),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 6.dp)
                        .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(50))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 6.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        FilterTab("Musik", "songs", activeFilter) { activeFilter = it }
                        FilterTab("Playlist", "playlists", activeFilter) { activeFilter = it }
                        FilterTab("Artis", "artists", activeFilter) { activeFilter = it }
                        FilterTab("Pengguna", "users", activeFilter) { activeFilter = it }
                    }
                }
            }

            if (!hasQuery && recentSearches.isNotEmpty()) {
                Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            Icons.Filled.History, null,
                            tint = Color(0xFFF43F5E),
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(Modifier.width(8.dp))
                        Text(
                            "Pencarian Terakhir",
                            color = TextPrimary,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(Modifier.height(10.dp))
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        contentPadding = PaddingValues(end = 16.dp)
                    ) {
                        items(recentSearches.take(6)) { q ->
                            Row(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(50))
                                    .background(Color.White.copy(alpha = 0.06f))
                                    .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(50))
                                    .clickable { submitSearch(q) }
                                    .padding(horizontal = 14.dp, vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    Icons.Filled.Search, null,
                                    tint = TextSecondary,
                                    modifier = Modifier.size(13.dp)
                                )
                                Spacer(Modifier.width(6.dp))
                                Text(q, color = Color.White.copy(alpha = 0.8f), fontSize = 12.sp)
                            }
                        }
                    }
                }
            }

            LazyColumn(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
                contentPadding = PaddingValues(vertical = 10.dp)
            ) {
                if (!hasQuery) {
                    item { RecSkeletonRow() }
                    item { RecSkeletonRow() }
                    item { RecSkeletonRow() }
                    if (recs.loaded) {
                        item {
                            SearchRecRow(
                                "Rilis Anyar", Icons.Filled.AutoAwesome, Color(0xFFFBBF24),
                                recs.rec0, currentTrack, isPlaying, isBuffering, onTrackClick
                            )
                        }
                        item {
                            SearchRecRow(
                                "Barat Top", Icons.Filled.Public, Color(0xFF38BDF8),
                                recs.rec1, currentTrack, isPlaying, isBuffering, onTrackClick
                            )
                        }
                        item {
                            SearchRecRow(
                                "Rapp Top", Icons.Filled.Whatshot, Color(0xFFFB7185),
                                recs.rec2, currentTrack, isPlaying, isBuffering, onTrackClick
                            )
                        }
                    }
                }

                if (hasQuery) {
                    when {
                        isSearching && searchResults.songs.isEmpty() -> item {
                            Box(
                                modifier = Modifier.fillMaxWidth().padding(vertical = 48.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                CircularProgressIndicator(
                                    color = Color(0xFFCFD3D8),
                                    strokeWidth = 3.dp,
                                    modifier = Modifier.size(32.dp)
                                )
                            }
                        }
                        searchError -> item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = 40.dp)
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(Color(0xFFEF4444).copy(alpha = 0.1f))
                                    .border(1.dp, Color(0xFFF87171).copy(alpha = 0.2f), RoundedCornerShape(16.dp))
                            ) {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(24.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Icon(
                                        Icons.Filled.WifiOff, null,
                                        tint = Color(0xFFFCA5A5),
                                        modifier = Modifier.size(32.dp)
                                    )
                                    Spacer(Modifier.height(12.dp))
                                    Text(
                                        "Pencarian gagal",
                                        color = TextPrimary,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 15.sp
                                    )
                                    Text("Periksa koneksi lalu coba lagi.", color = TextSecondary, fontSize = 12.sp)
                                    Spacer(Modifier.height(16.dp))
                                    Button(
                                        onClick = { submitSearch(query.trim()) },
                                        shape = RoundedCornerShape(50),
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = Color.White,
                                            contentColor = Color.Black
                                        )
                                    ) {
                                        Text("Coba Lagi", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                    }
                                }
                            }
                        }
                        activeFilter == "songs" -> {
                            if (searchResults.songs.isEmpty()) {
                                item { SearchEmptyState() }
                            } else {
                                items(searchResults.songs, key = { "s" + it.trackId }) { track ->
                                    SearchSongRow(
                                        track = track,
                                        current = currentTrack,
                                        isPlaying = isPlaying,
                                        isBuffering = isBuffering,
                                        onClick = { onTrackClick(track, searchResults.songs) }
                                    )
                                }
                            }
                        }
                        activeFilter == "playlists" -> {
                            val pls = searchResults.playlists
                            if (pls.isEmpty()) {
                                item { SearchEmptyState() }
                            } else {
                                items(pls, key = { "pl" + it.id + it.name }) { pl ->
                                    PlaylistGridCard(
                                        pl,
                                        onClick = { pl.songs.firstOrNull()?.let { onTrackClick(it, pl.songs) } }
                                    )
                                }
                            }
                        }
                        activeFilter == "artists" -> {
                            val arts = searchResults.artists
                            if (arts.isEmpty()) {
                                item { SearchEmptyState() }
                            } else {
                                items(arts, key = { "ar" + it.id + it.name }) { artist ->
                                    ArtistGridCard(artist)
                                }
                            }
                        }
                        activeFilter == "users" -> {
                            if (searchUsers.isEmpty()) {
                                item { SearchEmptyState() }
                            } else {
                                items(searchUsers, key = { "u" + it.id }) { user ->
                                    UserGridCard(user) { uid -> selectedUser = uid }
                                }
                            }
                        }
                    }
                }

                item { Spacer(Modifier.height(90.dp)) }
            }
        }

        // Public user profile modal (web openUser parity)
        SearchUserModalHost(
            repository,
            scope,
            selectedUid = selectedUser,
            onDismiss = { selectedUser = null },
            onPlayPlaylist = { songs ->
                selectedUser = null
                songs.firstOrNull()?.let { onTrackClick(it, songs) }
            }
        )
    }
}

@Composable
fun SearchUserModalHost(
    repository: MusicRepository,
    scope: kotlinx.coroutines.CoroutineScope,
    selectedUid: String?,
    onDismiss: () -> Unit,
    onPlayPlaylist: (List<Track>) -> Unit
) {
    var profile by remember { mutableStateOf<Pair<UserEntry, List<Playlist>>?>(null) }
    var loading by remember { mutableStateOf(false) }

    LaunchedEffect(selectedUid) {
        val uid = selectedUid ?: return@LaunchedEffect
        profile = null
        loading = true
        val res = try {
            repository.loadUserProfile(uid)
        } finally {
            loading = false
        }
        profile = res
    }

    if (selectedUid != null) {
        val p = profile
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.75f))
                .clickable { onDismiss() }
        ) {
            Column(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .padding(16.dp)
                    .clip(RoundedCornerShape(24.dp))
                    .background(Color(0xFF15151B))
                    .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(24.dp))
            ) {
                Row(
                    modifier = Modifier.padding(20.dp).fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Artwork(
                        url = p?.first?.picture,
                        modifier = Modifier.size(64.dp),
                        shape = CircleShape,
                        contentDescription = p?.first?.name
                    )
                    Spacer(Modifier.width(16.dp))
                    Column(Modifier.weight(1f)) {
                        Text(
                            "PROFIL PUBLIK",
                            color = Color(0xFFEFDDB4).copy(alpha = 0.7f),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Black,
                            letterSpacing = 2.sp
                        )
                        Text(
                            p?.first?.name?.ifBlank { "Pengguna MalaMusic" } ?: "Pengguna MalaMusic" ,
                            color = TextPrimary,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Black,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Text(
                            "${p?.second?.size ?: 0} playlist publik",
                            color = TextSecondary,
                            fontSize = 12.sp
                        )
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Filled.Close, null, tint = Color.White.copy(alpha = 0.6f))
                    }
                }
                if (loading) {
                    Box(Modifier.fillMaxWidth().padding(24.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(
                            color = TextPrimary,
                            strokeWidth = 3.dp,
                            modifier = Modifier.size(28.dp)
                        )
                    }
                } else {
                    val pls = p?.second ?: emptyList()
                    if (pls.isEmpty()) {
                        Text(
                            "Belum ada playlist publik.",
                            color = TextSecondary,
                            fontSize = 13.sp,
                            modifier = Modifier.padding(24.dp)
                        )
                    } else {
                        LazyColumn(
                            modifier = Modifier.heightIn(max = 360.dp),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            items(pls, key = { "upl" + it.id + it.name }) { pl ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable {
                                            onPlayPlaylist(pl.songs)
                                        }
                                        .padding(vertical = 10.dp, horizontal = 8.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Artwork(
                                        url = pl.image.ifBlank { pl.songs.firstOrNull()?.coverUrl ?: "" },
                                        modifier = Modifier.size(48.dp),
                                        shape = RoundedCornerShape(10.dp),
                                        contentDescription = pl.name
                                    )
                                    Spacer(Modifier.width(12.dp))
                                    Column(Modifier.weight(1f)) {
                                        Text(
                                            pl.name,
                                            color = TextPrimary,
                                            fontSize = 14.sp,
                                            fontWeight = FontWeight.Bold,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                        Text("${pl.songs.size} lagu", color = TextSecondary, fontSize = 12.sp)
                                    }
                                    Icon(
                                        Icons.Filled.ChevronRight, null,
                                        tint = Color.White.copy(alpha = 0.4f),
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun FilterTab(label: String, filter: String, active: String, onClick: (String) -> Unit) {
    val isActive = filter == active
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(50))
            .background(if (isActive) Color.White.copy(alpha = 0.14f) else Color.Transparent)
            .border(
                width = if (isActive) 1.dp else 0.dp,
                brush = SolidColor(
                    if (isActive) Color.White.copy(alpha = 0.3f) else Color.Transparent
                ),
                shape = RoundedCornerShape(50)
            )
            .clickable { onClick(filter) }
            .padding(horizontal = 12.dp, vertical = 9.dp)
    ) {
        Text(
            label,
            color = if (isActive) TextPrimary else TextSecondary,
            fontSize = 11.sp,
            fontWeight = if (isActive) FontWeight.Bold else FontWeight.SemiBold
        )
    }
}

/** Song row with web-style play button + "Diputar"/"Dijeda" badge. */
@Composable
fun SearchSongRow(
    track: Track,
    current: Track?,
    isPlaying: Boolean,
    isBuffering: Boolean,
    onClick: () -> Unit
) {
    val isCur = current != null &&
        (current.trackId == track.trackId ||
            (current.title == track.title && current.artist == track.artist))
    val isPlay = isCur && isPlaying
    val isLoad = isCur && isBuffering
    val itemBg = when {
        isPlay -> Color(0xFF343A4E)
        isCur -> Color(0xFF2E3344)
        else -> Color(0xFF20222C)
    }
    val borderAlpha = when {
        isPlay -> 0.4f
        isCur -> 0.3f
        else -> 0.1f
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(itemBg)
            .border(1.dp, Color.White.copy(alpha = borderAlpha), RoundedCornerShape(16.dp))
            .clickable(onClick = onClick)
            .padding(10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        TrackArtwork(
            track = track,
            modifier = Modifier.size(48.dp),
            shape = RoundedCornerShape(10.dp)
        )
        Spacer(Modifier.width(14.dp))
        Column(Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    track.title,
                    color = TextPrimary,
                    fontSize = 14.sp,
                    fontWeight = if (isCur) FontWeight.Black else FontWeight.SemiBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f, fill = false)
                )
                when {
                    isPlay -> PlayBadge("Diputar", Color.White.copy(alpha = 0.2f), Color.White)
                    isCur -> PlayBadge("Dijeda", Color.White.copy(alpha = 0.1f), Color.White.copy(alpha = 0.8f))
                }
            }
            Text(
                track.artist,
                color = TextSecondary,
                fontSize = 12.sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
        Spacer(Modifier.width(8.dp))
        when {
            isLoad -> Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.2f)),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(
                    color = Color.White,
                    strokeWidth = 2.dp,
                    modifier = Modifier.size(16.dp)
                )
            }
            isPlay -> Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(CircleShape)
                    .background(Color.White),
                contentAlignment = Alignment.Center
            ) {
                Row(
                    verticalAlignment = Alignment.Bottom,
                    horizontalArrangement = Arrangement.spacedBy(2.dp)
                ) {
                    Box(Modifier.width(2.dp).height(8.dp).clip(RoundedCornerShape(1.dp)).background(Color.Black))
                    Box(Modifier.width(2.dp).height(5.dp).clip(RoundedCornerShape(1.dp)).background(Color.Black))
                    Box(Modifier.width(2.dp).height(10.dp).clip(RoundedCornerShape(1.dp)).background(Color.Black))
                }
            }
            else -> Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    Icons.Filled.PlayArrow, null,
                    tint = TextPrimary,
                    modifier = Modifier.size(16.dp)
                )
            }
        }
    }
}

@Composable
fun PlayBadge(text: String, bg: Color, fg: Color) {
    Spacer(Modifier.width(8.dp))
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(50))
            .background(bg)
            .border(1.dp, Color.White.copy(alpha = 0.25f), RoundedCornerShape(50))
            .padding(horizontal = 6.dp, vertical = 2.dp)
    ) {
        Text(
            text,
            color = fg,
            fontSize = 8.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 1.sp
        )
    }
}

@Composable
fun SearchRecRow(
    label: String,
    icon: ImageVector,
    tint: Color,
    tracks: List<Track>,
    current: Track?,
    isPlaying: Boolean,
    isBuffering: Boolean,
    onTrackClick: (Track, List<Track>) -> Unit
) {
    if (tracks.isEmpty()) return
    Column(modifier = Modifier.fillMaxWidth()) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, null, tint = tint, modifier = Modifier.size(16.dp))
            Spacer(Modifier.width(8.dp))
            Text(
                label,
                color = TextPrimary,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold
            )
        }
        Spacer(Modifier.height(12.dp))
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            contentPadding = PaddingValues(end = 8.dp)
        ) {
            items(tracks.take(6), key = { "rec" + it.trackId }) { track ->
                RecCard(
                    track = track,
                    current = current,
                    isPlaying = isPlaying,
                    isBuffering = isBuffering,
                    onClick = { onTrackClick(track, tracks) }
                )
            }
        }
    }
}

@Composable
fun RecCard(
    track: Track,
    current: Track?,
    isPlaying: Boolean,
    isBuffering: Boolean,
    onClick: () -> Unit
) {
    val isCur = current != null &&
        (current.trackId == track.trackId ||
            (current.title == track.title && current.artist == track.artist))
    val isPlay = isCur && isPlaying
    val isLoad = isCur && isBuffering

    Column(
        modifier = Modifier
            .width(144.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0xFF20222C))
            .border(
                width = if (isCur) 2.dp else 1.dp,
                brush = SolidColor(
                    if (isCur) Color.White.copy(alpha = 0.6f) else Color.White.copy(alpha = 0.1f)
                ),
                shape = RoundedCornerShape(16.dp)
            )
            .clickable(onClick = onClick)
            .padding(10.dp)
    ) {
        Box {
            TrackArtwork(
                track = track,
                modifier = Modifier.fillMaxWidth().aspectRatio(1f),
                shape = RoundedCornerShape(12.dp)
            )
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .align(Alignment.BottomEnd)
                    .clip(CircleShape)
                    .background(
                        when {
                            isPlay || isCur -> Color.White
                            else -> Color(0xFF20222C)
                        }
                    ),
                contentAlignment = Alignment.Center
            ) {
                when {
                    isLoad -> CircularProgressIndicator(
                        color = Color.White,
                        strokeWidth = 2.dp,
                        modifier = Modifier.size(14.dp)
                    )
                    isPlay -> Row(
                        verticalAlignment = Alignment.Bottom,
                        horizontalArrangement = Arrangement.spacedBy(1.5.dp)
                    ) {
                        Box(Modifier.width(2.dp).height(6.dp).clip(RoundedCornerShape(1.dp)).background(Color.Black))
                        Box(Modifier.width(2.dp).height(4.dp).clip(RoundedCornerShape(1.dp)).background(Color.Black))
                        Box(Modifier.width(2.dp).height(7.dp).clip(RoundedCornerShape(1.dp)).background(Color.Black))
                    }
                    isCur -> Icon(
                        Icons.Filled.Pause, null,
                        tint = Color.Black,
                        modifier = Modifier.size(14.dp)
                    )
                    else -> Icon(
                        Icons.Filled.PlayArrow, null,
                        tint = Color.White,
                        modifier = Modifier.size(14.dp)
                    )
                }
            }
        }
        Spacer(Modifier.height(8.dp))
        Text(
            track.title,
            color = TextPrimary,
            fontSize = 12.sp,
            fontWeight = if (isCur) FontWeight.Black else FontWeight.SemiBold,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
        Spacer(Modifier.height(2.dp))
        Text(
            track.artist,
            color = Color.White.copy(alpha = 0.6f),
            fontSize = 10.sp,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}

@Composable
fun RecSkeletonRow() {
    Column(modifier = Modifier.fillMaxWidth()) {
        Box(
            modifier = Modifier
                .height(20.dp)
                .width(128.dp)
                .background(Color.White.copy(alpha = 0.1f), RoundedCornerShape(6.dp))
        )
        Spacer(Modifier.height(12.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            repeat(4) {
                Column(Modifier.width(128.dp)) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .aspectRatio(1f)
                            .background(Color.White.copy(alpha = 0.05f), RoundedCornerShape(12.dp))
                    )
                    Spacer(Modifier.height(8.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(0.75f)
                            .height(12.dp)
                            .background(Color.White.copy(alpha = 0.1f), RoundedCornerShape(6.dp))
                    )
                }
            }
        }
    }
}

@Composable
fun PlaylistGridCard(pl: Playlist, onClick: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp)
            .clickable(onClick = onClick),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box {
            Artwork(
                url = pl.image.ifBlank { pl.songs.firstOrNull()?.coverUrl ?: "" },
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(1f)
                    .clip(RoundedCornerShape(12.dp))
                    .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(12.dp)),
                contentDescription = pl.name
            )
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .align(Alignment.TopEnd)
                    .padding(8.dp)
                    .clip(CircleShape)
                    .background(Color.Black.copy(alpha = 0.65f))
                    .border(1.dp, Color.White.copy(alpha = 0.2f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Filled.Bookmark, null, tint = Color.White, modifier = Modifier.size(16.dp))
            }
        }
        Spacer(Modifier.height(8.dp))
        Text(
            pl.name,
            color = TextPrimary,
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
        )
        Text(
            pl.creator.ifBlank { "Playlist" },
            color = TextSecondary,
            fontSize = 12.sp,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}

@Composable
fun ArtistGridCard(artist: Artist, modifier: Modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp)) {
    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(modifier = Modifier.size(80.dp)) {
            Artwork(
                url = artist.thumbnail,
                modifier = Modifier
                    .fillMaxSize()
                    .clip(CircleShape)
                    .border(2.dp, Color.White.copy(alpha = 0.1f), CircleShape),
                contentDescription = artist.name
            )
        }
        Spacer(Modifier.height(10.dp))
        Text(
            artist.name,
            color = TextPrimary,
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
        )
        Text(
            artist.subtitle.uppercase(),
            color = TextSecondary,
            fontSize = 10.sp,
            fontWeight = FontWeight.SemiBold,
            letterSpacing = 1.sp
        )
    }
}

@Composable
fun UserGridCard(user: UserEntry, onOpenProfile: (String) -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0xFF20222C))
            .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(16.dp))
            .clickable { onOpenProfile(user.id) }
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Artwork(
            url = user.picture,
            modifier = Modifier.size(56.dp),
            shape = CircleShape,
            contentDescription = user.name
        )
        Spacer(Modifier.width(12.dp))
        Column(Modifier.weight(1f)) {
            Text(
                user.name,
                color = TextPrimary,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                "Profil publik · Lihat playlist",
                color = Color.White.copy(alpha = 0.5f),
                fontSize = 12.sp
            )
            Spacer(Modifier.height(8.dp))
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .background(Color(0xFFE879F9).copy(alpha = 0.15f))
                    .border(1.dp, Color(0xFFE879F9).copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                    .padding(horizontal = 10.dp, vertical = 6.dp)
            ) {
                Text(
                    "Buat Blend",
                    color = Color(0xFFF5D0FE),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
        Icon(
            Icons.Filled.ChevronRight, null,
            tint = Color.White.copy(alpha = 0.4f),
            modifier = Modifier.size(16.dp)
        )
    }
}

@Composable
fun SearchEmptyState() {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 40.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(Color.White.copy(alpha = 0.04f))
            .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(16.dp))
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                Icons.Filled.SearchOff, null,
                tint = Color.White.copy(alpha = 0.3f),
                modifier = Modifier.size(40.dp)
            )
            Spacer(Modifier.height(12.dp))
            Text(
                "Tidak ada hasil",
                color = TextPrimary,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                "Coba kata kunci lain, nama artis, atau judul lagu.",
                color = TextSecondary,
                fontSize = 12.sp
            )
        }
    }
}
