package com.malamusic.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.platform.LocalContext
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
import androidx.compose.material.icons.filled.Login
import androidx.compose.material.icons.filled.Logout
import com.malamusic.app.ui.components.BrandLogo
import com.malamusic.app.ui.theme.*

@Composable
fun ProfileScreen(repository: MusicRepository, onOpenAuth: () -> Unit = {}, onLogout: () -> Unit = {}) {
    val user by repository.authUser.collectAsState()
    val likedSongs by repository.likedSongs.collectAsState()
    val recentTracks by repository.recentTracks.collectAsState()
    var showSettings by remember { mutableStateOf(false) }
    val context = LocalContext.current
    val settings = remember { context.getSharedPreferences("malamusic_settings", android.content.Context.MODE_PRIVATE) }
    var autoplay by remember { mutableStateOf(settings.getBoolean("autoplay", true)) }

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
                                AccentRose.copy(alpha = 0.35f),
                                Color(0xFF1A1020),
                                DarkBackground
                            )
                        )
                    )
                    .padding(24.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    BrandLogo(size = 72.dp)
                    Spacer(Modifier.width(16.dp))
                    Column {
                        Text(user?.name?.ifBlank { "MalaMusic" } ?: "MalaMusic", color = TextPrimary, fontSize = 20.sp, fontWeight = FontWeight.Black)
                        Text(user?.email ?: "Musik tanpa batas", color = TextSecondary, fontSize = 13.sp)
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
            if (user == null) {
                ProfileAction("Login / Daftar", Icons.Filled.Login, "Sinkronkan koleksi dan akun", onOpenAuth)
            } else {
                val signedInUser = user
                ProfileAction("Akun terhubung", Icons.Filled.Person, if (signedInUser?.emailVerified == true) "Email terverifikasi" else "Akun ${signedInUser?.email.orEmpty()}") { }
                ProfileAction("Logout", Icons.Filled.Logout, "Keluar dari akun MalaMusic", onLogout)
            }
            ProfileAction("Pengaturan", Icons.Filled.Settings, "Playback, tampilan, data") { showSettings = true }
            ProfileAction("Tentang MalaMusic", Icons.Filled.Info, "Versi 2.1.4") { }
        }

        item { Spacer(Modifier.height(120.dp)) }
    }

    if (showSettings) {
        val cache = repository.audioCache
        var cacheMessage by remember { mutableStateOf("") }
        AlertDialog(
            onDismissRequest = { showSettings = false },
            title = { Text("Pengaturan MalaMusic", color = TextPrimary, fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text("Putar otomatis", color = TextPrimary, fontWeight = FontWeight.SemiBold)
                            Text("Lanjutkan ke lagu berikutnya saat lagu selesai", color = TextMuted, fontSize = 12.sp)
                        }
                        Switch(checked = autoplay, onCheckedChange = {
                            autoplay = it
                            settings.edit().putBoolean("autoplay", it).apply()
                        })
                    }
                    HorizontalDivider(color = Color.White.copy(alpha = 0.08f))
                    Text("Cache streaming: ${formatBytes(cache?.streamingCacheBytes() ?: 0L)}", color = TextSecondary, fontSize = 13.sp)
                    Text("Download offline: ${formatBytes(cache?.offlineCacheBytes() ?: 0L)}", color = TextSecondary, fontSize = 13.sp)
                    OutlinedButton(onClick = {
                        val removed = cache?.clearStreamingCache() ?: 0
                        cacheMessage = "$removed item cache streaming dibersihkan."
                    }, modifier = Modifier.fillMaxWidth()) {
                        Icon(Icons.Filled.DeleteSweep, null)
                        Spacer(Modifier.width(8.dp))
                        Text("Bersihkan cache streaming")
                    }
                    if (cacheMessage.isNotBlank()) Text(cacheMessage, color = AccentRose, fontSize = 12.sp)
                    Text("Download offline tidak ikut dihapus.", color = TextMuted, fontSize = 11.sp)
                }
            },
            confirmButton = { TextButton(onClick = { showSettings = false }) { Text("Selesai", color = AccentRose) } },
            containerColor = DarkCard,
            titleContentColor = TextPrimary,
            textContentColor = TextSecondary
        )
    }
}

private fun formatBytes(bytes: Long): String {
    if (bytes < 1024) return "$bytes B"
    val kb = bytes / 1024.0
    if (kb < 1024) return String.format(java.util.Locale.US, "%.1f KB", kb)
    return String.format(java.util.Locale.US, "%.1f MB", kb / 1024.0)
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
fun ProfileAction(title: String, icon: ImageVector, subtitle: String, onClick: () -> Unit = {}) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(DarkCard)
            .clickable(onClick = onClick)
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