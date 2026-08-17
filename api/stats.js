const crypto = require('crypto');
const WORKER_URL = process.env.MALAMUSIC_STATS_WORKER_URL || 'https://malamusic-stats.daffaheroik2020.workers.dev';
const WORKER_SECRET = String(process.env.MALAMUSIC_INTERNAL_SECRET || '').trim();
function secret() { return process.env.SESSION_SECRET || ''; }
function decode(value) {
    if (!value || !value.includes('.') || !secret()) return null;
    const [body, signature] = value.split('.', 2);
    const expected = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
    if (!signature || signature.length !== expected.length) return null;
    try { if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null; return JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); } catch (_) { return null; }
}
function cookies(req) { return String(req.headers.cookie || '').split(';').reduce((out, item) => { const i = item.indexOf('='); if (i > -1) out[item.slice(0, i).trim()] = decodeURIComponent(item.slice(i + 1).trim()); return out; }, {}); }
function user(req) { const u = decode(cookies(req).mm_session); return u && u.email && u.exp > Date.now() ? u : null; }
function headers() {
    if (!WORKER_SECRET) throw new Error('MALAMUSIC_INTERNAL_SECRET belum dikonfigurasi.');
    return { 'Content-Type': 'application/json', 'x-malamusic-secret': WORKER_SECRET };
} // FIXED: empty internal secret no longer authenticates worker requests.
async function call(path, options) { const response = await fetch(`${WORKER_URL}${path}`, { ...(options || {}), headers: { ...headers(), ...((options && options.headers) || {}) } }); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.message || 'Worker statistik gagal.'); return data; }
function body(req) { return req.body && typeof req.body === 'object' ? req.body : {}; }

module.exports = async function stats(req, res) {
    try {
        const action = (req.query && req.query.action) || 'leaderboard';
        if (action === 'leaderboard') {
            if (req.method !== 'GET') return res.status(405).json({ status: false, message: 'Method tidak didukung.' });
            return res.status(200).json(await call('/leaderboard', { method: 'GET' }));
        }
        if (action === 'public-playlist') {
            if (req.method !== 'GET') return res.status(405).json({ status: false, message: 'Method tidak didukung.' });
            const id = String((req.query && req.query.id) || '').trim();
            if (!/^[A-Za-z0-9_-]{3,120}$/.test(id)) return res.status(400).json({ status: false, message: 'ID playlist publik tidak valid.' });
            return res.status(200).json(await call('/playlist/' + encodeURIComponent(id), { method: 'GET' }));
        }
        const currentUser = user(req);
        if (!currentUser) return res.status(401).json({ status: false, authenticated: false, message: 'Login diperlukan.' });
        if (action === 'me') return res.status(200).json(await call('/me', { method: 'POST', body: JSON.stringify({ email: currentUser.email }) }));
        if (action === 'listen') {
            if (req.method !== 'POST') return res.status(405).json({ status: false, message: 'Method tidak didukung.' });
            const seconds = Math.max(1, Math.min(120, Math.round(Number(body(req).seconds || 0))));
            if (!seconds) return res.status(400).json({ status: false, message: 'Durasi tidak valid.' });
            return res.status(200).json(await call('/listen', { method: 'POST', body: JSON.stringify({ email: currentUser.email, name: currentUser.name, seconds }) }));
        }
        if (action === 'publish-playlist') {
            if (req.method !== 'POST') return res.status(405).json({ status: false, message: 'Method tidak didukung.' });
            const data = body(req);
            return res.status(200).json(await call('/playlist', { method: 'POST', body: JSON.stringify({ ...data, email: currentUser.email, ownerName: currentUser.name }) }));
        }
        if (action === 'rollover') {
            const authorization = String(req.headers.authorization || '');
            if (!process.env.CRON_SECRET || authorization !== `Bearer ${process.env.CRON_SECRET}`) return res.status(401).json({ status: false, message: 'Unauthorized cron request.' });
            return res.status(200).json(await call('/rollover', { method: 'POST' }));
        }
        return res.status(404).json({ status: false, message: 'Aksi statistik tidak ditemukan.' });
    } catch (error) {
        console.error('stats error', error);
        return res.status(503).json({ status: false, message: 'Statistik sementara belum tersedia.' });
    }
};
