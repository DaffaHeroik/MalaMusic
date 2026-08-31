package com.malamusic.app

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import com.malamusic.app.data.repository.MusicRepository

class MalaMusicApp : Application() {

    companion object {
        const val NOTIFICATION_CHANNEL_ID = "malamusic_playback"
        const val NOTIFICATION_CHANNEL_NAME = "Pemutaran Musik"
        lateinit var instance: MalaMusicApp
            private set
    }

    val repository by lazy { MusicRepository() }

    override fun onCreate() {
        super.onCreate()
        instance = this
        createNotificationChannel()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                NOTIFICATION_CHANNEL_NAME,
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Kontrol pemutaran musik"
                setShowBadge(false)
            }
            getSystemService(NotificationManager::class.java)
                .createNotificationChannel(channel)
        }
    }
}
