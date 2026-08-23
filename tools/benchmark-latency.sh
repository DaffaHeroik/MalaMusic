#!/usr/bin/env bash
set -u
BASE="https://music.malawalipayment.web.id"
VID="5F28ye50-Kc"
YT="https://music.youtube.com/watch?v=${VID}"
FMT='http=%{http_code} total=%{time_total}s ttfb=%{time_starttransfer}s size=%{size_download}'
printf '%s\n' '=== page ==='
curl -L -sS -o /dev/null -w "page_${FMT}\n" "${BASE}/play/${VID}"
printf '%s\n' '=== resolver ==='
curl -sS --max-time 45 -o /tmp/malamusic-ytplay.json -w "resolver_${FMT}\n" -X POST "${BASE}/api/ytplay" -H 'content-type: application/json' --data "{\"query\":\"${YT}\"}"
python3 - <<'PY'
import json
try:
 d=json.load(open('/tmp/malamusic-ytplay.json'))
 r=d.get('result') or {}
 print('resolver_status=',d.get('status'),'has_audio=',bool((r.get('download') or {}).get('audio')))
except Exception as e:
 print('resolver_parse_error=',e)
PY
printf '%s\n' '=== search ==='
curl -sS --max-time 20 -o /dev/null -w "search_${FMT}\n" "${BASE}/api/search?query=Teh%20Hijau"
URL=$(python3 - <<'PY'
import json
try:
 d=json.load(open('/tmp/malamusic-ytplay.json'))
 print(((d.get('result') or {}).get('download') or {}).get('audio') or '')
except Exception:
 print('')
PY
)
if [ -n "${URL}" ]; then
 ENCODED_URL=$(python3 -c 'import sys,urllib.parse; print(urllib.parse.quote(sys.argv[1], safe=""))' "${URL}")
 printf '%s\n' '=== proxy range ==='
 curl -sS --max-time 30 -o /dev/null -w "proxy_${FMT} type=%{content_type}\n" -H 'Range: bytes=0-1023' "${BASE}/api/proxy-audio?url=${ENCODED_URL}"
else
 printf '%s\n' 'proxy_skipped=no_audio_url'
fi
