package com.malamusic.app.ui

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.webkit.*
import android.widget.ProgressBar
import android.app.Activity
import com.malamusic.app.MalaMusicApp
import com.malamusic.app.R
import com.malamusic.app.audio.MalaMediaService
import com.malamusic.app.audio.AudioBridge

class MainActivity : Activity() {

    companion object {
        const val BASE_URL = "https://music.malawalipayment.web.id"
        const val EXTRA_DEEP_LINK = "deep_link"
    }

    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar
    private val audioBridge by lazy { AudioBridge(this) }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Immersive fullscreen like Spotify
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE or
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
        )
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        // Create layout programmatically
        val root = android.widget.FrameLayout(this).apply {
            setBackgroundColor(Color.parseColor("#08090d"))
        }

        // WebView
        webView = WebView(this).apply {
            layoutParams = android.widget.FrameLayout.LayoutParams(
                android.widget.FrameLayout.LayoutParams.MATCH_PARENT,
                android.widget.FrameLayout.LayoutParams.MATCH_PARENT
            )
        }

        // Loading bar
        progressBar = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            layoutParams = android.widget.FrameLayout.LayoutParams(
                android.widget.FrameLayout.LayoutParams.MATCH_PARENT,
                dpToPx(3)
            ).apply {
                gravity = android.view.Gravity.TOP
            }
            max = 100
            visibility = View.GONE
            // Color the progress bar
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                progressDrawable = android.graphics.drawable.GradientDrawable().apply {
                    setSize(resources.displayMetrics.widthPixels, dpToPx(3))
                }
            }
        }

        root.addView(webView)
        root.addView(progressBar)
        setContentView(root)

        setupWebView()
        loadUrl(getStartUrl())
    }

    private fun getStartUrl(): String {
        val deepLink = intent?.data?.toString()
            ?: intent?.getStringExtra(EXTRA_DEEP_LINK)
        return if (deepLink != null) {
            // Pass deep link URL to web app
            val encoded = Uri.encode(deepLink.removePrefix(BASE_URL))
            "$BASE_URL$encoded"
        } else {
            // Mark as Android app (fix PWA detection)
            "$BASE_URL/?source=android-app&android=1"
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            mediaPlaybackRequiresUserGesture = false
            allowContentAccess = true
            allowFileAccess = true
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
            loadWithOverviewMode = true
            useWideViewPort = true
            cacheMode = WebSettings.LOAD_DEFAULT
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW

            // Identify as Android app to web server
            userAgentString = "$userAgentString MalaMusicAndroid/2.0"
        }

        // Cookies
        CookieManager.getInstance().apply {
            setAcceptCookie(true)
            setAcceptThirdPartyCookies(webView, true)
        }

        // Chrome client for console, permissions
        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                progressBar.progress = newProgress
                progressBar.visibility = if (newProgress < 100) View.VISIBLE else View.GONE
            }

            override fun onCreateWindow(
                view: WebView?, isDialog: Boolean,
                isUserGesture: Boolean, resultMsg: Message?
            ): Boolean {
                // Allow target="_blank" links
                val newWebView = WebView(this@MainActivity)
                newWebView.webViewClient = object : WebViewClient() {
                    override fun shouldOverrideUrlLoading(
                        view: WebView?, request: WebResourceRequest?
                    ): Boolean {
                        request?.url?.let { url ->
                            val intent = Intent(Intent.ACTION_VIEW, url)
                            startActivity(intent)
                        }
                        return true
                    }
                }
                val transport = resultMsg?.obj as? WebView.WebViewTransport
                transport?.webView = newWebView
                resultMsg?.sendToTarget()
                return true
            }
        }

        // WebView client for navigation
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(
                view: WebView?, request: WebResourceRequest?
            ): Boolean {
                val url = request?.url?.toString() ?: return false

                // Handle external URLs in browser
                if (!url.contains("music.malawalipayment.web.id")) {
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                    startActivity(intent)
                    return true
                }

                // Handle deep links
                if (url.contains("/play/") || url.contains("/album/") ||
                    url.contains("/artist/") || url.contains("/blend/")) {
                    return false // Let WebView handle it
                }

                return false
            }

            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                // Inject JS bridge after page loads
                view?.evaluateJavascript(BRIDGE_JS, null)
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                // Re-inject bridge
                view?.evaluateJavascript(BRIDGE_JS, null)
            }

            override fun onReceivedError(
                view: WebView?, request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                // Show offline state
                if (request?.isForMainFrame == true) {
                    view?.loadUrl("javascript:showToast('Koneksi internet terputus')")
                }
            }
        }

        // Inject bridge JS on every page
        webView.addJavascriptInterface(audioBridge, "MalaNativeBridge")
    }

    /**
     * JavaScript bridge injected into every page.
     * Bridges web audio events to Android MediaSession for notification controls.
     */
    private val BRIDGE_JS = """
        (function() {
            if (window._malaBridgeActive) return;
            window._malaBridgeActive = true;

            // Notify native app that this is running inside Android app
            window._isAndroidApp = true;
            window._isPwaInstalled = true;

            // Override PWA detection
            Object.defineProperty(window, 'isStandaloneApp', { get: function() { return true; } });
            if (window.localStorage) {
                try { localStorage.setItem('pwa_installed', 'true'); } catch(e) {}
            }

            var audio = document.getElementById('audio-player');
            if (!audio) {
                // Wait for audio element
                var check = setInterval(function() {
                    audio = document.getElementById('audio-player');
                    if (audio) { clearInterval(check); setupBridge(audio); }
                }, 500);
            } else {
                setupBridge(audio);
            }

            function setupBridge(audio) {
                // Forward audio events to native MediaSession
                audio.addEventListener('play', function() {
                    if (window.MalaNativeBridge) {
                        window.MalaNativeBridge.onPlay();
                    }
                });
                audio.addEventListener('pause', function() {
                    if (window.MalaNativeBridge) {
                        window.MalaNativeBridge.onPause();
                    }
                });
                audio.addEventListener('ended', function() {
                    if (window.MalaNativeBridge) {
                        window.MalaNativeBridge.onEnded();
                    }
                });
                audio.addEventListener('timeupdate', function() {
                    if (window.MalaNativeBridge && audio.duration) {
                        window.MalaNativeBridge.onProgress(
                            audio.currentTime,
                            audio.duration,
                            audio.paused
                        );
                    }
                });

                // Expose method for native to control web player
                window._malaNativePlay = function() { audio.play(); };
                window._malaNativePause = function() { audio.pause(); };
                window._malaNativeSeek = function(pos) { audio.currentTime = pos; };
                window._malaNativeNext = function() {
                    if (typeof PK === 'function') PK('next');
                };
                window._malaNativePrev = function() {
                    if (typeof PK === 'function') PK('prev');
                };

                // Get current track info from web state
                window._malaGetTrackInfo = function() {
                    try {
                        var s = window.S || {};
                        var ct = s.ct || {};
                        return JSON.stringify({
                            title: ct.title || 'Lagu',
                            artist: ct.artist || 'MalaMusic',
                            cover: ct.cover || '',
                            videoId: ct.videoId || ct.id || '',
                            duration: audio.duration || 0,
                            position: audio.currentTime || 0,
                            playing: !audio.paused
                        });
                    } catch(e) {
                        return JSON.stringify({title:'Lagu',artist:'MalaMusic'});
                    }
                };
            }
        })();
    """.trimIndent()

    override fun onResume() {
        super.onResume()
        webView.onResume()
        // Re-inject bridge
        webView.evaluateJavascript(BRIDGE_JS, null)
    }

    override fun onPause() {
        webView.onPause()
        super.onPause()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    private fun dpToPx(dp: Int): Int {
        return (dp * resources.displayMetrics.density).toInt()
    }
}
