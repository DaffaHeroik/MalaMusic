package com.malamusic.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SearchScreen(
    repository: MusicRepository,
    onTrackClick: (Track) -> Unit
) {
    var query by remember { mutableStateOf("") }
    var activeFilter by remember { mutableStateOf("songs") }
    val searchResults by repository.searchResults.collectAsState()
    val suggestions by repository.suggestions.collectAsState()
    val isLoading by repository.isLoading.collectAsState()
    var showSuggestions by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBackground)
            .padding(horizontal = 16.dp)
    ) {
        // Header
        Spacer(Modifier.height(48.dp))
        Text("Cari", fontSize = 28.sp, fontWeight = FontWeight.Black, color = TextPrimary)

        Spacer(Modifier.height(16.dp))

        // Search input
        OutlinedTextField(
            value = query,
            onValueChange = {
                query = it
                showSuggestions = it.isNotEmpty()
                if (it.isNotEmpty()) {
                    repository.loadSuggestions(it)
                }
            },
            modifier = Modifier.fillMaxWidth(),
            placeholder = { Text("Cari lagu, artis, playlist...", color = TextMuted) },
            leadingIcon = { Icon(Icons.Filled.Search, null, tint = TextSecondary) },
            trailingIcon = {
                if (query.isNotEmpty()) {
                    IconButton(onClick = { query = ""; showSuggestions = false }) {
                        Icon(Icons.Filled.Clear, null, tint = TextSecondary)
                    }
                }
            },
            shape = RoundedCornerShape(16.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = Color.White.copy(alpha = 0.3f),
                unfocusedBorderColor = Color.White.copy(alpha = 0.1f),
                focusedContainerColor = Color.White.copy(alpha = 0.05f),
                unfocusedContainerColor = Color.White.copy(alpha = 0.05f),
                focusedTextColor = TextPrimary,
                unfocusedTextColor = TextPrimary
            ),
            singleLine = true
        )

        // Suggestions dropdown
        if (showSuggestions && suggestions.isNotEmpty()) {
            LazyColumn(modifier = Modifier.heightIn(max = 250.dp)) {
                items(suggestions.take(8)) { suggestion ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                query = suggestion.text
                                showSuggestions = false
                                repository.searchMusic(suggestion.text)
                            }
                            .padding(vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Filled.Search, null, tint = TextSecondary, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(12.dp))
                        Text(suggestion.text, color = TextPrimary, fontSize = 14.sp)
                    }
                }
            }
        }

        // Filter tabs
        if (!showSuggestions) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                FilterChip("Musik", "songs", activeFilter) { activeFilter = it }
                FilterChip("Playlist", "playlists", activeFilter) { activeFilter = it }
                FilterChip("Artis", "artists", activeFilter) { activeFilter = it }
            }
        }

        // Results
        LazyColumn(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            if (isLoading) {
                items(6) {
                    Row(modifier = Modifier.padding(vertical = 8.dp)) {
                        Box(modifier = Modifier.size(48.dp).clip(RoundedCornerShape(8.dp)).background(DarkCard))
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            Box(modifier = Modifier.height(14.dp).fillMaxWidth(0.6f).background(DarkCard, RoundedCornerShape(4.dp)))
                            Spacer(Modifier.height(6.dp))
                            Box(modifier = Modifier.height(12.dp).fillMaxWidth(0.4f).background(DarkCard, RoundedCornerShape(4.dp)))
                        }
                    }
                }
            }

            if (activeFilter == "songs") {
                items(searchResults.songs) { track ->
                    SearchResultItem(track, onClick = { onTrackClick(track) })
                }
            }
            if (activeFilter == "playlists") {
                items(searchResults.playlists) { playlist ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { }
                            .padding(vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(modifier = Modifier.size(48.dp).clip(RoundedCornerShape(8.dp)).background(DarkCard))
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            Text(playlist.name, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            Text("Playlist • ${playlist.songs.size} lagu", color = TextSecondary, fontSize = 12.sp)
                        }
                    }
                }
            }
            if (activeFilter == "artists") {
                items(searchResults.artists) { artist ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { }
                            .padding(vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(modifier = Modifier.size(56.dp).clip(RoundedCornerShape(28.dp)).background(DarkCard))
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            Text(artist.name, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                            Text("Artist", color = TextSecondary, fontSize = 12.sp)
                        }
                    }
                }
            }

            item { Spacer(Modifier.height(120.dp)) }
        }
    }
}

@Composable
fun FilterChip(label: String, filter: String, active: String, onClick: (String) -> Unit) {
    val isActive = filter == active
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(20.dp))
            .background(if (isActive) TextPrimary else Color.White.copy(alpha = 0.06f))
            .clickable { onClick(filter) }
            .padding(horizontal = 16.dp, vertical = 8.dp)
    ) {
        Text(
            label,
            color = if (isActive) DarkBackground else TextSecondary,
            fontSize = 12.sp,
            fontWeight = if (isActive) FontWeight.Bold else FontWeight.Medium
        )
    }
}

@Composable
fun SearchResultItem(track: Track, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(48.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(DarkCard)
        )
        Spacer(Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(track.title, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Text(track.artist, color = TextSecondary, fontSize = 12.sp, maxLines = 1)
        }
        Icon(Icons.Filled.PlayCircle, null, tint = TextPrimary, modifier = Modifier.size(32.dp))
    }
}
