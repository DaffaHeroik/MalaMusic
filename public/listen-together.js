(function () {
    'use strict';
    var state = {
        roomId: '', role: '', room: null, timer: null, syncTimer: null, lastVersion: 0,
        applying: false, allowRemoteUntil: 0, awaitingGesture: false, pollDelay: 1500,
        publishTimer: null, modal: null, joinPending: false, blockedNoticeAt: 0
    };

    function el(tag, props, children) {
        var node = document.createElement(tag);
        Object.keys(props || {}).forEach(function (key) { node[key] = props[key]; });
        (children || []).forEach(function (child) { node.appendChild(child); });
        return node;
    }
    function jsonFetch(url, options) {
        options = options || {};
        options.credentials = 'same-origin';
        options.headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
        var controller = new AbortController();
        var timeout = setTimeout(function () { controller.abort(); }, 15000);
        options.signal = controller.signal;
        return fetch(url, options).then(function (r) {
            return r.json().catch(function () { return {}; }).then(function (data) {
                if (!r.ok) throw new Error(data.message || 'Request room gagal');
                return data;
            });
        }).catch(function (error) {
            if (error && error.name === 'AbortError') throw new Error('Room terlalu lama merespons. Coba lagi.');
            throw error;
        }).finally(function () { clearTimeout(timeout); });
    }
    function roomUrl(id) { return location.origin + '/room/' + encodeURIComponent(id); }
    function currentTrack() { return typeof S !== 'undefined' && S.ct ? normalizeTrack(S.ct) : null; }
    function currentQueue() {
        return typeof S !== 'undefined' && Array.isArray(S.pl) ? S.pl.map(normalizeTrack).filter(function (x) { return trackId(x); }).slice(0, 50) : [];
    }
    function isHost() { return state.role === 'host'; }
    function isRemoteApplying() { return state.applying || Date.now() < Number(state.allowRemoteUntil || 0); }
    function showToastSafe(text) { if (typeof showToast === 'function') showToast(text); else console.log(text); }
    function showFollowerNotice() {
        var now = Date.now();
        if (now - state.blockedNoticeAt < 2500) return;
        state.blockedNoticeAt = now;
        showToastSafe('Host mengontrol pemutaran room ini.');
    }
    function remotePosition(remote) {
        var position = Number(remote && remote.position || 0);
        if (remote && remote.playing && remote.changedAt) position += Math.max(0, Date.now() - Number(remote.changedAt)) / 1000;
        return Math.max(0, Math.min(position, 86400));
    }
    function enforceRemotePlayback() {
        if (!state.roomId || isHost() || typeof AU === 'undefined' || !AU) return;
        var remote = state.room && state.room.state || {};
        var target = remotePosition(remote);
        if (isFinite(target) && AU.readyState >= 1 && Math.abs((AU.currentTime || 0) - target) > 1.5) {
            try { AU.currentTime = target; } catch (_) {}
        }
        if (remote.playing) {
            if (AU.paused) {
                AU.play().then(function () { state.awaitingGesture = false; }).catch(function () { state.awaitingGesture = true; renderRoomStatus('Ketuk halaman sekali untuk mengaktifkan audio peserta.'); });
            }
        } else if (!AU.paused) {
            try { AU.pause(); } catch (_) {}
        }
    }
    function retryRemotePlayback() {
        if (state.roomId && !isHost() && state.room && state.room.state && state.room.state.playing && typeof AU !== 'undefined' && AU && AU.paused) enforceRemotePlayback();
    }
    function renderRoomStatus(text) {
        var badge = document.getElementById('listen-together-badge');
        if (badge && text) badge.title = text;
    }
    function escapeText(value) {
        return String(value || '').replace(/[&<>"']/g, function (char) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]; });
    }
    function participantsMarkup(room) {
        var participants = room && Array.isArray(room.participants) ? room.participants : [];
        if (!participants.length) return '<p class="text-xs text-white/45">Belum ada peserta aktif.</p>';
        return participants.map(function (participant) {
            return '<div class="flex items-center gap-2 py-1.5"><span class="w-2 h-2 rounded-full ' + (participant.online === false ? 'bg-white/25' : 'bg-emerald-300') + '"></span><span class="min-w-0 flex-1 truncate text-xs text-white/80">' + escapeText(participant.name || 'Peserta') + '</span>' + (participant.host ? '<span class="text-[10px] font-black uppercase tracking-wider text-emerald-300">Host</span>' : '') + '</div>';
        }).join('');
    }

    function ensureLauncher() {
        if (document.getElementById('listen-together-launcher')) return;
        var sidebar = document.querySelector('.spotify-sidebar');
        if (!sidebar) {
            window.setTimeout(ensureLauncher, 80);
            return;
        }
        var section = el('div', { className: 'spotify-nav-section listen-together-section' });
        section.innerHTML = '<div class="spotify-section-label">Sosial</div><button id="listen-together-launcher" class="spotify-nav-item listen-together-nav-item" aria-label="Dengarkan bersama teman — buat atau gabung room" title="Dengarkan bersama teman: buat atau gabung room"><i data-lucide="headphones"></i><span>Dengar bersama</span></button>';
        var button = section.querySelector('#listen-together-launcher');
        button.onclick = openLobby;
        var user = sidebar.querySelector('.spotify-user');
        sidebar.insertBefore(section, user || null);
        sidebar.classList.add('has-social-nav');
        if (window.lucide && typeof lucide.createIcons === 'function') lucide.createIcons();
    }
    function openLobby() {
        closeModal();
        var modal = el('div', { className: 'fixed inset-0 z-[500] flex items-end sm:items-center justify-center bg-black/75 px-0 sm:px-4' });
        modal.innerHTML = '<div class="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-[#15151b] border border-white/10 p-5 shadow-2xl">' +
            '<div class="flex items-center justify-between mb-5"><div><p class="text-[10px] uppercase tracking-widest text-emerald-300 font-black">Listen Together</p><h2 class="text-xl font-black text-white mt-1">Dengarkan bersama teman</h2></div><button id="lt-close" class="w-9 h-9 rounded-full bg-white/10 text-white">×</button></div>' +
            '<p class="text-sm text-white/60 mb-4">Buat room dari lagu yang sedang diputar, atau masuk menggunakan kode room teman. Login diperlukan untuk menyimpan dan mengontrol room.</p>' +
            '<button id="lt-create" class="w-full rounded-2xl bg-emerald-400 text-black py-3.5 font-black mb-3">Buat Room dari Lagu Sekarang</button>' +
            '<div class="flex items-center gap-3 my-4"><div class="h-px bg-white/10 flex-1"></div><span class="text-xs text-white/40">atau</span><div class="h-px bg-white/10 flex-1"></div></div>' +
            '<input id="lt-room-input" class="w-full rounded-2xl bg-white/10 border border-white/10 text-white px-4 py-3 outline-none uppercase tracking-widest" placeholder="KODE ROOM" maxlength="16" />' +
            '<button id="lt-join" class="w-full rounded-2xl bg-white/10 border border-white/15 text-white py-3.5 font-black mt-3">Masuk ke Room</button>' +
            '<p class="text-[11px] text-white/40 mt-4 text-center">Semua peserta tetap memutar audio di perangkat masing-masing.</p></div>';
        document.body.appendChild(modal); state.modal = modal;
        modal.querySelector('#lt-close').onclick = closeModal;
        modal.querySelector('#lt-create').onclick = createRoom;
        modal.querySelector('#lt-join').onclick = function () { joinRoom(modal.querySelector('#lt-room-input').value); };
        modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    }
    function closeModal() { if (state.modal) state.modal.remove(); state.modal = null; }
    function setPending(button, label) {
        if (!button) return;
        button.disabled = true; button.dataset.previousLabel = button.textContent; button.textContent = label; button.classList.add('opacity-60', 'cursor-wait');
    }
    function clearPending(button) {
        if (!button) return;
        button.disabled = false; button.textContent = button.dataset.previousLabel || button.textContent; button.classList.remove('opacity-60', 'cursor-wait');
    }
    function createRoom() {
        var track = currentTrack();
        if (!track) { showToastSafe('Putar lagu terlebih dahulu.'); return; }
        var button = state.modal && state.modal.querySelector('#lt-create');
        if (state.joinPending) return;
        state.joinPending = true; setPending(button, 'Membuat room...');
        jsonFetch('/api/listen-together?action=create', { method: 'POST', body: JSON.stringify({ track: track, queue: currentQueue().length ? currentQueue() : [track], index: Number(S.pi) || 0 }) })
            .then(function (data) { activate(data.room, data.role); showRoomPanel(); showToastSafe('Room berhasil dibuat.'); })
            .catch(function (e) { state.joinPending = false; clearPending(button); showToastSafe(e.message); });
    }
    function joinRoom(id) {
        id = String(id || '').trim().toUpperCase();
        if (!id) { showToastSafe('Masukkan kode room.'); return; }
        if (state.joinPending) return;
        var button = state.modal && state.modal.querySelector('#lt-join');
        state.joinPending = true; setPending(button, 'Menghubungkan...');
        jsonFetch('/api/listen-together?action=join', { method: 'POST', body: JSON.stringify({ roomId: id }) })
            .then(function (data) { activate(data.room, data.role); closeModal(); showRoomPanel(); showToastSafe('Berhasil masuk ke room.'); })
            .catch(function (e) { state.joinPending = false; clearPending(button); showToastSafe(e.message); });
    }
    function activate(room, role) {
        state.roomId = room.id; state.room = room; state.role = role || 'listener'; state.lastVersion = 0; state.joinPending = false; state.awaitingGesture = false;
        history.pushState({}, '', '/room/' + encodeURIComponent(room.id));
        applyRoom(room, true); startPolling();
    }
    function startPolling() {
        if (state.timer) clearTimeout(state.timer);
        if (state.syncTimer) clearInterval(state.syncTimer);
        state.syncTimer = setInterval(enforceRemotePlayback, 1000);
        var loop = function() { if (!state.roomId) return; state.pollDelay = document.hidden ? 5000 : 1500; Promise.resolve(poll()).finally(function(){ if (state.roomId) state.timer = setTimeout(loop, state.pollDelay); }); };
        loop();
    }
    function stopPolling() {
        if (state.timer) clearTimeout(state.timer);
        if (state.syncTimer) clearInterval(state.syncTimer);
        state.timer = null; state.syncTimer = null;
    }
    function poll() {
        if (!state.roomId) return Promise.resolve();
        return jsonFetch('/api/listen-together?action=state&room=' + encodeURIComponent(state.roomId), { method: 'GET', headers: {} })
            .then(function (data) { if (data.room) applyRoom(data.room, false); })
            .catch(function (e) { if (/tidak ditemukan|kedaluwarsa/i.test(e.message)) { stopPolling(); state.roomId = ''; showToastSafe('Room sudah berakhir.'); } });
    }
    function applyRoom(room, force) {
        var remote = room.state || {};
        var version = Number(remote.version || 0);
        if (!force && version <= state.lastVersion) {
            state.room = room;
            renderRoomBadge(room);
            return;
        }
        state.lastVersion = version; state.room = room;
        var queue = Array.isArray(remote.queue) ? remote.queue.map(normalizeTrack).filter(function (x) { return trackId(x); }) : [];
        var remoteTrack = normalizeTrack(remote.track || queue[Number(remote.index) || 0]);
        if (!trackId(remoteTrack)) return;
        state.applying = true;
        state.allowRemoteUntil = Date.now() + 8000;
        try {
            var localId = currentTrack() && trackId(currentTrack());
            if (localId !== trackId(remoteTrack)) {
                S.pl = queue.length ? queue : [remoteTrack];
                S.pi = Math.min(Math.max(Number(remote.index) || 0, 0), S.pl.length - 1);
                S.ps = 'listen-together';
                S.ct = S.pl[S.pi] || remoteTrack;
                UU(); MP.show(); S.il = true; UB();
                resetLyricsUI(trackId(S.ct)); loadTrack(S.ct);
            } else if (typeof AU !== 'undefined' && AU && isFinite(Number(remote.position)) && Math.abs((AU.currentTime || 0) - remotePosition(remote)) > 1.5) {
                if (AU.readyState >= 1) AU.currentTime = remotePosition(remote);
            }
        } finally { state.applying = false; }
        renderRoomBadge(room);
        setTimeout(enforceRemotePlayback, 250);
    }
    function schedulePublish() {
        if (!state.roomId || !isHost() || state.applying) return;
        clearTimeout(state.publishTimer);
        state.publishTimer = setTimeout(publishState, 120);
    }
    function publishState() {
        if (!state.roomId || !isHost() || state.applying || typeof S === 'undefined') return;
        var track = currentTrack(); if (!track) return;
        jsonFetch('/api/listen-together?action=command', { method: 'POST', body: JSON.stringify({ roomId: state.roomId, expectedVersion: Number(state.lastVersion || 0), queue: currentQueue().length ? currentQueue() : [track], index: Number(S.pi) || 0, track: track, playing: !!(typeof AU !== 'undefined' && AU && !AU.paused), position: Number((typeof AU !== 'undefined' && AU ? AU.currentTime : S.pt) || 0) }) })
            .then(function (data) { if (data.room) { state.lastVersion = Number(data.room.state.version || state.lastVersion); renderRoomBadge(data.room); } })
            .catch(function (e) { if (e && /sudah berubah|sinkronkan ulang/i.test(e.message)) poll(); });
    }
    function renderRoomBadge(room) {
        var badge = document.getElementById('listen-together-badge');
        if (!badge) {
            badge = el('button', { id: 'listen-together-badge', className: 'fixed left-4 bottom-28 z-[280] rounded-full bg-emerald-400/15 border border-emerald-300/40 text-emerald-200 px-3 py-2 text-[11px] font-black backdrop-blur-xl' });
            document.body.appendChild(badge);
        }
        badge.textContent = '● Room ' + room.id + ' · ' + Math.max(1, Number(room.members || 1)) + ' peserta' + (isHost() ? ' · Host' : ' · Mengikuti');
        badge.onclick = showRoomPanel;
    }
    function showRoomPanel() {
        if (!state.roomId) return openLobby();
        closeModal();
        var modal = el('div', { className: 'fixed inset-0 z-[500] flex items-end sm:items-center justify-center bg-black/75 px-0 sm:px-4' });
        var room = state.room || {};
        modal.innerHTML = '<div class="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-[#15151b] border border-white/10 p-5 shadow-2xl"><div class="flex items-center justify-between"><div><p class="text-[10px] uppercase tracking-widest text-emerald-300 font-black">Room aktif</p><h2 class="text-xl font-black text-white mt-1">' + state.roomId + '</h2></div><button id="lt-panel-close" class="w-9 h-9 rounded-full bg-white/10 text-white">×</button></div><p class="text-sm text-white/60 mt-4">Bagikan link ini kepada teman:</p><div class="flex gap-2 mt-2"><input readonly class="min-w-0 flex-1 rounded-xl bg-white/10 text-white text-xs px-3" value="' + roomUrl(state.roomId) + '" /><button id="lt-copy" class="rounded-xl bg-white/10 px-3 text-white text-xs font-bold">Salin</button></div><div class="mt-4 rounded-2xl bg-white/[.04] border border-white/10 px-3 py-2"><div class="flex items-center justify-between mb-1"><span class="text-xs font-bold text-white">Peserta</span><span class="text-[10px] text-emerald-300">' + Math.max(0, Number(room.members || 0)) + ' online</span></div>' + participantsMarkup(room) + '</div><p class="text-xs text-white/45 mt-4">' + (isHost() ? 'Kamu adalah host. Kontrol pemutaranmu akan diikuti peserta lain.' : 'Kamu sedang mengikuti pemutaran host. Play, pause, next, previous, dan seek dikendalikan host.') + '</p><button id="lt-leave" class="w-full rounded-2xl bg-rose-500/15 border border-rose-400/30 text-rose-200 py-3.5 font-black mt-5">Keluar dari Room</button></div>';
        document.body.appendChild(modal); state.modal = modal;
        modal.querySelector('#lt-panel-close').onclick = closeModal;
        modal.querySelector('#lt-copy').onclick = function () { navigator.clipboard.writeText(roomUrl(state.roomId)).then(function () { showToastSafe('Link room disalin.'); }); };
        modal.querySelector('#lt-leave').onclick = leaveRoom;
    }
    function leaveRoom() {
        var id = state.roomId;
        stopPolling(); state.roomId = ''; state.role = ''; state.room = null; state.lastVersion = 0; state.allowRemoteUntil = 0; state.awaitingGesture = false; state.joinPending = false;
        var badge = document.getElementById('listen-together-badge'); if (badge) badge.remove();
        closeModal();
        if (id) jsonFetch('/api/listen-together?action=leave', { method: 'POST', body: JSON.stringify({ roomId: id }) }).catch(function () {});
        showToastSafe('Keluar dari room.');
    }
    function installHooks() {
        if (window.__listenTogetherHooks) return;
        window.__listenTogetherHooks = true;
        ['play', 'pause', 'seeked', 'ended'].forEach(function (eventName) {
            if (typeof AU !== 'undefined' && AU) AU.addEventListener(eventName, function () {
                if (state.roomId && !isHost() && !isRemoteApplying()) enforceRemotePlayback();
                else schedulePublish();
            });
        });
        ['PK', 'TP', 'NX', 'PV', 'SK'].forEach(function (name) {
            if (typeof window[name] !== 'function') return;
            var original = window[name];
            window[name] = function () {
                if (state.roomId && !isHost() && !isRemoteApplying()) { showFollowerNotice(); enforceRemotePlayback(); return; }
                var result = original.apply(this, arguments);
                schedulePublish();
                return result;
            };
        });
        document.addEventListener('pointerdown', retryRemotePlayback, { passive: true });
    }
    function boot() {
        ensureLauncher(); installHooks();
        var match = location.pathname.match(/^\/room\/([A-Za-z0-9_-]+)/);
        if (match) setTimeout(function () { joinRoom(match[1]); }, 700);
    }
    window.ListenTogether = { open: openLobby, leave: leaveRoom, syncNow: schedulePublish, getState: function () { return Object.assign({}, state); } };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
