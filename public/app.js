// PWA - INSTALL & OFFLINE MODE HANDLING
var deferredInstallPrompt=null;
var isStandaloneApp=(window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches)||window.navigator.standalone===true;
var isIOSDevice=/iPad|iPhone|iPod/.test(navigator.userAgent)&&!window.MSStream;

// Auto-fix PWA detection for users who have it installed but browser doesn't report standalone
if (isStandaloneApp) {
    try { localStorage.setItem('pwa_installed', 'true'); } catch(e){}
} else if (localStorage.getItem('pwa_installed') === 'true') {
    isStandaloneApp = true;
}

function showToast(msg) {
    var existing = document.getElementById('global-app-toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.id = 'global-app-toast';
    toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-[600] bg-zinc-900/95 text-white text-xs font-semibold px-4 py-2.5 rounded-full border border-white/15 shadow-2xl backdrop-blur-md flex items-center space-x-2 transition-all duration-300 transform -translate-y-4 opacity-0 pointer-events-none';
    toast.innerHTML = '<span>' + (typeof es === 'function' ? es(msg) : String(msg)) + '</span>';
    document.body.appendChild(toast);
    setTimeout(function(){
        toast.classList.remove('-translate-y-4', 'opacity-0', 'pointer-events-none');
        toast.classList.add('translate-y-0', 'opacity-100');
    }, 10);
    setTimeout(function(){
        if(toast && toast.parentElement) {
            toast.classList.remove('translate-y-0', 'opacity-100');
            toast.classList.add('-translate-y-4', 'opacity-0', 'pointer-events-none');
            setTimeout(function(){ if(toast.parentElement) toast.remove(); }, 300);
        }
    }, 3200);
}

function updateOnlineOfflineStatus() {
    var banner = document.getElementById('pwa-offline-banner');
    if (!navigator.onLine) {
        if (banner) banner.classList.remove('hidden');
        showToast('Mode Offline PWA Aktif — Memutar lagu & lirik tersimpan');
    } else {
        if (banner) banner.classList.add('hidden');
    }
}

async function clearOfflineDownloads() {
    var songs = typeof getOfflineSongs === 'function' ? getOfflineSongs() : [];
    for (var i = 0; i < songs.length; i++) { if (typeof removeOfflineAudioBinary === 'function') await removeOfflineAudioBinary(songs[i].videoId || songs[i].id); }
    if (typeof writeJsonArray === 'function') writeJsonArray('pwa_offline_tracks', []); else localStorage.removeItem('pwa_offline_tracks');
    try { localStorage.removeItem(OFFLINE_PLAYLISTS_KEY); } catch (_) {}
    if (typeof audioUrlCache !== 'undefined') audioUrlCache = {};
    showToast('Semua download offline dihapus');
    if (typeof OfflineView !== 'undefined') OfflineView.render();
}
function clearPwaCache() {
    if ('caches' in window) {
        caches.keys().then(function(names) {
            names.forEach(function(name) {
                // Keep downloaded audio intact. Full removal is handled explicitly
                // by clearOfflineDownloads() so a routine cache cleanup cannot
                // make saved songs appear unavailable offline.
                if (name !== OFFLINE_AUDIO_CACHE) caches.delete(name);
            });
        });
    }
    localStorage.removeItem('pwa_lyrics_cache');
    localStorage.removeItem('pwa_audio_cache');
    if (typeof lyricsCache !== 'undefined') lyricsCache = {};
    if (typeof audioUrlCache !== 'undefined') audioUrlCache = {};
    showToast('Cache offline PWA berhasil dibersihkan');
    if (typeof Profile !== 'undefined' && Profile.render) Profile.render();
}

window.addEventListener('online', function() {
    updateOnlineOfflineStatus();
    showToast('Koneksi internet terhubung kembali (Online)');
});
window.addEventListener('offline', function() {
    updateOnlineOfflineStatus();
});
document.addEventListener('DOMContentLoaded', function(){ updateOnlineOfflineStatus(); refreshPwaInstallButton(); });

function refreshPwaInstallButton(){
    var btn=document.getElementById('pwa-install-btn');
    if(!btn) return;
    var installed = isPwaInstalled();
    btn.classList.toggle('hidden', installed);
    btn.setAttribute('aria-label', installed ? 'MalaMusic sudah terpasang' : 'Install MalaMusic sebagai aplikasi');
}
window.addEventListener('beforeinstallprompt',function(e){
    e.preventDefault();
    deferredInstallPrompt=e;
    refreshPwaInstallButton();
});
window.addEventListener('appinstalled',function(){
    deferredInstallPrompt=null;
    try { localStorage.setItem('pwa_installed', 'true'); } catch(e){}
    isStandaloneApp = true;
    refreshPwaInstallButton();
    showToast('MalaMusic berhasil diinstall!');
});

function isPwaInstalled() {
    return isStandaloneApp || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true || localStorage.getItem('pwa_installed') === 'true';
}

function showPwaRequiredModal() {
    var existing = document.getElementById('pwa-required-modal');
    if (existing) existing.remove();

    var modal = document.createElement('div');
    modal.id = 'pwa-required-modal';
    modal.className = 'fixed inset-0 z-[700] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in';
    modal.onclick = function(e){ if(e.target === modal) modal.remove(); };
    modal.innerHTML = '<div class="bg-[#121318] border border-white/15 rounded-2xl p-5 max-w-xs w-full text-center space-y-3 shadow-2xl relative" onclick="event.stopPropagation()">'+
        '<div class="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 text-white flex items-center justify-center mx-auto shadow-md">'+
            '<i data-lucide="smartphone" class="w-6 h-6 text-white"></i>'+
        '</div>'+
        '<div class="space-y-1">'+
            '<h3 class="text-white font-bold text-sm">Install Aplikasi Terlebih Dahulu</h3>'+
            '<p class="text-white/60 text-xs leading-relaxed">'+
                'Fitur Mode Offline khusus untuk aplikasi PWA. Silakan install MalaMusic ke layar utama terlebih dahulu.'+
            '</p>'+
        '</div>'+
        '<div class="space-y-2 pt-1">'+
            '<button onclick="document.getElementById(\'pwa-required-modal\').remove(); installPWA();" class="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-gray-200 text-black font-bold text-xs shadow-md active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer">'+
                '<i data-lucide="download" class="w-4 h-4"></i>'+
                '<span>Install Aplikasi</span>'+
            '</button>'+
            '<button onclick="document.getElementById(\'pwa-required-modal\').remove();" class="w-full py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-semibold text-xs active:scale-95 transition cursor-pointer">'+
                'Tutup'+
            '</button>'+
        '</div>'+
    '</div>';
    document.body.appendChild(modal);
    if (window.lucide) lucide.createIcons();
}

function installPWA(){
    if(deferredInstallPrompt){
        deferredInstallPrompt.prompt();
        deferredInstallPrompt.userChoice.then(function(choice){
            if(choice.outcome==='accepted') {
                try { localStorage.setItem('pwa_installed', 'true'); } catch(e){}
                isStandaloneApp = true;
                showToast('Menginstall MalaMusic...');
            }
            deferredInstallPrompt=null;
            refreshPwaInstallButton();
        });
    }else if(isIOSDevice){
        showToast('Tap ikon Bagikan lalu pilih "Add to Home Screen"');
    }else{
        showToast('Petunjuk: Buka menu browser lalu pilih "Tambah ke Layar Utama" / "Install Aplikasi"');
    }
}

// Offline PWA Storage Helper
var PWA_STORAGE_SCHEMA_VERSION = 2;
function isPwaArrayKey(key) {
    return key === 'pwa_offline_tracks';
}
function sanitizeStorageArray(value) {
    return Array.isArray(value) ? value.filter(function(item){ return item && typeof item === 'object'; }) : [];
}
function readJsonArray(key) {
    try {
        var parsed = JSON.parse(localStorage.getItem(key) || '[]');
        var isVersioned = parsed && parsed.version === PWA_STORAGE_SCHEMA_VERSION && Array.isArray(parsed.items);
        var safe = sanitizeStorageArray(isVersioned ? parsed.items : parsed);
        if (isPwaArrayKey(key) && !isVersioned) {
            try { localStorage.setItem(key, JSON.stringify({ version: PWA_STORAGE_SCHEMA_VERSION, updatedAt: Date.now(), items: safe })); } catch (__) {}
        }
        return safe;
    } catch (_) {
        try { localStorage.removeItem(key); } catch (__) {}
        return [];
    }
}
function writeJsonArray(key, value) {
    var safe = sanitizeStorageArray(value);
    var payload = isPwaArrayKey(key)
        ? { version: PWA_STORAGE_SCHEMA_VERSION, updatedAt: Date.now(), items: safe }
        : safe;
    try { localStorage.setItem(key, JSON.stringify(payload)); return true; }
    catch (_) {
        if (isPwaArrayKey(key) && safe.length > 20) {
            try {
                payload.items = safe.slice(0, 20);
                localStorage.setItem(key, JSON.stringify(payload));
                return true;
            } catch (__) {}
        }
        if (typeof showToast === 'function') showToast('Penyimpanan perangkat penuh. Hapus beberapa data offline.');
        return false;
    }
}
function getOfflineSongs() {
    return readJsonArray('pwa_offline_tracks').filter(function(song){ return !!(song.videoId || song.id); });
}

// Cache Storage is the source of truth for offline readiness. Metadata can survive
// an interrupted download, browser restore, or an old deployment while the binary
// is gone; reconcile both states after startup without blocking the first render.
async function reconcileOfflineAudioState() {
    if (!window.caches) return;
    var list = getOfflineSongs();
    if (!list.length) return;
    var changed = false;
    for (var i = 0; i < list.length; i++) {
        var song = list[i];
        var vid = song.videoId || song.id;
        var valid = false;
        try { valid = await validateOfflineAudioBinary(vid); } catch (_) { valid = false; }
        var nextStatus = valid ? 'ready' : 'partial';
        if (song.offlineStatus !== nextStatus) { song.offlineStatus = nextStatus; changed = true; }
    }
    if (changed) {
        writeJsonArray('pwa_offline_tracks', list);
        var playlists = getOfflinePlaylists();
        playlists.forEach(function(p){
            var ready = (p.songIds || []).filter(function(id){ return list.some(function(s){ return (s.videoId || s.id) === id && s.offlineStatus === 'ready'; }); }).length;
            var next = ready === (p.songIds || []).length && (p.songIds || []).length > 0 ? 'ready' : 'partial';
            if (p.status !== next) p.status = next;
        });
        saveOfflinePlaylists(playlists);
        if (typeof OfflineView !== 'undefined' && typeof S !== 'undefined' && S.at === 'offline') OfflineView.render();
    }
    if (typeof updateOfflineButtons === 'function') updateOfflineButtons();
}
var OFFLINE_PLAYLISTS_KEY = 'pwa_offline_playlists';
function getOfflinePlaylists() {
    try {
        var parsed = JSON.parse(localStorage.getItem(OFFLINE_PLAYLISTS_KEY) || '[]');
        return Array.isArray(parsed) ? parsed.filter(function(item){ return item && item.id && Array.isArray(item.songIds); }) : [];
    } catch (_) { return []; }
}
function saveOfflinePlaylists(items) {
    try { localStorage.setItem(OFFLINE_PLAYLISTS_KEY, JSON.stringify(items)); return true; }
    catch (_) { if (typeof showToast === 'function') showToast('Metadata playlist offline tidak dapat disimpan.'); return false; }
}
function upsertOfflinePlaylist(playlist, status) {
    if (!playlist || !playlist.id) return;
    var items = getOfflinePlaylists().filter(function(item){ return item.id !== playlist.id; });
    items.unshift({
        id: String(playlist.id),
        name: playlist.name || 'Playlist Offline',
        image: playlist.image || '',
        source: playlist.source || 'local',
        songIds: (playlist.songs || []).map(function(song){ return song && (song.videoId || song.id); }).filter(Boolean),
        status: status || 'partial',
        updatedAt: Date.now()
    });
    saveOfflinePlaylists(items.slice(0, 50));
}
function markOfflineSongPlaylist(song, options, list) {
    if (!song || !options || !options.playlistId || !Array.isArray(list)) return;
    song.offlinePlaylistId = String(options.playlistId);
    song.offlinePlaylistName = options.playlistName || '';
    song.offlinePlaylistSource = options.playlistSource || 'local';
}

var OFFLINE_AUDIO_CACHE = 'malamusic-offline-audio-v1';
var offlineDownloadControl = null;
var offlineTrackActiveIds = Object.create(null);
function waitForOfflineResume(){ return new Promise(function(resolve){ var timer = setInterval(function(){ if (!offlineDownloadControl || !offlineDownloadControl.paused || offlineDownloadControl.stopped){ clearInterval(timer); resolve(); } }, 150); }); }
function offlineAudioPath(vid){ return '/offline-audio/' + encodeURIComponent(String(vid)); }
function isLikelyAudioBinary(buffer, contentType) {
    if (!buffer || buffer.byteLength < 65536) return false;
    var type = String(contentType || '').toLowerCase();
    if (type && !/^audio\//.test(type) && !/^(application\/octet-stream|binary\/octet-stream)/.test(type)) return false;
    var bytes = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 16));
    var ascii = String.fromCharCode.apply(null, bytes);
    // Accept the formats returned by the configured audio resolvers.
    return ascii.indexOf('ID3') === 0 || ascii.indexOf('OggS') === 0 || ascii.indexOf('RIFF') === 0 || ascii.indexOf('ftyp') >= 4 || ((bytes[0] === 0xff) && ((bytes[1] & 0xe0) === 0xe0));
}
async function validateOfflineAudioBinary(vid) {
    if (!window.caches || !vid) return false;
    try {
        var cached = await caches.match(offlineAudioPath(vid));
        if (!cached || !cached.ok) return false;
        var buffer = await cached.arrayBuffer();
        var valid = isLikelyAudioBinary(buffer, cached.headers.get('content-type'));
        if (!valid) await removeOfflineAudioBinary(vid);
        return valid;
    } catch (_) {
        try { await removeOfflineAudioBinary(vid); } catch (__) {}
        return false;
    }
}
async function cacheOfflineAudioBinary(vid, rawUrl, onProgress){
    if (!window.caches || !rawUrl) return false;
    try {
        var response = await fetch('/api/proxy-audio?url=' + encodeURIComponent(rawUrl), { cache: 'no-store', signal: offlineDownloadControl && offlineDownloadControl.controller ? offlineDownloadControl.controller.signal : undefined });
        if (!response.ok || !response.body) return false;
        var total = Number(response.headers.get('content-length') || 0);
        var reader = response.body.getReader();
        var chunks = [], received = 0;
        while (true) {
            var part = await reader.read();
            if (part.done) break;
            if (part.value) {
                chunks.push(part.value);
                received += part.value.byteLength;
                if (typeof onProgress === 'function') onProgress(total > 0 ? Math.min(99, Math.round(received / total * 100)) : 0, 'mengunduh', received, total);
            }
        }
        var buffer = new Uint8Array(received);
        var offset = 0;
        chunks.forEach(function(chunk){ buffer.set(chunk, offset); offset += chunk.byteLength; });
        var contentType = response.headers.get('content-type') || 'audio/mpeg';
        if (!isLikelyAudioBinary(buffer.buffer, contentType)) return false;
        var cache = await caches.open(OFFLINE_AUDIO_CACHE);
        await cache.put(offlineAudioPath(vid), new Response(buffer.buffer, { status: 200, headers: { 'Content-Type': contentType, 'Content-Length': String(buffer.byteLength), 'Accept-Ranges': 'bytes' } }));
        if (typeof onProgress === 'function') onProgress(100, 'memvalidasi', received, total || received);
        return await validateOfflineAudioBinary(vid);
    } catch (_) { return false; }
}
async function hasOfflineAudioBinary(vid){
    return validateOfflineAudioBinary(vid);
}
async function removeOfflineAudioBinary(vid){
    if (!window.caches) return;
    try { var cache = await caches.open(OFFLINE_AUDIO_CACHE); await cache.delete(offlineAudioPath(vid)); } catch (_) {}
}
function isOfflineSong(track) {
    if (!track) return false;
    var vid = track.videoId || track.id;
    var list = getOfflineSongs();
    return list.some(function(s) { return (s.videoId === vid || s.id === vid); });
}

