package com.malamusic.app.ui

import android.animation.ObjectAnimator
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.animation.OvershootInterpolator
import android.widget.*
import android.app.Activity
import com.malamusic.app.R

class SplashActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE or
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
        )
        window.statusBarColor = android.graphics.Color.parseColor("#050507")
        window.navigationBarColor = android.graphics.Color.parseColor("#050507")

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = android.view.Gravity.CENTER
            setBackgroundColor(android.graphics.Color.parseColor("#050507"))
        }

        // Logo
        val logoSize = dpToPx(120)
        val logo = LinearLayout(this).apply {
            gravity = android.view.Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(logoSize, logoSize)
            background = android.graphics.drawable.GradientDrawable().apply {
                shape = android.graphics.drawable.GradientDrawable.OVAL
                setColor(android.graphics.Color.parseColor("#CC000000"))
                setStroke(2, android.graphics.Color.parseColor("#4DFFFFFF"))
            }
        }

        val icon = TextView(this).apply {
            text = "♪"
            setTextColor(android.graphics.Color.parseColor("#F43F5E"))
            textSize = 48f
            gravity = android.view.Gravity.CENTER
        }
        logo.addView(icon)

        // Title
        val title = TextView(this).apply {
            text = "MalaMusic"
            setTextColor(android.graphics.Color.WHITE)
            textSize = 22f
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            setPadding(0, dpToPx(20), 0, 0)
            letterSpacing = 0.06f
        }

        // Subtitle
        val subtitle = TextView(this).apply {
            text = "MUSIK TANPA BATAS"
            setTextColor(android.graphics.Color.parseColor("#7C828C"))
            textSize = 10f
            letterSpacing = 0.15f
            setPadding(0, dpToPx(6), 0, 0)
        }

        root.addView(logo)
        root.addView(title)
        root.addView(subtitle)
        setContentView(root)

        // Animate
        logo.scaleX = 0.5f
        logo.scaleY = 0.5f
        logo.alpha = 0f

        ObjectAnimator.ofFloat(logo, "scaleX", 0.5f, 1f).apply {
            duration = 800
            interpolator = OvershootInterpolator(1.2f)
            start()
        }
        ObjectAnimator.ofFloat(logo, "scaleY", 0.5f, 1f).apply {
            duration = 800
            interpolator = OvershootInterpolator(1.2f)
            start()
        }
        ObjectAnimator.ofFloat(logo, "alpha", 0f, 1f).apply {
            duration = 600
            start()
        }

        title.alpha = 0f
        ObjectAnimator.ofFloat(title, "alpha", 0f, 1f).apply {
            duration = 600
            startDelay = 300
            start()
        }

        subtitle.alpha = 0f
        ObjectAnimator.ofFloat(subtitle, "alpha", 0f, 1f).apply {
            duration = 600
            startDelay = 500
            start()
        }

        Handler(Looper.getMainLooper()).postDelayed({
            startActivity(Intent(this, MainActivity::class.java))
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
            finish()
        }, 1800)
    }

    private fun dpToPx(dp: Int): Int {
        return (dp * resources.displayMetrics.density).toInt()
    }
}
