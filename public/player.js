// ============================================================
// MALAMUSIC - CORE PLAYER (FULL FIX)
// ============================================================
const API={search:'/api/search',artist:'/api/artist',suggest:'/api/suggest',lyrics:'/api/lyrics',ytplay:'/api/ytplay'};
function safeMediaUrl(value, fallback) {
    fallback = fallback || '';
    if (!value) return fallback;
    var raw = String(value).trim();
    if (/^data:image\//i.test(raw)) return raw;
    try {
        var parsed = new URL(raw, location.origin);
        if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return parsed.href;
    } catch (_) {}
    return fallback;
}

const FI='data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%22100%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2523374151%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Crect%20width%3D%22100%2525%22%20height%3D%22100%2525%22%20fill%3D%22%252318181b%22%2F%3E%3Ccircle%20cx%3D%2212%22%20cy%3D%2212%22%20r%3D%2210%22%20fill%3D%22%252327272a%22%20stroke%3D%22none%22%2F%3E%3Cpath%20d%3D%22M9%2017V5l10-2v12%22%20stroke%3D%22%252352525b%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%226%22%20cy%3D%2217%22%20r%3D%223%22%20fill%3D%22%252352525b%22%20stroke%3D%22none%22%2F%3E%3Ccircle%20cx%3D%2216%22%20cy%3D%2215%22%20r%3D%223%22%20fill%3D%22%252352525b%22%20stroke%3D%22none%22%2F%3E%3C%2Fsvg%3E';

function toWebp(url) {
    if (!url) return FI;
    var u = String(url);
    if (u.includes('i.ytimg.com/vi/') || u.includes('img.youtube.com/vi/')) {
        u = u.replace('i.ytimg.com/vi/', 'i.ytimg.com/vi_webp/')
             .replace('img.youtube.com/vi/', 'i.ytimg.com/vi_webp/')
             .replace(/(hqdefault|mqdefault|sddefault|default|maxresdefault)\.(jpg|jpeg|png)/i, '$1.webp');
    } else if (u.includes('i.ytimg.com/vi_webp/')) {
        u = u.replace(/(hqdefault|mqdefault|sddefault|default|maxresdefault)\.(jpg|jpeg|png)/i, '$1.webp');
    }
    if ((u.includes('googleusercontent.com') || u.includes('ggpht.com') || u.includes('yt3.ggpht.com')) && !u.includes('-rw')) {
        if (/=[a-zA-Z0-9\-_]+$/i.test(u)) {
            u = u + '-rw';
        }
    }
    return safeMediaUrl(u, FI);
}

function toHDCover(url, videoId) {
    if (!url && videoId) return safeMediaUrl('https://i.ytimg.com/vi_webp/' + encodeURIComponent(String(videoId)) + '/hqdefault.webp', FI);
    if (!url) return FI;
    var hd = String(url);
    if (hd.includes('googleusercontent.com') || hd.includes('ggpht.com') || hd.includes('ytimg.com')) {
        if (/=w\d+-h\d+/i.test(hd)) {
            hd = hd.replace(/=w\d+-h\d+[^?#]*/i, '=w800-h800-l90-rj-rw');
        } else if (/=s\d+/i.test(hd)) {
            hd = hd.replace(/=s\d+[^?#]*/i, '=s800-c-k-c0x00ffffff-no-rj-rw');
        } else if (/=w\d+/i.test(hd)) {
            hd = hd.replace(/=w\d+[^?#]*/i, '=w800-h800-l90-rj-rw');
        } else if (/=[a-zA-Z0-9\-_]+$/i.test(hd) && !hd.includes('-rw')) {
            hd = hd + '-rw';
        }
    }
    if (hd.includes('i.ytimg.com/vi/') || hd.includes('img.youtube.com/vi/')) {
        hd = hd.replace('i.ytimg.com/vi/', 'i.ytimg.com/vi_webp/')
               .replace('img.youtube.com/vi/', 'i.ytimg.com/vi_webp/')
               .replace(/(hqdefault|mqdefault|sddefault|default|maxresdefault)\.(jpg|jpeg|png)/i, 'hqdefault.webp');
    } else if (hd.includes('i.ytimg.com/vi_webp/')) {
        hd = hd.replace(/(hqdefault|mqdefault|sddefault|default|maxresdefault)\.(jpg|jpeg|png)/i, 'hqdefault.webp');
    }
    return safeMediaUrl(hd, FI);
}

function handleImgError(img) {
    if (!img) return;
    var retries = parseInt(img.getAttribute('data-img-retry') || '0', 10);
    if (retries >= 3) {
        img.src = '/logo.png';
        return;
    }
    img.setAttribute('data-img-retry', String(retries + 1));
    var src = img.src || '';
    var orig = img.getAttribute('data-original-src');

    if (src.includes('/vi_webp/')) {
        img.src = src.replace('/vi_webp/', '/vi/').replace(/\.webp$/i, '.jpg');
    } else if (src.includes('hqdefault.jpg')) {
        img.src = src.replace('hqdefault.jpg', 'mqdefault.jpg');
    } else if (src.includes('-rw')) {
        img.src = src.replace('-rw', '');
    } else if (orig && img.src !== orig) {
        img.src = orig;
    } else {
        img.src = '/logo.png';
    }
}
const S={ht:[],sr:[],ar:[],hc:[],hcp:[],hca:[],sq:'',filter:'all',ct:null,pl:[],pi:-1,ps:'',ip:false,il:false,rm:'all',isShuffle:false,currentAccentColor:'#f43f5e',autoNext:true,iv:null,pt:0,pd:0,at:'home',ld:{type:'none',lines:[]},cli:-1,lo:false,lyricOffset:0,playbackRate:1.0,sleepSecondsLeft:0,sleepEndWithTrack:false,volume:1.0,lastVolume:1.0};
try{S.playbackRate=parseFloat(localStorage.getItem('malamusic_playback_rate'))||1.0;}catch(e){S.playbackRate=1.0;}
try{S.dataSaver=localStorage.getItem('malamusic_data_saver')==='true';}catch(e){S.dataSaver=false;}
function toggleDataSaver(){S.dataSaver=!S.dataSaver;try{localStorage.setItem('malamusic_data_saver',String(S.dataSaver));}catch(e){};showToast(S.dataSaver?'Data Saver aktif':'Data Saver nonaktif');}
try{var storedAutoNext = localStorage.getItem('malamusic_auto_next');if(storedAutoNext!==null){S.autoNext = storedAutoNext==='true';}}catch(e){}
function fm(s){if(isNaN(s))return"0:00";const m=Math.floor(s/60),se=Math.floor(s%60);return m+':'+(se<10?'0':'')+se;}
function es(t){if(!t)return'';const d=document.createElement('div');d.textContent=t;return d.innerHTML;}
function esJs(t){if(!t)return'';return String(t).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;').replace(/\n/g,' ').replace(/\r/g,'');}
function cn(t){if(!t)return'Unknown';return t.replace(/[^\x20-\x7E\xA0-\xFF\u0100-\uFFFF]/g,'').replace(/\s*-\s*Topic$/i,'').trim()||'Unknown';}
function normalizeTrack(track){
    track = track || {};
    var id = String(track.videoId || track.id || track.video_id || '').trim();
    return {
        id: id,
        videoId: id,
        title: cn(track.title || track.name || 'Lagu'),
        artist: cn(track.artist || track.author || 'MalaMusic'),
        artistId: track.artistId || track.artist_id || '',
        cover: toHDCover(track.cover || track.thumbnail || track.image || '', id),
        ytUrl: track.ytUrl || track.url || (id ? 'https://youtube.com/watch?v=' + id : '')
    };
}
function trackId(track){return String(track && (track.videoId || track.id || track.video_id) || '').trim();}
function gid(id){return document.getElementById(id);}

function updateOG(title,image){
    var t=document.querySelector('meta[property="og:title"]');if(!t){t=document.createElement('meta');t.setAttribute('property','og:title');document.head.appendChild(t);}t.setAttribute('content',title+' | MalaMusic');
    var i=document.querySelector('meta[property="og:image"]');if(!i){i=document.createElement('meta');i.setAttribute('property','og:image');document.head.appendChild(i);}i.setAttribute('content',image||FI);
    document.title=title+' - MalaMusic';
}

// ---- AUDIO ENGINE (elemen <audio> native, sumber stream dari /api/ytplay) ----
var AU=gid('audio-player');
if(!AU){AU=document.createElement('audio');AU.id='audio-player';AU.preload='auto';AU.style.display='none';document.body.appendChild(AU);}
// Keep playback as a normal Android media session. The browser/Android audio
// policy owns telephony focus; web code must not try to inject media into a call.
try {
    AU.setAttribute('playsinline','');
    AU.setAttribute('x-webkit-airplay','allow');
    AU.setAttribute('disableRemotePlayback','');
} catch(e) {}
AU.addEventListener('timeupdate',function(){
    if(!isCurrentAudioSource()) return;
    if(!AU.paused){
        S.pt=AU.currentTime||0;
        S.pd=AU.duration||0;
        renderProgress();
        if(typeof Streak !== 'undefined' && S.ct && AU.currentTime >= Math.min(30, AU.duration ? AU.duration * 0.25 : 30)) Streak.record(S.ct);
        if(typeof StatsTracker !== 'undefined' && S.ct) StatsTracker.tick(S.ct, AU.currentTime);
        checkAndPreloadNext();
        // Some mobile/background media pipelines can advance to duration without dispatching `ended`.
        // Use a guarded near-end watchdog so auto-next remains reliable outside the visible tab.
        if (AU.duration && isFinite(AU.duration) && AU.duration > 0.5 && AU.currentTime >= Math.max(0.25, AU.duration - 0.35) && !AU.ended) {
            queueAutoNextAfterEnd('duration-watchdog');
        }
    }
});
AU.addEventListener('play',function(){if(!isCurrentAudioSource()) return; S.ip=true;S.il=false;UB();SP();try{AU.playbackRate=S.playbackRate||1.0;}catch(ex){}});
AU.addEventListener('pause',function(){if(!isCurrentAudioSource()) return; if(!AU.ended){S.ip=false;UB();updateMediaSessionPlaybackState();ST();if(typeof StatsTracker !== 'undefined') StatsTracker.flush();}});
AU.addEventListener('waiting',function(){if(!isCurrentAudioSource()) return; S.il=true;UB();});
AU.addEventListener('playing',function(){if(!isCurrentAudioSource()) return; clearAudioStartTimer(); S.il=false;UB();updateMediaSessionPlaybackState();});
function queueAutoNextAfterEnd(reason){
    if(!isCurrentAudioSource()) return;
    var endedSequence = audioLoadSequence;
    if (endedHandledSequence === endedSequence || endedTransitionBusy) return;
    endedHandledSequence = endedSequence;
    if(typeof StatsTracker !== 'undefined') StatsTracker.flush();
    ST();
    if(typeof handleTrackEnded==='function'&&handleTrackEnded()) return;
    if(S.rm==='one'){
        AU.currentTime=0;
        AU.play().catch(function(){ S.ip=false; UB(); });
    }else if(S.autoNext){
        endedTransitionBusy = true;
        Promise.resolve(NX()).catch(function(){
            S.il = false; S.ip = false; UB();
            if(typeof showToast === 'function') showToast('Lagu berikutnya belum siap. Coba lagi saat jaringan stabil.');
        }).finally(function(){ endedTransitionBusy = false; });
    }else{
        S.ip=false; UB();
        if(typeof showToast === 'function') showToast('Auto-next sedang dimatikan.');
    }
}
AU.addEventListener('ended',function(){ queueAutoNextAfterEnd('ended'); });
AU.addEventListener('error',function(){if(!isCurrentAudioSource()) return; handleAudioSourceError();});

// ---- MEDIA SESSION (kontrol next/prev/play/pause di notifikasi & lockscreen) ----
if('mediaSession' in navigator){
    try{
        navigator.mediaSession.setActionHandler('play',function(){TP();});
        navigator.mediaSession.setActionHandler('pause',function(){TP();});
        navigator.mediaSession.setActionHandler('previoustrack',function(){navigateFromMediaSession('previous');});
        navigator.mediaSession.setActionHandler('nexttrack',function(){navigateFromMediaSession('next');});
        navigator.mediaSession.setActionHandler('stop',function(){try{AU.pause();}catch(e){}});
        navigator.mediaSession.setActionHandler('seekto',function(details){
            if(details.fastSeek && 'fastSeek' in AU){AU.fastSeek(details.seekTime);return;}
            if(AU.duration){AU.currentTime=details.seekTime;S.pt=details.seekTime;renderProgress();}
        });
        navigator.mediaSession.setActionHandler('seekbackward',function(details){
            AU.currentTime=Math.max(0,(AU.currentTime||0)-(details.seekOffset||10));
        });
        navigator.mediaSession.setActionHandler('seekforward',function(details){
            AU.currentTime=Math.min(AU.duration||0,(AU.currentTime||0)+(details.seekOffset||10));
        });
    }catch(e){}
}

var mediaNavigationBusy = false;

function navigateFromMediaSession(direction) {
    if (mediaNavigationBusy) return;
    mediaNavigationBusy = true;
    var task;
    try {
        if (direction === 'previous') {
            PV(true);
            task = Promise.resolve();
        } else {
            task = Promise.resolve(NX());
        }
    } catch (error) {
        task = Promise.reject(error);
    }
    task.catch(function() {
        S.il = false;
        S.ip = false;
        UB();
        if (typeof showToast === 'function') showToast('Tidak dapat mengganti lagu saat ini');
    }).finally(function() {
        setTimeout(function(){ mediaNavigationBusy = false; }, 250);
    });
}

function updateMediaSessionMetadata(track){
    if(!('mediaSession' in navigator) || !track) return;
    try{
        var cover = (typeof toHDCover==='function') ? toHDCover(track.cover, track.videoId||track.id) : (track.cover||FI);
        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.title || 'MalaMusic',
            artist: track.artist || '',
            album: 'MalaMusic',
            artwork: [
                {src: cover, sizes: '96x96', type: 'image/webp'},
                {src: cover, sizes: '256x256', type: 'image/webp'},
                {src: cover, sizes: '512x512', type: 'image/webp'}
            ]
        });
    }catch(e){}
}

function updateMediaSessionPlaybackState(){
    if(!('mediaSession' in navigator)) return;
    try{
        navigator.mediaSession.playbackState = S.ip ? 'playing' : 'paused';
        if(AU.duration && isFinite(AU.duration)){
            navigator.mediaSession.setPositionState({
                duration: AU.duration,
                playbackRate: AU.playbackRate || 1,
                position: Math.min(AU.currentTime || 0, AU.duration)
            });
        }
    }catch(e){}
}

// ---- VOLUME CONTROL ENGINE (SPOTIFY STYLE) ----
try {
    var storedVol = parseFloat(localStorage.getItem('malamusic_volume'));
    if (!isNaN(storedVol) && storedVol >= 0 && storedVol <= 1) {
        S.volume = storedVol;
    } else {
        S.volume = 1.0;
    }
} catch(e) { S.volume = 1.0; }
S.lastVolume = S.volume > 0 ? S.volume : 1.0;
if (AU) AU.volume = S.volume;

function applyVolume(vol) {
    vol = Math.max(0, Math.min(1, vol));
    S.volume = vol;
    if (AU) AU.volume = vol;
    try { localStorage.setItem('malamusic_volume', String(vol)); } catch(e){}
    updateVolumeUI();
}

function setVolume(valPercent) {
    var vol = parseFloat(valPercent) / 100;
    if (vol > 0) S.lastVolume = vol;
    applyVolume(vol);
}

function toggleMute() {
    var curVol = AU ? AU.volume : S.volume;
    if (curVol > 0) {
        S.lastVolume = curVol;
        applyVolume(0);
    } else {
        applyVolume(S.lastVolume || 1.0);
    }
}

function updateVolumeUI() {
    var curVol = AU ? AU.volume : (S.volume ?? 1.0);
    var pct = Math.round(curVol * 100);

    var volBar = gid('vol-bar');
    if (volBar) volBar.value = pct;

    var volProgress = gid('full-vol-progress');
    if (volProgress) volProgress.style.width = pct + '%';

    var volText = gid('full-vol-text');
    if (volText) volText.innerText = pct + '%';

    var volIcon = gid('full-vol-icon');
    if (volIcon) {
        var iconName = 'volume-2';
        if (pct === 0) iconName = 'volume-x';
        else if (pct < 35) iconName = 'volume-1';
        else iconName = 'volume-2';

        volIcon.setAttribute('data-lucide', iconName);
        if (window.lucide) lucide.createIcons();
    }
}

var PWA_CACHE_SCHEMA_VERSION = 3;
function isStorageMap(value) {
    return value && typeof value === 'object' && !Array.isArray(value);
}
function readStorageMap(key){
    try {
        var parsed = JSON.parse(localStorage.getItem(key) || '{}');
        var isVersioned = parsed && parsed.version === PWA_CACHE_SCHEMA_VERSION && isStorageMap(parsed.data);
        var safe = isVersioned ? parsed.data : (isStorageMap(parsed) && parsed.version === undefined ? parsed : {});
        if (!isVersioned && isStorageMap(safe)) {
            try { localStorage.setItem(key, JSON.stringify({ version: PWA_CACHE_SCHEMA_VERSION, updatedAt: Date.now(), data: safe })); } catch (__) {}
        }
        return safe;
    } catch (_) {
        try { localStorage.removeItem(key); } catch (__) {}
        return {};
    }
}
function writeStorageMap(key, map) {
    var keys = Object.keys(map);
    while (keys.length > 80) {
        delete map[keys.shift()];
    }
    var payload = { version: PWA_CACHE_SCHEMA_VERSION, updatedAt: Date.now(), data: map };
    try {
        localStorage.setItem(key, JSON.stringify(payload));
        return true;
    } catch (_) {
        var retryKeys = Object.keys(map);
        while (retryKeys.length > 10) delete map[retryKeys.shift()];
        try {
            payload.data = map;
            localStorage.setItem(key, JSON.stringify(payload));
            return true;
        } catch (__) {
            return false;
        }
    }
}
var audioUrlCache = readStorageMap('pwa_audio_cache');
var lyricsCache = readStorageMap('pwa_lyrics_cache');

function savePwaCaches() {
    var lyricsSaved = writeStorageMap('pwa_lyrics_cache', lyricsCache);
    var audioSaved = writeStorageMap('pwa_audio_cache', audioUrlCache);
    if (!lyricsSaved) console.warn('[MalaMusic] Lirik tidak dapat disimpan karena quota localStorage.');
    if (!audioSaved) console.warn('[MalaMusic] URL audio tidak dapat disimpan karena quota localStorage.');
}

var hasPrefetchedNext = false;
var isPreloadingNext = false;
var audioLoadSequence = 0;
var endedHandledSequence = 0;
var endedTransitionBusy = false;
var activeAudioTrack = null;
var activeAudioSequence = 0;
var activeAudioIsOffline = false;
var audioStartTimer = null;
var audioRecoveryKey = '';
var audioRecoveryAttempts = 0;
var AUDIO_RESOLVE_TIMEOUT_MS = 25000;
var AUDIO_RESOLVE_MAX_RETRIES = 4;
var audioUrlFetchPromises = {};

function isCurrentAudioSource(){
    return !!activeAudioTrack && activeAudioSequence === audioLoadSequence && S.ct === activeAudioTrack;
}
function clearAudioStartTimer(){
    if(audioStartTimer){ clearTimeout(audioStartTimer); audioStartTimer = null; }
}
function armAudioStartTimer(track, sequence){
    clearAudioStartTimer();
    audioStartTimer = setTimeout(function(){
        audioStartTimer = null;
        if(sequence !== audioLoadSequence || S.ct !== track || !isCurrentAudioSource()) return;
        handleAudioSourceError();
    }, 12000);
}
var prefetchAudioElements = {};

function getTrackId(track) { return track && (track.videoId || track.id); }

function offlineAudioPath(vid){ return '/offline-audio/' + encodeURIComponent(String(vid)); }
function resolveAudioUrl(track) {
    var vid = getTrackId(track);
    var forceOffline = S.playbackMode === 'offline' || S.ps === 'offline';
    if (!vid) return Promise.reject(new Error('Track tidak memiliki ID'));
    if (audioUrlFetchPromises[vid]) return audioUrlFetchPromises[vid];
    audioUrlFetchPromises[vid] = Promise.resolve().then(function(){
        if (typeof caches !== 'undefined') {
            return caches.match(offlineAudioPath(vid)).then(function(hit){ return hit ? offlineAudioPath(vid) : null; }).catch(function(){ return null; });
        }
        return null;
    }).then(function(offlinePath){
        if (offlinePath) return offlinePath;
        if (forceOffline) throw new Error('Offline dan audio belum tersimpan');
        if (audioUrlCache[vid]) return audioUrlCache[vid];
        if (!navigator.onLine) throw new Error('Offline dan audio belum tersimpan');
        var ytUrl = track.ytUrl || ('https://youtube.com/watch?v=' + vid);
        var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        var timeoutId = setTimeout(function(){ if(controller) controller.abort(); }, AUDIO_RESOLVE_TIMEOUT_MS);
        var requestOptions = {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({query: ytUrl})
        };
        if (controller) requestOptions.signal = controller.signal;
        function requestResolver(attempt){
            return fetch(API.ytplay, requestOptions).then(function(r){
                if (!r.ok) {
                    var httpError = new Error('Audio resolver HTTP ' + r.status);
                    httpError.status = r.status;
                    throw httpError;
                }
                return r.json();
            }).then(function(d){
                if (!(d && d.status && d.result && d.result.download && d.result.download.audio)) {
                    throw new Error('URL audio tidak tersedia');
                }
                return d;
            }).catch(function(err){
                var status = err && err.status;
                var retryable = !status || status >= 500;
                if (attempt < AUDIO_RESOLVE_MAX_RETRIES && retryable && !(controller && controller.signal.aborted)) {
                    var retryDelay = Math.min(700 * Math.pow(2, attempt), 4000);
                    return new Promise(function(resolve){ setTimeout(resolve, retryDelay); }).then(function(){ return requestResolver(attempt + 1); });
                }
                throw err;
            });
        }
        return requestResolver(0).then(function(d){
            var url = d.result.download.audio;
            var reusedBy = Object.keys(audioUrlCache).find(function(ownerId){ return ownerId !== vid && audioUrlCache[ownerId] === url; });
            if (reusedBy) {
                var staleError = new Error('Resolver mengembalikan stream track lain');
                staleError.code = 'STALE_AUDIO_URL';
                throw staleError;
            }
            audioUrlCache[vid] = url;
            savePwaCaches();
            return url;
        }).finally(function(){ clearTimeout(timeoutId); });
    }).finally(function(){ delete audioUrlFetchPromises[vid]; });
    return audioUrlFetchPromises[vid];
}

function prefetchTrackAudio(track) {
    var vid = getTrackId(track);
    if (S.playbackMode === 'offline' || S.ps === 'offline') return;
    if (!vid || prefetchAudioElements[vid]) return;
    resolveAudioUrl(track).then(function(rawUrl){
        if (prefetchAudioElements[vid]) return;
        var source = '/api/proxy-audio?url=' + encodeURIComponent(rawUrl);
        var audio = new Audio();
        audio.preload = 'auto';
        audio.src = source;
        audio.load();
        prefetchAudioElements[vid] = audio;
    }).catch(function(){});
}

function preloadAdjacentTracks() {
    if (S.dataSaver) return;
    if (!S.pl || !S.pl.length || S.pi < 0) return;
    var adjacent = [];
    if (S.pl.length > 1) {
        if (S.isShuffle) {
            var nextIndex = (S.pi + 1) % S.pl.length;
            var prevIndex = (S.pi - 1 + S.pl.length) % S.pl.length;
            adjacent.push(S.pl[nextIndex], S.pl[prevIndex]);
        } else {
            if (S.pi + 1 < S.pl.length) adjacent.push(S.pl[S.pi + 1]);
            if (S.pi - 1 >= 0) adjacent.push(S.pl[S.pi - 1]);
        }
    }
    adjacent.forEach(prefetchTrackAudio);
}

function checkAndPreloadNext() {
    if (hasPrefetchedNext) return;
    if (S.pd > 0 && (S.pd - S.pt <= 40 || S.pt >= S.pd * 0.7)) {
        hasPrefetchedNext = true;
        preloadAdjacentTracks();
    }
}

async function triggerPreloadNextTrack(){
    preloadAdjacentTracks();
}

function SP(){
    ST();
    S.iv=setInterval(function(){
        if(!AU.paused){S.pt=AU.currentTime||0;S.pd=AU.duration||0;renderProgress();}
    },100);
}
function ST(){if(S.iv){clearInterval(S.iv);S.iv=null;}}
function renderProgress(){
    var p=S.pd>0?(S.pt/S.pd)*100:0;
    var mp=gid('mini-progress'),fp=gid('full-progress'),sb=gid('seek-bar'),tc=gid('time-curr'),td=gid('time-dur');
    if(mp)mp.style.width=p+'%';if(fp)fp.style.width=p+'%';if(sb)sb.value=p;if(tc)tc.innerText=fm(S.pt);if(td)td.innerText=fm(S.pd);ULH(S.pt);

    var mcp = gid('mini-circle-progress');
    if (mcp) {
        var totalLen = 131.95;
        var offset = totalLen * (1 - (p / 100));
        mcp.style.strokeDashoffset = Math.max(0, offset);
    }

    checkAutoNextTransition();
}

function checkAutoNextTransition() {
    if (!S.ip || AU.paused || !S.pd || S.pd <= 0) {
        resetAutoNextTransition();
        return;
    }

    var remaining = S.pd - S.pt;
    var windowSec = Math.min(10, S.pd > 0 ? S.pd : 10);

    if (remaining > 0 && remaining <= windowSec) {
        var nextTrack = null;
        if (S.isShuffle && S.pl && S.pl.length > 1) {
            var ni = (S.pi + 1) % S.pl.length;
            nextTrack = S.pl[ni];
        } else if (S.pl && S.pi + 1 < S.pl.length) {
            nextTrack = S.pl[S.pi + 1];
        }

        if (nextTrack) {
            var progress = Math.min(100, Math.max(0, ((windowSec - remaining) / windowSec) * 100));
            updateAutoNextTransition(progress, nextTrack);
            return;
        }
    }
    resetAutoNextTransition();
}

function updateAutoNextTransition(progress, nextTrack) {
    if (!nextTrack || progress <= 0) {
        resetAutoNextTransition();
        return;
    }

    var nextVid = nextTrack.videoId || nextTrack.id;
    var nextCover = toHDCover(nextTrack.cover, nextVid);
    var nextTitle = nextTrack.title || '';
    var nextArtist = nextTrack.artist || '';
    var remainingSec = Math.max(1, Math.ceil(S.pd - S.pt));

    var opacityRatio = (progress / 100).toFixed(2);
    var curOpacityRatio = (1 - progress / 100).toFixed(2);

    // 1. Miniplayer Transition Overlay
    var miniOverlay = gid('mini-next-overlay');
    var miniCover = gid('mini-cover-next');
    var miniTitle = gid('mini-title-next');
    var miniArtist = gid('mini-artist-next');
    var miniBadge = gid('mini-next-badge');

    if (miniOverlay) {
        miniOverlay.style.display = 'flex';
        miniOverlay.style.clipPath = 'none';
        miniOverlay.style.webkitClipPath = 'none';
        if (miniCover) {
            if (miniCover.getAttribute('data-vid') !== nextVid) {
                miniCover.src = nextCover;
                miniCover.onerror = function(){ handleImgError(this); };
                miniCover.setAttribute('data-vid', nextVid);
            }
            var curMiniCover = gid('mini-cover');
            if (curMiniCover) {
                miniCover.style.animationPlayState = curMiniCover.style.animationPlayState || 'running';
            }
        }
        if (miniTitle) miniTitle.innerText = nextTitle;
        if (miniArtist) miniArtist.innerText = nextArtist;
        if (miniBadge) miniBadge.innerText = 'NEXT (' + remainingSec + 's)';

        miniOverlay.style.maskImage = 'none';
        miniOverlay.style.webkitMaskImage = 'none';
        miniOverlay.style.opacity = opacityRatio;
    }

    // 2. Full Player Top Header Artist & Tag
    var fullHeaderTag = gid('full-header-tag');
    var fullHeaderArtist = gid('full-header-artist');
    if (fullHeaderTag) {
        fullHeaderTag.innerText = 'BERIKUTNYA (' + remainingSec + 's)';
    }
    if (fullHeaderArtist) {
        fullHeaderArtist.innerText = progress >= 50 ? nextArtist : (S.ct ? S.ct.artist : '');
    }

    // 3. Full Player Background Blur Artwork
    var fullBgNext = gid('full-bg-artwork-next');
    if (fullBgNext) {
        fullBgNext.style.display = 'block';
        if (fullBgNext.getAttribute('data-vid') !== nextVid) {
            fullBgNext.src = nextCover;
            fullBgNext.onerror = function(){ handleImgError(this); };
            fullBgNext.setAttribute('data-vid', nextVid);
        }
        fullBgNext.style.maskImage = 'none';
        fullBgNext.style.webkitMaskImage = 'none';
        fullBgNext.style.opacity = opacityRatio;
    }

    // 4. Full Player Cover Artwork (Clean crossfade transition in-place, no mask crop)
    var fullCoverCur = gid('full-cover');
    var fullCoverNext = gid('full-cover-next-overlay');
    var fullCoverImg = gid('full-cover-next-img');

    if (fullCoverCur) {
        fullCoverCur.style.opacity = curOpacityRatio;
        fullCoverCur.style.transform = 'none';
    }

    if (fullCoverNext) {
        fullCoverNext.style.display = 'block';
        if (fullCoverImg && fullCoverImg.getAttribute('data-vid') !== nextVid) {
            fullCoverImg.src = nextCover;
            fullCoverImg.onerror = function(){ handleImgError(this); };
            fullCoverImg.setAttribute('data-vid', nextVid);
            fullCoverImg.style.transform = 'none';
            if (fullCoverImg.style.display === 'none') fullCoverImg.style.display = 'block';
        }
        fullCoverNext.style.maskImage = 'none';
        fullCoverNext.style.webkitMaskImage = 'none';
        fullCoverNext.style.opacity = opacityRatio;
    }

    // 5. Full Player Metadata Title & Artist
    var fullMetaCurrent = gid('full-meta-current');
    var fullMetaNext = gid('full-meta-next');
    var fullTitleNext = gid('full-title-next');
    var fullArtistNext = gid('full-artist-next');
    var fullBadgeNext = gid('full-next-countdown-badge');

    if (fullMetaNext) {
        if (fullTitleNext) fullTitleNext.innerText = nextTitle;
        if (fullArtistNext) fullArtistNext.innerText = nextArtist;
        if (fullBadgeNext) fullBadgeNext.innerText = 'NEXT (' + remainingSec + 's)';

        fullMetaNext.style.display = 'flex';
        fullMetaNext.style.maskImage = 'none';
        fullMetaNext.style.webkitMaskImage = 'none';
        fullMetaNext.style.opacity = opacityRatio;
    }
    if (fullMetaCurrent) {
        fullMetaCurrent.style.opacity = curOpacityRatio;
    }
}

function resetAutoNextTransition() {
    var miniOverlay = gid('mini-next-overlay');
    if (miniOverlay) {
        miniOverlay.style.maskImage = 'none';
        miniOverlay.style.webkitMaskImage = 'none';
        miniOverlay.style.opacity = '0';
        miniOverlay.style.display = 'none';
    }

    var fullHeaderTag = gid('full-header-tag');
    if (fullHeaderTag) {
        fullHeaderTag.innerText = 'SEDANG DIPUTAR';
    }
    var fullHeaderArtist = gid('full-header-artist');
    if (fullHeaderArtist) {
        fullHeaderArtist.innerText = S.ct ? S.ct.artist : '';
        fullHeaderArtist.style.opacity = '1';
    }

    var fullBgNext = gid('full-bg-artwork-next');
    if (fullBgNext) {
        fullBgNext.style.maskImage = 'none';
        fullBgNext.style.webkitMaskImage = 'none';
        fullBgNext.style.opacity = '0';
        fullBgNext.style.display = 'none';
    }

    var fullCoverCur = gid('full-cover');
    if (fullCoverCur) {
        fullCoverCur.style.opacity = '1';
        fullCoverCur.style.transform = '';
    }

    var fullCoverNext = gid('full-cover-next-overlay');
    if (fullCoverNext) {
        fullCoverNext.style.maskImage = 'none';
        fullCoverNext.style.webkitMaskImage = 'none';
        fullCoverNext.style.opacity = '0';
        fullCoverNext.style.display = 'none';
    }

    var fullCoverImg = gid('full-cover-next-img');
    if (fullCoverImg) {
        fullCoverImg.style.transform = '';
        fullCoverImg.style.maskImage = 'none';
        fullCoverImg.style.webkitMaskImage = 'none';
        fullCoverImg.style.opacity = '0';
        fullCoverImg.style.display = 'none';
    }

    var fullMetaCurrent = gid('full-meta-current');
    if (fullMetaCurrent) {
        fullMetaCurrent.style.opacity = '1';
    }

    var fullMetaNext = gid('full-meta-next');
    if (fullMetaNext) {
        fullMetaNext.style.maskImage = 'none';
        fullMetaNext.style.webkitMaskImage = 'none';
        fullMetaNext.style.opacity = '0';
        fullMetaNext.style.display = 'none';
    }
}

function updateServerLoadingToast() {
    var toast = gid('server-loading-toast');
    if (S.il) {
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'server-loading-toast';
            toast.className = 'fixed top-3 left-1/2 -translate-x-1/2 z-[350] bg-black/85 text-white/90 px-3 py-1 rounded-full border border-white/10 shadow-sm flex items-center gap-2 transition-all duration-150 transform -translate-y-2 opacity-0 pointer-events-none text-[11px] font-normal';
            toast.innerHTML = `
                <div class="w-2.5 h-2.5 border border-white/30 border-t-white rounded-full animate-spin shrink-0"></div>
                <span>Menyiapkan lagu...</span>
            `;
            document.body.appendChild(toast);
        }
        setTimeout(function() {
            if (toast) {
                toast.classList.remove('-translate-y-2', 'opacity-0', 'pointer-events-none');
                toast.classList.add('translate-y-0', 'opacity-100');
            }
        }, 20);
    } else {
        if (toast) {
            toast.classList.remove('translate-y-0', 'opacity-100');
            toast.classList.add('-translate-y-2', 'opacity-0', 'pointer-events-none');
            setTimeout(function() {
                if (toast && !S.il && toast.parentElement) {
                    toast.remove();
                }
            }, 150);
        }
    }
}

function UB(){
    var mi=gid('mini-play-btn'),fu=gid('full-play-btn');
    var coverOverlay=gid('full-cover-overlay'),coverIcon=gid('full-cover-icon'),coverText=gid('full-cover-text');
    var fullCover=gid('full-cover');
    var statusTag=gid('full-status-tag');
    var playWrap=gid('full-play-btn-wrap');

    updateServerLoadingToast();
    updateMediaSessionPlaybackState();

    var miniCover = gid('mini-cover');
    if (miniCover) {
        miniCover.style.animationPlayState = S.ip ? 'running' : 'paused';
    }

    if(!mi||!fu)return;

    var accent = S.currentAccentColor || '#f43f5e';

    if(S.il){
        mi.innerHTML='<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>';
        fu.innerHTML='<div class="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>';

        if(coverOverlay){
            coverOverlay.classList.remove('opacity-0', 'pointer-events-none');
            coverOverlay.classList.add('opacity-100');
            if(coverIcon) coverIcon.innerHTML='<div class="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-900/80 border border-white/10 p-2"><img src="/logo.png" class="w-8 h-8 object-contain animate-pulse" alt="Logo"/><div class="absolute inset-0 border-2 border-white/10 border-t-white rounded-2xl animate-spin"></div></div>';
            if(coverText) {
                coverText.className = 'text-xs font-semibold text-zinc-300 leading-relaxed text-center drop-shadow-md px-2';
                coverText.innerText='Sabar yaa, server kami perlu waktu buat siapin lagu';
            }
        }
        if(fullCover){
            fullCover.style.transform='scale(0.95)';
            fullCover.style.filter='brightness(0.75)';
        }
        if(statusTag){
            statusTag.classList.remove('hidden', 'bg-white/10', 'text-white/80', 'border-white/20');
            statusTag.classList.add('inline-block', 'bg-white/20', 'text-white', 'border-white/30', 'animate-pulse');
            statusTag.innerText='MENYIAPKAN';
        }
    }
    else if(S.ip){
        mi.innerHTML='<svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
        fu.innerHTML='<svg class="w-7 h-7 fill-current" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';

        if(coverOverlay){
            coverOverlay.classList.remove('opacity-100');
            coverOverlay.classList.add('opacity-0', 'pointer-events-none');
        }
        if(fullCover){
            fullCover.style.transform='scale(1)';
            fullCover.style.filter='brightness(1)';
        }
        if(statusTag){
            statusTag.classList.add('hidden');
            statusTag.classList.remove('inline-block', 'animate-pulse');
        }
    }
    else{
        mi.innerHTML='<svg class="w-4 h-4 fill-current ml-0.5" viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"/></svg>';
        fu.innerHTML='<svg class="w-7 h-7 fill-current ml-0.5" viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"/></svg>';

        if(coverOverlay){
            if(S.ct){
                coverOverlay.classList.remove('opacity-0', 'pointer-events-none');
                coverOverlay.classList.add('opacity-100');
                if(coverIcon) coverIcon.innerHTML='<svg class="w-12 h-12 text-white/90" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor"/></svg>';
                if(coverText) coverText.innerText='DIPAUSE';
            }else{
                coverOverlay.classList.remove('opacity-100');
                coverOverlay.classList.add('opacity-0', 'pointer-events-none');
            }
        }
        if(fullCover){
            if(S.ct){
                fullCover.style.transform='scale(0.96)';
                fullCover.style.filter='brightness(0.85)';
            }else{
                fullCover.style.transform='scale(1)';
                fullCover.style.filter='brightness(1)';
            }
        }
        if(statusTag){
            if(S.ct){
                statusTag.classList.remove('hidden', 'bg-white/20', 'animate-pulse');
                statusTag.classList.add('inline-block', 'bg-white/10', 'text-white/80', 'border-white/20');
                statusTag.innerText='PAUSED';
            }else{
                statusTag.classList.add('hidden');
                statusTag.classList.remove('inline-block');
            }
        }
    }

    if(playWrap){
        playWrap.style.backgroundColor = accent;
    }
    if(mi){
        mi.style.borderColor = accent + '88';
        mi.style.color = '#ffffff';
    }

    var miniBeats = gid('mini-beats-bg');
    if(miniBeats) {
        if(S.ip) {
            miniBeats.classList.remove('opacity-0');
            miniBeats.classList.add('opacity-100');
            miniBeats.querySelectorAll('.mini-beat-bar').forEach(function(b){ b.style.animationPlayState = 'running'; });
        } else {
            miniBeats.classList.remove('opacity-100');
            miniBeats.classList.add('opacity-30');
            miniBeats.querySelectorAll('.mini-beat-bar').forEach(function(b){ b.style.animationPlayState = 'paused'; });
        }
    }

    try {
        if (typeof Home !== 'undefined' && typeof Home.renderActive === 'function') Home.renderActive();
        if (typeof Album !== 'undefined' && typeof Album.renderActive === 'function') Album.renderActive();
        if (typeof Search !== 'undefined' && typeof Search.renderActive === 'function') Search.renderActive();
        if (typeof Artist !== 'undefined' && typeof Artist.renderActive === 'function') Artist.renderActive();
        if (typeof App !== 'undefined' && typeof App.renderActive === 'function') App.renderActive();
    } catch(e) {}
}

function setMetaTag(name, content, isProperty) {
    var attr = isProperty ? 'property' : 'name';
    var el = document.querySelector('meta[' + attr + '="' + name + '"]');
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
}

function updateCoverWithTransition(imgEl, newSrc, origCover, useScale, videoId) {
    if (!imgEl) return;
    var fallback = 'https://i.ytimg.com/vi_webp/' + encodeURIComponent(String(videoId || '')) + '/hqdefault.webp';
    if (!videoId) fallback = FI;
    var candidates = [];
    [newSrc, origCover, fallback].forEach(function(value) {
        var safe = safeMediaUrl(value, '');
        if (safe && candidates.indexOf(safe) === -1) candidates.push(safe);
    });
    if (!candidates.length) candidates.push(FI);
    var target = candidates[0];
    var previousSrc = imgEl.currentSrc || imgEl.getAttribute('src') || '';
    if (/\/logo(?:-mark)?\.png(?:\?|$)/i.test(previousSrc) || previousSrc === FI) previousSrc = '';
    var transitionToken = String(Date.now()) + ':' + Math.random().toString(36).slice(2);
    if (origCover) imgEl.setAttribute('data-original-src', safeMediaUrl(origCover, fallback));
    imgEl.removeAttribute('data-img-retry');

    var currentActive = imgEl.getAttribute('data-active-hd-src');
    if (currentActive === target && imgEl.src && imgEl.src.indexOf(target) !== -1) {
        imgEl.style.opacity = '1';
        if (useScale) imgEl.style.transform = 'scale(1)';
        return;
    }

    imgEl.setAttribute('data-active-hd-src', target);
    imgEl.setAttribute('data-cover-transition', transitionToken);
    imgEl.style.transition = useScale ? 'opacity 0.28s cubic-bezier(0.25, 1, 0.5, 1), transform 0.28s cubic-bezier(0.25, 1, 0.5, 1)' : 'opacity 0.28s cubic-bezier(0.25, 1, 0.5, 1)';
    // Keep artwork visible while the next CDN image is verified; never flash an empty cover.
    imgEl.style.opacity = '1';
    if (useScale) imgEl.style.transform = 'scale(0.985)';

    function isCurrentTransition() {
        return imgEl.getAttribute('data-cover-transition') === transitionToken;
    }
    var candidateIndex = 0;
    function restoreCover() {
        if (!isCurrentTransition()) return;
        if (candidateIndex + 1 < candidates.length) {
            candidateIndex += 1;
            target = candidates[candidateIndex];
            imgEl.src = target;
            tempImg.src = target;
            return;
        }
        var keep = previousSrc || FI;
        imgEl.src = keep;
        imgEl.style.opacity = '1';
        if (useScale) imgEl.style.transform = 'scale(1)';
    }
    imgEl.onerror = restoreCover;
    imgEl.src = target;

    var tempImg = new Image();
    tempImg.onload = function() {
        if (!isCurrentTransition()) return;
        imgEl.src = target;
        imgEl.style.opacity = '1';
        if (useScale) imgEl.style.transform = 'scale(1)';
    };
    tempImg.onerror = restoreCover;
    tempImg.src = target;
}

function updateOG(title, cover, artist) {
    if (title && cover) {
        var fullTitle = artist ? (title + ' - ' + artist) : title;
        var docTitle = fullTitle + ' | MalaMusic';
        var description = 'Dengarkan ' + fullTitle + ' di MalaMusic';

        document.title = docTitle;

        setMetaTag('og:title', fullTitle, true);
        setMetaTag('og:description', description, true);
        setMetaTag('og:image', cover, true);
        setMetaTag('og:image:width', '600', true);
        setMetaTag('og:image:height', '600', true);
        setMetaTag('og:url', location.href, true);
        setMetaTag('twitter:card', 'summary_large_image', false);
        setMetaTag('twitter:title', fullTitle, false);
        setMetaTag('twitter:description', description, false);
        setMetaTag('twitter:image', cover, false);

    } else {
        var defaultCover = 'https://www.gobox.my.id/file/R0ym4wqfznmp.png';
        document.title = 'MalaMusic';

        setMetaTag('og:title', 'MalaMusic', true);
        setMetaTag('og:description', 'MalaMusic - Web Music Player', true);
        setMetaTag('og:image', defaultCover, true);
        setMetaTag('og:image:width', '600', true);
        setMetaTag('og:image:height', '600', true);
        setMetaTag('og:url', location.href, true);
        setMetaTag('twitter:card', 'summary_large_image', false);
        setMetaTag('twitter:title', 'MalaMusic', false);
        setMetaTag('twitter:description', 'MalaMusic - Web Music Player', false);
        setMetaTag('twitter:image', defaultCover, false);

    }
}

function updateOGForArtist(artistName, coverUrl) {
    if (!artistName) return;
    var name = cn(artistName);
    var docTitle = name + ' - Artist | MalaMusic';
    var description = 'Dengarkan lagu dan album terbaik dari ' + name + ' di MalaMusic';
    var cover = (coverUrl && coverUrl !== FI) ? coverUrl : 'https://www.gobox.my.id/file/R0ym4wqfznmp.png';

    document.title = docTitle;

    setMetaTag('og:title', name + ' (Artist)', true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:image', cover, true);
    setMetaTag('og:image:width', '600', true);
    setMetaTag('og:image:height', '600', true);
    setMetaTag('og:url', location.href, true);
    setMetaTag('twitter:card', 'summary_large_image', false);
    setMetaTag('twitter:title', name + ' (Artist)', false);
    setMetaTag('twitter:description', description, false);
    setMetaTag('twitter:image', cover, false);

}

function updateOGForAlbum(albumTitle, coverUrl, artistName) {
    if (!albumTitle) return;
    var title = albumTitle;
    var fullTitle = artistName ? (title + ' - ' + artistName) : title;
    var docTitle = fullTitle + ' - Album | MalaMusic';
    var description = 'Dengarkan album ' + fullTitle + ' di MalaMusic';
    var cover = (coverUrl && coverUrl !== FI) ? coverUrl : 'https://www.gobox.my.id/file/R0ym4wqfznmp.png';

    document.title = docTitle;

    setMetaTag('og:title', fullTitle + ' (Album)', true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:image', cover, true);
    setMetaTag('og:image:width', '600', true);
    setMetaTag('og:image:height', '600', true);
    setMetaTag('og:url', location.href, true);
    setMetaTag('twitter:card', 'summary_large_image', false);
    setMetaTag('twitter:title', fullTitle + ' (Album)', false);
    setMetaTag('twitter:description', description, false);
    setMetaTag('twitter:image', cover, false);

}

function UU(){
    resetAutoNextTransition();
    if(!S.ct) {
        updateOG(null);
        if(typeof MP !== 'undefined' && MP.hide) MP.hide();
        return;
    }
    var origCover = S.ct.cover || '';
    var hdCover = toHDCover(origCover, S.ct.videoId || S.ct.id);

    var mc=gid('mini-cover'),mt=gid('mini-title'),ma=gid('mini-artist'),fc=gid('full-cover'),ft=gid('full-title'),fa=gid('full-artist'),fh=gid('full-header-artist'),fb=gid('full-bg-blur'),fba=gid('full-bg-artwork');
    if(mc) updateCoverWithTransition(mc, hdCover, origCover, false, S.ct.videoId || S.ct.id);
    if(mt) mt.innerText=S.ct.title;
    if(ma) ma.innerText=S.ct.artist;
    if(fc) updateCoverWithTransition(fc, hdCover, origCover, true, S.ct.videoId || S.ct.id);
    if(ft) ft.innerText=S.ct.title;
    if(fa) fa.innerText=S.ct.artist;
    if(fh) fh.innerText=S.ct.artist;
    if(fb) updateCoverWithTransition(fb, hdCover, origCover, false, S.ct.videoId || S.ct.id);
    if(fba) updateCoverWithTransition(fba, hdCover, origCover, false, S.ct.videoId || S.ct.id);

    updateOG(S.ct.title, hdCover, S.ct.artist);
    if(typeof updateLikeButtons==='function')updateLikeButtons();
    if(typeof updateOfflineButtons==='function')updateOfflineButtons();
    if(typeof MP !== 'undefined' && MP.updateBeats) MP.updateBeats(S.ct);
    if(typeof FullPlayer !== 'undefined' && FullPlayer.updateBeats) FullPlayer.updateBeats(S.ct);
}

function PK(s,i){
    var l=[];
    S.playbackMode = s === 'offline' ? 'offline' : 'online';
    if(s==='home1')l=(S.ht||[]).slice(0,6);
    else if(s==='home2')l=(S.ht||[]).slice(6,12);
    else if(s==='homecat')l=S.hc||[];
    else if(s==='search')l=S.sr||[];
    else if(s==='rec0')l=(S.rec0||[]).slice(0,6);
    else if(s==='rec1')l=(S.rec1||[]).slice(0,6);
    else if(s==='rec2')l=(S.rec2||[]).slice(0,6);
    else if(s==='liked')l=typeof getLikedSongs==='function'?getLikedSongs():[];
    else if(s==='offline')l=typeof getOfflineSongs==='function'?getOfflineSongs():[];
    else if(s==='queue')l=S.pl||[];
    else if(S.pl && S.pl.length > 0)l=S.pl;

    if((!l || !l[i]) && S.pl && S.pl[i]){
        l = S.pl;
    }

    if(!l || !l[i]) return;

    if(S.ct && ((S.ct.id && S.ct.id === l[i].id) || (S.ct.videoId && S.ct.videoId === l[i].videoId)) && AU.src && !AU.paused){
        if(typeof MP !== 'undefined' && MP.togglePlay) { MP.togglePlay(); return; }
    }

    S.ps=s;S.pl=l;S.pi=i;S.ct=l[i];
    var url=location.origin+'/play/'+(S.ct.videoId||S.ct.id);history.pushState({},'',url);
    UU();MP.show();S.il=true;UB();
    
    resetLyricsUI(S.ct.videoId||S.ct.id);
    loadTrack(S.ct);
}

function saveRecentTrack(track){
    if(!track || !(track.videoId || track.id)) return;
    try {
        var id = track.videoId || track.id;
        var current = JSON.parse(localStorage.getItem('mala_recent_tracks') || '[]');
        current = current.filter(function(item){ return (item.videoId || item.id) !== id; });
        current.unshift({ id:id, videoId:id, title:track.title || 'Lagu', artist:track.artist || 'MalaMusic', cover:track.cover || FI, artistId:track.artistId || '', ytUrl:track.ytUrl || ('https://youtube.com/watch?v=' + id), playedAt:Date.now() });
        localStorage.setItem('mala_recent_tracks', JSON.stringify(current.slice(0, 12)));
    } catch(e) {}
}
function getRecentTracks(){
    try { return JSON.parse(localStorage.getItem('mala_recent_tracks') || '[]'); } catch(e) { return []; }
}

function loadTrack(track,resumeAt,isRecoveryRetry){
    if(!track)return;
    endedHandledSequence = 0;
    endedTransitionBusy = false;
    var recoveryKey = trackId(track);
    if (!isRecoveryRetry || audioRecoveryKey !== recoveryKey) {
        audioRecoveryKey = recoveryKey;
        audioRecoveryAttempts = 0;
    }
    var loadSequence = ++audioLoadSequence;
    clearAudioStartTimer();
    activeAudioTrack = null;
    activeAudioSequence = 0;
    activeAudioIsOffline = false;
    saveRecentTrack(track);
    if (window.MalaFirebase) MalaFirebase.log('play_track', { track_id: String(track.videoId || track.id || '').slice(0, 80) });
    hasPrefetchedNext = false;
    isPreloadingNext = false;
    ST();
    try{
        AU.pause();
        AU.removeAttribute('src');
        AU.load();
    }catch(e){}
    updateMediaSessionMetadata(track);
    fetchAudioAndPlay(track,resumeAt,loadSequence);
    // Resolusi URL lagu sekitar dilakukan di background agar Next/Previous tidak menunggu dari awal.
    setTimeout(preloadAdjacentTracks, 80);
}

async function fetchAudioAndPlay(track,resumeAt,loadSequence){
    S.il=true;UB();
    function isCurrentLoad(){ return loadSequence === audioLoadSequence && S.ct === track; }
    var vid = track.videoId || track.id;
    try{
        var audioUrl = await resolveAudioUrl(track);
        if(!isCurrentLoad())return;
        if(audioUrl){
            var preloaded = prefetchAudioElements[vid];
            var isOfflineBinary = String(audioUrl).indexOf('/offline-audio/') === 0;
            var nextSrc = isOfflineBinary ? audioUrl : ('/api/proxy-audio?url=' + encodeURIComponent(audioUrl));
            if (preloaded && preloaded.src) {
                nextSrc = preloaded.src;
                delete prefetchAudioElements[vid];
            }
            activeAudioTrack = track;
            activeAudioSequence = loadSequence;
            activeAudioIsOffline = isOfflineBinary;
            if (typeof audioCtx !== 'undefined' && audioCtx) {
                AU.src = nextSrc;
            } else {
                AU.removeAttribute('crossorigin');
                AU.src = nextSrc;
            }
            armAudioStartTimer(track, loadSequence);
            if(resumeAt){
                var onMeta=function(){
                    AU.removeEventListener('loadedmetadata',onMeta);
                    if(!isCurrentLoad()) return;
                    AU.currentTime=resumeAt;
                };
                AU.addEventListener('loadedmetadata',onMeta);
            }
            var p = AU.play();
            if(p !== undefined && p.then){
                p.then(function(){
                    if(!isCurrentLoad()) return;
                    S.il = false;
                    S.ip = true;
                    UB();
                }).catch(function(err){
                    if(!isCurrentLoad()) return;
                    clearAudioStartTimer();
                    // Browser blocked autoplay or requires user interaction
                    S.il = false;
                    S.ip = false;
                    UB();
                });
            } else {
                if(!isCurrentLoad()) return;
                S.il = false;
                UB();
            }
            }else{
            if(!isCurrentLoad()) return;
            S.il=false;S.ip=false;UB();
            if (navigator.onLine) {
                if(typeof showToast === 'function') showToast('Audio belum tersedia. Coba lagi sebentar.');
            } else if(typeof showToast === 'function') {
                showToast('Mode Offline: Lagu ini belum tersimpan di cache PWA');
            }
        }
    }catch(e){
        if(isCurrentLoad()){
            S.il=false;S.ip=false;UB();
            if (navigator.onLine) {
                if(typeof showToast === 'function') showToast('Audio belum tersedia. Coba lagi sebentar.');
            } else if(typeof showToast === 'function') {
                showToast('Mode Offline: Lagu ini belum tersimpan di cache PWA');
            }
        }
    }
}

function handleAudioSourceError(){
    clearAudioStartTimer();
    var failedTrack = activeAudioTrack;
    var failedSequence = activeAudioSequence;
    if (!failedTrack || !failedSequence) return;
    if (activeAudioIsOffline) {
        activeAudioTrack = null;
        activeAudioSequence = 0;
        activeAudioIsOffline = false;
        S.il = false; S.ip = false; UB();
        if(typeof showToast === 'function') showToast('File offline tidak dapat diputar. Download ulang saat online.');
        return;
    }
    if (audioRecoveryAttempts >= 2) {
        activeAudioTrack = null;
        activeAudioSequence = 0;
        S.il = false; S.ip = false; UB();
        if(typeof showToast === 'function') showToast('Lagu gagal dimuat. Coba lagi saat jaringan stabil.');
        return;
    }
    audioRecoveryAttempts += 1;
    var vid = getTrackId(failedTrack);
    if (vid && audioUrlCache[vid]) {
        delete audioUrlCache[vid];
        savePwaCaches();
    }
    activeAudioTrack = null;
    activeAudioSequence = 0;
    activeAudioIsOffline = false;
    S.il = true; S.ip = false; UB();
    setTimeout(function(){
        if (S.ct === failedTrack && audioLoadSequence === failedSequence) loadTrack(failedTrack, undefined, true);
    }, 0);
}

function TP(){
    if(!S.ct)return;
    if(!AU.src || !isCurrentAudioSource()){
        loadTrack(S.ct);
        return;
    }
    if(AU.paused){
        S.il=true;UB();
        var p = AU.play();
        if(p !== undefined && p.then){
            p.then(function(){
                S.il = false;
                S.ip = true;
                UB();
            }).catch(function(){
                S.il = false;
                S.ip = false;
                UB();
            });
        }
    } else {
        AU.pause();
        S.ip = false;
        S.il = false;
        UB();
    }
}

async function fetchAutoNextRecommendations(track, expectedLoadSequence) {
    if (!track) return false;
    try {
        var query = track.artist ? (track.artist + ' songs') : track.title;
        var r = await fetch(API.search + '?query=' + encodeURIComponent(query));
        var d = await r.json();
        if (d && d.status && d.result && d.result.songs && d.result.songs.length > 0) {
            var currId = track.videoId || track.id;
            var existingIds = {};
            (S.pl || []).forEach(function(item){ existingIds[trackId(item)] = true; });
            var newSongs = d.result.songs.filter(function(s) {
                return (s.videoId || s.id) !== currId;
            }).map(normalizeTrack).filter(function(item){
                var id = trackId(item);
                if (!id || existingIds[id]) return false;
                existingIds[id] = true;
                return true;
            });
            if (newSongs.length > 0) {
                if (expectedLoadSequence !== audioLoadSequence || S.ct !== track) return false;
                // Append recommendations; never replace a queue assembled by the user.
                S.pl = (S.pl || []).concat(newSongs);
                S.ps = 'queue';
                return true;
            }
        }
    } catch (e) {}
    return false;
}

async function NX(){
    var expectedLoadSequence = audioLoadSequence;
    var startingTrack = S.ct;
    var offlineQueue = S.playbackMode === 'offline' || S.ps === 'offline';
    if(!S.pl || !S.pl.length){
        if(S.ct){
            S.pl = [S.ct];
            S.pi = 0;
        } else {
            return;
        }
    }

    if(S.pi + 1 >= S.pl.length && S.autoNext && !offlineQueue){
        if(S.ct){
            S.il = true;
            UB();
            var fetched = await fetchAutoNextRecommendations(S.ct, expectedLoadSequence);
            if (expectedLoadSequence !== audioLoadSequence || S.ct !== startingTrack) return;
            S.il = false;
            UB();
            if(!fetched){
                if (S.pl.length > 1 && S.rm !== 'one') PK(S.ps, 0);
                else {
                    S.ip = false; S.il = false; UB();
                    if(typeof showToast === 'function') showToast(offlineQueue ? 'Playlist offline selesai.' : 'Belum ada lagu berikutnya.');
                }
                return;
            }
        }
    }

    if(S.isShuffle && S.pl.length > 1){
        var ri = S.pi;
        var attempts = 0;
        while(ri === S.pi && attempts < 10){
            ri = Math.floor(Math.random() * S.pl.length);
            attempts++;
        }
        PK(S.ps, ri);
    } else {
        var ni = S.pi + 1;
        if(ni >= S.pl.length){ ni = 0; }
        PK(S.ps, ni);
    }
}
function PV(forcePrev){
    if(!S.pl || !S.pl.length)return;
    // "Smart restart" (restart current track if already played >3s) only applies
    // to the on-screen prev button. Hardware/notification/lockscreen prev (forcePrev=true)
    // must always jump to the actual previous track, matching what people expect
    // from a media-session control.
    if(!forcePrev && S.pt > 3){
        AU.currentTime = 0;
        return;
    }
    var pi = S.pi - 1;
    if(pi < 0) pi = S.pl.length - 1;
    PK(S.ps, pi);
}
function SK(v){
    if(AU.duration){
        var ct=(parseFloat(v)/100)*AU.duration;
        AU.currentTime=ct;
        S.pt=ct;
        renderProgress();
    }
}
function TR(){var b=gid('btn-repeat'),o=gid('repeat-one');if(S.rm==='all'){S.rm='one';if(b)b.classList.add('text-white');if(o)o.classList.remove('hidden');}else{S.rm='all';if(b)b.classList.remove('text-white');if(o)o.classList.add('hidden');}}
function updateShuffleUI(){
    var btn = gid('full-shuffle-btn');
    var dot = gid('full-shuffle-dot');
    var accent = S.currentAccentColor || '#f43f5e';
    if(btn){
        if(S.isShuffle){
            btn.style.color = accent;
            btn.classList.add('scale-110');
            if(dot){
                dot.classList.remove('hidden');
                dot.style.backgroundColor = accent;
            }
        }else{
            btn.style.color = '#6b7280';
            btn.classList.remove('scale-110');
            if(dot) dot.classList.add('hidden');
        }
    }
}
function toggleAutoNext(){
    S.autoNext = !S.autoNext;
    try { localStorage.setItem('malamusic_auto_next', S.autoNext); } catch(e) {}
    if(typeof showToast === 'function'){
        showToast(S.autoNext ? 'Auto Next diaktifkan' : 'Auto Next dimatikan');
    }
}
function SF(){
    S.isShuffle = !S.isShuffle;
    updateShuffleUI();
    if(typeof showToast === 'function'){
        showToast(S.isShuffle ? 'Mode acak (Shuffle) diaktifkan' : 'Mode acak (Shuffle) dimatikan');
    }
}

function shareTrack(){
    if(!S.ct||!S.ct.videoId)return;
    var url=location.origin+'/play/'+S.ct.videoId+'?share=true';
    updateOG(S.ct.title,S.ct.cover,S.ct.artist);
    if(navigator.share){navigator.share({title:S.ct.title,text:S.ct.title+' - '+S.ct.artist,url:url}).catch(function(){});}
}

var lyricsCache = {};
var fetchingLyricsVid = null;
var lyricsRequestSeq = 0;
var lyricsController = null;

function resetLyricsUI(vid){
    S.ld={vid:vid, type:'none',lines:[]};S.cli=-1;S.lyricOffset=0;
    var lc=gid('lyrics-loading'),cc=gid('lyrics-content'),ec=gid('lyrics-empty');
    var il=gid('full-inline-lyrics-loading'),ic=gid('full-inline-lyrics-content'),ie=gid('full-inline-lyrics-empty');
    
    if(lyricsCache[vid]) {
        S.ld = lyricsCache[vid];
    }

    if(lc)lc.classList.remove('hidden');
    if(il)il.classList.remove('hidden');

    if(cc){cc.classList.add('hidden');cc.innerHTML='';}
    if(ic){ic.classList.add('hidden');ic.innerHTML='';}

    if(ec)ec.classList.add('hidden');
    if(ie)ie.classList.add('hidden');
    updateSyncBadge();
    
    // Update header track info
    if (S.ct) {
        var cov = S.ct.cover || FI;
        ['lyrics-header-cover', 'lyrics-desktop-cover', 'lyrics-bg-blur'].forEach(function(id){
            var el = gid(id); if(el) updateCoverWithTransition(el, cov, cov, false);
        });
        ['lyrics-header-title', 'lyrics-desktop-title'].forEach(function(id){
            var el = gid(id); if(el) el.innerText = S.ct.title || 'Unknown';
        });
        ['lyrics-header-artist', 'lyrics-desktop-artist'].forEach(function(id){
            var el = gid(id); if(el) el.innerText = S.ct.artist || 'Unknown';
        });
        if (typeof FullPlayer !== 'undefined' && FullPlayer.updateBeats) {
            FullPlayer.updateBeats(S.ct);
        }
    }

    if(vid)FL(vid);
}

var lastUserLyricScroll = 0;
var lastUserInlineLyricScroll = 0;

function setupLyricScrollListener() {
    var container = gid('lyrics-scroll-container');
    if (container && !container._hasLyricScrollListener) {
        container._hasLyricScrollListener = true;
        var onUserTouch = function() {
            lastUserLyricScroll = Date.now();
        };
        container.addEventListener('touchstart', onUserTouch, { passive: true });
        container.addEventListener('touchmove', onUserTouch, { passive: true });
        container.addEventListener('wheel', onUserTouch, { passive: true });
        container.addEventListener('mousedown', onUserTouch, { passive: true });
    }

    var inlineContainer = gid('full-inline-lyrics-scroll');
    if (inlineContainer && !inlineContainer._hasLyricScrollListener) {
        inlineContainer._hasLyricScrollListener = true;
        var onUserInlineTouch = function() {
            lastUserInlineLyricScroll = Date.now();
        };
        inlineContainer.addEventListener('touchstart', onUserInlineTouch, { passive: true });
        inlineContainer.addEventListener('touchmove', onUserInlineTouch, { passive: true });
        inlineContainer.addEventListener('wheel', onUserInlineTouch, { passive: true });
        inlineContainer.addEventListener('mousedown', onUserInlineTouch, { passive: true });
    }
}

var lyricScrollAnim = null;
function smoothScrollLyricContainer(container, targetTop, duration) {
    if (!container) return;
    if (duration === 0) {
        container.scrollTop = targetTop;
        return;
    }
    try {
        container.scrollTo({
            top: targetTop,
            behavior: 'smooth'
        });
    } catch (e) {
        container.scrollTop = targetTop;
    }
}

function renderLyricsDOM(ld) {
    var l=gid('lyrics-loading'),c=gid('lyrics-content'),e=gid('lyrics-empty');
    var il=gid('full-inline-lyrics-loading'),ic=gid('full-inline-lyrics-content'),ie=gid('full-inline-lyrics-empty');

    if(l) l.classList.add('hidden');
    if(il) il.classList.add('hidden');

    if (!ld || !ld.lines || ld.lines.length === 0) {
        if(e) e.classList.remove('hidden');
        if(ie) ie.classList.remove('hidden');
        if(c) c.classList.add('hidden');
        if(ic) ic.classList.add('hidden');
        return;
    }

    if(e) e.classList.add('hidden');
    if(ie) ie.classList.add('hidden');

    var html='';
    var inlineHtml='';
    var isPlain = ld.type === 'plain';

    ld.lines.forEach(function(li,i){
        var transHtml = '';
        if (li.translation && li.translation.trim()) {
            transHtml = '<span class="lyric-translation">(' + es(li.translation) + ')</span>';
        }
        if (isPlain) {
            html+='<p class="lyric-line text-left py-2.5 text-white/80 font-bold">'+es(li.text)+transHtml+'</p>';
            inlineHtml+='<p class="inline-lyric-line text-left py-1.5 text-white/80 font-bold">'+es(li.text)+transHtml+'</p>';
        } else {
            html+='<p class="lyric-line text-left py-2.5 cursor-pointer font-bold" data-time="'+li.time+'" onclick="SLT('+li.time+')">'+es(li.text)+transHtml+'</p>';
            inlineHtml+='<p class="inline-lyric-line text-left py-1.5 cursor-pointer font-bold" data-time="'+li.time+'" onclick="SLT('+li.time+')">'+es(li.text)+transHtml+'</p>';
        }
    });
    html+='<p class="text-left text-[#4b5563] text-sm mt-12 mb-4 opacity-50 tracking-widest">——— end ———</p>';
    inlineHtml+='<p class="text-left text-[#4b5563] text-xs mt-8 mb-2 opacity-50 tracking-widest">——— end ———</p>';

    if(c) {
         c.innerHTML='<div class="pt-[35vh] pb-[50vh] space-y-2 sm:space-y-3">'+html+'</div>';
         c.classList.remove('hidden');
         delete c._lyricLines;
         delete c._activeLine;
    }
    if(ic) {
         ic.innerHTML='<div class="pt-[40%] pb-[50%] space-y-1">'+inlineHtml+'</div>';
         ic.classList.remove('hidden');
         delete ic._lyricLines;
         delete ic._activeLine;
    }

    S.cli = -2;
    if (!isPlain) ULH(S.pt, true);
}

async function FL(vid){
    if (!vid) return;
    if (fetchingLyricsVid === vid) return;

    var requestId = ++lyricsRequestSeq;
    if (lyricsController) {
        try { lyricsController.abort(); } catch (e) {}
    }
    var requestController = new AbortController();
    lyricsController = requestController;

    if (!lyricsCache[vid]) {
        var offlineList = typeof getOfflineSongs === 'function' ? getOfflineSongs() : [];
        var offlineTrack = offlineList.find(function(s){ return (s.videoId === vid || s.id === vid); });
        if (offlineTrack && offlineTrack.lyrics) {
            lyricsCache[vid] = offlineTrack.lyrics;
            if (typeof savePwaCaches === 'function') savePwaCaches();
        }
    }

    if (lyricsCache[vid] && lyricsCache[vid].lines && lyricsCache[vid].lines.length > 0) {
        S.ld = lyricsCache[vid];
        renderLyricsDOM(S.ld);
        return;
    }

    var l=gid('lyrics-loading'),c=gid('lyrics-content'),e=gid('lyrics-empty');
    var il=gid('full-inline-lyrics-loading'),ic=gid('full-inline-lyrics-content'),ie=gid('full-inline-lyrics-empty');

    if(l) l.classList.remove('hidden');
    if(il) il.classList.remove('hidden');

    if(c) { c.classList.add('hidden'); c.innerHTML=''; delete c._lyricLines; delete c._activeLine; }
    if(ic) { ic.classList.add('hidden'); ic.innerHTML=''; delete ic._lyricLines; delete ic._activeLine; }

    if(e) e.classList.add('hidden');
    if(ie) ie.classList.add('hidden');

    S.ld={vid:vid, type:'none',lines:[]};S.cli=-1;S.lyricOffset=0;updateSyncBadge();
    fetchingLyricsVid = vid;

    try{
        if (!navigator.onLine) {
            if (requestId !== lyricsRequestSeq) return;
            if (fetchingLyricsVid === vid) fetchingLyricsVid = null;
            var activeVid = S.ct ? (S.ct.videoId || S.ct.id) : null;
            var cachedOffline = lyricsCache[vid];
            if (!cachedOffline) {
                var offlineList = typeof getOfflineSongs === 'function' ? getOfflineSongs() : [];
                var offlineTrack = offlineList.find(function(s){ return (s.videoId === vid || s.id === vid); });
                if (offlineTrack && offlineTrack.lyrics) {
                    cachedOffline = offlineTrack.lyrics;
                    lyricsCache[vid] = cachedOffline;
                }
            }
            if (cachedOffline) {
                if (requestId === lyricsRequestSeq && activeVid === vid) {
                    S.ld = cachedOffline;
                    renderLyricsDOM(S.ld);
                }
            } else if (requestId === lyricsRequestSeq && activeVid === vid) {
                if(l)l.classList.add('hidden');if(e)e.classList.remove('hidden');
                if(il)il.classList.add('hidden');if(ie)ie.classList.remove('hidden');
            }
            return;
        }

        var curTitle = (S.ct && S.ct.title) ? '&title=' + encodeURIComponent(S.ct.title) : '';
        var curArtist = (S.ct && S.ct.artist) ? '&artist=' + encodeURIComponent(S.ct.artist) : '';
        var r = await fetch(API.lyrics + '?id=' + encodeURIComponent(vid) + curTitle + curArtist, { signal: requestController.signal });
        var d=await r.json();
        if (requestId !== lyricsRequestSeq) return;

        if (fetchingLyricsVid === vid) {
            fetchingLyricsVid = null;
        }

        var activeVid = S.ct ? (S.ct.videoId || S.ct.id) : null;

        if(d.status && d.result && d.result.lyrics && d.result.lyrics.lines && d.result.lyrics.lines.length > 0){
            var resLyrics = {
                vid: vid,
                type: d.result.lyrics.type,
                lines: d.result.lyrics.lines
            };
            lyricsCache[vid] = resLyrics;
            savePwaCaches();
            if (requestId === lyricsRequestSeq && activeVid === vid) {
                S.ld = resLyrics;
                renderLyricsDOM(S.ld);
            }
        }else{
            var emptyLyrics = { vid: vid, type: 'none', lines: [] };
            lyricsCache[vid] = emptyLyrics;
            savePwaCaches();
            if (requestId === lyricsRequestSeq && activeVid === vid) {
                S.ld = emptyLyrics;
                renderLyricsDOM(S.ld);
            }
        }
    }catch(er){
        if (fetchingLyricsVid === vid) {
            fetchingLyricsVid = null;
        }
        if (requestId !== lyricsRequestSeq || (er && er.name === 'AbortError')) return;
        var activeVid = S.ct ? (S.ct.videoId || S.ct.id) : null;
        if (activeVid === vid) {
            if(l)l.classList.add('hidden');if(e)e.classList.remove('hidden');
            if(il)il.classList.add('hidden');if(ie)ie.classList.remove('hidden');
        }
    }
}

function ULH(ct, forceScroll){
    if(!S.ld || !S.ld.lines || S.ld.lines.length===0 || S.ld.type === 'plain') return;
    
    // Slight time lead (+0.18s) to trigger highlighting exactly as vocal begins
    var checkTime = ct + 0.18;
    var ni=-1;
    for(var i=0; i<S.ld.lines.length; i++){
        if(checkTime >= S.ld.lines[i].time){ ni=i; }
    }
    var off=S.lyricOffset||0;
    var ei=ni+off;
    if(ei<-1) ei=-1;
    if(ei>S.ld.lines.length-1) ei=S.ld.lines.length-1;
    
    if(ei === S.cli && !forceScroll) return;
    S.cli = ei;

    // 1. Fullscreen Overlay Lyrics Container
    if (S.lo) {
        var container = gid('lyrics-scroll-container');
        var content = gid('lyrics-content');
        if(content) {
            if(!content._lyricLines || content._lyricLines.length === 0){
                content._lyricLines = content.querySelectorAll('.lyric-line');
            }

            if(content._lyricLines && content._lyricLines.length > 0) {
                content._lyricLines.forEach(function(line, idx){
                    if(idx === ei) {
                        line.classList.add('active-lyric');
                        line.classList.remove('past-lyric');
                    } else if (idx < ei) {
                        line.classList.remove('active-lyric');
                        line.classList.add('past-lyric');
                    } else {
                        line.classList.remove('active-lyric');
                        line.classList.remove('past-lyric');
                    }
                });
            }

            if(ei >= 0 && content._lyricLines) {
                var targetLine = content._lyricLines[ei];
                if(targetLine && container && (forceScroll || Date.now() - lastUserLyricScroll > 2500)) {
                    var targetTop = targetLine.offsetTop;
                    var targetHeight = targetLine.offsetHeight;
                    var containerHeight = container.clientHeight;
                    var offset = Math.max(0, Math.floor(targetTop - (containerHeight / 2) + (targetHeight / 2)));
                    smoothScrollLyricContainer(container, offset, forceScroll ? 0 : 300);
                }
            }
        }
    }

    // 2. Compact Inline FullPlayer Cover Lyrics Container
    var inlineContainer = gid('full-inline-lyrics-scroll');
    var inlineContent = gid('full-inline-lyrics-content');
    if(inlineContent) {
        if(!inlineContent._lyricLines || inlineContent._lyricLines.length === 0){
            inlineContent._lyricLines = inlineContent.querySelectorAll('.inline-lyric-line');
        }

        if(inlineContent._lyricLines && inlineContent._lyricLines.length > 0) {
            inlineContent._lyricLines.forEach(function(line, idx){
                if(idx === ei) {
                    line.classList.add('active-lyric');
                    line.classList.remove('past-lyric');
                } else if (idx < ei) {
                    line.classList.remove('active-lyric');
                    line.classList.add('past-lyric');
                } else {
                    line.classList.remove('active-lyric');
                    line.classList.remove('past-lyric');
                }
            });
        }

        if(ei >= 0 && inlineContent._lyricLines) {
            var targetInlineLine = inlineContent._lyricLines[ei];
            if(targetInlineLine && inlineContainer && (forceScroll || Date.now() - lastUserInlineLyricScroll > 2500)) {
                var targetInlineTop = targetInlineLine.offsetTop;
                var targetInlineHeight = targetInlineLine.offsetHeight;
                var containerInlineHeight = inlineContainer.clientHeight;
                var inlineOffset = Math.max(0, Math.floor(targetInlineTop - (containerInlineHeight / 2) + (targetInlineHeight / 2)));
                smoothScrollLyricContainer(inlineContainer, inlineOffset, forceScroll ? 0 : 250);
            }
        }
    }
}

function SLT(t){
    if(AU){
        AU.currentTime=t;
        S.pt=t;
        ULH(t, true);
    }
}

function adjustLyricSync(delta){
    if(!S.ld||!S.ld.lines||S.ld.lines.length===0){showToast('Lirik belum tersedia');return;}
    var max=S.ld.lines.length-1;
    S.lyricOffset=(S.lyricOffset||0)+delta;
    if(S.lyricOffset>max)S.lyricOffset=max;
    if(S.lyricOffset<-max)S.lyricOffset=-max;
    S.cli=-2;
    ULH(S.pt, true);
    updateSyncBadge();
    showToast((delta>0?'Lirik maju':'Lirik mundur')+' 1 baris');
}
function lyricSyncNext(){adjustLyricSync(1);}
function lyricSyncPrev(){adjustLyricSync(-1);}
function updateSyncBadge(){
    var o=S.lyricOffset||0;
    var badgeText = o===0 ? '' : (o>0?'+':'')+o;
    var dBadge = gid('lyric-sync-badge-desktop');
    var mBadge = gid('lyric-sync-badge-mobile');
    var iBadge = gid('full-inline-sync-badge');
    
    if(o===0){
        if(dBadge) dBadge.classList.add('hidden');
        if(mBadge) mBadge.classList.add('hidden');
        if(iBadge) iBadge.classList.add('hidden');
    }else{
        if(dBadge){ dBadge.classList.remove('hidden'); dBadge.innerText=badgeText; }
        if(mBadge){ mBadge.classList.remove('hidden'); mBadge.innerText=badgeText; }
        if(iBadge){ iBadge.classList.remove('hidden'); iBadge.innerText=badgeText; }
    }
}

function toggleLyrics(){
    var o=gid('lyrics-overlay');
    var fp=gid('full-player');
    if(S.lo){
        o.style.transform='translateY(100%)';
        setTimeout(function(){o.style.display='none';},350);
        S.lo=false;
        if(S.lfp) {
            S.lfp = false;
            if(typeof FullPlayer!=='undefined') FullPlayer.open();
        } else {
            if(typeof MP!=='undefined') MP.show();
        }
    }else{
        var isFpOpen = (typeof FullPlayer !== 'undefined' && FullPlayer.isOpen) || 
                       (fp && fp.style.display === 'flex' && fp.style.transform !== 'translate3d(0, 100%, 0)' && fp.style.transform !== 'translate3d(0px, 100%, 0px)' && fp.style.transform !== 'translateY(100%)');
        
        if(isFpOpen) {
            S.lfp = true;
            if(typeof FullPlayer!=='undefined') FullPlayer.close();
        } else {
            S.lfp = false;
        }

        o.style.display='flex';
        
        // Update header track info
        if (S.ct) {
            ['lyrics-header-cover', 'lyrics-desktop-cover', 'lyrics-bg-blur'].forEach(function(id){
                var el = gid(id); if(el) el.src = S.ct.cover || FI;
            });
            ['lyrics-header-title', 'lyrics-desktop-title'].forEach(function(id){
                var el = gid(id); if(el) el.innerText = S.ct.title || 'Unknown';
            });
            ['lyrics-header-artist', 'lyrics-desktop-artist'].forEach(function(id){
                var el = gid(id); if(el) el.innerText = S.ct.artist || 'Unknown';
            });
        }
        
        requestAnimationFrame(function(){
            requestAnimationFrame(function(){
                o.style.transform='translateY(0)';
            });
        });
        S.lo=true;
        if(!S.lfp) MP.hide();
        setupLyricScrollListener();
        if(S.ct&&S.ct.videoId&&S.ld.lines.length===0){
            FL(S.ct.videoId);
        } else {
            S.cli = -2;
            ULH(S.pt, true);
        }
    }
}

// LIKED SONGS SYSTEM
function getLikedSongs(){
    return typeof readJsonArray === 'function' ? readJsonArray('malamusic_liked_songs') : (function(){ try { var x=JSON.parse(localStorage.getItem('malamusic_liked_songs')||'[]'); return Array.isArray(x)?x:[]; } catch (_) { return []; } })();
}
var librarySyncTimer = null;
var libraryLoadSeq = 0;
var libraryLoadController = null;
var librarySyncInFlight = false;
var librarySyncQueued = false;
function libraryArray(value) { return Array.isArray(value) ? value : []; }
function mergeLibraryCollections(local, remote) {
    var mergeBy = function(localItems, remoteItems, keyFn) {
        var result = [];
        var seen = Object.create(null);
        libraryArray(remoteItems).concat(libraryArray(localItems)).forEach(function(item) {
            if (!item || typeof item !== 'object') return;
            var key = String(keyFn(item) || '');
            if (!key || seen[key]) return;
            seen[key] = true;
            result.push(item);
        });
        return result;
    };
    return {
        likedSongs: mergeBy(local.likedSongs, remote.likedSongs, function(x){ return x.videoId || x.id; }),
        likedArtists: mergeBy(local.likedArtists, remote.likedArtists, function(x){ return x.artistId; }),
        playlists: mergeBy(local.playlists, remote.playlists, function(x){ return x.id; })
    };
}
function saveMergedLibraryLocal(lib) {
    if(typeof writeJsonArray==='function'){
        writeJsonArray('malamusic_liked_songs', lib.likedSongs);
        writeJsonArray('malamusic_liked_artists', lib.likedArtists);
        writeJsonArray('malamusic_playlists', lib.playlists);
    } else {
        try {
            localStorage.setItem('malamusic_liked_songs',JSON.stringify(lib.likedSongs));
            localStorage.setItem('malamusic_liked_artists',JSON.stringify(lib.likedArtists));
            localStorage.setItem('malamusic_playlists',JSON.stringify(lib.playlists));
        } catch(e) {}
    }
}
function loadLibraryRemote(){
    var requestId = ++libraryLoadSeq;
    if (libraryLoadController) {
        try { libraryLoadController.abort(); } catch (e) {}
    }
    libraryLoadController = new AbortController();
    return fetch('/api/library',{credentials:'same-origin',cache:'no-store',signal:libraryLoadController.signal}).then(function(r){return r.ok?r.json():null;}).then(function(data){
        if (requestId !== libraryLoadSeq) return;
        var lib=data&&data.status&&data.library; if(!lib) return;
        var local = { likedSongs:getLikedSongs(), likedArtists:getLikedArtists(), playlists:getUserPlaylists() };
        var merged = mergeLibraryCollections(local, lib);
        var changed = JSON.stringify(merged) !== JSON.stringify(local);
        saveMergedLibraryLocal(merged);
        if(typeof Library!=='undefined'&&Library.render && changed) Library.render();
        if (merged.likedSongs.length || merged.likedArtists.length || merged.playlists.length) syncLibraryRemote();
    }).catch(function(e){ if (e && e.name !== 'AbortError') {} });
}
function syncLibraryRemote(){
    clearTimeout(librarySyncTimer);
    if (librarySyncInFlight) { librarySyncQueued = true; return; }
    librarySyncTimer = setTimeout(function(){
        if (typeof EmailAuth === 'undefined') return;
        librarySyncInFlight = true;
        fetch('/api/email-auth?action=me',{credentials:'same-origin',cache:'no-store'}).then(function(r){return r.json();}).then(function(me){
            if (!me.authenticated) return null;
            return fetch('/api/library',{method:'PUT',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({likedSongs:getLikedSongs(),likedArtists:getLikedArtists(),playlists:getUserPlaylists()})});
        }).then(function(response){
            if (response && !response.ok) throw new Error('library sync failed');
        }).catch(function(){}).finally(function(){
            librarySyncInFlight = false;
            if (librarySyncQueued) { librarySyncQueued = false; syncLibraryRemote(); }
        });
    }, 700);
}
function saveLikedSongs(songs){
    if (typeof writeJsonArray === 'function') writeJsonArray('malamusic_liked_songs', songs); else try{localStorage.setItem('malamusic_liked_songs',JSON.stringify(Array.isArray(songs)?songs:[]));}catch(e){}
    syncLibraryRemote();
}
function isLikedSong(videoId){
    if(!videoId) return false;
    var songs = getLikedSongs();
    return songs.some(function(s){ return (s.videoId === videoId || s.id === videoId); });
}
function toggleLikeSong(track){
    if(!track) return;
    var vId = track.videoId || track.id;
    if(!vId) return;
    var songs = getLikedSongs();
    var index = songs.findIndex(function(s){ return (s.videoId === vId || s.id === vId); });
    if(index >= 0){
        songs.splice(index, 1);
        saveLikedSongs(songs);
        showToast('Dihapus dari Lagu Disukai');
    } else {
        songs.unshift({
            id: vId,
            videoId: vId,
            title: track.title || 'Unknown',
            artist: track.artist || 'Unknown',
            cover: track.cover || track.thumbnail || '',
            artistId: track.artistId || '',
            ytUrl: track.ytUrl || ('https://youtube.com/watch?v=' + vId)
        });
        saveLikedSongs(songs);
        showToast('Ditambahkan ke Lagu Disukai');
    }
    updateLikeButtons();
    if(S.at === 'library' && typeof Library !== 'undefined') {
        Library.render();
    }
    if(S.at === 'liked' && typeof App !== 'undefined' && App.renderLiked) {
        App.renderLiked();
    }
}
function toggleCurrentLike(){
    if(!S.ct) return;
    toggleLikeSong(S.ct);
}

// LIKED ARTISTS SYSTEM
function getLikedArtists(){
    return typeof readJsonArray === 'function' ? readJsonArray('malamusic_liked_artists') : (function(){ try { var x=JSON.parse(localStorage.getItem('malamusic_liked_artists')||'[]'); return Array.isArray(x)?x:[]; } catch (_) { return []; } })();
}
function saveLikedArtists(artists){
    if (typeof writeJsonArray === 'function') writeJsonArray('malamusic_liked_artists', artists); else try{localStorage.setItem('malamusic_liked_artists',JSON.stringify(Array.isArray(artists)?artists:[]));}catch(e){}
    syncLibraryRemote();
}
function isArtistLiked(artistId){
    if(!artistId) return false;
    var artists = getLikedArtists();
    return artists.some(function(a){ return a.artistId === artistId; });
}
function toggleLikeArtist(artist){
    if(!artist || !artist.artistId) return;
    var artists = getLikedArtists();
    var index = artists.findIndex(function(a){ return a.artistId === artist.artistId; });
    if(index >= 0){
        artists.splice(index, 1);
        saveLikedArtists(artists);
        showToast('Dihapus dari Artist Disukai');
    } else {
        artists.unshift({
            artistId: artist.artistId,
            name: artist.name,
            thumbnail: artist.thumbnail
        });
        saveLikedArtists(artists);
        showToast('Ditambahkan ke Artist Disukai');
    }
    if(S.at === 'library' && typeof Library !== 'undefined') {
        Library.render();
    }
    if(typeof Artist !== 'undefined' && Artist.currentArtistId === artist.artistId) {
        Artist.updateLikeBtn();
    }
}

function updateLikeButtons(){
    var isLiked = S.ct ? isLikedSong(S.ct.videoId) : false;
    var miniBtn = gid('mini-like-btn');
    var fullBtn = gid('full-like-btn');

    if(miniBtn){
        if(isLiked){
            miniBtn.innerHTML = '<i data-lucide="heart" class="w-4 h-4 text-rose-500 fill-rose-500"></i>';
            miniBtn.classList.add('text-rose-500');
        } else {
            miniBtn.innerHTML = '<i data-lucide="heart" class="w-4 h-4"></i>';
            miniBtn.classList.remove('text-rose-500');
        }
    }

    if(fullBtn){
        if(isLiked){
            fullBtn.innerHTML = '<i data-lucide="heart" class="w-5 h-5 text-rose-500 fill-rose-500"></i>';
            fullBtn.classList.add('bg-rose-500/20', 'border-rose-500/40');
            fullBtn.classList.remove('bg-black/50', 'border-white/20');
        } else {
            fullBtn.innerHTML = '<i data-lucide="heart" class="w-5 h-5 text-white"></i>';
            fullBtn.classList.remove('bg-rose-500/20', 'border-rose-500/40');
            fullBtn.classList.add('bg-black/50', 'border-white/20');
        }
    }
    if(typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
}

// PLAYLIST SYSTEM
function getUserPlaylists(){
    try{
        var pls=JSON.parse(localStorage.getItem('malamusic_playlists')||'[]');
        if (!Array.isArray(pls)) pls=[];
        var changed=false;
        pls.forEach(function(p){ if(!p || typeof p !== 'object') return;
            if(p.image && (p.image.includes('uZKDQkZ3c5VK.png') || p.image.includes('R0ym4wqfznmp.png') || p.image.includes('logo.png'))){
                p.image='';
                changed=true;
            }
            if(p.songs && p.songs.length){
                p.songs.forEach(function(s){
                    if(!s.cover || s.cover.includes('uZKDQkZ3c5VK.png') || s.cover.includes('logo.png')){
                        s.cover = toHDCover('', s.videoId);
                        changed=true;
                    }
                });
            }
            if(!p.image&&p.songs&&p.songs.length>0){
                p.image=p.songs[0].cover;
                changed=true;
            }
        });
        if(changed){
            localStorage.setItem('malamusic_playlists',JSON.stringify(pls));
        }
        return pls;
    }catch(e){return[];}
}
function saveUserPlaylists(pls){
    if (typeof writeJsonArray === 'function') writeJsonArray('malamusic_playlists', pls); else try{localStorage.setItem('malamusic_playlists',JSON.stringify(Array.isArray(pls)?pls:[]));}catch(e){}
    syncLibraryRemote();
}
function createPlaylist(name,image){var pls=getUserPlaylists();var id='pl_'+Date.now();pls.push({id:id,name:name,image:image||'',songs:[]});saveUserPlaylists(pls);return id;}
function updateUserPlaylist(id,name,image){var pls=getUserPlaylists();var pl=pls.find(function(p){return p.id===id;});if(!pl)return;if(name)pl.name=name;if(image)pl.image=image;saveUserPlaylists(pls);}
function deleteUserPlaylist(id){var pls=getUserPlaylists().filter(function(p){return p.id!==id;});saveUserPlaylists(pls);}
function addToPlaylistById(playlistId,track){var pls=getUserPlaylists();var pl=pls.find(function(p){return p.id===playlistId;});if(!pl)return;if(pl.songs.length>=15){showToast('Playlist penuh (Max 15)');return;}var exists=pl.songs.find(function(s){return s.videoId===track.videoId;});if(!exists){pl.songs.push({id:track.id,videoId:track.videoId,title:track.title,artist:track.artist,cover:track.cover,artistId:track.artistId||'',ytUrl:track.ytUrl});if(!pl.image&&pl.songs.length===1){pl.image=track.cover;}saveUserPlaylists(pls);showToast('Ditambahkan ke '+pl.name);}else{showToast('Sudah ada di playlist');}}
var appToastTimeout = null;
function showToast(msg){
    var toast = gid('app-global-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'app-global-toast';
        document.body.appendChild(toast);
    }
    if (appToastTimeout) clearTimeout(appToastTimeout);
    
    var m = (msg || '').toLowerCase();
    var iconSvg = '<svg class="w-3.5 h-3.5 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';

    if (/gagal|belum|penuh|batal|error|tidak/i.test(m)) {
        iconSvg = '<svg class="w-3.5 h-3.5 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
    } else if (/hapus|dihapus/i.test(m)) {
        iconSvg = '<svg class="w-3.5 h-3.5 text-rose-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>';
    } else if (/disukai|suka/i.test(m)) {
        iconSvg = '<svg class="w-3.5 h-3.5 text-rose-400 shrink-0 fill-rose-400" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
    } else if (/timer|tidur|menit/i.test(m)) {
        iconSvg = '<svg class="w-3.5 h-3.5 text-purple-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
    } else if (/acak|shuffle/i.test(m)) {
        iconSvg = '<svg class="w-3.5 h-3.5 text-indigo-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>';
    } else if (/equalizer|suara/i.test(m)) {
        iconSvg = '<svg class="w-3.5 h-3.5 text-cyan-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>';
    } else if (/unduh|download|install/i.test(m)) {
        iconSvg = '<svg class="w-3.5 h-3.5 text-sky-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
    } else if (/link|salin|clipboard/i.test(m)) {
        iconSvg = '<svg class="w-3.5 h-3.5 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
    } else if (/kecepatan/i.test(m)) {
        iconSvg = '<svg class="w-3.5 h-3.5 text-amber-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>';
    } else if (/playlist|tersimpan/i.test(m)) {
        iconSvg = '<svg class="w-3.5 h-3.5 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
    }

    toast.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 z-[999] bg-black/85 text-white/90 text-[11px] font-medium px-3 py-1.5 rounded-full border border-white/10 shadow-sm flex items-center gap-1.5 pointer-events-none transition-all duration-150 opacity-0 translate-y-2 scale-95';
    toast.innerHTML = iconSvg + '<span class="truncate max-w-[80vw]">' + es(msg) + '</span>';
    
    requestAnimationFrame(function(){
        toast.classList.remove('opacity-0', 'translate-y-2', 'scale-95');
        toast.classList.add('opacity-100', 'translate-y-0', 'scale-100');
    });
    
    appToastTimeout = setTimeout(function(){
        if (toast) {
            toast.classList.remove('opacity-100', 'translate-y-0', 'scale-100');
            toast.classList.add('opacity-0', 'translate-y-1', 'scale-95');
            setTimeout(function(){
                if (toast && toast.parentElement && toast.classList.contains('opacity-0')) {
                    toast.remove();
                }
            }, 150);
        }
    }, 1600);
}
function addCurrentToPlaylist(){if(!S.ct)return;var pls=getUserPlaylists();if(pls.length===0){showToast('Belum ada playlist! Buat di Library dulu');return;}showPlaylistPicker(S.ct);}
function showPlaylistPicker(track){var pls=getUserPlaylists();var popup=document.createElement('div');popup.className='fixed inset-0 z-[300] flex items-end justify-center bg-black/60';popup.onclick=function(e){if(e.target===popup)popup.remove();};var listHtml=pls.map(function(p){return'<button onclick="addToPlaylistById(\''+esJs(p.id)+'\',track);this.parentElement.parentElement.remove();" class="w-full text-left p-4 hover:bg-white/5 flex items-center gap-3 border-b border-white/5"><img src="'+safeMediaUrl(p.image||(p.songs.length>0?p.songs[0].cover:FI),FI)+'" class="w-10 h-10 rounded object-cover" onerror="this.src=\''+FI+'\'" /><div><p class="font-medium text-white">'+es(p.name)+'</p><p class="text-[#6b7280] text-xs">'+Number(p.songs.length||0)+' lagu</p></div></button>';}).join('');popup.innerHTML='<div class="bg-[#1a1a1a] w-full max-w-md rounded-t-3xl p-6 border-t border-white/10" style="animation:slideUp 0.3s ease-out forwards;"><div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4"></div><h3 class="font-bold text-white mb-3">Tambah ke Playlist</h3><div class="max-h-72 overflow-y-auto hide-scrollbar">'+listHtml+'</div><button onclick="this.parentElement.parentElement.remove()" class="w-full mt-3 py-3 border border-white/20 text-white rounded-full">Batal</button></div>';document.body.appendChild(popup);}

var trackContextRegistry = {};
var trackContextSequence = 0;

function trackMenuButton(track) {
    var normalized = normalizeTrack(track);
    var id = trackId(normalized);
    if (!id) return '';
    var key = id + '_' + (++trackContextSequence);
    trackContextRegistry[key] = normalized;
    return '<button onclick="event.stopPropagation();openTrackContextMenu(\'' + key + '\')" class="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex-none flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 active:scale-90 transition-all" title="Opsi lagu" aria-label="Opsi lagu"><i data-lucide="more-vertical" class=\"w-4 h-4 sm:w-5 sm:h-5\"></i></button>';
}

function closeTrackContextMenu() {
    var menu = gid('track-context-menu');
    if (menu) menu.remove();
}

function openTrackContextMenu(id) {
    closeTrackContextMenu();
    var track = trackContextRegistry[id];
    if (!track) return;
    var liked = isLikedSong(track.videoId || track.id);
    var offline = typeof isOfflineSong === 'function' && isOfflineSong(track);
    var menu = document.createElement('div');
    menu.id = 'track-context-menu';
    menu.className = 'fixed inset-0 z-[420] flex items-end justify-center bg-black/65';
    menu.onclick = function(e) { if (e.target === menu) closeTrackContextMenu(); };
    menu.innerHTML = '<div class="w-full max-w-md rounded-t-3xl bg-[#17171d] border-t border-white/10 p-5 shadow-2xl" style="animation:slideUp .25s ease-out forwards"><div class="flex items-center gap-3 pb-4 border-b border-white/10"><img src="' + (track.cover || FI) + '" class="w-12 h-12 rounded-xl object-cover" onerror="this.src=\'' + FI + '\'" /><div class="min-w-0 flex-1"><h3 class="text-sm font-black text-white truncate">' + es(track.title || 'Lagu') + '</h3><p class="text-xs text-white/50 truncate">' + es(track.artist || 'MalaMusic') + '</p></div><button onclick="closeTrackContextMenu()" class="w-9 h-9 rounded-full bg-white/10 text-white">×</button></div><div class="grid grid-cols-4 gap-2 py-4 border-b border-white/10"><button onclick="playTrackFromContext(\'' + id + '\')" class="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/10 text-white"><i data-lucide="play" class="w-5 h-5"></i><span class="text-[10px]">Putar</span></button><button onclick="addTrackToQueueFromContext(\'' + id + '\',true)" class="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/10 text-white"><i data-lucide="list-plus" class="w-5 h-5"></i><span class="text-[10px]">Putar Berikutnya</span></button><button onclick="addTrackToQueueFromContext(\'' + id + '\',false)" class="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/10 text-white"><i data-lucide="list-music" class="w-5 h-5"></i><span class="text-[10px]">Ke Antrian</span></button><button onclick="closeTrackContextMenu();openQueue()" class="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/10 text-white"><i data-lucide="list" class="w-5 h-5"></i><span class="text-[10px]">Lihat Antrian</span></button></div><div class="space-y-1"><button onclick="closeTrackContextMenu();showPlaylistPicker(trackContextRegistry[\'' + id + '\'])" class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 text-white text-sm"><i data-lucide="folder-plus" class="w-5 h-5 text-emerald-300"></i><span>Tambah ke Playlist</span></button><button onclick="closeTrackContextMenu();toggleLikeSong(trackContextRegistry[\'' + id + '\'])" class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 text-white text-sm"><i data-lucide="heart" class="w-5 h-5 ' + (liked ? 'text-rose-400 fill-current' : 'text-white/60') + '"></i><span>' + (liked ? 'Hapus dari Lagu Disukai' : 'Tambah ke Lagu Disukai') + '</span></button><button onclick="contextDownloadTrack(\'' + id + '\')" class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 text-white text-sm"><i data-lucide="download" class="w-5 h-5 text-cyan-300"></i><span>' + (offline ? 'Sudah di Mode Offline' : 'Download ke Mode Offline') + '</span></button><button onclick="contextShareTrack(\'' + id + '\')" class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 text-white text-sm"><i data-lucide="share-2" class="w-5 h-5 text-amber-300"></i><span>Bagikan Lagu</span></button></div></div>';
    document.body.appendChild(menu); lucide.createIcons();
}

function playTrackFromContext(id) {
    if (window.ListenTogether && typeof ListenTogether.blockFollowerAction === 'function' && ListenTogether.blockFollowerAction()) return;
    var track = trackContextRegistry[id]; closeTrackContextMenu(); if (!track) return;
    S.pl = [normalizeTrack(track)]; S.pi = 0; S.ps = 'queue'; S.ct = S.pl[0]; UU(); MP.show(); S.il = true; UB(); resetLyricsUI(trackId(S.ct)); loadTrack(S.ct);
    if (window.ListenTogether && typeof ListenTogether.syncAfterLocalAction === 'function') ListenTogether.syncAfterLocalAction();
}

function addTrackToQueueFromContext(id, playNext) {
    var track = trackContextRegistry[id]; closeTrackContextMenu(); if (!track) return;
    var copy = normalizeTrack(track);
    if (!S.pl || !S.pl.length) {
        S.pl = S.ct ? [normalizeTrack(S.ct), copy] : [copy];
        S.pi = S.ct ? 0 : -1;
    } else {
        var insertAt = playNext ? Math.max(0, (S.pi || 0) + 1) : S.pl.length;
        if (!S.pl.some(function(item){ return trackId(item) === trackId(copy); })) S.pl.splice(insertAt, 0, copy);
    }
    // Once the user edits the queue, all subsequent next/previous operations
    // must resolve from S.pl instead of the originating Home/Search slice.
    S.ps = 'queue';
    if (typeof UU === 'function') UU();
    if (window.ListenTogether && typeof window.ListenTogether.syncNow === 'function') window.ListenTogether.syncNow();
    showToast(playNext ? 'Akan diputar berikutnya' : 'Ditambahkan ke antrian');
}

function contextDownloadTrack(id) {
    var track = trackContextRegistry[id]; closeTrackContextMenu(); if (!track) return;
    if (typeof isOfflineSong === 'function' && isOfflineSong(track)) { showToast('Lagu sudah ada di Mode Offline'); return; }
    if (typeof saveTrackForOffline === 'function') saveTrackForOffline(track);
}

function contextShareTrack(id) {
    var track = trackContextRegistry[id]; closeTrackContextMenu(); if (!track) return;
    var url = track.ytUrl || ('https://youtube.com/watch?v=' + (track.videoId || track.id));
    if (navigator.share) navigator.share({ title: track.title || 'MalaMusic', text: (track.title || 'Lagu') + ' — ' + (track.artist || ''), url: url }).catch(function() {});
    else if (navigator.clipboard) navigator.clipboard.writeText(url).then(function() { showToast('Link lagu disalin'); });
    else showToast(url);
}

// ============================================================
// EQUALIZER & SHARE CARD FEATURES
// ============================================================
var audioCtx = null;
var sourceNode = null;
var filters = [];

function setupWebAudioEQ() {
    if (audioCtx) return;
    try {
        var AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        audioCtx = new AudioContextClass();
        var AU_el = gid('audio-player');
        if (!AU_el) return;
        AU_el.crossOrigin = "anonymous";
        sourceNode = audioCtx.createMediaElementSource(AU_el);
        
        var freqs = [60, 230, 910, 4000, 14000];
        var lastNode = sourceNode;
        filters = freqs.map(function(f, idx) {
            var filter = audioCtx.createBiquadFilter();
            filter.type = idx === 0 ? 'lowshelf' : (idx === 4 ? 'highshelf' : 'peaking');
            filter.frequency.value = f;
            filter.Q.value = 1.0;
            filter.gain.value = S.eqBands ? S.eqBands[idx] : 0;
            lastNode.connect(filter);
            lastNode = filter;
            return filter;
        });
        lastNode.connect(audioCtx.destination);
    } catch(e) {
        console.warn('Web Audio API Equalizer failed to setup:', e);
    }
}

function updateEQGain(bandIdx, gainValue) {
    if (!S.eqBands) S.eqBands = [0, 0, 0, 0, 0];
    S.eqBands[bandIdx] = parseFloat(gainValue);
    
    if (filters && filters[bandIdx]) {
        try {
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            filters[bandIdx].gain.value = parseFloat(gainValue);
        } catch(e) {}
    }
}

function handleTrackEnded() {
    if (S.sleepEndWithTrack) {
        triggerSleep();
        return true;
    }
    return false;
}

var sleepIntervalId = null;

function startSleepTimer(minutes) {
    clearSleepTimer();
    var seconds = minutes * 60;
    S.sleepSecondsLeft = seconds;
    S.sleepEndWithTrack = false;
    
    updateSleepBadge();
    
    sleepIntervalId = setInterval(function() {
        if (S.sleepSecondsLeft > 0) {
            S.sleepSecondsLeft--;
            updateSleepBadge();
            var timerDisplay = gid('sleep-countdown-display');
            if (timerDisplay) {
                timerDisplay.innerText = fm(S.sleepSecondsLeft);
            }
        } else {
            triggerSleep();
        }
    }, 1000);
    
    showToast('Timer tidur diatur: ' + minutes + ' menit');
    closeSleepTimer();
}

function startSleepAtTrackEnd() {
    clearSleepTimer();
    S.sleepEndWithTrack = true;
    updateSleepBadge();
    showToast('Musik akan berhenti di akhir lagu ini');
    closeSleepTimer();
}

function clearSleepTimer() {
    if (sleepIntervalId) {
        clearInterval(sleepIntervalId);
        sleepIntervalId = null;
    }
    S.sleepSecondsLeft = 0;
    S.sleepEndWithTrack = false;
    updateSleepBadge();
    
    var popup = gid('sleep-timer-popup');
    if (popup) {
        closeSleepTimer();
        setTimeout(openSleepTimer, 100);
    }
}

function triggerSleep() {
    if (sleepIntervalId) {
        clearInterval(sleepIntervalId);
        sleepIntervalId = null;
    }
    S.sleepSecondsLeft = 0;
    S.sleepEndWithTrack = false;
    updateSleepBadge();
    
    if (AU) {
        try { AU.pause(); } catch(e){}
    }
    S.ip = false;
    UB();
    ST();
    showToast('Timer tidur selesai, musik dihentikan');
}

function updateSleepBadge() {
    var badge = gid('sleep-badge');
    var dot = gid('sleep-dot');
    if (!badge) return;
    
    if (S.sleepSecondsLeft > 0) {
        var mins = Math.ceil(S.sleepSecondsLeft / 60);
        badge.innerText = mins + 'm';
        if (dot) dot.classList.remove('hidden');
    } else if (S.sleepEndWithTrack) {
        badge.innerText = 'Akhir Lagu';
        if (dot) dot.classList.remove('hidden');
    } else {
        badge.innerText = 'Timer';
        if (dot) dot.classList.add('hidden');
    }
}

function openSleepTimer() {
    if (gid('sleep-timer-popup')) return;
    
    var popup = document.createElement('div');
    popup.id = 'sleep-timer-popup';
    popup.className = 'fixed inset-0 z-[300] flex items-end justify-center bg-black/60';
    popup.onclick = function(e) { if(e.target === popup) closeSleepTimer(); };
    
    var contentHtml = '';
    
    if (S.sleepSecondsLeft > 0) {
        contentHtml = '<div class="text-center mb-6">' +
            '<p class="text-xs text-[#6b7280] uppercase tracking-wider mb-1">Timer Sedang Berjalan</p>' +
            '<h4 id="sleep-countdown-display" class="text-3xl font-black font-mono text-white">' + fm(S.sleepSecondsLeft) + '</h4>' +
            '<button onclick="clearSleepTimer()" class="mt-4 px-6 py-2.5 rounded-full text-xs font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 active:scale-95 transition-all">Batalkan Timer</button>' +
        '</div>';
    } else if (S.sleepEndWithTrack) {
        contentHtml = '<div class="text-center mb-6">' +
            '<p class="text-sm text-[#cfd3d8] font-bold mb-1">Berhenti di akhir lagu aktif</p>' +
            '<p class="text-[11px] text-[#6b7280] mb-4">Lagu akan berhenti setelah lagu ini selesai diputar.</p>' +
            '<button onclick="clearSleepTimer()" class="px-6 py-2.5 rounded-full text-xs font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 active:scale-95 transition-all">Batalkan Timer</button>' +
        '</div>';
    } else {
        var options = [5, 10, 15, 30, 45, 60];
        var gridHtml = options.map(function(m) {
            return '<button onclick="startSleepTimer(' + m + ')" class="py-3 px-4 rounded-2xl bg-white/5 border border-white/5 text-sm text-white font-medium hover:bg-white/10 active:scale-95 transition-all">' + m + ' Menit</button>';
        }).join('');
        
        contentHtml = '<div class="grid grid-cols-3 gap-3 mb-4">' + gridHtml + '</div>' +
            '<button onclick="startSleepAtTrackEnd()" class="w-full py-3.5 px-4 rounded-2xl bg-[#cfd3d8]/10 hover:bg-[#cfd3d8]/20 border border-white/10 text-xs text-white font-bold active:scale-95 transition-all flex items-center justify-center gap-2">' +
                '<i data-lucide="music-4" class="w-4 h-4"></i> Hentikan di Akhir Lagu' +
            '</button>';
    }
    
    popup.innerHTML = '<div class="w-full max-w-md rounded-t-3xl p-6 border-t border-white/10 glass-strong" style="animation:slideUp 0.3s ease-out forwards; background: var(--bg-color);">' +
        '<div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4"></div>' +
        '<div class="flex justify-between items-center mb-5">' +
            '<div>' +
                '<h3 class="font-black text-white text-lg">Timer Tidur</h3>' +
                '<p class="text-[#6b7280] text-xs">Hentikan musik secara otomatis saat tidur</p>' +
            '</div>' +
            '<button onclick="closeSleepTimer()" class="text-[#6b7280] hover:text-white p-1"><i data-lucide="x" class="w-5 h-5"></i></button>' +
        '</div>' +
        contentHtml +
    '</div>';
    
    document.body.appendChild(popup);
    lucide.createIcons();
}

function closeSleepTimer() {
    var p = gid('sleep-timer-popup');
    if (p) p.remove();
}

function openPlaybackSpeed() {
    if (gid('playback-speed-popup')) return;
    
    var popup = document.createElement('div');
    popup.id = 'playback-speed-popup';
    popup.className = 'fixed inset-0 z-[300] flex items-end justify-center bg-black/60';
    popup.onclick = function(e) { if(e.target === popup) closePlaybackSpeed(); };
    
    var speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
    var currentSpeed = S.playbackRate || 1.0;
    
    var optionsHtml = speeds.map(function(sp) {
        var isSelected = currentSpeed === sp;
        var btnStyle = isSelected 
            ? 'bg-[#cfd3d8] text-black font-bold border-[#cfd3d8]' 
            : 'bg-white/5 hover:bg-white/10 text-white border-white/5';
        var label = sp === 1.0 ? '1.0x (Normal)' : sp + 'x';
        return '<button onclick="setPlaybackSpeed(' + sp + ')" class="w-full py-3.5 px-4 rounded-2xl border text-sm font-medium active:scale-98 transition-all flex items-center justify-between ' + btnStyle + '">' +
            '<span>' + label + '</span>' +
            (isSelected ? '<i data-lucide="check" class="w-4 h-4 text-black"></i>' : '') +
        '</button>';
    }).join('');
    
    popup.innerHTML = '<div class="w-full max-w-md rounded-t-3xl p-6 border-t border-white/10 glass-strong" style="animation:slideUp 0.3s ease-out forwards; background: var(--bg-color); max-height: 80vh; overflow-y: auto;">' +
        '<div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4"></div>' +
        '<div class="flex justify-between items-center mb-5">' +
            '<div>' +
                '<h3 class="font-black text-white text-lg">Kecepatan Putar</h3>' +
                '<p class="text-[#6b7280] text-xs">Atur kecepatan putar lagu sesuai seleramu</p>' +
            '</div>' +
            '<button onclick="closePlaybackSpeed()" class="text-[#6b7280] hover:text-white p-1"><i data-lucide="x" class="w-5 h-5"></i></button>' +
        '</div>' +
        '<div class="flex flex-col gap-2 mb-4">' +
            optionsHtml +
        '</div>' +
    '</div>';
    
    document.body.appendChild(popup);
    lucide.createIcons();
}

function setPlaybackSpeed(speed) {
    S.playbackRate = speed;
    try {
        localStorage.setItem('malamusic_playback_rate', speed);
    } catch(e) {}
    
    applyPlaybackSpeed();
    closePlaybackSpeed();
    showToast('Kecepatan putar diatur ke ' + (speed === 1.0 ? 'Normal' : speed + 'x'));
}

function applyPlaybackSpeed() {
    var speed = S.playbackRate || 1.0;
    if (AU) {
        try { AU.playbackRate = speed; } catch(e) {}
    }
    updateSpeedBadge();
}

function updateSpeedBadge() {
    var badge = gid('speed-badge');
    if (!badge) return;
    var speed = S.playbackRate || 1.0;
    badge.innerText = speed === 1.0 ? 'Normal' : speed + 'x';
}

function closePlaybackSpeed() {
    var p = gid('playback-speed-popup');
    if (p) p.remove();
}

function openEqualizer() {
    if (document.getElementById('equalizer-popup')) return;
    
    if (!S.eqBands) S.eqBands = [0, 0, 0, 0, 0];
    if (!S.activePreset) S.activePreset = 'Normal';
    
    var hadAudioCtx = !!audioCtx;
    setupWebAudioEQ();
    if (!hadAudioCtx && audioCtx && S.ct && !AU.paused) {
        var currTime = AU.currentTime;
        showToast('Mengaktifkan Equalizer...');
        loadTrack(S.ct, currTime);
    }
    
    var popup = document.createElement('div');
    popup.id = 'equalizer-popup';
    popup.className = 'fixed inset-0 z-[300] flex items-end justify-center bg-black/60';
    popup.onclick = function(e) { if(e.target === popup) closeEqualizer(); };
    
    var bandsList = ['Bass', 'Low-Mid', 'Mid', 'High-Mid', 'Treble'];
    var slidersHtml = bandsList.map(function(b, idx) {
        var val = S.eqBands[idx];
        return '<div class="flex flex-col items-center flex-1 gap-2">' +
            '<span id="eq-val-label-' + idx + '" class="text-[10px] text-[#6b7280] font-mono">' + (val > 0 ? '+' : '') + Math.round(val) + 'dB</span>' +
            '<input type="range" min="-12" max="12" step="0.5" value="' + val + '" ' +
                'class="eq-slider h-32" style="writing-mode: vertical-lr; direction: rtl; -webkit-appearance: slider-vertical; width: 12px;" ' +
                'oninput="changeSlider(' + idx + ', this.value)" />' +
            '<span class="text-xs text-[#a0a5b0] font-medium">' + b + '</span>' +
        '</div>';
    }).join('');
    
    var presets = ['Normal', 'Bass Booster', 'Vocal Booster', 'Electronic', 'Acoustic'];
    var presetsHtml = presets.map(function(p) {
        var act = S.activePreset === p;
        var btnStyle = act ? 'bg-[#cfd3d8]/20 text-white font-bold' : 'hover:bg-white/5 text-[#a0a5b0]';
        return '<button onclick="applyPreset(\'' + p + '\')" class="px-3.5 py-1.5 rounded-full text-xs transition-all ' + btnStyle + '">' + p + '</button>';
    }).join('');
    
    popup.innerHTML = '<div class="w-full max-w-md rounded-t-3xl p-6 border-t border-white/10 glass-strong" style="animation:slideUp 0.3s ease-out forwards; background: var(--bg-color);">' +
        '<div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4"></div>' +
        '<div class="flex justify-between items-center mb-4">' +
            '<div>' +
                '<h3 class="font-black text-white text-lg">Equalizer</h3>' +
                '<p class="text-[#6b7280] text-xs">Atur frekuensi suara sesuai selera</p>' +
            '</div>' +
            '<div id="visualizer-container" class="flex items-end gap-1 h-8 px-3 py-1 rounded-xl bg-white/5 shadow-inner" style="box-shadow: var(--nm-shadow-inset-sm);">' +
                '<div class="eq-bar"></div>' +
                '<div class="eq-bar"></div>' +
                '<div class="eq-bar"></div>' +
                '<div class="eq-bar"></div>' +
                '<div class="eq-bar"></div>' +
                '<div class="eq-bar"></div>' +
                '<div class="eq-bar"></div>' +
                '<div class="eq-bar"></div>' +
            '</div>' +
        '</div>' +
        
        '<div id="eq-presets-container" class="flex gap-2 overflow-x-auto hide-scrollbar pb-3 mb-6">' + presetsHtml + '</div>' +
        
        '<div class="flex items-center justify-around mb-8 h-48">' + slidersHtml + '</div>' +
        
        '<button onclick="closeEqualizer()" class="w-full btn-chrome py-3.5 font-bold rounded-full">Selesai</button>' +
    '</div>';
    
    document.body.appendChild(popup);
    lucide.createIcons();
    startEqVisualizer();
}

var eqVisInterval = null;
function startEqVisualizer() {
    // Disabled to improve performance and remove lag
}

function stopEqVisualizer() {
    // Disabled to improve performance and remove lag
}

function closeEqualizer() {
    stopEqVisualizer();
    var el = gid('equalizer-popup');
    if (el) el.remove();
}

function changeSlider(bandIdx, val) {
    if (!S.eqBands) S.eqBands = [0, 0, 0, 0, 0];
    var floatVal = parseFloat(val);
    S.eqBands[bandIdx] = floatVal;
    S.activePreset = 'Custom';
    
    var label = gid('eq-val-label-' + bandIdx);
    if (label) {
        label.innerText = (floatVal > 0 ? '+' : '') + Math.round(floatVal) + 'dB';
    }
    
    var pc = gid('eq-presets-container');
    if (pc) {
        var buttons = pc.querySelectorAll('button');
        buttons.forEach(function(btn) {
            btn.className = 'px-3.5 py-1.5 rounded-full text-xs transition-all hover:bg-white/5 text-[#a0a5b0]';
        });
    }
    
    updateEQGain(bandIdx, floatVal);
}

function applyPreset(presetName) {
    S.activePreset = presetName;
    if (!S.eqBands) S.eqBands = [0, 0, 0, 0, 0];
    
    var mapping = {
        'Normal': [0, 0, 0, 0, 0],
        'Bass Booster': [8, 5, 1, 0, -2],
        'Vocal Booster': [-3, 1, 6, 4, 1],
        'Electronic': [5, 3, -1, 2, 4],
        'Acoustic': [3, 1, 2, 3, 2]
    };
    
    var values = mapping[presetName] || [0, 0, 0, 0, 0];
    values.forEach(function(v, idx) {
        S.eqBands[idx] = v;
        updateEQGain(idx, v);
    });
    
    var pop = gid('equalizer-popup');
    if (pop) {
        pop.remove();
        openEqualizer();
    }
    showToast('Equalizer: ' + presetName);
}

function openShareCard() {
    if (!S.ct) {
        showToast('Putar lagu terlebih dahulu');
        return;
    }
    
    var popup = document.createElement('div');
    popup.id = 'share-card-popup';
    popup.className = 'fixed inset-0 z-[300] flex items-center justify-center bg-black/75 px-4';
    popup.onclick = function(e) { if(e.target === popup) popup.remove(); };
    
    popup.innerHTML = '<div class="w-full max-w-sm rounded-3xl p-6 border border-white/10 glass-strong text-center" style="animation:slideUp 0.3s ease-out forwards; background: var(--bg-color);">' +
        '<div class="flex justify-between items-center mb-4">' +
            '<h3 class="font-bold text-lg text-white">Bagikan Lagu</h3>' +
            '<button onclick="document.getElementById(\'share-card-popup\').remove()" class="text-[#a0a5b0] hover:text-white p-1"><i data-lucide="x" class="w-5 h-5"></i></button>' +
        '</div>' +
        
        '<div id="share-card-preview" class="p-6 rounded-2xl mb-6 flex flex-col items-center gap-4 relative overflow-hidden" ' +
            'style="box-shadow: var(--nm-shadow-inset); background: var(--bg-color); border: 1px solid var(--border-color);">' +
            '<img src="' + S.ct.cover + '" class="w-48 h-48 object-cover rounded-2xl  border border-white/5" />' +
            '<div class="w-full truncate">' +
                '<p class="text-white font-black text-lg truncate">' + es(S.ct.title) + '</p>' +
                '<p class="text-[#a0a5b0] text-xs font-bold mt-1 truncate">' + es(S.ct.artist) + '</p>' +
            '</div>' +
            '<div class="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden"><div class="h-full bg-gradient-to-r from-gray-400 to-white w-2/3"></div></div>' +
            '<div class="flex justify-between w-full text-[9px] text-[#6b7280] font-mono mt-1"><span>1:48</span><span>2:56</span></div>' +
            '<div class="border-t border-white/5 w-full pt-3 mt-1 flex items-center justify-center gap-1.5">' +
                '<i data-lucide="music" class="w-3.5 h-3.5 text-[#a0a5b0]"></i>' +
                '<span class="text-[10px] text-[#6b7280] tracking-wider font-semibold uppercase">MalaMusic Web App</span>' +
            '</div>' +
        '</div>' +
        
        '<div class="space-y-2.5">' +
            '<button onclick="downloadShareCard()" class="w-full btn-chrome py-3 flex items-center justify-center gap-2 font-bold">' +
                '<i data-lucide="download" class="w-4 h-4"></i> Unduh Gambar Card' +
            '</button>' +
            '<div class="grid grid-cols-2 gap-2">' +
                '<button onclick="copyShareLink()" class="btn-chrome py-3 text-sm font-semibold flex items-center justify-center gap-1.5">' +
                    '<i data-lucide="copy" class="w-4 h-4"></i> Salin Link' +
                '</button>' +
                '<button onclick="triggerNativeShare()" class="btn-chrome py-3 text-sm font-semibold flex items-center justify-center gap-1.5">' +
                    '<i data-lucide="share" class="w-4 h-4"></i> Bagikan' +
                '</button>' +
            '</div>' +
        '</div>' +
    '</div>';
    
    document.body.appendChild(popup);
    lucide.createIcons();
}

function copyShareLink() {
    if(!S.ct || !S.ct.videoId) return;
    var url = location.origin + '/play/' + S.ct.videoId + '?share=true';
    navigator.clipboard.writeText(url).then(function() {
        showToast('Link berhasil disalin ke clipboard!');
    }).catch(function() {
        showToast('Gagal menyalin link');
    });
}

function triggerNativeShare() {
    if(!S.ct || !S.ct.videoId) return;
    var url = location.origin + '/play/' + S.ct.videoId + '?share=true';
    if (navigator.share) {
        navigator.share({
            title: S.ct.title,
            text: 'Dengarkan ' + S.ct.title + ' - ' + S.ct.artist + ' di MalaMusic!',
            url: url
        }).catch(function() {});
    } else {
        copyShareLink();
    }
}

function downloadShareCard() {
    if (!S.ct) return;
    var canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 800;
    var ctx = canvas.getContext('2d');
    
    var grad = ctx.createLinearGradient(0, 0, 0, 800);
    var isLight = localStorage.getItem('theme') === 'light';
    if (isLight) {
        grad.addColorStop(0, '#e0e5ec');
        grad.addColorStop(1, '#c8d0db');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 600, 800);
    } else {
        grad.addColorStop(0, '#1a1b22');
        grad.addColorStop(1, '#0f1014');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 600, 800);
    }
    
    ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, 540, 740);
    
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() {
        ctx.save();
        var rx = 100, ry = 80, rw = 400, rh = 400, radius = 24;
        ctx.beginPath();
        ctx.moveTo(rx + radius, ry);
        ctx.lineTo(rx + rw - radius, ry);
        ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + radius);
        ctx.lineTo(rx + rw, ry + rh - radius);
        ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - radius, ry + rh);
        ctx.lineTo(rx + radius, ry + rh);
        ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - radius);
        ctx.lineTo(rx, ry + radius);
        ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, rx, ry, rw, rh);
        ctx.restore();
        
        ctx.fillStyle = isLight ? '#2d3748' : '#ffffff';
        ctx.font = '900 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(S.ct.title, 300, 540, 480);
        
        ctx.fillStyle = isLight ? '#718096' : '#a0a5b0';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(S.ct.artist, 300, 585, 480);
        
        ctx.fillStyle = isLight ? '#a0aec0' : '#4a5568';
        ctx.font = '16px monospace';
        ctx.fillText('DIDENGARKAN DI MALAMUSIC', 300, 710);
        
        try {
            var dataUrl = canvas.toDataURL('image/png');
            var a = document.createElement('a');
            a.download = S.ct.title.replace(/[^a-zA-Z0-9]/g, '_') + '_malamusic.png';
            a.href = dataUrl;
            a.click();
            showToast('Berhasil mengunduh Share Card!');
        } catch(e) {
            showToast('Gagal unduh karena CORS gambar, silakan screenshot layar!');
        }
    };
    img.onerror = function() {
        ctx.fillStyle = isLight ? '#2d3748' : '#ffffff';
        ctx.font = '900 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(S.ct.title, 300, 300, 480);
        
        ctx.fillStyle = isLight ? '#718096' : '#a0a5b0';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(S.ct.artist, 300, 360, 480);
        
        ctx.fillStyle = isLight ? '#a0aec0' : '#4a5568';
        ctx.font = '16px monospace';
        ctx.fillText('DIDENGARKAN DI MALAMUSIC', 300, 710);
        
        try {
            var dataUrl = canvas.toDataURL('image/png');
            var a = document.createElement('a');
            a.download = S.ct.title.replace(/[^a-zA-Z0-9]/g, '_') + '_malamusic.png';
            a.href = dataUrl;
            a.click();
            showToast('Berhasil mengunduh Share Card (tanpa cover)!');
        } catch(ex) {
            showToast('Gagal mengunduh Share Card');
        }
    };
    img.src = S.ct.cover || FI;
}

// DAFTAR ANTRIAN (QUEUE)
function openQueue(){
    if(gid('queue-popup'))return;
    var popup=document.createElement('div');
    popup.id='queue-popup';
    popup.className='fixed inset-0 z-[300] flex items-end justify-center bg-black/60';
    popup.onclick=function(e){if(e.target===popup)closeQueue();};

    var listHtml='';
    if(!S.pl||S.pl.length===0){
        listHtml='<div class="text-center text-[#6b7280] py-10"><i data-lucide="list-music" class="w-12 h-12 mx-auto mb-3 opacity-30"></i><p class="text-sm">Antrian kosong</p></div>';
    }else{
        listHtml=S.pl.map(function(t,i){
            var active=i===S.pi;
            return '<div onclick="playQueueIndex('+i+')" class="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer active:scale-[0.98] '+(active?'bg-white/10':'hover:bg-white/5')+'">'+
                '<img src="'+t.cover+'" class="w-11 h-11 rounded-lg object-cover flex-shrink-0" onerror="this.src=\''+FI+'\'" />'+
                '<div class="flex-1 truncate"><p class="text-sm font-medium truncate '+(active?'text-[#cfd3d8]':'text-white')+'">'+es(t.title)+'</p><p class="text-[#6b7280] text-xs truncate">'+es(t.artist)+'</p></div>'+
                (active?'<i data-lucide="volume-2" class="w-4 h-4 text-[#cfd3d8] flex-shrink-0"></i>':'<span class="text-[#6b7280] text-xs flex-shrink-0">'+(i+1)+'</span>')+
            '</div>';
        }).join('');
    }

    popup.innerHTML='<div class="w-full max-w-md rounded-t-3xl p-6 border-t border-white/10 glass-strong" style="animation:slideUp 0.3s ease-out forwards; background: var(--bg-color); max-height:75vh; display:flex; flex-direction:column;">'+
        '<div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4 flex-shrink-0"></div>'+
        '<div class="flex justify-between items-center mb-4 flex-shrink-0">'+
            '<div><h3 class="font-black text-white text-lg">Daftar Antrian</h3><p class="text-[#6b7280] text-xs">'+(S.pl?S.pl.length:0)+' lagu dalam antrian</p></div>'+
            '<button onclick="closeQueue()" class="text-[#6b7280] hover:text-white p-1"><i data-lucide="x" class="w-5 h-5"></i></button>'+
        '</div>'+
        '<div class="overflow-y-auto hide-scrollbar space-y-1 flex-1">'+listHtml+'</div>'+
    '</div>';

    document.body.appendChild(popup);
    lucide.createIcons();
}
function closeQueue(){var p=gid('queue-popup');if(p)p.remove();}
function playQueueIndex(i){
    if(!S.pl||!S.pl[i])return;
    S.pi=i;S.ct=S.pl[i];
    var url=location.origin+'/play/'+S.ct.videoId;history.pushState({},'',url);
    UU();MP.show();S.il=true;UB();
    resetLyricsUI(S.ct.videoId);
    loadTrack(S.ct);
    closeQueue();
}

// UNDUH LAGU (AUDIO)
function downloadCurrentSong(){
    if(!S.ct)return;
    showToast('Menyiapkan unduhan...');
    var ytUrl=S.ct.ytUrl||('https://youtube.com/watch?v='+S.ct.videoId);
    fetch(API.ytplay,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:ytUrl})})
        .then(function(r){return r.json();})
        .then(function(d){
            if(d&&d.status&&d.result&&d.result.download&&d.result.download.audio){
                var audioUrl=d.result.download.audio;
                var a=document.createElement('a');
                a.href='/api/proxy-audio?url='+encodeURIComponent(audioUrl);
                a.download=(S.ct.title||'lagu').replace(/[^a-zA-Z0-9]/g,'_')+'.mp3';
                document.body.appendChild(a);
                a.click();
                a.remove();
                showToast('Unduhan dimulai!');
            }else{
                showToast('Gagal mengambil link unduhan');
            }
        })
        .catch(function(){showToast('Gagal mengunduh lagu');});
}
