var Profile = {
    render() {
        var el = gid('view-dev');
        if(!el) return;
        el.innerHTML = `
        <div class="pt-8 pb-3.5 px-4 sticky top-0 z-30 border-b border-white/10 shadow-2xl transition-all" style="background: linear-gradient(180deg, rgba(8, 9, 13, 0.4) 0%, rgba(8, 9, 13, 0.75) 100%), url('/banner.png') center/cover no-repeat; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);">
            <h1 class="text-3xl font-black text-white tracking-tight drop-shadow-md">Profil</h1>
        </div>
        <div class="pt-6 px-4 text-center">
            <div class="relative w-24 h-24 rounded-full mx-auto mb-6 glass-strong shine-sweep flex items-center justify-center overflow-hidden shadow-black/50">
                <i data-lucide="music" class="w-12 h-12 text-white/60 absolute"></i>
                <img src="/logo.png" class="absolute inset-0 w-full h-full object-cover" onerror="this.style.display='none'" />
            </div>
            <h1 class="text-3xl font-black chrome-text mb-1">MalaMusic</h1>
            <p class="text-[#b3b3b3] text-sm mb-6">Streaming Musik YouTube dengan Lirik</p>
            
            <div class="glass rounded-2xl p-5 max-w-sm mx-auto space-y-3 text-left mb-6">
                <h3 class="text-white font-bold text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
                    <i data-lucide="smartphone" class="w-4 h-4 text-rose-400"></i> Aplikasi & PWA
                </h3>
                <div class="flex justify-between"><span class="text-white/70 text-sm">Nama</span><span class="text-white font-medium text-sm">MalaMusic</span></div>
                <div class="flex justify-between"><span class="text-white/70 text-sm">Versi</span><span class="text-white font-medium text-sm">v2.0.0</span></div>
                <div class="flex justify-between"><span class="text-white/70 text-sm">Mode Offline PWA</span><span class="text-emerald-400 font-bold text-sm flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Aktif</span></div>
                <div class="flex justify-between"><span class="text-white/70 text-sm">Service Worker</span><span class="text-white font-medium text-sm">${'serviceWorker' in navigator ? 'Terdaftar' : 'Tidak didukung'}</span></div>
                <div class="pt-2 border-t border-white/10 flex items-center justify-between">
                    <span class="text-white/70 text-xs">Cache PWA tersimpan</span>
                    <button onclick="if(typeof clearPwaCache==='function') clearPwaCache();" class="text-xs text-rose-400 hover:text-rose-300 font-semibold underline active:scale-95">Bersihkan Cache</button>
                </div>
            </div>

            <div class="glass rounded-2xl p-5 max-w-sm mx-auto space-y-4 text-left mb-6">
                <h3 class="text-white font-bold text-sm uppercase tracking-wider mb-2 border-b border-white/10 pb-2 flex items-center gap-2">
                    <i data-lucide="code" class="w-4 h-4 text-rose-400"></i> Developer Profile
                </h3>
                <div class="flex justify-between items-center">
                    <span class="text-white/70 text-sm font-medium">Developed by</span>
                    <div class="flex items-center gap-2">
                        <img src="/dev.png" class="w-6 h-6 rounded-full object-cover border border-white/10" referrerPolicy="no-referrer" onerror="this.src='/logo.png'" />
                        <span class="text-white font-bold text-sm">MalaMusic</span>
                    </div>
                </div>

                <div class="pt-1">
                    <div class="text-xs font-semibold text-white/60 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                        <i data-lucide="heart" class="w-3.5 h-3.5 text-red-400 fill-current"></i> Lagu Yang Disukai
                    </div>
                    <p class="text-sm font-medium text-white/90 bg-white/5 p-2.5 rounded-xl border border-white/5">Semua lagu XXXTENTACION</p>
                </div>

                <div>
                    <div class="text-xs font-semibold text-white/60 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                        <i data-lucide="disc" class="w-3.5 h-3.5 text-purple-400"></i> Playlist Yang Disukai
                    </div>
                    <p class="text-sm font-medium text-white/90 bg-white/5 p-2.5 rounded-xl border border-white/5">Semua album XXXTENTACION</p>
                </div>
            </div>

            <div class="glass rounded-2xl p-5 max-w-sm mx-auto text-left mb-6" id="google-account-card">
                <h3 class="text-white font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                    <i data-lucide="log-in" class="w-4 h-4 text-rose-400"></i> Akun Google
                </h3>
                <div id="google-account-status" class="text-sm text-white/70 mb-3">Memeriksa status login...</div>
                <div id="google-account-actions" class="space-y-2"></div>
                <div id="google-liked-list" class="mt-4 space-y-2"></div>
            </div>
            
            <button id="pwa-install-btn" onclick="installPWA()" class="${typeof isStandaloneApp !== 'undefined' && isStandaloneApp ? 'hidden ' : ''}w-full max-w-sm mx-auto btn-chrome font-bold py-4 rounded-full active:scale-95 transition-all text-center flex items-center justify-center gap-2 mb-3">
                <i data-lucide="download" class="w-5 h-5"></i> Install Aplikasi
            </button>

            <a href="https://whatsapp.com/channel/0029VbCsS2r2phHIV3O0nO1a" target="_blank" class="block w-full max-w-sm mx-auto btn-chrome font-bold py-4 rounded-full active:scale-95 transition-all text-center flex items-center justify-center gap-2">
                <i data-lucide="message-circle" class="w-5 h-5"></i> Gabung Channel WhatsApp
            </a>
        </div>`;
        lucide.createIcons();
    }
};