async function saveTrackForOffline(track, options) {
    options = options || {};
    // Offline downloads must work in a normal browser as well as the installed PWA.
    // The service worker and Cache Storage are available for both contexts; requiring
    // standalone mode here made the visible Download action appear broken on Android/desktop.
    if (!track) return false;
    var vid = track.videoId || track.id;
    if (!vid) return;
    if (offlineTrackActiveIds[vid]) {
        if (typeof options.onProgress === 'function') options.onProgress({ status: 'duplicate', track: track });
        return false;
    }
    offlineTrackActiveIds[vid] = true;

    var list = getOfflineSongs();
    var existingIndex = list.findIndex(function(s) { return (s.videoId === vid || s.id === vid); });

    var songObj;
    if (existingIndex !== -1) {
        if (options.keepExisting) {
            songObj = list[existingIndex];
            if (await validateOfflineAudioBinary(vid)) {
                songObj.offlineStatus = 'ready';
                markOfflineSongPlaylist(songObj, options, list);
                writeJsonArray('pwa_offline_tracks', list);
                if (typeof options.onProgress === 'function') options.onProgress({ status: 'already', track: songObj });
                delete offlineTrackActiveIds[vid];
                return true;
            }
            // A stale/corrupt cache entry must never block a fresh download.
            await removeOfflineAudioBinary(vid);
        } else {
            // Remove from offline
            list.splice(existingIndex, 1);
        writeJsonArray('pwa_offline_tracks', list);
        await removeOfflineAudioBinary(vid);
            showToast('Lagu dihapus dari Mode Offline PWA');
            updateOfflineButtons();
            if (typeof OfflineView !== 'undefined' && typeof S !== 'undefined' && S.at === 'offline') OfflineView.render();
            delete offlineTrackActiveIds[vid];
            return false;
        }
    }

    if (!songObj) {
        if (!options.silent) showToast('Menyimpan lagu ke Mode Offline PWA...');

        // 1. Add track metadata to list
        songObj = {
        id: vid,
        videoId: vid,
        title: track.title || 'Lagu',
        artist: track.artist || 'Unknown Artist',
        cover: track.cover || (typeof toHDCover==='function'?toHDCover('', vid):''),
        artistId: track.artistId || '',
        ytUrl: track.ytUrl || ('https://youtube.com/watch?v=' + vid),
        savedAt: Date.now(),
        offlinePlaylistId: options.playlistId || '',
            offlinePlaylistName: options.playlistName || '',
            offlineStatus: 'pending'
        };
        list.unshift(songObj);
    }
    writeJsonArray('pwa_offline_tracks', list);

    // 2. Pre-fetch & cache Audio URL
    var lastProgressWrite = 0;
    function reportDownloadProgress(percent, stage, received, total) {
        songObj.downloadProgress = Math.max(0, Math.min(100, Number(percent) || 0));
        songObj.downloadStage = stage || 'menyiapkan';
        songObj.downloadBytes = Number(received || 0);
        songObj.downloadTotalBytes = Number(total || 0);
        songObj.downloadUpdatedAt = Date.now();
        var now = Date.now();
        if (now - lastProgressWrite >= 250 || songObj.downloadProgress >= 100) {
            lastProgressWrite = now;
            writeJsonArray('pwa_offline_tracks', list);
            if (typeof options.onProgress === 'function') options.onProgress({ status: 'progress', track: songObj });
            if (typeof OfflineView !== 'undefined' && typeof S !== 'undefined' && S.at === 'offline') OfflineView.render();
        }
    }
    reportDownloadProgress(1, 'menyiapkan', 0, 0);
    var binarySaved = false;
    var attempts = 0;
    var maxAttempts = 3;
    while (!binarySaved && attempts < maxAttempts) {
        attempts++;
        try {
            // Always obtain a fresh resolver URL on retries; resolver URLs can expire or return corrupt data.
            var rawAudioUrl = '';
            var ytUrl = track.ytUrl || ('https://youtube.com/watch?v=' + vid);
            reportDownloadProgress(Math.min(10, 2 + attempts * 2), 'mencari audio', 0, 0);
            var r = await fetch(API.ytplay, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: ytUrl }),
                cache: 'no-store'
            });
            if (!r.ok) throw new Error('resolver_http_' + r.status);
            var d = await r.json();
            rawAudioUrl = d && d.result && d.result.download && d.result.download.audio || '';
            if (!rawAudioUrl) throw new Error('resolver_empty');
            reportDownloadProgress(10, 'menyiapkan stream audio', 0, 0);
            if (typeof audioUrlCache !== 'undefined') audioUrlCache[vid] = rawAudioUrl;
            if (typeof savePwaCaches === 'function') savePwaCaches();
            await removeOfflineAudioBinary(vid);
            binarySaved = await cacheOfflineAudioBinary(vid, rawAudioUrl, function(percent, stage, received, total){
                reportDownloadProgress(10 + Math.round(Number(percent || 0) * 0.88), stage, received, total);
            });
        } catch(e) {
            binarySaved = false;
            if (offlineDownloadControl && offlineDownloadControl.stopped) break;
            if (offlineDownloadControl && offlineDownloadControl.paused && !offlineDownloadControl.stopped) {
                attempts--;
                reportDownloadProgress(Number(songObj.downloadProgress || 0), 'dijeda', songObj.downloadBytes, songObj.downloadTotalBytes);
                await waitForOfflineResume();
                if (offlineDownloadControl && offlineDownloadControl.stopped) break;
            }
        }
        if (offlineDownloadControl && offlineDownloadControl.stopped) break;
        if (!binarySaved && attempts < maxAttempts && !(offlineDownloadControl && offlineDownloadControl.paused)) {
            await new Promise(function(resolve){ setTimeout(resolve, 500 * Math.pow(2, attempts - 1)); });
        }
    }
    var wasStopped = !!(offlineDownloadControl && offlineDownloadControl.stopped);
    songObj.offlineStatus = binarySaved ? 'ready' : 'partial';
    songObj.downloadProgress = binarySaved ? 100 : Math.min(99, Number(songObj.downloadProgress || 0));
    songObj.downloadStage = binarySaved ? 'siap diputar' : (wasStopped ? 'dihentikan' : 'gagal — tekan untuk ulang');
    songObj.downloadError = binarySaved ? '' : (wasStopped ? 'Download dihentikan pengguna' : 'Audio belum tervalidasi');
    songObj.downloadUpdatedAt = Date.now();
    if (!binarySaved && !wasStopped && typeof showToast === 'function') showToast('Download gagal setelah ' + attempts + ' percobaan. Coba lagi saat jaringan stabil.');

    // 3. Pre-fetch & cache Lyrics. Do not start unrelated work after Stop.
    if (offlineDownloadControl && offlineDownloadControl.stopped) {
        delete offlineTrackActiveIds[vid];
        return false;
    }
    try {
        var cachedLyric = (typeof lyricsCache !== 'undefined' && lyricsCache[vid]) ? lyricsCache[vid] : null;
        if (!cachedLyric && typeof S !== 'undefined' && S.ld && S.ld.vid === vid && S.ld.lines && S.ld.lines.length > 0) {
            cachedLyric = S.ld;
        }

        if (!cachedLyric) {
            var tParam = (songObj && songObj.title) ? '&title=' + encodeURIComponent(songObj.title) : '';
            var aParam = (songObj && songObj.artist) ? '&artist=' + encodeURIComponent(songObj.artist) : '';
            var lr = await fetch(API.lyrics + '?id=' + vid + tParam + aParam);
            var ld = await lr.json();
            if (ld && ld.status && ld.result && ld.result.lyrics) {
                cachedLyric = {
                    vid: vid,
                    type: ld.result.lyrics.type || 'none',
                    lines: ld.result.lyrics.lines || []
                };
            }
        }

        if (cachedLyric) {
            if (typeof lyricsCache !== 'undefined') {
                lyricsCache[vid] = cachedLyric;
            }
            songObj.lyrics = cachedLyric;
            if (typeof savePwaCaches === 'function') savePwaCaches();
            writeJsonArray('pwa_offline_tracks', list);
        }
    } catch(e) {}

    markOfflineSongPlaylist(songObj, options, list);
    writeJsonArray('pwa_offline_tracks', list);
    if (typeof options.onProgress === 'function') options.onProgress({ status: binarySaved ? 'saved' : 'partial', track: songObj });
    if (!options.silent) showToast(binarySaved ? 'Lagu "' + track.title + '" tersimpan untuk Mode Offline!' : 'Metadata tersimpan, tetapi audio offline belum lengkap.');
    updateOfflineButtons();
    if (typeof OfflineView !== 'undefined' && typeof S !== 'undefined' && S.at === 'offline') OfflineView.render();
    delete offlineTrackActiveIds[vid];
    return binarySaved;
}
var offlinePlaylistJob = null;
var OFFLINE_DOWNLOAD_JOB_KEY = 'pwa_offline_download_job';
function getOfflineDownloadJob(){ try { var j = JSON.parse(localStorage.getItem(OFFLINE_DOWNLOAD_JOB_KEY) || 'null'); return j && j.status === 'running' ? j : null; } catch (_) { return null; } }
function persistOfflineDownloadJob(job){ try { localStorage.setItem(OFFLINE_DOWNLOAD_JOB_KEY, JSON.stringify(job)); } catch (_) {} }
function clearOfflineDownloadJob(){ try { localStorage.removeItem(OFFLINE_DOWNLOAD_JOB_KEY); } catch (_) {} }
function renderOfflineDownloadStatus(job){
    var el = gid('offline-download-status');
    if (!job || job.status !== 'running') { if (el) el.remove(); return; }
    if (!el) { el = document.createElement('button'); el.id = 'offline-download-status'; el.className = 'fixed right-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] sm:bottom-5 z-[460] rounded-2xl border border-cyan-300/30 bg-[#111820]/95 px-3 py-2 text-left text-xs text-white shadow-2xl backdrop-blur-md'; document.body.appendChild(el); }
    var done = Number(job.done || 0), total = Math.max(1, Number(job.total || 1)), pct = Math.round(done / total * 100), current = Number(job.currentPercent || 0);
    var paused = !!job.paused;
    var currentText = job.currentTitle ? '<br><span class="text-white/45 truncate inline-block max-w-[220px]">' + es(job.currentTitle) + ' • ' + current + '%</span>' : '';
    el.innerHTML = '<span class="flex items-center gap-2"><i data-lucide="' + (paused ? 'pause-circle' : 'download-cloud') + '" class="w-4 h-4 ' + (paused ? 'text-amber-300' : 'text-cyan-300') + '"></i><span><b class="' + (paused ? 'text-amber-200' : 'text-cyan-200') + '">' + (paused ? 'Download dijeda' : 'Download berjalan') + '</b><br><span class="text-white/60">Playlist ' + done + '/' + total + ' • ' + pct + '%</span>' + currentText + '</span></span>';
    el.title = 'Lihat status download playlist';
    el.onclick = function(){ var modal = gid('offline-playlist-progress'); if (modal) modal.classList.remove('hidden'); };
    if (window.lucide) lucide.createIcons();
}

