package com.malamusic.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
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
fun LibraryScreen(
    repository: MusicRepository,
    onTrackClick: (Track) -> Unit
) {
    var activeTab by remember { mutableStateOf("songs") }
    val likedSongs by repository.likedSongs.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBackground)
            .padding(horizontal = 16.dp)
    ) {
        Spacer(Modifier.height(48.dp))
        Text("Koleksi", fontSize = 28.sp, fontWeight = FontWeight.Black, color = TextPrimary)

        Spacer(Modifier.height(16.dp))

        // Tab bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .background(Color.White.copy(alpha = 0.05f))
                .padding(4.dp),
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            LibraryTab("Playlists", "playlists", activeTab) { activeTab = it }
            LibraryTab("Artis", "artists", activeTab) { activeTab = it }
            LibraryTab("Lagu Disukai", "songs", activeTab) { activeTab = it }
            LibraryTab("Offline", "offline", activeTab) { activeTab = it }
        }

        Spacer(Modifier.height(16.dp))

        // Content
        when (activeTab) {
            "songs" -> {
                if (likedSongs.isEmpty()) {
                    EmptyState("Belum Ada Lagu Disukai", "Tekan ikon hati saat menemukan lagu favorit")
                } else {
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        items(likedSongs) { track ->
                            SearchResultItem(track = track, onClick = { onTrackClick(track) })
                        }
                    }
                }
            }
            "artists" -> {
                EmptyState("Belum Ada Artist Disukai", "Sukai artist favoritmu")
            }
            "playlists" -> {
                EmptyState("Belum Ada Playlist", "Buat playlist baru dari menu opsi lagu")
            }
            "offline" -> {
                EmptyState("Belum Ada Lagu Offline", "Download lagu untuk diputar offline")
            }
        }
    }
}

@Composable
fun LibraryTab(label: String, tab: String, active: String, onClick: (String) -> Unit) {
    val isActive = tab == active
    Box(
        modifier = Modifier
            .weight(1f)
            .clip(RoundedCornerShape(12.dp))
            .background(if (isActive) TextPrimary else Color.Transparent)
            .clickable { onClick(tab) }
            .padding(vertical = 12.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            label,
            color = if (isActive) DarkBackground else TextSecondary,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
fun EmptyState(title: String, subtitle: String) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 60.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            Icons.Filled.MusicOff,
            null,
            tint = TextMuted,
            modifier = Modifier.size(48.dp)
        )
        Spacer(Modifier.height(16.dp))
        Text(title, color = TextPrimary, fontSize = 16.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(8.dp))
        Text(subtitle, color = TextSecondary, fontSize = 13.sp)
    }
}