var Dev = Profile;

var GoogleAccount = {
    escape: function(value) {
        return String(value || '').replace(/[&<>"']/g, function(char) {
            return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[char];
        });
    },
    login: function() {
        window.location.href = '/api/google-auth?action=login';
    },
    logout: async function() {
        await fetch('/api/google-auth?action=logout', { credentials: 'same-origin' });
        Profile.render();
    },
    syncLiked: async function() {
        var list = document.getElementById('google-liked-list');
        if (!list) return;
        list.innerHTML = '<div class="text-sm text-white/60">Memuat lagu yang disukai...</div>';
        try {
            var response = await fetch('/api/google-auth?action=liked&maxResults=25', { credentials: 'same-origin' });
            var data = await response.json();
            if (!response.ok || !data.status) throw new Error(data.message || 'Gagal mengambil data Like');
            if (!data.items || !data.items.length) {
                list.innerHTML = '<div class="text-sm text-white/60">Belum ada video yang diberi Like atau data tidak tersedia.</div>';
                return;
            }
            list.innerHTML = '<div class="text-xs text-white/50 mb-2">' + data.items.length + ' item ditemukan</div>' + data.items.map(function(item) {
                return '<button onclick="location.href=\'/?play=' + encodeURIComponent(item.id) + '\'" class="w-full flex items-center gap-3 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-left transition-colors">' +
                    '<img src="' + GoogleAccount.escape(item.thumbnail) + '" class="w-10 h-10 rounded-lg object-cover" loading="lazy" referrerpolicy="no-referrer" />' +
                    '<span class="min-w-0"><span class="block text-sm text-white font-medium truncate">' + GoogleAccount.escape(item.title) + '</span><span class="block text-xs text-white/50 truncate">' + GoogleAccount.escape(item.channelTitle) + '</span></span>' +
                    '</button>';
            }).join('');
        } catch (error) {
            list.innerHTML = '<div class="text-sm text-rose-300">' + GoogleAccount.escape(error.message) + '</div>';
        }
    },
    refresh: async function() {
        var status = document.getElementById('google-account-status');
        var actions = document.getElementById('google-account-actions');
        if (!status || !actions) return;
        try {
            var response = await fetch('/api/google-auth?action=me', { credentials: 'same-origin' });
            var data = await response.json();
            if (!response.ok || !data.authenticated) {
                status.innerHTML = 'Login untuk mengakses lagu yang kamu sukai di YouTube/YouTube Music.';
                actions.innerHTML = '<button onclick="GoogleAccount.login()" class="w-full bg-white text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-white/90"><span class="text-lg font-black">G</span> Login dengan Google</button>';
                return;
            }
            var user = data.user || {};
            status.innerHTML = '<div class="flex items-center gap-3"><img src="' + GoogleAccount.escape(user.picture) + '" class="w-10 h-10 rounded-full" referrerpolicy="no-referrer" /><span><strong class="text-white block">' + GoogleAccount.escape(user.name) + '</strong><span class="text-xs text-white/50">' + GoogleAccount.escape(user.email) + '</span></span></div>';
            actions.innerHTML = '<button onclick="GoogleAccount.syncLiked()" class="w-full btn-chrome font-bold py-3 rounded-xl">Sinkronkan Lagu Disukai</button><button onclick="GoogleAccount.logout()" class="w-full text-white/60 text-sm py-2 hover:text-white">Logout</button>';
        } catch (_) {
            status.textContent = 'Status akun belum dapat diperiksa.';
        }
    }
};

var _originalProfileRender = Profile.render;
Profile.render = function() {
    _originalProfileRender.call(Profile);
    GoogleAccount.refresh();
};
