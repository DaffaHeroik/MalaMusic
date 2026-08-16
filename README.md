# MalaMusic

A web music player backed by YouTube Music search/streaming, packaged for
one-click deployment on **Netlify**.

## Project structure

```
public/                    -> static site (Netlify "publish" directory)
api/                        -> original handler logic (req, res) — shared source
netlify/functions/          -> thin Netlify Function wrappers around api/*.js (JSON endpoints)
netlify/edge-functions/     -> Edge Function for audio streaming
netlify.toml                -> Netlify build & routing configuration
server.js                   -> plain Express server, used only for local dev (npm run dev)
```

No build step is required — the site is plain HTML/CSS/JS. On Netlify the
backend runs entirely as Netlify Functions / Edge Functions; locally it runs
through `server.js` (or `netlify dev`, which matches production behavior).

## Deploy to Netlify

### Option A — Netlify CLI
```bash
npm install -g netlify-cli
netlify deploy --prod
```

### Option B — Git integration
1. Push this repository to GitHub/GitLab/Bitbucket.
2. In Netlify: **Add new site → Import an existing project**.
3. Build settings are already defined in `netlify.toml` (publish = `public`,
   functions = `netlify/functions`) — no changes needed.
4. Deploy.

### Option C — Drag & drop
Zip the whole project folder (including `netlify.toml`, `netlify/`, `api/`
and `public/`) and drag it onto the Netlify dashboard deploy area.

No environment variables are required.

## API routes

| Route                | Backend                                                           |
|-----------------------|-------------------------------------------------------------------|
| `/api/search`         | Netlify Function (`netlify/functions/search.js`)                 |
| `/api/lyrics`         | Netlify Function                                                  |
| `/api/artist`         | Netlify Function                                                  |
| `/api/album`          | Netlify Function                                                  |
| `/api/suggest`        | Netlify Function                                                  |
| `/api/ytplay`         | Netlify Function                                                  |
| `/api/transcribe`     | Netlify Function (also used internally by `/api/lyrics`)         |
| `/api/proxy-audio`    | **Edge Function** (streams audio bytes, with Range/206 support)  |

`proxy-audio` runs as an Edge Function instead of a regular Function:
regular (Lambda-based) functions buffer the whole response in memory with a
small payload limit, which breaks long-track playback / seeking. Favicon is
static — `/logo.png` on every page, including `/play/:videoId`.

## Local development
```bash
npm run dev        # plain Express server, matches api/*.js exactly
# or
npx netlify dev    # runs the static site + Functions + Edge Functions locally
```

## Google OAuth dan lagu yang disukai

MalaMusic menyediakan handler OAuth server-side di `/api/google-auth`. Setelah pengguna login dengan Google dan memberikan izin YouTube readonly, endpoint `GET /api/google-auth?action=liked` mengambil video yang diberi Like melalui YouTube Data API v3. Implementasi ini menggunakan cookie sesi terenkripsi; token Google tidak dikirim ke frontend.

Sebelum menjalankan fitur ini, aktifkan **YouTube Data API v3** di Google Cloud Console dan buat OAuth Client tipe **Web application**. Konfigurasikan environment variable berdasarkan `.env.example`:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `SESSION_SECRET`
- `GOOGLE_REDIRECT_URI`
- `GOOGLE_APP_ORIGIN`

Redirect URI harus sama persis dengan URL yang didaftarkan di Google Cloud Console. Untuk lokal, gunakan `http://localhost:3000/api/google-auth?action=callback`. Untuk hosting, gunakan domain hosting sementara yang aktif.

MalaMusic memakai API resmi YouTube untuk mengambil video yang diberi Like. YouTube Music tidak menyediakan endpoint publik terpisah untuk playlist lagu yang disukai, sehingga hasil sinkronisasi berupa item video YouTube yang terkait dengan rating Like akun pengguna.
