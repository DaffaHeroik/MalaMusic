const assert = require('node:assert/strict');
const axios = require('axios');
const handler = require('../api/search');

function response() {
  return {
    statusCode: 200,
    payload: null,
    status(code) { this.statusCode = code; return this; },
    json(value) { this.payload = value; return this; },
    send(value) { this.payload = value; return this; }
  };
}

async function invoke(query, type = 'all') {
  const res = response();
  await handler({ method: 'GET', query: { query, type }, headers: {}, socket: {} }, res);
  return res;
}

(async () => {
  const originalPost = axios.post;
  try {
    let calls = 0;
    axios.post = async (_url, payload) => {
      calls++;
      if (payload.params === 'EgWKAQIgAWoKEAoQCRADEAA=') throw new Error('artist category temporarily unavailable');
      if (payload.params === 'EgWKAQIIAWoSEAQQAxAFEAkQChAVEBAQERAO') {
        const titleRun = { text: 'Get Lucky', navigationEndpoint: { watchEndpoint: { videoId: '4D7u5KF7SP8' } } };
        const artistRun = { text: 'Daft Punk', navigationEndpoint: { browseEndpoint: { browseId: 'UCRr1xG_2WIds18a6cIiCxeA' } } };
        const albumRun = { text: 'Random Access Memories', navigationEndpoint: { browseEndpoint: { browseId: 'MPREalbum123' } } };
        const renderer = {
          flexColumns: [
            { musicResponsiveListItemFlexColumnRenderer: { text: { runs: [titleRun] } } },
            { musicResponsiveListItemFlexColumnRenderer: { text: { runs: [artistRun, { text: ' • ' }, albumRun], accessibility: { accessibilityData: { label: 'Daft Punk • Random Access Memories • 6 menit, 10 detik' } } } } }
          ],
          thumbnail: { musicThumbnailRenderer: { thumbnail: { thumbnails: [{ url: 'https://i.ytimg.com/vi/4D7u5KF7SP8/default.jpg' }] } } }
        };
        return { data: { contents: { tabbedSearchResultsRenderer: { tabs: [{ tabRenderer: { content: { sectionListRenderer: { contents: [{ musicShelfRenderer: { contents: [{ musicResponsiveListItemRenderer: renderer }] } }] } } } }] } } } };
      }
      return { data: { contents: { tabbedSearchResultsRenderer: { tabs: [] } } } };
    };

    const invalidType = await invoke('test query', 'unknown');
    assert.equal(invalidType.statusCode, 400);
    assert.equal(calls, 0, 'invalid types must not reach upstream');

    const tooLong = await invoke('x'.repeat(161));
    assert.equal(tooLong.statusCode, 400);
    assert.equal(calls, 0, 'oversized queries must not reach upstream');

    const partial = await invoke('test query', 'all');
    assert.equal(partial.statusCode, 200);
    assert.equal(partial.payload.status, true);
    assert.equal(partial.payload.partial, true, 'partial upstream outage should preserve successful categories');
    assert.equal(partial.payload.result.totalSongs, 1, 'extract videoId from watchEndpoint when playlistItemData is absent');
    assert.equal(partial.payload.result.songs[0].videoId, '4D7u5KF7SP8');
    assert.equal(calls, 3);

    axios.post = async () => { throw new Error('upstream unavailable'); };
    const originalConsoleError = console.error;
    console.error = () => {};
    let unavailable;
    try { unavailable = await invoke('test query', 'songs'); }
    finally { console.error = originalConsoleError; }
    assert.equal(unavailable.statusCode, 502);
    assert.equal(unavailable.payload.status, false);

    console.log('YOUTUBE_MUSIC_PROVIDER_CHECK_PASS');
  } finally {
    axios.post = originalPost;
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
