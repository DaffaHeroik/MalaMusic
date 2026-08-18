const express = require('express');
const path = require('path');
const https = require('https');
const fs = require('fs');

const app = express();

function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}
function safeShareText(value, maxLength) {
    return escapeHtml(String(value == null ? '' : value).replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, maxLength || 300));
}
function safeShareImage(value, fallback) {
    try {
        const parsed = new URL(String(value || ''));
        if (parsed.protocol === 'https:') return escapeHtml(parsed.href);
    } catch (_) {}
    return escapeHtml(fallback);
}
function requestShareUrl(req) {
    return escapeHtml(`${req.protocol}://${req.get('host')}${req.originalUrl}`.slice(0, 2000));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Function to validate and return allowed origin matching current domain/host
function getAllowedOrigin(req) {
    const origin = req.headers.origin || req.headers.referer;
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    if (origin) {
        try {
            const originUrl = new URL(origin);
            if (host && originUrl.host === host) {
                return originUrl.origin;
            } else {
                return null;
            }
        } catch (e) {
            return null;
        }
    }
    if (host) {
        const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
        return `${proto}://${host}`;
    }
    return null;
}

// Strict CORS middleware: Disable CORS for external domains (same-origin only)
app.use((req, res, next) => {
    const origin = req.headers.origin || req.headers.referer;
    const host = req.headers['x-forwarded-host'] || req.headers.host;

    // Block cross-origin requests to /api/ from external domains
    if (origin && host && req.path.startsWith('/api/')) {
        try {
            const originUrl = new URL(origin);
            if (originUrl.host !== host) {
                if (req.method === 'OPTIONS') {
                    return res.status(403).end();
                }
                return res.status(403).json({
                    status: false,
                    message: 'Access denied: Cross-origin requests from external domains are disabled.'
                });
            }
        } catch (e) {}
    }

    const allowedOrigin = getAllowedOrigin(req);
    if (allowedOrigin) {
        res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
        res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Expose-Headers', '*');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// API Routes
app.all('/api/search', require('./api/search.js'));
app.all('/api/lyrics', require('./api/lyrics.js'));
app.all('/api/lyrics1', require('./api/lyrics1.js'));
app.all('/api/lyrics2', require('./api/lyrics2.js'));
app.all('/api/artist', require('./api/artist.js'));
app.all('/api/album', require('./api/album.js'));
app.all('/api/suggest', require('./api/suggest.js'));
app.all('/api/ytplay', require('./api/ytplay.js'));
app.all('/api/translate', require('./api/translate.js'));
app.all('/api/transcribe', require('./api/transcribe.js'));
app.all('/api/google-auth', require('./api/google-auth.js'));
app.all('/api/email-auth', require('./api/email-auth.js'));
app.all('/api/profile', require('./api/profile.js'));
app.all('/api/library', require('./api/library.js'));
app.all('/api/streak', require('./api/streak.js'));
app.all('/api/stats', require('./api/stats.js'));
app.all('/api/listen-together', require('./api/listen-together.js'));

// Same-origin image proxy for artwork color extraction and cover rendering.
const IMAGE_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/149.0.0.0 Safari/537.36';
const IMAGE_REDIRECT_LIMIT = 1;
const IMAGE_MAX_BYTES = 8 * 1024 * 1024;
function isAllowedImageUrl(value, baseUrl) {
    try {
        const parsed = new URL(String(value || ''), baseUrl);
        const hostName = String(parsed.hostname || '').toLowerCase();
        const allowedImageHost = hostName === 'i.ytimg.com' || hostName === 'img.youtube.com' || hostName === 'yt3.googleusercontent.com' || hostName === 'lh3.googleusercontent.com' || hostName.endsWith('.googleusercontent.com');
        return parsed.protocol === 'https:' && allowedImageHost ? parsed : null;
    } catch (_) {
        return null;
    }
}
function proxyImageStream(req, res, targetUrl, redirectsRemaining) {
    const parsed = isAllowedImageUrl(targetUrl);
    if (!parsed) return res.status(400).send('Image source tidak diizinkan');
    const proxyReq = https.get(parsed, { headers: { 'User-Agent': IMAGE_USER_AGENT } }, (proxyRes) => {
        if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
            proxyRes.resume();
            if (redirectsRemaining <= 0) return res.status(502).send('Image source terlalu banyak redirect.');
            const redirected = isAllowedImageUrl(proxyRes.headers.location, parsed);
            if (!redirected) return res.status(502).send('Image redirect tidak diizinkan.');
            return proxyImageStream(req, res, redirected.href, redirectsRemaining - 1);
        }
        const contentType = String(proxyRes.headers['content-type'] || '').toLowerCase().split(';')[0];
        const contentLength = Number(proxyRes.headers['content-length'] || 0);
        if ((proxyRes.statusCode || 502) < 200 || (proxyRes.statusCode || 502) >= 300 || !contentType.startsWith('image/')) {
            proxyRes.resume();
            return res.status(proxyRes.statusCode === 404 ? 404 : 502).send('Image source tidak tersedia.');
        }
        if (contentLength > IMAGE_MAX_BYTES) {
            proxyRes.resume();
            return res.status(413).send('Image terlalu besar.');
        }
        const allowedOrigin = getAllowedOrigin(req);
        res.status(200).set({ 'Content-Type': contentType, 'Cache-Control': 'public, max-age=86400' });
        if (allowedOrigin) { res.setHeader('Access-Control-Allow-Origin', allowedOrigin); res.setHeader('Vary', 'Origin'); }
        let received = 0;
        proxyRes.on('data', chunk => { received += chunk.length; if (received > IMAGE_MAX_BYTES) proxyRes.destroy(); });
        proxyRes.on('error', () => { if (!res.headersSent) res.status(502).end('Image proxy gagal.'); });
        proxyRes.pipe(res);
    });
    proxyReq.setTimeout(15000, () => proxyReq.destroy(new Error('image timeout')));
    proxyReq.on('error', () => { if (!res.headersSent) res.status(502).send('Image proxy gagal.'); });
}
app.all('/api/proxy-image', (req, res) => {
    if (req.method === 'OPTIONS') return res.status(200).send('OK');
    if (req.method !== 'GET') return res.status(405).send('Method tidak didukung.');
    const targetUrl = String(req.query.url || '').trim();
    if (!targetUrl || targetUrl.length > 2048) return res.status(400).send('Parameter url tidak valid');
    return proxyImageStream(req, res, targetUrl, IMAGE_REDIRECT_LIMIT);
});

// Proxy audio needs to stream in node, bypassing edge function.
const AUDIO_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/149.0.0.0 Safari/537.36';
const AUDIO_REDIRECT_LIMIT = 1;
function isAllowedAudioUrl(value, baseUrl) {
    try {
        const parsed = new URL(String(value || ''), baseUrl);
        const hostName = String(parsed.hostname || '').toLowerCase();
        const allowedMediaHost = hostName === 'googlevideo.com' || hostName.endsWith('.googlevideo.com') || hostName === 'youtube.com' || hostName.endsWith('.youtube.com') || hostName === 'youtu.be' || hostName.endsWith('.youtu.be') || /^cdn\d+\.savetube\.vip$/.test(hostName);
        return parsed.protocol === 'https:' && allowedMediaHost ? parsed : null;
    } catch (_) {
        return null;
    }
}
function proxyAudioStream(req, res, targetUrl, redirectsRemaining) {
    const parsed = isAllowedAudioUrl(targetUrl);
    if (!parsed) return res.status(400).send('Audio source tidak diizinkan');
    const options = { headers: { 'User-Agent': AUDIO_USER_AGENT } };
    if (req.headers.range) options.headers.Range = req.headers.range;
    const proxyReq = https.get(parsed, options, (proxyRes) => {
        if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
            proxyRes.resume();
            if (redirectsRemaining <= 0) return res.status(502).send('Audio source terlalu banyak redirect.');
            const redirected = isAllowedAudioUrl(proxyRes.headers.location, parsed);
            if (!redirected) return res.status(502).send('Audio redirect tidak diizinkan.');
            // FIXED: bounded, validated redirect follow replaces internal-router recursion.
            return proxyAudioStream(req, res, redirected.href, redirectsRemaining - 1);
        }
        res.status(proxyRes.statusCode || 502);
        const allowedOrigin = getAllowedOrigin(req);
        if (allowedOrigin) {
            res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
            res.setHeader('Vary', 'Origin');
        }
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        res.setHeader('Access-Control-Expose-Headers', '*');
        ['content-type', 'content-length', 'accept-ranges', 'content-range'].forEach(h => {
            if (proxyRes.headers[h]) res.setHeader(h, proxyRes.headers[h]);
        });
        if (!res.getHeader('accept-ranges')) res.setHeader('Accept-Ranges', 'bytes');
        proxyRes.on('error', (error) => { if (!res.headersSent) res.status(502).send('Audio source error.'); else res.destroy(error); });
        proxyRes.pipe(res);
    });
    proxyReq.setTimeout(15000, () => proxyReq.destroy(new Error('Audio source timeout')));
    proxyReq.on('error', (error) => {
        if (!res.headersSent) res.status(502).send('Audio proxy unavailable.');
    });
}
app.get('/api/proxy-audio', (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send('Missing url parameter');
    return proxyAudioStream(req, res, targetUrl, AUDIO_REDIRECT_LIMIT);
});

// Unknown API routes must remain JSON 404s; never fall through to the SPA HTML shell.
app.use('/api', (req, res) => res.status(404).json({ status: false, message: 'Endpoint API tidak ditemukan.' }));

// Static files (from public)
app.use(express.static(path.join(__dirname, 'public')));

// Fallback for SPA routing
app.use((req, res) => {
    const filePath = path.join(__dirname, 'public', 'index.html');
    
    if (req.path.startsWith('/play/')) {
        const videoId = req.path.split('/play/')[1];
        if (videoId) {
            const cleanVideoId = videoId.split('?')[0].split('/')[0];
            const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
            const qTitle = reqUrl.searchParams.get('title');
            const qArtist = reqUrl.searchParams.get('artist');
            const qCover = reqUrl.searchParams.get('cover') || reqUrl.searchParams.get('thumb');

            const cleanId = cleanVideoId.match(/^[a-zA-Z0-9_-]{1,32}$/)?.[0] || '';
            if (!cleanId) return res.sendFile(filePath);
            const fallbackCover = `https://i.ytimg.com/vi/${cleanId}/hqdefault.jpg`;
            const coverUrl = safeShareImage(qCover, fallbackCover);
            const playTitle = safeShareText(qTitle ? (qArtist ? `${qTitle} - ${qArtist}` : qTitle) : `Dengarkan Musik - MalaMusic`, 180);
            const playDesc = safeShareText(`Dengarkan ${qTitle || 'lagu favoritmu'} di MalaMusic Web Music Player`, 300);
            const shareUrl = requestShareUrl(req);

            return fs.readFile(filePath, 'utf8', (err, html) => {
                if (err) return res.sendFile(filePath);
                
                let updatedHtml = html
                    .replace(/<title>.*?<\/title>/gi, `<title>${playTitle}</title>`)
                    .replace(/<meta property="og:title" content=".*?"\s*\/?>/gi, `<meta property="og:title" content="${playTitle}">`)
                    .replace(/<meta property="og:description" content=".*?"\s*\/?>/gi, `<meta property="og:description" content="${playDesc}">`)
                    .replace(/<meta property="og:image" content=".*?"\s*\/?>/gi, `<meta property="og:image" content="${coverUrl}">`)
                    .replace(/<meta property="og:image:secure_url" content=".*?"\s*\/?>/gi, `<meta property="og:image:secure_url" content="${coverUrl}">`)
                    .replace(/<meta property="og:url" content=".*?"\s*\/?>/gi, `<meta property="og:url" content="${shareUrl}">`)
                    .replace(/<meta name="twitter:title" content=".*?"\s*\/?>/gi, `<meta name="twitter:title" content="${playTitle}">`)
                    .replace(/<meta name="twitter:description" content=".*?"\s*\/?>/gi, `<meta name="twitter:description" content="${playDesc}">`)
                    .replace(/<meta name="twitter:image" content=".*?"\s*\/?>/gi, `<meta name="twitter:image" content="${coverUrl}">`)
                    .replace(/<meta name="twitter:image:src" content=".*?"\s*\/?>/gi, `<meta name="twitter:image:src" content="${coverUrl}">`)
                    .replace(/<link rel="icon".*?>/gi, `<link rel="icon" type="image/jpeg" href="${coverUrl}">`)
                    .replace(/<link rel="apple-touch-icon".*?>/gi, `<link rel="apple-touch-icon" href="${coverUrl}">`);

                res.setHeader('Content-Type', 'text/html');
                return res.send(updatedHtml);
            });
        }
    }

    if (req.path.startsWith('/artist/')) {
        const artistId = req.path.split('/artist/')[1];
        if (artistId) {
            const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
            const qName = reqUrl.searchParams.get('name') || reqUrl.searchParams.get('title');
            const qCover = reqUrl.searchParams.get('cover') || reqUrl.searchParams.get('thumb');

            const pageTitle = safeShareText(qName ? `${qName} (Artist) - MalaMusic` : `Artist - MalaMusic`, 180);
            const pageDesc = safeShareText(qName ? `Dengarkan lagu & album terbaik dari ${qName} di MalaMusic` : `Dengarkan lagu & album dari artist favoritmu di MalaMusic`, 300);
            const coverUrl = safeShareImage(qCover, 'https://www.gobox.my.id/file/R0ym4wqfznmp.png');
            const shareUrl = requestShareUrl(req);

            return fs.readFile(filePath, 'utf8', (err, html) => {
                if (err) return res.sendFile(filePath);
                
                let updatedHtml = html
                    .replace(/<title>.*?<\/title>/gi, `<title>${pageTitle}</title>`)
                    .replace(/<meta property="og:title" content=".*?"\s*\/?>/gi, `<meta property="og:title" content="${pageTitle}">`)
                    .replace(/<meta property="og:description" content=".*?"\s*\/?>/gi, `<meta property="og:description" content="${pageDesc}">`)
                    .replace(/<meta property="og:image" content=".*?"\s*\/?>/gi, `<meta property="og:image" content="${coverUrl}">`)
                    .replace(/<meta property="og:image:secure_url" content=".*?"\s*\/?>/gi, `<meta property="og:image:secure_url" content="${coverUrl}">`)
                    .replace(/<meta property="og:url" content=".*?"\s*\/?>/gi, `<meta property="og:url" content="${shareUrl}">`)
                    .replace(/<meta name="twitter:title" content=".*?"\s*\/?>/gi, `<meta name="twitter:title" content="${pageTitle}">`)
                    .replace(/<meta name="twitter:description" content=".*?"\s*\/?>/gi, `<meta name="twitter:description" content="${pageDesc}">`)
                    .replace(/<meta name="twitter:image" content=".*?"\s*\/?>/gi, `<meta name="twitter:image" content="${coverUrl}">`)
                    .replace(/<meta name="twitter:image:src" content=".*?"\s*\/?>/gi, `<meta name="twitter:image:src" content="${coverUrl}">`)
                    .replace(/<link rel="icon".*?>/gi, `<link rel="icon" type="image/jpeg" href="${coverUrl}">`)
                    .replace(/<link rel="apple-touch-icon".*?>/gi, `<link rel="apple-touch-icon" href="${coverUrl}">`);

                res.setHeader('Content-Type', 'text/html');
                return res.send(updatedHtml);
            });
        }
    }

    if (req.path.startsWith('/album/')) {
        const albumId = req.path.split('/album/')[1];
        if (albumId) {
            const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
            const qTitle = reqUrl.searchParams.get('title');
            const qArtist = reqUrl.searchParams.get('artist');
            const qCover = reqUrl.searchParams.get('cover') || reqUrl.searchParams.get('thumb');

            const pageTitle = safeShareText(qTitle ? (qArtist ? `${qTitle} - ${qArtist} (Album) - MalaMusic` : `${qTitle} (Album) - MalaMusic`) : `Album - MalaMusic`, 180);
            const pageDesc = safeShareText(qTitle ? `Dengarkan album ${qTitle} di MalaMusic` : `Dengarkan album favoritmu di MalaMusic`, 300);
            const coverUrl = safeShareImage(qCover, 'https://www.gobox.my.id/file/R0ym4wqfznmp.png');
            const shareUrl = requestShareUrl(req);

            return fs.readFile(filePath, 'utf8', (err, html) => {
                if (err) return res.sendFile(filePath);
                
                let updatedHtml = html
                    .replace(/<title>.*?<\/title>/gi, `<title>${pageTitle}</title>`)
                    .replace(/<meta property="og:title" content=".*?"\s*\/?>/gi, `<meta property="og:title" content="${pageTitle}">`)
                    .replace(/<meta property="og:description" content=".*?"\s*\/?>/gi, `<meta property="og:description" content="${pageDesc}">`)
                    .replace(/<meta property="og:image" content=".*?"\s*\/?>/gi, `<meta property="og:image" content="${coverUrl}">`)
                    .replace(/<meta property="og:image:secure_url" content=".*?"\s*\/?>/gi, `<meta property="og:image:secure_url" content="${coverUrl}">`)
                    .replace(/<meta property="og:url" content=".*?"\s*\/?>/gi, `<meta property="og:url" content="${shareUrl}">`)
                    .replace(/<meta name="twitter:title" content=".*?"\s*\/?>/gi, `<meta name="twitter:title" content="${pageTitle}">`)
                    .replace(/<meta name="twitter:description" content=".*?"\s*\/?>/gi, `<meta name="twitter:description" content="${pageDesc}">`)
                    .replace(/<meta name="twitter:image" content=".*?"\s*\/?>/gi, `<meta name="twitter:image" content="${coverUrl}">`)
                    .replace(/<meta name="twitter:image:src" content=".*?"\s*\/?>/gi, `<meta name="twitter:image:src" content="${coverUrl}">`)
                    .replace(/<link rel="icon".*?>/gi, `<link rel="icon" type="image/jpeg" href="${coverUrl}">`)
                    .replace(/<link rel="apple-touch-icon".*?>/gi, `<link rel="apple-touch-icon" href="${coverUrl}">`);

                res.setHeader('Content-Type', 'text/html');
                return res.send(updatedHtml);
            });
        }
    }

    // Default HTML response (uses /logo.png as favicon for home)
    fs.readFile(filePath, 'utf8', (err, html) => {
        if (err) return res.sendFile(filePath);
        res.setHeader('Content-Type', 'text/html');
        return res.send(html);
    });
});

if (require.main === module) {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

module.exports = app;
