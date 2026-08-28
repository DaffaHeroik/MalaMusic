var Profile = {
    listeningSyncTimer: null,
    render: function() {
        var el = gid('view-dev');
        if (!el) return;
        var playlists = typeof getUserPlaylists === 'function' ? getUserPlaylists() : [];
        var liked = typeof getLikedSongs === 'function' ? getLikedSongs() : [];
        var offline = typeof getOfflineSongs === 'function' ? getOfflineSongs() : [];
        var recent = [];
        try { recent = JSON.parse(localStorage.getItem('mala_recent_tracks') || '[]'); } catch (_) {}

        el.innerHTML = `
        <div class="min-h-full bg-[#0b0b0f]">
            <div class="relative overflow-hidden px-5 sm:px-8 pt-7 pb-8 border-b border-white/10" style="background: radial-gradient(circle at 78% 5%, rgba(244,63,94,.30), transparent 38%), linear-gradient(135deg, #241d29, #0b0b0f 72%);">
                <div class="absolute -right-24 -top-28 w-80 h-80 rounded-full bg-rose-500/10 blur-3xl pointer-events-none"></div>
                <div class="relative flex items-center gap-4 sm:gap-6 max-w-6xl mx-auto">
                    <div id="profile-avatar-wrap" class="relative w-20 h-20 sm:w-28 sm:h-28 rounded-full shrink-0 overflow-hidden bg-gradient-to-br from-rose-400 to-purple-700 shadow-2xl ring-4 ring-white/10 flex items-center justify-center">
                        <img id="profile-avatar" src="/logo-mark.png" class="relative z-10 w-full h-full object-cover" alt="Avatar Profil" onerror="this.onerror=null;this.src='/logo-mark.png'" />
                        <i data-lucide="user" class="absolute inset-0 m-auto z-0 w-10 h-10 text-white/80 pointer-events-none"></i>
                        <button onclick="Profile.chooseAvatar()" class="absolute z-20 bottom-0.5 right-0.5 w-8 h-8 rounded-full bg-black/75 border border-white/20 text-white flex items-center justify-center shadow-xl hover:bg-black transition-colors" title="Ganti avatar" aria-label="Ganti avatar"><i data-lucide="camera" class="w-4 h-4"></i></button>
                    </div>
                    <div class="min-w-0 flex-1">
                        <div class="flex flex-wrap items-center gap-2 mb-2"><span class="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[.16em] text-white/70"><i data-lucide="headphones" class="w-3 h-3 text-rose-200"></i>Profil pendengar</span><span class="text-[10px] text-white/40">MalaMusic</span></div>
                        <h1 id="profile-name" class="text-2xl sm:text-4xl font-black text-white tracking-tight truncate">Profil Saya</h1>
                        <p id="profile-subtitle" class="text-xs sm:text-sm text-white/60 mt-1.5 truncate">Koleksi musik, kebiasaan mendengar, dan playlist pilihanmu</p>
                        <div class="flex flex-wrap gap-2 mt-3"><span class="inline-flex items-center gap-1.5 rounded-full bg-rose-400/15 border border-rose-300/20 px-2.5 py-1 text-[10px] font-bold text-rose-100"><i data-lucide="radio" class="w-3 h-3"></i>Aktivitas lintas perangkat</span><span class="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/10 px-2.5 py-1 text-[10px] font-bold text-white/60"><i data-lucide="shield-check" class="w-3 h-3"></i>Data tetap milikmu</span></div>
                    </div>
                    <button onclick="Profile.showSettings()" class="hidden sm:inline-flex shrink-0 items-center gap-2 rounded-full bg-white/10 border border-white/15 px-4 py-2.5 text-xs font-black text-white hover:bg-white/15 transition-colors" aria-label="Buka pengaturan profil"><i data-lucide="settings" class="w-4 h-4"></i>Pengaturan</button>
                </div>
            </div>

            <div class="max-w-6xl mx-auto px-4 sm:px-8 py-5 sm:py-7">
                <div id="profile-account-panel" class="mb-5"></div>
                <div class="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,.65fr)] gap-4 mb-6">
                    <section id="profile-activity-zone" class="min-w-0"><div id="profile-listening-card"></div></section>
                    <aside id="profile-streak-zone" class="min-w-0"><div id="profile-streak-card"></div></aside>
                </div>
                <nav aria-label="Navigasi profil" class="sticky top-0 z-20 -mx-4 sm:-mx-8 px-4 sm:px-8 py-2 mb-7 bg-[#0b0b0f]/90 backdrop-blur-xl border-y border-white/[.06] overflow-x-auto"><div class="flex items-center gap-1 min-w-max"><a href="#profile-activity-zone" class="rounded-full px-3 py-2 text-[11px] font-bold text-white/60 hover:bg-white/10 hover:text-white">Aktivitas</a><a href="#profile-collection-zone" class="rounded-full px-3 py-2 text-[11px] font-bold text-white/60 hover:bg-white/10 hover:text-white">Koleksi</a><a href="#profile-recent-zone" class="rounded-full px-3 py-2 text-[11px] font-bold text-white/60 hover:bg-white/10 hover:text-white">Terakhir diputar</a><a href="#profile-public-zone" class="rounded-full px-3 py-2 text-[11px] font-bold text-white/60 hover:bg-white/10 hover:text-white">Playlist publik</a><button onclick="Profile.showSettings()" class="rounded-full px-3 py-2 text-[11px] font-bold text-white/60 hover:bg-white/10 hover:text-white"><i data-lucide="sliders-horizontal" class="inline w-3.5 h-3.5 mr-1"></i>Pengaturan</button></div></nav>

                <section id="profile-collection-zone" class="mb-8"><div class="flex items-end justify-between mb-3"><div><p class="text-[10px] uppercase tracking-[.18em] text-rose-300/70 font-black">Pusat koleksi</p><h2 class="text-xl font-black text-white mt-1">Musik kamu</h2></div><button onclick="App.switch('library')" class="text-xs font-bold text-white/50 hover:text-white">Buka koleksi <i data-lucide="arrow-up-right" class="inline w-3.5 h-3.5"></i></button></div><div class="grid grid-cols-2 sm:grid-cols-4 gap-3"><button onclick="App.switch('liked')" class="group relative text-left rounded-2xl overflow-hidden bg-gradient-to-br from-[#5436a3] to-[#c53d70] p-4 min-h-[142px] flex flex-col justify-end shadow-lg hover:-translate-y-0.5 transition-transform"><i data-lucide="heart" class="w-7 h-7 text-white fill-current mb-auto opacity-90"></i><span class="text-white font-bold text-sm">Lagu Disukai</span><span class="text-white/60 text-xs mt-1">${liked.length} lagu tersimpan</span></button><button onclick="App.switch('offline')" class="group relative text-left rounded-2xl overflow-hidden bg-gradient-to-br from-[#164e63] to-[#0f766e] p-4 min-h-[142px] flex flex-col justify-end shadow-lg hover:-translate-y-0.5 transition-transform"><i data-lucide="download" class="w-7 h-7 text-white mb-auto opacity-90"></i><span class="text-white font-bold text-sm">Siap Offline</span><span class="text-white/60 text-xs mt-1">${offline.length} lagu di perangkat</span></button><button onclick="App.switch('library')" class="group relative text-left rounded-2xl overflow-hidden bg-gradient-to-br from-[#3b3b3b] to-[#111] p-4 min-h-[142px] flex flex-col justify-end shadow-lg hover:-translate-y-0.5 transition-transform"><i data-lucide="library" class="w-7 h-7 text-white mb-auto opacity-90"></i><span class="text-white font-bold text-sm">Playlist Kamu</span><span class="text-white/60 text-xs mt-1">${playlists.length} koleksi</span></button><div id="profile-auth-collection-action"></div></div></section>

                <section id="profile-recent-zone" class="mb-8"><div class="flex items-end justify-between mb-3"><div><p class="text-[10px] uppercase tracking-[.18em] text-white/35 font-black">Riwayat personal</p><h2 class="text-xl font-black text-white mt-1">Terakhir diputar</h2></div><button onclick="Profile.showHistory()" class="text-xs font-bold text-white/50 hover:text-white">Lihat semua <i data-lucide="arrow-right" class="inline w-3.5 h-3.5"></i></button></div><div id="profile-recent-list" class="rounded-2xl bg-white/[.04] border border-white/10 overflow-hidden"></div></section>

                <section id="profile-public-zone" class="mb-8 rounded-2xl bg-white/[.04] border border-white/10 overflow-hidden"><div class="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-3"><div class="flex items-center gap-3"><span class="w-10 h-10 rounded-xl bg-amber-300/10 flex items-center justify-center"><i data-lucide="globe-2" class="w-5 h-5 text-amber-300"></i></span><div><p class="text-[10px] uppercase tracking-[.16em] text-amber-200/60 font-black">Berbagi</p><h2 class="text-base font-black text-white mt-0.5">Playlist publik</h2><p class="text-xs text-white/50 mt-1">Pilih koleksi yang ingin kamu bagikan.</p></div></div><span class="hidden sm:inline text-[10px] font-bold text-white/35">Visibilitas</span></div><div id="profile-public-playlists" class="divide-y divide-white/10"></div></section>

                <div class="grid grid-cols-3 gap-2 sm:gap-3 mb-7"><div class="rounded-2xl bg-white/[.04] border border-white/10 p-3.5 sm:p-4"><span class="flex items-center gap-1.5 text-[10px] text-white/40"><i data-lucide="heart" class="w-3.5 h-3.5 text-rose-300"></i>Disukai</span><strong class="block text-xl sm:text-2xl font-black text-white mt-2">${liked.length}</strong></div><div class="rounded-2xl bg-white/[.04] border border-white/10 p-3.5 sm:p-4"><span class="flex items-center gap-1.5 text-[10px] text-white/40"><i data-lucide="list-music" class="w-3.5 h-3.5 text-violet-300"></i>Playlist</span><strong class="block text-xl sm:text-2xl font-black text-white mt-2">${playlists.length}</strong></div><div class="rounded-2xl bg-white/[.04] border border-white/10 p-3.5 sm:p-4"><span class="flex items-center gap-1.5 text-[10px] text-white/40"><i data-lucide="smartphone" class="w-3.5 h-3.5 text-cyan-300"></i>Offline</span><strong class="block text-xl sm:text-2xl font-black text-white mt-2">${offline.length}</strong></div></div>

                <div id="pwa-install-action" class="mb-6"></div>
                <section class="rounded-2xl bg-white/[.04] border border-white/10 overflow-hidden mb-8"><div id="profile-account-panel-secondary"></div><div id="profile-auth-secondary-action"></div><button onclick="Profile.showSettings()" class="w-full flex items-center gap-3 px-4 py-4 text-left border-t border-white/10 hover:bg-white/[.06] transition-colors"><i data-lucide="settings" class="w-5 h-5 text-white/60"></i><span class="flex-1"><strong class="block text-sm text-white">Pengaturan dan privasi</strong><span class="block text-xs text-white/50">Playback, tampilan, data, dan akun</span></span><i data-lucide="chevron-right" class="w-4 h-4 text-white/40"></i></button></section>
                <p class="text-center text-xs text-white/30 pb-4">Dibuat untuk menemani sesi dengarmu.</p>
            </div>
        </div>`;

        this.renderRecentList();
        this.renderPwaInstallAction();

        if (window.lucide && typeof lucide.createIcons === 'function') lucide.createIcons();
        EmailAuth.renderAuthActions(false);
        Profile.renderPublicPlaylistSettings();
        Profile.refreshListeningStats();
        EmailAuth.refresh();
        if (typeof Streak !== 'undefined') Streak.refreshProfileCard();
        Profile.startListeningStatsSync();
    },
    renderPwaInstallAction: function() {
        var target = document.getElementById('pwa-install-action');
        if (!target) return;
        if (typeof isPwaInstalled === 'function' && isPwaInstalled()) { target.innerHTML = ''; return; }
        target.innerHTML = '<button id="pwa-install-btn" onclick="installPWA()" class="w-full flex items-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border border-cyan-300/25 px-4 py-4 text-left hover:bg-cyan-400/15 transition-colors" aria-label="Install MalaMusic sebagai aplikasi"><span class="w-11 h-11 rounded-xl bg-cyan-300/15 border border-cyan-200/20 flex items-center justify-center shrink-0"><i data-lucide="download-cloud" class="w-5 h-5 text-cyan-200"></i></span><span class="min-w-0 flex-1"><strong class="block text-sm text-white">Install MalaMusic</strong><span class="block text-xs text-white/55 mt-1">Tambahkan aplikasi musik ini ke layar utama perangkat</span></span><i data-lucide="chevron-right" class="w-4 h-4 text-white/45"></i></button>';
        if (typeof refreshPwaInstallButton === 'function') refreshPwaInstallButton();
        if (window.lucide && typeof lucide.createIcons === 'function') lucide.createIcons();
    },
    renderRecentList: function() {
        var recent = [];
        try { recent = JSON.parse(localStorage.getItem('mala_recent_tracks') || '[]'); } catch (_) {}
        var recentEl = document.getElementById('profile-recent-list');
        if (!recentEl) return;
        if (!recent.length) { recentEl.innerHTML = '<div class="p-6 text-center text-sm text-white/50">Belum ada aktivitas terbaru.<button onclick="App.switch(\'home\')" class="block mx-auto mt-3 rounded-full bg-white/10 border border-white/15 px-4 py-2 text-xs font-bold text-white">Buka Beranda</button></div>'; return; }
        var spotlight = recent[0], spotlightId = String(spotlight.id || spotlight.videoId || '').replace(/'/g, '');
        var spotlightHtml = '<button onclick="App.autoPlayTrack(\'' + spotlightId + '\')" class="w-full flex items-center gap-3 sm:gap-4 p-4 text-left bg-gradient-to-r from-white/[.08] to-transparent hover:from-white/[.12] transition-colors"><img src="' + (spotlight.cover || FI) + '" class="w-16 h-16 rounded-xl object-cover shadow-lg" alt="" onerror="this.src=\'' + FI + '\'" /><span class="min-w-0 flex-1"><span class="flex items-center gap-1.5 text-[10px] uppercase tracking-[.16em] font-black text-rose-200/70"><i data-lucide="history" class="w-3 h-3"></i>Terakhir diputar</span><strong class="block text-base text-white truncate mt-1">' + es(spotlight.title || 'Lagu') + '</strong><span class="block text-xs text-white/50 truncate mt-0.5">' + es(spotlight.artist || 'MalaMusic') + '</span></span><span class="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shrink-0"><i data-lucide="play" class="w-4 h-4 fill-current"></i></span></button>';
        var rowsHtml = recent.slice(1, 4).map(function(track) { var id = String(track.id || track.videoId || '').replace(/'/g, ''); return '<button onclick="App.autoPlayTrack(\'' + id + '\')" class="w-full flex items-center gap-3 p-3 text-left hover:bg-white/[.06] border-t border-white/5 transition-colors"><img src="' + (track.cover || FI) + '" class="w-11 h-11 rounded-lg object-cover" alt="" onerror="this.src=\'' + FI + '\'" /><span class="min-w-0 flex-1"><strong class="block text-sm text-white truncate">' + es(track.title || 'Lagu') + '</strong><span class="block text-xs text-white/50 truncate mt-0.5">' + es(track.artist || 'MalaMusic') + '</span></span><i data-lucide="play-circle" class="w-4 h-4 text-white/35"></i></button>'; }).join('');
        recentEl.innerHTML = spotlightHtml + (rowsHtml ? '<div class="bg-black/10">' + rowsHtml + '</div>' : '');
        if (window.lucide && typeof lucide.createIcons === 'function') lucide.createIcons();
    },
    startListeningStatsSync: function() {
        if (this.listeningSyncTimer) return;
        var self = this;
        this.listeningSyncTimer = setInterval(function() {
            if (document.visibilityState === 'visible' && document.getElementById('profile-listening-card')) self.refreshListeningStats();
        }, 15000);
    },
    refreshListeningStats: async function() {
        var el = document.getElementById('profile-listening-card'); if (!el) return;
            el.innerHTML = '<div aria-live="polite" class="rounded-2xl bg-gradient-to-br from-amber-500/15 via-rose-500/10 to-white/[.03] border border-amber-300/15 p-5"><div class="h-8 w-32 rounded-lg bg-white/10 animate-pulse"></div><div class="h-4 w-56 max-w-full mt-3 rounded bg-white/[.07] animate-pulse"></div></div>';
        try {
            var response = await fetch('/api/stats?action=me', { credentials: 'same-origin', cache: 'no-store' });
            if (!response.ok) throw new Error('stats unavailable');
            var data = await response.json(), s = data.stats || {};
            // Use account-scoped stats as the single source of truth across devices.
            // The legacy /api/streak cookie may be stale or absent on a new device.
            var currentStreak = Number(s.streak || 0), bestStreak = Number(s.bestStreak || 0), activeDays = Number(s.activeDays || 0), hours = Number(s.hours || 0).toFixed(1);
            el.innerHTML = '<div aria-live="polite" class="rounded-2xl bg-gradient-to-br from-amber-500/15 via-rose-500/10 to-white/[.03] border border-amber-300/15 p-5 shadow-lg"><div class="flex items-start justify-between gap-4"><div class="min-w-0"><p class="text-[10px] uppercase tracking-[.18em] text-amber-200/70 font-black">Ringkasan mendengar</p><strong class="block text-4xl font-black tracking-tight text-white mt-1">'+hours+' jam</strong><p class="text-xs text-white/55 mt-2">Waktu audio yang benar-benar berjalan · tersinkron di akunmu</p></div><span class="w-12 h-12 rounded-2xl bg-amber-300/15 border border-amber-200/10 flex items-center justify-center shrink-0"><i data-lucide="clock-3" class="w-6 h-6 text-amber-200"></i></span></div><div class="grid grid-cols-3 gap-2 mt-5"><div class="rounded-xl bg-black/15 border border-white/10 px-3 py-2.5"><strong class="block text-lg font-black text-white">'+activeDays+'</strong><span class="text-[10px] text-white/45">Hari aktif</span></div><div class="rounded-xl bg-black/15 border border-white/10 px-3 py-2.5"><strong class="block text-lg font-black text-amber-200">'+currentStreak+'</strong><span class="text-[10px] text-white/45">Streak kini</span></div><div class="rounded-xl bg-black/15 border border-white/10 px-3 py-2.5"><strong class="block text-lg font-black text-white">'+bestStreak+'</strong><span class="text-[10px] text-white/45">Rekor terbaik</span></div></div></div>'; lucide.createIcons();
        } catch (_) { el.innerHTML = ''; }
    },
    renderPublicPlaylistSettings: function() {
        var el = document.getElementById('profile-public-playlists'); if (!el) return;
        var playlists = typeof getUserPlaylists === 'function' ? getUserPlaylists() : [];
        if (!playlists.length) { el.innerHTML = '<div class="p-5 text-sm text-white/50">Belum ada playlist untuk diatur.</div>'; return; }
        el.innerHTML = playlists.map(function(pl) {
            var isSavedExternal = pl.source === 'youtube' || Boolean(pl.externalId);
            var isPublic = !isSavedExternal && Boolean(pl.isPublic || pl.publicId);
            var status = isSavedExternal ? 'Publik · Disimpan dari playlist umum' : (isPublic ? 'Dapat dibagikan publik' : 'Hanya kamu');
            var creator = isSavedExternal && pl.creator ? ' · Oleh ' + es(pl.creator) : '';
            var control = isSavedExternal ? '<span class="shrink-0 rounded-full bg-emerald-400/10 border border-emerald-300/20 text-emerald-200 px-3 py-2 text-[10px] sm:text-[11px] font-black">Publik asli</span>' : '<button onclick="Profile.togglePlaylistPublic(\''+String(pl.id).replace(/'/g,'')+'\')" class="shrink-0 max-w-[42%] truncate rounded-full px-3 py-2 text-[10px] sm:text-[11px] font-black '+(isPublic ? 'bg-amber-300 text-black' : 'bg-white/10 text-white')+'">'+(isPublic ? 'Publik' : 'Jadikan publik')+'</button>';
            return '<div class="flex items-center gap-3 p-4 min-w-0"><img src="'+(pl.image || (pl.songs[0] && pl.songs[0].cover) || FI)+'" class="w-11 h-11 shrink-0 rounded-xl object-cover" onerror="this.src=\''+FI+'\'" /><div class="min-w-0 flex-1"><strong class="block text-sm text-white truncate">'+es(pl.name)+'</strong><span class="block text-xs text-white/50 mt-1 truncate">'+status+creator+'</span></div>'+control+'</div>';
        }).join('');
        if (window.lucide && typeof lucide.createIcons === 'function') lucide.createIcons();
    },
    togglePlaylistPublic: async function(id) {
        var playlists = typeof getUserPlaylists === 'function' ? getUserPlaylists() : [], pl = playlists.find(function(item){return item.id === id;}); if (!pl) return;
        var next = !(pl.isPublic || pl.publicId);
        try { var response = await fetch('/api/stats?action=publish-playlist', { method:'POST', credentials:'same-origin', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id:id,name:pl.name,image:pl.image||'',songs:pl.songs||[],isPublic:next}) }); var data=await response.json(); if(!response.ok||!data.status) throw new Error(); pl.isPublic=next; if(data.id) pl.publicId=data.id; if(!next) delete pl.publicId; if(typeof saveUserPlaylists==='function') saveUserPlaylists(playlists); Profile.render(); showToast(next?'Playlist sekarang publik':'Playlist disembunyikan'); } catch (_) { showToast('Login diperlukan untuk mengatur playlist publik'); }
    },
    clearHistory: function() {
        try { localStorage.removeItem('mala_recent_tracks'); } catch (_) {}
        if (typeof syncLibraryRemote === 'function') syncLibraryRemote({ clearRecentTracks: true });
        this.render();
        showToast('Riwayat dihapus dan sedang disinkronkan ke akun');
    },
    showHistory: function() {
        var recent = typeof getRecentTracks === 'function' ? getRecentTracks() : [];
        var modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-[400] flex items-end sm:items-center justify-center bg-black/75 px-0 sm:px-4';
        modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
        var rows = recent.length ? recent.map(function(track) {
            var id = String(track.id || track.videoId || '').replace(/'/g, '');
            return '<button onclick="App.autoPlayTrack(\'' + id + '\');this.closest(\'.fixed\').remove()" class="w-full flex items-center gap-3 p-3 text-left hover:bg-white/[.06] border-b border-white/5 last:border-0"><img src="' + (track.cover || FI) + '" class="w-11 h-11 rounded-lg object-cover" onerror="this.src=\'' + FI + '\'" /><span class="min-w-0 flex-1"><strong class="block text-sm text-white truncate">' + es(track.title || 'Lagu') + '</strong><span class="block text-xs text-white/50 truncate">' + es(track.artist || 'MalaMusic') + '</span></span><i data-lucide="play" class="w-4 h-4 text-white/60"></i></button>';
        }).join('') : '<div class="p-8 text-center text-white/50 text-sm">Belum ada riwayat pemutaran.</div>';
        modal.innerHTML = '<div class="w-full sm:max-w-lg max-h-[85vh] overflow-hidden rounded-t-3xl sm:rounded-3xl bg-[#15151b] border border-white/10 shadow-2xl"><div class="flex items-center justify-between p-5 border-b border-white/10"><div><h3 class="font-black text-white text-lg">Riwayat Pemutaran</h3><p class="text-xs text-white/50 mt-1">Lagu yang baru kamu dengarkan</p></div><button onclick="this.closest(\'.fixed\').remove()" class="w-9 h-9 rounded-full bg-white/10 text-white">×</button></div><div class="max-h-[55vh] overflow-y-auto">' + rows + '</div><div class="p-4 border-t border-white/10 flex gap-2"><button onclick="Profile.clearHistory();this.closest(\'.fixed\').remove()" class="flex-1 rounded-xl bg-rose-500/15 border border-rose-400/20 text-rose-200 py-3 text-xs font-bold">Hapus Riwayat</button><button onclick="this.closest(\'.fixed\').remove()" class="flex-1 rounded-xl bg-white/10 text-white py-3 text-xs font-bold">Tutup</button></div></div>';
        document.body.appendChild(modal); lucide.createIcons();
    },
    avatarKey: 'malamusic_profile_avatar',
    remoteProfile: null,
    avatarSource: function(user) {
        var stored = '';
        try { stored = localStorage.getItem(this.avatarKey) || ''; } catch (_) {}
        if (this.remoteProfile && /^data:image\//i.test(String(this.remoteProfile.picture || ''))) return this.remoteProfile.picture;
        if (/^data:image\//i.test(stored)) return stored;
        if (user && /^https?:\/\//i.test(String(user.picture || ''))) return String(user.picture);
        if (!user || !user.email) return '/logo-mark.png';
        var label = String(user.name || user.email.split('@')[0] || 'M').trim().split(/\s+/).slice(0, 2).map(function(part) { return part.charAt(0); }).join('').toUpperCase().slice(0, 2) || 'M';
        var colors = ['#be123c', '#7c3aed', '#0369a1', '#047857', '#b45309'];
        var color = colors[(String(user.email).length + label.charCodeAt(0)) % colors.length];
        var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" rx="128" fill="' + color + '"/><text x="128" y="145" text-anchor="middle" font-family="Arial,sans-serif" font-size="92" font-weight="700" fill="white">' + label + '</text></svg>';
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    },
    applyAvatar: function(user) {
        var avatar = document.getElementById('profile-avatar');
        if (!avatar) return;
        var source = this.avatarSource(user);
        avatar.onerror = function() {
            avatar.onerror = null;
            avatar.src = '/logo-mark.png';
        };
        avatar.src = source || '/logo-mark.png';
        avatar.style.display = 'block';
    },
    chooseAvatar: function() {
        var input = document.createElement('input');
        input.type = 'file'; input.accept = 'image/png,image/jpeg,image/webp';
        input.onchange = function() {
            var file = input.files && input.files[0]; if (!file) return;
            if (file.size > 8 * 1024 * 1024) { showToast('Avatar maksimal 8 MB'); return; }
            var reader = new FileReader();
            reader.onload = function() {
                var image = new Image();
                image.onload = function() {
                    var canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 256;
                    var ctx = canvas.getContext('2d'); var size = Math.min(image.width, image.height);
                    var sx = (image.width - size) / 2, sy = (image.height - size) / 2;
                    ctx.drawImage(image, sx, sy, size, size, 0, 0, 256, 256);
                    try {
                        var picture = canvas.toDataURL('image/jpeg', 0.82);
                        localStorage.setItem(Profile.avatarKey, picture);
                        Profile.remoteProfile = Object.assign({}, Profile.remoteProfile || {}, { picture: picture });
                        Profile.applyAvatar(null);
                        fetch('/api/profile', { method: 'PATCH', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ picture: picture }) })
                            .then(function(response) { return response.json().catch(function(){ return {}; }).then(function(data){ if (!response.ok || !data.status) throw new Error(data.message || 'gagal'); return data; }); })
                            .then(function(data) { Profile.remoteProfile = data.profile || Profile.remoteProfile; showToast('Avatar tersimpan dan tersinkron di semua perangkat'); })
                            .catch(function() { showToast('Avatar tersimpan di perangkat ini, tetapi sinkronisasi server gagal'); });
                    } catch (_) { showToast('Avatar gagal disimpan'); }
                };
                image.onerror = function() { showToast('Format avatar tidak dapat dibaca'); };
                image.src = reader.result;
            };
            reader.readAsDataURL(file);
        };
        input.click();
    },
    clearAvatar: function() {
        try { localStorage.removeItem(this.avatarKey); } catch (_) {}
        this.remoteProfile = Object.assign({}, this.remoteProfile || {}, { picture: '' });
        this.applyAvatar(null);
        fetch('/api/profile', { method: 'PATCH', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ picture: '' }) })
            .then(function(response) { if (!response.ok) throw new Error('gagal'); showToast('Avatar dikembalikan ke avatar akun'); })
            .catch(function() { showToast('Avatar lokal dihapus, tetapi server belum berubah'); });
    },
    exportLocalData: function() {
        var keys = ['malamusic_liked_songs', 'malamusic_playlists', 'pwa_offline_tracks', 'malamusic_recent_tracks', 'mala_recent_searches', 'malamusic_auto_next', 'malamusic_bg_glow_enabled', 'malamusic_profile_avatar'];
        var data = { exportedAt: new Date().toISOString(), app: 'MalaMusic', version: 1, data: {} };
        keys.forEach(function(key) { data.data[key] = localStorage.getItem(key); });
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a'); a.href = url; a.download = 'malamusic-backup-' + new Date().toISOString().slice(0, 10) + '.json'; a.click();
        setTimeout(function() { URL.revokeObjectURL(url); }, 1000); showToast('Backup data berhasil dibuat');
    },
    importLocalData: function() {
        var input = document.createElement('input'); input.type = 'file'; input.accept = 'application/json,.json';
        input.onchange = function() { var file = input.files && input.files[0]; if (!file) return; var reader = new FileReader(); reader.onload = function() { try { var payload = JSON.parse(reader.result); if (!payload || payload.app !== 'MalaMusic' || !payload.data) throw new Error('Format backup tidak cocok'); Object.keys(payload.data).forEach(function(key) { if (payload.data[key] !== null && payload.data[key] !== undefined) localStorage.setItem(key, payload.data[key]); }); showToast('Backup berhasil dipulihkan'); Profile.render(); } catch (e) { showToast('Backup tidak valid'); } }; reader.readAsText(file); };
        input.click();
    },
    showSettings: function() {
        var autoNext = typeof S !== 'undefined' ? S.autoNext !== false : localStorage.getItem('malamusic_auto_next') !== 'false';
        var glow = typeof FullPlayer !== 'undefined' ? FullPlayer.bgGlowEnabled !== false : localStorage.getItem('malamusic_bg_glow_enabled') !== '0';
        var speed = typeof S !== 'undefined' ? Number(S.playbackRate || 1) : Number(localStorage.getItem('malamusic_playback_rate') || 1);
        var offlineCount = typeof getOfflineSongs === 'function' ? getOfflineSongs().length : 0;
        var dataSaver = typeof S !== 'undefined' && S.dataSaver === true;
        var modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-[400] flex items-end sm:items-center justify-center bg-black/75 px-0 sm:px-4';
        modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
        var row = function(icon, title, detail, action) {
            return '<button onclick="' + action + '" class="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-white/[.04] border border-white/10 text-left hover:bg-white/[.08] active:scale-[.99] transition-all"><span class="w-9 h-9 rounded-xl bg-white/[.07] flex items-center justify-center shrink-0"><i data-lucide="' + icon + '" class="w-4 h-4 text-white/75"></i></span><span class="min-w-0 flex-1"><strong class="block text-sm text-white">' + title + '</strong><span class="block text-xs text-white/45 mt-1">' + detail + '</span></span><i data-lucide="chevron-right" class="w-4 h-4 text-white/35 shrink-0"></i></button>';
        };
        var toggle = function(icon, title, detail, checked, action) {
            return '<label class="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-white/[.04] border border-white/10 text-left cursor-pointer hover:bg-white/[.08] transition-all"><span class="w-9 h-9 rounded-xl bg-white/[.07] flex items-center justify-center shrink-0"><i data-lucide="' + icon + '" class="w-4 h-4 text-white/75"></i></span><span class="min-w-0 flex-1"><strong class="block text-sm text-white">' + title + '</strong><span class="block text-xs text-white/45 mt-1">' + detail + '</span></span><input type="checkbox" ' + (checked ? 'checked' : '') + ' onchange="' + action + '" class="accent-rose-500 w-5 h-5 shrink-0" /></label>';
        };
        modal.innerHTML = '<div class="w-full sm:max-w-xl max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-[#15151b] border border-white/10 shadow-2xl p-5 sm:p-6">' +
            '<div class="flex items-center justify-between mb-5"><div><h3 class="font-black text-white text-xl">Pengaturan</h3><p class="text-xs text-white/50 mt-1">Atur pengalaman MalaMusic di perangkat ini</p></div><button onclick="this.closest(\'.fixed\').remove()" class="w-9 h-9 rounded-full bg-white/10 text-white">×</button></div>' +
            '<section class="mb-5"><p class="text-[10px] uppercase tracking-[.18em] text-rose-300/70 font-black mb-2">Pemutaran</p><div class="space-y-2">' +
                toggle('skip-forward', 'Putar otomatis', 'Lanjutkan ke lagu berikutnya setelah selesai', autoNext, 'toggleAutoNext()') +
                row('gauge', 'Kecepatan putar', speed === 1 ? 'Normal (1.0x)' : speed + 'x', 'openPlaybackSpeed(); this.closest(\'.fixed\').remove()') +
                row('moon-star', 'Timer tidur', 'Hentikan musik setelah waktu tertentu', 'openSleepTimer(); this.closest(\'.fixed\').remove()') +
                row('sliders-horizontal', 'Equalizer suara', 'Atur bass, mid, treble, dan preset', 'openEqualizer(); this.closest(\'.fixed\').remove()') +
            '</div></section>' +
            '<section class="mb-5"><p class="text-[10px] uppercase tracking-[.18em] text-rose-300/70 font-black mb-2">Tampilan</p><div class="space-y-2">' +
                toggle('sparkles', 'Latar cover bergerak', 'Gunakan warna cover pada latar pemutar', glow, 'FullPlayer.toggleBgGlow()') +
                row('palette', 'Tema aplikasi', 'MalaMusic menggunakan tema gelap yang hemat baterai', 'showToast(\'Tema gelap sedang aktif\')') +
            '</div></section>' +
            '<section class="mb-5"><p class="text-[10px] uppercase tracking-[.18em] text-rose-300/70 font-black mb-2">Offline & data</p><div class="space-y-2">' +
                toggle('gauge', 'Data Saver', dataSaver ? 'Preload lagu sekitar dimatikan' : 'Preload lagu sekitar tetap aktif', dataSaver, 'toggleDataSaver()') +
                row('download', 'Mode Offline', offlineCount + ' lagu tersimpan di perangkat', 'App.switch(\'offline\'); this.closest(\'.fixed\').remove()') +
                row('trash-2', 'Bersihkan cache offline', 'Hapus cache audio dan lirik yang dapat diunduh ulang', 'clearPwaCache(); this.closest(\'.fixed\').remove()') +
                row('history', 'Riwayat pemutaran', 'Lihat atau hapus aktivitas lokal', 'Profile.showHistory(); this.closest(\'.fixed\').remove()') +
                '<div class="grid grid-cols-2 gap-2"><button onclick="Profile.exportLocalData(); this.closest(\'.fixed\').remove()" class="rounded-xl bg-white/10 border border-white/10 text-white py-3 text-xs font-bold">Backup Data</button><button onclick="Profile.importLocalData(); this.closest(\'.fixed\').remove()" class="rounded-xl bg-white/10 border border-white/10 text-white py-3 text-xs font-bold">Pulihkan Data</button></div>' +
            '</div></section>' +
            '<section><p class="text-[10px] uppercase tracking-[.18em] text-rose-300/70 font-black mb-2">Profil & privasi</p><div class="space-y-2">' +
                row('camera', 'Ganti avatar', 'Avatar dikompres lalu disinkronkan ke semua perangkat', 'Profile.chooseAvatar(); this.closest(\'.fixed\').remove()') +
                row('rotate-ccw', 'Kembalikan avatar bawaan', 'Hapus avatar lokal dan gunakan avatar akun', 'Profile.clearAvatar(); this.closest(\'.fixed\').remove()') +
                row('globe-2', 'Playlist publik', 'Atur playlist yang boleh dibagikan', 'this.closest(\'.fixed\').remove(); document.getElementById(\'profile-public-playlists\')?.scrollIntoView({behavior:\'smooth\',block:\'center\'})') +
                '<p class="text-[11px] text-white/35 pt-2">Versi MalaMusic 2.0 · Avatar tersinkron, koleksi offline tetap berada di perangkat ini.</p>' +
            '</div></section>' +
        '</div>';
        document.body.appendChild(modal); lucide.createIcons();
    }
};

var Dev = Profile;

var EmailAuth = {
    entryMode: 'login',
    refreshSeq: 0,
    escape: function(value) {
        return String(value || '').replace(/[&<>"']/g, function(char) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[char]; });
    },
    open: function() {
        var panel = document.getElementById('profile-account-panel');
        if (!panel) return;
        panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        this.renderChoice();
    },
    renderAuthActions: function(authenticated, user) {
        var collection = document.getElementById('profile-auth-collection-action');
        var secondary = document.getElementById('profile-auth-secondary-action');
        var email = this.escape(user && user.email || 'akun Gmail');
        if (authenticated) {
            if (collection) collection.innerHTML = '<button onclick="App.switch(\'dev\')" class="w-full h-full min-h-[150px] text-left rounded-2xl overflow-hidden bg-gradient-to-br from-[#166534] to-[#064e3b] p-4 flex flex-col justify-end shadow-lg hover:scale-[1.02] transition-transform"><i data-lucide="circle-check" class="w-8 h-8 text-emerald-200 mb-auto"></i><span class="text-white font-bold text-sm">Akun Terhubung</span><span class="text-emerald-100/70 text-xs mt-1 truncate">' + email + '</span></button>';
            if (secondary) secondary.innerHTML = '<button onclick="EmailAuth.logout()" class="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-white/[.06] transition-colors"><i data-lucide="log-out" class="w-5 h-5 text-emerald-300"></i><span class="flex-1"><strong class="block text-sm text-white">Logout dari MalaMusic</strong><span class="block text-xs text-white/50">Sesi akun Gmail sedang aktif</span></span><i data-lucide="chevron-right" class="w-4 h-4 text-white/40"></i></button>';
        } else {
            if (collection) collection.innerHTML = '<button onclick="EmailAuth.open()" class="w-full h-full min-h-[150px] text-left rounded-2xl overflow-hidden bg-gradient-to-br from-[#be123c] to-[#4c0519] p-4 flex flex-col justify-end shadow-lg hover:scale-[1.02] transition-transform"><i data-lucide="mail-check" class="w-8 h-8 text-white mb-auto"></i><span class="text-white font-bold text-sm">Masuk untuk menyimpan</span><span class="text-white/60 text-xs mt-1">Koleksi, playlist, dan aktivitas musik</span></button>';
            if (secondary) secondary.innerHTML = '<button onclick="EmailAuth.open()" class="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-white/[.06] transition-colors"><i data-lucide="mail" class="w-5 h-5 text-rose-400"></i><span class="flex-1"><strong class="block text-sm text-white">Mulai dengan akun Gmail</strong><span class="block text-xs text-white/50">Satu login untuk koleksi, streak, dan playlist publik</span></span><i data-lucide="chevron-right" class="w-4 h-4 text-white/40"></i></button>';
        }
        if (window.lucide && typeof lucide.createIcons === 'function') lucide.createIcons();
    },
    choose: function(mode) {
        this.entryMode = mode === 'register' ? 'register' : 'login';
        this.renderEmailForm();
    },
    renderChoice: function(message) {
        var panel = document.getElementById('profile-account-panel');
        if (!panel) return;
        panel.innerHTML = '<div class="rounded-2xl bg-white/[.05] border border-white/10 p-5 sm:p-6"><div class="flex items-start gap-3 mb-5"><i data-lucide="user-round" class="w-6 h-6 text-rose-400 mt-0.5"></i><div><strong class="block text-base text-white">Masuk ke MalaMusic</strong><span class="block text-xs text-white/50 mt-1">Simpan koleksi, playlist, dan aktivitas musik kamu.</span></div></div><button onclick="EmailAuth.googleLogin()" class="w-full rounded-xl bg-white px-5 py-3.5 text-sm font-black text-black hover:bg-slate-100 active:scale-[.99] transition-all flex items-center justify-center gap-2"><i data-lucide="globe-2" class="w-4 h-4"></i><span>Lanjutkan dengan Google</span></button><div class="flex items-center gap-3 my-4 text-[10px] font-bold uppercase tracking-[.18em] text-white/30"><span class="h-px flex-1 bg-white/10"></span><span>atau dengan Gmail</span><span class="h-px flex-1 bg-white/10"></span></div><div class="grid grid-cols-1 sm:grid-cols-2 gap-3"><button onclick="EmailAuth.choose(\'login\')" class="rounded-xl border border-white/15 bg-white/[.08] px-4 py-3 text-left hover:bg-white/[.13] active:scale-[.99] transition-all"><i data-lucide="log-in" class="w-4 h-4 text-rose-300 mb-2"></i><strong class="block text-sm text-white">Masuk</strong><span class="block mt-0.5 text-[11px] text-white/45">Sudah punya akun</span></button><button onclick="EmailAuth.choose(\'register\')" class="rounded-xl border border-white/15 bg-white/[.03] px-4 py-3 text-left hover:bg-white/[.09] active:scale-[.99] transition-all"><i data-lucide="user-plus" class="w-4 h-4 text-rose-300 mb-2"></i><strong class="block text-sm text-white">Buat akun</strong><span class="block mt-0.5 text-[11px] text-white/45">Daftar dengan Gmail</span></button></div><button onclick="EmailAuth.renderResetForm()" class="w-full mt-3 rounded-xl px-4 py-2.5 text-xs font-bold text-white/50 hover:text-white hover:bg-white/[.05] transition-colors"><i data-lucide="key-round" class="w-3.5 h-3.5 inline mr-1"></i>Lupa password?</button><p class="mt-2 text-center text-[11px] text-white/35">Hanya alamat <strong class="text-white/55">@gmail.com</strong> yang diterima.</p>' + (message ? '<p class="mt-3 text-xs text-rose-300">' + this.escape(message) + '</p>' : '') + '</div>';
        if (window.lucide && typeof lucide.createIcons === 'function') lucide.createIcons();
    },
    renderEmailForm: function(message) {
        var panel = document.getElementById('profile-account-panel');
        if (!panel) return;
        var register = this.entryMode === 'register';
        var title = register ? 'Daftar dengan Gmail' : 'Login dengan Gmail';
        var helper = register ? 'Buat akun permanen dengan email dan password.' : 'Masuk ke akun MalaMusic kamu.';
        panel.innerHTML = '<div class="rounded-2xl bg-white/[.05] border border-white/10 p-4 sm:p-5"><button onclick="EmailAuth.renderChoice()" class="mb-4 text-xs font-bold text-white/50 hover:text-white transition-colors"><i data-lucide="arrow-left" class="w-3.5 h-3.5 inline mr-1"></i>Kembali ke pilihan masuk</button><div class="flex items-start gap-3 mb-4"><i data-lucide="shield-check" class="w-5 h-5 text-rose-400 mt-0.5"></i><div><strong class="block text-sm text-white">' + title + '</strong><span class="block text-xs text-white/50 mt-1">' + helper + ' Hanya alamat @gmail.com yang diterima.</span></div></div>' + (register ? '<label for="auth-name" class="block mb-1.5 text-xs font-bold text-white/70">Nama tampilan <span class="font-normal text-white/35">(opsional)</span></label><input id="auth-name" type="text" autocomplete="name" maxlength="80" placeholder="Nama kamu" class="w-full mb-3 rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-rose-400" />' : '') + '<label for="auth-email" class="block mb-1.5 text-xs font-bold text-white/70">Email Gmail</label><input id="auth-email" type="email" autocomplete="email" placeholder="nama@gmail.com" class="w-full mb-3 rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-rose-400" /><label for="auth-password" class="block mb-1.5 text-xs font-bold text-white/70">Password</label><input id="auth-password" type="password" autocomplete="' + (register ? 'new-password' : 'current-password') + '" minlength="8" maxlength="128" placeholder="Minimal 8 karakter" class="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-rose-400" /><button onclick="EmailAuth.submit()" class="w-full mt-4 rounded-xl bg-white px-5 py-3 text-sm font-black text-black hover:bg-rose-100 active:scale-[.99] transition-all">' + (register ? 'Buat akun MalaMusic' : 'Masuk ke MalaMusic') + '</button>' + (!register ? '<button onclick="EmailAuth.renderResetForm()" class="w-full mt-3 text-xs font-bold text-cyan-200 hover:text-white">Lupa password?</button>' : '') + (message ? '<p class="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300">' + this.escape(message) + '</p>' : '') + '</div>';
        if (window.lucide && typeof lucide.createIcons === 'function') lucide.createIcons();
    },
    googleLogin: async function() {
        if (!window.MalaFirebase || typeof window.MalaFirebase.googleSignIn !== 'function') return this.renderChoice('Google Login belum siap. Muat ulang halaman lalu coba lagi.');
        try {
            var result = await window.MalaFirebase.googleSignIn();
            await this.finishGoogleLogin(result && result.user);
        } catch (error) {
            var code = String(error && error.code || '');
            if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
                try { await window.MalaFirebase.googleRedirect(); return; } catch (redirectError) { error = redirectError; }
            }
            this.renderChoice(this.googleErrorMessage(error));
        }
    },
    finishGoogleLogin: async function(firebaseUser) {
        if (!firebaseUser) return;
        var idToken = await firebaseUser.getIdToken(true);
        var response = await fetch('/api/email-auth?action=google-login', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: idToken }) });
        var data = await response.json().catch(function(){ return {}; });
        if (!response.ok || !data.status) throw new Error(data.message || 'Google Login gagal.');
        showToast('Berhasil masuk dengan Google');
        Profile.render();
        if (typeof Blend !== 'undefined' && typeof Blend.resumePendingInvite === 'function') Blend.resumePendingInvite();
    },
    googleErrorMessage: function(error) {
        var code = String(error && error.code || '');
        if (code === 'auth/unauthorized-domain') return 'Domain MalaMusic belum diizinkan di Firebase Authentication.';
        if (code === 'auth/popup-closed-by-user') return 'Popup Google ditutup sebelum login selesai.';
        if (code === 'auth/account-exists-with-different-credential') return 'Email ini sudah terhubung dengan metode login lain.';
        return (error && error.message) || 'Google Login gagal. Coba lagi.';
    },
    renderResetForm: function(message) {
        var panel = document.getElementById('profile-account-panel'); if (!panel) return;
        panel.innerHTML = '<div class="rounded-2xl bg-white/[.05] border border-white/10 p-4 sm:p-5"><div class="flex items-start gap-3 mb-4"><i data-lucide="key-round" class="w-5 h-5 text-cyan-300 mt-0.5"></i><div><strong class="block text-sm text-white">Reset password</strong><span class="block text-xs text-white/50 mt-1">Masukkan Gmail. Jika akun terdaftar, link reset akan dikirim ke inbox.</span></div></div><input id="auth-email" type="email" autocomplete="email" placeholder="nama@gmail.com" class="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300" /><button onclick="EmailAuth.submitReset()" class="w-full mt-3 rounded-xl bg-cyan-300 text-black px-5 py-3 text-sm font-black hover:bg-cyan-200">Kirim link reset</button><button onclick="EmailAuth.renderChoice()" class="mt-3 text-xs font-bold text-white/50 hover:text-white">Kembali ke Login/Daftar</button>' + (message ? '<p class="mt-3 text-xs text-cyan-200">' + this.escape(message) + '</p>' : '') + '</div>';
        if (window.lucide && typeof lucide.createIcons === 'function') lucide.createIcons();
    },
    submitReset: async function() {
        var email = ((document.getElementById('auth-email') || {}).value || '').trim().toLowerCase();
        if (!/^[^@\s]+@gmail\.com$/i.test(email)) return this.renderResetForm('Gunakan alamat Gmail yang valid (@gmail.com).');
        try { var response = await fetch('/api/email-auth?action=password-reset', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email }) }); var data = await response.json().catch(function(){ return {}; }); if (!response.ok || !data.status) throw new Error(data.message || 'Reset password gagal.'); this.renderResetForm(data.message || 'Periksa inbox Gmail dan folder Spam.'); } catch (error) { this.renderResetForm(error.message); }
    },
    renderVerificationForm: function(email, message) {
        var panel = document.getElementById('profile-account-panel'); if (!panel) return;
        panel.innerHTML = '<div class="rounded-2xl bg-amber-500/10 border border-amber-300/20 p-4"><div class="flex items-start gap-3"><i data-lucide="mail-warning" class="w-5 h-5 text-amber-200 mt-0.5"></i><div class="min-w-0"><strong class="block text-sm text-amber-100">Email belum terverifikasi</strong><span class="block text-xs text-white/60 mt-1">Kirim ulang link verification ke ' + this.escape(email) + '.</span></div></div><input id="verify-password" type="password" autocomplete="current-password" minlength="8" maxlength="128" placeholder="Masukkan password untuk konfirmasi" class="w-full mt-3 rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-amber-300" /><button onclick="EmailAuth.sendVerification(\'' + this.escape(email) + '\')" class="w-full mt-3 rounded-xl bg-amber-200 text-black px-4 py-3 text-xs font-black">Kirim ulang verification</button><button onclick="Profile.render()" class="w-full mt-2 text-xs font-bold text-white/50 hover:text-white">Kembali</button>' + (message ? '<p class="mt-3 text-xs text-amber-100">' + this.escape(message) + '</p>' : '') + '</div>';
        if (window.lucide && typeof lucide.createIcons === 'function') lucide.createIcons();
    },
    sendVerification: async function(email) {
        var password = (document.getElementById('verify-password') || {}).value || '';
        if (password.length < 8) return this.renderVerificationForm(email, 'Password minimal 8 karakter.');
        try { var response = await fetch('/api/email-auth?action=send-verification', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email, password: password }) }); var data = await response.json().catch(function(){ return {}; }); if (!response.ok || !data.status) throw new Error(data.message || 'Verification gagal dikirim.'); this.renderVerificationForm(email, data.message || 'Link verification sudah dikirim.'); } catch (error) { this.renderVerificationForm(email, error.message); }
    },
    submit: async function() {
        var email = (document.getElementById('auth-email') || {}).value || '';
        var password = (document.getElementById('auth-password') || {}).value || '';
        var name = (document.getElementById('auth-name') || {}).value || '';
        email = email.trim().toLowerCase();
        if (!/^[^@\s]+@gmail\.com$/i.test(email)) return this.renderEmailForm('Gunakan alamat Gmail yang valid (@gmail.com).');
        if (password.length < 8) return this.renderEmailForm('Password minimal 8 karakter.');
        try {
            var response = await fetch('/api/email-auth?action=' + (this.entryMode === 'register' ? 'register' : 'login'), { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email, password: password, name: name.trim() }) });
            var data = await response.json().catch(function() { return {}; });
            if (!response.ok || !data.status) throw new Error(data.message || 'Autentikasi gagal.');
            showToast(this.entryMode === 'register' ? 'Akun berhasil dibuat' : 'Berhasil masuk ke MalaMusic');
            Profile.render();
            if (typeof Blend !== 'undefined' && typeof Blend.resumePendingInvite === 'function') Blend.resumePendingInvite();
        } catch (error) { this.renderEmailForm(error.message); }
    },
    logout: async function() {
        await fetch('/api/email-auth?action=logout', { credentials: 'same-origin' });
        showToast('Kamu sudah logout');
        Profile.render();
    },
    refresh: async function() {
        var requestId = ++this.refreshSeq;
        var response = null;
        try {
            response = await fetch('/api/email-auth?action=me', { credentials: 'same-origin', cache: 'no-store' });
            var data = await response.json();
            if (requestId !== this.refreshSeq) return;
            var name = document.getElementById('profile-name');
            var subtitle = document.getElementById('profile-subtitle');
            var avatar = document.getElementById('profile-avatar');
            var panel = document.getElementById('profile-account-panel');
            if (!panel) return;
            if (response.ok && data.authenticated) {
                var user = data.user || {};
                if (name) name.textContent = user.name || 'Profil Saya';
                if (subtitle) subtitle.textContent = user.email || 'Akun MalaMusic';
                Profile.applyAvatar(user);
                if (typeof loadLibraryRemote === 'function') loadLibraryRemote();
                fetch('/api/profile', { credentials: 'same-origin', cache: 'no-store' }).then(function(profileResponse) { return profileResponse.ok ? profileResponse.json() : null; }).then(function(profileData) {
                    if (requestId !== EmailAuth.refreshSeq || !profileData || !profileData.status) return;
                    Profile.remoteProfile = profileData.profile || null;
                    Profile.applyAvatar(user);
                }).catch(function() {});
                panel.innerHTML = '<div class="rounded-2xl bg-emerald-500/10 border border-emerald-400/20 p-4"><div class="flex flex-wrap items-center gap-3"><span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span><span class="text-sm text-emerald-200 flex-1">Akun Gmail terhubung: ' + this.escape(user.email) + '</span><button onclick="EmailAuth.logout()" class="text-xs font-bold text-white/60 hover:text-white">Logout</button></div>' + (user.emailVerified ? '<p class="mt-3 text-xs text-emerald-200"><i data-lucide="badge-check" class="w-4 h-4 inline mr-1"></i>Email terverifikasi</p>' : '<button onclick="EmailAuth.renderVerificationForm(\'' + this.escape(user.email) + '\')" class="w-full mt-3 rounded-xl bg-amber-200 text-black px-4 py-3 text-xs font-black">Verifikasi email sekarang</button>') + '</div>';
                this.renderAuthActions(true, user);
            } else {
                name && (name.textContent = 'Profil Saya');
                subtitle && (subtitle.textContent = 'Masuk dengan Gmail untuk menyimpan profil kamu');
                this.remoteProfile = null;
                Profile.applyAvatar(null);
                this.renderChoice();
                this.renderAuthActions(false);
            }
            if (window.lucide && typeof lucide.createIcons === 'function') lucide.createIcons();
        } catch (_) {
            if (requestId !== this.refreshSeq) return;
            this.remoteProfile = null;
            Profile.applyAvatar(null);
            if (response && response.ok) { this.renderChoice(); this.renderAuthActions(false); }
            else { this.renderChoice('Server autentikasi belum siap.'); this.renderAuthActions(false); }
        }
    }
};

