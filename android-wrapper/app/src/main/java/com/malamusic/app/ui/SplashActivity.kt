package com.malamusic.app.ui

import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.animation.AccelerateDecelerateInterpolator
import android.view.animation.OvershootInterpolator
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import android.app.Activity
import com.malamusic.app.R

class SplashActivity : Activity() {

    private val SPLASH_DURATION = 1800L

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Fullscreen immersive
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE or
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
        )
        window.statusBarColor = android.graphics.Color.parseColor("#050507")
        window.navigationBarColor = android.graphics.Color.parseColor("#050507")

        // Create views programmatically (no XML dependency issues)
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = android.view.Gravity.CENTER
            setBackgroundColor(android.graphics.Color.parseColor("#050507"))
            setPadding(0, 0, 0, 0)
        }

        // Animated rings container
        val ringsContainer = View(this).apply {
            val size = dpToPx(200)
            layoutParams = LinearLayout.LayoutParams(size, size)
        }

        // Logo circle
        val logoSize = dpToPx(140)
        val logoWrap = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = android.view.Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(logoSize, logoSize).apply {
                gravity = android.view.Gravity.CENTER
            }
            // Draw circle background
            background = android.graphics.drawable.GradientDrawable().apply {
                shape = android.graphics.drawable.GradientDrawable.OVAL
                setColor(android.graphics.Color.parseColor("#CC000000"))
                setStroke(2, android.graphics.Color.parseColor("#4DFFFFFF"))
            }
        }

        // Try to load logo, fallback to text
        val logoView = ImageView(this).apply {
            val imgSize = dpToPx(100)
            layoutParams = LinearLayout.LayoutParams(imgSize, imgSize)
            scaleType = ImageView.ScaleType.CENTER_CROP
            try {
                setImageResource(R.mipmap.ic_launcher)
            } catch (_: Exception) { }
        }
        logoWrap.addView(logoView)

        // Title
        val titleView = TextView(this).apply {
            text = "MalaMusic"
            setTextColor(android.graphics.Color.WHITE)
            textSize = 22f
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            setPadding(0, dpToPx(20), 0, 0)
            letterSpacing = 0.06f
        }

        // Subtitle
        val subtitleView = TextView(this).apply {
            text = "MUSIK TANPA BATAS"
            setTextColor(android.graphics.Color.parseColor("#7C828C"))
            textSize = 10f
            letterSpacing = 0.15f
            setPadding(0, dpToPx(6), 0, 0)
        }

        // Loading bar background
        val barBg = View(this).apply {
            val w = dpToPx(120)
            val h = dpToPx(2)
            layoutParams = LinearLayout.LayoutParams(w, h).apply {
                topMargin = dpToPx(24)
            }
            background = android.graphics.drawable.GradientDrawable().apply {
                setColor(android.graphics.Color.parseColor("#26FFFFFF"))
                cornerRadius = dpToPx(1).toFloat()
            }
        }

        // Loading bar fill
        val barFill = View(this).apply {
            val w = dpToPx(48)
            val h = dpToPx(2)
            layoutParams = LinearLayout.LayoutParams(w, h)
            background = android.graphics.drawable.GradientDrawable().apply {
                colors = intArrayOf(
                    android.graphics.Color.TRANSPARENT,
                    android.graphics.Color.WHITE,
                    android.graphics.Color.TRANSPARENT
                )
                gradientType = android.graphics.drawable.GradientDrawable.LINEAR_GRADIENT
                orientation = android.graphics.drawable.GradientDrawable.Orientation.LEFT_RIGHT
                cornerRadius = dpToPx(1).toFloat()
            }
            alpha = 0.8f
        }

        barBg.addView(barFill)

        root.addView(ringsContainer)
        root.addView(logoWrap)
        root.addView(titleView)
        root.addView(subtitleView)
        root.addView(barBg)

        setContentView(root)

        // Animate entrance
        animateSplash(logoWrap, titleView, subtitleView, barFill, ringsContainer)
    }

    private fun animateSplash(
        logo: View,
        title: View,
        subtitle: View,
        bar: View,
        rings: View
    ) {
        // Logo scale-in
        logo.scaleX = 0.5f
        logo.scaleY = 0.5f
        logo.alpha = 0f

        val logoScaleX = ObjectAnimator.ofFloat(logo, "scaleX", 0.5f, 1f).apply {
            duration = 800
            interpolator = OvershootInterpolator(1.2f)
        }
        val logoScaleY = ObjectAnimator.ofFloat(logo, "scaleY", 0.5f, 1f).apply {
            duration = 800
            interpolator = OvershootInterpolator(1.2f)
        }
        val logoAlpha = ObjectAnimator.ofFloat(logo, "alpha", 0f, 1f).apply {
            duration = 600
        }

        // Title fade in
        title.alpha = 0f
        title.translationY = 20f
        val titleAlpha = ObjectAnimator.ofFloat(title, "alpha", 0f, 1f).apply {
            duration = 600
            startDelay = 300
        }
        val titleY = ObjectAnimator.ofFloat(title, "translationY", 20f, 0f).apply {
            duration = 600
            startDelay = 300
            interpolator = AccelerateDecelerateInterpolator()
        }

        // Subtitle fade in
        subtitle.alpha = 0f
        val subtitleAlpha = ObjectAnimator.ofFloat(subtitle, "alpha", 0f, 1f).apply {
            duration = 600
            startDelay = 500
        }

        // Bar animation - slide across
        bar.translationX = -dpToPx(48).toFloat()
        val barSlide = ObjectAnimator.ofFloat(bar, "translationX", -dpToPx(48).toFloat(), dpToPx(120).toFloat()).apply {
            duration = 1400
            startDelay = 700
            interpolator = AccelerateDecelerateInterpolator()
        }

        // Rings pulse animation
        rings.alpha = 0f
        val ringsAlpha = ObjectAnimator.ofFloat(rings, "alpha", 0f, 0.3f).apply {
            duration = 2000
            startDelay = 200
        }
        val ringsScale = ObjectAnimator.ofFloat(rings, "scaleX", 0.3f, 1.5f).apply {
            duration = 2000
            startDelay = 200
        }
        val ringsScaleY = ObjectAnimator.ofFloat(rings, "scaleY", 0.3f, 1.5f).apply {
            duration = 2000
            startDelay = 200
        }

        AnimatorSet().apply {
            playTogether(
                logoScaleX, logoScaleY, logoAlpha,
                titleAlpha, titleY,
                subtitleAlpha,
                barSlide,
                ringsAlpha, ringsScale, ringsScaleY
            )
            start()
        }

        // Navigate to main after delay
        Handler(Looper.getMainLooper()).postDelayed({
            startActivity(Intent(this, MainActivity::class.java))
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
            finish()
        }, SPLASH_DURATION)
    }

    private fun dpToPx(dp: Int): Int {
        return (dp * resources.displayMetrics.density).toInt()
    }
}