function downloadPlaylistOffline(playlistId) {
    var playlists = typeof getUserPlaylists === 'function' ? getUserPlaylists() : [];
    var playlist = playlists.find(function(p) { return p.id === playlistId; });
    return downloadOfflinePlaylistItems(playlist);
}
function downloadExternalPlaylistOffline(playlistId) {
    var songs = (typeof S !== 'undefined' && Array.isArray(S['album_' + playlistId])) ? S['album_' + playlistId].map(normalizeTrack).filter(function(song){ return song.videoId || song.id; }) : [];
    var info = typeof Album !== 'undefined' ? (Album.currentAlbumInfo || {}) : {};
    return downloadOfflinePlaylistItems({
        id: 'youtube:' + String(playlistId),
        name: info.title || 'Playlist YouTube',
        image: info.cover || '',
        creator: info.creator || info.artist || '',
        source: 'youtube',
        songs: songs
    });
}
function downloadPublicPlaylistOffline(playlistId) {
    var info = window.__publicPlaylistInfo;
    if (!info || String(info.id) !== String(playlistId)) {
        showToast('Playlist publik belum siap diunduh');
        return Promise.resolve(false);
    }
    return downloadOfflinePlaylistItems({
        id: 'public:' + String(playlistId),
        name: info.name || 'Playlist Publik',
        image: info.image || '',
        creator: info.creator || '',
        source: 'public',
        songs: Array.isArray(info.songs) ? info.songs : []
    });
}
function downloadOfflinePlaylistItems(playlist) {
    // Binary playlist downloads work in normal browsers and installed PWAs.
    if (!playlist || !Array.isArray(playlist.songs) || !playlist.songs.length) { showToast('Playlist belum memiliki lagu'); return Promise.resolve(false); }
    if (offlinePlaylistJob) { showToast('Download playlist sedang berjalan'); return Promise.resolve(false); }
    offlineDownloadControl = { paused: false, stopped: false, controller: null };

    var modal = document.createElement('div');
    modal.id = 'offline-playlist-progress';
    modal.className = 'fixed inset-0 z-[450] flex items-end sm:items-center justify-end bg-transparent px-3 sm:px-4 pb-[5.5rem] sm:pb-5 pointer-events-none';
    modal.innerHTML = '<div class="pointer-events-auto w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-[#15151b] border border-white/10 shadow-2xl p-5"><div class="flex items-start gap-3 mb-4"><div class="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-300 flex items-center justify-center"><i data-lucide="download-cloud" class="w-5 h-5"></i></div><div class="min-w-0"><h3 class="font-black text-white text-lg">Download Playlist</h3><p class="text-xs text-white/50 truncate">' + es(playlist.name) + '</p></div></div><div class="h-2 rounded-full bg-white/10 overflow-hidden"><div id="offline-playlist-progress-bar" class="h-full rounded-full bg-cyan-400 transition-all" style="width:0%"></div></div><div class="flex justify-between mt-2 text-xs text-white/60"><span id="offline-playlist-progress-text">Menyiapkan...</span><span id="offline-playlist-progress-count">0/' + playlist.songs.length + '</span></div><p id="offline-playlist-progress-detail" class="text-xs text-white/40 mt-3 min-h-4"></p><div class="pointer-events-auto flex gap-2 mt-4"><button id="offline-playlist-pause" class="flex-1 rounded-xl bg-amber-400/15 border border-amber-300/20 text-amber-100 py-3 text-xs font-bold">Jeda</button><button id="offline-playlist-cancel" class="flex-1 rounded-xl bg-rose-400/15 border border-rose-300/20 text-rose-100 py-3 text-xs font-bold">Stop</button><button id="offline-playlist-minimize" class="flex-1 rounded-xl bg-cyan-500/15 border border-cyan-400/20 text-cyan-100 py-3 text-xs font-bold">Sembunyikan</button></div></div>';
    document.body.appendChild(modal); lucide.createIcons();
    offlinePlaylistJob = { status: 'running', cancelled: false, total: playlist.songs.length, done: 0, failed: 0, saved: 0, already: 0, currentTitle: '', currentPercent: 0 };
    var job = offlinePlaylistJob;
    persistOfflineDownloadJob({ status: 'running', playlist: { id: playlist.id, name: playlist.name, image: playlist.image || '', source: playlist.source || 'local', songs: playlist.songs }, total: job.total, done: 0, failed: 0, saved: 0, already: 0, currentTitle: '', currentPercent: 0 });
    upsertOfflinePlaylist(playlist, 'partial');
    renderOfflineDownloadStatus(job);
    var bar = modal.querySelector('#offline-playlist-progress-bar');
    var text = modal.querySelector('#offline-playlist-progress-text');
    var count = modal.querySelector('#offline-playlist-progress-count');
    var detail = modal.querySelector('#offline-playlist-progress-detail');
    modal.querySelector('#offline-playlist-pause').onclick = function() { if (!offlineDownloadControl) return; offlineDownloadControl.paused = !offlineDownloadControl.paused; job.paused = offlineDownloadControl.paused; if (offlineDownloadControl.paused) { if (offlineDownloadControl.controller) offlineDownloadControl.controller.abort(); this.textContent = 'Lanjutkan'; detail.textContent = 'Download dijeda'; } else { this.textContent = 'Jeda'; detail.textContent = 'Melanjutkan download...'; } persistOfflineDownloadJob({ status: 'running', playlist: { id: playlist.id, name: playlist.name, image: playlist.image || '', source: playlist.source || 'local', songs: playlist.songs }, total: job.total, done: job.done, failed: job.failed, saved: job.saved, already: job.already, currentTitle: job.currentTitle, currentPercent: job.currentPercent, paused: job.paused }); renderOfflineDownloadStatus(job); };
    modal.querySelector('#offline-playlist-cancel').onclick = function() { job.cancelled = true; if (offlineDownloadControl) { offlineDownloadControl.stopped = true; offlineDownloadControl.paused = false; if (offlineDownloadControl.controller) offlineDownloadControl.controller.abort(); } this.disabled = true; this.textContent = 'Menghentikan...'; };
    modal.querySelector('#offline-playlist-minimize').onclick = function() { modal.classList.add('hidden'); };

    return (async function() {
        var done = 0, failed = 0, already = 0, saved = 0;
        for (var i = 0; i < playlist.songs.length; i++) {
            if (job.cancelled) break;
            while (offlineDownloadControl && offlineDownloadControl.paused && !offlineDownloadControl.stopped) await waitForOfflineResume();
            if (offlineDownloadControl && offlineDownloadControl.stopped) break;
            var track = playlist.songs[i];
            job.currentTitle = track.title || 'Lagu';
            job.currentPercent = 0;
            job.paused = false;
            text.textContent = 'Selesai ' + done + ' dari ' + playlist.songs.length + ' • 0%';
            detail.textContent = 'Lagu ' + (i + 1) + '/' + playlist.songs.length + ': ' + (track.title || 'Lagu');
            try {
                var vid = track.videoId || track.id;
                if (offlineDownloadControl) offlineDownloadControl.controller = new AbortController();
                var before = getOfflineSongs().some(function(s) { return s.videoId === vid || s.id === vid; });
                var result = await saveTrackForOffline(track, { keepExisting: true, silent: true, playlistId: playlist.id, playlistName: playlist.name, onProgress: function(event){
                    var progress = event && event.track ? Number(event.track.downloadProgress || 0) : 0;
                    job.currentPercent = progress;
                    job.paused = !!(offlineDownloadControl && offlineDownloadControl.paused);
                    text.textContent = 'Selesai ' + done + ' dari ' + playlist.songs.length + ' • ' + progress + '%';
                    detail.textContent = 'Lagu ' + (i + 1) + '/' + playlist.songs.length + ': ' + (track.title || 'Lagu') + ' • ' + (event.track.downloadStage || 'memproses');
                    renderOfflineDownloadStatus(job);
                } });
                var hasAudio = await hasOfflineAudioBinary(vid);
                if (before && hasAudio) already++; else if (result && hasAudio) saved++; else failed++;
            } catch (e) { failed++; }
            done++;
            job.currentPercent = 100;
            bar.style.width = Math.round((done / playlist.songs.length) * 100) + '%';
            count.textContent = done + '/' + playlist.songs.length;
            job.done = done; job.failed = failed; job.saved = saved; job.already = already;
            persistOfflineDownloadJob({ status: 'running', playlist: { id: playlist.id, name: playlist.name, image: playlist.image || '', source: playlist.source || 'local', songs: playlist.songs                 }, total: job.total, done: done, failed: failed, saved: saved, already: already, currentTitle: job.currentTitle, currentPercent: job.currentPercent, paused: job.paused });
            renderOfflineDownloadStatus(job);
            upsertOfflinePlaylist(playlist, 'partial');
            if (typeof OfflineView !== 'undefined' && typeof S !== 'undefined' && S.at === 'offline') OfflineView.render();
        }
        offlinePlaylistJob = null;
        if (offlineDownloadControl) { offlineDownloadControl.stopped = true; offlineDownloadControl.controller = null; }
        offlineDownloadControl = null;
        clearOfflineDownloadJob();
        renderOfflineDownloadStatus(null);
        upsertOfflinePlaylist(playlist, job.cancelled || failed ? 'partial' : 'ready');
        if (job.cancelled) {
            text.textContent = 'Download dibatalkan';
            detail.textContent = done + ' lagu diproses';
        } else {
            text.textContent = failed ? 'Selesai dengan beberapa kegagalan' : 'Playlist tersedia offline';
            detail.textContent = saved + ' berhasil, ' + already + ' sudah ada, ' + failed + ' gagal';
        }
        modal.querySelector('#offline-playlist-cancel').textContent = 'Tutup';
        modal.querySelector('#offline-playlist-cancel').disabled = false;
        modal.querySelector('#offline-playlist-cancel').onclick = function() { modal.remove(); if (typeof OfflineView !== 'undefined' && S.at === 'offline') OfflineView.render(); };
        if (typeof OfflineView !== 'undefined' && S.at === 'offline') OfflineView.render();
        if (typeof Library !== 'undefined' && Library.currentPlaylistId === playlist.id) Library.open(playlist.id);
    })();
}

