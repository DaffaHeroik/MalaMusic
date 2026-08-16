const crypto = require('crypto');
const { getAuth } = require('./firebase-admin.js');

const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;
const FIREBASE_SIGN_IN_ENDPOINT = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword';

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
    if (!expected || signature.length !== expected.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
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
    parts.push(maxAge <= 0 ? 'Max-Age=0' : `Max-Age=${maxAge}`);
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

function safeUser(user) {
    const email = normalizeEmail(user.email);
    const fallbackName = email.split('@')[0] || 'Pengguna';
    return {
        uid: user.uid,
        email,
        name: String(user.displayName || fallbackName).slice(0, 80),
        picture: String(user.photoURL || '').slice(0, 500)
    };
}

function validateCredentials(email, password) {
    if (!isGmail(email)) return 'Gunakan alamat Gmail yang valid (@gmail.com).';
    if (typeof password !== 'string' || password.length < 8) return 'Password minimal 8 karakter.';
    if (password.length > 128) return 'Password terlalu panjang.';
    return '';
}

function firebaseErrorMessage(code) {
    const messages = {
        EMAIL_NOT_FOUND: 'Akun Gmail belum terdaftar. Pilih Daftar terlebih dahulu.',
        INVALID_PASSWORD: 'Password salah.',
        INVALID_LOGIN_CREDENTIALS: 'Email atau password salah.',
        USER_DISABLED: 'Akun ini dinonaktifkan.',
        EMAIL_EXISTS: 'Email sudah terdaftar. Pilih Login.',
        WEAK_PASSWORD: 'Password Firebase harus minimal 6 karakter.',
        TOO_MANY_ATTEMPTS_TRY_LATER: 'Terlalu banyak percobaan. Coba lagi nanti.'
    };
    return messages[code] || 'Autentikasi Firebase gagal. Coba lagi.';
}

function createSession(res, user) {
    const session = { ...safeUser(user), exp: Date.now() + SESSION_TTL_SECONDS * 1000 };
    setCookies(res, [cookie('mm_session', encode(session), SESSION_TTL_SECONDS)]);
    return session;
}

async function loginWithFirebasePassword(email, password) {
    const apiKey = process.env.FIREBASE_WEB_API_KEY || 'AIzaSyDP1Yh0E8f_PgLFuLprIhFX3gccM9A4gfk';
    const response = await fetch(`${FIREBASE_SIGN_IN_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.idToken) {
        const code = String(payload.error && payload.error.message || '').replace(/^EMAIL_NOT_FOUND$/, 'EMAIL_NOT_FOUND');
        throw new Error(firebaseErrorMessage(code));
    }
    return payload.idToken;
}

async function verifyFirebaseToken(idToken) {
    if (!idToken || typeof idToken !== 'string' || idToken.length > 4096) throw new Error('Token Firebase tidak valid.');
    const auth = getAuth();
    const decoded = await auth.verifyIdToken(idToken);
    if (!decoded.email || !isGmail(decoded.email)) throw new Error('Hanya akun Gmail yang diizinkan.');
    return decoded;
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
        if (!session || !session.email || !session.exp || session.exp < now) return res.status(200).json({ authenticated: false });
        return res.status(200).json({ authenticated: true, user: session });
    }

    if (action === 'logout') {
        setCookies(res, [cookie('mm_session', '', 0)]);
        return res.status(200).json({ status: true });
    }

    if (req.method !== 'POST') return res.status(405).json({ status: false, message: 'Method tidak didukung.' });
    const body = bodyOf(req);
    const email = normalizeEmail(body.email);
    const password = body.password;
    const validationError = validateCredentials(email, password);
    if (validationError) return res.status(400).json({ status: false, message: validationError });

    try {
        const auth = getAuth();
        let firebaseUser;

        if (action === 'register') {
            const displayName = String(body.name || '').trim().slice(0, 80);
            const createOptions = { email, password };
            if (displayName) createOptions.displayName = displayName;
            firebaseUser = await auth.createUser(createOptions);
        } else if (action === 'login') {
            const idToken = await loginWithFirebasePassword(email, password);
            const decoded = await verifyFirebaseToken(idToken);
            firebaseUser = await auth.getUser(decoded.uid);
        } else {
            return res.status(404).json({ status: false, message: 'Aksi autentikasi tidak ditemukan.' });
        }

        const user = createSession(res, firebaseUser);
        return res.status(200).json({ status: true, authenticated: true, user });
    } catch (error) {
        const code = String(error && (error.code || error.message) || '');
        if (code.includes('email-already-exists')) return res.status(409).json({ status: false, message: 'Email sudah terdaftar. Pilih Login.' });
        if (code.includes('invalid-password')) return res.status(400).json({ status: false, message: 'Password tidak memenuhi aturan Firebase.' });
        if (code.includes('auth/')) return res.status(401).json({ status: false, message: firebaseErrorMessage(code.replace('auth/', '').toUpperCase()) });
        console.error('[email-auth]', error && error.stack ? error.stack : error);
        return res.status(502).json({ status: false, message: (error && typeof error.message === 'string' && error.message) || 'Server autentikasi belum siap.' });
    }
};
