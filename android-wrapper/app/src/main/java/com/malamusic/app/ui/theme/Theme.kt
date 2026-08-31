package com.malamusic.app.ui.theme

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// MalaMusic Dark Theme Colors
val DarkBackground = Color(0xFF08090D)
val DarkSurface = Color(0xFF121318)
val DarkCard = Color(0xFF20222C)
val DarkCardHover = Color(0xFF282B38)
val DarkBorder = Color(0x1AFFFFFF)
val TextPrimary = Color(0xFFFFFFFF)
val TextSecondary = Color(0xFFA0A5B0)
val TextMuted = Color(0xFF6B7280)
val AccentRose = Color(0xFFF43F5E)
val AccentPurple = Color(0xFFA78BFA)
val AccentCyan = Color(0xFF06B6D4)
val AccentAmber = Color(0xFFF59E0B)
val AccentEmerald = Color(0xFF10B981)

private val DarkColorScheme = darkColorScheme(
    primary = AccentRose,
    onPrimary = Color.White,
    primaryContainer = Color(0xFF4C1D2B),
    secondary = AccentPurple,
    onSecondary = Color.White,
    secondaryContainer = Color(0xFF2D1B69),
    tertiary = AccentCyan,
    background = DarkBackground,
    onBackground = TextPrimary,
    surface = DarkSurface,
    onSurface = TextPrimary,
    surfaceVariant = DarkCard,
    onSurfaceVariant = TextSecondary,
    outline = DarkBorder,
    error = Color(0xFFEF4444),
    onError = Color.White
)

@Composable
fun MalaMusicTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography = Typography(),
        content = content
    )
}
