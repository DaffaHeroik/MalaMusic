const crypto = require('crypto');

const SESSION_COOKIE = 'mm_google_session';
const STATE_COOKIE = 'mm_google_oauth_state';
const YOUTUBE_SCOPE = 'https://www.googleapis.com/auth/youtube.readonly';

function parseCookies(req) {
    const raw = req.headers.cookie || '';
    return raw.split(';').reduce((out, item) => {
        const index = item.indexOf('=');
        if (index < 0) return out;
        const key = item.slice(0, index).trim();
        out[key] = decodeURIComponent(item.slice(index + 1));
        return out;
    }, {});
}

function getOrigin(req) {
    const forwardedHost = req.headers['x-forwarded-host'] || req.headers.host;
    const proto = req.headers['x-forwarded-proto'] || (req.headers.host && req.headers.host.startsWith('localhost') ? 'http' : 'https');
    return process.env.GOOGLE_APP_ORIGIN || `${proto}://${forwardedHost}`;
}

function getRedirectUri(req) {
    return process.env.GOOGLE_REDIRECT_URI || `${getOrigin(req)}/api/google-auth?action=callback`;
}

function secretKey() {
    const value = process.env.SESSION_SECRET;
    if (!value) throw new Error('SESSION_SECRET belum dikonfigurasi');
    return crypto.createHash('sha256').update(value).digest();
}

function encrypt(value) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', secretKey(), iv);
    const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
    return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString('base64url')).join('.');
}

function decrypt(value) {
    try {
        const [iv, tag, encrypted] = value.split('.').map((part) => Buffer.from(part, 'base64url'));
        const decipher = crypto.createDecipheriv('aes-256-gcm', secretKey(), iv);
        decipher.setAuthTag(tag);
        return JSON.parse(Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8'));
    } catch (_) {
        return null;
    }
}

function setCookie(res, name, value, options = {}) {
    const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax'];
    if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
    if (options.secure !== false) parts.push('Secure');
    const current = res._headers && res._headers['Set-Cookie'];
    const cookies = Array.isArray(current) ? current : current ? [current] : [];
    cookies.push(parts.join('; '));
    res.setHeader('Set-Cookie', cookies);
}

function clearCookie(res, name) {
    setCookie(res, name, '', { maxAge: 0 });
}

function jsonError(res, status, message) {
    return res.status(status).json({ status: false, message });
}

async function exchangeToken(params) {
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(params)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error_description || data.error || 'Google token exchange gagal');
    return data;
}

async function googleJson(url, accessToken) {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Google API request gagal');
    return data;
}

async function getSession(req) {
    const cookies = parseCookies(req);
    let session = cookies[SESSION_COOKIE] ? decrypt(cookies[SESSION_COOKIE]) : null;
    if (!session) return null;
    if (session.expiresAt && Date.now() < session.expiresAt - 60000) return session;
    if (!session.refreshToken) return null;
    const tokens = await exchangeToken({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: session.refreshToken,
        grant_type: 'refresh_token'
    });
    session.accessToken = tokens.access_token;
    session.expiresAt = Date.now() + (Number(tokens.expires_in || 3600) * 1000);
    return session;
}

function saveSession(res, session, req) {
    setCookie(res, SESSION_COOKIE, encrypt(session), { secure: !((req.headers.host || '').startsWith('localhost')) });
}

async function handler(req, res) {
    const action = req.query.action || 'me';
    const secure = !((req.headers.host || '').startsWith('localhost'));

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.SESSION_SECRET) {
        return jsonError(res, 503, 'Google OAuth belum dikonfigurasi di environment hosting.');
    }

    if (action === 'login') {
        const state = crypto.randomBytes(24).toString('base64url');
        setCookie(res, STATE_COOKIE, state, { maxAge: 600, secure });
        const params = new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID,
            redirect_uri: getRedirectUri(req),
            response_type: 'code',
            access_type: 'offline',
            prompt: 'consent',
            include_granted_scopes: 'true',
            scope: `openid email profile ${YOUTUBE_SCOPE}`,
            state
        });
        res.status(302).setHeader('Location', `https://accounts.google.com/o/oauth2/v2/auth?${params}`);
        return res.end();
    }

    if (action === 'callback') {
        const cookies = parseCookies(req);
        if (!req.query.code || !req.query.state || req.query.state !== cookies[STATE_COOKIE]) {
            return jsonError(res, 400, 'OAuth state tidak valid atau kode authorization hilang.');
        }
        const tokens = await exchangeToken({
            code: req.query.code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: getRedirectUri(req),
            grant_type: 'authorization_code'
        });
        const user = await googleJson('https://openidconnect.googleapis.com/v1/userinfo', tokens.access_token);
        const session = {
            user: { id: user.sub, name: user.name, email: user.email, picture: user.picture },
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token || null,
            expiresAt: Date.now() + (Number(tokens.expires_in || 3600) * 1000)
        };
        saveSession(res, session, req);
        clearCookie(res, STATE_COOKIE);
        res.status(302).setHeader('Location', '/?google=connected');
        return res.end();
    }

    if (action === 'logout') {
        clearCookie(res, SESSION_COOKIE);
        clearCookie(res, STATE_COOKIE);
        return res.json({ status: true });
    }

    let session;
    try { session = await getSession(req); } catch (error) { return jsonError(res, 401, error.message); }
    if (!session) return res.status(401).json({ status: false, authenticated: false });
    saveSession(res, session, req);

    if (action === 'me') return res.json({ status: true, authenticated: true, user: session.user });

    if (action === 'liked') {
        const params = new URLSearchParams({
            part: 'snippet,contentDetails',
            my: 'like',
            maxResults: String(Math.min(Number(req.query.maxResults || 50), 50))
        });
        if (req.query.pageToken) params.set('pageToken', req.query.pageToken);
        const data = await googleJson(`https://www.googleapis.com/youtube/v3/videos?${params}`, session.accessToken);
        return res.json({
            status: true,
            nextPageToken: data.nextPageToken || null,
            items: (data.items || []).map((item) => ({
                id: item.id,
                title: item.snippet?.title || 'Tanpa judul',
                channelTitle: item.snippet?.channelTitle || '',
                thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
                publishedAt: item.snippet?.publishedAt || null
            }))
        });
    }

    return jsonError(res, 404, 'Action OAuth tidak dikenal.');
}

module.exports = handler;
