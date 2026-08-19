const crypto = require('crypto');
const { CircuitBreaker } = require('./savetube-circuit-breaker');

const BASE_URL = 'https://youtubedl.siputzx.my.id';
const PROVIDER_HOST = 'youtubedl.siputzx.my.id';
const REQUEST_TIMEOUT_MS = 12_000;
const JOB_TIMEOUT_MS = 30_000;
const POLL_INTERVAL_MS = 1800;
const MAX_POW_NONCE = 50_000_000;
const breaker = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 60_000 });

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function solvePow(challenge, difficulty) {
  const numericDifficulty = Number(difficulty);
  if (!Number.isInteger(numericDifficulty) || numericDifficulty < 0 || numericDifficulty > 6) {
    throw new Error('Invalid provider PoW difficulty');
  }
  const prefix = '0'.repeat(numericDifficulty);
  for (let nonce = 0; nonce < MAX_POW_NONCE; nonce += 1) {
    const digest = crypto.createHash('sha256').update(`${challenge}${nonce}`).digest('hex');
    if (digest.startsWith(prefix)) return String(nonce);
  }
  throw new Error('Provider PoW exceeded bounded work');
}

function createSession() {
  const cookies = new Map();
  function absorb(response) {
    const setCookies = typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie()
      : [];
    for (const line of setCookies) {
      const pair = String(line).split(';', 1)[0];
      const separator = pair.indexOf('=');
      if (separator > 0) cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
    }
  }
  return {
    header() {
      return [...cookies.entries()].map(([key, value]) => `${key}=${value}`).join('; ');
    },
    absorb
  };
}

async function requestJson(path, options, session, deadline) {
  const remaining = Math.max(500, deadline - Date.now());
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.min(REQUEST_TIMEOUT_MS, remaining));
  const headers = new Headers(options?.headers || {});
  const cookie = session.header();
  if (cookie) headers.set('cookie', cookie);
  try {
    let lastError;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const response = await fetch(`${BASE_URL}${path}`, { ...options, headers, signal: controller.signal });
        session.absorb(response);
        const text = await response.text();
        let data = null;
        try { data = JSON.parse(text); } catch (_) {}
        return { response, data };
      } catch (error) {
        lastError = error;
        if (controller.signal.aborted || Date.now() >= deadline || attempt === 2) throw error;
        await sleep(Math.min(350 * (attempt + 1), Math.max(0, deadline - Date.now())));
      }
    }
    throw lastError || new Error('Provider request failed');
  } finally {
    clearTimeout(timer);
  }
}

function validateAudioUrl(value) {
  try {
    const parsed = new URL(String(value || ''), BASE_URL);
    if (parsed.protocol !== 'https:' || parsed.hostname.toLowerCase() !== PROVIDER_HOST) return null;
    return parsed.href;
  } catch (_) {
    return null;
  }
}

function providerError(data, fallback) {
  return String(data?.error || fallback || 'Siputzx audio resolver failed').slice(0, 160);
}

async function probeAudioUrl(audioUrl, deadline) {
  const remaining = Math.max(500, deadline - Date.now());
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.min(7000, remaining));
  try {
    const response = await fetch(audioUrl, {
      method: 'GET',
      headers: { range: 'bytes=0-1' },
      signal: controller.signal
    });
    const type = String(response.headers.get('content-type') || '').toLowerCase();
    if (!response.ok || (!type.startsWith('audio/') && !type.includes('mpeg') && !type.includes('octet-stream'))) {
      try { await response.body?.cancel(); } catch (_) {}
      return false;
    }
    try { await response.body?.cancel(); } catch (_) {}
    return true;
  } catch (_) {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function youtubeVideoId(value) {
  try {
    const parsed = new URL(String(value || ''));
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    if (host === 'youtu.be') return parsed.pathname.split('/').filter(Boolean)[0] || null;
    return parsed.searchParams.get('v') || null;
  } catch (_) {
    return null;
  }
}

async function resolveSiputzxAudio(sourceUrl) {
  if (!breaker.canRequest()) return null;
  const deadline = Date.now() + JOB_TIMEOUT_MS;
  const session = createSession();
  try {
    const challenge = await requestJson('/akumaudownload', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: sourceUrl, type: 'audio' })
    }, session, deadline);
    if (!challenge.response.ok || !challenge.data?.challenge) throw new Error(providerError(challenge.data, 'Challenge unavailable'));

    const nonce = solvePow(challenge.data.challenge, challenge.data.difficulty);
    const verified = await requestJson('/cekpunyaku', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: sourceUrl, type: 'audio', nonce })
    }, session, deadline);
    if (!verified.response.ok) throw new Error(providerError(verified.data, 'Session verification failed'));

    while (Date.now() < deadline) {
      const result = await requestJson(`/download?url=${encodeURIComponent(sourceUrl)}&type=audio&apikey=`, { method: 'GET' }, session, deadline);
      if (result.data?.status === 'failed') throw new Error(providerError(result.data, 'Audio job failed'));
      if (result.data?.status === 'completed') {
        const requestedId = youtubeVideoId(sourceUrl);
        const returnedSource = result.data.url || result.data.source_url || result.data.sourceUrl;
        const returnedId = youtubeVideoId(returnedSource);
        if (requestedId && returnedSource && returnedId && returnedId !== requestedId) {
          await sleep(Math.min(POLL_INTERVAL_MS, Math.max(0, deadline - Date.now())));
          continue;
        }
        const providerUrl = result.data.fileUrl || result.data.file_url || result.data.filePath || result.data.file_path;
        const audioUrl = validateAudioUrl(providerUrl);
        if (!audioUrl) throw new Error('Provider returned invalid audio URL');
        if (!(await probeAudioUrl(audioUrl, deadline))) {
          throw new Error('Provider returned unavailable audio URL');
        }
        breaker.recordSuccess();
        return { audio: audioUrl, provider: 'siputzx' };
      }
      await sleep(Math.min(POLL_INTERVAL_MS, Math.max(0, deadline - Date.now())));
    }
    throw new Error('Provider audio job timed out');
  } catch (error) {
    breaker.recordFailure();
    console.warn(`[ytplay] siputzx failed: ${String(error.message || error).slice(0, 160)}`);
    return null;
  }
}

module.exports = { resolveSiputzxAudio, breaker, PROVIDER_HOST };
