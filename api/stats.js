const crypto = require('crypto');
const { getDatabase } = require('./firebase-admin.js');

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
    const source = String(currentUser.uid || currentUser.email || '').trim().toLowerCase();
    return crypto.createHash('sha256').update(source).digest('hex').slice(0, 40);
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
async function localMe(currentUser) {
    const snapshot = await localRoot().child('stats').child(userKey(currentUser)).get();
    const stats = normalizeStats(snapshot.exists() ? snapshot.val() : null, currentUser);
    return { status: true, stats: publicStats(stats) };
}
async function localListen(currentUser, seconds) {
    const ref = localRoot().child('stats').child(userKey(currentUser));
    const snapshot = await ref.get();
    const stats = normalizeStats(snapshot.exists() ? snapshot.val() : null, currentUser);
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
        if (action === 'me') return res.status(200).json(await withLocalFallback(() => workerCall('/me', { method: 'POST', body: JSON.stringify({ email: currentUser.email }) }), () => localMe(currentUser)));
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

module.exports._test = { dateKey, previousDateKey, validatePlaylist, publicStats };

// Local fallback uses Firebase Admin only when the external statistics worker is unavailable.
// No client credential or private key is exposed by this module.
