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
                        <img id="profile-avatar" src="/logo-mark.png" class="w-full h-full object-contain p-2" alt="Profil" onerror="this.style.display='none'" />
                        <i data-lucide="user" class="w-12 h-12 text-white/80"></i>
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
                        <button onclick="EmailAuth.open()" class="text-left rounded-2xl overflow-hidden bg-gradient-to-br from-[#be123c] to-[#4c0519] p-4 aspect-square flex flex-col justify-end shadow-lg hover:scale-[1.02] transition-transform"><i data-lucide="mail-check" class="w-8 h-8 text-white mb-auto"></i><span class="text-white font-bold text-sm">Login / Daftar</span><span class="text-white/60 text-xs mt-1">Masuk dengan Gmail</span></button>
                    </div>
                </section>

                <section class="mb-8">
                    <div class="flex items-center justify-between mb-3"><h2 class="text-xl font-black text-white">Aktivitas terbaru</h2><button onclick="Profile.showHistory()" class="text-xs font-bold text-white/50 hover:text-white">Lihat semua</button></div>
                    <div id="profile-recent-list" class="rounded-2xl bg-white/[.04] border border-white/10 overflow-hidden"></div>
                </section>

                <section class="rounded-2xl bg-white/[.04] border border-white/10 overflow-hidden mb-8">
                    <div id="profile-account-panel-secondary"></div>
                    <button onclick="EmailAuth.open()" class="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-white/[.06] transition-colors"><i data-lucide="mail" class="w-5 h-5 text-rose-400"></i><span class="flex-1"><strong class="block text-sm text-white">Login atau Daftar</strong><span class="block text-xs text-white/50">Pilih login atau buat akun dengan OTP Gmail</span></span><i data-lucide="chevron-right" class="w-4 h-4 text-white/40"></i></button>
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
        EmailAuth.refresh();
        if (typeof Streak !== 'undefined') Streak.refreshProfileCard();
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
    exportLocalData: function() {
        var keys = ['malamusic_liked_songs', 'malamusic_playlists', 'pwa_offline_tracks', 'malamusic_recent_tracks', 'mala_recent_searches', 'malamusic_auto_next', 'malamusic_bg_glow_enabled'];
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
        var modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-[400] flex items-end sm:items-center justify-center bg-black/75 px-0 sm:px-4';
        modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
        modal.innerHTML = '<div class="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-[#15151b] border border-white/10 shadow-2xl p-5"><div class="flex items-center justify-between mb-5"><div><h3 class="font-black text-white text-lg">Pengaturan</h3><p class="text-xs text-white/50 mt-1">Preferensi MalaMusic di perangkat ini</p></div><button onclick="this.closest(\'.fixed\').remove()" class="w-9 h-9 rounded-full bg-white/10 text-white">×</button></div><div class="space-y-2"><label class="flex items-center gap-3 p-3 rounded-xl bg-white/[.04] border border-white/10"><i data-lucide="skip-forward" class="w-4 h-4 text-white/60"></i><span class="flex-1"><strong class="block text-sm text-white">Putar otomatis</strong><span class="block text-xs text-white/50">Lanjutkan ke lagu berikutnya</span></span><input type="checkbox" ' + (autoNext ? 'checked' : '') + ' onchange="toggleAutoNext()" class="accent-rose-500 w-5 h-5" /></label><label class="flex items-center gap-3 p-3 rounded-xl bg-white/[.04] border border-white/10"><i data-lucide="sparkles" class="w-4 h-4 text-white/60"></i><span class="flex-1"><strong class="block text-sm text-white">Latar bergerak</strong><span class="block text-xs text-white/50">Warna cover pada pemutar</span></span><input type="checkbox" ' + (glow ? 'checked' : '') + ' onchange="FullPlayer.toggleBgGlow()" class="accent-rose-500 w-5 h-5" /></label></div><div class="mt-4 pt-4 border-t border-white/10 space-y-2"><p class="text-[11px] text-white/40">Koleksi saat ini tersimpan di perangkat ini. Buat backup sebelum mengganti browser atau perangkat.</p><div class="grid grid-cols-2 gap-2"><button onclick="Profile.exportLocalData()" class="rounded-xl bg-white/10 border border-white/10 text-white py-3 text-xs font-bold">Backup Data</button><button onclick="Profile.importLocalData()" class="rounded-xl bg-white/10 border border-white/10 text-white py-3 text-xs font-bold">Pulihkan Data</button></div><button onclick="localStorage.removeItem(\'mala_recent_tracks\');localStorage.removeItem(\'mala_recent_searches\');Profile.render();showToast(\'Data aktivitas lokal dihapus\')" class="w-full rounded-xl bg-rose-500/10 border border-rose-400/20 text-rose-200 py-3 text-xs font-bold">Hapus Riwayat & Pencarian</button></div></div>';
        document.body.appendChild(modal); lucide.createIcons();
    }
};

var Dev = Profile;

