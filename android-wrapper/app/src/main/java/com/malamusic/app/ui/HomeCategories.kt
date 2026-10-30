package com.malamusic.app.ui

/**
 * Home category chip data — mirrors the web app's `Home.categories` + `fetchCategoryData`
 * query mapping so the Android home bar behaves identically to public/home.js.
 */
object HomeCategories {

    data class Category(val name: String, val icon: String = "")

    val all = listOf(
        Category("Semua"),
        Category("Chill", "coffee"),
        Category("Focus", "brain"),
        Category("Commute", "car"),
        Category("Gaming", "gamepad"),
        Category("Energize", "zap"),
        Category("Party", "party"),
        Category("Feel good", "smile"),
        Category("Romance", "heart"),
        Category("Workout", "workout"),
        Category("Sleep", "moon"),
        Category("Sad", "cloud-rain"),
        Category("Happy", "sun"),
        Category("Nostalgia", "disc"),
        Category("Acoustic", "guitar"),
        Category("Pop", "music"),
        Category("Rock", "flame")
    )

    /** Same query translation the web uses for its category search. */
    fun searchQuery(name: String): String = when (name) {
        "Acoustic" -> "Acoustic Songs Hits"
        "Chill" -> "Chill Vibes Lofi Songs"
        "Focus" -> "Focus Deep Work Music"
        "Commute" -> "Driving Roadtrip Music"
        "Gaming" -> "Gaming EDM Hype Songs"
        "Energize" -> "Energetic Workout Beats"
        "Party" -> "Party Dance Hits"
        "Feel good" -> "Feel Good Happy Songs"
        "Romance" -> "Romantic Love Songs"
        "Workout" -> "Gym Workout Motivation Music"
        "Sleep" -> "Sleeping Calming Relaxation Music"
        "Sad" -> "Sad Melancholic Songs"
        "Happy" -> "Upbeat Happy Songs"
        "Nostalgia" -> "2000s Hits Nostalgia Songs"
        else -> "$name Music"
    }
}