function toggleCurrentOffline() {
    if (typeof S === 'undefined' || !S.ct) {
        showToast('Pilih lagu terlebih dahulu');
        return;
    }
    saveTrackForOffline(S.ct);
}

function updateOfflineButtons() {
    if (typeof S === 'undefined') return;
    var isSaved = S.ct ? isOfflineSong(S.ct) : false;
    
    // Update FullPlayer Offline Button
    var fullBtn = gid('full-offline-btn');
    if (fullBtn) {
        if (isSaved) {
            fullBtn.className = 'w-11 h-11 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center active:scale-90 transition-all shrink-0 cursor-pointer shadow-md';
            fullBtn.title = 'Tersimpan di Mode Offline PWA (Klik untuk menghapus)';
            fullBtn.innerHTML = '<i data-lucide="check-circle-2" class="w-5 h-5"></i>';
        } else {
            fullBtn.className = 'w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center active:scale-90 transition-all shrink-0 cursor-pointer shadow-md';
            fullBtn.title = 'Simpan ke Mode Offline PWA';
            fullBtn.innerHTML = '<i data-lucide="wifi-off" class="w-5 h-5"></i>';
        }
    }

    if (window.lucide) lucide.createIcons();
}

async function retryOfflineTrack(track) {
    if (!track) return false;
    var retryVid = track.videoId || track.id;
    if (offlinePlaylistJob || offlineTrackActiveIds[retryVid]) { showToast('Download lagu ini sedang berjalan. Tunggu sampai selesai.'); return false; }
    showToast('Mengulang download audio offline...');
    var ok = await saveTrackForOffline(track, { keepExisting: true });
    if (ok) showToast('Audio offline sudah lengkap dan siap diputar.');
    return ok;
}

