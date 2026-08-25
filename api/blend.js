'use strict';

const crypto = require('crypto');
const { getDatabase, getAuth } = require('./firebase-admin.js');

const MAX_SONGS = 50;
const ROOM_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function secret() { return process.env.SESSION_SECRET || (process.env.NODE_ENV === 'production' ? null : 'development-only-change-this-session-secret'); }
function decode(value) {
    if (!value || !value.includes('.') || !secret()) return null;
    const parts = value.split('.'); const signature = parts.pop(); const body = parts.join('.');
    const expected = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
    if (signature.length !== expected.length) return null;
    try { if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null; const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); return payload && payload.uid && payload.exp > Date.now() ? payload : null; } catch (_) { return null; }
}
function currentUser(req) {
    const raw = req.headers && (req.headers.cookie || req.headers.Cookie) || '';
    const cookies = raw.split(';').reduce((out, part) => { const i = part.indexOf('='); if (i >= 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim()); return out; }, {});
    return decode(cookies.mm_session);
}
function bodyOf(req) { if (req.body && typeof req.body === 'object') return req.body; try { return JSON.parse(req.body || '{}'); } catch (_) { return {}; } }
function text(value, fallback, max) { return String(value || fallback || '').replace(/[<>]/g, '').trim().slice(0, max); }
function responseError(res, status, message) { return res.status(status).json({ status: false, message }); }
function roomId() { return crypto.randomBytes(5).toString('hex').toUpperCase(); }
function roomRef(id) { return getDatabase().ref(`blendRooms/${id}`); }
function track(raw) {
    raw = raw || {}; const id = text(raw.videoId || raw.id || raw.video_id, '', 120); if (!id) return null;
    return { id, videoId: id, title: text(raw.title, 'Lagu', 180), artist: text(raw.artist, 'MalaMusic', 120), cover: text(raw.cover || raw.thumbnail, '', 700), ytUrl: text(raw.ytUrl || raw.url, `https://youtube.com/watch?v=${id}`, 700) };
}
function cleanSongs(songs) { const seen = new Set(); return (Array.isArray(songs) ? songs : []).map(track).filter(item => item && !seen.has(item.videoId) && seen.add(item.videoId)).slice(0, MAX_SONGS); }
function publicMember(member) { return { uid: text(member.uid, '', 180), name: text(member.name, 'Pendengar', 80), role: member.role === 'owner' ? 'owner' : 'member', joinedAt: Number(member.joinedAt || 0) }; }
function publicRoom(room, user) {
    const members = Object.values(room.members || {}).filter(m => m.status === 'active').map(publicMember);
    return { id: room.id, status: room.status, title: room.title, createdAt: room.createdAt, updatedAt: room.updatedAt, members, invited: room.invitedUid === user.uid && !members.some(m => m.uid === user.uid), playlist: { id: room.id, name: room.title, songs: cleanSongs(room.songs), updatedAt: room.updatedAt }, canEdit: Boolean(room.members && room.members[user.uid] && room.members[user.uid].status === 'active') };
}
async function account(db, uid) {
    const snap = await db.ref(`userProfiles/${uid}`).once('value'); const profile = snap.val() || {};
    if (profile.publicSearch === false) return null;
    let authUser = null; try { authUser = await getAuth().getUser(uid); } catch (_) {}
    if (!snap.exists() && !authUser) return null;
    return { uid, name: text(profile.name || (authUser && authUser.displayName), 'Pendengar MalaMusic', 80) };
}
async function library(db, uid) { const snap = await db.ref(`userLibraries/${uid}`).once('value'); return snap.val() || {}; }
function buildBlend(libraries, names) {
    const map = new Map();
    Object.keys(libraries).forEach((uid, index) => {
        const lib = libraries[uid] || {}; const add = (raw, weight, source) => { const item = track(raw); if (!item) return; const key = item.videoId; const row = map.get(key) || { ...item, score: 0, sources: {} }; row.score += weight; row.sources[uid] = (row.sources[uid] || 0) + weight; map.set(key, row); };
        (Array.isArray(lib.likedSongs) ? lib.likedSongs : []).forEach(song => add(song, 7, 'like'));
        (Array.isArray(lib.playlists) ? lib.playlists : []).forEach(pl => { if (pl && pl.isPublic !== false) (Array.isArray(pl.songs) ? pl.songs : []).forEach(song => add(song, 2, 'playlist')); });
    });
    return Array.from(map.values()).map(row => { const owners = Object.keys(row.sources); const shared = owners.length > 1; return { ...row, score: row.score + (shared ? 12 : 0), reason: shared ? 'Disukai atau muncul di koleksi kalian berdua' : `Relevan dengan selera ${names[owners[0]] || 'anggota Blend'}` }; }).sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, MAX_SONGS).map(({ score, sources, ...song }) => song);
}

