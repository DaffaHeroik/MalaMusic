package com.malamusic.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Forward
import androidx.compose.material.icons.automirrored.filled.PlaylistAdd
import androidx.compose.material.icons.automirrored.filled.VolumeDown
import androidx.compose.material.icons.automirrored.filled.VolumeOff
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.malamusic.app.data.model.LyricLine
import com.malamusic.app.data.model.Track
import com.malamusic.app.data.repository.MusicRepository
import com.malamusic.app.ui.components.TrackArtwork
import com.malamusic.app.ui.theme.*
import androidx.media3.common.util.UnstableApi
import kotlinx.coroutines.launch

@OptIn(UnstableApi::class)
@Composable
fun PlayerScreen(
    track: Track?,
    repository: MusicRepository,
    onBack: () -> Unit,
    onPlayPause: () -> Unit,
    onNext: () -> Unit,
    onPrevious: () -> Unit,
    onSeek: (Long) -> Unit,
    onQueueIndex: (Int) -> Unit = {}
) {
    val isPlaying by repository.isPlaying.collectAsState()
    val isBuffering by repository.isBuffering.collectAsState()
    val position by repository.position.collectAsState()
    val duration by repository.duration.collectAsState()
    val lyrics by repository.lyrics.collectAsState()
    val queue by repository.queue.collectAsState()
    val currentIndex by repository.currentIndex.collectAsState()
    val likedSongs by repository.likedSongs.collectAsState()
    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    val isLiked = track != null && likedSongs.any { it.trackId == track.trackId }
    val audioCache = repository.audioCache
    val downloads by (audioCache?.downloads?.collectAsState() ?: remember { mutableStateOf(emptyList<Track>()) })
    val downloadingIds by (audioCache?.downloadingIds?.collectAsState() ?: remember { mutableStateOf(emptySet<String>()) })
    val downloaded = track != null && downloads.any { it.trackId == track.trackId }
    var downloadError by remember(track?.trackId) { mutableStateOf("") }

    // Web-parity options state
    var viewMode by remember { mutableStateOf("cover") }
    var bgGlowOn by remember {
        mutableStateOf(context.getSharedPreferences("malamusic_settings", android.content.Context.MODE_PRIVATE)
            .getBoolean("bg_glow", true))
    }
    var showMoreSheet by remember { mutableStateOf(false) }
    var showQueueSheet by remember { mutableStateOf(false) }
    var volume by remember { mutableStateOf(context.getSharedPreferences("malamusic_settings", android.content.Context.MODE_PRIVATE)
        .getInt("volume", 100)) }
    var shuffleOn by remember { mutableStateOf(false) }
    var repeatMode by remember { mutableStateOf(0) }
    var autoNextOn by remember {
        mutableStateOf(context.getSharedPreferences("malamusic_settings", android.content.Context.MODE_PRIVATE)
            .getBoolean("autoplay", true))
    }
    var lyricSyncOffset by remember(track?.trackId) { mutableStateOf(0) }

    // Active lyric line, honoring the manual sync offset.
    val baseLine = if (lyrics.lines.isEmpty()) -1 else {
        val posMs = (position * 1000).toLong()
        val idx = lyrics.lines.indexOfFirst { it.start <= posMs && posMs < it.end }
        if (idx >= 0) idx
        else {
            val next = lyrics.lines.indexOfFirst { it.start > posMs }
            if (next >= 0) (next - 1).coerceAtLeast(0) else lyrics.lines.lastIndex
        }
    }
    val activeLine = if (baseLine < 0) -1 else (baseLine + lyricSyncOffset).coerceIn(0, lyrics.lines.lastIndex)

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF101018), DarkBackground)))
    ) {
        // Blurred cover background (web: .player-bg-container). Coil's memory cache +
        // a soft dark overlay approximates the web blur + glow layer cheaply.
        if (bgGlowOn && !track?.coverUrl.isNullOrBlank()) {
            Box(modifier = Modifier.fillMaxSize()) {
                AsyncImage(
                    model = ImageRequest.Builder(context)
                        .data(track?.coverUrl)
                        .size(512, 512)
                        .crossfade(false)
                        .build(),
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier
                        .fillMaxSize()
                        .drawBehind {
                            drawRect(Brush.linearGradient(listOf(Color(0xCC181022), Color(0xE608090D))))
                        }
                )
            }
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 20.dp)
                .padding(top = 12.dp, bottom = 16.dp)
        ) {
            // ---- Header ----
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBack) {
                    Icon(Icons.Filled.KeyboardArrowDown, "Tutup", tint = TextPrimary, modifier = Modifier.size(30.dp))
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.weight(1f)) {
                    Text("SEDANG DIPUTAR", color = TextSecondary, fontSize = 9.sp, fontWeight = FontWeight.Bold, letterSpacing = 2.sp)
                    Text(
                        track?.artist ?: "",
                        color = Color.White.copy(alpha = 0.9f),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.fillMaxWidth(0.6f)
                    )
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = {
                        bgGlowOn = !bgGlowOn
                        context.getSharedPreferences("malamusic_settings", android.content.Context.MODE_PRIVATE)
                            .edit().putBoolean("bg_glow", bgGlowOn).apply()
                    }) {
                        Icon(
                            Icons.Filled.WifiTethering,
                            if (bgGlowOn) "Matikan latar" else "Nyalakan latar",
                            tint = if (bgGlowOn) TextPrimary else Color.White.copy(alpha = 0.4f),
                            modifier = Modifier.size(22.dp)
                        )
                    }
                    IconButton(onClick = { showMoreSheet = true }) {
                        Icon(Icons.Filled.MoreVert, "Opsi", tint = TextPrimary, modifier = Modifier.size(22.dp))
                    }
                }
            }

            Spacer(Modifier.height(8.dp))

            // ---- Cover / Lirik toggle ----
            Row(
                modifier = Modifier
                    .align(Alignment.CenterHorizontally)
                    .clip(RoundedCornerShape(999.dp))
                    .border(1.dp, Color.White.copy(alpha = 0.15f))
                    .background(Color.Black.copy(alpha = 0.4f))
                    .padding(4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                PlayerTabButton("Cover", viewMode == "cover") { viewMode = "cover" }
                PlayerTabButton("Lirik", viewMode == "lyrics") { viewMode = "lyrics" }
            }

            Spacer(Modifier.height(12.dp))

            // ---- Cover or compact lyrics ----
            when (viewMode) {
                "lyrics" -> CompactLyricsPanel(
                    track = track,
                    lines = lyrics.lines,
                    activeLine = activeLine,
                    syncOffset = lyricSyncOffset,
                    onSyncPrev = { lyricSyncOffset = (lyricSyncOffset - 1).coerceAtLeast(0 - lyrics.lines.size.coerceAtLeast(0)) },
                    onSyncNext = { lyricSyncOffset += 1 },
                    onReset = { lyricSyncOffset = 0 }
                )
                else -> TrackArtwork(
                    track = track,
                    modifier = Modifier
                        .align(Alignment.CenterHorizontally)
                        .widthIn(max = 320.dp)
                        .aspectRatio(1f)
                        .padding(horizontal = 4.dp),
                    shape = RoundedCornerShape(18.dp)
                )
            }

            Spacer(Modifier.height(16.dp))

            // ---- Title + like + offline ----
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(Modifier.weight(1f).padding(start = 4.dp)) {
                    Text(
                        track?.title ?: "Pilih lagu",
                        color = TextPrimary,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Black,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        track?.artist ?: "MalaMusic",
                        color = Color.White.copy(alpha = 0.7f),
                        fontSize = 12.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                PlayerCircleButton(onClick = { track?.let { repository.toggleLike(it) } }) {
                    Icon(
                        if (isLiked) Icons.Filled.Favorite else Icons.Filled.FavoriteBorder,
                        "Sukai",
                        tint = if (isLiked) AccentRose else TextPrimary,
                        modifier = Modifier.size(20.dp)
                    )
                }
                PlayerCircleButton(
                    onClick = {
                        val sel = track ?: return@PlayerCircleButton
                        if (downloaded) return@PlayerCircleButton
                        downloadError = ""
                        scope.launch {
                            try { repository.downloadTrack(sel) }
                            catch (e: Exception) { downloadError = e.message ?: "Download gagal. Coba lagi." }
                        }
                    }
                ) {
                    if (track?.trackId in downloadingIds) {
                        CircularProgressIndicator(Modifier.size(16.dp), strokeWidth = 2.dp, color = TextPrimary)
                    } else {
                        Icon(
                            if (downloaded) Icons.Filled.CheckCircle else Icons.Filled.WifiOff,
                            if (downloaded) "Tersimpan offline" else "Simpan offline",
                            tint = if (downloaded) AccentEmerald else TextPrimary,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }
            if (downloadError.isNotBlank()) Text(downloadError, color = Color(0xFFFF8196), fontSize = 11.sp, modifier = Modifier.padding(start = 4.dp, top = 4.dp))

            Spacer(Modifier.height(10.dp))

            // ---- Seek bar ----
            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text(formatTime(position), color = Color.White.copy(alpha = 0.7f), fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(24.dp)
                        .padding(horizontal = 10.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Slider(
                        value = position.toFloat().coerceIn(0f, duration.toFloat().coerceAtLeast(1f)),
                        onValueChange = { onSeek((it * 1000).toLong()) },
                        valueRange = 0f..(duration.toFloat().coerceAtLeast(1f)),
                        colors = SliderDefaults.colors(
                            thumbColor = Color.White,
                            activeTrackColor = Color.White,
                            inactiveTrackColor = Color.White.copy(alpha = 0.2f)
                        )
                    )
                }
                Text(formatTime(duration), color = Color.White.copy(alpha = 0.7f), fontSize = 11.sp, fontFamily = FontFamily.Monospace)
            }

            // ---- Volume row ----
            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = {
                    volume = if (volume > 0) 0 else 100
                    onSeekServiceVolume(volume, context, repository)
                }) {
                    Icon(
                        when {
                            volume == 0 -> Icons.AutoMirrored.Filled.VolumeOff
                            volume < 50 -> Icons.AutoMirrored.Filled.VolumeDown
                            else -> Icons.AutoMirrored.Filled.VolumeUp
                        },
                        "Volume",
                        tint = Color.White.copy(alpha = 0.7f),
                        modifier = Modifier.size(18.dp)
                    )
                }
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(24.dp)
                        .padding(end = 12.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Slider(
                        value = volume.toFloat() / 100f,
                        onValueChange = {
                            val pct = (it * 100).toInt()
                            volume = pct
                            onSeekServiceVolume(pct, context, repository)
                        },
                        valueRange = 0f..1f,
                        colors = SliderDefaults.colors(
                            thumbColor = Color.White,
                            activeTrackColor = Color.White,
                            inactiveTrackColor = Color.White.copy(alpha = 0.2f)
                        )
                    )
                }
                Text("$volume%", color = Color.White.copy(alpha = 0.7f), fontSize = 11.sp, fontFamily = FontFamily.Monospace, modifier = Modifier.width(36.dp), textAlign = TextAlign.End)
            }

            Spacer(Modifier.height(4.dp))

            // ---- Transport: shuffle / prev / play / next / repeat ----
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                PlayerTransportButton(Icons.Filled.Shuffle, "Acak", shuffleOn) {
                    shuffleOn = !shuffleOn
                    val service = com.malamusic.app.audio.MusicPlayerService.instance
                    service?.setShuffle(shuffleOn)
                }
                PlayerTransportButton(Icons.Filled.SkipPrevious, "Sebelumnya") { onPrevious() }
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .clip(CircleShape)
                        .background(Color.White)
                        .clickable(onClick = onPlayPause),
                    contentAlignment = Alignment.Center
                ) {
                    if (isBuffering) {
                        CircularProgressIndicator(modifier = Modifier.size(28.dp), strokeWidth = 2.5.dp, color = DarkBackground)
                    } else {
                        Icon(
                            if (isPlaying) Icons.Filled.Pause else Icons.Filled.PlayArrow,
                            if (isPlaying) "Jeda" else "Putar",
                            tint = DarkBackground,
                            modifier = Modifier.size(36.dp)
                        )
                    }
                }
                PlayerTransportButton(Icons.Filled.SkipNext, "Berikutnya") { onNext() }
                PlayerTransportButton(
                    if (repeatMode == 1) Icons.Filled.RepeatOne else Icons.Filled.Repeat,
                    "Ulangi",
                    repeatMode > 0
                ) {
                    val mode = (repeatMode + 1) % 3
                    repeatMode = mode
                    com.malamusic.app.audio.MusicPlayerService.instance?.applyRepeat(mode)
                }
            }

            Spacer(Modifier.height(2.dp))
            if (queue.size > 1) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { showQueueSheet = true }
                        .padding(vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Filled.QueueMusic, null, tint = TextMuted, modifier = Modifier.size(14.dp))
                    Spacer(Modifier.width(6.dp))
                    Text(
                        "Antrean: ${queue.size} lagu",
                        color = TextMuted,
                        fontSize = 11.sp,
                        modifier = Modifier.weight(1f)
                    )
                    Text("Kelola", color = TextSecondary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }
            Spacer(Modifier.height(96.dp))
        }
    }

    // ---- Options sheet (web: FullPlayer.openMoreSheet) ----
    if (showMoreSheet) {
        MoreSheet(
            track = track,
            autoNextOn = autoNextOn,
            onAutoNextToggle = {
                autoNextOn = !autoNextOn
                context.getSharedPreferences("malamusic_settings", android.content.Context.MODE_PRIVATE)
                    .edit().putBoolean("autoplay", autoNextOn).apply()
            },
            onDownload = {
                showMoreSheet = false
                val sel = track ?: return@MoreSheet
                downloadError = ""
                scope.launch {
                    try { repository.downloadTrack(sel) }
                    catch (e: Exception) { downloadError = e.message ?: "Download gagal." }
                }
            },
            onOpenQueue = { showMoreSheet = false; showQueueSheet = true },
            onShare = {
                val text = track?.let { "${it.title} — ${it.artist}\n${it.ytUrl}" } ?: "MalaMusic"
                val intent = android.content.Intent(android.content.Intent.ACTION_SEND).apply {
                    type = "text/plain"
                    putExtra(android.content.Intent.EXTRA_TEXT, text)
                }
                context.startActivity(android.content.Intent.createChooser(intent, "Bagikan lagu"))
                showMoreSheet = false
            },
            onSleepTimer = { minutes ->
                com.malamusic.app.audio.MusicPlayerService.instance?.setSleepTimer(minutes)
                showMoreSheet = false
            },
            onSpeed = { rate ->
                com.malamusic.app.audio.MusicPlayerService.instance?.setPlaybackSpeed(rate)
            },
            onOpenLibrary = { showMoreSheet = false; onBack() },
            onDismiss = { showMoreSheet = false }
        )
    }

    // ---- Queue sheet (web: openQueue) ----
    if (showQueueSheet) {
        QueueSheet(
            queue = queue,
            currentIndex = currentIndex,
            isPlaying = isPlaying,
            onPlayIndex = {
                onQueueIndex(it)
                showQueueSheet = false
            },
            onDismiss = { showQueueSheet = false }
        )
    }
}

