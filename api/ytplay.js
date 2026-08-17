const axios = require('axios');
const crypto = require('crypto');

// Memory cache for audio stream URLs (valid 1.5 hours)
const ytCache = new Map();
const CACHE_TTL = 90 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;
const rateBuckets = new Map();
function pruneAudioCache(now) {
  for (const [key, value] of ytCache) {
    if (!value || value.expireAt <= now) ytCache.delete(key);
  }
  if (ytCache.size > MAX_CACHE_ENTRIES) {
    const oldest = [...ytCache.entries()].sort((a, b) => a[1].expireAt - b[1].expireAt);
    oldest.slice(0, ytCache.size - MAX_CACHE_ENTRIES).forEach(([key]) => ytCache.delete(key));
  }
}
function extractYoutubeId(value) {
  const raw = String(value || '').trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;
  try {
    const parsed = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const allowedHosts = new Set(['youtube.com', 'music.youtube.com', 'm.youtube.com', 'youtu.be']);
    if (!allowedHosts.has(host)) return null;
    if (host === 'youtu.be') return (parsed.pathname.split('/').filter(Boolean)[0] || '').match(/^[a-zA-Z0-9_-]{11}$/)?.[0] || null;
    if (parsed.pathname === '/watch') return (parsed.searchParams.get('v') || '').match(/^[a-zA-Z0-9_-]{11}$/)?.[0] || null;
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    if ((pathParts[0] === 'shorts' || pathParts[0] === 'embed' || pathParts[0] === 'live') && /^[a-zA-Z0-9_-]{11}$/.test(pathParts[1] || '')) return pathParts[1];
  } catch (_) {}
  return null;
}
function allowRequest(req){
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const bucket = rateBuckets.get(ip) || { start: now, count: 0 };
  if (now - bucket.start > 60000) { bucket.start = now; bucket.count = 0; }
  bucket.count += 1; rateBuckets.set(ip, bucket);
  for (const [key, value] of rateBuckets) {
    if (now - value.start > 60000) rateBuckets.delete(key);
  }
  if (rateBuckets.size > 1000) {
    const oldest = [...rateBuckets.entries()].sort((a, b) => a[1].start - b[1].start);
    oldest.slice(0, rateBuckets.size - 1000).forEach(([key]) => rateBuckets.delete(key));
  }
  // FIXED: selective eviction instead of clearing all buckets.
  return bucket.count <= 30;
}

async function getDownload(url) {
  const idMatch = extractYoutubeId(url);

  if (!idMatch) {
    console.warn('[ytplay] rejected invalid YouTube input');
    return null;
  }

  // Check cache first
  pruneAudioCache(Date.now());
  const cached = ytCache.get(idMatch);
  if (cached && cached.expireAt > Date.now()) {
    console.info('[ytplay] cache hit');
    return cached.data;
  }

  const fullUrl = "https://www.youtube.com/watch?v=" + idMatch;
  const cdns = ["cdn405.savetube.vip", "cdn403.savetube.vip", "cdn401.savetube.vip"];

  // Race all CDNs in parallel instead of looping sequentially.
  // Sequential (3 cdn x 2 attempts x 25s) could take up to 150s, way past
  // Netlify's ~30s hard function timeout. Racing them means total wall time
  // is bounded by the single slowest attempt (capped below), not the sum.
  const PER_CDN_TIMEOUT = 9000; // ms, keep total well under Netlify's 30s cap
  const controller = new AbortController();

  async function tryCdn(cdn) {
    const api = axios.create({
      headers: {
        "content-type": "application/json",
        "origin": "https://yt.savetube.me",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
      },
      timeout: PER_CDN_TIMEOUT,
      signal: controller.signal
    });

    const infoResponse = await api.post(`https://${cdn}/v2/info`, { url: fullUrl });
    const encryptedData = infoResponse?.data?.data;
    if (!encryptedData) throw new Error(`No data from ${cdn}`);

    const encrypted = Buffer.from(encryptedData, "base64");
    const decipher = crypto.createDecipheriv("aes-128-cbc",
      Buffer.from("C5D58EF67A7584E4A29F6C35BBC4EB12", "hex"),
      encrypted.slice(0, 16)
    );

    const decryptedBuffer = Buffer.concat([
      decipher.update(encrypted.slice(16)),
      decipher.final()
    ]);

    const decrypted = JSON.parse(decryptedBuffer.toString());
    const downloadRes = await api.post(`https://${cdn}/download`, {
      id: idMatch,
      downloadType: "audio",
      quality: "128",
      key: decrypted.key
    });

    const audioUrl = downloadRes.data?.data?.downloadUrl || downloadRes.data?.downloadUrl;
    if (!audioUrl) throw new Error(`No audio URL from ${cdn}`);

    return {
      duration: `${Math.floor(decrypted.duration / 60)}:${(decrypted.duration % 60).toString().padStart(2, "0")}`,
      audio: audioUrl,
      cdn
    };
  }

  try {
    const result = await Promise.any(cdns.map(cdn =>
      tryCdn(cdn).catch(err => {
        console.warn(`[ytplay] upstream ${cdn} failed`);
        throw err;
      })
    ));

    // Winner found, stop the losing in-flight requests so they don't
    // keep the function/connections alive uselessly.
    controller.abort();

    console.info(`[ytplay] upstream winner: ${result.cdn}`);
    ytCache.set(idMatch, { data: result, expireAt: Date.now() + CACHE_TTL });
    pruneAudioCache(Date.now());
    return result;
  } catch (aggregateErr) {
    console.warn('[ytplay] all upstreams failed');
    return null;
  }
}

module.exports = async (req, res) => {
    if (req.method === 'OPTIONS') { res.status(200).end(); return; }
    if (req.method !== 'POST') { res.status(405).json({ status: false, message: 'Method not allowed' }); return; }

    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    body = body || {};

    const url = String(body.query || body.url || '').trim();
    if (!url || url.length > 300) { res.status(400).json({ status: false, message: 'Parameter query tidak valid' }); return; }
    if (!allowRequest(req)) { res.status(429).json({ status: false, message: 'Terlalu banyak permintaan. Coba lagi sebentar.' }); return; }
    if (!extractYoutubeId(url)) { res.status(400).json({ status: false, message: 'Hanya URL atau ID YouTube yang didukung.' }); return; }

    console.info('[ytplay] extraction started');

    try {
        let audioData = await getDownload(url);

        if (audioData && audioData.audio) {
            console.info('[ytplay] extraction succeeded');
            return res.status(200).json({
                status: true,
                result: {
                    duration: audioData.duration || null,
                    download: { audio: audioData.audio }
                }
            });
        }

        console.warn('[ytplay] extraction returned no media');
        res.status(503).json({ status: false, error: "Media extraction services are currently overloaded. Please try another track." });
    } catch (err) {
        console.error('[ytplay] extraction failed');
        res.status(500).json({ status: false, error: "Internal server error during extraction" });
    }
};