module.exports = async function blend(req, res) {
    if (req.method === 'OPTIONS') return res.status(200).send('OK');
    const user = currentUser(req); if (!user) return responseError(res, 401, 'Login diperlukan untuk Blend.');
    const method = req.method || 'GET'; const query = req.query || {}; const body = bodyOf(req); const action = text(query.action || body.action, 'state', 30).toLowerCase();
    try {
        const db = getDatabase();
        if (action === 'create' && method === 'POST') {
            const partnerUid = text(body.partnerUid, '', 180); if (!partnerUid || partnerUid === user.uid) return responseError(res, 400, 'Pilih pengguna lain untuk membuat Blend.');
            const partner = await account(db, partnerUid); if (!partner) return responseError(res, 404, 'Profil pengguna tidak tersedia untuk Blend.');
            const owner = { uid: user.uid, name: text(user.name, user.email && user.email.split('@')[0], 80) }; const id = roomId(); const now = Date.now();
            const libs = { [owner.uid]: await library(db, owner.uid), [partner.uid]: await library(db, partner.uid) }; const names = { [owner.uid]: owner.name, [partner.uid]: partner.name };
            const room = { id, title: `Blend ${owner.name} + ${partner.name}`, ownerUid: owner.uid, invitedUid: partner.uid, status: 'pending', createdAt: now, updatedAt: now, members: { [owner.uid]: { ...owner, role: 'owner', status: 'active', joinedAt: now }, [partner.uid]: { ...partner, role: 'member', status: 'pending', joinedAt: 0 } }, songs: buildBlend(libs, names) };
            await roomRef(id).set(room); return res.status(201).json({ status: true, room: publicRoom(room, user), inviteCode: id });
        }
        const id = text(query.room || query.id || body.roomId || body.room, '', 20).toUpperCase(); if (!id) return responseError(res, 400, 'Kode Blend diperlukan.');
        const ref = roomRef(id); const snap = await ref.once('value'); const room = snap.val(); if (!room) return responseError(res, 404, 'Blend tidak ditemukan.');
        if (room.updatedAt && Date.now() - Number(room.updatedAt) > ROOM_TTL_MS) { await ref.remove(); return responseError(res, 410, 'Blend sudah kedaluwarsa.'); }
        const member = room.members && room.members[user.uid]; const isMember = member && member.status === 'active';
        if (action === 'join' && method === 'POST') {
            if (room.invitedUid !== user.uid && !isMember) return responseError(res, 403, 'Undangan Blend ini bukan untuk akunmu.');
            const now = Date.now(); const update = {}; update[`members/${user.uid}`] = { uid: user.uid, name: text(user.name, user.email && user.email.split('@')[0], 80), role: room.ownerUid === user.uid ? 'owner' : 'member', status: 'active', joinedAt: member && member.joinedAt || now }; update.status = 'active'; update.updatedAt = now; await ref.update(update); room.members[user.uid] = update[`members/${user.uid}`]; room.status = 'active'; room.updatedAt = now; return res.json({ status: true, room: publicRoom(room, user) });
        }
        if (!isMember && action !== 'state') return responseError(res, 403, 'Kamu belum bergabung ke Blend ini.');
        if (action === 'state' && method === 'GET') { if (!isMember && room.invitedUid !== user.uid) return responseError(res, 403, 'Undangan Blend ini bukan untuk akunmu.'); return res.json({ status: true, room: publicRoom(room, user) }); }
        if (action === 'add' && method === 'POST') {
            const song = track(body.song || body.track); if (!song) return responseError(res, 400, 'Lagu tidak valid.'); let committed = false;
            const result = await ref.transaction(current => { if (!current) return current; const songs = cleanSongs(current.songs); if (!songs.some(item => item.videoId === song.videoId)) songs.push(song); committed = true; return { ...current, songs: songs.slice(0, MAX_SONGS), updatedAt: Date.now() }; });
            if (!result.committed) return responseError(res, 409, 'Blend berubah. Coba lagi.'); const updated = result.snapshot.val(); return res.json({ status: true, room: publicRoom(updated, user) });
        }
        if (action === 'invite' && method === 'POST') {
            if (room.ownerUid !== user.uid) return responseError(res, 403, 'Hanya pembuat Blend yang dapat mengundang anggota.'); const inviteUid = text(body.partnerUid, '', 180); if (!inviteUid || inviteUid === user.uid) return responseError(res, 400, 'Pilih pengguna lain untuk diundang.'); const invited = await account(db, inviteUid); if (!invited) return responseError(res, 404, 'Profil pengguna tidak tersedia.'); const update = {}; update[`members/${inviteUid}`] = { ...invited, role: 'member', status: 'pending', joinedAt: 0 }; update.invitedUid = inviteUid; update.status = 'active'; update.updatedAt = Date.now(); await ref.update(update); room.members[inviteUid] = update[`members/${inviteUid}`]; room.invitedUid = inviteUid; room.status = update.status; room.updatedAt = update.updatedAt; return res.json({ status: true, room: publicRoom(room, user), inviteCode: id });
        }
        return responseError(res, 400, 'Action Blend tidak dikenal.');
    } catch (error) { console.error('[blend]', error && error.stack ? error.stack : error); return responseError(res, 503, 'Blend sementara belum tersedia.'); }
};

module.exports._test = { cleanSongs, buildBlend, track };
