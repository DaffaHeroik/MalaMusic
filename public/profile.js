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
                    <div id="profile-avatar-wrap" class="w-24 h-24 sm:w-36 sm:h-36 rounded-full shrink-0 overflow-hidden bg-gradient-to-br from-rose-400 to-purple-700 shadow-2xl ring-4 ring-white/10 flex items-center justify-center">
                        <img id="profile-avatar" src="/logo.png" class="w-full h-full object-cover" alt="Profil" onerror="this.style.display='none'" />
                        <i data-lucide="user" class="w-12 h-12 text-white/80"></i>
                    </div>
                    <div class="min-w-0 pb-1">
                        <p class="text-xs font-bold uppercase tracking-[.2em] text-white/60 mb-2">Profil</p>
                        <h1 id="profile-name" class="text-3xl sm:text-5xl font-black text-white tracking-tight truncate">Pendengar MalaMusic</h1>
                        <p id="profile-subtitle" class="text-sm text-white/60 mt-2">Kelola musik dan koleksi favoritmu</p>
                    </div>
                </div>
            </div>

            <div class="max-w-5xl mx-auto px-5 sm:px-8 py-6">
                <div id="profile-account-panel" class="mb-7"></div>

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
                        <button onclick="GoogleAccount.syncLiked()" class="text-left rounded-2xl overflow-hidden bg-gradient-to-br from-[#be123c] to-[#4c0519] p-4 aspect-square flex flex-col justify-end shadow-lg hover:scale-[1.02] transition-transform"><i data-lucide="refresh-cw" class="w-8 h-8 text-white mb-auto"></i><span class="text-white font-bold text-sm">Sinkronkan</span><span class="text-white/60 text-xs mt-1">Dari Google</span></button>
                    </div>
                </section>

                <section class="mb-8">
                    <div class="flex items-center justify-between mb-3"><h2 class="text-xl font-black text-white">Aktivitas terbaru</h2><button onclick="showToast('Riwayat pemutaran akan hadir di versi berikutnya')" class="text-xs font-bold text-white/50 hover:text-white">Lihat semua</button></div>
                    <div id="profile-recent-list" class="rounded-2xl bg-white/[.04] border border-white/10 overflow-hidden"></div>
                </section>

                <section class="rounded-2xl bg-white/[.04] border border-white/10 overflow-hidden mb-8">
                    <button onclick="GoogleAccount.login()" class="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-white/[.06] transition-colors"><i data-lucide="log-in" class="w-5 h-5 text-rose-400"></i><span class="flex-1"><strong class="block text-sm text-white">Akun Google</strong><span class="block text-xs text-white/50">Login untuk mengambil Lagu Disukai dari YouTube Music</span></span><i data-lucide="chevron-right" class="w-4 h-4 text-white/40"></i></button>
                    <button onclick="showToast('Pengaturan profil akan hadir setelah autentikasi selesai')" class="w-full flex items-center gap-3 px-4 py-4 text-left border-t border-white/10 hover:bg-white/[.06] transition-colors"><i data-lucide="settings" class="w-5 h-5 text-white/60"></i><span class="flex-1"><strong class="block text-sm text-white">Pengaturan</strong><span class="block text-xs text-white/50">Preferensi pemutar dan tampilan</span></span><i data-lucide="chevron-right" class="w-4 h-4 text-white/40"></i></button>
                </section>

                <p class="text-center text-xs text-white/30 pb-4">MalaMusic • Dengarkan musik favoritmu</p>
            </div>
        </div>`;

        var recentEl = document.getElementById('profile-recent-list');
        if (recentEl) {
            recentEl.innerHTML = recent.length ? recent.slice(0, 4).map(function(track) {
                var id = track.id || track.videoId;
                return '<button onclick="App.autoPlayTrack(\'' + String(id || '').replace(/'/g, '') + '\')" class="w-full flex items-center gap-3 p-3 text-left hover:bg-white/[.06] border-b border-white/5 last:border-0"><img src="' + (track.cover || FI) + '" class="w-10 h-10 rounded-lg object-cover" onerror="this.src=\'' + FI + '\'" /><span class="min-w-0"><strong class="block text-sm text-white truncate">' + es(track.title || 'Lagu') + '</strong><span class="block text-xs text-white/50 truncate">' + es(track.artist || 'MalaMusic') + '</span></span></button>';
            }).join('') : '<div class="p-6 text-center text-sm text-white/50">Belum ada aktivitas terbaru. Mulai dengarkan lagu dari Beranda.</div>';
        }

        lucide.createIcons();
        GoogleAccount.refresh();
    }
};

var Dev = Profile;

var GoogleAccount = {
    escape: function(value) {
        return String(value || '').replace(/[&<>"']/g, function(char) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[char]; });
    },
    login: function() { window.location.href = '/api/google-auth?action=login'; },
    logout: async function() { await fetch('/api/google-auth?action=logout', { credentials: 'same-origin' }); Profile.render(); },
    syncLiked: async function() {
        try {
            var response = await fetch('/api/google-auth?action=liked&maxResults=25', { credentials: 'same-origin' });
            var data = await response.json();
            if (!response.ok || !data.status) throw new Error(data.message || 'Login Google diperlukan');
            var list = data.items || [];
            if (typeof localStorage !== 'undefined') localStorage.setItem('google_liked_tracks', JSON.stringify(list));
            showToast(list.length + ' lagu disukai berhasil disinkronkan');
            Profile.render();
        } catch (error) { showToast(error.message); }
    },
    refresh: async function() {
        var status;
        try {
            var response = await fetch('/api/google-auth?action=me', { credentials: 'same-origin' });
            var data = await response.json();
            var name = document.getElementById('profile-name');
            var subtitle = document.getElementById('profile-subtitle');
            var avatar = document.getElementById('profile-avatar');
            var panel = document.getElementById('profile-account-panel');
            if (!panel) return;
            if (response.ok && data.authenticated) {
                var user = data.user || {};
                if (name) name.textContent = user.name || 'Pengguna MalaMusic';
                if (subtitle) subtitle.textContent = user.email || 'Akun Google terhubung';
                if (avatar && user.picture) { avatar.src = user.picture; avatar.style.display = 'block'; }
                panel.innerHTML = '<div class="flex flex-wrap items-center gap-3 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 p-4"><span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span><span class="text-sm text-emerald-200 flex-1">Akun Google terhubung</span><button onclick="GoogleAccount.logout()" class="text-xs font-bold text-white/60 hover:text-white">Logout</button></div>';
            } else {
                panel.innerHTML = '<div class="flex flex-wrap items-center gap-3 rounded-2xl bg-white/[.05] border border-white/10 p-4"><i data-lucide="user-plus" class="w-5 h-5 text-rose-400"></i><span class="text-sm text-white/70 flex-1">Login untuk membuat profil personal dan sinkronkan Lagu Disukai.</span><button onclick="GoogleAccount.login()" class="px-4 py-2 rounded-full bg-white text-black text-xs font-black hover:bg-white/90">Login Google</button></div>';
                lucide.createIcons();
            }
        } catch (_) { status = 'offline'; }
    }
};
