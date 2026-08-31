package com.malamusic.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.malamusic.app.data.model.Track
import com.malamusic.app.data.repository.MusicRepository
import com.malamusic.app.ui.theme.*

@Composable
fun HomeScreen(
    repository: MusicRepository,
    onTrackClick: (Track) -> Unit
) {
    val homeData by repository.homeData.collectAsState()
    val recentTracks by repository.recentTracks.collectAsState()
    val isLoading by repository.isLoading.collectAsState()

    LaunchedEffect(Unit) { repository.loadHome() }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBackground)
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        // Header
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 48.dp, bottom = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "MalaMusic",
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Black,
                    color = TextPrimary
                )
            }
        }

        // Recently Played
        if (recentTracks.isNotEmpty()) {
            item {
                SectionHeader("Recently Played", Icons.Filled.History, AccentRose)
            }
            item {
                LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(recentTracks.take(6)) { track ->
                        TrackCard(track, onClick = { onTrackClick(track) })
                    }
                }
            }
        }

        // Quick Picks
        item {
            SectionHeader("Quick Picks", Icons.Filled.Bolt, AccentAmber)
        }
        item {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                items(homeData.songs.take(10)) { track ->
                    TrackCard(track, onClick = { onTrackClick(track) })
                }
            }
        }

        // Top Artists
        if (homeData.artists.isNotEmpty()) {
            item {
                SectionHeader("Top Artists", Icons.Filled.People, AccentRose)
            }
            item {
                LazyRow(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    items(homeData.artists.take(8)) { artist ->
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier.clickable { }
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(80.dp)
                                    .clip(RoundedCornerShape(40.dp))
                                    .background(DarkCard)
                            )
                            Spacer(Modifier.height(6.dp))
                            Text(
                                artist.name,
                                color = TextPrimary,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                }
            }
        }

        // Popular Playlists
        if (homeData.playlists.isNotEmpty()) {
            item {
                SectionHeader("Popular Playlists", Icons.Filled.QueueMusic, AccentPurple)
            }
            item {
                LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(homeData.playlists.take(6)) { playlist ->
                        Column(
                            modifier = Modifier
                                .width(140.dp)
                                .clickable { }
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .aspectRatio(1f)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(DarkCard)
                            )
                            Spacer(Modifier.height(8.dp))
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
                }
            }
        }

        // Bottom spacing for mini player
        item { Spacer(Modifier.height(120.dp)) }
    }
}

@Composable
fun SectionHeader(title: String, icon: androidx.compose.ui.graphics.vector.ImageVector, tint: Color) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(20.dp))
        Spacer(Modifier.width(8.dp))
        Text(title, color = TextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun TrackCard(track: Track, onClick: () -> Unit) {
    Column(
        modifier = Modifier
            .width(140.dp)
            .clickable(onClick = onClick)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(1f)
                .clip(RoundedCornerShape(12.dp))
                .background(DarkCard)
        )
        Spacer(Modifier.height(6.dp))
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
            maxLines = 1
        )
    }
}
