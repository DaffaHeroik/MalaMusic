(function () {
    'use strict';
    var state = { room: null };
    var PENDING_KEY = 'malamusic:pending-blend-invite';
    var PENDING_TTL = 24 * 60 * 60 * 1000;

    function esc(value) { return typeof es === 'function' ? es(value) : String(value || '').replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
    function escJs(value) { return typeof esJs === 'function' ? esJs(value) : String(value || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }
    function cleanRoomId(value) { return String(value || '').trim().replace(/[^A-Za-z0-9_-]/g, '').slice(0, 20).toUpperCase(); }
    function invitePath(roomId) { return '/blend/' + encodeURIComponent(cleanRoomId(roomId)); }
    function inviteUrl(roomId) { return location.origin + invitePath(roomId); }
    function cleanSong(song) { var id = String(song && (song.videoId || song.id) || '').trim(); return id ? { id: id, videoId: id, title: String(song.title || 'Lagu').slice(0, 180), artist: String(song.artist || 'MalaMusic').slice(0, 120), cover: String(song.cover || '').slice(0, 700), ytUrl: String(song.ytUrl || '').slice(0, 700) } : null; }
    function api(action, options) {
        options = options || {};
        var method = options.method || 'GET';
        var url = '/api/blend?action=' + encodeURIComponent(action) + (options.room ? '&room=' + encodeURIComponent(options.room) : '');
        return fetch(url, { method: method, credentials: 'same-origin', headers: method === 'GET' ? {} : { 'Content-Type': 'application/json' }, body: method === 'GET' ? undefined : JSON.stringify(options.body || {}) }).then(function (r) {
            return r.json().catch(function () { return {}; }).then(function (d) {
                if (!r.ok || d.status === false) { var error = new Error(d.message || 'Blend gagal diproses.'); error.status = r.status; error.data = d; throw error; }
                return d;
            });
        });
    }
    function closeModal() { var m = document.getElementById('blend-modal'); if (m) m.remove(); }
    function toast(message) { if (typeof showToast === 'function') showToast(message); }
    function rememberPendingInvite(roomId) {
        var clean = cleanRoomId(roomId); if (!clean) return;
        try { sessionStorage.setItem(PENDING_KEY, JSON.stringify({ room: clean, path: invitePath(clean), createdAt: Date.now() })); } catch (_) {}
    }
    function readPendingInvite() {
        try {
            var raw = sessionStorage.getItem(PENDING_KEY); if (!raw) return null;
            var pending = JSON.parse(raw); var room = cleanRoomId(pending && pending.room);
            if (!room || !pending.createdAt || Date.now() - Number(pending.createdAt) > PENDING_TTL) { sessionStorage.removeItem(PENDING_KEY); return null; }
            return { room: room, path: invitePath(room) };
        } catch (_) { return null; }
    }
    function clearPendingInvite() { try { sessionStorage.removeItem(PENDING_KEY); } catch (_) {} }
    function openAuthForInvite(roomId) {
        rememberPendingInvite(roomId);
        if (typeof App === 'undefined' || typeof App.switch !== 'function') { toast('Muat ulang halaman untuk login dan menerima undangan.'); return; }
        App.switch('dev');
        setTimeout(function () {
            if (typeof EmailAuth !== 'undefined' && typeof EmailAuth.open === 'function') EmailAuth.open();
        }, 250);
    }
    function renderInviteError(roomId, error) {
        closeModal();
        var status = Number(error && error.status || 0);
        var title = status === 403 ? 'Undangan ini bukan untuk akunmu' : status === 404 ? 'Link Blend tidak ditemukan' : status === 410 ? 'Link Blend sudah kedaluwarsa' : 'Undangan Blend belum dapat dibuka';
        var message = status === 403 ? 'Minta pengundang membuat undangan baru untuk akun yang benar.' : status === 404 ? 'Periksa kembali link yang dikirim pengundang.' : status === 410 ? 'Room Blend memiliki masa berlaku dan sudah tidak aktif.' : (error && error.message) || 'Periksa koneksi internet lalu coba lagi.';
        var m = document.createElement('div'); m.id = 'blend-modal'; m.className = 'fixed inset-0 z-[430] flex items-end sm:items-center justify-center bg-black/75 px-0 sm:px-4';
        m.innerHTML = '<div role="dialog" aria-modal="true" aria-labelledby="blend-invite-error-title" class="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-[#15151b] border border-white/10 shadow-2xl p-6"><p class="text-[10px] uppercase tracking-[.18em] text-fuchsia-200/80 font-black">Undangan Blend</p><h2 id="blend-invite-error-title" class="text-xl font-black text-white mt-2">' + esc(title) + '</h2><p class="text-sm text-white/60 mt-2">' + esc(message) + '</p><div class="flex gap-2 mt-6"><button type="button" onclick="Blend.close()" class="flex-1 rounded-xl bg-white/10 text-white py-3 text-xs font-bold">Tutup</button>' + (status !== 403 && status !== 404 && status !== 410 ? '<button type="button" onclick="Blend.promptJoin(\'' + escJs(roomId) + '\')" class="flex-1 rounded-xl bg-fuchsia-400 text-black py-3 text-xs font-black">Coba lagi</button>' : '') + '</div></div>';
        document.body.appendChild(m);
    }
    function renderLoginRequired(roomId) {
        rememberPendingInvite(roomId); closeModal();
        var m = document.createElement('div'); m.id = 'blend-modal'; m.className = 'fixed inset-0 z-[430] flex items-end sm:items-center justify-center bg-black/75 px-0 sm:px-4';
        m.innerHTML = '<div role="dialog" aria-modal="true" aria-labelledby="blend-login-title" class="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-[#15151b] border border-white/10 shadow-2xl p-6"><div class="w-12 h-12 rounded-2xl bg-fuchsia-500/15 text-fuchsia-200 flex items-center justify-center"><i data-lucide="link-2" class="w-6 h-6"></i></div><p class="text-[10px] uppercase tracking-[.18em] text-fuchsia-200/80 font-black mt-5">Undangan Blend</p><h2 id="blend-login-title" class="text-xl font-black text-white mt-2">Login untuk melihat invitation</h2><p class="text-sm text-white/60 mt-2">Link ini sudah disimpan. Setelah login atau daftar, MalaMusic akan mengembalikanmu ke undangan Blend ini.</p><div class="flex gap-2 mt-6"><button type="button" onclick="Blend.close()" class="flex-1 rounded-xl bg-white/10 text-white py-3 text-xs font-bold">Nanti</button><button type="button" onclick="Blend.loginFromInvite(\'' + escJs(roomId) + '\')" class="flex-1 rounded-xl bg-fuchsia-400 text-black py-3 text-xs font-black">Login / Daftar</button></div></div>';
        document.body.appendChild(m); if (window.lucide) lucide.createIcons();
    }
    function renderInvitation(room, roomId) {
        closeModal(); var songs = (room.playlist && room.playlist.songs) || [], members = room.members || [];
        var m = document.createElement('div'); m.id = 'blend-modal'; m.className = 'fixed inset-0 z-[430] flex items-end sm:items-center justify-center bg-black/75 px-0 sm:px-4';
        m.innerHTML = '<div role="dialog" aria-modal="true" aria-labelledby="blend-invitation-title" class="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-[#15151b] border border-white/10 shadow-2xl p-6"><div class="w-12 h-12 rounded-2xl bg-fuchsia-500/15 text-fuchsia-200 flex items-center justify-center"><i data-lucide="sparkles" class="w-6 h-6"></i></div><p class="text-[10px] uppercase tracking-[.18em] text-fuchsia-200/80 font-black mt-5">Kamu mendapat undangan</p><h2 id="blend-invitation-title" class="text-xl font-black text-white mt-2">' + esc(room.title || 'Blend MalaMusic') + '</h2><p class="text-sm text-white/60 mt-2">Gabungkan selera musikmu dengan pengundang dan buat playlist kolaboratif bersama.</p><div class="flex flex-wrap gap-2 mt-4">' + members.map(function (member) { return '<span class="px-3 py-1.5 rounded-full bg-white/[.06] border border-white/10 text-xs text-white/75">' + esc(member.name) + (member.role === 'owner' ? ' · pengundang' : '') + '</span>'; }).join('') + '</div><p class="text-xs text-white/45 mt-4">' + songs.length + ' lagu awal berdasarkan selera musik kalian.</p><div class="flex gap-2 mt-6"><button type="button" onclick="Blend.decline()" class="flex-1 rounded-xl bg-white/10 text-white py-3 text-xs font-bold">Tolak</button><button type="button" onclick="Blend.join(\'' + escJs(roomId) + '\')" class="flex-1 rounded-xl bg-fuchsia-400 text-black py-3 text-xs font-black">Gabung Blend</button></div></div>';
        document.body.appendChild(m); if (window.lucide) lucide.createIcons();
    }
    function renderRoom(room, inviteCode) {
        state.room = room; clearPendingInvite(); closeModal(); var songs = (room.playlist && room.playlist.songs) || [], members = room.members || [];
        var m = document.createElement('div'); m.id = 'blend-modal'; m.className = 'fixed inset-0 z-[430] flex items-end sm:items-center justify-center bg-black/75 px-0 sm:px-4';
        m.onclick = function (e) { if (e.target === m) closeModal(); };
        m.innerHTML = '<div role="dialog" aria-modal="true" aria-labelledby="blend-room-title" class="w-full sm:max-w-xl max-h-[90vh] overflow-hidden rounded-t-3xl sm:rounded-3xl bg-[#15151b] border border-white/10 shadow-2xl">' +
            '<div class="p-5 border-b border-white/10 flex items-start gap-3"><div class="w-12 h-12 rounded-2xl bg-fuchsia-500/15 text-fuchsia-200 flex items-center justify-center shrink-0"><i data-lucide="sparkles" class="w-6 h-6"></i></div><div class="min-w-0 flex-1"><p class="text-[10px] uppercase tracking-[.18em] text-fuchsia-200/80 font-black">Blend Kolaboratif</p><h2 id="blend-room-title" class="text-xl font-black text-white mt-1 truncate">' + esc(room.title || 'Blend MalaMusic') + '</h2><p class="text-xs text-white/50 mt-1">' + members.length + ' anggota · ' + songs.length + ' lagu relevan</p></div><button type="button" aria-label="Tutup Blend" onclick="Blend.close()" class="w-9 h-9 rounded-full bg-white/10 text-white">×</button></div>' +
            '<div class="p-4 border-b border-white/10 flex flex-wrap gap-2">' + members.map(function (member) { return '<span class="px-3 py-1.5 rounded-full bg-white/[.06] border border-white/10 text-xs text-white/75">' + esc(member.name) + (member.role === 'owner' ? ' · pemilik' : '') + '</span>'; }).join('') + '</div>' +
            '<div class="p-4 flex gap-2"><button type="button" onclick="Blend.shareInvite(\'' + escJs(inviteCode || room.id) + '\')" class="flex-1 rounded-xl bg-fuchsia-400/15 border border-fuchsia-300/30 text-fuchsia-100 py-3 text-xs font-bold"><i data-lucide="share-2" class="w-4 h-4 inline mr-1"></i>Bagikan link undangan</button><button type="button" aria-label="Muat ulang Blend" onclick="Blend.refresh(\'' + escJs(room.id) + '\')" class="w-11 rounded-xl bg-white/10 border border-white/10 text-white"><i data-lucide="refresh-cw" class="w-4 h-4 inline"></i></button></div>' +
            '<div class="max-h-[46vh] overflow-y-auto px-4 pb-4">' + (songs.length ? songs.map(function (song, i) { return '<button type="button" onclick="Blend.play(' + i + ')" class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 text-left"><img alt="' + esc(song.title || 'Artwork lagu') + '" src="' + (typeof safeMediaUrl === 'function' ? safeMediaUrl(song.cover || (typeof FI !== 'undefined' ? FI : ''), typeof FI !== 'undefined' ? FI : '') : (song.cover || '')) + '" class="w-11 h-11 rounded-lg object-cover" onerror="this.src=\'' + (typeof FI !== 'undefined' ? FI : '') + '\'" /><span class="min-w-0 flex-1"><strong class="block text-sm text-white truncate">' + esc(song.title) + '</strong><span class="block text-xs text-white/50 truncate">' + esc(song.artist) + '</span></span></button>'; }).join('') : '<p class="text-center text-sm text-white/50 py-12">Belum ada lagu. Tambahkan lagu dari hasil pencarian.</p>') + '</div></div>';
        document.body.appendChild(m); if (window.lucide) lucide.createIcons();
    }
    window.Blend = {
        close: closeModal,
        create: function (partnerUid, partnerName) { api('create', { method: 'POST', body: { partnerUid: partnerUid } }).then(function (d) { renderRoom(d.room, d.inviteCode); toast('Blend dibuat untuk kamu dan ' + (partnerName || 'temanmu')); }).catch(function (e) { toast(e.message); }); },
        join: function (roomId) { var clean = cleanRoomId(roomId); api('join', { method: 'POST', room: clean, body: { roomId: clean } }).then(function (d) { renderRoom(d.room, clean); toast('Kamu sudah bergabung ke Blend.'); }).catch(function (e) { renderInviteError(clean, e); }); },
        promptJoin: function (roomId) {
            var clean = cleanRoomId(roomId); if (!clean) return;
            api('state', { room: clean }).then(function (d) {
                var room = d.room || {};
                if (room.invited) renderInvitation(room, clean);
                else renderRoom(room, clean);
            }).catch(function (e) {
                if (Number(e.status) === 401) renderLoginRequired(clean); else renderInviteError(clean, e);
            });
        },
        resumePendingInvite: function () {
            var pending = readPendingInvite(); if (!pending) return false;
            setTimeout(function () {
                if (location.pathname !== pending.path) history.pushState({}, '', pending.path);
                window.Blend.promptJoin(pending.room);
            }, 250);
            return true;
        },
        loginFromInvite: function (roomId) { openAuthForInvite(roomId); },
        decline: function () { clearPendingInvite(); closeModal(); toast('Undangan Blend ditutup.'); },
        refresh: function (roomId) { api('state', { room: roomId }).then(function (d) { if (d.room && d.room.invited) renderInvitation(d.room, roomId); else renderRoom(d.room, roomId); }).catch(function (e) { if (Number(e.status) === 401) renderLoginRequired(roomId); else toast(e.message); }); },
        shareInvite: function (code) {
            var clean = cleanRoomId(code); if (!clean) return;
            var url = inviteUrl(clean); var shareData = { title: 'Undangan Blend MalaMusic', text: 'Ayo gabung Blend musikku di MalaMusic.', url: url };
            if (navigator.share) { navigator.share(shareData).then(function () { toast('Link Blend dibagikan.'); }).catch(function (error) { if (!error || error.name !== 'AbortError') Blend.copyInvite(clean); }); return; }
            Blend.copyInvite(clean);
        },
        copyInvite: function (code) {
            var url = inviteUrl(code);
            if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function () { toast('Link undangan Blend disalin.'); }).catch(function () { toast('Salin link ini: ' + url); }); else toast('Salin link ini: ' + url);
        },
        play: function (index) { var songs = state.room && state.room.playlist && state.room.playlist.songs || []; var song = cleanSong(songs[index]); if (!song) return; closeModal(); if (typeof S !== 'undefined') { S.pl = songs; S.pi = index; S.ps = 'blend'; S.ct = song; if (typeof UU === 'function') UU(); if (typeof MP !== 'undefined' && MP.show) MP.show(); S.il = true; if (typeof UB === 'function') UB(); if (typeof resetLyricsUI === 'function') resetLyricsUI(song.videoId); if (typeof loadTrack === 'function') loadTrack(song); } },
        active: function () { return Boolean(state.room && state.room.id); },
        invite: function (partnerUid, partnerName) { if (!state.room) return; api('invite', { method: 'POST', room: state.room.id, body: { roomId: state.room.id, partnerUid: partnerUid } }).then(function (d) { renderRoom(d.room, state.room.id); toast((partnerName || 'Pengguna') + ' diundang ke Blend. Link baru siap dibagikan.'); }).catch(function (e) { toast(e.message); }); },
        addSong: function (song) { if (!state.room) return; api('add', { method: 'POST', room: state.room.id, body: { roomId: state.room.id, song: song } }).then(function (d) { state.room = d.room; toast('Lagu ditambahkan ke Blend.'); }).catch(function (e) { toast(e.message); }); },
        openFromUser: function (uid, name) { if (Blend.active()) { var inviteText = 'Undang ' + (name || 'pengguna ini') + ' ke Blend yang sedang aktif?'; if (window.confirm && !window.confirm(inviteText)) return; Blend.invite(uid, name); return; } var confirmText = 'Buat Blend dengan ' + (name || 'pengguna ini') + '?'; if (window.confirm && !window.confirm(confirmText)) return; Blend.create(uid, name); }
    };
}());
