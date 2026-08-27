const crypto = require('crypto');
const { getDatabase } = require('./firebase-admin.js');
const streakHelpers = require('./streak.js')._test;

const WORKER_URL = process.env.MALAMUSIC_STATS_WORKER_URL || 'https://malamusic-stats.daffaheroik2020.workers.dev';
const WORKER_SECRET = String(process.env.MALAMUSIC_INTERNAL_SECRET || '').trim();
const LOCAL_ROOT = 'malamusic';

function secret() { return process.env.SESSION_SECRET || ''; }
function decode(value) {
    if (!value || !value.includes('.') || !secret()) return null;
    const [body, signature] = value.split('.', 2);
    const expected = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
    if (!signature || signature.length !== expected.length) return null;
    try {
        if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
        return JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    } catch (_) { return null; }
}
function cookies(req) {
    return String(req.headers.cookie || '').split(';').reduce((out, item) => {
        const i = item.indexOf('=');
        if (i > -1) out[item.slice(0, i).trim()] = decodeURIComponent(item.slice(i + 1).trim());
        return out;
    }, {});
}
function user(req) {
    const u = decode(cookies(req).mm_session);
    return u && u.email && u.exp > Date.now() ? u : null;
}
function legacyStreak(req, currentUser) {
    const value = decode(cookies(req).mm_streak);
    if (!value || String(value.email || '').toLowerCase() !== String(currentUser.email || '').toLowerCase() || !Array.isArray(value.dates)) return null;
    const dates = value.dates.filter(day => /^\d{4}-\d{2}-\d{2}$/.test(String(day))).slice(-180);
    if (!dates.length) return null;
    return { dates, ...streakHelpers.calculate(dates) };
}
function applyLegacyStreak(result, legacy) {
    if (!legacy || !result || !result.stats) return result;
    const stats = result.stats;
    const recent = legacy.lastActive === dateKey() || legacy.lastActive === previousDateKey(dateKey());
    result.stats = { ...stats,
        activeDays: Math.max(Number(stats.activeDays || 0), Number(legacy.activeDays || 0)),
        bestStreak: Math.max(Number(stats.bestStreak || 0), Number(legacy.best || 0)),
        streak: recent ? Math.max(Number(stats.streak || 0), Number(legacy.current || 0)) : Number(stats.streak || 0)
    };
    return result;
}
function body(req) { return req.body && typeof req.body === 'object' ? req.body : {}; }
function dateKey() {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Makassar' }).format(new Date());
}
function previousDateKey(value) {
    const date = new Date(`${value}T12:00:00+08:00`);
    date.setUTCDate(date.getUTCDate() - 1);
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Makassar' }).format(date);
}
function userKey(currentUser) {
    const source = String(currentUser.email || currentUser.uid || '').trim().toLowerCase();
    return crypto.createHash('sha256').update(source).digest('hex').slice(0, 40);
}
function legacyUserKey(currentUser) {
    const email = String(currentUser.email || '').trim().toLowerCase();
    const uid = String(currentUser.uid || '').trim().toLowerCase();
    if (!uid || uid === email) return null;
    return crypto.createHash('sha256').update(uid).digest('hex').slice(0, 40);
}
async function readLocalStats(currentUser) {
    const primaryRef = localRoot().child('stats').child(userKey(currentUser));
    const primarySnap = await primaryRef.get();
    const primary = normalizeStats(primarySnap.exists() ? primarySnap.val() : null, currentUser);
    const fallbackKey = legacyUserKey(currentUser);
    if (!fallbackKey) return { ref: primaryRef, stats: primary, migrated: false };
    const fallbackSnap = await localRoot().child('stats').child(fallbackKey).get();
    if (!fallbackSnap.exists()) return { ref: primaryRef, stats: primary, migrated: false };
    const fallback = normalizeStats(fallbackSnap.val(), currentUser);
    const merged = { ...primary,
        totalSeconds: Math.max(primary.totalSeconds, fallback.totalSeconds),
        activeDays: Math.max(primary.activeDays, fallback.activeDays),
        currentStreak: Math.max(primary.currentStreak, fallback.currentStreak),
        bestStreak: Math.max(primary.bestStreak, fallback.bestStreak),
        lastListenDate: primary.lastListenDate > fallback.lastListenDate ? primary.lastListenDate : fallback.lastListenDate
    };
    return { ref: primaryRef, stats: merged, migrated: !primarySnap.exists() || JSON.stringify(primary) !== JSON.stringify(merged) };
}
function cleanName(value, fallback) { return String(value || fallback || 'Pengguna').trim().slice(0, 80); }
function normalizeStats(value, currentUser) {
    const data = value && typeof value === 'object' ? value : {};
    return {
        uid: String(data.uid || currentUser.uid || '').slice(0, 160),
        email: String(data.email || currentUser.email || '').toLowerCase().slice(0, 180),
        name: cleanName(data.name, currentUser.name),
        totalSeconds: Math.max(0, Number(data.totalSeconds || 0)),
        activeDays: Math.max(0, Number(data.activeDays || 0)),
        currentStreak: Math.max(0, Number(data.currentStreak || 0)),
        bestStreak: Math.max(0, Number(data.bestStreak || 0)),
        lastListenDate: String(data.lastListenDate || '')
    };
}
function publicStats(data) {
    const value = data || {};
    return {
        name: cleanName(value.name, 'Pengguna'),
        hours: Number((Math.max(0, Number(value.totalSeconds || 0)) / 3600).toFixed(1)),
        totalSeconds: Math.max(0, Number(value.totalSeconds || 0)),
        activeDays: Math.max(0, Number(value.activeDays || 0)),
        streak: Math.max(0, Number(value.currentStreak || 0)),
        bestStreak: Math.max(0, Number(value.bestStreak || 0))
    };
}
function localRoot() { return getDatabase().ref(LOCAL_ROOT); }
async function localMe(currentUser, legacy, includeMeta) {
    const local = await readLocalStats(currentUser);
    const ref = local.ref;
    const stats = local.stats;
    if (legacy) {
        stats.activeDays = Math.max(stats.activeDays, Number(legacy.activeDays || 0));
        stats.bestStreak = Math.max(stats.bestStreak, Number(legacy.best || 0));
        const recent = legacy.lastActive === dateKey() || legacy.lastActive === previousDateKey(dateKey());
        if (recent) stats.currentStreak = Math.max(stats.currentStreak, Number(legacy.current || 0));
        if (legacy.lastActive && (!stats.lastListenDate || legacy.lastActive > stats.lastListenDate)) stats.lastListenDate = legacy.lastActive;
        stats.updatedAt = Date.now();
        await ref.set(stats);
    } else if (local.migrated) {
        await ref.set(stats);
    }
    const result = { status: true, stats: publicStats(stats) };
    if (includeMeta) result.lastListenDate = stats.lastListenDate || null;
    return result;
}
function mergeStatsMirror(result, mirror) {
    if (!result || !result.stats || !mirror || !mirror.stats) return result;
    const remote = result.stats;
    const local = mirror.stats;
    const remoteSeconds = Number.isFinite(Number(remote.totalSeconds)) && Number(remote.totalSeconds) > 0 ? Number(remote.totalSeconds) : Math.max(0, Number(remote.hours || 0) * 3600);
    const localSeconds = Math.max(0, Number(local.totalSeconds || 0));
    const totalSeconds = Math.max(remoteSeconds, localSeconds);
    const mirrorRecent = mirror.lastListenDate === dateKey() || mirror.lastListenDate === previousDateKey(dateKey());
    result.stats = { ...remote,
        hours: Number((totalSeconds / 3600).toFixed(1)),
        totalSeconds,
        activeDays: Math.max(Number(remote.activeDays || 0), Number(local.activeDays || 0)),
        bestStreak: Math.max(Number(remote.bestStreak || 0), Number(local.bestStreak || 0)),
        streak: mirrorRecent ? Math.max(Number(remote.streak || 0), Number(local.streak || 0)) : Number(remote.streak || 0)
    };
    return result;
}
async function localListen(currentUser, seconds) {
    const local = await readLocalStats(currentUser);
    const ref = local.ref;
    const stats = local.stats;
    const today = dateKey();
    if (stats.lastListenDate !== today) {
        stats.activeDays += 1;
        stats.currentStreak = stats.lastListenDate === previousDateKey(today) ? stats.currentStreak + 1 : 1;
        stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
        stats.lastListenDate = today;
    }
    stats.totalSeconds += seconds;
    stats.updatedAt = Date.now();
    await ref.set(stats);
    return { status: true, stats: publicStats(stats) };
}
async function localLeaderboard() {
    const snapshot = await localRoot().child('stats').orderByChild('totalSeconds').limitToLast(100).get();
    const rows = [];
    snapshot.forEach(child => rows.push({ id: child.key, ...publicStats(child.val()) }));
    rows.sort((a, b) => b.totalSeconds - a.totalSeconds);
    return { status: true, updatedAt: new Date().toISOString(), leaderboard: rows.map((row, index) => ({ rank: index + 1, ...row })) };
}
function validatePlaylist(data) {
    const id = String(data.id || '').trim();
    if (!/^[A-Za-z0-9_-]{3,120}$/.test(id)) throw new Error('ID playlist publik tidak valid.');
    const songs = Array.isArray(data.songs) ? data.songs.slice(0, 500).map(song => ({
        id: String(song.id || song.videoId || '').slice(0, 120),
        videoId: String(song.videoId || song.id || '').slice(0, 120),
        title: String(song.title || '').slice(0, 240),
        artist: String(song.artist || '').slice(0, 180),
        cover: String(song.cover || '').slice(0, 700),
        ytUrl: String(song.ytUrl || '').slice(0, 700)
    })).filter(song => song.id || song.videoId) : [];
    return { id, name: String(data.name || 'Playlist MalaMusic').trim().slice(0, 120), image: String(data.image || '').slice(0, 700), songs, isPublic: data.isPublic !== false };
}
async function localPublicPlaylist(id) {
    const snapshot = await localRoot().child('publicPlaylists').child(id).get();
    if (!snapshot.exists() || snapshot.val().isPublic === false) return { status: false, message: 'Playlist publik tidak ditemukan.' };
    const data = snapshot.val();
    return { status: true, playlist: { id, name: data.name, image: data.image || '', songs: Array.isArray(data.songs) ? data.songs : [], ownerName: data.ownerName || 'Pengguna MalaMusic' } };
}
async function localPublishPlaylist(currentUser, data) {
    const playlist = validatePlaylist(data);
    const ref = localRoot().child('publicPlaylists').child(playlist.id);
    const existing = await ref.get();
    if (existing.exists() && existing.val().ownerKey && existing.val().ownerKey !== userKey(currentUser)) throw new Error('ID playlist sudah digunakan pengguna lain.');
    await ref.set({ ...playlist, ownerKey: userKey(currentUser), ownerName: cleanName(currentUser.name, currentUser.email), updatedAt: Date.now() });
    return { status: true, id: playlist.id, isPublic: playlist.isPublic };
}
function workerHeaders() {
    if (!WORKER_SECRET) throw new Error('MALAMUSIC_INTERNAL_SECRET belum dikonfigurasi.');
    return { 'Content-Type': 'application/json', 'x-malamusic-secret': WORKER_SECRET };
}
async function workerCall(path, options) {
    const response = await fetch(`${WORKER_URL}${path}`, { ...(options || {}), headers: { ...workerHeaders(), ...((options && options.headers) || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Worker statistik gagal.');
    return data;
}
async function withLocalFallback(workerOperation, localOperation) {
    if (WORKER_SECRET) {
        try { return await workerOperation(); } catch (error) { console.warn('[stats] worker fallback:', error.message); }
    }
    return localOperation();
}

module.exports = async function stats(req, res) {
    try {
        const action = (req.query && req.query.action) || 'leaderboard';
        if (action === 'leaderboard') {
            if (req.method !== 'GET') return res.status(405).json({ status: false, message: 'Method tidak didukung.' });
            const result = await withLocalFallback(() => workerCall('/leaderboard', { method: 'GET' }), localLeaderboard);
            return res.status(200).json(result);
        }
        if (action === 'public-playlist') {
            if (req.method !== 'GET') return res.status(405).json({ status: false, message: 'Method tidak didukung.' });
            const id = String((req.query && req.query.id) || '').trim();
            if (!/^[A-Za-z0-9_-]{3,120}$/.test(id)) return res.status(400).json({ status: false, message: 'ID playlist publik tidak valid.' });
            const result = await withLocalFallback(() => workerCall('/playlist/' + encodeURIComponent(id), { method: 'GET' }), () => localPublicPlaylist(id));
            return res.status(result.status === false ? 404 : 200).json(result);
        }
        const currentUser = user(req);
        if (!currentUser) return res.status(401).json({ status: false, authenticated: false, message: 'Login diperlukan.' });
        if (action === 'me') {
            const legacy = legacyStreak(req, currentUser);
            let mirror = null;
            if (WORKER_SECRET) {
                try { mirror = await localMe(currentUser, legacy, true); } catch (_) {}
            }
            const result = await withLocalFallback(
                () => workerCall('/me', { method: 'POST', body: JSON.stringify({ email: currentUser.email, name: currentUser.name, legacyDates: legacy ? legacy.dates : [] }) }),
                () => mirror || localMe(currentUser, legacy)
            );
            return res.status(200).json(applyLegacyStreak(mergeStatsMirror(result, mirror), legacy));
        }
        if (action === 'listen') {
            if (req.method !== 'POST') return res.status(405).json({ status: false, message: 'Method tidak didukung.' });
            const requestedSeconds = Number(body(req).seconds);
            if (!Number.isFinite(requestedSeconds) || requestedSeconds <= 0) return res.status(400).json({ status: false, message: 'Durasi tidak valid.' });
            const seconds = Math.min(120, Math.floor(requestedSeconds));
            if (seconds < 1) return res.status(400).json({ status: false, message: 'Durasi terlalu kecil.' });
            return res.status(200).json(await withLocalFallback(() => workerCall('/listen', { method: 'POST', body: JSON.stringify({ email: currentUser.email, name: currentUser.name, seconds }) }), () => localListen(currentUser, seconds)));
        }
        if (action === 'publish-playlist') {
            if (req.method !== 'POST') return res.status(405).json({ status: false, message: 'Method tidak didukung.' });
            const data = body(req);
            return res.status(200).json(await withLocalFallback(() => workerCall('/playlist', { method: 'POST', body: JSON.stringify({ ...data, email: currentUser.email, ownerName: currentUser.name }) }), () => localPublishPlaylist(currentUser, data)));
        }
        if (action === 'rollover') {
            const authorization = String(req.headers.authorization || '');
            if (!process.env.CRON_SECRET || authorization !== `Bearer ${process.env.CRON_SECRET}`) return res.status(401).json({ status: false, message: 'Unauthorized cron request.' });
            return res.status(200).json(await withLocalFallback(() => workerCall('/rollover', { method: 'POST' }), async () => ({ status: true, fallback: true })));
        }
        return res.status(404).json({ status: false, message: 'Aksi statistik tidak ditemukan.' });
    } catch (error) {
        console.error('stats error', error);
        return res.status(503).json({ status: false, message: 'Statistik sementara belum tersedia.' });
    }
};

module.exports._test = { dateKey, previousDateKey, validatePlaylist, publicStats, legacyStreak, applyLegacyStreak, mergeStatsMirror };

// Local fallback uses Firebase Admin only when the external statistics worker is unavailable.
// No client credential or private key is exposed by this module.
