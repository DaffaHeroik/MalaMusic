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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.malamusic.app.data.repository.MusicRepository
import com.malamusic.app.ui.theme.*

@Composable
fun ProfileScreen(repository: MusicRepository) {
    val likedSongs by repository.likedSongs.collectAsState()
    val recentTracks by repository.recentTracks.collectAsState()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBackground)
            .padding(horizontal = 16.dp)
    ) {
        // Profile header
        item {
            Spacer(Modifier.height(48.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(20.dp))
                    .background(
                        Brush.radialGradient(
                            colors = listOf(
                                AccentRose.copy(alpha = 0.3f),
                                DarkBackground
                            )
                        )
                    )
                    .padding(24.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(72.dp)
                            .clip(CircleShape)
                            .background(DarkCard),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Filled.Person, null, tint = TextSecondary, modifier = Modifier.size(36.dp))
                    }
                    Spacer(Modifier.width(16.dp))
                    Column {
                        Text("Profil Saya", color = TextPrimary, fontSize = 20.sp, fontWeight = FontWeight.Black)
                        Text("Pengguna MalaMusic", color = TextSecondary, fontSize = 13.sp)
                    }
                }
            }
        }

        // Stats
        item {
            Spacer(Modifier.height(20.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                StatCard("Disukai", "${likedSongs.size}", Icons.Filled.Favorite, AccentRose, Modifier.weight(1f))
                StatCard("Playlist", "0", Icons.Filled.QueueMusic, AccentPurple, Modifier.weight(1f))
                StatCard("Recent", "${recentTracks.size}", Icons.Filled.History, AccentAmber, Modifier.weight(1f))
            }
        }

        // Quick actions
        item {
            Spacer(Modifier.height(20.dp))
            ProfileAction("Pengaturan", Icons.Filled.Settings, "Playback, tampilan, data")
            ProfileAction("Tentang MalaMusic", Icons.Filled.Info, "Versi 2.0.0")
        }

        item { Spacer(Modifier.height(120.dp)) }
    }
}

@Composable
fun StatCard(label: String, value: String, icon: ImageVector, tint: Color, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .background(DarkCard)
            .padding(16.dp)
    ) {
        Column {
            Icon(icon, null, tint = tint, modifier = Modifier.size(20.dp))
            Spacer(Modifier.height(8.dp))
            Text(value, color = TextPrimary, fontSize = 24.sp, fontWeight = FontWeight.Black)
            Text(label, color = TextMuted, fontSize = 11.sp)
        }
    }
}

@Composable
fun ProfileAction(title: String, icon: ImageVector, subtitle: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(DarkCard)
            .clickable { }
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, null, tint = TextSecondary, modifier = Modifier.size(22.dp))
        Spacer(Modifier.width(14.dp))
        Column(Modifier.weight(1f)) {
            Text(title, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
            Text(subtitle, color = TextMuted, fontSize = 12.sp)
        }
        Icon(Icons.Filled.ChevronRight, null, tint = TextMuted, modifier = Modifier.size(20.dp))
    }
    Spacer(Modifier.height(8.dp))
}
