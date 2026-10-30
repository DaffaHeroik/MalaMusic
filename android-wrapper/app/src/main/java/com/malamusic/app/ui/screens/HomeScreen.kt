package com.malamusic.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.Image
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.malamusic.app.R
import com.malamusic.app.data.model.Artist
import com.malamusic.app.data.model.StreakState
import com.malamusic.app.data.model.Track
import com.malamusic.app.data.repository.MusicRepository
import com.malamusic.app.ui.HomeCategories
import com.malamusic.app.ui.components.Artwork
import com.malamusic.app.ui.components.BrandLogo
import com.malamusic.app.ui.components.TrackArtwork
import com.malamusic.app.ui.theme.*
import kotlinx.coroutines.launch

/**
 * Home screen — mirrors the web home (public/home.js):
 * banner header with lockup + action buttons, streak card, category chip
 * bar, and either the default feed or a category view.
 */
@Composable
fun HomeScreen(
    repository: MusicRepository,
    onTrackClick: (Track, List<Track>) -> Unit,
    onOpenSearch: () -> Unit = {},
    onOpenProfile: () -> Unit = {},
    onOpenLibrary: () -> Unit = {}
) {
    val homeData by repository.homeData.collectAsState()
    val recentTracks by repository.recentTracks.collectAsState()
    val topArtists by repository.topArtists.collectAsState()
    val streak by repository.streakState.collectAsState()
    val isLoading by repository.isLoading.collectAsState()
    val activeCategory by repository.homeCategory.collectAsState()
    val catResults by repository.searchResults.collectAsState()
    val isCategoryLoading by repository.isCategoryLoading.collectAsState()
    val currentTrack by repository.currentTrack.collectAsState()
    val isPlaying by repository.isPlaying.collectAsState()
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        repository.loadHome()
        if (streak.loaded) return@LaunchedEffect
        repository.loadStreak()
    }

    val quickPicks = homeData.songs.take(6)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBackground)
    ) {
        // Banner header — sticky banner image + gradient, like the web header
        Box(modifier = Modifier.fillMaxWidth()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
                    .background(DarkBackground)
            ) {
                Image(
                    painter = painterResource(R.drawable.banner),
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    alpha = 0.8f,
                    modifier = Modifier.fillMaxSize()
                )
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            brush = Brush.verticalGradient(
                                colors = listOf(
                                    DarkBackground.copy(alpha = 0.4f),
                                    DarkBackground.copy(alpha = 0.92f)
                                )
                            )
                        )
                )
            }
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(start = 16.dp, end = 12.dp, top = 44.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    BrandLogo(size = 28.dp)
                    Spacer(Modifier.width(10.dp))
                    Text(
                        "MalaMusic",
                        fontSize = 26.sp,
                        fontWeight = FontWeight.Black,
                        color = TextPrimary,
                        letterSpacing = (-0.5).sp
                    )
                    Spacer(Modifier.weight(1f))
                    HeaderActionButton(
                        Icons.Filled.Shuffle, "Muat lagu lain"
                    ) {
                        scope.launch {
                            if (activeCategory == null) {
                                repository.loadHome(force = true)
                            } else {
                                val cat = activeCategory!!
                                repository.selectHomeCategory(cat, HomeCategories.searchQuery(cat))
                            }
                        }
                    }
                    Spacer(Modifier.width(6.dp))
                    HeaderActionButton(
                        Icons.Filled.Headset, "Dengarkan bersama teman",
                        bg = Color(0x2610B981),
                        borderColor = Color(0x4C6EE7B7),
                        iconTint = Color(0xFFA7F3D0)
                    ) { onOpenProfile() }
                    Spacer(Modifier.width(6.dp))
                    HeaderActionButton(Icons.Filled.Search, "Cari") { onOpenSearch() }
                    Spacer(Modifier.width(6.dp))
                    HeaderActionButton(Icons.Filled.Person, "Profil") { onOpenProfile() }
                }
                Spacer(Modifier.height(14.dp))
                // Category chip bar
                LazyRow(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(44.dp)
                        .padding(bottom = 14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    items(HomeCategories.all) { cat ->
                        val isActive = (activeCategory ?: "Semua") == cat.name
                        CategoryChip(label = cat.name, icon = cat.icon, active = isActive) {
                            scope.launch {
                                repository.selectHomeCategory(
                                    if (cat.name == "Semua") null else cat.name,
                                    if (cat.name == "Semua") null else HomeCategories.searchQuery(cat.name)
                                )
                            }
                        }
                        Spacer(Modifier.width(8.dp))
                    }
                }
            }
        }

        // Content
        Box(modifier = Modifier.weight(1f)) {
            if (activeCategory == null) {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(24.dp)
                ) {
                    item { Spacer(Modifier.height(16.dp)) }

                    // Listening Streak card (web #home-streak-card)
                    item {
                        StreakCard(streak) { onOpenProfile() }
                    }

                    // Recently Played — web "Lihat koleksi" horizontal cards
                    if (recentTracks.isNotEmpty()) {
                        item {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                SectionHeader("Recently Played", Icons.Filled.History, AccentRose)
                                Spacer(Modifier.width(8.dp))
                                Text(
                                    "Lihat koleksi",
                                    color = TextSecondary,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.clickable { onOpenLibrary() }
                                )
                            }
                        }
                        item {
                            LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                items(recentTracks.take(6)) { track ->
                                    WebTrackCard(track) { onTrackClick(track, recentTracks.take(6)) }
                                }
                            }
                        }
                    }

                    // Quick Picks — web 2-column row-grid
                    item { SectionHeader("Quick Picks", Icons.Filled.Bolt, AccentAmber) }
                    item {
                        if (isLoading && quickPicks.isEmpty()) {
                            QuickPickSkeletonGrid()
                        } else if (quickPicks.isEmpty()) {
                            QuickPicksEmptyState(
                                onSearch = onOpenSearch,
                                onRefresh = {
                                    scope.launch {
                                        repository.loadHome(force = true)
                                        repository.loadStreak()
                                    }
                                }
                            )
                        } else {
                            quickPicks.chunked(2).forEach { rowTracks ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(bottom = 12.dp),
                                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    rowTracks.forEach { track ->
                                        QuickPickCard(
                                            track = track,
                                            modifier = Modifier.weight(1f),
                                            state = trackState(track, currentTrack, isPlaying),
                                            onClick = { onTrackClick(track, quickPicks) }
                                        )
                                    }
                                    if (rowTracks.size == 1) {
                                        Box(Modifier.weight(1f))
                                    }
                                }
                            }
                        }
                    }

                    // Popular Playlists — web card-scroll + "Buat Playlist" tile
                    if (homeData.playlists.isNotEmpty()) {
                        item { SectionHeader("Popular Playlists", Icons.Filled.QueueMusic, AccentPurple) }
                        item {
                            LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                items(homeData.playlists.take(8)) { playlist ->
                                    WebPlaylistCard(playlist) {
                                        playlist.songs.firstOrNull()?.let { onTrackClick(it, playlist.songs) }
                                    }
                                }
                                item { CreatePlaylistCard(onClick = onOpenLibrary) }
                            }
                        }
                    } else if (quickPicks.isEmpty()) {
                        item {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(Color(0xFF252837))
                                    .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(16.dp))
                                    .padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(48.dp)
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(Color.White.copy(alpha = 0.1f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(Icons.Filled.List, null, tint = AccentPurple, modifier = Modifier.size(24.dp))
                                }
                                Spacer(Modifier.width(14.dp))
                                Column(Modifier.weight(1f)) {
                                    Text(
                                        "Playlist populer segera hadir",
                                        color = TextPrimary,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Black
                                    )
                                    Text(
                                        "Cari lagu lalu simpan ke playlist pertamamu.",
                                        color = TextSecondary,
                                        fontSize = 11.sp
                                    )
                                }
                            }
                        }
                    }

                    // Top Artists — web fixed pool, circular-in-card scroll
                    item { SectionHeader("Top Artists", Icons.Filled.People, AccentRose) }
                    item {
                        if (topArtists.isEmpty()) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(Color(0xFF252837))
                                    .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(16.dp))
                                    .padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(48.dp)
                                        .clip(CircleShape)
                                        .background(Color.White.copy(alpha = 0.1f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(Icons.Filled.People, null, tint = AccentRose, modifier = Modifier.size(24.dp))
                                }
                                Spacer(Modifier.width(14.dp))
                                Column(Modifier.weight(1f)) {
                                    Text(
                                        "Jelajahi artis favoritmu",
                                        color = TextPrimary,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Black
                                    )
                                    Text(
                                        "Cari artis atau lagu untuk membangun rekomendasi MalaMusic.",
                                        color = TextSecondary,
                                        fontSize = 11.sp
                                    )
                                }
                                Text(
                                    "Cari",
                                    color = DarkBackground,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Black,
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(TextPrimary)
                                        .clickable { onOpenSearch() }
                                        .padding(horizontal = 14.dp, vertical = 8.dp)
                                )
                            }
                        } else {
                            LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                items(topArtists.take(10)) { artist ->
                                    WebArtistCard(artist)
                                }
                            }
                        }
                    }

                    item { Spacer(Modifier.height(120.dp)) }
                }
            } else {
                val catName = activeCategory!!
                CategoryView(
                    category = catName,
                    results = catResults,
                    isLoading = isCategoryLoading,
                    onTrackClick = onTrackClick,
                    onReset = { scope.launch { repository.selectHomeCategory(null, null) } }
                )
            }
        }
    }
}