var EmailAuth = {
    pendingEmail: '',
    entryMode: 'login',
    escape: function(value) {
        return String(value || '').replace(/[&<>"']/g, function(char) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[char]; });
    },
    open: function() {
        var panel = document.getElementById('profile-account-panel');
        if (!panel) return;
        panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        this.renderChoice();
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
        var title = this.entryMode === 'register' ? 'Daftar dengan Gmail' : 'Login dengan Gmail';
        var helper = this.entryMode === 'register' ? 'Buat akun MalaMusic dengan kode OTP sekali pakai.' : 'Masuk ke akun MalaMusic dengan kode OTP sekali pakai.';
        panel.innerHTML = '<div class="rounded-2xl bg-white/[.05] border border-white/10 p-4 sm:p-5"><div class="flex items-start gap-3 mb-4"><i data-lucide="mail" class="w-5 h-5 text-rose-400 mt-0.5"></i><div><strong class="block text-sm text-white">' + title + '</strong><span class="block text-xs text-white/50 mt-1">' + helper + ' Hanya alamat @gmail.com yang diterima.</span></div></div><div class="flex flex-col sm:flex-row gap-2"><input id="otp-email" type="email" autocomplete="email" placeholder="nama@gmail.com" class="flex-1 min-w-0 rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-rose-400" /><button onclick="EmailAuth.request()" class="rounded-xl bg-white px-5 py-3 text-sm font-black text-black hover:bg-rose-100">Kirim OTP</button></div><button onclick="EmailAuth.renderChoice()" class="mt-3 text-xs font-bold text-white/50 hover:text-white">Kembali ke pilihan Login/Daftar</button>' + (message ? '<p class="mt-3 text-xs text-rose-300">' + this.escape(message) + '</p>' : '') + '</div>';
        lucide.createIcons();
    },
    renderLogin: function(message) { this.renderEmailForm(message); },
    renderVerify: function(email, message) {
        var panel = document.getElementById('profile-account-panel');
        if (!panel) return;
        panel.innerHTML = '<div class="rounded-2xl bg-rose-500/10 border border-rose-400/20 p-4 sm:p-5"><div class="flex items-start gap-3 mb-4"><i data-lucide="shield-check" class="w-5 h-5 text-rose-300 mt-0.5"></i><div><strong class="block text-sm text-white">Masukkan kode OTP</strong><span class="block text-xs text-white/60 mt-1">Kode dikirim ke <b class="text-white">' + this.escape(email) + '</b> dan berlaku 10 menit.</span></div></div><div class="flex flex-col sm:flex-row gap-2"><input id="otp-code" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="000000" class="flex-1 min-w-0 rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-lg tracking-[.35em] text-white outline-none focus:border-rose-400" /><button onclick="EmailAuth.verify()" class="rounded-xl bg-white px-5 py-3 text-sm font-black text-black hover:bg-rose-100">Verifikasi</button></div><button onclick="EmailAuth.renderChoice()" class="mt-3 text-xs font-bold text-white/50 hover:text-white">Kembali ke pilihan Login/Daftar</button>' + (message ? '<p class="mt-3 text-xs text-rose-200">' + this.escape(message) + '</p>' : '') + '</div>';
        lucide.createIcons();
    },
    request: async function() {
        var input = document.getElementById('otp-email');
        var email = input ? input.value.trim().toLowerCase() : '';
        if (!/^[^@\s]+@gmail\.com$/i.test(email)) return this.renderLogin('Gunakan alamat Gmail yang valid (@gmail.com).');
        try {
            var response = await fetch('/api/email-auth?action=request', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email }) });
            var data = await response.json();
            if (!response.ok || !data.status) throw new Error(data.message || 'OTP gagal dikirim.');
            this.pendingEmail = email;
            showToast('OTP dikirim ke ' + email);
            this.renderVerify(email);
        } catch (error) { this.renderLogin(error.message); }
    },
    verify: async function() {
        var input = document.getElementById('otp-code');
        var otp = input ? input.value.trim() : '';
        if (!/^\d{6}$/.test(otp)) return this.renderVerify('', 'Masukkan 6 digit kode OTP.');
        try {
            var response = await fetch('/api/email-auth?action=verify', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ otp: otp }) });
            var data = await response.json();
            if (!response.ok || !data.status) throw new Error(data.message || 'OTP tidak valid.');
            showToast('Berhasil masuk ke MalaMusic');
            Profile.render();
        } catch (error) { this.renderVerify(this.pendingEmail, error.message); }
    },
    logout: async function() {
        await fetch('/api/email-auth?action=logout', { credentials: 'same-origin' });
        showToast('Kamu sudah logout');
        Profile.render();
    },
    refresh: async function() {
        try {
            var response = await fetch('/api/email-auth?action=me', { credentials: 'same-origin' });
            var data = await response.json();
            var name = document.getElementById('profile-name');
            var subtitle = document.getElementById('profile-subtitle');
            var avatar = document.getElementById('profile-avatar');
            var panel = document.getElementById('profile-account-panel');
            if (!panel) return;
            if (response.ok && data.authenticated) {
                var user = data.user || {};
                if (name) name.textContent = user.name || 'Profil Saya';
                if (subtitle) subtitle.textContent = user.email || 'Akun MalaMusic';
                if (avatar && user.picture) { avatar.src = user.picture; avatar.style.display = 'block'; }
                panel.innerHTML = '<div class="flex flex-wrap items-center gap-3 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 p-4"><span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span><span class="text-sm text-emerald-200 flex-1">Akun Gmail terhubung: ' + this.escape(user.email) + '</span><button onclick="EmailAuth.logout()" class="text-xs font-bold text-white/60 hover:text-white">Logout</button></div>';
            } else {
                name && (name.textContent = 'Profil Saya');
                subtitle && (subtitle.textContent = 'Masuk dengan Gmail untuk menyimpan profil kamu');
                this.renderChoice();
            }
            lucide.createIcons();
        } catch (_) { this.renderChoice('Server autentikasi belum siap.'); }
    }
};
