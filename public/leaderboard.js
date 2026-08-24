var Leaderboard = {
    render: async function() {
        var view = document.getElementById('view-leaderboard');
        if (!view) return;
        view.innerHTML = '<div class="pt-8 pb-4 px-4 border-b border-white/10 bg-gradient-to-b from-[#25170a] to-transparent"><div class="max-w-5xl mx-auto"><p class="text-[11px] font-black uppercase tracking-[.2em] text-amber-200/70">MalaMusic Community</p><h1 class="text-3xl font-black text-white mt-1">Leaderboard Pendengar</h1><p class="text-sm text-white/50 mt-2">Peringkat diperbarui setiap tengah malam WITA.</p></div></div><div class="max-w-5xl mx-auto px-4 py-5"><div id="leaderboard-list" class="space-y-2" aria-live="polite" aria-busy="true"><div class="rounded-2xl bg-white/[.05] border border-white/10 p-6" role="status"><div class="h-4 w-48 rounded bg-white/10 animate-pulse"></div><div class="h-3 w-72 max-w-full rounded bg-white/[.07] animate-pulse mt-3"></div><div class="h-16 rounded-2xl bg-white/[.04] animate-pulse mt-5"></div><div class="h-16 rounded-2xl bg-white/[.04] animate-pulse mt-2"></div><p class="sr-only">Memuat leaderboard.</p></div></div></div>';
        var list = document.getElementById('leaderboard-list');
        var controller = window.AbortController ? new AbortController() : null;
        var timeout = setTimeout(function() { if (controller) controller.abort(); }, 8000);
        try {
            var response = await fetch('/api/stats?action=leaderboard', { credentials: 'same-origin', signal: controller ? controller.signal : undefined });
            var data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Permintaan leaderboard gagal.');
            if (!data.status || !data.leaderboard || !data.leaderboard.length) {
                list.setAttribute('aria-busy', 'false');
                list.innerHTML = '<div class="rounded-2xl bg-white/[.05] border border-white/10 p-8 text-center" role="status"><i data-lucide="trophy" class="w-10 h-10 text-amber-300 mx-auto mb-3" aria-hidden="true"></i><h2 class="font-black text-white">Belum ada peringkat</h2><p class="text-sm text-white/55 mt-2 max-w-sm mx-auto">Leaderboard akan muncul setelah ada snapshot aktivitas pendengar. Tetap dengarkan musik untuk ikut masuk peringkat.</p><button type="button" onclick="Leaderboard.render()" class="mt-5 rounded-full bg-white text-black px-5 py-2.5 text-xs font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300">Muat ulang</button></div>';
            } else {
                list.setAttribute('aria-busy', 'false');
                list.innerHTML = data.leaderboard.map(function(row) {
                    var medal = row.rank === 1 ? 'text-amber-300' : row.rank === 2 ? 'text-slate-200' : row.rank === 3 ? 'text-orange-300' : 'text-white/50';
                    return '<div class="flex items-center gap-3 rounded-2xl bg-white/[.04] border border-white/10 p-3 sm:p-4"><div class="w-9 text-center text-lg font-black '+medal+'" aria-label="Peringkat '+row.rank+'">'+row.rank+'</div><div class="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400/30 to-rose-500/30 flex items-center justify-center shrink-0"><i data-lucide="headphones" class="w-5 h-5 text-white/80" aria-hidden="true"></i></div><div class="min-w-0 flex-1"><strong class="block text-sm text-white truncate">'+es(row.name)+'</strong><span class="text-xs text-white/45">'+row.activeDays+' hari aktif · rekor streak '+row.bestStreak+' hari</span></div><div class="text-right shrink-0"><strong class="block text-sm text-amber-200">'+row.streak+' hari</strong><span class="text-[10px] text-white/45">'+row.hours+' jam dengar</span></div></div>';
                }).join('');
            }
            if (window.lucide) lucide.createIcons();
        } catch (error) {
            if (!list) return;
            list.setAttribute('aria-busy', 'false');
            list.innerHTML = '<div class="rounded-2xl bg-white/[.05] border border-rose-300/20 p-8 text-center" role="alert"><i data-lucide="wifi-off" class="w-10 h-10 text-rose-200 mx-auto mb-3" aria-hidden="true"></i><h2 class="font-black text-white">Leaderboard belum dapat dimuat</h2><p class="text-sm text-white/55 mt-2">Periksa koneksi, lalu coba lagi. Halaman lain tetap bisa digunakan.</p><button type="button" onclick="Leaderboard.render()" class="mt-5 rounded-full bg-white text-black px-5 py-2.5 text-xs font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300">Coba lagi</button></div>';
            if (window.lucide) lucide.createIcons();
        } finally {
            clearTimeout(timeout);
        }
    }
};

window.Leaderboard = Leaderboard;
