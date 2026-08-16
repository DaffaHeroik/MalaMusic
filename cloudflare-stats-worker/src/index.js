const DAY = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Makassar' }).format(new Date());

async function query(env, sql, params = []) {
  const result = await env.DB.prepare(sql).bind(...params).all();
  return result.results || [];
}

async function schema(env) {
  await env.DB.batch([
    env.DB.prepare('CREATE TABLE IF NOT EXISTS user_daily_stats (email TEXT NOT NULL, display_name TEXT NOT NULL, day TEXT NOT NULL, seconds INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(email, day))'),
    env.DB.prepare('CREATE TABLE IF NOT EXISTS user_stats (email TEXT PRIMARY KEY, display_name TEXT NOT NULL, total_seconds INTEGER NOT NULL DEFAULT 0, streak_current INTEGER NOT NULL DEFAULT 0, streak_best INTEGER NOT NULL DEFAULT 0, active_days INTEGER NOT NULL DEFAULT 0, last_active TEXT, updated_at TEXT NOT NULL)'),
    env.DB.prepare('CREATE TABLE IF NOT EXISTS leaderboard_snapshot (rank INTEGER NOT NULL, display_name TEXT NOT NULL, total_seconds INTEGER NOT NULL, streak_current INTEGER NOT NULL, streak_best INTEGER NOT NULL, active_days INTEGER NOT NULL, snapshot_day TEXT NOT NULL, PRIMARY KEY(rank, snapshot_day))'),
    env.DB.prepare('CREATE TABLE IF NOT EXISTS public_playlists (id TEXT PRIMARY KEY, owner_email TEXT NOT NULL, owner_name TEXT NOT NULL, name TEXT NOT NULL, image TEXT, songs_json TEXT NOT NULL, updated_at TEXT NOT NULL, is_public INTEGER NOT NULL DEFAULT 1)')
  ]);
}

function output(row, rank) {
  return { rank: rank || row.rank, name: row.display_name || 'Pendengar MalaMusic', hours: Math.round((Number(row.total_seconds || 0) / 3600) * 10) / 10, streak: Number(row.streak_current || 0), bestStreak: Number(row.streak_best || 0), activeDays: Number(row.active_days || 0) };
}
function authorized(request, env) { return env.INTERNAL_SECRET && request.headers.get('x-malamusic-secret') === env.INTERNAL_SECRET; }