/** 0 = none, 1 = current, 2 = current & playing (web active-row highlight). */
private fun trackState(track: Track, current: Track?, playing: Boolean): Int = when {
    current == null || current.trackId != track.trackId -> 0
    playing -> 2
    else -> 1
}

@Composable
private fun HeaderActionButton(
    icon: ImageVector,
    contentDescription: String,
    bg: Color = Color.Black.copy(alpha = 0.4f),
    borderColor: Color = Color.White.copy(alpha = 0.2f),
    iconTint: Color = Color.White.copy(alpha = 0.9f),
    onClick: () -> Unit = {}
) {
    Box(
        modifier = Modifier
            .size(40.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(bg)
            .border(1.dp, borderColor, RoundedCornerShape(14.dp))
            .clickable { onClick() },
        contentAlignment = Alignment.Center
    ) {
        Icon(icon, contentDescription = contentDescription, tint = iconTint, modifier = Modifier.size(20.dp))
    }
}

// ---- Listening Streak card (web #home-streak-card) ---------------------------

@Composable
private fun StreakCard(streak: StreakState, onDetail: () -> Unit) {
    if (!streak.hasAccount) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .background(Color(0xFF2B1D0B))
                .border(1.dp, Color(0x33FBBF24), RoundedCornerShape(16.dp))
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            StreakFlameIcon()
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                StreakLabel()
                Text(
                    "Login untuk mulai menjaga streak",
                    color = TextPrimary,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Black,
                    maxLines = 2
                )
                Spacer(Modifier.height(2.dp))
                Text(
                    "Dengarkan lagu setiap hari dan bangun rekor kamu.",
                    color = TextSecondary,
                    fontSize = 11.sp,
                    maxLines = 2
                )
            }
            Spacer(Modifier.width(8.dp))
            Text(
                "Login",
                color = DarkBackground,
                fontSize = 11.sp,
                fontWeight = FontWeight.Black,
                modifier = Modifier
                    .clip(RoundedCornerShape(10.dp))
                    .background(TextPrimary)
                    .clickable(onClick = onDetail)
                    .padding(horizontal = 12.dp, vertical = 10.dp)
            )
        }
        return
    }

    val stats = streak.stats
    val current = stats.current
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(
                brush = Brush.horizontalGradient(
                    colors = listOf(Color(0xFF3B260D), Color(0xFF211815), Color(0xFF15151B))
                )
            )
            .border(1.dp, Color(0x33FBBF24), RoundedCornerShape(16.dp))
            .padding(14.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            StreakFlameIcon()
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                StreakLabel()
                Text(
                    if (current > 0) "$current hari berturut-turut" else "Mulai streak pertamamu",
                    color = TextPrimary,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Black,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
            Text(
                "Detail",
                color = TextSecondary,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.clickable(onClick = onDetail)
            )
        }
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Column(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color.Black.copy(alpha = 0.2f))
                    .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(12.dp))
                    .padding(10.dp)
            ) {
                Text(current.toString(), color = Color(0xFFFBBF24), fontSize = 18.sp, fontWeight = FontWeight.Black)
                Text("Streak saat ini", color = TextMuted, fontSize = 10.sp)
            }
            Column(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color.Black.copy(alpha = 0.2f))
                    .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(12.dp))
                    .padding(10.dp)
            ) {
                Text(stats.best.toString(), color = TextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Black)
                Text("Rekor terbaik · ${stats.activeDays} hari aktif", color = TextMuted, fontSize = 10.sp, maxLines = 2)
            }
        }
    }
}

