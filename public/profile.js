var Profile = {
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
            <div class="relative overflow-hidden px-5 sm:px-8 pt-8 pb-7 border-b border-white/10" style="background: radial-gradient(circle at 72% 0%, rgba(244,63,94,.34), transparent 42%), linear-gradient(135deg, #25202a, #0b0b0f 70%);">
                <div class="absolute -right-20 -top-24 w-72 h-72 rounded-full bg-rose-500/10 blur-3xl pointer-events-none"></div>
                <div class="relative flex items-end gap-5 sm:gap-7 max-w-5xl mx-auto">
                    <div id="profile-avatar-wrap" class="relative w-24 h-24 sm:w-36 sm:h-36 rounded-full shrink-0 overflow-hidden bg-gradient-to-br from-rose-400 to-purple-700 shadow-2xl ring-4 ring-white/10 flex items-center justify-center">
                        <img id="profile-avatar" src="/logo-mark.png" class="w-full h-full object-cover" alt="Avatar Profil" onerror="this.style.display='none'" />
                        <i data-lucide="user" class="w-12 h-12 text-white/80"></i>
                        <button onclick="Profile.chooseAvatar()" class="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-black/70 border border-white/20 text-white flex items-center justify-center shadow-xl hover:bg-black transition-colors" title="Ganti avatar"><i data-lucide="camera" class="w-4 h-4"></i></button>
                    </div>
                    <div class="min-w-0 pb-1">
                        <p class="text-xs font-bold uppercase tracking-[.2em] text-white/60 mb-2">Profil</p>
                        <h1 id="profile-name" class="text-3xl sm:text-5xl font-black text-white tracking-tight truncate">Profil Saya</h1>
                        <p id="profile-subtitle" class="text-sm text-white/60 mt-2">Koleksi musik dan aktivitas mendengarkan</p>
                    </div>
                </div>
            </div>

            <div class="max-w-5xl mx-auto px-5 sm:px-8 py-6">
                <div id="profile-account-panel" class="mb-7"></div>
                <div id="profile-streak-card"></div>
                <div id="profile-listening-card" class="mb-7"></div>
                <section class="mb-8 rounded-2xl bg-white/[.04] border border-white/10 overflow-hidden"><div class="p-4 border-b border-white/10"><div class="flex items-center gap-3"><i data-lucide="globe-2" class="w-5 h-5 text-amber-300"></i><div><h2 class="text-base font-black text-white">Playlist Publik</h2><p class="text-xs text-white/50 mt-1">Atur playlist mana yang dapat dilihat dan dibagikan.</p></div></div></div><div id="profile-public-playlists" class="divide-y divide-white/10"></div></section>

                <div class="grid grid-cols-3 gap-2 sm:gap-3 mb-8">
                    <div class="rounded-2xl bg-white/[.05] border border-white/10 p-4 text-center"><strong class="block text-2xl font-black text-white">${liked.length}</strong><span class="text-[11px] text-white/50">Lagu disukai</span></div>
                    <div class="rounded-2xl bg-white/[.05] border border-white/10 p-4 text-center"><strong class="block text-2xl font-black text-white">${playlists.length}</strong><span class="text-[11px] text-white/50">Playlist</span></div>
                    <div class="rounded-2xl bg-white/[.05] border border-white/10 p-4 text-center"><strong class="block text-2xl font-black text-white">${offline.length}</strong><span class="text-[11px] text-white/50">Offline</span></div>
                </div>

                <section class="mb-8">
                    <div class="flex items-center justify-between mb-3"><h2 class="text-xl font-black text-white">Koleksi kamu</h2><button onclick="App.switch('library')" class="text-xs font-bold text-white/50 hover:text-white">Lihat semua</button></div>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <button onclick="App.switch('liked')" class="text-left rounded-2xl overflow-hidden bg-gradient-to-br from-[#5436a3] to-[#c53d70] p-4 aspect-square flex flex-col justify-end shadow-lg hover:scale-[1.02] transition-transform"><i data-lucide="heart" class="w-8 h-8 text-white fill-current mb-auto"></i><span class="text-white font-bold text-sm">Lagu Disukai</span><span class="text-white/60 text-xs mt-1">${liked.length} lagu</span></button>
                        <button onclick="App.switch('offline')" class="text-left rounded-2xl overflow-hidden bg-gradient-to-br from-[#164e63] to-[#0f766e] p-4 aspect-square flex flex-col justify-end shadow-lg hover:scale-[1.02] transition-transform"><i data-lucide="download" class="w-8 h-8 text-white mb-auto"></i><span class="text-white font-bold text-sm">Mode Offline</span><span class="text-white/60 text-xs mt-1">${offline.length} lagu</span></button>
                        <button onclick="App.switch('library')" class="text-left rounded-2xl overflow-hidden bg-gradient-to-br from-[#3b3b3b] to-[#111] p-4 aspect-square flex flex-col justify-end shadow-lg hover:scale-[1.02] transition-transform"><i data-lucide="library" class="w-8 h-8 text-white mb-auto"></i><span class="text-white font-bold text-sm">Playlist Kamu</span><span class="text-white/60 text-xs mt-1">${playlists.length} playlist</span></button>
                        <div id="profile-auth-collection-action"></div>
                    </div>
                </section>

                <section class="mb-8">
                    <div class="flex items-center justify-between mb-3"><h2 class="text-xl font-black text-white">Aktivitas terbaru</h2><button onclick="Profile.showHistory()" class="text-xs font-bold text-white/50 hover:text-white">Lihat semua</button></div>
                    <div id="profile-recent-list" class="rounded-2xl bg-white/[.04] border border-white/10 overflow-hidden"></div>
                </section>

                <section class="rounded-2xl bg-white/[.04] border border-white/10 overflow-hidden mb-8">
                    <div id="profile-account-panel-secondary"></div>
                    <div id="profile-auth-secondary-action"></div>
                    <button onclick="Profile.showSettings()" class="w-full flex items-center gap-3 px-4 py-4 text-left border-t border-white/10 hover:bg-white/[.06] transition-colors"><i data-lucide="settings" class="w-5 h-5 text-white/60"></i><span class="flex-1"><strong class="block text-sm text-white">Pengaturan</strong><span class="block text-xs text-white/50">Preferensi pemutar, tampilan, dan data</span></span><i data-lucide="chevron-right" class="w-4 h-4 text-white/40"></i></button>
                </section>

                <p class="text-center text-xs text-white/30 pb-4">Profil musik kamu</p>
            </div>
        </div>`;

        var recentEl = document.getElementById('profile-recent-list');
        if (recentEl) {
            recentEl.innerHTML = recent.length ? recent.slice(0, 4).map(function(track) {
                var id = track.id || track.videoId;
                return '<button onclick="App.autoPlayTrack(\'' + String(id || '').replace(/'/g, '') + '\')" class="w-full flex items-center gap-3 p-3 text-left hover:bg-white/[.06] border-b border-white/5 last:border-0"><img src="' + (track.cover || FI) + '" class="w-10 h-10 rounded-lg object-cover" onerror="this.src=\'' + FI + '\'" /><span class="min-w-0"><strong class="block text-sm text-white truncate">' + es(track.title || 'Lagu') + '</strong><span class="block text-xs text-white/50 truncate">' + es(track.artist || 'MalaMusic') + '</span></span></button>';
            }).join('') : '<div class="p-6 text-center text-sm text-white/50">Belum ada aktivitas terbaru.<button onclick="App.switch(\'home\')" class="block mx-auto mt-3 rounded-full bg-white/10 border border-white/15 px-4 py-2 text-xs font-bold text-white">Buka Beranda</button></div>';
        }

        lucide.createIcons();
        EmailAuth.renderAuthActions(false);
        Profile.renderPublicPlaylistSettings();
        Profile.refreshListeningStats();
        EmailAuth.refresh();
        if (typeof Streak !== 'undefined') Streak.refreshProfileCard();
    },
    refreshListeningStats: async function() {
        var el = document.getElementById('profile-listening-card'); if (!el) return;
        el.innerHTML = '<div class="rounded-2xl bg-gradient-to-br from-amber-500/15 to-rose-500/10 border border-amber-300/15 p-5"><div class="text-xs text-white/50">Total waktu mendengar</div><div class="h-9 w-28 mt-2 rounded-lg bg-white/10 animate-pulse"></div></div>';
        try { var response = await fetch('/api/stats?action=me', { credentials: 'same-origin' }); if (!response.ok) { el.innerHTML = '<div class="rounded-2xl bg-white/[.04] border border-white/10 p-5"><div class="flex items-center gap-3"><i data-lucide="clock-3" class="w-5 h-5 text-white/50"></i><div><strong class="block text-sm text-white">Jam mendengar</strong><span class="block text-xs text-white/50 mt-1">Login untuk menyimpan statistik lintas perangkat.</span></div></div></div>'; lucide.createIcons(); return; } var data = await response.json(), s = data.stats || {}; el.innerHTML = '<div class="rounded-2xl bg-gradient-to-br from-amber-500/15 to-rose-500/10 border border-amber-300/15 p-5"><div class="flex items-center justify-between gap-3"><div><p class="text-[10px] uppercase tracking-[.18em] text-amber-200/70 font-black">Aktivitas mendengar</p><strong class="block text-3xl font-black text-white mt-1">'+Number(s.hours || 0).toFixed(1)+' jam</strong><span class="block text-xs text-white/50 mt-1">'+Number(s.activeDays || 0)+' hari aktif · streak '+Number(s.streak || 0)+' hari</span></div><div class="w-14 h-14 rounded-2xl bg-amber-300/15 flex items-center justify-center"><i data-lucide="clock-3" class="w-7 h-7 text-amber-200"></i></div></div></div>'; lucide.createIcons(); } catch (_) { el.innerHTML = ''; }
    },
    renderPublicPlaylistSettings: function() {
        var el = document.getElementById('profile-public-playlists'); if (!el) return;
        var playlists = typeof getUserPlaylists === 'function' ? getUserPlaylists() : [];
        if (!playlists.length) { el.innerHTML = '<div class="p-5 text-sm text-white/50">Belum ada playlist untuk diatur.</div>'; return; }
        el.innerHTML = playlists.map(function(pl) { var isPublic = Boolean(pl.isPublic || pl.publicId); return '<div class="flex items-center gap-3 p-4"><img src="'+(pl.image || (pl.songs[0] && pl.songs[0].cover) || FI)+'" class="w-11 h-11 rounded-xl object-cover" onerror="this.src=\''+FI+'\'" /><div class="min-w-0 flex-1"><strong class="block text-sm text-white truncate">'+es(pl.name)+'</strong><span class="block text-xs text-white/50 mt-1">'+(isPublic ? 'Dapat dibagikan publik' : 'Hanya kamu')+'</span></div><button onclick="Profile.togglePlaylistPublic(\''+String(pl.id).replace(/'/g,'')+'\')" class="shrink-0 rounded-full px-3 py-2 text-[11px] font-black '+(isPublic ? 'bg-amber-300 text-black' : 'bg-white/10 text-white')+'">'+(isPublic ? 'Publik' : 'Jadikan publik')+'</button></div>'; }).join('');
        lucide.createIcons();
    },
    togglePlaylistPublic: async function(id) {
        var playlists = typeof getUserPlaylists === 'function' ? getUserPlaylists() : [], pl = playlists.find(function(item){return item.id === id;}); if (!pl) return;
        var next = !(pl.isPublic || pl.publicId);
        try { var response = await fetch('/api/stats?action=publish-playlist', { method:'POST', credentials:'same-origin', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id:id,name:pl.name,image:pl.image||'',songs:pl.songs||[],isPublic:next}) }); var data=await response.json(); if(!response.ok||!data.status) throw new Error(); pl.isPublic=next; if(data.id) pl.publicId=data.id; if(!next) delete pl.publicId; if(typeof saveUserPlaylists==='function') saveUserPlaylists(playlists); Profile.render(); showToast(next?'Playlist sekarang publik':'Playlist disembunyikan'); } catch (_) { showToast('Login diperlukan untuk mengatur playlist publik'); }
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
        modal.innerHTML = '<div class="w-full sm:max-w-lg max-h-[85vh] overflow-hidden rounded-t-3xl sm:rounded-3xl bg-[#15151b] border border-white/10 shadow-2xl"><div class="flex items-center justify-between p-5 border-b border-white/10"><div><h3 class="font-black text-white text-lg">Riwayat Pemutaran</h3><p class="text-xs text-white/50 mt-1">Lagu yang baru kamu dengarkan</p></div><button onclick="this.closest(\'.fixed\').remove()" class="w-9 h-9 rounded-full bg-white/10 text-white">×</button></div><div class="max-h-[55vh] overflow-y-auto">' + rows + '</div><div class="p-4 border-t border-white/10 flex gap-2"><button onclick="localStorage.removeItem(\'mala_recent_tracks\');this.closest(\'.fixed\').remove();Profile.render();showToast(\'Riwayat dihapus\')" class="flex-1 rounded-xl bg-rose-500/15 border border-rose-400/20 text-rose-200 py-3 text-xs font-bold">Hapus Riwayat</button><button onclick="this.closest(\'.fixed\').remove()" class="flex-1 rounded-xl bg-white/10 text-white py-3 text-xs font-bold">Tutup</button></div></div>';
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
        avatar.src = this.avatarSource(user);
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
            if (collection) collection.innerHTML = '<button onclick="EmailAuth.open()" class="w-full h-full min-h-[150px] text-left rounded-2xl overflow-hidden bg-gradient-to-br from-[#be123c] to-[#4c0519] p-4 flex flex-col justify-end shadow-lg hover:scale-[1.02] transition-transform"><i data-lucide="mail-check" class="w-8 h-8 text-white mb-auto"></i><span class="text-white font-bold text-sm">Login / Daftar</span><span class="text-white/60 text-xs mt-1">Gmail dan password</span></button>';
            if (secondary) secondary.innerHTML = '<button onclick="EmailAuth.open()" class="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-white/[.06] transition-colors"><i data-lucide="mail" class="w-5 h-5 text-rose-400"></i><span class="flex-1"><strong class="block text-sm text-white">Login atau Daftar</strong><span class="block text-xs text-white/50">Login atau buat akun dengan Gmail dan password</span></span><i data-lucide="chevron-right" class="w-4 h-4 text-white/40"></i></button>';
        }
        lucide.createIcons();
    },
    choose: function(mode) {
        this.entryMode = mode === 'register' ? 'register' : 'login';
        this.renderEmailForm();
    },
    renderChoice: function(message) {
        var panel = document.getElementById('profile-account-panel');
        if (!panel) return;
        panel.innerHTML = '<div class="rounded-2xl bg-white/[.05] border border-white/10 p-5 sm:p-6"><div class="flex items-start gap-3 mb-5"><i data-lucide="user-round" class="w-6 h-6 text-rose-400 mt-0.5"></i><div><strong class="block text-base text-white">Akun MalaMusic</strong><span class="block text-xs text-white/50 mt-1">Masuk untuk menyimpan koleksi, playlist, dan aktivitas musik kamu.</span></div></div><div class="grid grid-cols-1 sm:grid-cols-2 gap-3"><button onclick="EmailAuth.choose(\'login\')" class="rounded-xl bg-white px-5 py-3 text-sm font-black text-black hover:bg-rose-100 transition-colors">Login</button><button onclick="EmailAuth.choose(\'register\')" class="rounded-xl border border-white/20 bg-white/[.06] px-5 py-3 text-sm font-black text-white hover:bg-white/[.12] transition-colors">Daftar</button></div>' + (message ? '<p class="mt-3 text-xs text-rose-300">' + this.escape(message) + '</p>' : '') + '</div>';
        lucide.createIcons();
    },
    renderEmailForm: function(message) {
        var panel = document.getElementById('profile-account-panel');
        if (!panel) return;
        var register = this.entryMode === 'register';
        var title = register ? 'Daftar dengan Gmail' : 'Login dengan Gmail';
        var helper = register ? 'Buat akun permanen dengan email dan password.' : 'Masuk ke akun MalaMusic kamu.';
        panel.innerHTML = '<div class="rounded-2xl bg-white/[.05] border border-white/10 p-4 sm:p-5"><div class="flex items-start gap-3 mb-4"><i data-lucide="shield-check" class="w-5 h-5 text-rose-400 mt-0.5"></i><div><strong class="block text-sm text-white">' + title + '</strong><span class="block text-xs text-white/50 mt-1">' + helper + ' Hanya alamat @gmail.com yang diterima.</span></div></div>' + (register ? '<input id="auth-name" type="text" autocomplete="name" maxlength="80" placeholder="Nama tampilan (opsional)" class="w-full mb-2 rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-rose-400" />' : '') + '<input id="auth-email" type="email" autocomplete="email" placeholder="nama@gmail.com" class="w-full mb-2 rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-rose-400" /><input id="auth-password" type="password" autocomplete="' + (register ? 'new-password' : 'current-password') + '" minlength="8" maxlength="128" placeholder="Password minimal 8 karakter" class="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-rose-400" /><button onclick="EmailAuth.submit()" class="w-full mt-3 rounded-xl bg-white px-5 py-3 text-sm font-black text-black hover:bg-rose-100">' + (register ? 'Buat Akun' : 'Login') + '</button><button onclick="EmailAuth.renderChoice()" class="mt-3 text-xs font-bold text-white/50 hover:text-white">Kembali ke pilihan Login/Daftar</button>' + (message ? '<p class="mt-3 text-xs text-rose-300">' + this.escape(message) + '</p>' : '') + '</div>';
        lucide.createIcons();
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
        } catch (error) { this.renderEmailForm(error.message); }
    },
    logout: async function() {
        await fetch('/api/email-auth?action=logout', { credentials: 'same-origin' });
        showToast('Kamu sudah logout');
        Profile.render();
    },
    refresh: async function() {
        var requestId = ++this.refreshSeq;
        try {
            var response = await fetch('/api/email-auth?action=me', { credentials: 'same-origin', cache: 'no-store' });
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
                this.applyAvatar(user);
                if (typeof loadLibraryRemote === 'function') loadLibraryRemote();
                fetch('/api/profile', { credentials: 'same-origin', cache: 'no-store' }).then(function(profileResponse) { return profileResponse.ok ? profileResponse.json() : null; }).then(function(profileData) {
                    if (requestId !== EmailAuth.refreshSeq || !profileData || !profileData.status) return;
                    Profile.remoteProfile = profileData.profile || null;
                    Profile.applyAvatar(user);
                }).catch(function() {});
                panel.innerHTML = '<div class="flex flex-wrap items-center gap-3 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 p-4"><span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span><span class="text-sm text-emerald-200 flex-1">Akun Gmail terhubung: ' + this.escape(user.email) + '</span><button onclick="EmailAuth.logout()" class="text-xs font-bold text-white/60 hover:text-white">Logout</button></div>';
                this.renderAuthActions(true, user);
            } else {
                name && (name.textContent = 'Profil Saya');
                subtitle && (subtitle.textContent = 'Masuk dengan Gmail untuk menyimpan profil kamu');
                this.remoteProfile = null;
                this.applyAvatar(null);
                this.renderChoice();
                this.renderAuthActions(false);
            }
            lucide.createIcons();
        } catch (_) {
            if (requestId !== this.refreshSeq) return;
            this.remoteProfile = null;
            this.renderChoice('Server autentikasi belum siap.');
            this.renderAuthActions(false);
        }
    }
};
