const crypto = require('crypto');

function secret() {
    return process.env.SESSION_SECRET || (process.env.NODE_ENV === 'production' ? null : 'development-only-change-this-session-secret');
}

function sign(value) {
    const currentSecret = secret();
    return currentSecret ? crypto.createHmac('sha256', currentSecret).update(value).digest('base64url') : '';
}

function encode(payload) {
    const value = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `${value}.${sign(value)}`;
}

function decode(value) {
    if (!value || !value.includes('.')) return null;
    const [body, signature] = value.split('.', 2);
    const expected = sign(body);
    if (!expected || !signature || signature.length !== expected.length) return null;
    try {
        if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
        return JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    } catch (_) { return null; }
}

function cookies(req) {
    return String(req.headers.cookie || '').split(';').reduce((out, part) => {
        const i = part.indexOf('=');
        if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
        return out;
    }, {});
}

function cookie(name, value, maxAge) {
    return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; ${process.env.NODE_ENV !== 'development' ? 'Secure; ' : ''}Max-Age=${maxAge}`;
}

function dayKey(date) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Makassar' }).format(date);
}

function previousDay(key) {
    const date = new Date(`${key}T12:00:00+08:00`);
    date.setDate(date.getDate() - 1);
    return dayKey(date);
}

function calculate(dates) {
    const unique = Array.from(new Set(dates || [])).sort();
    if (!unique.length) return { current: 0, best: 0, activeDays: 0, lastActive: null };
    let best = 1;
    let run = 1;
    for (let i = 1; i < unique.length; i++) {
        if (previousDay(unique[i]) === unique[i - 1]) { run += 1; best = Math.max(best, run); }
        else run = 1;
    }
    const today = dayKey(new Date());
    const yesterday = previousDay(today);
    let current = 0;
    if (unique[unique.length - 1] === today || unique[unique.length - 1] === yesterday) {
        current = 1;
        for (let i = unique.length - 1; i > 0; i--) {
            if (unique[i - 1] === previousDay(unique[i])) current += 1;
            else break;
        }
    }
    return { current, best, activeDays: unique.length, lastActive: unique[unique.length - 1] };
}

module.exports = async function streak(req, res) {
    if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) return res.status(500).json({ status: false, message: 'SESSION_SECRET belum dikonfigurasi.' });
    const session = decode(cookies(req).mm_session);
    if (!session || !session.email || !session.exp || session.exp < Date.now()) return res.status(401).json({ status: false, authenticated: false, message: 'Login diperlukan.' });

    const currentCookie = decode(cookies(req).mm_streak);
    const dates = currentCookie && currentCookie.email === session.email && Array.isArray(currentCookie.dates) ? currentCookie.dates.slice(-180) : [];
    const action = (req.query && req.query.action) || 'me';

    if (action === 'record') {
        if (req.method !== 'POST') return res.status(405).json({ status: false, message: 'Method tidak didukung.' });
        const today = dayKey(new Date());
        if (!dates.includes(today)) dates.push(today);
        const payload = { email: session.email, dates: Array.from(new Set(dates)).sort().slice(-180) };
        const stats = calculate(payload.dates);
        res.setHeader('Set-Cookie', cookie('mm_streak', encode(payload), 366 * 24 * 60 * 60));
        return res.status(200).json({ status: true, authenticated: true, recorded: true, streak: stats });
    }

    return res.status(200).json({ status: true, authenticated: true, streak: calculate(dates) });
};
