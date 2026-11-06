'use strict';

// Node.js streaming resolver based on the client fallback strategy used by
// Musify. This is an independent implementation using youtubei.js (MIT),
// not a source-code port of Musify's GPL-3.0 Dart packages.

const CACHE_TTL_MS = 30 * 60 * 1000;
const MAX_CACHE_ENTRIES = 300;
const REQUEST_TIMEOUT_MS = 12_000;
const CLIENTS = ['VISIONOS', 'ANDROID'];
const YOUTUBE_VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

function formatDuration(milliseconds) {
  const seconds = Math.max(0, Math.floor(Number(milliseconds || 0) / 1000));
  if (!seconds) return null;
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function isTrustedMediaUrl(value) {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'https:' &&
      (url.hostname === 'googlevideo.com' || url.hostname.endsWith('.googlevideo.com'));
  } catch (_) {
    return false;
  }
}

function createBoundedFetch(baseFetch = globalThis.fetch) {
  return (input, init = {}) => {
    const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
    const signal = init.signal
      ? AbortSignal.any([init.signal, timeoutSignal])
      : timeoutSignal;
    return baseFetch(input, { ...init, signal });
  };
}

function createMusifyNodeResolver(options = {}) {
  const now = options.now || Date.now;
  const cache = new Map();
  const inFlight = new Map();
  let clientPromise = null;

  const createClient = options.createClient || (async () => {
    const { Innertube } = await import('youtubei.js');
    return Innertube.create({
      retrieve_player: true,
      enable_session_cache: true,
      fetch: createBoundedFetch()
    });
  });

  async function getClient() {
    if (!clientPromise) {
      clientPromise = Promise.resolve().then(createClient).catch(error => {
        clientPromise = null;
        throw error;
      });
    }
    return clientPromise;
  }

  function pruneCache() {
    const current = now();
    for (const [id, entry] of cache) {
      if (!entry || entry.expiresAt <= current) cache.delete(id);
    }
    if (cache.size > MAX_CACHE_ENTRIES) {
      const oldest = [...cache.entries()].sort((a, b) => a[1].expiresAt - b[1].expiresAt);
      oldest.slice(0, cache.size - MAX_CACHE_ENTRIES).forEach(([id]) => cache.delete(id));
    }
  }

  async function resolve(videoId) {
    const id = String(videoId || '').trim();
    if (!YOUTUBE_VIDEO_ID_RE.test(id)) return null;

    pruneCache();
    const cached = cache.get(id);
    if (cached && cached.expiresAt > now()) return cached.value;
    if (inFlight.has(id)) return inFlight.get(id);

    const task = (async () => {
      const client = await getClient();
      let lastError;

      for (const clientName of CLIENTS) {
        try {
          const format = await client.getStreamingData(id, {
            client: clientName,
            type: 'audio',
            quality: 'best'
          });
          const mimeType = String(format?.mime_type || '').toLowerCase();
          const audioUrl = format?.url;

          if (!audioUrl || !mimeType.startsWith('audio/') || !isTrustedMediaUrl(audioUrl)) {
            throw new Error('YouTube returned an unsupported audio format');
          }

          const value = {
            audio: audioUrl,
            duration: formatDuration(format.approx_duration_ms),
            provider: `youtubei-${clientName.toLowerCase()}`
          };
          cache.set(id, { value, expiresAt: now() + CACHE_TTL_MS });
          pruneCache();
          return value;
        } catch (error) {
          lastError = error;
          console.warn(`[ytplay] youtubei ${clientName.toLowerCase()} client failed`);
        }
      }

      // Never hand a YouTube-restricted video to third-party fallback extractors.
      // Detect login/availability restrictions explicitly so the caller can stop.
      if (lastError && typeof client.getInfo === 'function') {
        for (const clientName of CLIENTS) {
          try {
            const info = await client.getInfo(id, { client: clientName });
            const status = info?.playability_status?.status;
            if (status && status !== 'OK') {
              const error = new Error('YouTube playback is restricted for this video');
              error.code = 'YOUTUBE_ACCESS_RESTRICTED';
              error.playabilityStatus = status;
              throw error;
            }
          } catch (error) {
            if (error?.code === 'YOUTUBE_ACCESS_RESTRICTED') throw error;
          }
        }
      }

      if (lastError) throw lastError;
      return null;
    })();

    inFlight.set(id, task);
    try {
      return await task;
    } finally {
      inFlight.delete(id);
    }
  }

  return {
    resolve,
    clearCache() { cache.clear(); },
    cacheSize() { return cache.size; }
  };
}

const defaultResolver = createMusifyNodeResolver();

module.exports = {
  resolveMusifyNodeAudio: defaultResolver.resolve,
  createMusifyNodeResolver,
  isTrustedMediaUrl,
  formatDuration
};
