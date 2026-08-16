'use strict';

const crypto = require('crypto');
const { getDatabase } = require('./firebase-admin.js');

function secret() {
    return process.env.SESSION_SECRET || (process.env.NODE_ENV === 'production' ? null : 'development-only-change-this-session-secret');
}

function decodeSession(value) {
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
        return payload && payload.uid && payload.exp > Date.now() ? payload : null;
    } catch (_) { return null; }
}

function currentUser(req) {
    const raw = req.headers && (req.headers.cookie || req.headers.Cookie) || '';
    const cookies = raw.split(';').reduce((out, part) => {
        const index = part.indexOf('=');
        if (index >= 0) out[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
        return out;
    }, {});
    return decodeSession(cookies.mm_session);
}

function responseError(res, status, message) {
    return res.status(status).json({ status: false, message });
}

function cleanName(value) {
    return String(value || '').trim().replace(/[<>]/g, '').slice(0, 80);
}

function validatePicture(value) {
    if (value === '') return '';
    if (typeof value !== 'string' || !/^data:image\/(jpeg|jpg|png|webp);base64,[a-z0-9+/=]+$/i.test(value)) return null;
    if (value.length > 280000) return null;
    return value;
}

module.exports = async function profile(req, res) {
    if (req.method === 'OPTIONS') return res.status(200).send('OK');
    const user = currentUser(req);
    if (!user) return responseError(res, 401, 'Login diperlukan untuk mengelola profil.');
    const ref = getDatabase().ref(`userProfiles/${user.uid}`);

    try {
        if (req.method === 'GET') {
            const snapshot = await ref.once('value');
            const stored = snapshot.val() || {};
            return res.json({ status: true, profile: { name: cleanName(stored.name || user.name), picture: typeof stored.picture === 'string' ? stored.picture : '' } });
        }
        if (req.method !== 'PATCH' && req.method !== 'POST') return responseError(res, 405, 'Method tidak didukung.');
        let body = req.body || {};
        if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = {}; } }
        const picture = validatePicture(body.picture);
        if (picture === null) return responseError(res, 400, 'Avatar tidak valid atau terlalu besar. Gunakan JPG, PNG, atau WebP maksimal 200 KB.');
        const profile = { name: cleanName(body.name || user.name), picture, updatedAt: Date.now() };
        await ref.update(profile);
        return res.json({ status: true, profile: { name: profile.name, picture: profile.picture } });
    } catch (error) {
        console.error('[profile]', error && error.stack ? error.stack : error);
        return responseError(res, 500, 'Profil belum dapat disimpan.');
    }
};
