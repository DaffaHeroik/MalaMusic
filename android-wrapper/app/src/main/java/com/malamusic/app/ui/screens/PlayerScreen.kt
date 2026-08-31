package com.malamusic.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.malamusic.app.data.model.Track
import com.malamusic.app.data.repository.MusicRepository
import com.malamusic.app.ui.theme.*

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
    val position by repository.position.collectAsState()
    val duration by repository.duration.collectAsState()
    val lyrics by repository.lyrics.collectAsState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        Color(0xFF1A0A1E),
                        DarkBackground
                    )
                )
            )
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 24.dp)
                .padding(top = 48.dp),
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
                Text("Sedang Diputar", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                IconButton(onClick = { }) {
                    Icon(Icons.Filled.MoreVert, "Opsi", tint = TextPrimary)
                }
            }

            Spacer(Modifier.height(16.dp))

            // Cover Art
            Box(
                modifier = Modifier
                    .size(280.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(DarkCard),
                contentAlignment = Alignment.Center
            ) {
                if (track != null) {
                    Icon(Icons.Filled.MusicNote, null, tint = AccentRose, modifier = Modifier.size(80.dp))
                }
            }

            Spacer(Modifier.height(24.dp))

            // Track info
            Text(
                track?.title ?: "Pilih lagu",
                color = TextPrimary,
                fontSize = 22.sp,
                fontWeight = FontWeight.Black,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                textAlign = TextAlign.Center
            )
            Spacer(Modifier.height(4.dp))
            Text(
                track?.artist ?: "MalaMusic",
                color = TextSecondary,
                fontSize = 14.sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )

            Spacer(Modifier.height(24.dp))

            // Seek bar
            Column(modifier = Modifier.fillMaxWidth()) {
                Slider(
                    value = position.toFloat(),
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

            Spacer(Modifier.height(8.dp))

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
                    Icon(
                        if (isPlaying) Icons.Filled.Pause else Icons.Filled.PlayArrow,
                        contentDescription = if (isPlaying) "Jeda" else "Putar",
                        tint = DarkBackground,
                        modifier = Modifier.size(36.dp)
                    )
                }
                IconButton(onClick = onNext) {
                    Icon(Icons.Filled.SkipNext, "Selanjutnya", tint = TextPrimary, modifier = Modifier.size(32.dp))
                }
            }

            // Lyrics preview
            if (lyrics.lines.isNotEmpty()) {
                Spacer(Modifier.height(24.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(120.dp)
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
    val mins = (seconds / 60).toInt()
    val secs = (seconds % 60).toInt()
    return "$mins:${secs.toString().padStart(2, '0')}"
}