var malamusicGoogleRedirectHandled = false;
function handleMalaMusicGoogleRedirect(firebaseUser) {
    if (!firebaseUser || !window.EmailAuth || typeof EmailAuth.finishGoogleLogin !== 'function' || malamusicGoogleRedirectHandled) return;
    malamusicGoogleRedirectHandled = true;
    EmailAuth.finishGoogleLogin(firebaseUser).catch(function(error) {
        malamusicGoogleRedirectHandled = false;
        EmailAuth.renderChoice(EmailAuth.googleErrorMessage(error));
    });
}

window.addEventListener('malamusic-google-redirect', function(event) {
    handleMalaMusicGoogleRedirect(event.detail);
});

// firebase.js can resolve getRedirectResult() before this file registers the event listener.
// Consume the promise as well so same-tab/mobile redirect login always creates mm_session.
if (window.MalaFirebase && window.MalaFirebase.redirectResult && typeof window.MalaFirebase.redirectResult.then === 'function') {
    window.MalaFirebase.redirectResult.then(function(result) {
        if (result && result.user) handleMalaMusicGoogleRedirect(result.user);
    }).catch(function(error) {
        if (error && window.EmailAuth) EmailAuth.renderChoice(EmailAuth.googleErrorMessage(error));
    });
}

// Some browsers restore Firebase currentUser after the redirect but return a null
// getRedirectResult(). Reconcile that restored client session with the backend too.
if (window.MalaFirebase && window.MalaFirebase.auth && typeof window.MalaFirebase.auth.onAuthStateChanged === 'function') {
    window.MalaFirebase.auth.onAuthStateChanged(function(firebaseUser) {
        if (firebaseUser) handleMalaMusicGoogleRedirect(firebaseUser);
    });
}
