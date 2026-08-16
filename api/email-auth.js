const crypto = require('crypto');

const OTP_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;
const RESEND_ENDPOINT = 'https://api.resend.com/emails';

function secret() {
    return process.env.SESSION_SECRET || (process.env.NODE_ENV === 'production' ? null : 'development-only-change-this-session-secret');
}

function sign(value) {
    const currentSecret = secret();
    if (!currentSecret) return '';
    return crypto.createHmac('sha256', currentSecret).update(value).digest('base64url');
}

function encode(payload) {
    const value = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `${value}.${sign(value)}`;
}

function decode(value) {
    if (!value || !value.includes('.')) return null;
    const parts = value.split('.');
    const body = parts.shift();
    const signature = parts.join('.');
    const expected = sign(body);
    if (!expected || signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    try { return JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); } catch (_) { return null; }
}

function parseCookies(req) {
    const raw = req.headers && (req.headers.cookie || req.headers.Cookie) || '';
    return raw.split(';').reduce((cookies, part) => {
        const index = part.indexOf('=');
        if (index < 0) return cookies;
        const key = part.slice(0, index).trim();
        const value = part.slice(index + 1).trim();
        if (key) cookies[key] = decodeURIComponent(value);
        return cookies;
    }, {});
}

function cookie(name, value, maxAge) {
    const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax'];
    if (maxAge <= 0) parts.push('Max-Age=0');
    else parts.push(`Max-Age=${maxAge}`);
    if (process.env.NODE_ENV !== 'development') parts.push('Secure');
    return parts.join('; ');
}

function setCookies(res, values) {
    res.setHeader('Set-Cookie', values);
}

function bodyOf(req) {
    if (!req.body) return {};
    if (typeof req.body === 'object') return req.body;
    try { return JSON.parse(req.body); } catch (_) { return {}; }
}

function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
}

function isGmail(email) {
    return /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@gmail\.com$/i.test(email);
}

function otpHash(email, otp) {
    return crypto.createHash('sha256').update(`${email}:${otp}:${secret()}`).digest('hex');
}

function safeUser(email) {
    const local = email.split('@')[0] || 'Pengguna';
    const name = local.replace(/[._+-]+/g, ' ').replace(/\b\w/g, char => char.toUpperCase()).slice(0, 60);
    return { email, name, picture: '' };
}

async function sendOtp(email, otp) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error('RESEND_API_KEY belum dikonfigurasi di hosting.');
    const from = process.env.RESEND_FROM || 'MalaMusic <otp@malawalipayment.web.id>';
    if (!/@malawalipayment\.web\.id[>\s]?/i.test(from)) throw new Error('RESEND_FROM harus menggunakan domain malawalipayment.web.id.');
    const response = await fetch(RESEND_ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            from,
            to: [email],
            subject: `${otp} adalah kode masuk MalaMusic`,
            text: `Kode OTP MalaMusic kamu adalah ${otp}. Kode ini berlaku selama 10 menit. Jangan bagikan kode ini kepada siapa pun.`,
            html: `<div style="font-family:Arial,sans-serif;background:#0b0b0f;color:#fff;padding:32px;border-radius:16px;max-width:520px"><p style="color:#fb7185;font-weight:700;letter-spacing:.08em">MALAMUSIC</p><h1>Kode masuk kamu</h1><p>Gunakan kode berikut untuk masuk atau membuat akun:</p><div style="font-size:36px;font-weight:800;letter-spacing:12px;padding:18px 0;color:#fb7185">${otp}</div><p style="color:#a1a1aa">Kode berlaku selama 10 menit. Jika kamu tidak meminta kode ini, abaikan email ini.</p></div>`
        })
    });
    if (!response.ok) {
        let detail = '';
        try { detail = (await response.json()).message || ''; } catch (_) {}
        throw new Error(detail || 'Resend gagal mengirim email OTP.');
    }
}

module.exports = async function emailAuth(req, res) {
    if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
        return res.status(500).json({ status: false, message: 'SESSION_SECRET belum dikonfigurasi di hosting.' });
    }
    const action = (req.query && req.query.action) || 'me';
    const cookies = parseCookies(req);
    const now = Date.now();

    if (action === 'me') {
        const session = decode(cookies.mm_session);
        if (!session || !session.email || !session.exp || session.exp < now) {
            return res.status(200).json({ authenticated: false });
        }
        return res.status(200).json({ authenticated: true, user: session });
    }

    if (action === 'logout') {
        setCookies(res, [cookie('mm_session', '', 0), cookie('mm_otp', '', 0)]);
        return res.status(200).json({ status: true });
    }

    if (req.method !== 'POST') return res.status(405).json({ status: false, message: 'Method tidak didukung.' });
    const body = bodyOf(req);

    if (action === 'request') {
        const email = normalizeEmail(body.email);
        if (!isGmail(email)) return res.status(400).json({ status: false, message: 'Gunakan alamat Gmail yang valid (@gmail.com).' });
        const previous = decode(cookies.mm_otp);
        if (previous && previous.email === email && previous.sentAt && now - previous.sentAt < 60 * 1000) {
            return res.status(429).json({ status: false, message: 'Tunggu 60 detik sebelum meminta OTP baru.' });
        }
        const otp = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
        try {
            await sendOtp(email, otp);
        } catch (error) {
            return res.status(502).json({ status: false, message: error.message });
        }
        const challenge = { email, hash: otpHash(email, otp), exp: now + OTP_TTL_MS, sentAt: now, attempts: 0 };
        setCookies(res, [cookie('mm_otp', encode(challenge), Math.floor(OTP_TTL_MS / 1000))]);
        return res.status(200).json({ status: true, step: 'verify', email, expiresIn: Math.floor(OTP_TTL_MS / 1000) });
    }

    if (action === 'verify') {
        const otp = String(body.otp || '').replace(/\D/g, '');
        const challenge = decode(cookies.mm_otp);
        if (!challenge || !challenge.email || challenge.exp < now) return res.status(400).json({ status: false, message: 'OTP sudah kedaluwarsa. Minta kode baru.' });
        if (challenge.attempts >= 5) return res.status(429).json({ status: false, message: 'Terlalu banyak percobaan. Minta OTP baru.' });
        if (!/^\d{6}$/.test(otp) || otpHash(challenge.email, otp) !== challenge.hash) {
            challenge.attempts += 1;
            setCookies(res, [cookie('mm_otp', encode(challenge), Math.max(1, Math.floor((challenge.exp - now) / 1000)))]);
            return res.status(400).json({ status: false, message: `Kode OTP salah. Sisa percobaan: ${Math.max(0, 5 - challenge.attempts)}.` });
        }
        const user = safeUser(challenge.email);
        user.exp = now + SESSION_TTL_SECONDS * 1000;
        setCookies(res, [cookie('mm_session', encode(user), SESSION_TTL_SECONDS), cookie('mm_otp', '', 0)]);
        return res.status(200).json({ status: true, authenticated: true, user });
    }

    return res.status(404).json({ status: false, message: 'Aksi autentikasi tidak ditemukan.' });
};
