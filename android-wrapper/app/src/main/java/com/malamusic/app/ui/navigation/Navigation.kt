package com.malamusic.app.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.ui.graphics.vector.ImageVector

sealed class Screen(
    val route: String,
    val title: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector
) {
    data object Home : Screen("home", "Beranda", Icons.Filled.Home, Icons.Outlined.Home)
    data object Search : Screen("search", "Cari", Icons.Filled.Search, Icons.Outlined.Search)
    data object Library : Screen("library", "Koleksi", Icons.Filled.LibraryMusic, Icons.Outlined.LibraryMusic)
    data object Profile : Screen("profile", "Profil", Icons.Filled.Person, Icons.Outlined.Person)
    data object Leaderboard : Screen("leaderboard", "Leaderboard", Icons.Filled.EmojiEvents, Icons.Outlined.EmojiEvents)
    data object Offline : Screen("offline", "Offline", Icons.Filled.CloudDownload, Icons.Outlined.CloudDownload)
    data object Liked : Screen("liked", "Disukai", Icons.Filled.Favorite, Icons.Outlined.Favorite)
}

val bottomNavItems = listOf(
    Screen.Home,
    Screen.Search,
    Screen.Library,
    Screen.Profile
)

val allScreens = listOf(
    Screen.Home,
    Screen.Search,
    Screen.Leaderboard,
    Screen.Library,
    Screen.Liked,
    Screen.Offline,
    Screen.Profile
)