var OfflineView = {
    render() {
        var el = gid('view-offline');
        if (!el) return;

        var offlineSongs = typeof getOfflineSongs === 'function' ? getOfflineSongs() : [];
        var isOnline = navigator.onLine;

        var songsHtml = '';
        if (offlineSongs.length > 0) {
            songsHtml = offlineSongs.map(function(s, i) {
                var isCur = S.ct && (
                    S.ct.id === s.id ||
                    S.ct.videoId === s.videoId ||
                    (S.ct.title === s.title && S.ct.artist === s.artist)
                );
                var isPlay = isCur && S.ip;
                var isLoad = isCur && S.il;
                var isIncomplete = s.offlineStatus === 'partial' || s.offlineStatus === 'pending';                    var playIconHtml = '';
                if (isLoad) {
                    playIconHtml = '<div class="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin"></div>';
                } else if (isPlay) {
                    playIconHtml = '<div class="flex items-end justify-center gap-[2px] w-4 h-4 pb-0.5"><span class="w-[2px] bg-white rounded-full animate-eq-1"></span><span class="w-[2px] bg-white rounded-full animate-eq-2"></span><span class="w-[2px] bg-white rounded-full animate-eq-3"></span></div>';
                } else {
                    playIconHtml = '<i data-lucide="play" class="w-4 h-4 text-white fill-current ml-0.5"></i>';
                }

                var cardBg = isPlay ? 'bg-white/15 border-white/30 shadow-lg' : (isCur ? 'bg-white/10 border-white/20' : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08]');
                var titleClass = isCur ? 'text-white font-bold' : 'text-white/90 font-semibold';

                var dateStr = s.savedAt ? new Date(s.savedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '';
                var safeSongJson = JSON.stringify(s).replace(/"/g, '&quot;');
                var offlineClick = isIncomplete ? 'retryOfflineTrack('+safeSongJson+')' : "PK('offline',"+i+")";

                return '<div class="flex items-center gap-3 p-2.5 rounded-2xl border '+cardBg+' active:scale-[0.98] transition-all duration-200 group shadow-md">'+
                    '<div onclick="'+offlineClick+'" class="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">'+
                        '<div class="w-5 text-center text-white/50 text-xs font-bold group-hover:text-white shrink-0">'+(i + 1)+'</div>'+
                        '<img src="'+(s.cover || FI)+'" class="w-12 h-12 rounded-xl object-cover shrink-0 shadow-md border border-white/10" onerror="this.src=\''+FI+'\'" />'+
                        '<div class="min-w-0 flex-1">'+
                            '<h3 class="'+titleClass+' text-sm truncate">'+es(s.title)+'</h3>'+
                            '<p class="text-xs text-white/50 truncate mt-0.5">'+es(s.artist)+(dateStr ? ' • <span class="text-white/40">Offline ('+dateStr+')</span>' : '')+(s.offlineStatus === 'partial' ? ' • <span class="text-amber-300/80">'+es(s.downloadStage || 'Audio belum lengkap')+'</span>' : '')+(s.offlineStatus === 'ready' ? ' • <span class="text-emerald-300/80">Audio siap • 100%</span>' : '')+(s.offlinePlaylistName ? ' • <span class="text-cyan-300/60">'+es(s.offlinePlaylistName)+'</span>' : '')+'</p>'+
                            ((s.offlineStatus === 'partial' || s.offlineStatus === 'pending') ? '<div class="mt-1 h-1 rounded-full bg-white/10 overflow-hidden"><div class="h-full rounded-full bg-amber-300 transition-all" style="width:'+Math.max(1, Math.min(99, Number(s.downloadProgress || 0)))+'%"></div></div><span class="text-[10px] text-amber-200/70">'+Math.round(Number(s.downloadProgress || 0))+'%</span>' : '')+
                        '</div>'+
                    '</div>'+trackMenuButton(s)+
                    '<button onclick="event.stopPropagation();saveTrackForOffline('+safeSongJson+');" class="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-white/50 hover:text-red-400 border border-white/10 flex items-center justify-center shrink-0 active:scale-90 transition-all" title="Hapus dari Mode Offline PWA">'+
                        '<i data-lucide="trash-2" class="w-4 h-4"></i>'+
                    '</button>'+
                    '<button onclick="'+offlineClick+'" class="w-8 h-8 rounded-full '+(isIncomplete ? 'bg-amber-300 text-black' : 'bg-white text-black')+' flex items-center justify-center shrink-0 active:scale-90 transition-all shadow-md" title="'+(isIncomplete ? 'Download ulang audio offline' : 'Putar offline')+'">'+
                        (isIncomplete ? '<i data-lucide="refresh-cw" class="w-4 h-4"></i>' : playIconHtml)+
                    '</button>'+
                '</div>';
            }).join('');
        } else {
            songsHtml = `
            <div class="text-center py-16 rounded-3xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.06] px-6 mt-4">
                <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400/15 to-cyan-600/10 border border-cyan-400/20 flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="wifi-off" class="w-7 h-7 text-cyan-300"></i>
                </div>
                <h3 class="text-white font-bold text-base mb-2">Belum Ada Lagu Offline</h3>
                <p class="text-white/50 text-sm max-w-[280px] mx-auto mb-5 leading-relaxed">Simpan lagu favoritmu untuk diputar tanpa koneksi internet, kapan saja.</p>
                <div class="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white/60 text-xs font-medium mb-6 max-w-xs mx-auto">
                    <i data-lucide="download" class="w-4 h-4 text-cyan-300/70 shrink-0"></i>
                    <span>Klik ikon <span class="font-bold text-white/70">Download</span> di pemutar lagu</span>
                </div>
                <button onclick="App.switch('search')" class="rounded-full bg-white text-black px-6 py-3 text-sm font-bold hover:bg-white/90 active:scale-95 transition-all shadow-lg shadow-white/10">
                    <i data-lucide="search" class="w-4 h-4 inline mr-1.5"></i>Cari Lagu Sekarang
                </button>
            </div>`;
        }
        var offlinePlaylists = typeof getOfflinePlaylists === 'function' ? getOfflinePlaylists() : [];
        var playlistSummary = offlinePlaylists.length ? '<div class="rounded-2xl border border-cyan-400/15 bg-cyan-500/[.06] p-3"><div class="flex items-center gap-2 text-xs font-bold text-cyan-200 mb-2"><i data-lucide="list-music" class="w-4 h-4"></i><span>Playlist Offline</span></div>' + offlinePlaylists.slice(0, 10).map(function(p){ var readyCount = (p.songIds || []).filter(function(id){ return offlineSongs.some(function(s){ return (s.videoId || s.id) === id && s.offlineStatus === 'ready'; }); }).length; var state = p.status === 'ready' && readyCount === (p.songIds || []).length ? 'Siap diputar' : readyCount + '/' + (p.songIds || []).length + ' lagu siap'; return '<div class="flex items-center justify-between gap-3 py-1 text-xs"><span class="text-white/80 truncate">' + es(p.name) + '</span><span class="text-cyan-200/70 shrink-0">' + state + '</span></div>'; }).join('') + '</div>' : '';
        el.innerHTML = `
        <div class="pt-8 pb-3.5 px-4 sticky top-0 z-30 border-b border-white/10 shadow-2xl transition-all" style="background: linear-gradient(180deg, rgba(8, 9, 13, 0.4) 0%, rgba(8, 9, 13, 0.75) 100%), url('/banner.png') center/cover no-repeat; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);">
            <div class="flex justify-between items-center">
                <div>
                    <div class="flex items-center gap-2.5">
                        <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-cyan-600/10 border border-cyan-400/25 flex items-center justify-center shadow-lg">
                            <i data-lucide="wifi-off" class="w-5 h-5 text-cyan-300"></i>
                        </div>
                        <div>
                            <h1 class="text-2xl font-black text-white tracking-tight drop-shadow-md">Mode Offline</h1>
                        </div>
                    </div>
                    <p class="text-xs text-white/50 mt-2 ml-[52px]">Penyimpanan perangkat dan audio offline</p>
                    <p id="offline-storage-summary" class="text-[11px] text-cyan-300/70 mt-1 ml-[52px]">Menghitung penyimpanan...</p>
                </div>
                <span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${isOnline ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' : 'border-rose-400/30 text-rose-300 bg-rose-500/10'}">${isOnline ? 'Online' : 'Offline'}</span>
            </div>
        </div>

        <div class="px-4 mt-4 space-y-3">
            ${playlistSummary}
            ${offlineSongs.length > 0 ? `
                <div class="flex items-center justify-between mb-3">
                    <span class="text-xs font-semibold text-white/50 uppercase tracking-wider">${offlineSongs.length} Lagu Tersimpan</span>
                    <div class="flex items-center gap-3"><button onclick="PK('offline',0)" class="text-xs text-cyan-300 hover:text-cyan-200 font-bold flex items-center gap-1.5 transition-colors"><i data-lucide="play" class="w-3.5 h-3.5 fill-current"></i> Putar Semua</button><span class="w-px h-3 bg-white/15"></span><button onclick="clearOfflineDownloads()" class="text-xs text-rose-400/80 hover:text-rose-300 font-bold transition-colors">Hapus semua</button></div>
                </div>
            ` : ''}

            <div class="space-y-2">${songsHtml}</div>
        </div>`;

        if (window.lucide) lucide.createIcons();
        if (navigator.storage && navigator.storage.estimate) navigator.storage.estimate().then(function(info){ var target = gid('offline-storage-summary'); if (!target) return; var used = Number(info.usage || 0), quota = Number(info.quota || 0); function fmt(n){ return n > 1024 * 1024 ? (n / 1024 / 1024).toFixed(1) + ' MB' : Math.round(n / 1024) + ' KB'; } target.textContent = 'Penyimpanan perangkat: ' + fmt(used) + (quota ? ' dari sekitar ' + fmt(quota) : '') + (offlineSongs.length ? ' • Audio offline: ' + offlineSongs.length + ' lagu' : ' • Belum ada audio offline'); }).catch(function(){});
    }
};

var App={
    init(){
        document.documentElement.classList.remove('theme-light');
        localStorage.removeItem('theme');

        gid('nav-container').innerHTML=`
        <aside class="spotify-sidebar" aria-label="Navigasi MalaMusic">
            <div class="spotify-brand">
                <img src="/logo-mark.png" alt="MalaMusic">
                <span class="spotify-brand-title">MalaMusic</span>
            </div>
            <div class="spotify-nav-section">
                <div class="spotify-section-label">Menu utama</div>
                <button onclick="App.switch('home')" id="nav-home" class="spotify-nav-item" aria-label="Beranda"><i data-lucide="home"></i><span>Beranda</span></button>
                <button onclick="App.switch('search')" id="nav-search" class="spotify-nav-item" aria-label="Cari"><i data-lucide="search"></i><span>Cari</span></button>
                <button onclick="App.switch('leaderboard')" id="nav-leaderboard" class="spotify-nav-item mobile-secondary-nav" aria-label="Leaderboard"><i data-lucide="trophy"></i><span>Leaderboard</span></button>
            </div>
            <div class="spotify-nav-section">
                <div class="spotify-section-label">Koleksi kamu</div>
                <button onclick="App.switch('library')" id="nav-library" class="spotify-nav-item" aria-label="Koleksi"><i data-lucide="library"></i><span>Koleksi</span></button>
                <button onclick="App.switch('liked')" id="nav-liked" class="spotify-nav-item mobile-secondary-nav" aria-label="Lagu disukai"><i data-lucide="heart"></i><span>Disukai</span></button>
                <button onclick="App.switch('offline')" id="nav-offline" class="spotify-nav-item mobile-secondary-nav" aria-label="Mode offline — simpan lagu di perangkat" title="Mode offline: simpan playlist atau lagu di perangkat"><i data-lucide="download"></i><span>Offline</span></button>
                <button onclick="App.switch('dev')" id="nav-dev-mobile" class="spotify-nav-item mobile-only-nav" aria-label="Profil"><i data-lucide="user-circle-2"></i><span>Profil</span></button>
            </div>
            <div class="spotify-user">
                <i data-lucide="user-circle-2"></i>
                <button onclick="App.switch('dev')" id="nav-dev" class="spotify-nav-item !min-h-0 !p-0 !bg-transparent !shadow-none" aria-label="Profil"><span>Profil & Akun</span></button>
            </div>
        </aside>`;
        
        Profile.render();
        
        MP.init();FullPlayer.init();Artist.init();Album.init();Home.render();Search.render();
        if(typeof updateOG==='function') updateOG(null);
        App.switch(!navigator.onLine ? 'offline' : 'home');
        // Reconcile in the background so startup remains responsive while stale
        // "ready" entries are corrected before the user tries to play them.
        setTimeout(function(){ reconcileOfflineAudioState().catch(function(){}); }, 0);
        lucide.createIcons();
        setTimeout(function(){ App.checkUrl(); }, 1000);
        window.addEventListener('popstate', function(e) {
            if (typeof Album !== 'undefined' && gid('album-modal') && gid('album-modal').style.display !== 'none') {
                gid('album-modal').style.display = 'none';
                gid('album-content').innerHTML = '';
                Album.currentAlbumId = null;
            }
            if (typeof Artist !== 'undefined' && gid('artist-modal') && gid('artist-modal').style.display !== 'none') {
                gid('artist-modal').style.display = 'none';
                gid('artist-content').innerHTML = '';
                Artist.currentArtistId = null;
            }
        });
    },
    checkUrl(){
        var path = window.location.pathname;
        if(path.startsWith('/search/')){
            var q = path.split('/search/')[1];
            if(q){
                setTimeout(function(){
                    var si=gid('search-input');
                    if(si){
                        si.value=decodeURIComponent(q);
                        gid('search-form').dispatchEvent(new Event('submit'));
                    }
                    App.switch('search');
                },300);
            }
        }
        else if(path.startsWith('/play/')){
            var videoId = path.split('/play/')[1];
            if(videoId) {
                var p = new URLSearchParams(location.search);
                var isShared = p.get('share') === 'true' || p.get('share') === '1';
                var qTitle = p.get('title');
                var qArtist = p.get('artist');
                var qCover = p.get('cover') || p.get('thumb');
                if (qCover && typeof updateOG === 'function') {
                    updateOG(qTitle || 'Lagu', qCover, qArtist || '');
                }
                if(isShared) {
                    App.showSharePopup(videoId);
                } else {
                    App.autoPlayTrack(videoId);
                }
            }
        }
        else if(path.startsWith('/album/')){
            var albumId = path.split('/album/')[1];
            if(albumId) {
                var p = new URLSearchParams(location.search);
                var qTitle = p.get('title');
                var qArtist = p.get('artist');
                var qCover = p.get('cover') || p.get('thumb');
                if (qCover && typeof updateOGForAlbum === 'function') {
                    updateOGForAlbum(qTitle || 'Album', qCover, qArtist || '');
                }
                App.switch('home');
                setTimeout(function(){ Album.open(albumId, qCover); }, 300);
            }
        }
        else if(path.startsWith('/playlist/')){
            var playlistId = path.split('/playlist/')[1];
            if(playlistId){
                App.switch('library');
                setTimeout(function(){
                    if(typeof Library !== 'undefined' && typeof Library.open === 'function'){
                        var pls = typeof getUserPlaylists === 'function' ? getUserPlaylists() : [];
                        var exists = pls.some(function(p){ return p.id === playlistId; });
                        if(exists){
                            Library.open(playlistId);
                        } else if(typeof showToast === 'function'){
                            // Playlists are stored locally on-device, so a shared link only
                            // opens correctly on the device that created it.
                            showToast('Playlist ini tidak ditemukan di perangkat ini');
                        }
                    }
                }, 300);
            }
        }
        else if(path.startsWith('/blend/')){
            var blendId = decodeURIComponent(path.split('/blend/')[1] || '').split('/')[0];
            if(blendId && typeof Blend !== 'undefined') setTimeout(function(){ Blend.promptJoin(blendId); }, 300);
        }
        else if(path.startsWith('/playlist-public/')){
            var publicId = path.split('/playlist-public/')[1];
            if(publicId) setTimeout(function(){ App.openPublicPlaylist(publicId); }, 300);
        }
        else if(path.startsWith('/artist/')){
            var artistId = path.split('/artist/')[1];
            if(artistId) {
                var p = new URLSearchParams(location.search);
                var qName = p.get('name') || p.get('title');
                var qCover = p.get('cover') || p.get('thumb');
                if (qCover && typeof updateOGForArtist === 'function') {
                    updateOGForArtist(qName || 'Artist', qCover);
                }
                App.switch('home');
                setTimeout(function(){ Artist.open(artistId, qName, qCover); }, 300);
            }
        }
        else {
            var p=new URLSearchParams(location.search);
            var play=p.get('play'),search=p.get('search'),isShared=p.get('share')==='1';
            if(play){if(isShared){App.showSharePopup(play);}else{App.autoPlayTrack(play);}}
            else if(search){setTimeout(function(){var si=gid('search-input');if(si){si.value=decodeURIComponent(search);gid('search-form').dispatchEvent(new Event('submit'));}App.switch('search');},300);}
        }
    },
    openPublicPlaylist(id){
        fetch('/api/stats?action=public-playlist&id=' + encodeURIComponent(id)).then(function(r){return r.json();}).then(function(data){
            if(!data.status || !data.playlist) throw new Error();
            var pl=data.playlist, songs=(pl.songs||[]).map(normalizeTrack).filter(function(song){ return trackId(song); }), modal=document.createElement('div'); modal.className='fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/70 px-0 sm:px-4';
            modal.innerHTML='<div class="w-full sm:max-w-lg max-h-[88vh] overflow-hidden rounded-t-3xl sm:rounded-3xl bg-[#15151b] border border-white/10 shadow-2xl"><div class="p-5 flex items-center gap-4 border-b border-white/10"><img src="'+safeMediaUrl(pl.image || ((songs[0] && songs[0].cover) || FI), FI)+'" class="w-20 h-20 rounded-2xl object-cover" onerror="this.src=\''+FI+'\'" /><div class="min-w-0 flex-1"><p class="text-[10px] uppercase tracking-widest text-amber-200/70 font-black">Playlist Publik</p><h2 class="text-xl font-black text-white truncate mt-1">'+es(pl.name)+'</h2><p class="text-xs text-white/50 mt-1">Oleh '+es(pl.owner_name||'Pendengar MalaMusic')+' · '+songs.length+' lagu</p></div><button onclick="this.closest(\'.fixed\').remove()" class="w-9 h-9 rounded-full bg-white/10 text-white">×</button></div><div class="max-h-[48vh] overflow-y-auto p-3">'+(songs.length?songs.map(function(s,i){return '<button onclick="App.playPublicPlaylist('+i+')" class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 text-left"><img src="'+safeMediaUrl(s.cover || FI, FI)+'" class="w-10 h-10 rounded-lg object-cover" /><span class="min-w-0 flex-1"><strong class="block text-sm text-white truncate">'+es(s.title||'Lagu')+'</strong><span class="text-xs text-white/50 truncate">'+es(s.artist||'MalaMusic')+'</span></span></button>';}).join(''):'<p class="p-8 text-center text-sm text-white/50">Playlist ini belum memiliki lagu.</p>')+'</div><div class="p-4 border-t border-white/10"><button onclick="App.playPublicPlaylist(0)" class="w-full rounded-full bg-white text-black py-3 font-black text-sm">Putar Playlist</button></div></div>';
            document.body.appendChild(modal); window.__publicPlaylistSongs=songs; window.__publicPlaylistInfo={id:String(id),name:pl.name||'Playlist Publik',image:pl.image||'',creator:pl.owner_name||'',songs:songs}; lucide.createIcons();
            var publicPlayButton = modal.querySelector('button[onclick="App.playPublicPlaylist(0)"]');
            if (publicPlayButton && songs.length) {
                var publicOfflineButton = document.createElement('button');
                publicOfflineButton.type = 'button';
                publicOfflineButton.className = 'w-full mb-2 rounded-full bg-cyan-500/15 border border-cyan-400/25 text-cyan-100 py-3 font-black text-sm';
                publicOfflineButton.setAttribute('aria-label', 'Download playlist publik ke Mode Offline');
                publicOfflineButton.innerHTML = '<i data-lucide="download-cloud" class="w-4 h-4 inline mr-1"></i>Download ke Mode Offline';
                publicOfflineButton.onclick = function(){ downloadPublicPlaylistOffline(id); };
                publicPlayButton.parentNode.insertBefore(publicOfflineButton, publicPlayButton);
                lucide.createIcons();
            }
        }).catch(function(){showToast('Playlist publik tidak ditemukan.');});
    },
    playPublicPlaylist(index){ if (window.ListenTogether && typeof ListenTogether.blockFollowerAction === 'function' && ListenTogether.blockFollowerAction()) return; var songs=(window.__publicPlaylistSongs||[]).map(normalizeTrack).filter(function(song){ return trackId(song); }); if(!songs[index]) return; window.__publicPlaylistSongs=songs; S.pl=songs; S.pi=index; S.ps='queue'; S.ct=normalizeTrack(songs[index]); var playUrl=location.origin+'/play/'+trackId(S.ct); history.pushState({},'',playUrl); UU(); MP.show(); S.il=true; UB(); resetLyricsUI(trackId(S.ct)); loadTrack(S.ct); var modal=document.querySelector('.fixed.z-\\[300\\]'); if(modal) modal.remove(); if (window.ListenTogether && typeof ListenTogether.syncAfterLocalAction === 'function') ListenTogether.syncAfterLocalAction(); },
    autoPlayTrack(videoId){
        if (window.ListenTogether && typeof ListenTogether.blockFollowerAction === 'function' && ListenTogether.blockFollowerAction()) return;
        var requestId = (App._playRequestId || 0) + 1; App._playRequestId = requestId;
        fetch(API.search+'?query=https://youtube.com/watch?v='+encodeURIComponent(videoId)).then(function(r){return r.json();}).then(function(d){
            if (requestId !== App._playRequestId) return;
            var title='Lagu',artist='MalaMusic',cover=toHDCover('', videoId),artistId='';
            if(d.status&&d.result.songs&&d.result.songs.length>0){var song=d.result.songs[0];title=cn(song.title);artist=cn(song.artist);cover=toHDCover(song.thumbnail, videoId);artistId=song.artistId||'';}
            S.ct=normalizeTrack({id:videoId,videoId:videoId,title:title,artist:artist,cover:cover,artistId:artistId,ytUrl:'https://youtube.com/watch?v='+videoId});
            S.ps='queue';S.pl=[S.ct];S.pi=0;UU();MP.show();resetLyricsUI(videoId);
            FullPlayer.open();loadTrack(S.ct); if (window.ListenTogether && typeof ListenTogether.syncAfterLocalAction === 'function') ListenTogether.syncAfterLocalAction();
        }).catch(function(){
            if (requestId !== App._playRequestId) return;
            S.ct=normalizeTrack({id:videoId,videoId:videoId,title:'Lagu',artist:'MalaMusic',cover:toHDCover('', videoId),artistId:'',ytUrl:'https://youtube.com/watch?v='+videoId});
            S.ps='queue';S.pl=[S.ct];S.pi=0;UU();MP.show();resetLyricsUI(videoId);
            FullPlayer.open();loadTrack(S.ct); if (window.ListenTogether && typeof ListenTogether.syncAfterLocalAction === 'function') ListenTogether.syncAfterLocalAction();
        });
    },
    showSharePopup(videoId){
        var requestId = (App._shareRequestId || 0) + 1; App._shareRequestId = requestId;
        fetch(API.search+'?query='+encodeURIComponent('https://youtube.com/watch?v='+videoId)).then(function(r){return r.json();}).then(function(d){
            if (requestId !== App._shareRequestId) return;
            var title='Lagu',artist='MalaMusic',cover=toHDCover('', videoId);
            if(d.status&&d.result.songs&&d.result.songs.length>0){var song=d.result.songs[0];title=cn(song.title);artist=cn(song.artist);cover=toHDCover(song.thumbnail, videoId);}
            App.renderPopup(videoId,title,artist,cover);
        }).catch(function(){ if (requestId === App._shareRequestId) App.renderPopup(videoId,'Lagu','MalaMusic',toHDCover('', videoId)); });
    },
    renderPopup(videoId,title,artist,cover){
        if(typeof updateOG==='function') updateOG(title, cover, artist);
        var popup=document.createElement('div');popup.className='fixed inset-0 z-[300] flex items-end justify-center bg-black/60';
        popup.onclick=function(e){if(e.target===popup)popup.remove();};
        popup.innerHTML='<div class="glass-strong w-full max-w-md rounded-t-3xl p-6 border-t border-white/10" style="animation:slideUp 0.4s ease-out forwards;"><div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4"></div><div class="flex items-center gap-4 mb-4"><img src="'+safeMediaUrl(cover,FI)+'" class="w-16 h-16 rounded-xl object-cover " onerror="this.src=\''+FI+'\'" /><div class="flex-1 truncate"><h3 class="font-bold text-white truncate">'+es(title)+'</h3><p class="text-[#b3b3b3] text-sm truncate">'+es(artist)+'</p></div></div><p class="text-white/70 text-xs mb-4 text-center">Seseorang membagikan lagu ini kepadamu</p><div class="flex gap-3"><button id="popup-play" class="flex-1 btn-chrome font-bold py-3 rounded-full active:scale-95 flex items-center justify-center gap-2"><i data-lucide="play" class="w-4 h-4 fill-current"></i> Putar Sekarang</button><button id="popup-later" class="px-6 py-3 glass glass-hover text-white rounded-full active:scale-95">Nanti</button></div></div>';
        document.body.appendChild(popup);
        popup.querySelector('#popup-play').onclick=function(){if (window.ListenTogether && typeof ListenTogether.blockFollowerAction === 'function' && ListenTogether.blockFollowerAction()) { popup.remove(); return; } popup.remove();S.ct=normalizeTrack({id:videoId,videoId:videoId,title:title,artist:artist,cover:cover,artistId:'',ytUrl:'https://youtube.com/watch?v='+videoId});S.ps='queue';S.pl=[S.ct];S.pi=0;UU();MP.show();resetLyricsUI(videoId);FullPlayer.open();loadTrack(S.ct); if (window.ListenTogether && typeof ListenTogether.syncAfterLocalAction === 'function') ListenTogether.syncAfterLocalAction();};
        popup.querySelector('#popup-later').onclick=function(){popup.remove();};
    },
    switch(t){
        // Auto-close opened detail modals/tabs when switching bottom navbar
        if(typeof FullPlayer !== 'undefined' && FullPlayer.close) FullPlayer.close();
        if(typeof Album !== 'undefined' && Album.close) Album.close();
        if(typeof Artist !== 'undefined' && Artist.close) Artist.close();
        if(typeof Library !== 'undefined' && Library.closeModalOnly) Library.closeModalOnly();

        // Remove any open popups or dialogs
        document.querySelectorAll('.fixed.z-\\[300\\], .fixed.z-\\[400\\]').forEach(function(el){
            if(el.id !== 'v2-popup' && el.id !== 'mini-player') el.remove();
        });

        var tabs = ['home', 'search', 'leaderboard', 'library', 'offline', 'liked', 'dev'];
        var prevTab = S.at || 'home';
        var prevIndex = tabs.indexOf(prevTab);
        var nextIndex = tabs.indexOf(t);

        S.at = t;

        tabs.forEach(function(id){
            var el = gid('view-' + id);
            if(el) {
                el.style.display = 'none';
                el.classList.remove('animate-slide-right', 'animate-slide-left');
            }
        });

        if(t==='library'){
            Library.render();
            if (typeof loadLibraryRemote === 'function') {
                loadLibraryRemote().then(function(){ if (S.at === 'library' && typeof Library !== 'undefined') Library.render(); }).catch(function(){});
            }
        }
        if(t==='dev'){Profile.render();}
        if(t==='offline'){
            OfflineView.render();
        }
        if(t==='home'){
            if (prevTab === 'home' && Home.activeCategory) {
                Home.selectCategory('Semua');
            } else {
                Home.render();
            }
        }
        if(t==='search'){Search.onShow();}
        if(t==='leaderboard' && typeof Leaderboard !== 'undefined'){Leaderboard.render();}
        if(t==='liked'){Liked.render();}

        var targetEl = gid('view-' + t);
        if(targetEl) {
            targetEl.style.display = 'block';
            if(prevIndex !== -1 && nextIndex !== -1 && prevIndex !== nextIndex) {
                if(nextIndex > prevIndex) {
                    targetEl.classList.add('animate-slide-right');
                } else {
                    targetEl.classList.add('animate-slide-left');
                }
            }
        }

        ['home','search','leaderboard','library','offline','liked','dev'].forEach(function(n){
            var b=gid('nav-'+n);
            var mobileB = n === 'dev' ? gid('nav-dev-mobile') : null;
            if(!b && !mobileB)return;
            var isCurrent = (n === t);

            if(isCurrent){
                if(b) b.className = n === 'dev' ? 'spotify-nav-item !min-h-0 !p-0 !bg-transparent !shadow-none active' : ('spotify-nav-item active' + ((n === 'liked' || n === 'offline') ? ' mobile-secondary-nav' : ''));
                if(mobileB) mobileB.className = 'spotify-nav-item mobile-only-nav active';
            } else {
                if(b) b.className = n === 'dev' ? 'spotify-nav-item !min-h-0 !p-0 !bg-transparent !shadow-none' : ('spotify-nav-item' + ((n === 'liked' || n === 'offline') ? ' mobile-secondary-nav' : ''));
                if(mobileB) mobileB.className = 'spotify-nav-item mobile-only-nav';
            }
        });

        gid('main-area').scrollTop=0;lucide.createIcons();
        if (offlinePlaylistJob) renderOfflineDownloadStatus(offlinePlaylistJob);
    },
    renderLiked() {
        if (typeof Liked !== 'undefined') Liked.render();
    },
    showV2Popup() {
        if(localStorage.getItem('seen_v2_popup_update')) return;
        var popup = document.createElement('div');
        popup.id = 'v2-popup';
        popup.className = 'fixed inset-0 z-[400] flex items-center justify-center bg-black/80 px-3 sm:px-4 py-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] overflow-y-auto';
        ;
        popup.innerHTML = `
            <div class="glass-strong w-full max-w-sm max-h-[calc(100dvh-2rem)] rounded-3xl p-5 sm:p-6 border border-white/10 text-center relative overflow-hidden flex flex-col" style="animation: slideUp 0.3s ease-out forwards;">
                <!-- Header -->
                <div class="relative w-16 h-16 rounded-full mx-auto mb-4 bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center  ">
                    <i data-lucide="sparkles" class="w-8 h-8 text-white"></i>
                </div>
                
                <h2 class="text-2xl font-black chrome-text mb-1">New Version v2</h2>
                <p class="text-white/70 text-xs mb-5">Berikut adalah fitur dan pembaruan terbaru:</p>
                
                <!-- Features list -->
                <div class="space-y-4 text-left mb-5 max-h-[min(40vh,250px)] overflow-y-auto pr-1 overscroll-contain">
                    <div class="flex items-start gap-3">
                        <div class="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                            <i data-lucide="sliders" class="w-4 h-4 text-rose-400"></i>
                        </div>
                        <div>
                            <h4 class="text-white font-bold text-sm">Equalizer Suara (Web Audio)</h4>
                            <p class="text-[#b3b3b3] text-xs leading-relaxed">Sesuaikan Bass, Mid, Treble, dan gunakan berbagai Preset Keren untuk kualitas audio musik terbaik.</p>
                        </div>
                    </div>
                    
                    <div class="flex items-start gap-3">
                        <div class="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                            <i data-lucide="share-2" class="w-4 h-4 text-rose-400"></i>
                        </div>
                        <div>
                            <h4 class="text-white font-bold text-sm">Share Lagu via Link Audio Langsung</h4>
                            <p class="text-[#b3b3b3] text-xs leading-relaxed">Bagikan lagu favorit Anda menggunakan link audio langsung untuk kemudahan berbagi musik.</p>
                        </div>
                    </div>

                    <div class="flex items-start gap-3">
                        <div class="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                            <i data-lucide="timer" class="w-4 h-4 text-rose-400"></i>
                        </div>
                        <div>
                            <h4 class="text-white font-bold text-sm">Timer Sleep (Pengantar Tidur)</h4>
                            <p class="text-[#b3b3b3] text-xs leading-relaxed">Atur waktu putar musik otomatis sebelum tidur dengan durasi yang dapat ditentukan sendiri.</p>
                        </div>
                    </div>

                    <div class="flex items-start gap-3">
                        <div class="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                            <i data-lucide="shield-check" class="w-4 h-4 text-rose-400"></i>
                        </div>
                        <div>
                            <h4 class="text-white font-bold text-sm">Fitur Pintar: "Hentikan di Akhir Lagu"</h4>
                            <p class="text-[#b3b3b3] text-xs leading-relaxed">Dilengkapi opsi agar lagu aktif Anda tetap berputar sampai selesai sebelum pemutaran otomatis berhenti tanpa memotong lagu di tengah-tengah.</p>
                        </div>
                    </div>

                    <div class="flex items-start gap-3">
                        <div class="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                            <i data-lucide="gauge" class="w-4 h-4 text-rose-400"></i>
                        </div>
                        <div>
                            <h4 class="text-white font-bold text-sm">Kontrol Kecepatan Putar</h4>
                            <p class="text-[#b3b3b3] text-xs leading-relaxed">Memungkinkan Anda mempercepat atau memperlambat musik sesuai kebutuhan (mendukung kecepatan 0.5x, 0.75x, 1.0x (Normal), 1.25x, 1.5x, 1.75x, hingga 2.0x).</p>
                        </div>
                    </div>

                    <div class="flex items-start gap-3">
                        <div class="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                            <i data-lucide="zap" class="w-4 h-4 text-rose-400"></i>
                        </div>
                        <div>
                            <h4 class="text-white font-bold text-sm">Mode "Slowed + Reverb" & "Nightcore"</h4>
                            <p class="text-[#b3b3b3] text-xs leading-relaxed">Kustomisasi getaran audio dengan mengubah kecepatan musik secara instan ke gaya favorit Anda.</p>
                        </div>
                    </div>
                </div>
                
                <!-- Button -->
                <button id="close-v2-popup" class="w-full btn-chrome font-bold py-3.5 rounded-full active:scale-95 transition-all">
                    Keren, Mulai Dengar!
                </button>
            </div>
        `;
        document.body.appendChild(popup);
        lucide.createIcons();
        popup.querySelector('#close-v2-popup').onclick = function() {
            localStorage.setItem('seen_v2_popup_update', 'true');
            popup.remove();
        };
    }
};
App.init();Home.fetch();

// SPLASH SCREEN - LOGO BULAT BESAR & RENDER HOME SYNC
var splashStartTime = Date.now();
function setSplashStatus(message) {
    var status = document.getElementById('splash-status');
    if (status && message) status.textContent = message;
}
function ensureImageAccessibility(root) {
    var scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('img').forEach(function(img) {
        if (!img.hasAttribute('alt')) {
            var owner = img.closest('[data-title], article, button, [role="button"], .group');
            var label = owner && owner.getAttribute('data-title');
            if (!label && owner) {
                var textNode = owner.querySelector('h1,h2,h3,h4,strong,p');
                label = textNode && textNode.textContent.trim();
            }
            img.setAttribute('alt', (label || 'Artwork MalaMusic').replace(/\s+/g, ' ').slice(0, 140));
        }
        // FIXED: empty image sources resolve ke URL halaman sendiri dan memicu request sia-sia/broken image.
        var rawSrc = String(img.getAttribute('src') || '').trim();
        if (!rawSrc || rawSrc === location.href) {
            var imageFallback = (typeof FI !== 'undefined' && FI) ? FI : '/logo-mark.png';
            img.setAttribute('src', imageFallback);
        }
        // FIXED: gambar yang sudah complete tetapi naturalWidth 0 perlu dipulihkan sekarang, bukan menunggu event error berikutnya.
        if (img.complete && img.naturalWidth === 0) {
            var failedImageFallback = (typeof FI !== 'undefined' && FI) ? FI : '/logo-mark.png';
            if (img.getAttribute('src') !== failedImageFallback) img.setAttribute('src', failedImageFallback);
        }
        if (!img.dataset.malaFallbackBound) {
            img.dataset.malaFallbackBound = 'true';
            img.addEventListener('error', function() {
                var imageFallback = (typeof FI !== 'undefined' && FI) ? FI : '/logo-mark.png';
                if (img.getAttribute('src') !== imageFallback) img.setAttribute('src', imageFallback);
            });
        }
        if (!img.hasAttribute('loading') && !img.closest('#splash-screen, #full-player, #mini-player')) img.setAttribute('loading', 'lazy');
    });
}
ensureImageAccessibility(document);
if (window.MutationObserver) new MutationObserver(function(records) { records.forEach(function(record) { record.addedNodes.forEach(function(node) { if (node.nodeType === 1) ensureImageAccessibility(node); }); }); }).observe(document.body, { childList: true, subtree: true });
var splashDismissed = false;

function hideSplashScreen() {
    if (splashDismissed) return;
    var minDuration = 500;
    var elapsed = Date.now() - splashStartTime;
    if (elapsed < minDuration) {
        setTimeout(hideSplashScreen, minDuration - elapsed);
        return;
    }
    splashDismissed = true;
    var sp = gid('splash-screen');
    if (!sp) return;
    sp.classList.add('hide');
    setTimeout(function() { 
        if (sp && sp.parentNode) sp.parentNode.removeChild(sp); 
        // Trigger V2 Update popup here
        App.showV2Popup();
    }, 400);
}

(function(){
    var sp = gid('splash-screen');
    if (!sp) return;
    var logoWrap = sp.querySelector('.splash-logo-wrap') || sp.querySelector('.logo-wrap');
    if (logoWrap) {
        logoWrap.style.width = '170px';
        logoWrap.style.height = '170px';
        logoWrap.style.borderRadius = '50%';
    }
    var logo = sp.querySelector('.splash-logo-wrap img') || sp.querySelector('.logo');
    if (logo) {
        logo.style.borderRadius = '50%';
        logo.style.objectFit = 'cover';
    }
    // Safety max fallback timer in case network or API is extremely slow
    setTimeout(function(){
        setSplashStatus('Menyiapkan tampilan utama…');
        hideSplashScreen();
    }, 1800);
})();

// Library object moved to /library.js