private fun onSeekServiceVolume(pct: Int, context: android.content.Context, repository: MusicRepository) {
    com.malamusic.app.audio.MusicPlayerService.instance?.setVolume(pct / 100f)
}

@Composable
private fun PlayerTabButton(label: String, active: Boolean, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(999.dp))
            .background(if (active) Color.White.copy(alpha = 0.2f) else Color.Transparent)
            .clickable(onClick = onClick)
            .padding(horizontal = 18.dp, vertical = 8.dp)
    ) {
        Text(label, color = if (active) Color.White else Color.White.copy(alpha = 0.5f), fontSize = 12.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun PlayerCircleButton(onClick: () -> Unit, content: @Composable () -> Unit) {
    Box(
        modifier = Modifier
            .size(44.dp)
            .clip(CircleShape)
            .background(Color.White.copy(alpha = 0.1f))
            .border(1.dp, Color.White.copy(alpha = 0.1f))
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) { content() }
}

@Composable
private fun PlayerTransportButton(icon: ImageVector, desc: String, highlighted: Boolean = false, onClick: () -> Unit) {
    IconButton(onClick = onClick) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.size(44.dp)) {
            Icon(icon, desc, tint = if (highlighted) AccentRose else Color.White.copy(alpha = 0.8f), modifier = Modifier.size(24.dp))
        }
    }
}

