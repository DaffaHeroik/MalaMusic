import json
import time
import requests

BASE = 'https://music.malawalipayment.web.id'
checks = [
    ('GET', '/api/search', {'query': 'Pamungkas'}),
    ('GET', '/api/suggest', {'query': 'Pamungkas'}),
    ('GET', '/api/album', {'id': 'VLPL0JVhTFW0NghCh3DcCuxIP4H0N8X7h-TP'}),
    ('GET', '/api/artist', {'id': 'UCQ5kM9a7jYw'}),
    ('GET', '/api/lyrics', {'id': 'MUZxZVcZAVA'}),
    ('GET', '/api/profile', {}),
    ('GET', '/api/library', {}),
    ('GET', '/api/streak', {}),
    ('GET', '/api/stats', {}),
    ('GET', '/api/listen-together', {}),
    ('GET', '/api/health', {}),
]
for method, path, params in checks:
    started = time.perf_counter()
    try:
        r = requests.request(method, BASE + path, params=params, timeout=25, headers={'Accept':'application/json'})
        elapsed = round((time.perf_counter()-started)*1000)
        ctype = r.headers.get('content-type','')
        text = r.text.replace('\n',' ')[:220]
        print(json.dumps({'path':path,'status':r.status_code,'ms':elapsed,'content_type':ctype,'body':text}, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({'path':path,'error':str(e)}, ensure_ascii=False))
