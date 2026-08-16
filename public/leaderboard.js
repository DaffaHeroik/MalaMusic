var Leaderboard = {
    render: async function() {
        var view = document.getElementById('view-leaderboard');
        if (!view) return;
        view.innerHTML = '<div class="pt-8 pb-4 px-4 border-b border-white/10 bg-gradient-to-b from-[#25170a] to-transparent"><div class="max-w-5xl mx-auto"><p class="text-[11px] font-black uppercase tracking-[.2em] text-amber-200/70">MalaMusic Community</p><h1 class="text-3xl font-black text-white mt-1">Leaderboard Pendengar</h1><p class="text-sm text-white/50 mt-2">Peringkat diperbarui setiap tengah malam WITA.</p></div></div><div class="max-w-5xl mx-auto px-4 py-5"><div id="leaderboard-list" class="space-y-2"><div class="rounded-2xl bg-white/[.05] border border-white/10 p-6 text-center text-sm text-white/50">Memuat leaderboard...</div></div></div>';
        try {
            var response = await fetch('/api/stats?action=leaderboard', { credentials: 'same-origin' });
            var data = await response.json();
            var list = document.getElementById('leaderboard-list');
            if (!data.status || !data.leaderboard || !data.leaderboard.length) {
                list.innerHTML = '<div class="rounded-2xl bg-white/[.05] border border-white/10 p-8 text-center"><i data-lucide="trophy" class="w-10 h-10 text-amber-300 mx-auto mb-3"></i><h2 class="font-black text-white">Leaderboard belum tersedia</h2><p class="text-xs text-white/50 mt-2">Data pertama akan muncul setelah snapshot tengah malam.</p></div>';
            } else {
                list.innerHTML = data.leaderboard.map(function(row) {
                    var medal = row.rank === 1 ? 'text-amber-300' : row.rank === 2 ? 'text-slate-200' : row.rank === 3 ? 'text-orange-300' : 'text-white/50';
                    return '<div class="flex items-center gap-3 rounded-2xl bg-white/[.04] border border-white/10 p-3 sm:p-4"><div class="w-9 text-center text-lg font-black '+medal+'">'+row.rank+'</div><div class="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400/30 to-rose-500/30 flex items-center justify-center shrink-0"><i data-lucide="headphones" class="w-5 h-5 text-white/80"></i></div><div class="min-w-0 flex-1"><strong class="block text-sm text-white truncate">'+es(row.name)+'</strong><span class="text-xs text-white/45">'+row.activeDays+' hari aktif · rekor streak '+row.bestStreak+' hari</span></div><div class="text-right shrink-0"><strong class="block text-sm text-amber-200">'+row.streak+' hari</strong><span class="text-[10px] text-white/45">'+row.hours+' jam dengar</span></div></div>';
                }).join('');
            }
            lucide.createIcons();
        } catch (_) {
            var error = document.getElementById('leaderboard-list');
            if (error) error.innerHTML = '<div class="rounded-2xl bg-white/[.05] border border-white/10 p-8 text-center text-sm text-white/50">Leaderboard belum dapat dimuat. Coba lagi nanti.</div>';
        }
    }
};
