'use strict';
const assert = require('node:assert/strict');
const { createMusifyNodeResolver, isTrustedMediaUrl, formatDuration } = require('../api/musify-node-resolver');

(async () => {
  assert.equal(isTrustedMediaUrl('https://rr1---sn.googlevideo.com/videoplayback'), true);
  assert.equal(isTrustedMediaUrl('http://rr1---sn.googlevideo.com/videoplayback'), false);
  assert.equal(isTrustedMediaUrl('https://example.com/audio.mp3'), false);
  assert.equal(formatDuration(185000), '3:05');
  assert.equal(formatDuration(0), null);

  let calls = [];
  let clientCreates = 0;
  const resolver = createMusifyNodeResolver({
    now: () => 1000,
    createClient: async () => {
      clientCreates++;
      return {
        async getStreamingData(id, options) {
          calls.push({ id, options });
          if (options.client === 'VISIONOS') throw new Error('client unavailable');
          return {
            url: 'https://rr1---sn.googlevideo.com/videoplayback?id=' + id,
            mime_type: 'audio/webm; codecs="opus"',
            approx_duration_ms: 185000
          };
        }
      };
    }
  });

  const [first, concurrent] = await Promise.all([
    resolver.resolve('4D7u5KF7SP8'),
    resolver.resolve('4D7u5KF7SP8')
  ]);
  assert.deepEqual(first, concurrent);
  assert.equal(first.duration, '3:05');
  assert.equal(first.provider, 'youtubei-android');
  assert.equal(clientCreates, 1, 'client should be initialized once');
  assert.equal(calls.length, 2, 'concurrent requests should share one resolution');
  assert.equal(calls[0].options.client, 'VISIONOS');
  assert.equal(calls[1].options.client, 'ANDROID');

  const cached = await resolver.resolve('4D7u5KF7SP8');
  assert.deepEqual(cached, first);
  assert.equal(calls.length, 2, 'cache should avoid a second upstream resolution');
  assert.equal(await resolver.resolve('invalid'), null);

  const restrictedResolver = createMusifyNodeResolver({
    createClient: async () => ({
      async getStreamingData() { throw new Error('Streaming data not available'); },
      async getInfo() { return { playability_status: { status: 'LOGIN_REQUIRED' } }; }
    })
  });
  await assert.rejects(
    restrictedResolver.resolve('E7kHvjvU6JY'),
    error => error.code === 'YOUTUBE_ACCESS_RESTRICTED' && error.playabilityStatus === 'LOGIN_REQUIRED'
  );

  console.log('MUSIFY_NODE_RESOLVER_CHECK_PASS');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
