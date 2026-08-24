'use strict';

const { getDatabase } = require('./firebase-admin.js');

function cleanText(value, fallback, max) {
    return String(value || fallback || '').replace(/[<>]/g, '').trim().slice(0, max);
}

function cleanProfile(uid, value) {
    const profile = value && typeof value === 'object' ? value : {};
    return {
        id: String(uid || '').slice(0, 180),
        name: cleanText(profile.name, 'Pengguna MalaMusic', 80),
        picture: typeof profile.picture === 'string' ? profile.picture.slice(0, 280000) : ''
    };
}

function cleanPublicPlaylist(value) {
    const p = value && typeof value === 'object' ? value : {};
    if (!p.isPublic || !p.id) return null;
    const songs = Array.isArray(p.songs) ? p.songs.slice(0, 100).map(song => {
        const id = String(song && (song.videoId || song.id) || '').slice(0, 120);
        return id ? {
            id,
            videoId: id,
            title: cleanText(song.title, 'Lagu', 180),
            artist: cleanText(song.artist, 'MalaMusic', 120),
            cover: String(song.cover || '').slice(0, 600),
            ytUrl: String(song.ytUrl || '').slice(0, 600)
        } : null;
    }).filter(Boolean) : [];
    return {
        id: String(p.publicId || p.id).slice(0, 120),
        name: cleanText(p.name, 'Playlist MalaMusic', 120),
        image: String(p.image || '').slice(0, 600),
        creator: cleanText(p.creator, '', 120),
        songs
    };
}

function normalizeQuery(value) {
    return String(value || '').trim().toLocaleLowerCase('id-ID').replace(/\s+/g, ' ').slice(0, 80);
}

module.exports = async function users(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ status: false, message: 'Method tidak didukung.' });
    const db = getDatabase();
    const query = normalizeQuery(req.query && (req.query.query || req.query.q));
    const uid = String(req.query && req.query.uid || '').trim();
    if (!query && !uid) return res.status(400).json({ status: false, message: 'Parameter query atau uid diperlukan.' });
    try {
        if (uid) {
            const profileSnap = await db.ref(`userProfiles/${uid}`).once('value');
            if (!profileSnap.exists()) return res.status(404).json({ status: false, message: 'Profil pengguna tidak ditemukan.' });
            const profile = profileSnap.val() || {};
            if (profile.publicSearch === false) return res.status(404).json({ status: false, message: 'Profil pengguna tidak tersedia.' });
            const librarySnap = await db.ref(`userLibraries/${uid}`).once('value');
            const library = librarySnap.val() || {};
            const playlists = Array.isArray(library.playlists) ? library.playlists.map(cleanPublicPlaylist).filter(Boolean).slice(0, 50) : [];
            return res.status(200).json({ status: true, profile: cleanProfile(uid, profile), playlists });
        }
        const usersById = new Map();
        const indexed = await db.ref('userProfiles').orderByChild('nameLower').startAt(query).endAt(`${query}\uf8ff`).limitToFirst(20).once('value');
        indexed.forEach(child => {
            const profile = child.val() || {};
            if (profile.publicSearch !== false) usersById.set(child.key, cleanProfile(child.key, profile));
        });
        // Backward-compatible fallback for profiles created before nameLower was introduced.
        // The response is still sanitized, and private profiles remain excluded.
        if (usersById.size < 20) {
            const legacy = await db.ref('userProfiles').limitToFirst(500).once('value');
            legacy.forEach(child => {
                if (usersById.size >= 20 || usersById.has(child.key)) return;
                const profile = child.val() || {};
                if (profile.publicSearch === false) return;
                const name = normalizeQuery(profile.name);
                if (name.includes(query)) usersById.set(child.key, cleanProfile(child.key, profile));
            });
        }
        return res.status(200).json({ status: true, users: Array.from(usersById.values()).slice(0, 20) });
    } catch (error) {
        console.error('[users]', error && error.stack ? error.stack : error);
        return res.status(503).json({ status: false, message: 'Pencarian pengguna sementara belum tersedia.' });
    }
};

module.exports._test = { normalizeQuery, cleanPublicPlaylist };
