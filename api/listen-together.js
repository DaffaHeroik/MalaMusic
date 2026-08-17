const crypto = require('crypto');
const { getDatabase } = require('./firebase-admin.js');

const MAX_QUEUE = 50;
const ROOM_TTL_MS = 12 * 60 * 60 * 1000;
const PRESENCE_TTL_MS = 30 * 1000;

function secret() {
    return process.env.SESSION_SECRET || (process.env.NODE_ENV === 'production' ? null : 'development-only-change-this-session-secret');
}
function decode(value) {
    if (!value || !value.includes('.')) return null;
    const parts = value.split('.');
    const body = parts.shift();
    const signature = parts.join('.');
    const currentSecret = secret();
    if (!currentSecret) return null;
    const expected = crypto.createHmac('sha256', currentSecret).update(body).digest('base64url');
    if (signature.length !== expected.length) return null;
    try {
        if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
        const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
        return payload && payload.exp > Date.now() ? payload : null;
    } catch (_) { return null; }
}
function currentUser(req) {
    const raw = req.headers && (req.headers.cookie || req.headers.Cookie) || '';
    const cookies = raw.split(';').reduce((out, part) => {
        const i = part.indexOf('=');
        if (i >= 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
        return out;
    }, {});
    return decode(cookies.mm_session);
}
function bodyOf(req) {
    if (!req.body) return {};
    if (typeof req.body === 'object') return req.body;
    try { return JSON.parse(req.body); } catch (_) { return {}; }
}
function cleanText(value, max) { return String(value || '').trim().slice(0, max); }
function track(raw) {
    raw = raw || {};
    const id = cleanText(raw.videoId || raw.id || raw.video_id, 80);
    if (!id) return null;
    return {
        id,
        videoId: id,
        title: cleanText(raw.title || 'Lagu', 180) || 'Lagu',
        artist: cleanText(raw.artist || 'MalaMusic', 120) || 'MalaMusic',
        cover: cleanText(raw.cover || raw.thumbnail || '', 600),
        artistId: cleanText(raw.artistId || '', 120),
        ytUrl: cleanText(raw.ytUrl || raw.url || `https://youtube.com/watch?v=${id}`, 600)
    };
}
function cleanQueue(rawQueue) {
    if (!Array.isArray(rawQueue)) return [];
    const seen = new Set();
    return rawQueue.map(track).filter(item => {
        if (!item || seen.has(item.videoId)) return false;
        seen.add(item.videoId);
        return true;
    }).slice(0, MAX_QUEUE);
}
function roomId() { return crypto.randomBytes(4).toString('hex').toUpperCase(); }
function responseError(res, status, message) { return res.status(status).json({ status: false, message }); }
function roomPath(id) { return getDatabase().ref(`listenTogether/rooms/${id}`); }
function presenceSnapshot(room, now) {
    const source = room && room.membersByUid && typeof room.membersByUid === 'object' ? room.membersByUid : {};
    const membersByUid = {};
    const participants = [];
    Object.keys(source).forEach(uid => {
        const member = source[uid] || {};
        const lastSeen = Number(member.lastSeen || 0);
        const online = uid === room.hostUid || (lastSeen > 0 && now - lastSeen <= PRESENCE_TTL_MS);
        if (!online && uid !== room.hostUid) return;
        membersByUid[uid] = { name: cleanText(member.name || 'Peserta', 80), lastSeen };
        participants.push({ uid, name: cleanText(member.name || 'Peserta', 80), host: uid === room.hostUid, online });
    });
    return { membersByUid, participants, members: participants.filter(item => item.online).length };
}
function publicRoom(room) {
    if (!room) return null;
    const presence = presenceSnapshot(room, Date.now());
    return {
        id: room.id,
        host: { name: room.hostName || 'Host', email: room.hostEmail || '' },
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
        members: presence.members,
        participants: presence.participants,
        state: room.state || { queue: [], index: 0, track: null, playing: false, position: 0, changedAt: Date.now(), version: 0 }
    };
}

module.exports = async function listenTogether(req, res) {
    if (req.method === 'OPTIONS') return res.status(200).send('OK');
    const user = currentUser(req);
    if (!user) return responseError(res, 401, 'Login diperlukan untuk Listen Together.');
    const method = req.method || 'GET';
    const query = req.query || {};
    const body = bodyOf(req);
    const action = String(query.action || body.action || '').toLowerCase();

    try {
        if (action === 'create' && method === 'POST') {
            const queue = cleanQueue(body.queue && body.queue.length ? body.queue : [body.track]);
            if (!queue.length) return responseError(res, 400, 'Pilih lagu terlebih dahulu.');
            const index = Math.min(Math.max(Number(body.index) || 0, 0), queue.length - 1);
            const id = roomId();
            const now = Date.now();
            const room = {
                id,
                hostUid: user.uid || '',
                hostEmail: user.email,
                hostName: cleanText(user.name || user.email.split('@')[0], 80),
                createdAt: now,
                updatedAt: now,
                members: 1,
                membersByUid: { [user.uid]: { name: cleanText(user.name || user.email.split('@')[0], 80), lastSeen: now } },
                state: { queue, index, track: queue[index], playing: false, position: 0, changedAt: now, version: 1 }
            };
            await roomPath(id).set(room);
            return res.status(201).json({ status: true, room: publicRoom(room), role: 'host' });
        }

        const id = cleanText(query.room || query.id || body.roomId || body.room, 16).toUpperCase();
        if (!id) return responseError(res, 400, 'Room ID diperlukan.');
        const ref = roomPath(id);
        const snapshot = await ref.once('value');
        const room = snapshot.val();
        if (!room) return responseError(res, 404, 'Room tidak ditemukan atau sudah berakhir.');
        if (room.updatedAt && Date.now() - Number(room.updatedAt) > ROOM_TTL_MS) {
            await ref.remove();
            return responseError(res, 410, 'Room sudah kedaluwarsa.');
        }

        const isHost = room.hostUid === (user.uid || '') && room.hostEmail === user.email;
        if (action === 'join' && method === 'POST') {
            const now = Date.now();
            const presence = presenceSnapshot(room, now);
            presence.membersByUid[user.uid] = { name: cleanText(user.name || user.email.split('@')[0], 80), lastSeen: now };
            const updatedPresence = presenceSnapshot({ ...room, membersByUid: presence.membersByUid }, now);
            await ref.update({ members: Math.min(updatedPresence.members, 100), membersByUid: updatedPresence.membersByUid, updatedAt: now });
            room.members = updatedPresence.members;
            room.membersByUid = updatedPresence.membersByUid;
            room.updatedAt = now;
            return res.json({ status: true, room: publicRoom(room), role: isHost ? 'host' : 'listener' });
        }
        if (action === 'state' && method === 'GET') {
            const now = Date.now();
            const presence = presenceSnapshot(room, now);
            if (presence.membersByUid[user.uid]) presence.membersByUid[user.uid].lastSeen = now;
            const updatedPresence = presenceSnapshot({ ...room, membersByUid: presence.membersByUid }, now);
            await ref.update({ members: Math.min(updatedPresence.members, 100), membersByUid: updatedPresence.membersByUid, updatedAt: now });
            room.members = updatedPresence.members; room.membersByUid = updatedPresence.membersByUid; room.updatedAt = now;
            return res.json({ status: true, room: publicRoom(room), role: isHost ? 'host' : 'listener' });
        }
        if (action === 'leave' && method === 'POST') {
            const membersByUid = room.membersByUid || {};
            delete membersByUid[user.uid];
            const members = Object.keys(membersByUid).length;
            if (isHost || members === 0) await ref.remove();
            else await ref.update({ members, membersByUid, updatedAt: Date.now() });
            return res.json({ status: true });
        }
        if (action === 'command' && method === 'POST') {
            if (!isHost) return responseError(res, 403, 'Hanya host yang dapat mengontrol pemutaran.');
            const state = room.state || {};
            const expectedVersion = body.expectedVersion == null ? null : Number(body.expectedVersion);
            if (expectedVersion !== null && Number.isFinite(expectedVersion) && expectedVersion !== Number(state.version || 0)) {
                return res.status(409).json({ status: false, conflict: true, message: 'State room sudah berubah. Sinkronkan ulang sebelum mengirim command.' });
            }
            const queue = body.queue ? cleanQueue(body.queue) : cleanQueue(state.queue);
            const nextState = {
                queue: queue.length ? queue : cleanQueue(state.queue),
                index: Math.min(Math.max(Number(body.index ?? state.index) || 0, 0), Math.max(0, queue.length - 1)),
                track: track(body.track || (queue.length ? queue[Number(body.index ?? state.index) || 0] : state.track)),
                playing: Boolean(body.playing ?? state.playing),
                position: Math.max(0, Math.min(Number(body.position ?? state.position) || 0, 86400)),
                changedAt: Date.now(),
                version: Number(state.version || 0) + 1
            };
            if (!nextState.track && nextState.queue.length) nextState.track = nextState.queue[nextState.index];
            await ref.update({ state: nextState, updatedAt: Date.now() });
            room.state = nextState;
            room.updatedAt = Date.now();
            return res.json({ status: true, room: publicRoom(room) });
        }
        return responseError(res, 400, 'Action Listen Together tidak dikenal.');
    } catch (error) {
        console.error('Listen Together error:', error.message);
        return responseError(res, 500, 'Room sedang tidak tersedia.');
    }
};