/** Web: compact inline lyrics panel inside the full player. */
@Composable
private fun CompactLyricsPanel(
    track: Track?,
    lines: List<LyricLine>,
    activeLine: Int,
    syncOffset: Int,
    onSyncPrev: () -> Unit,
    onSyncNext: () -> Unit,
    onReset: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(max = 340.dp)
            .clip(RoundedCornerShape(18.dp))
            .background(Color.Black.copy(alpha = 0.5f))
            .border(1.dp, Color.White.copy(alpha = 0.15f))
            .padding(14.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            TrackArtwork(track, modifier = Modifier.size(44.dp), shape = RoundedCornerShape(10.dp))
            Spacer(Modifier.width(10.dp))
            Column(Modifier.weight(1f)) {
                Text(track?.title ?: "Lirik", color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(track?.artist ?: "", color = TextSecondary, fontSize = 11.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }
        Spacer(Modifier.height(10.dp))
        if (lines.isEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Filled.MusicNote, null, tint = Color.White.copy(alpha = 0.3f), modifier = Modifier.size(36.dp))
                    Spacer(Modifier.height(8.dp))
                    Text("Lirik tidak tersedia", color = TextMuted, fontSize = 12.sp)
                }
            }
        } else {
            val scrollState = rememberScrollState()
            LaunchedEffect(activeLine) {
                if (activeLine >= 0) scrollState.scrollTo((activeLine * 44).coerceAtLeast(0))
            }
            Column(Modifier.weight(1f).verticalScroll(scrollState)) {
                lines.forEachIndexed { i, line ->
                    LyricRow(line, i == activeLine)
                }
            }
        }
        Spacer(Modifier.height(10.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(999.dp))
                    .background(Color.White.copy(alpha = 0.1f))
                    .border(1.dp, Color.White.copy(alpha = 0.1f))
                    .padding(start = 10.dp, end = 4.dp, top = 4.dp, bottom = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Sync", color = Color.White.copy(alpha = 0.6f), fontSize = 10.sp, fontWeight = FontWeight.SemiBold)
                MiniRoundBtn("-", onClick = {
                    if (syncOffset > 0) onSyncPrev() else onReset()
                })
                if (syncOffset != 0) Text(
                    if (syncOffset > 0) "+$syncOffset" else "$syncOffset",
                    color = if (syncOffset > 0) AccentRose else TextSecondary,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 4.dp)
                )
                MiniRoundBtn("+", onClick = onSyncNext)
            }
            Spacer(Modifier.weight(1f))
            Text(
                if (lines.isEmpty()) "Lirik tidak tersedia" else "Lirik Penuh",
                color = TextSecondary,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
private fun MiniRoundBtn(label: String, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .size(20.dp)
            .clip(CircleShape)
            .background(Color.White.copy(alpha = 0.15f))
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Text(label, color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun LyricRow(line: LyricLine, active: Boolean) {
    Column(
        modifier = Modifier.fillMaxWidth().padding(vertical = 10.dp, horizontal = 4.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            line.text,
            color = if (active) Color.White else Color.White.copy(alpha = 0.4f),
            fontSize = if (active) 15.sp else 13.sp,
            fontWeight = if (active) FontWeight.Bold else FontWeight.Normal,
            textAlign = TextAlign.Center
        )
        if (line.translation.isNotBlank()) {
            Text(line.translation, color = Color.White.copy(alpha = 0.35f), fontSize = 11.sp, textAlign = TextAlign.Center)
        }
    }
}

/** Web: options sheet with the 4x2 icon grid (Auto Next, EQ, Timer, Playlist, Speed, Queue, Download, Share). */
@Composable
private fun MoreSheet(
    track: Track?,
    autoNextOn: Boolean,
    onAutoNextToggle: () -> Unit,
    onDownload: () -> Unit,
    onOpenQueue: () -> Unit,
    onShare: () -> Unit,
    onSleepTimer: (Int) -> Unit,
    onSpeed: (Float) -> Unit,
    onOpenLibrary: () -> Unit,
    onDismiss: () -> Unit
) {
    var showSleepOptions by remember { mutableStateOf(false) }
    var showSpeedOptions by remember { mutableStateOf(false) }
    var selectedSpeed by remember { mutableStateOf(1.0f) }

    Box(Modifier.fillMaxSize().clickable(onClick = onDismiss), contentAlignment = Alignment.BottomCenter) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.8f)
                .clip(RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp))
                .background(DarkCard)
                .padding(horizontal = 24.dp, vertical = 16.dp)
        ) {
            Box(
                modifier = Modifier
                    .width(40.dp)
                    .height(4.dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(Color.White.copy(alpha = 0.2f))
            )
            Spacer(Modifier.height(16.dp))
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
                TrackArtwork(track, modifier = Modifier.size(48.dp), shape = RoundedCornerShape(12.dp))
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) {
                    Text(track?.title ?: "Pilih Lagu", color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text(track?.artist ?: "", color = TextSecondary, fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
            }
            Spacer(Modifier.height(16.dp))

            Row(Modifier.horizontalScroll(rememberScrollState())) {
                OptionTile(Icons.AutoMirrored.Filled.Forward, "Auto Next", autoNextOn) { onAutoNextToggle() }
                Spacer(Modifier.width(10.dp))
                OptionTile(Icons.Filled.Equalizer, "EQ") { onOpenLibrary() }
                Spacer(Modifier.width(10.dp))
                OptionTile(Icons.Filled.AccessTime, "Timer", showSleepOptions) { showSleepOptions = !showSleepOptions }
                Spacer(Modifier.width(10.dp))
                OptionTile(Icons.AutoMirrored.Filled.PlaylistAdd, "Playlist") { onOpenLibrary() }
                Spacer(Modifier.width(10.dp))
                OptionTile(Icons.Filled.Speed, "Speed", showSpeedOptions) { showSpeedOptions = !showSpeedOptions }
                Spacer(Modifier.width(10.dp))
                OptionTile(Icons.Filled.QueueMusic, "Queue") { onOpenQueue() }
                Spacer(Modifier.width(10.dp))
                OptionTile(Icons.Filled.Download, "Download") { onDownload() }
                Spacer(Modifier.width(10.dp))
                OptionTile(Icons.Filled.Share, "Share") { onShare() }
            }

            if (showSleepOptions) {
                Spacer(Modifier.height(14.dp))
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf(0, 15, 30, 45, 60).forEach { mins ->
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(10.dp))
                                .background(if (mins == 0) Color.White.copy(alpha = 0.08f) else Color.White.copy(alpha = 0.05f))
                                .clickable { onSleepTimer(mins); showSleepOptions = false }
                                .padding(vertical = 10.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                if (mins == 0) "Matikan" else "$mins mnt",
                                color = if (mins == 0) AccentRose else TextPrimary,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }

            if (showSpeedOptions) {
                Spacer(Modifier.height(14.dp))
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf(0.5f, 0.75f, 1f, 1.25f, 1.5f, 2f).forEach { rate ->
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(10.dp))
                                .background(Color.White.copy(alpha = 0.05f))
                                .clickable {
                                    selectedSpeed = rate
                                    onSpeed(rate)
                                    showSpeedOptions = false
                                }
                                .padding(vertical = 10.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                String.format(java.util.Locale.US, "%.2g", rate),
                                color = TextPrimary,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }

            Spacer(Modifier.height(16.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(999.dp))
                    .background(Color.White.copy(alpha = 0.1f))
                    .clickable(onClick = onDismiss)
                    .padding(vertical = 14.dp),
                contentAlignment = Alignment.Center
            ) {
                Text("Tutup", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 13.sp)
            }
        }
    }
}

@Composable
private fun OptionTile(icon: ImageVector, label: String, active: Boolean = false, onClick: () -> Unit) {
    Column(
        modifier = Modifier
            .clip(RoundedCornerShape(16.dp))
            .background(if (active) Color(0x33F43F5E).copy(alpha = 0.2f) else Color.White.copy(alpha = 0.05f))
            .clickable(onClick = onClick)
            .padding(12.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(icon, label, tint = if (active) AccentRose else TextPrimary, modifier = Modifier.size(20.dp))
        Spacer(Modifier.height(6.dp))
        Text(label, color = if (active) AccentRose else Color.White.copy(alpha = 0.9f), fontSize = 10.sp, fontWeight = FontWeight.SemiBold)
    }
}

/** Web: queue sheet — full list of the current queue, tap to jump. */
@Composable
private fun QueueSheet(
    queue: List<Track>,
    currentIndex: Int,
    isPlaying: Boolean,
    onPlayIndex: (Int) -> Unit,
    onDismiss: () -> Unit
) {
    Box(Modifier.fillMaxSize().clickable(onClick = onDismiss), contentAlignment = Alignment.BottomCenter) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.75f)
                .clip(RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp))
                .background(DarkCard)
                .padding(horizontal = 20.dp, vertical = 16.dp)
        ) {
            Box(
                modifier = Modifier
                    .width(40.dp)
                    .align(Alignment.CenterHorizontally)
                    .height(4.dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(Color.White.copy(alpha = 0.2f))
            )
            Spacer(Modifier.height(14.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Antrean Putar", color = TextPrimary, fontSize = 17.sp, fontWeight = FontWeight.Black, modifier = Modifier.weight(1f))
                Text("${queue.size} lagu", color = TextMuted, fontSize = 12.sp)
            }
            Spacer(Modifier.height(10.dp))
            LazyColumn(modifier = Modifier.weight(1f)) {
                items(queue.size) { i ->
                    val t = queue[i]
                    val isCurrent = i == currentIndex
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(if (isCurrent) Color.White.copy(alpha = 0.08f) else Color.Transparent)
                            .clickable { onPlayIndex(i) }
                            .padding(vertical = 8.dp, horizontal = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        TrackArtwork(t, modifier = Modifier.size(44.dp), shape = RoundedCornerShape(8.dp))
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            Text(
                                t.title,
                                color = if (isCurrent) AccentRose else TextPrimary,
                                fontSize = 13.sp,
                                fontWeight = if (isCurrent) FontWeight.Bold else FontWeight.Normal,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Text(t.artist, color = TextMuted, fontSize = 11.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        }
                        if (isCurrent && isPlaying) {
                            EqBars(color = AccentRose)
                        }
                    }
                }
            }
            Spacer(Modifier.height(8.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(999.dp))
                    .background(Color.White.copy(alpha = 0.1f))
                    .clickable(onClick = onDismiss)
                    .padding(vertical = 14.dp),
                contentAlignment = Alignment.Center
            ) {
                Text("Tutup", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 13.sp)
            }
        }
    }
}

/** Small animated equalizer bars (search rows / queue current indicator). */
@Composable
fun EqBars(color: Color, modifier: Modifier = Modifier) {
    var tick by remember { mutableStateOf(0) }
    LaunchedEffect(Unit) {
        while (true) {
            tick = (tick + 1) % 4
            kotlinx.coroutines.delay(280)
        }
    }
    Row(modifier = modifier.size(24.dp), verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(3.dp)) {
        listOf(0.5f, 1f, 0.7f, 0.4f).forEachIndexed { i, h ->
            val animH = h * (0.6f + 0.4f * kotlin.math.sin((tick + i).toDouble()).toFloat())
            Box(
                modifier = Modifier
                    .width(3.dp)
                    .height((animH * 24f).dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(color)
            )
        }
    }
}

private fun formatTime(seconds: Double): String {
    if (seconds.isNaN() || seconds <= 0) return "0:00"
    val mins = (seconds / 60).toInt()
    val secs = (seconds % 60).toInt()
    return "$mins:${secs.toString().padStart(2, '0')}"
}
