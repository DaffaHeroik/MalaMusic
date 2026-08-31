package com.malamusic.app.ui

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.Bundle
import android.os.IBinder
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.malamusic.app.MalaMusicApp
import com.malamusic.app.audio.MusicPlayerService
import com.malamusic.app.data.model.Track
import com.malamusic.app.ui.components.MiniPlayer
import com.malamusic.app.ui.navigation.Screen
import com.malamusic.app.ui.navigation.bottomNavItems
import com.malamusic.app.ui.screens.*
import com.malamusic.app.ui.theme.DarkBackground
import com.malamusic.app.ui.theme.MalaMusicTheme
import com.malamusic.app.ui.theme.TextPrimary
import com.malamusic.app.ui.theme.TextSecondary
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private var playerService: MusicPlayerService? = null
    private var bound = false
    private val repository by lazy { MalaMusicApp.instance.repository }
    private val scope = MainScope()

    private val connection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
            playerService = (service as MusicPlayerService.PlayerBinder).getService()
            bound = true
        }
        override fun onServiceDisconnected(name: ComponentName?) {
            playerService = null
            bound = false
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        Intent(this, MusicPlayerService::class.java).also { intent ->
            startService(intent)
            bindService(intent, connection, Context.BIND_AUTO_CREATE)
        }

        setContent {
            MalaMusicTheme {
                MalaMusicAppContent()
            }
        }
    }

    override fun onDestroy() {
        if (bound) {
            unbindService(connection)
            bound = false
        }
        scope.cancel()
        super.onDestroy()
    }

    @Composable
    fun MalaMusicAppContent() {
        var currentScreen by remember { mutableStateOf<Screen>(Screen.Home) }
        var showFullPlayer by remember { mutableStateOf(false) }
        val currentTrack by repository.currentTrack.collectAsState()

        val onTrackClick: (Track) -> Unit = { track ->
            playerService?.let { svc ->
                scope.launch {
                    svc.playTrack(track)
                    repository.loadLyrics(track)
                }
            }
        }

        val onPlayPause: () -> Unit = { playerService?.togglePlayPause() }
        val onNext: () -> Unit = {
            playerService?.let {
                scope.launch { repository.playNext() }
            }
        }
        val onPrevious: () -> Unit = {
            playerService?.let {
                scope.launch { repository.playPrevious() }
            }
        }

        Box(modifier = Modifier.fillMaxSize().background(DarkBackground)) {
            Column(modifier = Modifier.fillMaxSize()) {
                Box(modifier = Modifier.weight(1f)) {
                    when (currentScreen) {
                        Screen.Home -> HomeScreen(repository, onTrackClick)
                        Screen.Search -> SearchScreen(repository, onTrackClick)
                        Screen.Library -> LibraryScreen(repository, onTrackClick)
                        Screen.Profile -> ProfileScreen(repository)
                        else -> HomeScreen(repository, onTrackClick)
                    }
                }

                if (currentTrack != null && !showFullPlayer) {
                    MiniPlayer(
                        track = currentTrack,
                        repository = repository,
                        onClick = { showFullPlayer = true },
                        onPlayPause = onPlayPause
                    )
                }

                AppBottomNav(currentScreen) { currentScreen = it }
            }

            if (showFullPlayer) {
                PlayerScreen(
                    track = currentTrack,
                    repository = repository,
                    onBack = { showFullPlayer = false },
                    onPlayPause = onPlayPause,
                    onNext = onNext,
                    onPrevious = onPrevious,
                    onSeek = { playerService?.seekTo(it) }
                )
            }
        }
    }
}

@Composable
fun AppBottomNav(currentScreen: Screen, onScreenChange: (Screen) -> Unit) {
    Surface(
        color = Color(0xFF0E0F16),
        tonalElevation = 0.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            bottomNavItems.forEach { screen ->
                val isSelected = screen.route == currentScreen.route
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .clickable { onScreenChange(screen) }
                        .padding(vertical = 4.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        imageVector = if (isSelected) screen.selectedIcon else screen.unselectedIcon,
                        contentDescription = screen.title,
                        tint = if (isSelected) TextPrimary else TextSecondary,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(Modifier.height(2.dp))
                    Text(
                        screen.title,
                        color = if (isSelected) TextPrimary else TextSecondary,
                        fontSize = 10.sp,
                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                    )
                }
            }
        }
    }
}
