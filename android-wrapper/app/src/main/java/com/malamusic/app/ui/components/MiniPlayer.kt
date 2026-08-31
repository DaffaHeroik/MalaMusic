package com.malamusic.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.malamusic.app.data.model.Track
import com.malamusic.app.data.repository.MusicRepository
import com.malamusic.app.ui.theme.*

@Composable
fun MiniPlayer(
    track: Track?,
    repository: MusicRepository,
    onClick: () -> Unit,
    onPlayPause: () -> Unit
) {
    val isPlaying by repository.isPlaying.collectAsState()
    val position by repository.position.collectAsState()
    val duration by repository.duration.collectAsState()

    if (track == null) return

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(DarkCard)
            .clickable(onClick = onClick)
    ) {
        // Progress indicator
        LinearProgressIndicator(
            progress = { (position / duration.coerceAtLeast(1.0)).toFloat() },
            modifier = Modifier
                .fillMaxWidth()
                .height(2.dp),
            color = TextPrimary,
            trackColor = Color.White.copy(alpha = 0.1f)
        )

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Track cover
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(DarkBackground),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Filled.MusicNote, null, tint = AccentRose, modifier = Modifier.size(20.dp))
            }

            Spacer(Modifier.width(12.dp))

            // Track info
            Column(modifier = Modifier.weight(1f)) {
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

            // Play/Pause
            IconButton(onClick = onPlayPause) {
                Icon(
                    if (isPlaying) Icons.Filled.Pause else Icons.Filled.PlayArrow,
                    contentDescription = if (isPlaying) "Jeda" else "Putar",
                    tint = TextPrimary,
                    modifier = Modifier.size(28.dp)
                )
            }

            // Next
            IconButton(onClick = { }) {
                Icon(Icons.Filled.SkipNext, "Selanjutnya", tint = TextSecondary, modifier = Modifier.size(24.dp))
            }
        }
    }
}
