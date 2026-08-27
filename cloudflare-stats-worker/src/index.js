const DAY = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Makassar' }).format(new Date());
function streakFromDates(values) {
  const dates = Array.from(new Set(Array.isArray(values) ? values.map(String).filter(day => /^\d{4}-\d{2}-\d{2}$/.test(day)) : [])).sort();
  if (!dates.length) return { current: 0, best: 0, activeDays: 0, lastActive: null };
  const atNoon = day => new Date(`${day}T12:00:00+08:00`);
  let best = 1, run = 1;
  for (let i = 1; i < dates.length; i++) {
    if (Math.round((atNoon(dates[i]) - atNoon(dates[i - 1])) / 86400000) === 1) run += 1;
    else run = 1;
    best = Math.max(best, run);
  }
  const lastActive = dates[dates.length - 1];
  const daysSinceLast = Math.round((atNoon(DAY()) - atNoon(lastActive)) / 86400000);
  let current = 0;
  if (daysSinceLast <= 1) {
    current = 1;
    for (let i = dates.length - 1; i > 0; i--) {
      if (Math.round((atNoon(dates[i]) - atNoon(dates[i - 1])) / 86400000) === 1) current += 1;
      else break;
    }
  }
  return { current, best, activeDays: dates.length, lastActive };
}

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
  return { rank: rank || row.rank, name: row.display_name || 'Pendengar MalaMusic', hours: Math.round((Number(row.total_seconds || 0) / 3600) * 10) / 10, totalSeconds: Math.max(0, Number(row.total_seconds || 0)), streak: Number(row.streak_current || 0), bestStreak: Number(row.streak_best || 0), activeDays: Number(row.active_days || 0) };
}
function authorized(request, env) { return env.INTERNAL_SECRET && request.headers.get('x-malamusic-secret') === env.INTERNAL_SECRET; }

