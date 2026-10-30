package com.malamusic.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
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
    onSeek: (Long) -> Unit
) {
    val isPlaying by repository.isPlaying.collectAsState()
    val isBuffering by repository.isBuffering.collectAsState()
    val position by repository.position.collectAsState()
    val duration by repository.duration.collectAsState()
    val lyrics by repository.lyrics.collectAsState()
    val likedSongs by repository.likedSongs.collectAsState()
    val isLiked = track != null && likedSongs.any { it.trackId == track.trackId }
    val audioCache = repository.audioCache
    val downloads by (audioCache?.downloads?.collectAsState() ?: remember { mutableStateOf(emptyList<Track>()) })
    val downloadingIds by (audioCache?.downloadingIds?.collectAsState() ?: remember { mutableStateOf(emptySet<String>()) })
    val downloaded = track != null && downloads.any { it.trackId == track.trackId }
    var downloadError by remember(track?.trackId) { mutableStateOf("") }
    val scope = rememberCoroutineScope()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        Color(0xFF2A1020),
                        Color(0xFF160F1E),
                        DarkBackground
                    )
                )
            )
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp)
                .padding(top = 44.dp, bottom = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBack) {
                    Icon(Icons.Filled.KeyboardArrowDown, "Tutup", tint = TextPrimary, modifier = Modifier.size(32.dp))
                }
                Text("SEDANG DIPUTAR", color = TextSecondary, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.2.sp)
                IconButton(onClick = { track?.let { repository.toggleLike(it) } }) {
                    Icon(
                        if (isLiked) Icons.Filled.Favorite else Icons.Filled.FavoriteBorder,
                        "Sukai",
                        tint = if (isLiked) AccentRose else TextPrimary
                    )
                }
            }

            Spacer(Modifier.height(16.dp))

            // Cover Art
            TrackArtwork(
                track = track,
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(1f)
                    .padding(horizontal = 8.dp),
                shape = RoundedCornerShape(20.dp)
            )

            Spacer(Modifier.height(28.dp))

            Column(modifier = Modifier.fillMaxWidth()) {
                Text(
                    track?.title ?: "Pilih lagu",
                    color = TextPrimary,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Black,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    track?.artist ?: "MalaMusic",
                    color = TextSecondary,
                    fontSize = 14.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }

            Spacer(Modifier.height(16.dp))

            // Seek bar
            Column(modifier = Modifier.fillMaxWidth()) {
                Slider(
                    value = position.toFloat().coerceIn(0f, duration.toFloat().coerceAtLeast(1f)),
                    onValueChange = { onSeek((it * 1000).toLong()) },
                    valueRange = 0f..(duration.toFloat().coerceAtLeast(1f)),
                    colors = SliderDefaults.colors(
                        thumbColor = TextPrimary,
                        activeTrackColor = TextPrimary,
                        inactiveTrackColor = Color.White.copy(alpha = 0.15f)
                    )
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(formatTime(position), color = TextSecondary, fontSize = 11.sp)
                    Text(formatTime(duration), color = TextSecondary, fontSize = 11.sp)
                }
            }

            Spacer(Modifier.height(4.dp))

            // Controls
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onPrevious) {
                    Icon(Icons.Filled.SkipPrevious, "Sebelumnya", tint = TextPrimary, modifier = Modifier.size(32.dp))
                }
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .clip(CircleShape)
                        .background(TextPrimary)
                        .clickable(onClick = onPlayPause),
                    contentAlignment = Alignment.Center
                ) {
                    if (isBuffering) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(28.dp),
                            strokeWidth = 2.5.dp,
                            color = DarkBackground
                        )
                    } else {
                        Icon(
                            if (isPlaying) Icons.Filled.Pause else Icons.Filled.PlayArrow,
                            contentDescription = if (isPlaying) "Jeda" else "Putar",
                            tint = DarkBackground,
                            modifier = Modifier.size(36.dp)
                        )
                    }
                }
                IconButton(onClick = onNext) {
                    Icon(Icons.Filled.SkipNext, "Selanjutnya", tint = TextPrimary, modifier = Modifier.size(32.dp))
                }
            }

            // Explicit offline download. Normal playback is automatically cached in a bounded disk cache.
            Spacer(Modifier.height(16.dp))
            OutlinedButton(
                onClick = {
                    val selected = track ?: return@OutlinedButton
                    if (downloaded) return@OutlinedButton
                    downloadError = ""
                    scope.launch {
                        try { repository.downloadTrack(selected) }
                        catch (e: Exception) { downloadError = e.message ?: "Download gagal. Coba lagi." }
                    }
                },
                enabled = track != null && !downloaded && track?.trackId !in downloadingIds,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = TextPrimary)
            ) {
                if (track?.trackId in downloadingIds) CircularProgressIndicator(Modifier.size(18.dp), strokeWidth = 2.dp)
                else Icon(if (downloaded) Icons.Filled.CheckCircle else Icons.Filled.Download, null)
                Spacer(Modifier.width(8.dp))
                Text(if (downloaded) "Tersimpan untuk offline" else if (track?.trackId in downloadingIds) "Mengunduh lagu..." else "Download untuk offline")
            }
            if (downloadError.isNotBlank()) Text(downloadError, color = Color(0xFFFF8196), fontSize = 12.sp)

            // Lyrics preview
            if (lyrics.lines.isNotEmpty()) {
                Spacer(Modifier.height(24.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = 100.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(Color.Black.copy(alpha = 0.3f))
                        .padding(16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        lyrics.lines.firstOrNull { it.start <= position * 1000 && it.end >= position * 1000 }?.text
                            ?: lyrics.lines.firstOrNull()?.text
                            ?: "Lirik tidak tersedia",
                        color = TextPrimary,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center
                    )
                }
            }
        }
    }
}

private fun formatTime(seconds: Double): String {
    if (seconds.isNaN() || seconds <= 0) return "0:00"
    val mins = (seconds / 60).toInt()
    val secs = (seconds % 60).toInt()
    return "$mins:${secs.toString().padStart(2, '0')}"
}