@Composable
private fun StreakFlameIcon() {
    Box(
        modifier = Modifier
            .size(44.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(Color(0x26FBBF24))
            .border(1.dp, Color(0x33FBBF24), RoundedCornerShape(12.dp)),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            Icons.Filled.LocalFireDepartment,
            null,
            tint = Color(0xFFFCD34D),
            modifier = Modifier.size(22.dp)
        )
    }
}

@Composable
private fun StreakLabel() {
    Text(
        "LISTENING STREAK",
        color = Color(0x99FCD34D),
        fontSize = 10.sp,
        fontWeight = FontWeight.Black,
        letterSpacing = 1.6.sp
    )
}

@Composable
fun CategoryChip(label: String, icon: String, active: Boolean, onClick: () -> Unit) {
    val iconVector: ImageVector? = when (icon) {
        "coffee" -> Icons.Filled.LocalCafe
        "brain" -> Icons.Filled.Psychology
        "car" -> Icons.Filled.DirectionsCar
        "gamepad" -> Icons.Filled.SportsEsports
        "zap" -> Icons.Filled.Bolt
        "party" -> Icons.Filled.Celebration
        "smile" -> Icons.Filled.Mood
        "heart" -> Icons.Filled.Favorite
        "workout" -> Icons.Filled.FitnessCenter
        "moon" -> Icons.Filled.DarkMode
        "cloud-rain" -> Icons.Filled.Grain
        "sun" -> Icons.Filled.WbSunny
        "disc" -> Icons.Filled.QueueMusic
        "guitar" -> Icons.Filled.MusicNote
        "music" -> Icons.Filled.MusicNote
        "flame" -> Icons.Filled.LocalFireDepartment
        else -> null
    }
    Row(
        modifier = Modifier
            .clip(CircleShape)
            .background(if (active) TextPrimary else Color.Black.copy(alpha = 0.4f))
            .border(1.dp, if (active) TextPrimary else Color.White.copy(alpha = 0.15f), CircleShape)
            .clickable(onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        if (iconVector != null) {
            Icon(
                iconVector,
                contentDescription = null,
                tint = if (active) DarkBackground else Color.White.copy(alpha = 0.8f),
                modifier = Modifier.size(14.dp)
            )
            Spacer(Modifier.width(6.dp))
        }
        Text(
            label,
            color = if (active) DarkBackground else Color.White.copy(alpha = 0.8f),
            fontSize = 12.sp,
            fontWeight = if (active) FontWeight.ExtraBold else FontWeight.Medium
        )
    }
}

// ---- Default-view cards (web styles) ---------------------------------------

@Composable
private fun WebTrackCard(track: Track, onClick: () -> Unit) {
    Column(
        modifier = Modifier
            .width(128.dp)
            .clickable(onClick = onClick)
    ) {
        TrackArtwork(
            track = track,
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(1f),
            shape = RoundedCornerShape(12.dp)
        )
        Spacer(Modifier.height(8.dp))
        Text(
            track.title,
            color = TextPrimary,
            fontSize = 13.sp,
            fontWeight = FontWeight.SemiBold,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
        Text(
            track.artist,
            color = TextSecondary,
            fontSize = 11.sp,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}

@Composable
fun QuickPickCard(
    track: Track,
    modifier: Modifier = Modifier,
    state: Int,
    onClick: () -> Unit
) {
    val bg = when (state) {
        2 -> Color(0xFF343A4E)
        1 -> Color(0xFF2E3344)
        else -> DarkCard
    }
    Row(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .background(bg)
            .border(
                1.dp,
                if (state > 0) Color.White.copy(alpha = 0.35f) else Color.White.copy(alpha = 0.1f),
                RoundedCornerShape(16.dp)
            )
            .clickable(onClick = onClick),
        verticalAlignment = Alignment.CenterVertically
    ) {
        TrackArtwork(
            track = track,
            modifier = Modifier
                .size(56.dp)
                .padding(2.dp),
            shape = RoundedCornerShape(topStart = 14.dp, bottomStart = 14.dp)
        )
        Column(modifier = Modifier.weight(1f).padding(start = 8.dp, top = 10.dp, bottom = 10.dp)) {
            Text(
                track.title,
                color = TextPrimary,
                fontSize = 13.sp,
                fontWeight = if (state > 0) FontWeight.Black else FontWeight.SemiBold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                track.artist,
                color = TextSecondary,
                fontSize = 11.sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
        PlayButton(state)
        Spacer(Modifier.width(8.dp))
    }
}

@Composable
private fun PlayButton(state: Int) {
    Box(
        modifier = Modifier
            .size(28.dp)
            .clip(CircleShape)
            .background(if (state == 2) Color.White else Color.White.copy(alpha = 0.06f)),
        contentAlignment = Alignment.Center
    ) {
        if (state == 2) {
            Column(
                modifier = Modifier.size(12.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Bottom
            ) {
                Box(Modifier.width(2.dp).height(7.dp).background(DarkBackground, RoundedCornerShape(1.dp)))
                Spacer(Modifier.width(2.dp))
                Box(Modifier.width(2.dp).height(11.dp).background(DarkBackground, RoundedCornerShape(1.dp)))
                Spacer(Modifier.width(2.dp))
                Box(Modifier.width(2.dp).height(5.dp).background(DarkBackground, RoundedCornerShape(1.dp)))
            }
        } else {
            Icon(
                Icons.Filled.PlayArrow,
                contentDescription = "Putar",
                tint = Color.White,
                modifier = Modifier.size(16.dp)
            )
        }
    }
}

@Composable
private fun QuickPickSkeletonGrid() {
    Column {
        repeat(3) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                repeat(2) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .height(60.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(DarkCard)
                    )
                }
            }
        }
    }
}

@Composable
private fun QuickPicksEmptyState(onSearch: () -> Unit, onRefresh: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0xFF252837))
            .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(16.dp))
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(56.dp)
                .clip(RoundedCornerShape(14.dp))
                .background(Color.White.copy(alpha = 0.1f))
                .border(1.dp, Color.White.copy(alpha = 0.15f), RoundedCornerShape(14.dp)),
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Filled.Headphones, null, tint = Color.White.copy(alpha = 0.8f), modifier = Modifier.size(26.dp))
        }
        Spacer(Modifier.width(14.dp))
        Column(Modifier.weight(1f)) {
            Text("Temukan musik untuk harimu", color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Black)
            Text(
                "Cari lagu favorit atau muat rekomendasi baru untuk mengisi Quick Picks.",
                color = TextSecondary,
                fontSize = 11.sp
            )
        }
        Spacer(Modifier.width(8.dp))
        Column {
            Text(
                "Cari Lagu",
                color = DarkBackground,
                fontSize = 12.sp,
                fontWeight = FontWeight.Black,
                modifier = Modifier
                    .clip(RoundedCornerShape(10.dp))
                    .background(TextPrimary)
                    .clickable(onClick = onSearch)
                    .padding(horizontal = 14.dp, vertical = 10.dp)
            )
            Spacer(Modifier.height(6.dp))
            Text(
                "Muat Ulang",
                color = TextPrimary,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier
                    .clip(RoundedCornerShape(10.dp))
                    .background(Color.White.copy(alpha = 0.1f))
                    .border(1.dp, Color.White.copy(alpha = 0.15f), RoundedCornerShape(10.dp))
                    .clickable(onClick = onRefresh)
                    .padding(horizontal = 14.dp, vertical = 10.dp)
            )
        }
    }
}