async function rollover(env) {
  await schema(env);
  const rows = await query(env, 'SELECT email, display_name, total_seconds, active_days, streak_best FROM user_stats');
  for (const row of rows) {
    const days = (await query(env, 'SELECT day FROM user_daily_stats WHERE email = ? ORDER BY day ASC', row.email)).map(x => x.day);
    let current = 0, best = Number(row.streak_best || 0), run = 0;
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
      let row = rows[0];
      const legacy = streakFromDates(body.legacyDates);
      if (body.email && legacy.activeDays > 0) {
        for (const day of legacy.dates) {
          await env.DB.prepare('INSERT INTO user_daily_stats (email, display_name, day, seconds) VALUES (?, ?, ?, 0) ON CONFLICT(email, day) DO NOTHING').bind(body.email, String(body.name || body.email.split('@')[0]).slice(0, 60), day).run();
        }
      }
      if (body.email && legacy.activeDays > 0 && (!row || legacy.best > Number(row.streak_best || 0) || legacy.activeDays > Number(row.active_days || 0) || legacy.current > Number(row.streak_current || 0))) {
        const merged = {
          display_name: String(body.name || (row && row.display_name) || body.email.split('@')[0]).slice(0, 60),
          total_seconds: Number(row && row.total_seconds || 0),
          streak_current: Math.max(Number(row && row.streak_current || 0), legacy.current),
          streak_best: Math.max(Number(row && row.streak_best || 0), legacy.best),
          active_days: Math.max(Number(row && row.active_days || 0), legacy.activeDays),
          last_active: (row && row.last_active && row.last_active > legacy.lastActive) ? row.last_active : legacy.lastActive,
          updated_at: new Date().toISOString()
        };
        await env.DB.prepare('INSERT INTO user_stats (email, display_name, total_seconds, streak_current, streak_best, active_days, last_active, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(email) DO UPDATE SET display_name = excluded.display_name, streak_current = MAX(user_stats.streak_current, excluded.streak_current), streak_best = MAX(user_stats.streak_best, excluded.streak_best), active_days = MAX(user_stats.active_days, excluded.active_days), last_active = CASE WHEN user_stats.last_active > excluded.last_active THEN user_stats.last_active ELSE excluded.last_active END, updated_at = excluded.updated_at').bind(body.email, merged.display_name, merged.total_seconds, merged.streak_current, merged.streak_best, merged.active_days, merged.last_active, merged.updated_at).run();
        row = merged;
      }
      return Response.json({ status: true, authenticated: true, stats: row ? output(row) : { hours: 0, streak: 0, bestStreak: 0, activeDays: 0 } });
    }
    if (url.pathname === '/rollover') return Response.json(await rollover(env));
    if (url.pathname === '/listen' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const requestedSeconds = Number(body.seconds);
      if (!body.email || !Number.isFinite(requestedSeconds) || requestedSeconds <= 0) return Response.json({ status: false, message: 'Data tidak valid.' }, { status: 400 });
      const seconds = Math.min(120, Math.floor(requestedSeconds));
      if (seconds < 1) return Response.json({ status: false, message: 'Durasi terlalu kecil.' }, { status: 400 });
      const day = DAY(), name = String(body.name || body.email.split('@')[0]).replace(/[^\p{L}\p{N} ._-]/gu, '').slice(0, 60) || 'Pendengar';
      const priorRows = await query(env, 'SELECT streak_best FROM user_stats WHERE email = ? LIMIT 1', [body.email]);
      const priorBest = Number(priorRows[0]?.streak_best || 0);
      await env.DB.prepare('INSERT INTO user_daily_stats (email, display_name, day, seconds) VALUES (?, ?, ?, ?) ON CONFLICT(email, day) DO UPDATE SET seconds = seconds + excluded.seconds, display_name = excluded.display_name').bind(body.email, name, day, seconds).run();
      const updatedAt = new Date().toISOString();
      await env.DB.prepare('INSERT INTO user_stats (email, display_name, total_seconds, active_days, last_active, updated_at) VALUES (?, ?, ?, 1, ?, ?) ON CONFLICT(email) DO UPDATE SET display_name = excluded.display_name, total_seconds = user_stats.total_seconds + excluded.total_seconds, active_days = (SELECT COUNT(DISTINCT day) FROM user_daily_stats WHERE email = excluded.email), last_active = excluded.last_active, updated_at = excluded.updated_at').bind(body.email, name, seconds, day, updatedAt).run();

      // Recompute streak immediately so /me is consistent across devices without waiting for cron rollover.
      const days = (await query(env, 'SELECT day FROM user_daily_stats WHERE email = ? ORDER BY day ASC', body.email)).map(row => row.day);
      let best = priorBest, run = 0;
      for (let i = 0; i < days.length; i++) {
        const previous = i ? new Date(`${days[i - 1]}T12:00:00+08:00`) : null;
        const currentDate = new Date(`${days[i]}T12:00:00+08:00`);
        if (previous && Math.round((currentDate - previous) / 86400000) === 1) run += 1; else run = 1;
        best = Math.max(best, run);
      }
      const last = days[days.length - 1] || null;
      const daysSinceLast = last ? Math.round((new Date(`${day}T12:00:00+08:00`) - new Date(`${last}T12:00:00+08:00`)) / 86400000) : 999;
      const current = daysSinceLast <= 1 ? run : 0;
      await env.DB.prepare('UPDATE user_stats SET streak_current = ?, streak_best = ?, active_days = ?, last_active = ?, updated_at = ? WHERE email = ?').bind(current, best, days.length, last, updatedAt, body.email).run();
      return Response.json({ status: true, recordedSeconds: seconds, stats: { streak: current, bestStreak: best, activeDays: days.length } });
    }
    if (url.pathname === '/playlist-settings' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const isPublic = Boolean(body.isPublic);
      await env.DB.prepare('UPDATE public_playlists SET is_public = ?, updated_at = ? WHERE id = ? AND owner_email = ?').bind(isPublic ? 1 : 0, new Date().toISOString(), body.id, body.email).run();
      return Response.json({ status: true, isPublic });
    }
    if (url.pathname === '/playlist' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const id = String(body.id || crypto.randomUUID());
      await env.DB.prepare('INSERT OR REPLACE INTO public_playlists (id, owner_email, owner_name, name, image, songs_json, updated_at, is_public) VALUES (?, ?, ?, ?, ?, ?, ?, 1)').bind(id, body.email, body.ownerName || 'Pendengar', body.name || 'Playlist MalaMusic', body.image || '', JSON.stringify(body.songs || []).slice(0, 500000), new Date().toISOString(), body.isPublic === false ? 0 : 1).run();
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
