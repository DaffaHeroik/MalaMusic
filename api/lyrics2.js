const { getTranscribe } = require('./transcribe.js');
const { translateLines } = require('./translate.js');

async function getLyrics2(videoId) {
    let lyricsData = { type: 'none', lines: [] };
    let title = '', artist = '';

    // AssemblyAI is an optional last-resort transcriber. When it is not configured,
    // skip it silently so normal lyrics requests do not create production errors.
    if (!String(process.env.ASSEMBLYAI_API_KEY || '').trim()) {
        return { videoId, title, artist, lyrics: lyricsData };
    }

    try {
        const transcribed = await getTranscribe(videoId);
        if (transcribed) {
            title = transcribed.title || '';
            if (transcribed.synced && transcribed.synced.length > 0) {
                lyricsData = {
                    type: 'synced',
                    lines: transcribed.synced.map(s => ({
                        time: typeof s.time === 'number' ? s.time : (parseFloat(String(s.start).replace('s', '')) || 0),
                        text: s.text || '• • •'
                    }))
                };
            } else if (transcribed.text) {
                lyricsData = {
                    type: 'plain',
                    lines: transcribed.text.split('. ').map(t => ({ time: -1, text: t.trim() })).filter(t => t.text)
                };
            }
        }
    } catch (err) {
        console.warn('[LYRICS2] Optional transcriber unavailable:', err.message);
    }

    if (lyricsData.lines && lyricsData.lines.length > 0) {
        lyricsData.lines = await translateLines(lyricsData.lines);
    }

    return { videoId, title, artist, lyrics: lyricsData };
}

const handler = async (req, res) => {
    if (req.method === 'OPTIONS') { res.status(200).end(); return; }
    return res.status(404).json({ status: false, message: 'Endpoint internal.' });
};

handler.getLyrics2 = getLyrics2;
module.exports = handler;