/** Dashed "Buat Playlist" tile at the end of the playlist scroll (web parity). */
@Composable
fun CreatePlaylistCard(onClick: () -> Unit) {
    Column(
        modifier = Modifier
            .width(144.dp)
            .clickable(onClick = onClick),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(1f)
                .clip(RoundedCornerShape(16.dp))
                .background(Color(0x8020222C))
                .border(
                    1.dp,
                    Color.White.copy(alpha = 0.2f),
                    RoundedCornerShape(16.dp)
                ),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(Icons.Filled.Add, null, tint = Color.White.copy(alpha = 0.7f), modifier = Modifier.size(30.dp))
                Spacer(Modifier.height(8.dp))
                Text("Buat Playlist", color = Color.White.copy(alpha = 0.7f), fontSize = 12.sp, fontWeight = FontWeight.Medium)
            }
        }
        Spacer(Modifier.height(8.dp))
        Text("Buat Baru", color = Color.White.copy(alpha = 0.7f), fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
fun WebPlaylistCard(
    playlist: com.malamusic.app.data.model.Playlist,
    onClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .width(144.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(DarkCard)
            .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(16.dp))
            .clickable(onClick = onClick)
            .padding(10.dp)
    ) {
        Artwork(
            url = playlist.image.ifBlank { playlist.songs.firstOrNull()?.coverUrl ?: "" },
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(1f)
                .padding(bottom = 8.dp),
            shape = RoundedCornerShape(12.dp),
            contentDescription = playlist.name
        )
        Text(
            playlist.name,
            color = TextPrimary,
            fontSize = 13.sp,
            fontWeight = FontWeight.SemiBold,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
        Text(
            playlist.creator.ifEmpty { "Playlist" },
            color = TextSecondary,
            fontSize = 11.sp,
            maxLines = 1
        )
    }
}

@Composable
fun WebArtistCard(artist: com.malamusic.app.data.model.Artist) {
    Column(
        modifier = Modifier
            .width(128.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(DarkCard)
            .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(16.dp))
            .padding(10.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Artwork(
            url = artist.thumbnail,
            modifier = Modifier
                .size(84.dp)
                .padding(bottom = 8.dp)
                .border(2.dp, Color.White.copy(alpha = 0.1f), CircleShape),
            shape = CircleShape,
            contentDescription = artist.name
        )
        Text(
            artist.name,
            color = TextPrimary,
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            textAlign = TextAlign.Center
        )
        Text(
            "ARTIST",
            color = TextSecondary,
            fontSize = 9.sp,
            fontWeight = FontWeight.SemiBold,
            letterSpacing = 1.sp
        )
    }
}

// ---- Category view (web "home-category-view") ------------------------------

@Composable
private fun CategoryView(
    category: String,
    results: com.malamusic.app.data.model.SearchResults,
    isLoading: Boolean,
    onTrackClick: (Track, List<Track>) -> Unit,
    onReset: () -> Unit
) {
    if (isLoading) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                CircularProgressIndicator(
                    modifier = Modifier.size(36.dp),
                    color = AccentRose,
                    strokeWidth = 2.5.dp
                )
                Spacer(Modifier.height(12.dp))
                Text(
                    "Memuat musik $category...",
                    color = TextSecondary,
                    fontSize = 12.sp
                )
            }
        }
        return
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        item { Spacer(Modifier.height(16.dp)) }

        // Kategori pill + Reset row
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(Color.White.copy(alpha = 0.05f))
                    .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(16.dp))
                    .padding(horizontal = 14.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Kategori:", color = TextSecondary, fontSize = 11.sp)
                Spacer(Modifier.width(8.dp))
                Text(
                    category,
                    color = TextPrimary,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold
                )
                Spacer(Modifier.weight(1f))
                Row(
                    modifier = Modifier
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.1f))
                        .clickable { onReset() }
                        .padding(horizontal = 12.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Filled.Close, null, tint = TextSecondary, modifier = Modifier.size(14.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("Reset", color = TextSecondary, fontSize = 11.sp)
                }
            }
        }

        // Lagu Populer
        if (results.songs.isNotEmpty()) {
            item {
                SectionHeader("Lagu Populer - $category", Icons.Filled.MusicNote, AccentEmerald)
            }
            items(results.songs.take(25)) { track ->
                CategoryTrackRow(track, state = 0) { onTrackClick(track, results.songs.take(25)) }
            }
        } else {
            item {
                Text(
                    "Tidak ada lagu ditemukan untuk kategori ini",
                    color = Color.White.copy(alpha = 0.7f),
                    fontSize = 13.sp,
                    modifier = Modifier.padding(vertical = 32.dp),
                    textAlign = TextAlign.Center
                )
            }
        }

        // Playlist & Album
        if (results.playlists.isNotEmpty()) {
            item { SectionHeader("Playlist & Album $category", Icons.Filled.QueueMusic, AccentPurple) }
            item {
                LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(results.playlists.take(10)) { playlist ->
                        WebPlaylistCard(playlist) {
                            playlist.songs.firstOrNull()?.let { onTrackClick(it, playlist.songs) }
                        }
                    }
                }
            }
        }

        // Artis Related
        if (results.artists.isNotEmpty()) {
            item { SectionHeader("Artis Related", Icons.Filled.People, AccentRose) }
            item {
                LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(results.artists.take(8)) { artist ->
                        WebArtistCard(artist)
                    }
                }
            }
        }

        item { Spacer(Modifier.height(120.dp)) }
    }
}

@Composable
private fun CategoryTrackRow(track: Track, state: Int, onClick: () -> Unit) {
    QuickPickCard(
        track = track,
        modifier = Modifier.fillMaxWidth(),
        state = state,
        onClick = onClick
    )
}

@Composable
fun SectionHeader(title: String, icon: ImageVector, tint: Color) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(20.dp))
        Spacer(Modifier.width(8.dp))
        Text(title, color = TextPrimary, fontSize = 16.sp, fontWeight = FontWeight.Bold)
    }
}
