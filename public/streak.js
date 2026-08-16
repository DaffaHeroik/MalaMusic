var Streak = {
    API: '/api/streak',
    sentTracks: {},
    stats: null,
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
            this.stats = data && data.streak ? data.streak : this.stats;
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
    refreshProfileCard: async function() {
        var el = document.getElementById('profile-streak-card');
        if (!el) return;
        var stats = await this.load();
        el.innerHTML = this.card(stats);
        if (window.lucide) lucide.createIcons();
    }
};
