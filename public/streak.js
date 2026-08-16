var Streak = {
    API: '/api/streak',
    sentTracks: {},
    stats: null,
    celebrate: function() {
        var card = document.getElementById('home-streak-card');
        if (!card) return;
        if (!document.getElementById('streak-celebration-style')) { var style = document.createElement('style'); style.id = 'streak-celebration-style'; style.textContent = '@keyframes malaStreakPop{0%{transform:scale(1);box-shadow:0 0 0 rgba(251,191,36,0)}45%{transform:scale(1.025);box-shadow:0 0 38px rgba(251,191,36,.34)}100%{transform:scale(1);box-shadow:0 0 0 rgba(251,191,36,0)}}@keyframes malaSpark{0%{opacity:0;transform:translateY(10px) scale(.5)}25%{opacity:1}100%{opacity:0;transform:translate(var(--x),-48px) scale(1.2)}}.mala-streak-pop{animation:malaStreakPop .8s ease-out}.mala-streak-spark{position:absolute;bottom:18px;left:50%;width:7px;height:7px;border-radius:999px;background:#fbbf24;pointer-events:none;animation:malaSpark .9s ease-out forwards}'; document.head.appendChild(style); }
        card.classList.remove('mala-streak-pop'); void card.offsetWidth; card.classList.add('mala-streak-pop'); card.style.position = 'relative';
        for (var i = 0; i < 10; i++) { var spark = document.createElement('span'); spark.className = 'mala-streak-spark'; spark.style.setProperty('--x', ((i % 2 ? 1 : -1) * (18 + Math.random() * 54)) + 'px'); spark.style.animationDelay = (i * 35) + 'ms'; card.appendChild(spark); setTimeout(function(node) { if (node && node.remove) node.remove(); }, 1100, spark); }
    },
    load: async function() {
        try {
            var response = await fetch(this.API + '?action=me', { credentials: 'same-origin' });
            if (!response.ok) { this.stats = null; return null; }
            var data = await response.json();
            this.stats = data && data.streak ? data.streak : null;
            return this.stats;
        } catch (_) { this.stats = null; return null; }
    },
    record: async function(track) {
        var id = track && (track.videoId || track.id);
        if (!id || this.sentTracks[id]) return this.stats;
        this.sentTracks[id] = true;
        try {
            var response = await fetch(this.API + '?action=record', {
                method: 'POST', credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trackId: id, title: track.title || '', artist: track.artist || '' })
            });
            if (!response.ok) return this.stats;
            var data = await response.json();
            var previous = this.stats || { current: 0, activeDays: 0 };
            this.stats = data && data.streak ? data.streak : this.stats;
            if (this.stats && (Number(this.stats.current || 0) > Number(previous.current || 0) || Number(this.stats.activeDays || 0) > Number(previous.activeDays || 0))) this.celebrate();
            return this.stats;
        } catch (_) { return this.stats; }
    },
    card: function(stats) {
        stats = stats || { current: 0, best: 0, activeDays: 0 };
        var current = Number(stats.current || 0);
        var best = Number(stats.best || 0);
        var active = Number(stats.activeDays || 0);
        var title = current ? current + ' hari berturut-turut' : 'Mulai streak pertamamu';
        var subtitle = current ? 'Pertahankan kebiasaan mendengarkan musik setiap hari.' : 'Dengarkan minimal 30 detik lagu untuk mencatat hari aktif.';
        return '<section class="mb-8 rounded-2xl overflow-hidden border border-amber-300/20 bg-gradient-to-br from-[#3b260d] via-[#211815] to-[#111217] shadow-xl">' +
            '<div class="p-5 flex items-center gap-4"><div class="w-14 h-14 rounded-2xl bg-amber-400/15 border border-amber-300/25 flex items-center justify-center shrink-0"><i data-lucide="flame" class="w-7 h-7 text-amber-300 fill-amber-300/20"></i></div><div class="min-w-0 flex-1"><p class="text-[11px] font-black uppercase tracking-[.18em] text-amber-200/70">Listening Streak</p><h2 class="text-xl font-black text-white mt-1 truncate">' + title + '</h2><p class="text-xs text-white/55 mt-1">' + subtitle + '</p></div></div>' +
            '<div class="grid grid-cols-2 border-t border-white/10"><div class="p-4"><span class="block text-2xl font-black text-amber-200">' + current + '</span><span class="text-[11px] text-white/50">Streak saat ini</span></div><div class="p-4 border-l border-white/10"><span class="block text-2xl font-black text-white">' + best + '</span><span class="text-[11px] text-white/50">Rekor terbaik · ' + active + ' hari aktif</span></div></div></section>';
    },
    homeCard: function(stats) {
        if (!stats) return '<div class="mb-6 rounded-2xl border border-amber-300/20 bg-gradient-to-r from-[#2b1d0b] to-[#15151b] p-4 flex items-center gap-3 shadow-lg"><div class="w-11 h-11 rounded-xl bg-amber-400/15 border border-amber-300/20 flex items-center justify-center shrink-0"><i data-lucide="flame" class="w-5 h-5 text-amber-300"></i></div><div class="min-w-0 flex-1"><p class="text-[10px] font-black uppercase tracking-[.16em] text-amber-200/70">Listening Streak</p><h3 class="text-sm font-black text-white mt-0.5">Login untuk mulai menjaga streak</h3><p class="text-xs text-white/50 mt-0.5">Dengarkan lagu setiap hari dan bangun rekor kamu.</p></div><button onclick="App.switch(\'dev\');setTimeout(function(){EmailAuth.open()},120)" class="rounded-xl bg-white text-black px-3 py-2 text-xs font-black shrink-0 active:scale-95">Login</button></div>';
        var current = Number(stats.current || 0), best = Number(stats.best || 0);
        return '<div class="mb-6 rounded-2xl border border-amber-300/20 bg-gradient-to-r from-[#3b260d] via-[#211815] to-[#15151b] p-4 shadow-lg"><div class="flex items-center gap-3"><div class="w-11 h-11 rounded-xl bg-amber-400/15 border border-amber-300/20 flex items-center justify-center shrink-0"><i data-lucide="flame" class="w-5 h-5 text-amber-300 fill-amber-300/20"></i></div><div class="min-w-0 flex-1"><p class="text-[10px] font-black uppercase tracking-[.16em] text-amber-200/70">Listening Streak</p><h3 class="text-base font-black text-white mt-0.5">' + (current ? current + ' hari berturut-turut' : 'Mulai streak pertamamu') + '</h3></div><button onclick="App.switch(\'dev\')" class="text-xs font-bold text-white/55 hover:text-white shrink-0">Detail</button></div><div class="grid grid-cols-2 gap-2 mt-3"><div class="rounded-xl bg-black/20 border border-white/10 px-3 py-2"><strong class="block text-lg font-black text-amber-200">' + current + '</strong><span class="text-[10px] text-white/50">Streak saat ini</span></div><div class="rounded-xl bg-black/20 border border-white/10 px-3 py-2"><strong class="block text-lg font-black text-white">' + best + '</strong><span class="text-[10px] text-white/50">Rekor terbaik</span></div></div></div>';
    },
    refreshHomeCard: async function() {
        var el = document.getElementById('home-streak-card');
        if (!el) return;
        var stats = await this.load();
        el.innerHTML = this.homeCard(stats);
        if (window.lucide) lucide.createIcons();
    },
    refreshProfileCard: async function() {
        var el = document.getElementById('profile-streak-card');
        if (!el) return;
        var stats = await this.load();
        el.innerHTML = this.card(stats);
        if (window.lucide) lucide.createIcons();
    }
};