async function rollover(env) {
  await schema(env);
  const rows = await query(env, 'SELECT email, display_name, total_seconds, active_days FROM user_stats');
  for (const row of rows) {
    const days = (await query(env, 'SELECT day FROM user_daily_stats WHERE email = ? ORDER BY day ASC', row.email)).map(x => x.day);
    let current = 0, best = 0, run = 0;
    for (let i = 0; i < days.length; i++) {
      const previous = i ? new Date(`${days[i - 1]}T12:00:00+08:00`) : null;
      const currentDate = new Date(`${days[i]}T12:00:00+08:00`);
      if (previous && Math.round((currentDate - previous) / 86400000) === 1) run += 1; else run = 1;
      best = Math.max(best, run);
    }
    const last = days[days.length - 1] || null;
    const today = DAY();
    const daysSinceLast = last ? Math.round((new Date(`${today}T12:00:00+08:00`) - new Date(`${last}T12:00:00+08:00`)) / 86400000) : 999;
    current = daysSinceLast <= 1 ? run : 0;
    await env.DB.prepare('UPDATE user_stats SET streak_current = ?, streak_best = ?, active_days = ?, last_active = ?, updated_at = ? WHERE email = ?').bind(current, best, days.length, last, new Date().toISOString(), row.email).run();
  }
  await env.DB.prepare('DELETE FROM leaderboard_snapshot WHERE snapshot_day = ?').bind(DAY()).run();
  const leaders = await query(env, 'SELECT display_name, total_seconds, streak_current, streak_best, active_days FROM user_stats ORDER BY streak_current DESC, total_seconds DESC LIMIT 50');
  for (let i = 0; i < leaders.length; i++) {
    const r = leaders[i];
    await env.DB.prepare('INSERT INTO leaderboard_snapshot (rank, display_name, total_seconds, streak_current, streak_best, active_days, snapshot_day) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(i + 1, r.display_name, r.total_seconds, r.streak_current, r.streak_best, r.active_days, DAY()).run();
  }
  return { status: true, snapshotDay: DAY(), count: leaders.length };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    await schema(env);
    if (url.pathname === '/leaderboard') {
      const rows = await query(env, 'SELECT rank, display_name, total_seconds, streak_current, streak_best, active_days FROM leaderboard_snapshot WHERE snapshot_day = (SELECT MAX(snapshot_day) FROM leaderboard_snapshot) ORDER BY rank ASC LIMIT 50');
      return Response.json({ status: true, updatedAt: rows[0]?.snapshot_day || null, leaderboard: rows.map(r => output(r)) });
    }
    if (!authorized(request, env)) return Response.json({ status: false, message: 'Unauthorized' }, { status: 401 });
    if (url.pathname === '/me' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const rows = await query(env, 'SELECT display_name, total_seconds, streak_current, streak_best, active_days, last_active FROM user_stats WHERE email = ? LIMIT 1', [body.email]);
      const row = rows[0];
      return Response.json({ status: true, authenticated: true, stats: row ? output(row) : { hours: 0, streak: 0, bestStreak: 0, activeDays: 0 } });
    }
    if (url.pathname === '/rollover') return Response.json(await rollover(env));
    if (url.pathname === '/listen' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const seconds = Math.max(1, Math.min(120, Math.round(Number(body.seconds || 0))));
      if (!body.email || !seconds) return Response.json({ status: false, message: 'Data tidak valid.' }, { status: 400 });
      const day = DAY(), name = String(body.name || body.email.split('@')[0]).replace(/[^\p{L}\p{N} ._-]/gu, '').slice(0, 60) || 'Pendengar';
      await env.DB.prepare('INSERT INTO user_daily_stats (email, display_name, day, seconds) VALUES (?, ?, ?, ?) ON CONFLICT(email, day) DO UPDATE SET seconds = seconds + excluded.seconds, display_name = excluded.display_name').bind(body.email, name, day, seconds).run();
      await env.DB.prepare('INSERT INTO user_stats (email, display_name, total_seconds, active_days, last_active, updated_at) VALUES (?, ?, ?, 1, ?, ?) ON CONFLICT(email) DO UPDATE SET display_name = excluded.display_name, total_seconds = user_stats.total_seconds + excluded.total_seconds, active_days = (SELECT COUNT(DISTINCT day) FROM user_daily_stats WHERE email = excluded.email), last_active = excluded.last_active, updated_at = excluded.updated_at').bind(body.email, name, seconds, day, new Date().toISOString()).run();
      return Response.json({ status: true, recordedSeconds: seconds });
    }
    if (url.pathname === '/playlist' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const id = String(body.id || crypto.randomUUID());
      await env.DB.prepare('INSERT OR REPLACE INTO public_playlists (id, owner_email, owner_name, name, image, songs_json, updated_at, is_public) VALUES (?, ?, ?, ?, ?, ?, ?, 1)').bind(id, body.email, body.ownerName || 'Pendengar', body.name || 'Playlist MalaMusic', body.image || '', JSON.stringify(body.songs || []).slice(0, 500000), new Date().toISOString()).run();
      return Response.json({ status: true, id });
    }
    if (url.pathname.startsWith('/playlist/')) {
      const id = url.pathname.split('/').pop();
      const rows = await query(env, 'SELECT id, owner_name, name, image, songs_json, updated_at FROM public_playlists WHERE id = ? AND is_public = 1 LIMIT 1', id);
      if (!rows[0]) return Response.json({ status: false, message: 'Playlist tidak ditemukan.' }, { status: 404 });
      return Response.json({ status: true, playlist: { ...rows[0], songs: JSON.parse(rows[0].songs_json || '[]') } });
    }
    return Response.json({ status: false, message: 'Not found' }, { status: 404 });
  },
  async scheduled(controller, env) { if (controller.cron === '0 16 * * *') await rollover(env); }
};
